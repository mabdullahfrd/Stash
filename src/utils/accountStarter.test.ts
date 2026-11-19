/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEmptyStarterState,
  isUntouchedLegacyDemoSeed,
} from './accountStarter';
import { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS } from '../data/seedData';

test('buildEmptyStarterState starts a real account with zero accounts and zero transactions', () => {
  const starter = buildEmptyStarterState();
  assert.deepEqual(starter.accounts, []);
  assert.deepEqual(starter.transactions, []);
  assert.deepEqual(starter.charityPledges, []);
});

test('isUntouchedLegacyDemoSeed detects untouched auto-seeded demo records safely', () => {
  assert.equal(isUntouchedLegacyDemoSeed([], []), false);
  assert.equal(isUntouchedLegacyDemoSeed(INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS), true);
  assert.equal(isUntouchedLegacyDemoSeed(INITIAL_ACCOUNTS, []), true);
});

test('isUntouchedLegacyDemoSeed preserves account once user adds real accounts or transactions', () => {
  const customAccount = {
    ...INITIAL_ACCOUNTS[0],
    id: 'acc-1731999999999',
  };
  assert.equal(
    isUntouchedLegacyDemoSeed([...INITIAL_ACCOUNTS, customAccount], INITIAL_TRANSACTIONS),
    false
  );

  const customTx = {
    ...INITIAL_TRANSACTIONS[0],
    id: 'tx-1731999999999-abc',
  };
  assert.equal(
    isUntouchedLegacyDemoSeed(INITIAL_ACCOUNTS, [...INITIAL_TRANSACTIONS, customTx]),
    false
  );
});
