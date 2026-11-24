/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmptyStarterState } from './accountStarter';

test('buildEmptyStarterState starts a real account with zero accounts, zero transactions, zero pledges, and zero savings goals', () => {
  const starter = buildEmptyStarterState();
  assert.deepEqual(starter.accounts, []);
  assert.deepEqual(starter.transactions, []);
  assert.deepEqual(starter.charityPledges, []);
  assert.deepEqual(starter.savingsGoals, []);
});
