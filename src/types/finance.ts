/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CurrencyCode = 'USD' | 'EUR' | 'KRW' | 'PKR';

export type AccountType = 'checking' | 'savings' | 'cash' | 'credit';
export type ThemeMode = 'light' | 'dark';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  balance: number;
  creditLimit?: number;
  institution: string;
  color: string;
  icon: string;
  isArchived?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  currency: CurrencyCode;
  period: 'monthly' | 'weekly';
  warningThresholdPercent: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  category: string; // e.g. "Groceries", "Coffee & Drinks", "Ice Cream & Treats"
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  date: string; // YYYY-MM-DD
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  merchant?: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string; // base64 or photo URL
  isCharity?: boolean;
  charityPledgeId?: string;
  receiptItems?: ReceiptItem[]; // Itemized allotment from receipt scan!
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isCharity?: boolean;
}

export type CharityStatus = 'pending' | 'partially_fulfilled' | 'fulfilled';

export interface CharityPledge {
  id: string;
  title: string;
  cause: string;
  pledgedAmount: number;
  currency: CurrencyCode;
  fulfilledAmount: number;
  dueDate?: string;
  notes?: string;
  status: CharityStatus;
  createdAt: string;
  updatedAt: string;
}

export type StudentNavTab = 'pockets' | 'scanner' | 'activity' | 'charity';

export type ExchangeRates = Record<CurrencyCode, number>;
