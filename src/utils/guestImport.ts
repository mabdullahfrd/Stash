/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, CharityPledge, SavingsGoal, Transaction } from '../types/finance';
import { parseBackupJson } from './backupSchema';

export interface FinanceSnapshot {
  accounts: Account[];
  transactions: Transaction[];
  charityPledges: CharityPledge[];
  savingsGoals: SavingsGoal[];
}

export interface GuestImportPlan extends FinanceSnapshot {
  /** Records the guest created or changed themselves (excludes untouched demo data). */
  userRecordCount: number;
}

/** JSON with object keys sorted, so key order (e.g. after schema parsing) never affects equality. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function isUntouchedSeed<T extends { id: string }>(record: T, seedById: Map<string, T>): boolean {
  const seed = seedById.get(record.id);
  return seed !== undefined && stableStringify(seed) === stableStringify(record);
}

/**
 * Works out what a guest should be offered to carry into a newly signed-in account.
 *
 * Guest mode starts from demo seed data, so untouched demo records are skipped.
 * Anything the guest added or edited is kept, plus any demo account, pledge, or goal
 * that a kept transaction points at (so imported entries never reference a missing pocket).
 *
 * Returns null when the stored guest data is missing, invalid, or contains nothing user-made.
 */
export function buildGuestImportPlan(
  guest: Partial<FinanceSnapshot> | null | undefined,
  seed: FinanceSnapshot
): GuestImportPlan | null {
  if (!guest) return null;

  const validated = parseBackupJson(
    JSON.stringify({
      accounts: guest.accounts ?? [],
      transactions: guest.transactions ?? [],
      charityPledges: guest.charityPledges ?? [],
      savingsGoals: guest.savingsGoals ?? [],
    })
  );
  if (!validated.ok) return null;
  const data = validated.data;

  const seedAccounts = new Map(seed.accounts.map((r) => [r.id, r]));
  const seedTxs = new Map(seed.transactions.map((r) => [r.id, r]));
  const seedPledges = new Map(seed.charityPledges.map((r) => [r.id, r]));
  const seedGoals = new Map(seed.savingsGoals.map((r) => [r.id, r]));

  const transactions = data.transactions.filter((r) => !isUntouchedSeed(r, seedTxs));
  const userAccounts = data.accounts.filter((r) => !isUntouchedSeed(r, seedAccounts));
  const userPledges = data.charityPledges.filter((r) => !isUntouchedSeed(r, seedPledges));
  const userGoals = (data.savingsGoals ?? []).filter((r) => !isUntouchedSeed(r, seedGoals));

  const userRecordCount =
    transactions.length + userAccounts.length + userPledges.length + userGoals.length;
  if (userRecordCount === 0) return null;

  // Pull in demo records that kept transactions depend on.
  const neededAccountIds = new Set<string>();
  const neededPledgeIds = new Set<string>();
  const neededGoalIds = new Set<string>();
  for (const tx of transactions) {
    neededAccountIds.add(tx.accountId);
    if (tx.toAccountId) neededAccountIds.add(tx.toAccountId);
    if (tx.charityPledgeId) neededPledgeIds.add(tx.charityPledgeId);
    if (tx.savingsGoalId) neededGoalIds.add(tx.savingsGoalId);
  }

  const pickWithDeps = <T extends { id: string }>(all: T[], kept: T[], needed: Set<string>): T[] => {
    const keptIds = new Set(kept.map((r) => r.id));
    return [...kept, ...all.filter((r) => !keptIds.has(r.id) && needed.has(r.id))];
  };

  return {
    accounts: pickWithDeps(data.accounts, userAccounts, neededAccountIds),
    transactions,
    charityPledges: pickWithDeps(data.charityPledges, userPledges, neededPledgeIds),
    savingsGoals: pickWithDeps(data.savingsGoals ?? [], userGoals, neededGoalIds),
    userRecordCount,
  };
}
