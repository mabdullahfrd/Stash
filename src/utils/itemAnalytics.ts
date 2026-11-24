/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, CurrencyCode, ExchangeRates, Transaction } from '../types/finance';
import { convertCurrency, roundCurrencyAmount } from './currencies';
import { getFallbackCategory, inferCategoryForItem } from './autoCategorize';
import { localDateString } from './dates';

export type AnalyticsTimeRange = 'all' | 'month' | '7d';

export interface ItemSpendingDetail {
  id: string;
  itemName: string;
  normalizedKey: string;
  categoryId: string;
  categoryName: string;
  amount: number; // converted to targetCurrency
  count: number;
  avgAmount: number;
  sharePercent: number;
  accountIds: string[];
  lastDate: string;
}

export interface CategoryItemBreakdown {
  categoryId: string;
  categoryName: string;
  category?: Category;
  totalAmount: number;
  itemCount: number;
  sharePercent: number;
  topItems: ItemSpendingDetail[];
}

export interface ItemAnalyticsSummary {
  totalSpent: number;
  totalItemCount: number;
  categoryBreakdowns: CategoryItemBreakdown[];
  itemGroups: ItemSpendingDetail[];
}

function normalizeItemLabel(rawName: string): { key: string; display: string } {
  const cleaned = rawName
    .replace(/\([^)]*\)/g, '') // strip parenthetical Korean/English alt subtitles for grouping
    .replace(/\s+\d+(pk|g|kg|ml|l|구|개|잔|hrs?)\b/gi, '')
    .trim();

  const base = cleaned || rawName.trim() || 'General Item';
  const lower = base.toLowerCase();

  // Group common recurring item types cleanly
  if (lower.includes('latte') || lower.includes('라떼')) return { key: 'latte', display: 'Latte' };
  if (lower.includes('americano') || lower.includes('아메리카노')) return { key: 'americano', display: 'Americano' };
  if (lower.includes('coffee') || lower.includes('커피') || lower.includes('starbucks') || lower.includes('mega')) {
    return { key: 'coffee', display: 'Coffee & Cafe' };
  }
  if (lower.includes('egg') || lower.includes('계란') || lower.includes('특란')) return { key: 'eggs', display: 'Eggs' };
  if (lower.includes('bread') || lower.includes('식빵') || lower.includes('빵')) return { key: 'bread', display: 'Bread & Bakery' };
  if (lower.includes('milk') || lower.includes('우유')) return { key: 'milk', display: 'Milk & Dairy' };
  if (lower.includes('ice cream') || lower.includes('baskin') || lower.includes('haagen') || lower.includes('아이스크림') || lower.includes('메로나')) {
    return { key: 'ice-cream', display: 'Ice Cream & Frozen' };
  }
  if (lower.includes('subway') || lower.includes('metro') || lower.includes('bus') || lower.includes('t-money') || lower.includes('지하철') || lower.includes('버스') || lower.includes('티머니')) {
    return { key: 'transit', display: 'Subway / Bus Transit' };
  }
  if (lower.includes('zakat') || lower.includes('charity') || lower.includes('sadaqah') || lower.includes('기부')) {
    return { key: 'charity', display: 'Charity & Zakat' };
  }

  return { key: lower, display: base };
}

function resolveCategoryForReceiptItem(
  itemName: string,
  itemCategoryLabel: string,
  fallbackCategoryId: string,
  categories: Category[]
): Category | undefined {
  const normalizedLabel = itemCategoryLabel.trim().toLowerCase();

  // Exact or close match first (excluding legacy merged label so it splits accurately)
  if (normalizedLabel && normalizedLabel !== 'ice cream & treats') {
    const byLabel = categories.find(
      (c) =>
        c.type === 'expense' &&
        (c.name.toLowerCase() === normalizedLabel ||
          c.name.toLowerCase().includes(normalizedLabel) ||
          normalizedLabel.includes(c.name.toLowerCase()))
    );
    if (byLabel) return byLabel;
  }

  // Infer from itemName first so legacy 'Ice Cream & Treats' items split cleanly
  const inferredByName = inferCategoryForItem(itemName, categories, 'expense');
  if (inferredByName) {
    return categories.find((c) => c.id === inferredByName.categoryId);
  }

  if (normalizedLabel === 'ice cream & treats') {
    return (
      categories.find((c) => c.id === 'cat-icecream') ||
      categories.find((c) => c.id === 'cat-treats')
    );
  }

  const inferred = inferCategoryForItem(`${itemName} ${itemCategoryLabel}`, categories, 'expense');
  if (inferred) {
    return categories.find((c) => c.id === inferred.categoryId);
  }

  return categories.find((c) => c.id === fallbackCategoryId);
}

