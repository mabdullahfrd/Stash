/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyGeminiApiError,
  normalizeBankScreenshotOutput,
  normalizeReceiptOutput,
  parseModelJsonResponse,
  SlidingWindowRateLimiter,
  validateBankScreenshotRequest,
  validateScanReceiptRequest,
} from '../../server/geminiValidation.mjs';

const SAMPLE_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test('validateScanReceiptRequest accepts allowed MIME, currency, and today date', () => {
  const result = validateScanReceiptRequest({
    imageBase64: SAMPLE_PNG_DATA_URL,
    targetCurrency: 'KRW',
    today: '2026-11-20',
    merchantHint: 'Emart',
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.mimeType, 'image/png');
    assert.equal(result.value.targetCurrency, 'KRW');
    assert.equal(result.value.today, '2026-11-20');
  }
});

test('validateScanReceiptRequest rejects invalid MIME type, currency, and missing/bad today date', () => {
  const badMime = validateScanReceiptRequest({
    imageBase64: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    targetCurrency: 'KRW',
    today: '2026-11-20',
  });
  assert.equal(badMime.ok, false);
  if (!badMime.ok) assert.equal(badMime.status, 400);

  const badCurrency = validateScanReceiptRequest({
    imageBase64: SAMPLE_PNG_DATA_URL,
    targetCurrency: 'JPY',
    today: '2026-11-20',
  });
  assert.equal(badCurrency.ok, false);
  if (!badCurrency.ok) assert.equal(badCurrency.status, 400);

  const badDate = validateScanReceiptRequest({
    imageBase64: SAMPLE_PNG_DATA_URL,
    targetCurrency: 'KRW',
    today: '2026-02-30',
  });
  assert.equal(badDate.ok, false);
  if (!badDate.ok) assert.equal(badDate.status, 400);
});

test('validateBankScreenshotRequest enforces bankHint allowlist and 6MB size cap', () => {
  const badHint = validateBankScreenshotRequest({
    imageBase64: SAMPLE_PNG_DATA_URL,
    targetCurrency: 'KRW',
    bankHint: 'unknown_bank',
    today: '2026-11-20',
  });
  assert.equal(badHint.ok, false);
  if (!badHint.ok) assert.equal(badHint.status, 400);

  const oversized = validateBankScreenshotRequest({
    imageBase64: `data:image/jpeg;base64,${'A'.repeat(6 * 1024 * 1024 + 100)}`,
    targetCurrency: 'KRW',
    bankHint: 'toss',
    today: '2026-11-20',
  });
  assert.equal(oversized.ok, false);
  if (!oversized.ok) assert.equal(oversized.status, 413);
});

test('normalizeReceiptOutput enforces non-negative finite prices, category allowlist, and valid date fallback', () => {
  const normalized = normalizeReceiptOutput(
    {
      merchant: 'CU Store',
      totalAmount: -50,
      currency: 'XYZ',
      date: 'invalid-date',
      items: [
        { name: 'Latte', price: 4500, category: 'Coffee & Drinks' },
        { name: 'Unknown Gadget', price: 12000, category: 'Made Up Category' },
        { name: 'Broken Negative', price: -100, category: 'Coffee & Drinks' },
        { name: 'Broken NaN', price: Number.NaN, category: 'Coffee & Drinks' },
      ],
    },
    '2026-11-20',
    'KRW'
  );

  assert.ok(normalized);
  assert.equal(normalized.currency, 'KRW');
  assert.equal(normalized.date, '2026-11-20');
  assert.equal(normalized.items.length, 2);
  assert.equal(normalized.items[0].category, 'Coffee & Drinks');
  assert.equal(normalized.items[1].category, 'Uncategorized');
  assert.equal(normalized.totalAmount, 16500);

  const splitNormalized = normalizeReceiptOutput(
    {
      merchant: 'Dessert Shop',
      totalAmount: 19000,
      currency: 'KRW',
      date: '2026-11-20',
      items: [
        { name: 'Haagen-Dazs Cup', price: 5000, category: 'Ice Cream' },
        { name: 'Strawberry Macaron', price: 3500, category: 'Treats & Snacks' },
        { name: 'Melona Ice Cream Bar', price: 1500, category: 'Ice Cream & Treats' },
        { name: 'Chocolate Cookie', price: 3000, category: 'Ice Cream & Treats' },
        { name: 'Gym Day Pass', price: 6000, category: 'Fitness & Sports' },
      ],
    },
    '2026-11-20',
    'KRW'
  );
  assert.ok(splitNormalized);
  assert.deepEqual(
    splitNormalized.items.map((it) => it.category),
    ['Ice Cream', 'Treats & Snacks', 'Ice Cream', 'Treats & Snacks', 'Fitness & Sports']
  );
});

