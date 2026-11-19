/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExchangeRates } from '../types/finance';
import { DEFAULT_EXCHANGE_RATES } from './currencies';
import { getStorageJSON, setStorageJSON } from './storage';

export const EXCHANGE_RATES_STORAGE_KEY = 'stash_exchange_rates_v1';
export const EXCHANGE_RATES_TTL_MS = 24 * 60 * 60 * 1000;

export interface CachedExchangeRates {
  rates: ExchangeRates;
  updatedAt: string;
  source: 'live' | 'default';
}

function isValidPositiveRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function parseOpenErApiResponse(payload: unknown): ExchangeRates | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as { result?: unknown; rates?: Record<string, unknown> };
  if (obj.result !== 'success' || !obj.rates || typeof obj.rates !== 'object') {
    return null;
  }
  const eur = obj.rates.EUR;
  const krw = obj.rates.KRW;
  const pkr = obj.rates.PKR;
  if (!isValidPositiveRate(eur) || !isValidPositiveRate(krw) || !isValidPositiveRate(pkr)) {
    return null;
  }
  return {
    USD: 1,
    EUR: Number(eur.toFixed(6)),
    KRW: Number(krw.toFixed(4)),
    PKR: Number(pkr.toFixed(4)),
  };
}

export function parseFrankfurterResponse(payload: unknown): ExchangeRates | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as { rates?: Record<string, unknown> };
  if (!obj.rates || typeof obj.rates !== 'object') return null;
  const eur = obj.rates.EUR;
  const krw = obj.rates.KRW;
  const pkr = obj.rates.PKR;
  if (!isValidPositiveRate(eur) || !isValidPositiveRate(krw)) {
    return null;
  }
  return {
    USD: 1,
    EUR: Number(eur.toFixed(6)),
    KRW: Number(krw.toFixed(4)),
    PKR: isValidPositiveRate(pkr) ? Number(pkr.toFixed(4)) : DEFAULT_EXCHANGE_RATES.PKR,
  };
}

export function loadCachedExchangeRates(
  nowMs: number = Date.now()
): { cached: CachedExchangeRates | null; isStale: boolean } {
  const stored = getStorageJSON<CachedExchangeRates | null>(EXCHANGE_RATES_STORAGE_KEY, null);
  if (
    !stored ||
    !stored.rates ||
    !isValidPositiveRate(stored.rates.USD) ||
    !isValidPositiveRate(stored.rates.EUR) ||
    !isValidPositiveRate(stored.rates.KRW) ||
    !isValidPositiveRate(stored.rates.PKR) ||
    typeof stored.updatedAt !== 'string'
  ) {
    return { cached: null, isStale: true };
  }

  const updatedMs = Date.parse(stored.updatedAt);
  const isStale = !Number.isFinite(updatedMs) || nowMs - updatedMs >= EXCHANGE_RATES_TTL_MS;
  return { cached: stored, isStale };
}

export function saveCachedExchangeRates(entry: CachedExchangeRates): void {
  setStorageJSON(EXCHANGE_RATES_STORAGE_KEY, entry);
}

export async function fetchDailyExchangeRates(
  fetchImpl: typeof fetch = fetch,
  force = false
): Promise<CachedExchangeRates> {
  const { cached, isStale } = loadCachedExchangeRates();
  if (!force && cached && !isStale) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetchImpl('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = parseOpenErApiResponse(json);
        if (parsed) {
          const entry: CachedExchangeRates = {
            rates: parsed,
            updatedAt: new Date().toISOString(),
            source: 'live',
          };
          saveCachedExchangeRates(entry);
          return entry;
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // try secondary provider
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetchImpl('https://api.frankfurter.app/latest?from=USD&to=EUR,KRW', {
        signal: controller.signal,
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = parseFrankfurterResponse(json);
        if (parsed) {
          const entry: CachedExchangeRates = {
            rates: parsed,
            updatedAt: new Date().toISOString(),
            source: 'live',
          };
          saveCachedExchangeRates(entry);
          return entry;
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // offline fallback below
  }

  if (cached) {
    return cached;
  }

  return {
    rates: DEFAULT_EXCHANGE_RATES,
    updatedAt: '',
    source: 'default',
  };
}