export function computeItemTypeAnalytics(
  transactions: Transaction[],
  categories: Category[],
  targetCurrency: CurrencyCode,
  rates: ExchangeRates,
  options?: {
    timeRange?: AnalyticsTimeRange;
    referenceDate?: string; // YYYY-MM-DD
    accountIdFilter?: string | null;
  }
): ItemAnalyticsSummary {
  const timeRange = options?.timeRange || 'all';
  const refDateStr = options?.referenceDate || localDateString();
  const refDate = new Date(refDateStr);
  const currentMonthPrefix = refDateStr.slice(0, 7);

  const rawEntries: Array<{
    itemName: string;
    categoryId: string;
    categoryName: string;
    amount: number;
    accountId: string;
    date: string;
  }> = [];

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (options?.accountIdFilter && tx.accountId !== options.accountIdFilter) continue;

    const txDate = tx.date || tx.createdAt.split('T')[0];
    if (timeRange === 'month' && !txDate.startsWith(currentMonthPrefix)) {
      continue;
    }
    if (timeRange === '7d') {
      const diffMs = refDate.getTime() - new Date(txDate).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 7 || diffDays < -1) continue;
    }

    const txTotalConverted = convertCurrency(tx.amount, tx.currency, targetCurrency, rates);

    if (tx.receiptItems && tx.receiptItems.length > 0) {
      const receiptSum = tx.receiptItems.reduce((s, it) => s + Math.max(0, it.price), 0);
      // Scale itemized prices proportionally if transaction amount differs slightly (e.g., discounts/fees)
      const scale = receiptSum > 0 ? txTotalConverted / convertCurrency(receiptSum, tx.currency, targetCurrency, rates) : 1;

      for (const it of tx.receiptItems) {
        const cat = resolveCategoryForReceiptItem(it.name, it.category, tx.categoryId, categories);
        const fallbackCat = getFallbackCategory(categories, 'expense');
        const itemAmount = roundCurrencyAmount(
          convertCurrency(it.price, tx.currency, targetCurrency, rates) * scale,
          targetCurrency
        );
        if (itemAmount <= 0) continue;

        rawEntries.push({
          itemName: it.name,
          categoryId: cat?.id || tx.categoryId || fallbackCat.id,
          categoryName: cat?.name || it.category || fallbackCat.name,
          amount: itemAmount,
          accountId: tx.accountId,
          date: txDate,
        });
      }
    } else {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const fallbackCat = getFallbackCategory(categories, 'expense');
      rawEntries.push({
        itemName: tx.merchant || cat?.name || 'Expense',
        categoryId: cat?.id || tx.categoryId || fallbackCat.id,
        categoryName: cat?.name || fallbackCat.name,
        amount: txTotalConverted,
        accountId: tx.accountId,
        date: txDate,
      });
    }
  }

  const totalSpent = rawEntries.reduce((sum, e) => sum + e.amount, 0);

  // Aggregate by normalized item group (within category)
  const itemGroupMap = new Map<
    string,
    {
      display: string;
      normalizedKey: string;
      categoryId: string;
      categoryName: string;
      amount: number;
      count: number;
      accountIds: Set<string>;
      lastDate: string;
    }
  >();

  for (const entry of rawEntries) {
    const { key, display } = normalizeItemLabel(entry.itemName);
    const mapKey = `${entry.categoryId}::${key}`;
    const existing = itemGroupMap.get(mapKey);

    if (existing) {
      existing.amount += entry.amount;
      existing.count += 1;
      existing.accountIds.add(entry.accountId);
      if (entry.date > existing.lastDate) existing.lastDate = entry.date;
    } else {
      itemGroupMap.set(mapKey, {
        display,
        normalizedKey: key,
        categoryId: entry.categoryId,
        categoryName: entry.categoryName,
        amount: entry.amount,
        count: 1,
        accountIds: new Set([entry.accountId]),
        lastDate: entry.date,
      });
    }
  }

  const itemGroups: ItemSpendingDetail[] = Array.from(itemGroupMap.entries())
    .map(([id, g]) => ({
      id,
      itemName: g.display,
      normalizedKey: g.normalizedKey,
      categoryId: g.categoryId,
      categoryName: g.categoryName,
      amount: g.amount,
      count: g.count,
      avgAmount: Math.round(g.amount / Math.max(1, g.count)),
      sharePercent: totalSpent > 0 ? Math.round((g.amount / totalSpent) * 100) : 0,
      accountIds: Array.from(g.accountIds),
      lastDate: g.lastDate,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Aggregate by category
  const catMap = new Map<string, { categoryName: string; totalAmount: number; itemCount: number }>();
  for (const entry of rawEntries) {
    const existing = catMap.get(entry.categoryId);
    if (existing) {
      existing.totalAmount += entry.amount;
      existing.itemCount += 1;
    } else {
      catMap.set(entry.categoryId, {
        categoryName: entry.categoryName,
        totalAmount: entry.amount,
        itemCount: 1,
      });
    }
  }

  const categoryBreakdowns: CategoryItemBreakdown[] = Array.from(catMap.entries())
    .map(([catId, data]) => ({
      categoryId: catId,
      categoryName: data.categoryName,
      category: categories.find((c) => c.id === catId),
      totalAmount: data.totalAmount,
      itemCount: data.itemCount,
      sharePercent: totalSpent > 0 ? Math.round((data.totalAmount / totalSpent) * 100) : 0,
      topItems: itemGroups.filter((g) => g.categoryId === catId),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    totalSpent,
    totalItemCount: rawEntries.length,
    categoryBreakdowns,
    itemGroups,
  };
}
