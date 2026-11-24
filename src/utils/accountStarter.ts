/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, CharityPledge, SavingsGoal, Transaction } from '../types/finance';

export function buildEmptyStarterState(): {
  accounts: Account[];
  transactions: Transaction[];
  charityPledges: CharityPledge[];
  savingsGoals: SavingsGoal[];
} {
  return {
    accounts: [],
    transactions: [],
    charityPledges: [],
    savingsGoals: [],
  };
}
