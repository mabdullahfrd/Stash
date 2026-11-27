/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import {
  Account,
  Category,
  CategoryBudget,
  CharityPledge,
  CurrencyCode,
  SavingsGoal,
  Transaction,
} from '../types/finance';

const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'KRW', 'PKR']);

const AccountSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(120),
  type: z.enum(['checking', 'savings', 'credit', 'cash']),
  currency: CurrencyCodeSchema,
  balance: z.number().finite(),
  creditLimit: z.number().finite().nonnegative().optional(),
  institution: z.string().min(1).max(120),
  accountNumber: z.string().max(60).optional(),
  bankCode: z.string().max(40).optional(),
  icon: z.string().min(1).max(60),
  color: z.string().min(1).max(32),
  isArchived: z.boolean().optional(),
});

const ReceiptItemSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(200),
  price: z.number().finite().nonnegative(),
  category: z.string().min(1).max(120),
});

const TransactionSchema = z.object({
  id: z.string().min(1).max(128),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().finite().positive(),
  toAmount: z.number().finite().positive().optional(),
  currency: CurrencyCodeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.string().min(1).max(128),
  accountId: z.string().min(1).max(128),
  toAccountId: z.string().min(1).max(128).optional(),
  merchant: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  receiptItems: z.array(ReceiptItemSchema).optional(),
  isCharity: z.boolean().optional(),
  charityPledgeId: z.string().max(128).optional(),
  savingsGoalId: z.string().max(128).optional(),
  createdAt: z.string().min(1).max(64),
  updatedAt: z.string().min(1).max(64),
});

const CategorySchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(120),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1).max(60),
  color: z.string().min(1).max(32),
  isCharity: z.boolean().optional(),
  isCustom: z.boolean().optional(),
});

const BudgetSchema = z.object({
  id: z.string().min(1).max(128),
  categoryId: z.string().min(1).max(128),
  amount: z.number().finite().positive(),
  currency: CurrencyCodeSchema,
  updatedAt: z.string().max(64).default(''),
});

const CharityPledgeSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(160),
  cause: z.string().min(1).max(120),
  pledgedAmount: z.number().finite().positive(),
  currency: CurrencyCodeSchema,
  fulfilledAmount: z.number().finite().nonnegative(),
  dueDate: z.string().max(32).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['pending', 'partially_fulfilled', 'fulfilled']),
  createdAt: z.string().min(1).max(64),
  updatedAt: z.string().min(1).max(64),
});

const SavingsGoalSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(160),
  category: z.string().min(1).max(120),
  targetAmount: z.number().finite().positive(),
  currency: CurrencyCodeSchema,
  savedAmount: z.number().finite().nonnegative(),
  targetDate: z.string().max(32).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['active', 'partially_saved', 'completed']),
  createdAt: z.string().min(1).max(64),
  updatedAt: z.string().min(1).max(64),
});

export const BackupPayloadSchema = z.object({
  accounts: z.array(AccountSchema),
  transactions: z.array(TransactionSchema),
  categories: z.array(CategorySchema).optional(),
  charityPledges: z.array(CharityPledgeSchema),
  savingsGoals: z.array(SavingsGoalSchema).default([]),
  budgets: z.array(BudgetSchema).default([]),
  primaryCurrency: CurrencyCodeSchema.optional(),
});

export interface ValidatedBackupData {
  accounts: Account[];
  transactions: Transaction[];
  categories?: Category[];
  charityPledges: CharityPledge[];
  savingsGoals?: SavingsGoal[];
  budgets?: CategoryBudget[];
  primaryCurrency?: CurrencyCode;
}

export function parseBackupJson(
  jsonString: string
): { ok: true; data: ValidatedBackupData } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    return { ok: false, error: 'Selected file is not valid JSON.' };
  }

  const parsed = BackupPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const pathLabel = firstIssue?.path?.join('.') || 'backup';
    return {
      ok: false,
      error: `Invalid backup format near "${pathLabel}": ${firstIssue?.message || 'validation failed'}.`,
    };
  }

  return {
    ok: true,
    data: parsed.data as ValidatedBackupData,
  };
}
