/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, CharityPledge, Transaction } from '../types/finance';

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
