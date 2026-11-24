/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Category, CurrencyCode, Transaction, TransactionType } from '../types/finance';
import { getFallbackCategory, inferCategoryForItem } from './autoCategorize';
import { roundCurrencyAmount } from './currencies';
import { isValidDateString, localDateString } from './dates';
import { generateId } from './storage';

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
  isDuplicate: boolean;
  selected: boolean;
}

export function normalizeMerchantKey(value: string | undefined): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
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

export function markDuplicateParsedEntries(
  entries: ParsedBankScreenshotItem[],
  accountId: string,
  existingTransactions: Transaction[]
): ParsedBankScreenshotItem[] {
  if (!accountId || existingTransactions.length === 0) {
    return entries.map((e) => ({ ...e, isDuplicate: false }));
  }

  const existingKeys = new Set(
    existingTransactions
      .filter((tx) => tx.accountId === accountId)
      .map(
        (tx) =>
          `${tx.accountId}::${tx.date}::${tx.amount}::${normalizeMerchantKey(tx.merchant)}`
      )
  );

  return entries.map((entry) => {
    const key = `${accountId}::${entry.date}::${entry.amount}::${normalizeMerchantKey(
      entry.merchant
    )}`;
    const isDuplicate = existingKeys.has(key);
    return {
      ...entry,
      isDuplicate,
      selected: isDuplicate ? false : entry.selected,
    };
  });
}

export function normalizeParsedBankEntries(
  rawEntries: RawBankScreenshotEntry[],
  categories: Category[],
  fallbackDate?: string,
  currency: CurrencyCode = 'KRW',
  accountId: string = '',
  existingTransactions: Transaction[] = []
): ParsedBankScreenshotItem[] {
  const defaultDate = fallbackDate || localDateString();

  const normalized = rawEntries
    .map((raw): ParsedBankScreenshotItem | null => {
      const cleanMerchant = (raw.merchant || '').trim();
      const absAmount = roundCurrencyAmount(Math.abs(Number(raw.amount)), currency);
      if (!cleanMerchant || !Number.isFinite(absAmount) || absAmount <= 0) {
        return null;
      }

      const txType: 'expense' | 'income' = raw.type === 'income' ? 'income' : 'expense';
      const normalizedDate =
        isValidDateString(raw.date)
          ? raw.date.trim()
          : defaultDate;

      const rawCatLower = (raw.category || '').trim().toLowerCase();
      const isLegacyMergedCategory =
        rawCatLower === 'ice cream & treats' || rawCatLower === 'coffee & drinks';

      // First run keyword auto-categorizer on merchant (+ non-legacy category hint)
      const inferred = inferCategoryForItem(
        isLegacyMergedCategory ? cleanMerchant : `${cleanMerchant} ${raw.category || ''}`,
        categories,
        txType
      );

      let matchedCategory = inferred
        ? categories.find((c) => c.id === inferred.categoryId)
        : undefined;

      if (!matchedCategory && raw.category) {
        matchedCategory = categories.find(
          (c) =>
            c.type === txType &&
            (c.name.toLowerCase().includes(rawCatLower) ||
              rawCatLower.includes(c.name.toLowerCase()))
        );
      }

      if (!matchedCategory) {
        matchedCategory = getFallbackCategory(categories, txType);
      }

      const item: ParsedBankScreenshotItem = {
        id: generateId('imp'),
        merchant: cleanMerchant,
        amount: absAmount,
        type: txType,
        date: normalizedDate,
        categoryId: matchedCategory.id,
        categoryName: matchedCategory.name,
        isCharity: Boolean(matchedCategory.isCharity || inferred?.isCharity),
        isDuplicate: false,
        selected: true,
      };
      if (raw.notes?.trim()) {
        item.notes = raw.notes.trim();
      }
      return item;
    })
    .filter((item): item is ParsedBankScreenshotItem => item !== null);

  return markDuplicateParsedEntries(normalized, accountId, existingTransactions);
}
