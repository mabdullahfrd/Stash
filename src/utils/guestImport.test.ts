/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGuestImportPlan, FinanceSnapshot } from './guestImport';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CHARITY_PLEDGES,
  INITIAL_SAVINGS_GOALS,
  INITIAL_TRANSACTIONS,
} from '../data/seedData';
import { Transaction } from '../types/finance';

const SEED: FinanceSnapshot = {
  accounts: INITIAL_ACCOUNTS,
  transactions: INITIAL_TRANSACTIONS,
  charityPledges: INITIAL_CHARITY_PLEDGES,
  savingsGoals: INITIAL_SAVINGS_GOALS,
};

test('buildGuestImportPlan returns null for missing or untouched demo data', () => {
  assert.equal(buildGuestImportPlan(null, SEED), null);
  assert.equal(buildGuestImportPlan({}, SEED), null);
  // Exactly the demo data (even after a JSON round-trip that may reorder keys)
  const roundTripped = JSON.parse(JSON.stringify(SEED)) as FinanceSnapshot;
  assert.equal(buildGuestImportPlan(roundTripped, SEED), null);
});

test('buildGuestImportPlan ignores demo records saved on an earlier day (dates are relative)', () => {
  const storedYesterday: FinanceSnapshot = {
    ...SEED,
    transactions: SEED.transactions.map((t) => ({ ...t, date: '2020-01-01', createdAt: 'x', updatedAt: 'y' })),
    savingsGoals: SEED.savingsGoals.map((g) => ({ ...g, targetDate: '2020-02-02' })),
    charityPledges: SEED.charityPledges.map((p) => ({ ...p, dueDate: '2020-03-03' })),
  };
  assert.equal(buildGuestImportPlan(storedYesterday, SEED), null);
});

test('buildGuestImportPlan keeps user entries and the demo account they reference', () => {
  const demoAccount = INITIAL_ACCOUNTS[0];
  const userTx: Transaction = {
    id: 'tx-user-1',
    type: 'expense',
    amount: 4500,
    currency: 'KRW',
    date: '2026-11-25',
    categoryId: 'cat-food',
    accountId: demoAccount.id,
    merchant: 'GS25',
    createdAt: '2026-11-25T10:00:00.000Z',
    updatedAt: '2026-11-25T10:00:00.000Z',
  };

  const plan = buildGuestImportPlan(
    { ...SEED, transactions: [...SEED.transactions, userTx] },
    SEED
  );

  assert.ok(plan);
  assert.equal(plan.userRecordCount, 1);
  assert.deepEqual(plan.transactions.map((t) => t.id), ['tx-user-1']);
  // The referenced demo account comes along; the unreferenced one does not
  assert.deepEqual(plan.accounts.map((a) => a.id), [demoAccount.id]);
  assert.deepEqual(plan.charityPledges, []);
  assert.deepEqual(plan.savingsGoals, []);
});

test('buildGuestImportPlan treats an edited demo record as user data', () => {
  const editedGoal = { ...INITIAL_SAVINGS_GOALS[0], title: 'My laptop fund' };
  const plan = buildGuestImportPlan(
    { ...SEED, savingsGoals: [editedGoal, ...INITIAL_SAVINGS_GOALS.slice(1)] },
    SEED
  );
  assert.ok(plan);
  assert.equal(plan.userRecordCount, 1);
  assert.deepEqual(plan.savingsGoals.map((g) => g.title), ['My laptop fund']);
});

test('buildGuestImportPlan rejects malformed stored data', () => {
  const plan = buildGuestImportPlan(
    { accounts: [{ id: 'x' }] as never, transactions: [] },
    SEED
  );
  assert.equal(plan, null);
});
