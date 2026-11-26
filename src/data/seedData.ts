/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Category, CharityPledge, SavingsGoal, Transaction } from '../types/finance';
import { localDateString, shiftLocalDate } from '../utils/dates';

/**
 * Demo dates are relative to today so the demo always looks current
 * (recent spending in the 7-day chart, upcoming goal and pledge deadlines).
 * Positive = days ago, negative = days from now.
 */
const demoToday = new Date();
function demoDate(daysAgo: number): string {
  return localDateString(shiftLocalDate(demoToday, daysAgo));
}
function demoTimestamp(daysAgo: number, time: string): string {
  return `${demoDate(daysAgo)}T${time}:00`;
}

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
  { id: 'cat-freelance', name: 'Freelance & Side Gig', type: 'income', icon: 'Laptop', color: '#5856D6' },
  { id: 'cat-scholarship', name: 'Scholarship & Grants', type: 'income', icon: 'Award', color: '#0EA5E9' },
  { id: 'cat-investments', name: 'Interest & Dividends', type: 'income', icon: 'TrendingUp', color: '#10B981' },
  { id: 'cat-refunds', name: 'Refunds & Cashback', type: 'income', icon: 'RotateCcw', color: '#F59E0B' },

  // Expenses
  { id: 'cat-groceries', name: 'Groceries (Eggs, Bread, Milk)', type: 'expense', icon: 'ShoppingCart', color: '#34C759' },
  { id: 'cat-coffee', name: 'Coffee', type: 'expense', icon: 'Coffee', color: '#FF9500' },
  { id: 'cat-drinks', name: 'Drinks & Beverages', type: 'expense', icon: 'CupSoda', color: '#06B6D4' },
  { id: 'cat-icecream', name: 'Ice Cream', type: 'expense', icon: 'IceCream', color: '#FF2D55' },
  { id: 'cat-treats', name: 'Treats & Snacks', type: 'expense', icon: 'Cookie', color: '#F97316' },
  { id: 'cat-dining', name: 'Dining & Takeout', type: 'expense', icon: 'Utensils', color: '#AF52DE' },
  { id: 'cat-study', name: 'Study & Uni Gear', type: 'expense', icon: 'BookOpen', color: '#5856D6' },
  { id: 'cat-transit', name: 'Transit & Metro', type: 'expense', icon: 'Bus', color: '#007AFF' },
  { id: 'cat-travel', name: 'Travel & Flights', type: 'expense', icon: 'Plane', color: '#0284C7' },
  { id: 'cat-bills', name: 'Bills & Rent', type: 'expense', icon: 'Receipt', color: '#64748B' },
  { id: 'cat-subscriptions', name: 'Subscriptions', type: 'expense', icon: 'Repeat', color: '#0EA5E9' },
  { id: 'cat-health', name: 'Health', type: 'expense', icon: 'Stethoscope', color: '#10B981' },
  { id: 'cat-fitness', name: 'Fitness & Sports', type: 'expense', icon: 'Dumbbell', color: '#16A34A' },
  { id: 'cat-beauty', name: 'Beauty & Personal Care', type: 'expense', icon: 'Sparkles', color: '#F43F5E' },
  { id: 'cat-entertainment', name: 'Entertainment & Events', type: 'expense', icon: 'Film', color: '#8B5CF6' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
  { id: 'cat-tech', name: 'Tech & Software', type: 'expense', icon: 'Smartphone', color: '#3B82F6' },
  { id: 'cat-household', name: 'Household & Laundry', type: 'expense', icon: 'Home', color: '#14B8A6' },
  { id: 'cat-gifts', name: 'Gifts & Occasions', type: 'expense', icon: 'Gift', color: '#E11D48' },
  { id: 'cat-savings', name: 'Savings & Goals', type: 'expense', icon: 'PiggyBank', color: '#84CC16' },
  { id: 'cat-charity', name: 'Charity & Giving', type: 'expense', icon: 'HeartHandshake', color: '#34C759', isCharity: true },
  { id: 'cat-uncategorized', name: 'Uncategorized', type: 'expense', icon: 'Tag', color: '#8E8E93' },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-emergency-krw',
    title: 'Emergency Buffer',
    category: 'Emergency Fund',
    targetAmount: 1000000,
    currency: 'KRW',
    savedAmount: 350000,
    targetDate: demoDate(-35),
    notes: '3-month essential living reserve in KRW.',
    status: 'partially_saved',
    createdAt: demoDate(40),
    updatedAt: demoDate(6),
  },
  {
    id: 'goal-tech-fund',
    title: 'Laptop & Study Setup',
    category: 'Tech & Study',
    targetAmount: 1500000,
    currency: 'KRW',
    savedAmount: 500000,
    targetDate: demoDate(-80),
    notes: 'Upgrade reserve for next semester projects.',
    status: 'partially_saved',
    createdAt: demoDate(30),
    updatedAt: demoDate(4),
  },
];

