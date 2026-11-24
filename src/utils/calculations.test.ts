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
  computePledgeFulfillment,
  computeSavingsStats,
  computeSavingsContribution,
} from './calculations';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from './currencies';
import { Account, CharityPledge, SavingsGoal, Transaction } from '../types/finance';

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

test('Multi-currency expense and cross-currency transfers compute balances accurately', () => {
  const accounts: Account[] = [
    {
      id: 'acc-krw',
      name: 'Hana KRW',
      type: 'checking',
      currency: 'KRW',
      balance: 100000,
      institution: 'Hana Bank',
      color: '#008485',
      icon: 'Building2',
    },
    {
      id: 'acc-usd',
      name: 'USD Travel',
      type: 'checking',
      currency: 'USD',
      balance: 0,
      institution: 'Global USD',
      color: '#007AFF',
      icon: 'Globe',
    },
  ];

  // 10 USD expense on KRW account (balance 100,000) -> 100,000 - 13,800 = 86,200
  const afterExpense = computeAccountBalances(
    accounts,
    [
      {
        id: 'tx-usd-exp',
        type: 'expense',
        amount: 10,
        currency: 'USD',
        date: '2026-11-19',
        categoryId: 'cat-dining',
        accountId: 'acc-krw',
        createdAt: '2026-11-19T10:00:00Z',
        updatedAt: '2026-11-19T10:00:00Z',
      },
    ],
    DEFAULT_EXCHANGE_RATES
  );
  assert.equal(afterExpense['acc-krw'], 86200);

  // 100,000 KRW transfer to USD account -> adds ~72.46 USD and leaves KRW at 0
  const afterTransfer = computeAccountBalances(
    accounts,
    [
      {
        id: 'tx-krw-to-usd',
        type: 'transfer',
        amount: 100000,
        currency: 'KRW',
        date: '2026-11-19',
        categoryId: 'cat-transfer',
        accountId: 'acc-krw',
        toAccountId: 'acc-usd',
        createdAt: '2026-11-19T11:00:00Z',
        updatedAt: '2026-11-19T11:00:00Z',
      },
    ],
    DEFAULT_EXCHANGE_RATES
  );
  assert.equal(afterTransfer['acc-krw'], 0);
  assert.equal(afterTransfer['acc-usd'], 72.46);

  // Explicit user-edited toAmount overrides rate conversion
  const withCustomToAmount = computeAccountBalances(
    accounts,
    [
      {
        id: 'tx-krw-to-usd-custom',
        type: 'transfer',
        amount: 100000,
        toAmount: 70.5,
        currency: 'KRW',
        date: '2026-11-19',
        categoryId: 'cat-transfer',
        accountId: 'acc-krw',
        toAccountId: 'acc-usd',
        createdAt: '2026-11-19T11:00:00Z',
        updatedAt: '2026-11-19T11:00:00Z',
      },
    ],
    DEFAULT_EXCHANGE_RATES
  );
  assert.equal(withCustomToAmount['acc-usd'], 70.5);
});

test('computeCashFlow ignores transactions whose account no longer exists', () => {
  const accounts: Account[] = [
    {
      id: 'acc-live',
      name: 'Live Account',
      type: 'checking',
      currency: 'KRW',
      balance: 0,
      institution: 'Hana Bank',
      color: '#008485',
      icon: 'Building2',
    },
  ];
  const transactions: Transaction[] = [
    {
      id: 'tx-live',
      type: 'expense',
      amount: 5000,
      currency: 'KRW',
      date: '2026-11-19',
      categoryId: 'cat-coffee',
      accountId: 'acc-live',
      createdAt: '2026-11-19T10:00:00Z',
      updatedAt: '2026-11-19T10:00:00Z',
    },
    {
      id: 'tx-orphan',
      type: 'expense',
      amount: 99000,
      currency: 'KRW',
      date: '2026-11-19',
      categoryId: 'cat-coffee',
      accountId: 'acc-deleted',
      createdAt: '2026-11-19T10:00:00Z',
      updatedAt: '2026-11-19T10:00:00Z',
    },
  ];

  const flow = computeCashFlow(transactions, 'KRW', DEFAULT_EXCHANGE_RATES, undefined, accounts);
  assert.equal(flow.totalExpenses, 5000);
});

