/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CurrencyCode = 'USD' | 'EUR' | 'KRW' | 'PKR';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';

export interface ExchangeRates {
  USD: number;
  EUR: number;
  KRW: number;
  PKR: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isCharity?: boolean;
  /** Created by the user (synced via users/{uid}/categories); built-in categories omit this. */
  isCustom?: boolean;
}

/** Monthly spending limit for one expense category (synced via users/{uid}/budgets/{categoryId}). */
export interface CategoryBudget {
  id: string; // same as categoryId (one budget per category)
  categoryId: string;
  amount: number;
  currency: CurrencyCode;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  balance: number; // Opening/base balance
  creditLimit?: number;
  institution: string; // e.g., Shinhan Bank, KakaoBank, Hana Bank, Toss Bank
  accountNumber?: string; // e.g., •••• 4921
  bankCode?: string; // e.g., shinhan, kakao, toss, hana, kb, woori
  icon: string;
  color: string;
  isArchived?: boolean;
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  toAmount?: number; // Destination received amount for cross-currency transfers
  currency: CurrencyCode;
  date: string; // YYYY-MM-DD
  categoryId: string;
  accountId: string;
  toAccountId?: string; // For transfers
  merchant?: string;
  notes?: string;
  receiptItems?: ReceiptItem[];
  isCharity?: boolean;
  charityPledgeId?: string;
  savingsGoalId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PledgeStatus = 'pending' | 'partially_fulfilled' | 'fulfilled';

export interface CharityPledge {
  id: string;
  title: string;
  cause: string;
  pledgedAmount: number;
  currency: CurrencyCode;
  fulfilledAmount: number;
  dueDate?: string;
  notes?: string;
  status: PledgeStatus;
  createdAt: string;
  updatedAt: string;
}

export type SavingsGoalStatus = 'active' | 'partially_saved' | 'completed';

export interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currency: CurrencyCode;
  savedAmount: number;
  targetDate?: string;
  notes?: string;
  status: SavingsGoalStatus;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'light' | 'dark';

/** What the user picked; 'system' follows the device's light/dark setting. */
export type ThemePreference = ThemeMode | 'system';

export type StudentNavTab = 'pockets' | 'scanner' | 'activity';
