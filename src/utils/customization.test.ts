/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBudgetProgress,
  createCustomCategory,
  mergeCustomCategories,
  pickReplacementCategory,
  sanitizeBudgets,
  sanitizeCustomCategories,
  validateCategoryName,
} from './customization';
import { INITIAL_CATEGORIES } from '../data/seedData';
import { DEFAULT_EXCHANGE_RATES } from './currencies';
import { Transaction } from '../types/finance';

test('validateCategoryName rejects blanks, long names and duplicates of the same type', () => {
  assert.equal(validateCategoryName('  ', 'expense', INITIAL_CATEGORIES), 'Enter a category name.');
  assert.match(validateCategoryName('x'.repeat(61), 'expense', INITIAL_CATEGORIES) ?? '', /under 60/);
  assert.match(validateCategoryName(' coffee ', 'expense', INITIAL_CATEGORIES) ?? '', /already exists/);
  assert.equal(validateCategoryName('Coffee', 'income', INITIAL_CATEGORIES), null); // different type is fine
  assert.equal(validateCategoryName('Gym', 'expense', INITIAL_CATEGORIES), null);
  // Renaming a category to its own name is allowed
  const gym = createCustomCategory('Gym', 'expense');
  assert.equal(validateCategoryName('gym', 'expense', [...INITIAL_CATEGORIES, gym], gym.id), null);
});

test('createCustomCategory makes a trimmed, flagged category with a custom id', () => {
  const c = createCustomCategory('  Mosque donations ', 'expense');
  assert.equal(c.name, 'Mosque donations');
  assert.equal(c.isCustom, true);
  assert.ok(c.id.startsWith('cat-custom-'));
});

test('sanitizeCustomCategories and sanitizeBudgets drop malformed rows', () => {
  const cats = sanitizeCustomCategories([
    { id: 'cat-custom-1', name: 'Gym', type: 'expense' },
    { id: 'cat-coffee', name: 'Coffee', type: 'expense' }, // not a custom id
    { id: 'cat-custom-2', name: '', type: 'expense' },
    { id: 'cat-custom-3', name: 'X', type: 'other' },
  ]);
  assert.deepEqual(cats.map((c) => c.id), ['cat-custom-1']);
  assert.equal(cats[0].icon, 'Tag');

  const budgets = sanitizeBudgets([
    { categoryId: 'cat-coffee', amount: 50000, currency: 'KRW' },
    { categoryId: 'cat-dining', amount: -1, currency: 'KRW' },
    { categoryId: 'cat-gym', amount: 10, currency: 'XYZ' },
  ]);
  assert.deepEqual(budgets.map((b) => b.id), ['cat-coffee']);
});

test('pickReplacementCategory keeps entries in a category of the same type', () => {
  const gym = createCustomCategory('Gym', 'expense');
  const tips = createCustomCategory('Tips', 'income');
  const all = [...INITIAL_CATEGORIES, gym, tips];
  assert.equal(pickReplacementCategory(all, gym)?.id, 'cat-uncategorized');
  const incomeReplacement = pickReplacementCategory(all, tips);
  assert.equal(incomeReplacement?.type, 'income');
  assert.notEqual(incomeReplacement?.id, tips.id);
});

test('mergeCustomCategories appends custom categories after the built-in list', () => {
  const gym = createCustomCategory('Gym', 'expense');
  const merged = mergeCustomCategories(INITIAL_CATEGORIES, [gym]);
  assert.equal(merged.length, INITIAL_CATEGORIES.length + 1);
  assert.equal(merged[merged.length - 1].id, gym.id);
});

test('computeBudgetProgress counts this month only and flags warning / over', () => {
  const today = new Date(2026, 10, 27);
  const tx = (id: string, categoryId: string, amount: number, date: string, type: Transaction['type'] = 'expense', currency: Transaction['currency'] = 'KRW'): Transaction => ({
    id, type, amount, currency, date, categoryId, accountId: 'acc', createdAt: '', updatedAt: '',
  });
  const transactions = [
    tx('a', 'cat-coffee', 30000, '2026-11-02'),
    tx('b', 'cat-coffee', 12000, '2026-11-20'),
    tx('c', 'cat-coffee', 99000, '2026-10-30'), // last month
    tx('d', 'cat-coffee', 5000, '2026-11-21', 'income'), // not an expense
    tx('e', 'cat-dining', 10, '2026-11-05', 'expense', 'USD'), // converted to KRW
  ];
  const budgets = sanitizeBudgets([
    { categoryId: 'cat-coffee', amount: 50000, currency: 'KRW' },
    { categoryId: 'cat-dining', amount: 10000, currency: 'KRW' },
    { categoryId: 'cat-gifts', amount: 20000, currency: 'KRW' },
  ]);
  const rows = computeBudgetProgress(budgets, transactions, INITIAL_CATEGORIES, DEFAULT_EXCHANGE_RATES, today);
  const byId = Object.fromEntries(rows.map((r) => [r.budget.categoryId, r]));
  assert.equal(byId['cat-coffee'].spent, 42000);
  assert.equal(byId['cat-coffee'].percent, 84);
  assert.equal(byId['cat-coffee'].status, 'warning');
  assert.equal(byId['cat-dining'].spent, 13800);
  assert.equal(byId['cat-dining'].status, 'over');
  assert.equal(byId['cat-dining'].remaining, -3800);
  assert.equal(byId['cat-gifts'].status, 'ok');
  assert.equal(byId['cat-coffee'].category?.name, 'Coffee');
});
