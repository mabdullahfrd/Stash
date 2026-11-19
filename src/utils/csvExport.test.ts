/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTransactionsCsv, sanitizeCsvText } from './csvExport';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES } from '../data/seedData';
import { Transaction } from '../types/finance';

test('buildTransactionsCsv emits UTF-8 BOM, quotes every field, and neutralizes formula injection', () => {
  assert.equal(sanitizeCsvText('=cmd|"/C calc"!A0'), `"'=cmd|""/C calc""!A0"`);
  assert.equal(sanitizeCsvText('+SUM(A1:A2)'), `"'+SUM(A1:A2)"`);
  assert.equal(sanitizeCsvText('-1+1'), `"'-1+1"`);
  assert.equal(sanitizeCsvText('@IMPORTXML()'), `"'@IMPORTXML()"`);

  const txs: Transaction[] = [
    {
      id: 'tx-1',
      type: 'expense',
      amount: 4500,
      currency: 'KRW',
      date: '2026-11-20',
      categoryId: 'cat-coffee',
      accountId: 'acc-krw-toss',
      merchant: '=HYPERLINK("http://evil.example","Click")',
      notes: 'Coffee, "iced" latte',
      createdAt: '2026-11-20T09:00:00Z',
      updatedAt: '2026-11-20T09:00:00Z',
    },
  ];

  const csv = buildTransactionsCsv(txs, INITIAL_CATEGORIES, INITIAL_ACCOUNTS);
  assert.ok(csv.startsWith('\uFEFF'));
  const lines = csv.slice(1).split('\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[1].includes(`"'=HYPERLINK(""http://evil.example"",""Click"")"`));
  assert.ok(lines[1].includes(`"Coffee, ""iced"" latte"`));
});