test('computePledgeFulfillment validates amounts and converts across currencies', () => {
  const pledge: CharityPledge = {
    id: 'pl-krw',
    title: 'Student Zakat',
    cause: 'Zakat',
    pledgedAmount: 100000,
    fulfilledAmount: 50000,
    currency: 'KRW',
    status: 'partially_fulfilled',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  };

  const badZero = computePledgeFulfillment(pledge, 0, 'USD', DEFAULT_EXCHANGE_RATES);
  assert.equal(badZero.ok, false);

  const badOver = computePledgeFulfillment(pledge, 50, 'USD', DEFAULT_EXCHANGE_RATES); // 50 USD = 69,000 KRW > 50,000 remaining
  assert.equal(badOver.ok, false);

  // 20 USD = 27,600 KRW -> fulfilled = 77,600 KRW -> partially_fulfilled
  const partial = computePledgeFulfillment(pledge, 20, 'USD', DEFAULT_EXCHANGE_RATES);
  assert.equal(partial.ok, true);
  if (partial.ok) {
    assert.equal(partial.convertedInPledgeCurrency, 27600);
    assert.equal(partial.newFulfilledAmount, 77600);
    assert.equal(partial.newStatus, 'partially_fulfilled');
  }

  // Exact remaining 50,000 KRW -> fulfilled
  const exact = computePledgeFulfillment(pledge, 50000, 'KRW', DEFAULT_EXCHANGE_RATES);
  assert.equal(exact.ok, true);
  if (exact.ok) {
    assert.equal(exact.newFulfilledAmount, 100000);
    assert.equal(exact.newStatus, 'fulfilled');
  }
});

test('Savings goal aggregate stats and cross-currency contributions compute accurately', () => {
  const goals: SavingsGoal[] = [
    {
      id: 'goal-1',
      title: 'Emergency Buffer',
      category: 'Emergency Fund',
      targetAmount: 1000,
      savedAmount: 250,
      currency: 'USD',
      status: 'partially_saved',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    },
    {
      id: 'goal-2',
      title: 'Laptop Reserve',
      category: 'Tech',
      targetAmount: 500,
      savedAmount: 500,
      currency: 'USD',
      status: 'completed',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-02',
    },
  ];

  const stats = computeSavingsStats(goals, 'USD', DEFAULT_EXCHANGE_RATES);
  assert.equal(stats.totalTarget, 1500);
  assert.equal(stats.totalSaved, 750);
  assert.equal(stats.totalRemaining, 750);
  assert.equal(stats.progressPercent, 50);
  assert.equal(stats.activeGoalsCount, 1);

  const krwGoal: SavingsGoal = {
    id: 'goal-krw',
    title: 'Busan Trip',
    category: 'Travel',
    targetAmount: 200000,
    savedAmount: 100000,
    currency: 'KRW',
    status: 'partially_saved',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  };

  assert.equal(computeSavingsContribution(krwGoal, 0, 'KRW', DEFAULT_EXCHANGE_RATES).ok, false);
  assert.equal(computeSavingsContribution(krwGoal, -5000, 'KRW', DEFAULT_EXCHANGE_RATES).ok, false);

  // 50 USD = 69,000 KRW -> total saved 169,000 KRW -> partially_saved
  const partial = computeSavingsContribution(krwGoal, 50, 'USD', DEFAULT_EXCHANGE_RATES);
  assert.equal(partial.ok, true);
  if (partial.ok) {
    assert.equal(partial.convertedInGoalCurrency, 69000);
    assert.equal(partial.newSavedAmount, 169000);
    assert.equal(partial.newStatus, 'partially_saved');
  }

  // Deposit remaining 100,000 KRW -> completed
  const done = computeSavingsContribution(krwGoal, 100000, 'KRW', DEFAULT_EXCHANGE_RATES);
  assert.equal(done.ok, true);
  if (done.ok) {
    assert.equal(done.newSavedAmount, 200000);
    assert.equal(done.newStatus, 'completed');
  }
});

