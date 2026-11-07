/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrencyCode, ExchangeRates } from '../types/finance';

// Base: 1 USD
export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1.0,
  EUR: 0.92,
  KRW: 1380.0,
  PKR: 278.5,
};

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nativeName: string;
  decimals: number;
}

export const CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyMeta> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    nativeName: 'United States Dollar',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    nativeName: 'Euro',
    decimals: 2,
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    nativeName: '대한민국 원',
    decimals: 0,
  },
  PKR: {
    code: 'PKR',
    symbol: '₨',
    name: 'Pakistani Rupee',
    nativeName: 'پاکستانی روپیہ',
    decimals: 0,
  },
};

/**
 * Converts an amount from one currency to another using the exchange rates table
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): number {
  if (from === to || amount === 0) return amount;
  
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  
  // Convert amount to USD base, then to target currency
  const inUSD = amount / fromRate;
  const target = inUSD * toRate;
  
  const decimals = CURRENCY_REGISTRY[to]?.decimals ?? 2;
  return decimals === 0 ? Math.round(target) : Number(target.toFixed(decimals));
}

/**
 * Formats a currency amount with the proper symbol, thousands grouping, and decimals
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  options: { showSymbol?: boolean; showSign?: boolean } = {}
): string {
  const { showSymbol = true, showSign = false } = options;
  const meta = CURRENCY_REGISTRY[currency] || CURRENCY_REGISTRY.USD;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(absAmount);

  const sign = isNegative ? '-' : showSign && amount > 0 ? '+' : '';
  const symbol = showSymbol ? meta.symbol : '';

  return `${sign}${symbol}${formattedNumber}`;
}
