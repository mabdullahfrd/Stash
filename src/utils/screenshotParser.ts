/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Category, TransactionType } from '../types/finance';
import { inferCategoryForItem } from './autoCategorize';

export interface RawBankScreenshotEntry {
  merchant: string;
  amount: number;
  type?: TransactionType;
  date?: string;
  category?: string;
  notes?: string;
}

export interface ParsedBankScreenshotItem {
  id: string;
  merchant: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  categoryId: string;
  categoryName: string;
  notes?: string;
  isCharity: boolean;
  selected: boolean;
}

export function detectBankAccountFromHint(
  bankHint: string | undefined,
  accounts: Account[]
): string {
  if (!accounts.length) return '';
  const hint = (bankHint || '').toLowerCase();

  if (hint.includes('toss') || hint.includes('토스')) {
    const tossAcc = accounts.find(
      (a) =>
        a.bankCode === 'toss' ||
        a.name.toLowerCase().includes('toss') ||
        a.institution.toLowerCase().includes('toss') ||
        a.institution.includes('토스')
    );
    if (tossAcc) return tossAcc.id;
  }

  if (hint.includes('hana') || hint.includes('하나')) {
    const hanaAcc = accounts.find(
      (a) =>
        a.bankCode === 'hana' ||
        a.name.toLowerCase().includes('hana') ||
        a.institution.toLowerCase().includes('hana') ||
        a.institution.includes('하나')
    );
    if (hanaAcc) return hanaAcc.id;
  }

  return accounts[0].id;
}

export function normalizeParsedBankEntries(
  rawEntries: RawBankScreenshotEntry[],
  categories: Category[],
  fallbackDate?: string
): ParsedBankScreenshotItem[] {
  const defaultDate = fallbackDate || new Date().toISOString().split('T')[0];

  return rawEntries
    .map((raw, idx): ParsedBankScreenshotItem | null => {
      const cleanMerchant = (raw.merchant || '').trim();
      const absAmount = Math.round(Math.abs(Number(raw.amount)));
      if (!cleanMerchant || !Number.isFinite(absAmount) || absAmount <= 0) {
        return null;
      }

      const txType: 'expense' | 'income' = raw.type === 'income' ? 'income' : 'expense';
      const normalizedDate =
        raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())
          ? raw.date.trim()
          : defaultDate;

      // First run keyword auto-categorizer on merchant + raw category hint
      const inferred = inferCategoryForItem(
        `${cleanMerchant} ${raw.category || ''}`,
        categories,
        txType
      );

      let matchedCategory = inferred
        ? categories.find((c) => c.id === inferred.categoryId)
        : undefined;

      if (!matchedCategory && raw.category) {
        const rawCatLower = raw.category.toLowerCase();
        matchedCategory = categories.find(
          (c) =>
            c.type === txType &&
            (c.name.toLowerCase().includes(rawCatLower) ||
              rawCatLower.includes(c.name.toLowerCase()))
        );
      }

      if (!matchedCategory) {
        matchedCategory =
          categories.find((c) => c.type === txType) || categories[0];
      }

      const item: ParsedBankScreenshotItem = {
        id: `toss-imp-${Date.now()}-${idx}`,
        merchant: cleanMerchant,
        amount: absAmount,
        type: txType,
        date: normalizedDate,
        categoryId: matchedCategory.id,
        categoryName: matchedCategory.name,
        isCharity: Boolean(matchedCategory.isCharity || inferred?.isCharity),
        selected: true,
      };
      if (raw.notes?.trim()) {
        item.notes = raw.notes.trim();
      }
      return item;
    })
    .filter((item): item is ParsedBankScreenshotItem => item !== null);
}
