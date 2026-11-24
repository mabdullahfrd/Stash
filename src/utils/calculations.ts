/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, CharityPledge, CurrencyCode, ExchangeRates, SavingsGoal, Transaction } from '../types/finance';
import { convertCurrency, CURRENCY_REGISTRY, DEFAULT_EXCHANGE_RATES, roundCurrencyAmount } from './currencies';

export interface CalculatedAccountBalance {
  accountId: string;
  calculatedBalance: number; // For assets: positive money. For credit cards: positive owed liability.
  availableCredit?: number;
}

function roundToAccountPrecision(value: number, currency: CurrencyCode): number {
  const decimals = CURRENCY_REGISTRY[currency]?.decimals ?? 2;
  return decimals === 0 ? Math.round(value) : Number(value.toFixed(decimals));
}

/**
 * Computes live balances for all accounts based on their starting balance and transaction ledger.
 * Converts each transaction's amount from tx.currency into the respective account's currency.
 */
export function computeAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): Record<string, number> {
  const balances: Record<string, number> = {};
  const accountMap = new Map<string, Account>();

  for (const acc of accounts) {
    balances[acc.id] = acc.balance;
    accountMap.set(acc.id, acc);
  }

  for (const tx of transactions) {
    const account = accountMap.get(tx.accountId);
    if (!account) continue;

    const isCredit = account.type === 'credit';
    const sourceDelta = convertCurrency(tx.amount, tx.currency, account.currency, rates);

    if (tx.type === 'income') {
      if (isCredit) {
        balances[account.id] = roundToAccountPrecision((balances[account.id] || 0) - sourceDelta, account.currency);
      } else {
        balances[account.id] = roundToAccountPrecision((balances[account.id] || 0) + sourceDelta, account.currency);
      }
    } else if (tx.type === 'expense') {
      if (isCredit) {
        balances[account.id] = roundToAccountPrecision((balances[account.id] || 0) + sourceDelta, account.currency);
      } else {
        balances[account.id] = roundToAccountPrecision((balances[account.id] || 0) - sourceDelta, account.currency);
      }
    } else if (tx.type === 'transfer' && tx.toAccountId) {
      const destAccount = accountMap.get(tx.toAccountId);
      if (destAccount) {
        const destIsCredit = destAccount.type === 'credit';

        if (isCredit) {
          balances[account.id] = roundToAccountPrecision((balances[account.id] || 0) + sourceDelta, account.currency);
        } else {
          balances[account.id] = roundToAccountPrecision((balances[account.id] || 0) - sourceDelta, account.currency);
        }

        const destDelta =
          typeof tx.toAmount === 'number' && Number.isFinite(tx.toAmount) && tx.toAmount > 0
            ? tx.toAmount
            : convertCurrency(tx.amount, tx.currency, destAccount.currency, rates);

        if (destIsCredit) {
          balances[destAccount.id] = roundToAccountPrecision((balances[destAccount.id] || 0) - destDelta, destAccount.currency);
        } else {
          balances[destAccount.id] = roundToAccountPrecision((balances[destAccount.id] || 0) + destDelta, destAccount.currency);
        }
      }
    }
  }

  return balances;
}

/**
 * Computes Total Net Worth in target currency:
 * Assets (Checking + Savings + Cash) minus Liabilities (Credit card debt).
 */
export function computeNetWorth(
  accounts: Account[],
  balances: Record<string, number>,
  targetCurrency: CurrencyCode,
  rates: ExchangeRates
): {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
} {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const acc of accounts) {
    if (acc.isArchived) continue;
    const balance = balances[acc.id] ?? acc.balance;
    const converted = convertCurrency(balance, acc.currency, targetCurrency, rates);

    if (acc.type === 'credit') {
      totalLiabilities += Math.max(0, converted);
    } else {
      totalAssets += converted;
    }
  }

  return {
    netWorth: totalAssets - totalLiabilities,
    totalAssets,
    totalLiabilities,
  };
}

/**
 * Computes Cash Flow (Total Income, Total Expense, Net Flow) for a given set of transactions.
 * Pure transfers and transactions referencing deleted accounts are excluded.
 */
export function computeCashFlow(
  transactions: Transaction[],
  targetCurrency: CurrencyCode,
  rates: ExchangeRates,
  dateFilter?: { start?: string; end?: string },
  accounts?: Account[]
): {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  savingsRatePercent: number;
} {
  let totalIncome = 0;
  let totalExpenses = 0;
  const existingAccountIds = accounts ? new Set(accounts.map((a) => a.id)) : null;

  for (const tx of transactions) {
    if (existingAccountIds && !existingAccountIds.has(tx.accountId)) continue;

    if (dateFilter) {
      if (dateFilter.start && tx.date < dateFilter.start) continue;
      if (dateFilter.end && tx.date > dateFilter.end) continue;
    }

    if (tx.type === 'transfer') continue;

    const converted = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);

    if (tx.type === 'income') {
      totalIncome += converted;
    } else if (tx.type === 'expense') {
      totalExpenses += converted;
    }
  }

  const netFlow = totalIncome - totalExpenses;
  const savingsRatePercent = totalIncome > 0 ? Math.max(0, (netFlow / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpenses,
    netFlow,
    savingsRatePercent: Number(savingsRatePercent.toFixed(1)),
  };
}

/**
 * Computes Pending Charity commitments and fulfillment metrics.
 */
