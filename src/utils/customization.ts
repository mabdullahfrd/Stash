/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Account,
  Category,
  CategoryBudget,
  CurrencyCode,
  ExchangeRates,
  Transaction,
} from '../types/finance';
import { convertCurrency } from './currencies';
import { localDateString } from './dates';
import { generateId } from './storage';

export const CUSTOM_CATEGORY_PREFIX = 'cat-custom-';
export const MAX_CATEGORY_NAME = 60;
export const MAX_BUDGET_AMOUNT = 1_000_000_000_000;
const VALID_CURRENCIES: CurrencyCode[] = ['KRW', 'USD', 'EUR', 'PKR'];

const CUSTOM_COLORS = ['#0EA5E9', '#8B5CF6', '#F97316', '#14B8A6', '#E11D48', '#84CC16', '#6366F1', '#F59E0B'];

/** Returns an error message, or null when the name can be used for a new/renamed category. */
export function validateCategoryName(
  rawName: string,
  type: 'income' | 'expense',
  existing: Category[],
  ignoreId?: string
): string | null {
  const name = rawName.trim();
  if (!name) return 'Enter a category name.';
  if (name.length > MAX_CATEGORY_NAME) return `Keep it under ${MAX_CATEGORY_NAME} characters.`;
  const clash = existing.find(
    (c) => c.id !== ignoreId && c.type === type && c.name.trim().toLowerCase() === name.toLowerCase()
  );
  return clash ? `"${clash.name}" already exists.` : null;
}

export function createCustomCategory(rawName: string, type: 'income' | 'expense'): Category {
  const name = rawName.trim();
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return {
    id: generateId(CUSTOM_CATEGORY_PREFIX.slice(0, -1)),
    name,
    type,
    icon: 'Tag',
    color: CUSTOM_COLORS[hash % CUSTOM_COLORS.length],
    isCustom: true,
  };
}

/** Keeps only well-formed custom categories (from cloud or local storage). */
export function sanitizeCustomCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return [];
  const out: Category[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== 'string' || !r.id.startsWith(CUSTOM_CATEGORY_PREFIX)) continue;
    if (typeof r.name !== 'string' || !r.name.trim() || r.name.length > MAX_CATEGORY_NAME) continue;
    if (r.type !== 'income' && r.type !== 'expense') continue;
    out.push({
      id: r.id,
      name: r.name.trim(),
      type: r.type,
      icon: typeof r.icon === 'string' && r.icon ? r.icon : 'Tag',
      color: typeof r.color === 'string' && r.color ? r.color : CUSTOM_COLORS[0],
      isCustom: true,
    });
  }
  return out;
}

/** Keeps only well-formed budgets, one per category. */
export function sanitizeBudgets(raw: unknown): CategoryBudget[] {
  if (!Array.isArray(raw)) return [];
  const byCategory = new Map<string, CategoryBudget>();
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    if (typeof r.categoryId !== 'string' || !r.categoryId) continue;
    if (typeof r.amount !== 'number' || !Number.isFinite(r.amount) || r.amount <= 0 || r.amount > MAX_BUDGET_AMOUNT) continue;
    if (!VALID_CURRENCIES.includes(r.currency as CurrencyCode)) continue;
    byCategory.set(r.categoryId, {
      id: r.categoryId,
      categoryId: r.categoryId,
      amount: r.amount,
      currency: r.currency as CurrencyCode,
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : '',
    });
  }
  return [...byCategory.values()];
}

/**
 * Where entries go when their custom category is deleted: "Uncategorized" for
 * expenses, otherwise the first built-in category of the same type.
 */
export function pickReplacementCategory(categories: Category[], deleted: Category): Category | undefined {
  const sameType = categories.filter((c) => c.id !== deleted.id && c.type === deleted.type);
  if (deleted.type === 'expense') {
    const uncategorized = sameType.find((c) => c.id === 'cat-uncategorized');
    if (uncategorized) return uncategorized;
  }
  return sameType.find((c) => !c.isCustom) ?? sameType[0];
}

/** Built-in list plus custom categories (custom wins on id clashes, appended at the end). */
export function mergeCustomCategories(base: Category[], custom: Category[]): Category[] {
  const customIds = new Set(custom.map((c) => c.id));
  return [...base.filter((c) => !customIds.has(c.id)), ...custom];
}

export type BudgetStatus = 'ok' | 'warning' | 'over';

export interface BudgetProgress {
  budget: CategoryBudget;
  category: Category | undefined;
  spent: number; // in the budget's currency
  remaining: number; // negative when over
  percent: number; // 0..∞ (rounded)
  status: BudgetStatus;
}

/**
 * This calendar month's spending against each budget, in the budget's own currency.
 * Counts expenses in the budget's category on accounts that still exist.
 * 80%+ is a warning, 100%+ is over.
 */
export function computeBudgetProgress(
  budgets: CategoryBudget[],
  transactions: Transaction[],
  categories: Category[],
  rates: ExchangeRates,
  today: Date = new Date(),
  accounts?: Account[]
): BudgetProgress[] {
  const monthPrefix = localDateString(today).slice(0, 7);
  const accountIds = accounts ? new Set(accounts.map((a) => a.id)) : null;
  const spentByCategory = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.date.startsWith(monthPrefix)) continue;
    if (accountIds && !accountIds.has(tx.accountId)) continue;
    const list = spentByCategory.get(tx.categoryId);
    if (list) list.push(tx);
    else spentByCategory.set(tx.categoryId, [tx]);
  }

  return budgets.map((budget) => {
    const spent = (spentByCategory.get(budget.categoryId) ?? []).reduce(
      (sum, tx) => sum + convertCurrency(tx.amount, tx.currency, budget.currency, rates),
      0
    );
    const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
    return {
      budget,
      category: categories.find((c) => c.id === budget.categoryId),
      spent,
      remaining: budget.amount - spent,
      percent,
      status: percent >= 100 ? 'over' : percent >= 80 ? 'warning' : 'ok',
    };
  });
}
