/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @typedef {{ allowed: boolean; remaining: number; retryAfterSeconds: number }} RateCheckResult
 */

/**
 * Pure sliding-window decision: given previous hit timestamps, decide whether a new
 * request at `nowMs` is allowed and return the hit list to store afterwards.
 *
 * @param {unknown} previousHits
 * @param {number} nowMs
 * @param {number} maxRequests
 * @param {number} windowMs
 * @returns {RateCheckResult & { hits: number[] }}
 */
export function evaluateSlidingWindow(previousHits, nowMs, maxRequests, windowMs) {
  const cutoff = nowMs - windowMs;
  const hits = (Array.isArray(previousHits) ? previousHits : [])
    .filter((ts) => typeof ts === 'number' && Number.isFinite(ts) && ts > cutoff && ts <= nowMs)
    .sort((a, b) => a - b);

  if (hits.length >= maxRequests) {
    const oldest = hits[hits.length - maxRequests] ?? nowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds, hits };
  }

  hits.push(nowMs);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - hits.length),
    retryAfterSeconds: 0,
    hits,
  };
}

/**
 * Per-user rate limiter whose counts live in Firestore, so the limit holds across
 * every serverless instance (an in-memory Map only sees requests that land on the
 * same warm instance, and is wiped on every cold start).
 *
 * Each user has one small document `{collection}/{uid}` holding recent hit timestamps,
 * updated inside a transaction so concurrent requests can't both slip under the cap.
 * Clients cannot read or write it: firestore.rules deny everything outside /users,
 * and the Admin SDK used here bypasses rules.
 *
 * If Firestore is unreachable (e.g. local dev without credentials), it falls back to
 * the provided in-memory limiter instead of failing open.
 */
export class FirestoreRateLimiter {
  /**
   * @param {{
   *   getFirestore: () => any;
   *   fallback: { check(key: string, nowMs?: number): RateCheckResult };
   *   collection?: string;
   *   maxRequests?: number;
   *   windowMs?: number;
   *   onError?: (err: unknown) => void;
   * }} options
   */
  constructor(options) {
    this.getFirestore = options.getFirestore;
    this.fallback = options.fallback;
    this.collection = options.collection ?? 'rate_limits';
    this.maxRequests = options.maxRequests ?? 20;
    this.windowMs = options.windowMs ?? 60 * 60 * 1000;
    this.onError = options.onError ?? ((err) => console.error('Rate limit store unavailable, using in-memory fallback:', err));
  }

  /**
   * @param {string} key
   * @param {number} [nowMs]
   * @returns {Promise<RateCheckResult>}
   */
  async check(key, nowMs = Date.now()) {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.collection).doc(key);
      return await db.runTransaction(async (/** @type {any} */ tx) => {
        const snap = await tx.get(ref);
        const previous = snap.exists ? snap.data()?.hits : [];
        const result = evaluateSlidingWindow(previous, nowMs, this.maxRequests, this.windowMs);
        if (result.allowed) {
          tx.set(ref, { hits: result.hits, updatedAt: new Date(nowMs).toISOString() });
        }
        const { hits: _hits, ...decision } = result;
        return decision;
      });
    } catch (err) {
      this.onError(err);
      return this.fallback.check(key, nowMs);
    }
  }
}