export function computeCharityStats(
  pledges: CharityPledge[],
  targetCurrency: CurrencyCode,
  rates: ExchangeRates
): {
  totalPledged: number;
  totalFulfilled: number;
  totalPending: number;
  fulfillmentPercent: number;
  pendingPledgesCount: number;
} {
  let totalPledged = 0;
  let totalFulfilled = 0;

  for (const pledge of pledges) {
    const pledgedConverted = convertCurrency(pledge.pledgedAmount, pledge.currency, targetCurrency, rates);
    const fulfilledConverted = convertCurrency(pledge.fulfilledAmount, pledge.currency, targetCurrency, rates);

    totalPledged += pledgedConverted;
    totalFulfilled += fulfilledConverted;
  }

  const totalPending = Math.max(0, totalPledged - totalFulfilled);
  const fulfillmentPercent = totalPledged > 0 ? (totalFulfilled / totalPledged) * 100 : 100;
  const pendingPledgesCount = pledges.filter((p) => p.status !== 'fulfilled' && p.pledgedAmount > p.fulfilledAmount).length;

  return {
    totalPledged,
    totalFulfilled,
    totalPending,
    fulfillmentPercent: Number(fulfillmentPercent.toFixed(1)),
    pendingPledgesCount,
  };
}

export type PledgeFulfillmentResult =
  | {
      ok: true;
      convertedInPledgeCurrency: number;
      newFulfilledAmount: number;
      newStatus: CharityPledge['status'];
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Validates and computes charity pledge fulfillment across currencies.
 */
export function computePledgeFulfillment(
  pledge: CharityPledge,
  paidAmount: number,
  paidCurrency: CurrencyCode,
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): PledgeFulfillmentResult {
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    return { ok: false, error: 'Enter a fulfillment amount greater than 0.' };
  }

  const remaining = Math.max(0, roundCurrencyAmount(pledge.pledgedAmount - pledge.fulfilledAmount, pledge.currency));
  if (remaining <= 0) {
    return { ok: false, error: 'This charity pledge is already fully fulfilled.' };
  }

  const convertedInPledgeCurrency = convertCurrency(paidAmount, paidCurrency, pledge.currency, rates);
  if (!Number.isFinite(convertedInPledgeCurrency) || convertedInPledgeCurrency <= 0) {
    return { ok: false, error: 'Fulfillment amount is too small after currency conversion.' };
  }

  if (convertedInPledgeCurrency > remaining) {
    return {
      ok: false,
      error: `Amount exceeds the remaining pledge balance (${remaining} ${pledge.currency}).`,
    };
  }

  const newFulfilledAmount = roundCurrencyAmount(
    pledge.fulfilledAmount + convertedInPledgeCurrency,
    pledge.currency
  );
  const newStatus: CharityPledge['status'] =
    newFulfilledAmount >= pledge.pledgedAmount ? 'fulfilled' : 'partially_fulfilled';

  return {
    ok: true,
    convertedInPledgeCurrency,
    newFulfilledAmount,
    newStatus,
  };
}

/**
 * Computes aggregate savings goals progress in the user's active currency.
 */
export function computeSavingsStats(
  goals: SavingsGoal[],
  targetCurrency: CurrencyCode,
  rates: ExchangeRates
): {
  totalTarget: number;
  totalSaved: number;
  totalRemaining: number;
  progressPercent: number;
  activeGoalsCount: number;
} {
  let totalTarget = 0;
  let totalSaved = 0;

  for (const goal of goals) {
    const targetConverted = convertCurrency(goal.targetAmount, goal.currency, targetCurrency, rates);
    const savedConverted = convertCurrency(goal.savedAmount, goal.currency, targetCurrency, rates);

    totalTarget += targetConverted;
    totalSaved += savedConverted;
  }

  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const progressPercent = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
  const activeGoalsCount = goals.filter(
    (g) => g.status !== 'completed' && g.savedAmount < g.targetAmount
  ).length;

  return {
    totalTarget,
    totalSaved,
    totalRemaining,
    progressPercent: Number(progressPercent.toFixed(1)),
    activeGoalsCount,
  };
}

export type SavingsContributionResult =
  | {
      ok: true;
      convertedInGoalCurrency: number;
      newSavedAmount: number;
      newStatus: SavingsGoal['status'];
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Validates and computes a contribution toward a savings goal across currencies.
 */
export function computeSavingsContribution(
  goal: SavingsGoal,
  depositAmount: number,
  depositCurrency: CurrencyCode,
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): SavingsContributionResult {
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return { ok: false, error: 'Enter a savings amount greater than 0.' };
  }

  const convertedInGoalCurrency = convertCurrency(depositAmount, depositCurrency, goal.currency, rates);
  if (!Number.isFinite(convertedInGoalCurrency) || convertedInGoalCurrency <= 0) {
    return { ok: false, error: 'Savings amount is too small after currency conversion.' };
  }

  const newSavedAmount = roundCurrencyAmount(
    goal.savedAmount + convertedInGoalCurrency,
    goal.currency
  );

  if (newSavedAmount > 1_000_000_000_000) {
    return { ok: false, error: 'Savings total exceeds the maximum supported limit.' };
  }

  const newStatus: SavingsGoal['status'] =
    newSavedAmount >= goal.targetAmount ? 'completed' : 'partially_saved';

  return {
    ok: true,
    convertedInGoalCurrency,
    newSavedAmount,
    newStatus,
  };
}
