/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseOpenErApiResponse,
  parseFrankfurterResponse,
  fetchDailyExchangeRates,
  EXCHANGE_RATES_STORAGE_KEY,
} from './exchangeRates';
import { DEFAULT_EXCHANGE_RATES } from './currencies';

test('parseOpenErApiResponse extracts valid KRW, EUR, PKR rates and rejects malformed data', () => {
  const valid = parseOpenErApiResponse({
    result: 'success',
    rates: { USD: 1, EUR: 0.91, KRW: 1395.5, PKR: 279.1 },
  });
  assert.deepEqual(valid, { USD: 1, EUR: 0.91, KRW: 1395.5, PKR: 279.1 });

  assert.equal(parseOpenErApiResponse({ result: 'error', rates: {} }), null);
  assert.equal(
    parseOpenErApiResponse({ result: 'success', rates: { EUR: -1, KRW: 1390, PKR: 278 } }),
    null
  );
});

test('parseFrankfurterResponse falls back to default PKR when omitted', () => {
  const parsed = parseFrankfurterResponse({
    rates: { EUR: 0.93, KRW: 1410 },
  });
  assert.deepEqual(parsed, {
    USD: 1,
    EUR: 0.93,
    KRW: 1410,
    PKR: DEFAULT_EXCHANGE_RATES.PKR,
  });
});

test('fetchDailyExchangeRates falls back cleanly to DEFAULT_EXCHANGE_RATES when offline', async () => {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
    configurable: true,
  });

  const failingFetch = (async () => {
    throw new Error('Network offline');
  }) as unknown as typeof fetch;

  const res = await fetchDailyExchangeRates(failingFetch, true);
  assert.equal(res.source, 'default');
  assert.deepEqual(res.rates, DEFAULT_EXCHANGE_RATES);
  assert.equal(store.get(EXCHANGE_RATES_STORAGE_KEY), undefined);
});

test('fetchDailyExchangeRates caches live rates for 24h and skips redundant network calls', async () => {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
    configurable: true,
  });

  let callCount = 0;
  const mockFetch = (async () => {
    callCount += 1;
    return {
      ok: true,
      json: async () => ({
        result: 'success',
        rates: { USD: 1, EUR: 0.92, KRW: 1402, PKR: 280 },
      }),
    } as Response;
  }) as unknown as typeof fetch;

  const first = await fetchDailyExchangeRates(mockFetch);
  assert.equal(first.source, 'live');
  assert.equal(first.rates.KRW, 1402);
  assert.equal(callCount, 1);

  const second = await fetchDailyExchangeRates(mockFetch);
  assert.equal(second.rates.KRW, 1402);
  assert.equal(callCount, 1);
});
