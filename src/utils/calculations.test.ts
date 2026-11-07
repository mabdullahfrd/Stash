/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAccountBalances,
  computeNetWorth,
  computeCashFlow,
  computeCharityStats,
} from './calculations';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from './currencies';
import { Account, CharityPledge, Transaction } from '../types/finance';

test('Currency conversion calculations across USD, EUR, KRW, and PKR', () => {
  // USD to EUR
  const usdToEur = convertCurrency(100, 'USD', 'EUR', DEFAULT_EXCHANGE_RATES);
  assert.equal(usdToEur, 92);

  // USD to KRW (no decimals)
  const usdToKrw = convertCurrency(10, 'USD', 'KRW', DEFAULT_EXCHANGE_RATES);
  assert.equal(usdToKrw, 13800);

  // USD to PKR
  const usdToPkr = convertCurrency(10, 'USD', 'PKR', DEFAULT_EXCHANGE_RATES);
  assert.equal(usdToPkr, 2785);

  // KRW to USD
  const krwToUsd = convertCurrency(13800, 'KRW', 'USD', DEFAULT_EXCHANGE_RATES);
  assert.equal(krwToUsd, 10);

  // KRW whole number precision check
  const krwAmount = convertCurrency(15.5, 'USD', 'KRW', DEFAULT_EXCHANGE_RATES);
  assert.equal(Number.isInteger(krwAmount), true);
  assert.equal(krwAmount, Math.round(15.5 * 1380));
});

test('Account balance calculations: Income, Expenses, and Transfers', () => {
  const accounts: Account[] = [
    {
      id: 'acc-checking',
      name: 'Main Checking',
      type: 'checking',
      currency: 'USD',
      balance: 1000,
      institution: 'Chase',
      color: '#007AFF',
      icon: 'Building2',
    },
    {
      id: 'acc-savings',
      name: 'Emergency Savings',
      type: 'savings',
      currency: 'USD',
      balance: 5000,
      institution: 'Ally',
      color: '#34C759',
      icon: 'PiggyBank',
    },
    {
      id: 'acc-credit',
      name: 'Credit Card',
      type: 'credit',
      currency: 'USD',
      balance: 300, // $300 owed
      creditLimit: 2000,
      institution: 'Apple',
      color: '#FF9500',
      icon: 'CreditCard',
    },
  ];

  const transactions: Transaction[] = [
    // Income: +$2,000 to checking
    {
      id: 'tx-1',
      type: 'income',
      amount: 2000,
      currency: 'USD',
      date: '2026-11-01',
      categoryId: 'cat-salary',
      accountId: 'acc-checking',
      createdAt: '2026-11-01T10:00:00Z',
      updatedAt: '2026-11-01T10:00:00Z',
    },
    // Expense: -$150 grocery from checking
    {
      id: 'tx-2',
      type: 'expense',
      amount: 150,
      currency: 'USD',
      date: '2026-11-02',
      categoryId: 'cat-food',
      accountId: 'acc-checking',
      createdAt: '2026-11-02T10:00:00Z',
      updatedAt: '2026-11-02T10:00:00Z',
    },
    // Transfer: $500 from checking to savings
    {
      id: 'tx-3',
      type: 'transfer',
      amount: 500,
      currency: 'USD',
      date: '2026-11-03',
      categoryId: 'cat-transfer',
      accountId: 'acc-checking',
      toAccountId: 'acc-savings',
      createdAt: '2026-11-03T10:00:00Z',
      updatedAt: '2026-11-03T10:00:00Z',
    },
    // Expense on credit card: $100 spent (increases liability)
    {
      id: 'tx-4',
      type: 'expense',
      amount: 100,
      currency: 'USD',
      date: '2026-11-04',
      categoryId: 'cat-shopping',
      accountId: 'acc-credit',
      createdAt: '2026-11-04T10:00:00Z',
      updatedAt: '2026-11-04T10:00:00Z',
    },
    // Repayment: $200 from checking to credit card (reduces liability)
    {
      id: 'tx-5',
      type: 'transfer',
      amount: 200,
      currency: 'USD',
      date: '2026-11-04',
      categoryId: 'cat-transfer',
      accountId: 'acc-checking',
      toAccountId: 'acc-credit',
      createdAt: '2026-11-04T12:00:00Z',
      updatedAt: '2026-11-04T12:00:00Z',
    },
  ];

  const balances = computeAccountBalances(accounts, transactions);

  // Checking: 1000 + 2000 (income) - 150 (expense) - 500 (savings transfer) - 200 (credit card payment) = 2150
  assert.equal(balances['acc-checking'], 2150);

  // Savings: 5000 + 500 (transfer in) = 5500
  assert.equal(balances['acc-savings'], 5500);

  // Credit Card: 300 (initial debt) + 100 (new purchase) - 200 (payment) = 200 owed
  assert.equal(balances['acc-credit'], 200);

  // Net Worth calculation
  // Total Assets: 2150 + 5500 = 7650
  // Total Liabilities: 200
  // Net Worth: 7650 - 200 = 7450
  const netWorth = computeNetWorth(accounts, balances, 'USD', DEFAULT_EXCHANGE_RATES);
  assert.equal(netWorth.totalAssets, 7650);
  assert.equal(netWorth.totalLiabilities, 200);
  assert.equal(netWorth.netWorth, 7450);

  // Cash Flow calculation
  // Total Income: 2000
  // Total Expense: 150 (checking) + 100 (credit) = 250 (transfers not counted)
  // Net Flow: 2000 - 250 = 1750
  const cashFlow = computeCashFlow(transactions, 'USD', DEFAULT_EXCHANGE_RATES);
  assert.equal(cashFlow.totalIncome, 2000);
  assert.equal(cashFlow.totalExpenses, 250);
  assert.equal(cashFlow.netFlow, 1750);
});

test('Charity pledges and pending obligation calculations', () => {
  const pledges: CharityPledge[] = [
    {
      id: 'pl-1',
      title: 'Annual Zakat 2026',
      cause: 'Zakat',
      pledgedAmount: 1000,
      fulfilledAmount: 400,
      currency: 'USD',
      status: 'partially_fulfilled',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'pl-2',
      title: 'Emergency Medical Relief',
      cause: 'Relief',
      pledgedAmount: 500,
      fulfilledAmount: 500,
      currency: 'USD',
      status: 'fulfilled',
      createdAt: '2026-02-01',
      updatedAt: '2026-02-01',
    },
    {
      id: 'pl-3',
      title: 'Local Orphan Sponsorship',
      cause: 'Orphans',
      pledgedAmount: 300,
      fulfilledAmount: 0,
      currency: 'USD',
      status: 'pending',
      createdAt: '2026-03-01',
      updatedAt: '2026-03-01',
    },
  ];

  const stats = computeCharityStats(pledges, 'USD', DEFAULT_EXCHANGE_RATES);
  assert.equal(stats.totalPledged, 1800);
  assert.equal(stats.totalFulfilled, 900);
  assert.equal(stats.totalPending, 900); // 1800 - 900
  assert.equal(stats.fulfillmentPercent, 50);
  assert.equal(stats.pendingPledgesCount, 2); // pl-1 and pl-3
});
