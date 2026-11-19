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

export type ThemeMode = 'light' | 'dark';

export type StudentNavTab = 'pockets' | 'scanner' | 'activity';
