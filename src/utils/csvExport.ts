/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Category, Transaction } from '../types/finance';

const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

export function sanitizeCsvText(value: unknown): string {
  const raw = String(value ?? '');
  const safe = FORMULA_PREFIX_RE.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function quoteCsvField(value: unknown): string {
  const raw = String(value ?? '');
  return `"${raw.replace(/"/g, '""')}"`;
}

export function buildTransactionsCsv(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[]
): string {
  const headers = [
    'ID',
    'Date',
    'Type',
    'Amount',
    'Currency',
    'Category',
    'Account',
    'Merchant',
    'Notes',
    'IsCharity',
  ];

  const rows = transactions.map((t) => {
    const cat = categories.find((c) => c.id === t.categoryId)?.name || '';
    const acc = accounts.find((a) => a.id === t.accountId)?.name || '';
    return [
      sanitizeCsvText(t.id),
      sanitizeCsvText(t.date),
      sanitizeCsvText(t.type),
      quoteCsvField(t.amount),
      sanitizeCsvText(t.currency),
      sanitizeCsvText(cat),
      sanitizeCsvText(acc),
      sanitizeCsvText(t.merchant || ''),
      sanitizeCsvText(t.notes || ''),
      sanitizeCsvText(t.isCharity ? 'Yes' : 'No'),
    ].join(',');
  });

  return '\uFEFF' + [headers.map(quoteCsvField).join(','), ...rows].join('\n');
}