test('normalizeBankScreenshotOutput validates entries and falls back unknown categories to Uncategorized', () => {
  const normalized = normalizeBankScreenshotOutput(
    {
      bankName: 'Toss Bank',
      bankHint: 'toss',
      currency: 'KRW',
      entries: [
        { merchant: 'Mega Coffee', amount: 4500, type: 'expense', date: '2026-11-19', category: 'Coffee & Drinks' },
        { merchant: 'Mystery Store', amount: 15000, type: 'expense', date: 'bad-date', category: 'Random' },
        { merchant: 'Upwork Freelance', amount: 250000, type: 'income', date: '2026-11-19', category: 'Freelance & Side Gig' },
        { merchant: 'Merit Grant', amount: 500000, type: 'income', date: '2026-11-19', category: 'Scholarship & Grants' },
        { merchant: 'Refund', amount: -200, type: 'income', date: '2026-11-19', category: 'Allowance & Inflow' },
      ],
    },
    '2026-11-20',
    'KRW'
  );

  assert.ok(normalized);
  assert.equal(normalized.entries.length, 4);
  assert.equal(normalized.entries[1].category, 'Uncategorized');
  assert.equal(normalized.entries[1].date, '2026-11-20');
  assert.equal(normalized.entries[2].category, 'Freelance & Side Gig');
  assert.equal(normalized.entries[3].category, 'Scholarship & Grants');
});

test('SlidingWindowRateLimiter caps per-user requests within window and recovers after expiry', () => {
  const limiter = new SlidingWindowRateLimiter(3, 60_000);
  const t0 = 1_000_000;

  assert.equal(limiter.check('user-1', t0).allowed, true);
  assert.equal(limiter.check('user-1', t0 + 1000).allowed, true);
  assert.equal(limiter.check('user-1', t0 + 2000).allowed, true);
  const blocked = limiter.check('user-1', t0 + 3000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);

  // Different user has independent quota
  assert.equal(limiter.check('user-2', t0 + 3000).allowed, true);

  // After window elapses, user-1 is allowed again
  assert.equal(limiter.check('user-1', t0 + 61_000).allowed, true);
});

test('parseModelJsonResponse strips optional markdown code fences before JSON.parse', () => {
  const fenced = parseModelJsonResponse('```json\n{"merchant":"Emart","items":[]}\n```');
  assert.equal(fenced.ok, true);
  if (fenced.ok) {
    assert.deepEqual(fenced.data, { merchant: 'Emart', items: [] });
  }

  const invalid = parseModelJsonResponse('not json at all');
  assert.equal(invalid.ok, false);
});

test('classifyGeminiApiError maps quota and key errors to friendly status codes without leaking raw details', () => {
  const quota = classifyGeminiApiError({ status: 429, message: 'RESOURCE_EXHAUSTED raw secret' }, 'Receipt');
  assert.equal(quota.status, 429);
  assert.equal(quota.message.includes('raw secret'), false);

  const keyErr = classifyGeminiApiError({ status: 403, message: 'API_KEY_INVALID xyz' }, 'Screenshot');
  assert.equal(keyErr.status, 503);
  assert.equal(keyErr.message.includes('xyz'), false);
});