export const INITIAL_CHARITY_PLEDGES: CharityPledge[] = [
  {
    id: 'pledge-zakat-korea',
    title: 'Student Zakat & Purification',
    cause: 'Zakat',
    pledgedAmount: 250000,
    currency: 'KRW',
    fulfilledAmount: 100000,
    dueDate: demoDate(-10),
    notes: '2.5% calculated on net liquid savings and placement earnings in Korea.',
    status: 'partially_fulfilled',
    createdAt: demoDate(35),
    updatedAt: demoDate(2),
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Placement Income into Hana Bank
  {
    id: 'tx-p1',
    type: 'income',
    amount: 2100000,
    currency: 'KRW',
    date: demoDate(20),
    categoryId: 'cat-placement',
    accountId: 'acc-krw-hana',
    merchant: 'Engineering Placement Stipend',
    notes: 'Monthly university work placement stipend',
    createdAt: demoTimestamp(20, '09:00'),
    updatedAt: demoTimestamp(20, '09:00'),
  },
  // Itemized Groceries paid via Toss Bank
  {
    id: 'tx-s1',
    type: 'expense',
    amount: 18000,
    currency: 'KRW',
    date: demoDate(5),
    categoryId: 'cat-groceries',
    accountId: 'acc-krw-toss',
    merchant: 'Emart Everyday (이마트 에브리데이)',
    notes: 'Itemized scanned receipt: eggs, sourdough bread, iced latte & ice cream',
    receiptItems: [
      { id: 'item-1', name: 'Grade-A Eggs 10pk (신선 특란)', price: 4500, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: 'item-2', name: 'Milk Toast Sourdough (우유 식빵)', price: 3800, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: 'item-3', name: 'Cold Brew Oat Latte (콜드브루 라떼)', price: 5500, category: 'Coffee' },
      { id: 'item-4', name: 'Haagen-Dazs Vanilla Cup (하겐다즈)', price: 4200, category: 'Ice Cream' },
    ],
    createdAt: demoTimestamp(5, '14:15'),
    updatedAt: demoTimestamp(5, '14:15'),
  },
  // Coffee run via Toss Bank
  {
    id: 'tx-s2',
    type: 'expense',
    amount: 4500,
    currency: 'KRW',
    date: demoDate(3),
    categoryId: 'cat-coffee',
    accountId: 'acc-krw-toss',
    merchant: 'Mega Coffee Vanilla Latte (메가커피)',
    notes: 'Vanilla Latte study break',
    createdAt: demoTimestamp(3, '10:30'),
    updatedAt: demoTimestamp(3, '10:30'),
  },
  // Ice cream via Toss Bank
  {
    id: 'tx-s3',
    type: 'expense',
    amount: 5200,
    currency: 'KRW',
    date: demoDate(1),
    categoryId: 'cat-icecream',
    accountId: 'acc-krw-toss',
    merchant: 'Baskin Robbins (배스킨라빈스)',
    notes: 'Single regular scoop',
    createdAt: demoTimestamp(1, '19:45'),
    updatedAt: demoTimestamp(1, '19:45'),
  },
  // Tutoring income into Hana Bank
  {
    id: 'tx-s4',
    type: 'income',
    amount: 120000,
    currency: 'KRW',
    date: demoDate(4),
    categoryId: 'cat-tutoring',
    accountId: 'acc-krw-hana',
    merchant: 'Peer Tutoring (2 hrs)',
    notes: 'Math & engineering tutoring session',
    createdAt: demoTimestamp(4, '17:00'),
    updatedAt: demoTimestamp(4, '17:00'),
  },
  // Charity distribution from Hana Bank
  {
    id: 'tx-s5',
    type: 'expense',
    amount: 100000,
    currency: 'KRW',
    date: demoDate(2),
    categoryId: 'cat-charity',
    accountId: 'acc-krw-hana',
    merchant: 'Student Zakat Tranche',
    notes: 'Student Zakat fulfillment tranche',
    isCharity: true,
    charityPledgeId: 'pledge-zakat-korea',
    createdAt: demoTimestamp(2, '11:00'),
    updatedAt: demoTimestamp(2, '11:00'),
  },
];

// Backwards compatibility alias
export const STUDENT_ACCOUNTS = INITIAL_ACCOUNTS;
export const STUDENT_CATEGORIES = INITIAL_CATEGORIES;
export const STUDENT_SAVINGS_GOALS = INITIAL_SAVINGS_GOALS;
export const STUDENT_CHARITY_PLEDGES = INITIAL_CHARITY_PLEDGES;
export const STUDENT_TRANSACTIONS = INITIAL_TRANSACTIONS;
