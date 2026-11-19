/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectBankAccountFromHint,
  markDuplicateParsedEntries,
  normalizeParsedBankEntries,
} from './screenshotParser';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES } from '../data/seedData';
import { Transaction } from '../types/finance';

test('detectBankAccountFromHint picks Toss or Hana account accurately', () => {
  const tossId = detectBankAccountFromHint('Toss Bank 토스뱅크 결제내역', INITIAL_ACCOUNTS);
  assert.equal(tossId, 'acc-krw-toss');

  const hanaId = detectBankAccountFromHint('Hana 1Q 하나은행', INITIAL_ACCOUNTS);
  assert.equal(hanaId, 'acc-krw-hana');
});

test('normalizeParsedBankEntries auto-categorizes Toss spending items and uses Uncategorized fallback', () => {
  const parsed = normalizeParsedBankEntries(
    [
      { merchant: '스타벅스 아메리카노', amount: -4500, type: 'expense', date: '2026-11-15' },
      { merchant: '이마트24 계란 우유', amount: 8200, type: 'expense', date: '2026-11-15' },
      { merchant: '지하철 티머니', amount: 1550, type: 'expense' },
      { merchant: 'Peer Tutoring Deposit', amount: 80000, type: 'income', date: '2026-11-14' },
      { merchant: 'Smart Store Mystery', amount: 12000, type: 'expense', date: '2026-11-14' },
      { merchant: '', amount: 500 },
    ],
    INITIAL_CATEGORIES,
    '2026-11-16'
  );

  assert.equal(parsed.length, 5);
  assert.equal(parsed[0].categoryId, 'cat-coffee');
  assert.equal(parsed[0].amount, 4500);
  assert.equal(parsed[1].categoryId, 'cat-groceries');
  assert.equal(parsed[2].categoryId, 'cat-transit');
  assert.equal(parsed[2].date, '2026-11-16');
  assert.equal(parsed[3].type, 'income');
  assert.equal(parsed[3].categoryId, 'cat-tutoring');
  assert.equal(parsed[4].categoryId, 'cat-uncategorized');
});

test('markDuplicateParsedEntries flags matching existing transactions and unselects them', () => {
  const existing: Transaction[] = [
    {
      id: 'tx-1',
      type: 'expense',
      amount: 4500,
      currency: 'KRW',
      date: '2026-11-15',
      categoryId: 'cat-coffee',
      accountId: 'acc-krw-toss',
      merchant: '스타벅스 아메리카노',
      createdAt: '2026-11-15T00:00:00Z',
      updatedAt: '2026-11-15T00:00:00Z',
    },
  ];

  const entries = normalizeParsedBankEntries(
    [
      { merchant: '  스타벅스 아메리카노 ', amount: 4500, type: 'expense', date: '2026-11-15' },
      { merchant: 'CU Banana Milk', amount: 1700, type: 'expense', date: '2026-11-15' },
    ],
    INITIAL_CATEGORIES,
    '2026-11-15'
  );

  const deduped = markDuplicateParsedEntries(entries, 'acc-krw-toss', existing);
  assert.equal(deduped[0].isDuplicate, true);
  assert.equal(deduped[0].selected, false);
  assert.equal(deduped[1].isDuplicate, false);
  assert.equal(deduped[1].selected, true);
});
