/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Category, CharityPledge, Transaction } from '../types/finance';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-krw-hana',
    name: 'Hana 1Q Checking',
    type: 'checking',
    currency: 'KRW',
    balance: 4999000,
    institution: 'Hana Bank (하나은행)',
    accountNumber: '•••• 4921',
    bankCode: 'hana',
    color: '#008485',
    icon: 'Building2',
  },
  {
    id: 'acc-krw-toss',
    name: 'Toss Bank Account',
    type: 'checking',
    currency: 'KRW',
    balance: 620000,
    institution: 'Toss Bank (토스뱅크)',
    accountNumber: '•••• 1044',
    bankCode: 'toss',
    color: '#0064FF',
    icon: 'Sparkles',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  // Income
  { id: 'cat-placement', name: 'Work Placement & Salary', type: 'income', icon: 'Briefcase', color: '#34C759' },
  { id: 'cat-tutoring', name: 'Tutoring & Campus Job', type: 'income', icon: 'GraduationCap', color: '#007AFF' },
  { id: 'cat-allowance', name: 'Allowance & Inflow', type: 'income', icon: 'Heart', color: '#FF2D55' },

  // Expenses
  { id: 'cat-groceries', name: 'Groceries (Eggs, Bread, Milk)', type: 'expense', icon: 'ShoppingCart', color: '#34C759' },
  { id: 'cat-coffee', name: 'Coffee & Drinks', type: 'expense', icon: 'Coffee', color: '#FF9500' },
  { id: 'cat-icecream', name: 'Ice Cream & Treats', type: 'expense', icon: 'IceCream', color: '#FF2D55' },
  { id: 'cat-dining', name: 'Dining & Takeout', type: 'expense', icon: 'Utensils', color: '#AF52DE' },
  { id: 'cat-study', name: 'Study & Uni Gear', type: 'expense', icon: 'BookOpen', color: '#5856D6' },
  { id: 'cat-transit', name: 'Transit & Metro', type: 'expense', icon: 'Bus', color: '#007AFF' },
  { id: 'cat-bills', name: 'Bills & Rent', type: 'expense', icon: 'Receipt', color: '#64748B' },
  { id: 'cat-subscriptions', name: 'Subscriptions', type: 'expense', icon: 'Repeat', color: '#0EA5E9' },
  { id: 'cat-health', name: 'Health', type: 'expense', icon: 'Stethoscope', color: '#10B981' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
  { id: 'cat-charity', name: 'Charity & Giving', type: 'expense', icon: 'HeartHandshake', color: '#34C759', isCharity: true },
  { id: 'cat-uncategorized', name: 'Uncategorized', type: 'expense', icon: 'Tag', color: '#8E8E93' },
];

export const INITIAL_CHARITY_PLEDGES: CharityPledge[] = [
  {
    id: 'pledge-zakat-korea',
    title: 'Student Zakat & Purification',
    cause: 'Zakat',
    pledgedAmount: 250000,
    currency: 'KRW',
    fulfilledAmount: 100000,
    dueDate: '2026-11-25',
    notes: '2.5% calculated on net liquid savings and placement earnings in Korea.',
    status: 'partially_fulfilled',
    createdAt: '2026-10-25',
    updatedAt: '2026-11-01',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Placement Income into Hana Bank
  {
    id: 'tx-p1',
    type: 'income',
    amount: 2100000,
    currency: 'KRW',
    date: '2026-11-01',
    categoryId: 'cat-placement',
    accountId: 'acc-krw-hana',
    merchant: 'Engineering Placement Stipend',
    notes: 'Monthly university work placement stipend',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-01T09:00:00Z',
  },
  // Itemized Groceries paid via Toss Bank
  {
    id: 'tx-s1',
    type: 'expense',
    amount: 18000,
    currency: 'KRW',
    date: '2026-11-02',
    categoryId: 'cat-groceries',
    accountId: 'acc-krw-toss',
    merchant: 'Emart Everyday (이마트 에브리데이)',
    notes: 'Itemized scanned receipt: eggs, sourdough bread, iced latte & ice cream',
    receiptItems: [
      { id: 'item-1', name: 'Grade-A Eggs 10pk (신선 특란)', price: 4500, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: 'item-2', name: 'Milk Toast Sourdough (우유 식빵)', price: 3800, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: 'item-3', name: 'Cold Brew Oat Latte (콜드브루 라떼)', price: 5500, category: 'Coffee & Drinks' },
      { id: 'item-4', name: 'Haagen-Dazs Vanilla Cup (하겐다즈)', price: 4200, category: 'Ice Cream & Treats' },
    ],
    createdAt: '2026-11-02T14:15:00Z',
    updatedAt: '2026-11-02T14:15:00Z',
  },
  // Coffee run via Toss Bank
  {
    id: 'tx-s2',
    type: 'expense',
    amount: 4500,
    currency: 'KRW',
    date: '2026-11-03',
    categoryId: 'cat-coffee',
    accountId: 'acc-krw-toss',
    merchant: 'Mega Coffee Vanilla Latte (메가커피)',
    notes: 'Vanilla Latte study break',
    createdAt: '2026-11-03T10:30:00Z',
    updatedAt: '2026-11-03T10:30:00Z',
  },
  // Ice cream treat via Toss Bank
  {
    id: 'tx-s3',
    type: 'expense',
    amount: 5200,
    currency: 'KRW',
    date: '2026-11-03',
    categoryId: 'cat-icecream',
    accountId: 'acc-krw-toss',
    merchant: 'Baskin Robbins (배스킨라빈스)',
    notes: 'Single regular scoop treat',
    createdAt: '2026-11-03T19:45:00Z',
    updatedAt: '2026-11-03T19:45:00Z',
  },
  // Tutoring income into Hana Bank
  {
    id: 'tx-s4',
    type: 'income',
    amount: 120000,
    currency: 'KRW',
    date: '2026-11-03',
    categoryId: 'cat-tutoring',
    accountId: 'acc-krw-hana',
    merchant: 'Peer Tutoring (2 hrs)',
    notes: 'Math & engineering tutoring session',
    createdAt: '2026-11-03T17:00:00Z',
    updatedAt: '2026-11-03T17:00:00Z',
  },
  // Charity distribution from Hana Bank
  {
    id: 'tx-s5',
    type: 'expense',
    amount: 100000,
    currency: 'KRW',
    date: '2026-11-04',
    categoryId: 'cat-charity',
    accountId: 'acc-krw-hana',
    merchant: 'Student Zakat Tranche',
    notes: 'Student Zakat fulfillment tranche',
    isCharity: true,
    charityPledgeId: 'pledge-zakat-korea',
    createdAt: '2026-11-04T11:00:00Z',
    updatedAt: '2026-11-04T11:00:00Z',
  },
];

// Backwards compatibility alias
export const STUDENT_ACCOUNTS = INITIAL_ACCOUNTS;
export const STUDENT_CATEGORIES = INITIAL_CATEGORIES;
export const STUDENT_CHARITY_PLEDGES = INITIAL_CHARITY_PLEDGES;
export const STUDENT_TRANSACTIONS = INITIAL_TRANSACTIONS;
