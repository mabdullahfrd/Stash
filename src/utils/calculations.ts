/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Budget, CharityPledge, CurrencyCode, ExchangeRates, Transaction } from '../types/finance';
import { convertCurrency } from './currencies';

export interface CalculatedAccountBalance {
  accountId: string;
  calculatedBalance: number; // For assets: positive money. For credit cards: positive owed liability.
  availableCredit?: number;
}

/**
 * Computes live balances for all accounts based on their starting balance and transaction ledger.
 */
export function computeAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize with initial balances
  for (const acc of accounts) {
    balances[acc.id] = acc.balance;
  }

  // Process all transactions
  for (const tx of transactions) {
    const account = accounts.find((a) => a.id === tx.accountId);
    if (!account) continue;

    const isCredit = account.type === 'credit';

    if (tx.type === 'income') {
      if (isCredit) {
        // Refund or credit repayment applied as income: decreases owed debt
        balances[account.id] = (balances[account.id] || 0) - tx.amount;
      } else {
        // Increases asset balance
        balances[account.id] = (balances[account.id] || 0) + tx.amount;
      }
    } else if (tx.type === 'expense') {
      if (isCredit) {
        // Spending on credit card increases owed debt
        balances[account.id] = (balances[account.id] || 0) + tx.amount;
      } else {
        // Decreases asset balance
        balances[account.id] = (balances[account.id] || 0) - tx.amount;
      }
    } else if (tx.type === 'transfer' && tx.toAccountId) {
      const destAccount = accounts.find((a) => a.id === tx.toAccountId);
      if (destAccount) {
        const destIsCredit = destAccount.type === 'credit';

        // Deduct from source
        if (isCredit) {
          balances[account.id] = (balances[account.id] || 0) + tx.amount; // Drawing cash from credit line
        } else {
          balances[account.id] = (balances[account.id] || 0) - tx.amount; // Standard cash outflow
        }

        // Add to destination
        if (destIsCredit) {
          // Paying credit card balance reduces owed liability!
          balances[destAccount.id] = (balances[destAccount.id] || 0) - tx.amount;
        } else {
          balances[destAccount.id] = (balances[destAccount.id] || 0) + tx.amount;
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
      // For credit cards, balance is liability owed
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
 * Pure transfers are excluded from income and expenses to avoid double-counting.
 */
export function computeCashFlow(
  transactions: Transaction[],
  targetCurrency: CurrencyCode,
  rates: ExchangeRates,
  dateFilter?: { start?: string; end?: string }
): {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  savingsRatePercent: number;
} {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (dateFilter) {
      if (dateFilter.start && tx.date < dateFilter.start) continue;
      if (dateFilter.end && tx.date > dateFilter.end) continue;
    }

    // Transfers never count toward income or expense
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

/**
 * Computes budget utilization for category budgets.
 */
export function computeBudgetUtilization(
  budgets: Budget[],
  transactions: Transaction[],
  targetCurrency: CurrencyCode,
  rates: ExchangeRates,
  currentMonthPrefix: string // e.g. "2026-11"
): Array<{
  budget: Budget;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isWarning: boolean;
}> {
  return budgets.map((budget) => {
    // Filter monthly transactions for this category
    const relevantTxs = transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      if (!tx.date.startsWith(currentMonthPrefix)) return false;
      if (budget.categoryId === 'all') return true;
      return tx.categoryId === budget.categoryId;
    });

    const spent = relevantTxs.reduce((sum, tx) => {
      return sum + convertCurrency(tx.amount, tx.currency, targetCurrency, rates);
    }, 0);

    const budgetLimit = convertCurrency(budget.amount, budget.currency, targetCurrency, rates);
    const remaining = budgetLimit - spent;
    const percentUsed = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
    const isOverBudget = spent > budgetLimit;
    const isWarning = !isOverBudget && percentUsed >= budget.warningThresholdPercent;

    return {
      budget,
      spent,
      remaining,
      percentUsed: Number(percentUsed.toFixed(1)),
      isOverBudget,
      isWarning,
    };
  });
}
