/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeItemTypeAnalytics } from './itemAnalytics';
import { INITIAL_CATEGORIES } from '../data/seedData';
import { DEFAULT_EXCHANGE_RATES } from './currencies';
import { Transaction } from '../types/finance';

test('computeItemTypeAnalytics splits itemized receipts accurately and groups item types', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-emart',
      type: 'expense',
      amount: 18000,
      currency: 'KRW',
      date: '2026-11-10',
      categoryId: 'cat-groceries',
      accountId: 'acc-krw-toss',
      merchant: 'Emart Everyday',
      receiptItems: [
        { id: '1', name: 'Grade-A Eggs 10pk', price: 4500, category: 'Groceries (Eggs, Bread, Milk)' },
        { id: '2', name: 'Iced Vanilla Latte', price: 5500, category: 'Coffee & Drinks' },
        { id: '3', name: 'Haagen-Dazs Vanilla', price: 8000, category: 'Ice Cream & Treats' },
      ],
      createdAt: '2026-11-10T12:00:00Z',
      updatedAt: '2026-11-10T12:00:00Z',
    },
    {
      id: 'tx-mega',
      type: 'expense',
      amount: 4500,
      currency: 'KRW',
      date: '2026-11-12',
      categoryId: 'cat-coffee',
      accountId: 'acc-krw-hana',
      merchant: 'Iced Cafe Latte',
      createdAt: '2026-11-12T10:00:00Z',
      updatedAt: '2026-11-12T10:00:00Z',
    },
  ];

  const summary = computeItemTypeAnalytics(
    transactions,
    INITIAL_CATEGORIES,
    'KRW',
    DEFAULT_EXCHANGE_RATES
  );

  assert.equal(summary.totalSpent, 22500);
  assert.equal(summary.totalItemCount, 4);

  // Coffee & Drinks should have 5500 (from Emart receipt) + 4500 (direct entry) = 10000
  const coffeeCat = summary.categoryBreakdowns.find((c) => c.categoryId === 'cat-coffee');
  assert.ok(coffeeCat);
  assert.equal(coffeeCat.totalAmount, 10000);
  assert.equal(coffeeCat.itemCount, 2);

  // Latte item group should combine both lattes into count=2, total=10000, avg=5000
  const latteGroup = summary.itemGroups.find((g) => g.normalizedKey === 'latte');
  assert.ok(latteGroup);
  assert.equal(latteGroup.count, 2);
  assert.equal(latteGroup.amount, 10000);
  assert.equal(latteGroup.avgAmount, 5000);
  assert.deepEqual(latteGroup.accountIds.sort(), ['acc-krw-hana', 'acc-krw-toss']);

  // Legacy 'Ice Cream & Treats' Haagen-Dazs item resolves to split 'cat-icecream' category
  const iceCreamCat = summary.categoryBreakdowns.find((c) => c.categoryId === 'cat-icecream');
  assert.ok(iceCreamCat);
  assert.equal(iceCreamCat.categoryName, 'Ice Cream');
  assert.equal(iceCreamCat.totalAmount, 8000);
});
