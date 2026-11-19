/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, CharityPledge, Transaction } from '../types/finance';

export const LEGACY_DEMO_ACCOUNT_IDS = new Set(['acc-krw-hana', 'acc-krw-toss']);
export const LEGACY_DEMO_TRANSACTION_IDS = new Set([
  'tx-p1',
  'tx-s1',
  'tx-s2',
  'tx-s3',
  'tx-s4',
  'tx-s5',
]);
export const LEGACY_DEMO_PLEDGE_IDS = new Set(['pledge-zakat-korea']);

/**
 * Detects whether a signed-in Firestore account only contains the untouched
 * demo seed records created by earlier builds (no user-added banks or transactions).
 */
export function isUntouchedLegacyDemoSeed(
  accounts: Account[],
  transactions: Transaction[]
): boolean {
  if (accounts.length === 0 && transactions.length === 0) {
    return false;
  }

  const allAccountsAreDemo =
    accounts.length > 0 && accounts.every((acc) => LEGACY_DEMO_ACCOUNT_IDS.has(acc.id));
  const allTxsAreDemo = transactions.every((tx) => LEGACY_DEMO_TRANSACTION_IDS.has(tx.id));

  return allAccountsAreDemo && allTxsAreDemo;
}

export function buildEmptyStarterState(): {
  accounts: Account[];
  transactions: Transaction[];
  charityPledges: CharityPledge[];
} {
  return {
    accounts: [],
    transactions: [],
    charityPledges: [],
  };
}
