/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSlidingWindow, FirestoreRateLimiter } from '../../server/rateLimit.mjs';
import { SlidingWindowRateLimiter } from '../../server/geminiValidation.mjs';

test('evaluateSlidingWindow allows up to the cap, then blocks until the oldest hit expires', () => {
  const windowMs = 60_000;
  let hits: number[] = [];
  for (let i = 0; i < 3; i++) {
    const r = evaluateSlidingWindow(hits, 1_000 + i, 3, windowMs);
    assert.equal(r.allowed, true);
    hits = r.hits;
  }
  const blocked = evaluateSlidingWindow(hits, 2_000, 3, windowMs);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 59);

  // Once the first hit (t=1000) is older than the window, one slot frees up
  const later = evaluateSlidingWindow(hits, 61_000, 3, windowMs);
  assert.equal(later.allowed, true);
  assert.equal(later.hits.length, 3);
});

test('evaluateSlidingWindow ignores corrupt stored values', () => {
  const r = evaluateSlidingWindow(['x', null, NaN, 5_000], 10_000, 2, 60_000);
  assert.equal(r.allowed, true);
  assert.deepEqual(r.hits, [5_000, 10_000]);
  assert.equal(evaluateSlidingWindow(undefined, 1, 1, 10).allowed, true);
});

/** Minimal in-memory stand-in for the Firestore Admin API used by the limiter. */
function fakeFirestore() {
  const docs = new Map<string, Record<string, unknown>>();
  return {
    docs,
    collection: (name: string) => ({
      doc: (id: string) => ({ path: `${name}/${id}` }),
    }),
    runTransaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
      fn({
        get: async (ref: { path: string }) => ({
          exists: docs.has(ref.path),
          data: () => docs.get(ref.path),
        }),
        set: (ref: { path: string }, data: Record<string, unknown>) => {
          docs.set(ref.path, data);
        },
      }),
  };
}

test('FirestoreRateLimiter shares one count across limiter instances (like separate serverless instances)', async () => {
  const db = fakeFirestore();
  const make = () =>
    new FirestoreRateLimiter({
      getFirestore: () => db,
      fallback: new SlidingWindowRateLimiter(2, 60_000),
      maxRequests: 2,
      windowMs: 60_000,
    });
  const instanceA = make();
  const instanceB = make();

  assert.equal((await instanceA.check('user-1', 1_000)).allowed, true);
  assert.equal((await instanceB.check('user-1', 2_000)).allowed, true);
  // A third request on either instance is blocked because the count is shared
  assert.equal((await instanceA.check('user-1', 3_000)).allowed, false);
  // Other users are unaffected
  assert.equal((await instanceB.check('user-2', 3_000)).allowed, true);
  assert.deepEqual(db.docs.get('rate_limits/user-1')?.hits, [1_000, 2_000]);
});

test('FirestoreRateLimiter falls back to the in-memory limiter when Firestore fails', async () => {
  const errors: unknown[] = [];
  const limiter = new FirestoreRateLimiter({
    getFirestore: () => {
      throw new Error('no credentials');
    },
    fallback: new SlidingWindowRateLimiter(1, 60_000),
    maxRequests: 1,
    windowMs: 60_000,
    onError: (err) => errors.push(err),
  });

  assert.equal((await limiter.check('user-1', 1_000)).allowed, true);
  assert.equal((await limiter.check('user-1', 2_000)).allowed, false);
  assert.equal(errors.length, 2);
});
