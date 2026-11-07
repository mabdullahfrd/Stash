/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Category, CharityPledge, Transaction } from '../types/finance';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-krw-main',
    name: 'Shinhan Main Checking',
    type: 'checking',
    currency: 'KRW',
    balance: 4999000,
    institution: 'Shinhan Bank (신한)',
    color: '#007AFF',
    icon: 'Building2',
  },
  {
    id: 'acc-krw-savings',
    name: 'KakaoBank Emergency Vault',
    type: 'savings',
    currency: 'KRW',
    balance: 1650000,
    institution: 'KakaoBank (카카오)',
    color: '#FFCC00',
    icon: 'PiggyBank',
  },
  {
    id: 'acc-krw-cash',
    name: 'Cash in Wallet',
    type: 'cash',
    currency: 'KRW',
    balance: 85000,
    institution: 'Physical Wallet (지갑)',
    color: '#34C759',
    icon: 'Wallet',
  },
  {
    id: 'acc-global-pocket',
    name: 'Global Multi-Currency Pocket',
    type: 'checking',
    currency: 'USD',
    balance: 350.0,
    institution: 'Revolut / Shinhan Global',
    color: '#AF52DE',
    icon: 'Landmark',
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
  { id: 'cat-charity', name: 'Charity & Giving', type: 'expense', icon: 'HeartHandshake', color: '#34C759', isCharity: true },
  { id: 'cat-transfer', name: 'Pocket Transfer', type: 'expense', icon: 'ArrowLeftRight', color: '#8E8E93' },
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
  {
    id: 'pledge-sadaqah-meals',
    title: 'Local Student Food Aid',
    cause: 'Food Aid',
    pledgedAmount: 70000,
    currency: 'KRW',
    fulfilledAmount: 30000,
    dueDate: '2026-11-15',
    notes: 'Providing hot meals and emergency food packages.',
    status: 'partially_fulfilled',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-02',
  },
  {
    id: 'pledge-winter-warmth',
    title: 'Winter Warmth Relief',
    cause: 'Sadaqah',
    pledgedAmount: 100000,
    currency: 'KRW',
    fulfilledAmount: 50000,
    dueDate: '2026-12-01',
    notes: 'Warm blankets and cold-weather clothing relief.',
    status: 'partially_fulfilled',
    createdAt: '2026-10-28',
    updatedAt: '2026-11-01',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Placement Income
  {
    id: 'tx-p1',
    type: 'income',
    amount: 2100000,
    currency: 'KRW',
    date: '2026-11-01',
    categoryId: 'cat-placement',
    accountId: 'acc-krw-main',
    merchant: 'Engineering Placement Stipend',
    notes: 'Monthly university work placement stipend',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-01T09:00:00Z',
  },
  // Itemized Groceries with Receipt Scanner allotment!
  {
    id: 'tx-s1',
    type: 'expense',
    amount: 24500,
    currency: 'KRW',
    date: '2026-11-02',
    categoryId: 'cat-groceries',
    accountId: 'acc-krw-main',
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
  // Coffee run
  {
    id: 'tx-s2',
    type: 'expense',
    amount: 4500,
    currency: 'KRW',
    date: '2026-11-03',
    categoryId: 'cat-coffee',
    accountId: 'acc-krw-main',
    merchant: 'Mega Coffee (메가커피)',
    notes: 'Vanilla Latte study break',
    createdAt: '2026-11-03T10:30:00Z',
    updatedAt: '2026-11-03T10:30:00Z',
  },
  // Ice cream treat
  {
    id: 'tx-s3',
    type: 'expense',
    amount: 5200,
    currency: 'KRW',
    date: '2026-11-03',
    categoryId: 'cat-icecream',
    accountId: 'acc-krw-main',
    merchant: 'Baskin Robbins (배스킨라빈스)',
    notes: 'Single regular scoop treat',
    createdAt: '2026-11-03T19:45:00Z',
    updatedAt: '2026-11-03T19:45:00Z',
  },
  // Tutoring income
  {
    id: 'tx-s4',
    type: 'income',
    amount: 120000,
    currency: 'KRW',
    date: '2026-11-03',
    categoryId: 'cat-tutoring',
    accountId: 'acc-krw-main',
    merchant: 'Peer Tutoring (2 hrs)',
    notes: 'Math & engineering tutoring session',
    createdAt: '2026-11-03T17:00:00Z',
    updatedAt: '2026-11-03T17:00:00Z',
  },
  // Charity distribution
  {
    id: 'tx-s5',
    type: 'expense',
    amount: 100000,
    currency: 'KRW',
    date: '2026-11-04',
    categoryId: 'cat-charity',
    accountId: 'acc-krw-main',
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
