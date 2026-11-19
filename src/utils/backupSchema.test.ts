/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBackupJson } from './backupSchema';
import { INITIAL_ACCOUNTS, INITIAL_CHARITY_PLEDGES, INITIAL_TRANSACTIONS } from '../data/seedData';

test('parseBackupJson accepts valid exported backup payload', () => {
  const payload = JSON.stringify({
    accounts: INITIAL_ACCOUNTS,
    transactions: INITIAL_TRANSACTIONS,
    charityPledges: INITIAL_CHARITY_PLEDGES,
    primaryCurrency: 'KRW',
    version: '3.0.0',
  });

  const result = parseBackupJson(payload);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.accounts.length, INITIAL_ACCOUNTS.length);
    assert.equal(result.data.transactions.length, INITIAL_TRANSACTIONS.length);
    assert.equal(result.data.charityPledges.length, INITIAL_CHARITY_PLEDGES.length);
  }
});

test('parseBackupJson rejects malformed JSON, negative amounts, and invalid currencies', () => {
  const invalidJson = parseBackupJson('{not json');
  assert.equal(invalidJson.ok, false);

  const negativeTx = parseBackupJson(
    JSON.stringify({
      accounts: INITIAL_ACCOUNTS,
      transactions: [{ ...INITIAL_TRANSACTIONS[0], amount: -500 }],
      charityPledges: [],
    })
  );
  assert.equal(negativeTx.ok, false);

  const badCurrency = parseBackupJson(
    JSON.stringify({
      accounts: [{ ...INITIAL_ACCOUNTS[0], currency: 'XYZ' }],
      transactions: [],
      charityPledges: [],
    })
  );
  assert.equal(badCurrency.ok, false);
});
