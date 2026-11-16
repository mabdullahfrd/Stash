/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectBankAccountFromHint,
  normalizeParsedBankEntries,
} from './screenshotParser';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES } from '../data/seedData';

test('detectBankAccountFromHint picks Toss or Hana account accurately', () => {
  const tossId = detectBankAccountFromHint('Toss Bank 토스뱅크 결제내역', INITIAL_ACCOUNTS);
  assert.equal(tossId, 'acc-krw-toss');

  const hanaId = detectBankAccountFromHint('Hana 1Q 하나은행', INITIAL_ACCOUNTS);
  assert.equal(hanaId, 'acc-krw-hana');
});

test('normalizeParsedBankEntries auto-categorizes Toss spending items cleanly', () => {
  const parsed = normalizeParsedBankEntries(
    [
      { merchant: '스타벅스 아메리카노', amount: -4500, type: 'expense', date: '2026-11-15' },
      { merchant: '이마트24 계란 우유', amount: 8200, type: 'expense', date: '2026-11-15' },
      { merchant: '지하철 티머니', amount: 1550, type: 'expense' },
      { merchant: 'Peer Tutoring Deposit', amount: 80000, type: 'income', date: '2026-11-14' },
      { merchant: '', amount: 500 },
    ],
    INITIAL_CATEGORIES,
    '2026-11-16'
  );

  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].categoryId, 'cat-coffee');
  assert.equal(parsed[0].amount, 4500);
  assert.equal(parsed[1].categoryId, 'cat-groceries');
  assert.equal(parsed[2].categoryId, 'cat-transit');
  assert.equal(parsed[2].date, '2026-11-16');
  assert.equal(parsed[3].type, 'income');
  assert.equal(parsed[3].categoryId, 'cat-tutoring');
});
