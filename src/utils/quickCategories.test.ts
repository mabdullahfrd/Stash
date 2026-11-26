/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { pickQuickCategories } from './quickCategories';
import { cleanAmountText } from '../components/common/InlineAmountInput';

test('cleanAmountText keeps digits (and one decimal point where allowed)', () => {
  assert.equal(cleanAmountText('12,500', false), '12500');
  assert.equal(cleanAmountText('₩ 4.500', false), '4500');
  assert.equal(cleanAmountText('3.50', true), '3.50');
  assert.equal(cleanAmountText('1.2.3', true), '1.23');
  assert.equal(cleanAmountText('abc', true), '');
});
import { Category, Transaction } from '../types/finance';

const cat = (id: string): Category => ({ id, name: id, type: 'expense', icon: 'x', color: '#000' });
const CATS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(cat);
const tx = (categoryId: string, i: number): Transaction => ({
  id: `t${i}`,
  type: 'expense',
  amount: 1,
  currency: 'KRW',
  date: '2026-11-27',
  categoryId,
  accountId: 'acc',
  createdAt: '',
  updatedAt: '',
});

test('pickQuickCategories falls back to list order when nothing is logged yet', () => {
  assert.deepEqual(pickQuickCategories(CATS, [], 'a', 3).map((c) => c.id), ['a', 'b', 'c']);
});

test('pickQuickCategories puts the most-used categories first', () => {
  const txs = ['g', 'g', 'g', 'e', 'e', 'b'].map(tx);
  assert.deepEqual(pickQuickCategories(CATS, txs, 'g', 4).map((c) => c.id), ['g', 'e', 'b', 'a']);
});

test('pickQuickCategories always includes the selected (e.g. auto-matched) category', () => {
  assert.deepEqual(pickQuickCategories(CATS, [], 'h', 3).map((c) => c.id), ['a', 'b', 'h']);
});

test('pickQuickCategories returns everything when the list is already short', () => {
  assert.equal(pickQuickCategories(CATS.slice(0, 3), [], 'a', 6).length, 3);
});
