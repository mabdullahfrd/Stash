/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useFinanceData, useFinanceUI } from '../../context/FinanceContext';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ScanLine,
  Building2,
  X,
  Heart,
  Trash2,
  Pencil,
  CheckCircle2,
  PiggyBank,
} from 'lucide-react';
import { HoldAmount } from '../common/HoldAmount';
import { MinimalHeader } from '../common/MinimalHeader';
import { BankLogo } from '../common/BankLogo';
import { TransactionIcon } from '../common/TransactionIcon';
import { formatCurrency, convertCurrency } from '../../utils/currencies';
import { findBankPreset } from '../../utils/koreanBanks';
import { AnalyticsTimeRange, computeItemTypeAnalytics } from '../../utils/itemAnalytics';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Account, CharityPledge, CurrencyCode, SavingsGoal } from '../../types/finance';

export const PocketsView: React.FC = () => {
  const {
    netWorth,
    cashFlow,
    accounts,
    accountBalances,
    transactions,
    categories,
    charityPledges,
    savingsGoals,
    savingsStats,
    activeCurrency,
    rates,
    deleteAccount,
    addCharityPledge,
    fulfillCharityPledge,
    deleteCharityPledge,
    addSavingsGoal,
    contributeSavingsGoal,
    deleteSavingsGoal,
  } = useFinanceData();
  const {
    selectedBankFilter,
    setSelectedBankFilter,
    openTransactionModal,
    openAccountModal,
    openEditAccountModal,
    setActiveTab,
  } = useFinanceUI();

  const [viewMode, setViewMode] = useState<'overview' | 'analytics'>('overview');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('all');
  const [analyticsBankFilter, setAnalyticsBankFilter] = useState<string | null>(null);
  const [selectedItemCategoryFilter, setSelectedItemCategoryFilter] = useState<string | null>(null);
  const [accountPendingDelete, setAccountPendingDelete] = useState<{ account: Account; txCount: number } | null>(null);

  // Savings Goal UI state
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Emergency Fund');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalCurrency, setNewGoalCurrency] = useState<CurrencyCode>(activeCurrency);
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newGoalError, setNewGoalError] = useState('');

  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccountId, setDepositAccountId] = useState('');
  const [depositToAccountId, setDepositToAccountId] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositError, setDepositError] = useState('');
  const [goalPendingDelete, setGoalPendingDelete] = useState<SavingsGoal | null>(null);

  // Charity Pledge UI state
  const [isNewPledgeOpen, setIsNewPledgeOpen] = useState(false);
  const [newPledgeTitle, setNewPledgeTitle] = useState('');
  const [newPledgeCause, setNewPledgeCause] = useState('Zakat');
  const [newPledgeAmount, setNewPledgeAmount] = useState('');
  const [newPledgeCurrency, setNewPledgeCurrency] = useState<CurrencyCode>(activeCurrency);
  const [newPledgeDueDate, setNewPledgeDueDate] = useState('');
  const [newPledgeError, setNewPledgeError] = useState('');

  const [fulfillingPledge, setFulfillingPledge] = useState<CharityPledge | null>(null);
  const [fulfillAmount, setFulfillAmount] = useState('');
  const [fulfillAccountId, setFulfillAccountId] = useState('');
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [fulfillError, setFulfillError] = useState('');
  const [pledgePendingDelete, setPledgePendingDelete] = useState<CharityPledge | null>(null);

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isArchived), [accounts]);

  const weeklyChartData = useMemo(() => {
    const days = [
      { label: 'M', full: 'Monday', amount: 0 },
      { label: 'T', full: 'Tuesday', amount: 0 },
      { label: 'W', full: 'Wednesday', amount: 0 },
      { label: 'T', full: 'Thursday', amount: 0 },
      { label: 'F', full: 'Friday', amount: 0 },
      { label: 'S', full: 'Saturday', amount: 0 },
      { label: 'S', full: 'Sunday', amount: 0 },
    ];

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const d = new Date(tx.date || tx.createdAt);
        const dayIdx = (d.getDay() + 6) % 7;
        const converted = convertCurrency(tx.amount, tx.currency, activeCurrency, rates);
        days[dayIdx].amount += converted;
      }
    });

    const maxAmount = Math.max(...days.map((d) => d.amount), 50000);
    const highestDay = [...days].sort((a, b) => b.amount - a.amount)[0];

    return { days, maxAmount, highestDay };
  }, [transactions, activeCurrency, rates]);

  const itemAnalytics = useMemo(() => {
    return computeItemTypeAnalytics(transactions, categories, activeCurrency, rates, {
      timeRange,
      accountIdFilter: analyticsBankFilter,
    });
  }, [transactions, categories, activeCurrency, rates, timeRange, analyticsBankFilter]);

  const filteredItemGroups = useMemo(() => {
    if (!selectedItemCategoryFilter) return itemAnalytics.itemGroups;
    return itemAnalytics.itemGroups.filter((g) => g.categoryId === selectedItemCategoryFilter);
  }, [itemAnalytics.itemGroups, selectedItemCategoryFilter]);

  const filteredTransactions = useMemo(() => {
    if (!selectedBankFilter) return transactions;
    return transactions.filter(
      (tx) => tx.accountId === selectedBankFilter || tx.toAccountId === selectedBankFilter
    );
  }, [transactions, selectedBankFilter]);

  const recentTransactions = filteredTransactions.slice(0, 6);

  const bankActivity = useMemo(() => {
    return activeAccounts.map((acc) => {
      const bankPreset = findBankPreset(acc.institution || acc.name);
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.accountId === acc.id)
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, activeCurrency, rates), 0);
      const inflow = transactions
        .filter((t) => t.type === 'income' && t.accountId === acc.id)
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, activeCurrency, rates), 0);
      const txCount = transactions.filter((t) => t.accountId === acc.id || t.toAccountId === acc.id).length;

      return {
        account: acc,
        bankPreset,
        spent,
        inflow,
        txCount,
      };
    });
  }, [activeAccounts, transactions, activeCurrency, rates]);

  const selectedFilteredAccount = activeAccounts.find((a) => a.id === selectedBankFilter);
  const primaryAccount = activeAccounts[0];
  const expenseCount = transactions.filter((t) => t.type === 'expense').length;

  return (
    <div className="flex-1 flex flex-col">
      <MinimalHeader />

      <div className="px-4 sm:px-6 pt-2 space-y-5">
        {/* Clean Minimal Segment Switcher */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.05]">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'overview'
                  ? 'bg-white dark:bg-[#1E221C] text-[#111315] dark:text-[#F4F5F0] shadow-xs'
                  : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'analytics'
                  ? 'bg-white dark:bg-[#1E221C] text-[#111315] dark:text-[#F4F5F0] shadow-xs'
                  : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              Statistics
            </button>
          </div>

          <span className="text-[11px] font-medium text-[#6B7268] dark:text-[#8E9689] hidden sm:inline">
            Tap any amount to convert currency
          </span>
        </div>

        {viewMode === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Hero Balance + Quick Actions + Bank Accounts */}
            <div className="lg:col-span-7 space-y-5">
              {/* Matte Obsidian Hero Balance Card */}
              <div className="rounded-[28px] bg-[#141617] dark:bg-[#171A15] text-white p-6 border border-white/[0.08] space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/60">
                    Total Balance
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      activeAccounts.length === 0 ? 'text-white/50' : 'text-[#C8EC45]'
                    }`}
                  >
                    {activeAccounts.length === 0
                      ? 'Ready to link'
                      : `${transactions.length} ${transactions.length === 1 ? 'entry' : 'entries'} logged`}
                  </span>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-white tabular-nums">
                    <HoldAmount amount={netWorth.netWorth} currency={activeCurrency} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/50 font-mono mt-2">
                    {activeAccounts.length === 0 ? (
                      <>
                        <span>No bank accounts linked</span>
                        <span>·</span>
                        <span>{activeCurrency}</span>
                      </>
                    ) : (
                      <>
                        {primaryAccount?.accountNumber && (
                          <>
                            <span>{primaryAccount.accountNumber}</span>
                            <span>·</span>
                          </>
                        )}
                        <span>
                          {activeAccounts.length} {activeAccounts.length === 1 ? 'linked account' : 'linked accounts'}
                        </span>
                        <span>·</span>
                        <span>{activeCurrency}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Circular Quick Actions (Reference Screenshot Style) */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 px-1">
                <button
                  onClick={() => openTransactionModal({ type: 'expense' })}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] flex items-center justify-center text-[#111315] dark:text-[#F4F5F0] group-hover:border-black/20 dark:group-hover:border-white/20 transition active:scale-95">
                    <ArrowDownRight className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                    Expense
                  </span>
                </button>

                <button
                  onClick={() => openTransactionModal({ type: 'income' })}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] flex items-center justify-center text-[#111315] dark:text-[#F4F5F0] group-hover:border-black/20 dark:group-hover:border-white/20 transition active:scale-95">
                    <ArrowUpRight className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                    Inflow
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('scanner')}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#C8EC45] hover:bg-[#B8DE35] flex items-center justify-center text-[#111315] transition active:scale-95">
                    <ScanLine className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#111315] dark:text-[#F4F5F0]">
                    Import
                  </span>
                </button>

                <button
                  onClick={() => openAccountModal()}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] flex items-center justify-center text-[#111315] dark:text-[#F4F5F0] group-hover:border-black/20 dark:group-hover:border-white/20 transition active:scale-95">
                    <Building2 className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                    Add Bank
                  </span>
                </button>
              </div>

              {/* Linked Bank Accounts */}
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
                      Bank Accounts
                    </h2>
                    <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] mt-0.5">
                      {activeAccounts.length === 0
                        ? 'Link your own bank accounts to begin tracking balances and spending'
                        : 'Select an account to view its activity or add an entry'}
                    </p>
                  </div>
                  {activeAccounts.length > 0 && (
                    <button
                      onClick={() => openAccountModal()}
                      className="px-3 py-1.5 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] transition flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Link Bank</span>
                    </button>
                  )}
                </div>

                {activeAccounts.length === 0 ? (
                  <div className="rounded-2xl bg-[#F9FAF7] dark:bg-[#121511] border border-dashed border-black/[0.12] dark:border-white/[0.12] p-5 text-center space-y-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#141617] dark:bg-[#C8EC45] text-[#C8EC45] dark:text-[#111315] flex items-center justify-center mx-auto">
                      <Building2 className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#111315] dark:text-[#F4F5F0]">
                        Link your first bank account
                      </h3>
                      <p className="text-xs text-[#6B7268] dark:text-[#8E9689] max-w-sm mx-auto">
                        Your ledger starts cleanly at ₩0. Connect Hana Bank, Toss Bank, or any wallet you use.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openAccountModal('hana')}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/25 text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center justify-center gap-2 transition"
                      >
                        <BankLogo bank={findBankPreset('hana')} size="sm" />
                        <span>Link Hana Bank</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openAccountModal('toss')}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/25 text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center justify-center gap-2 transition"
                      >
                        <BankLogo bank={findBankPreset('toss')} size="sm" />
                        <span>Link Toss Bank</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openAccountModal()}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Other Bank</span>
                      </button>
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeAccounts.map((acc) => {
                    const balance = accountBalances[acc.id] ?? acc.balance;
                    const bankInfo = findBankPreset(acc.institution || acc.name);
                    const isFiltered = selectedBankFilter === acc.id;

                    return (
                      <div
                        key={acc.id}
                        className={`relative p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-3 ${
                          isFiltered
                            ? 'bg-[#F9FAF6] dark:bg-[#1E231C] border-[#141617] dark:border-[#C8EC45]'
                            : 'bg-[#F9FAF7] dark:bg-[#121511] border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.16] dark:hover:border-white/[0.16]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => setSelectedBankFilter(isFiltered ? null : acc.id)}
                            aria-pressed={isFiltered}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left focus:outline-none"
                          >
                            <BankLogo bank={bankInfo} size="md" />
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] block truncate">
                                {acc.name}
                              </span>
                              <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689] font-mono block truncate">
                                {acc.accountNumber || bankInfo.name}
                              </span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => openTransactionModal({ type: 'expense', accountId: acc.id })}
                            title={`Add entry to ${acc.name}`}
                            aria-label={`Add entry to ${acc.name}`}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-white/[0.06] border border-black/[0.07] dark:border-white/[0.08] flex items-center justify-center text-[#111315] dark:text-[#F4F5F0] hover:bg-[#C8EC45] hover:text-[#111315] hover:border-transparent transition shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedBankFilter(isFiltered ? null : acc.id)}
                          className="flex items-baseline justify-between w-full pt-2 border-t border-black/[0.05] dark:border-white/[0.06] text-left focus:outline-none"
                        >
                          <span className="text-sm font-bold font-mono text-[#111315] dark:text-[#F4F5F0] tabular-nums">
                            <HoldAmount amount={balance} currency={acc.currency} interactive={false} />
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              isFiltered
                                ? 'text-[#111315] dark:text-[#C8EC45]'
                                : 'text-[#8E9689]'
                            }`}
                          >
                            {isFiltered ? 'Selected' : acc.currency}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                )}

                {selectedFilteredAccount && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <BankLogo
                        bank={findBankPreset(selectedFilteredAccount.institution || selectedFilteredAccount.name)}
                        size="xs"
                      />
                      <span className="text-[#4B5248] dark:text-[#B4BCB0] truncate">
                        <span className="font-semibold text-[#111315] dark:text-white">
                          {selectedFilteredAccount.name}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openTransactionModal({ type: 'expense', accountId: selectedFilteredAccount.id })}
                        className="px-2.5 py-1 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold flex items-center gap-1 hover:opacity-90 transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditAccountModal(selectedFilteredAccount)}
                        className="p-1 rounded-lg text-[#6B7268] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
                        aria-label={`Edit ${selectedFilteredAccount.name}`}
                        title="Edit account"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const txCount = transactions.filter(
                            (t) => t.accountId === selectedFilteredAccount.id || t.toAccountId === selectedFilteredAccount.id
                          ).length;
                          setAccountPendingDelete({ account: selectedFilteredAccount, txCount });
                        }}
                        className="p-1 rounded-lg text-[#8E9689] hover:text-rose-500 transition"
                        aria-label={`Remove ${selectedFilteredAccount.name}`}
                        title="Unlink account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBankFilter(null)}
                        className="text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white font-semibold flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Weekly Spending Chart + Recent Activity */}
            <div className="lg:col-span-5 space-y-5">
              {/* 7-Day Spending Pace Card */}
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-[#6B7268] dark:text-[#8E9689] block">
                      Spending Summary
                    </span>
                    <div className="text-2xl font-bold font-mono tracking-tight text-[#111315] dark:text-[#F4F5F0] tabular-nums mt-0.5">
                      <HoldAmount amount={cashFlow.totalExpenses} currency={activeCurrency} />
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#6B7268] dark:text-[#8E9689]">
                    7-day pace
                  </span>
                </div>

                <div className="pt-1">
                  <div className="grid grid-cols-7 gap-2 items-end h-28">
                    {weeklyChartData.days.map((d, idx) => {
                      const heightPercent = Math.max(
                        14,
                        Math.round((d.amount / weeklyChartData.maxAmount) * 100)
                      );
                      const isHighlight = d.amount === weeklyChartData.maxAmount && d.amount > 0;

                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end gap-2">
                          <div className="w-full flex-1 flex items-end justify-center">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-3.5 sm:w-4 rounded-full transition-all duration-300 ${
                                isHighlight
                                  ? 'bg-[#C8EC45]'
                                  : 'bg-[#141617]/15 dark:bg-white/15'
                              }`}
                              title={`${d.full}: ${formatCurrency(d.amount, activeCurrency)}`}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              isHighlight
                                ? 'text-[#111315] dark:text-[#C8EC45]'
                                : 'text-[#8E9689]'
                            }`}
                          >
                            {d.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] pt-3 border-t border-black/[0.05] dark:border-white/[0.06] mt-3">
                    {weeklyChartData.highestDay.amount > 0
                      ? `Peak spending on ${weeklyChartData.highestDay.full} (${formatCurrency(weeklyChartData.highestDay.amount, activeCurrency)})`
                      : 'No expenses logged this week yet.'}
                  </p>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
                    Recent Activity
                  </h2>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-xs font-semibold text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
                  >
                    See all
                  </button>
                </div>

                {recentTransactions.length === 0 ? (
                  <p className="text-xs text-[#8E9689] py-6 text-center">
                    {accounts.length === 0
                      ? 'No transactions yet. Link a bank account or add an entry.'
                      : selectedBankFilter
                      ? 'No activity recorded for this account.'
                      : 'No transactions logged yet.'}
                  </p>
                ) : (
                  <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                    {recentTransactions.map((tx) => {
                      const category = categories.find((c) => c.id === tx.categoryId);
                      const isIncome = tx.type === 'income';
                      const account = accounts.find((a) => a.id === tx.accountId);
                      const bankInfo = account ? findBankPreset(account.institution || account.name) : null;

                      return (
                        <button
                          key={tx.id}
                          type="button"
                          onClick={() => openTransactionModal(tx)}
                          className="w-full py-3 flex items-center justify-between gap-3 text-left hover:opacity-80 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <TransactionIcon
                              categoryName={category?.name}
                              categoryIcon={category?.icon}
                              merchant={tx.merchant}
                              type={tx.type}
                              isCharity={tx.isCharity}
                              hasReceipt={Boolean(tx.receiptItems?.length)}
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] truncate">
                                  {tx.merchant || category?.name || 'Transaction'}
                                </span>
                                {tx.isCharity && (
                                  <Heart className="w-3 h-3 text-[#6B7268] dark:text-[#C8EC45] shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-[#6B7268] dark:text-[#8E9689] truncate flex items-center gap-1.5 mt-0.5">
                                {bankInfo && account && (
                                  <>
                                    <BankLogo bank={bankInfo} size="xs" />
                                    <span className="truncate">{account.name}</span>
                                    <span>·</span>
                                  </>
                                )}
                                <span>{tx.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-bold font-mono tabular-nums ${
                                isIncome
                                  ? 'text-emerald-700 dark:text-[#C8EC45]'
                                  : 'text-[#111315] dark:text-[#F4F5F0]'
                              }`}
                            >
                              <HoldAmount
                                amount={tx.amount}
                                currency={tx.currency}
                                showSign={isIncome}
                                prefix={isIncome ? '' : '-'}
                                interactive={false}
                              />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Savings Goals Card */}
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <PiggyBank className="w-4 h-4 text-[#141617] dark:text-[#C8EC45] shrink-0" />
                      <h2 className="text-sm font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
                        Savings Goals
                      </h2>
                    </div>
                    <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] mt-0.5 truncate">
                      {savingsGoals.length > 0
                        ? `${formatCurrency(savingsStats.totalSaved, activeCurrency)} / ${formatCurrency(savingsStats.totalTarget, activeCurrency)} (${savingsStats.progressPercent}%)`
                        : 'Build reserves for tuition, travel, or emergencies'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewGoalTitle('');
                      setNewGoalCategory('Emergency Fund');
                      setNewGoalAmount('');
                      setNewGoalCurrency(activeCurrency);
                      setNewGoalTargetDate('');
                      setNewGoalError('');
                      setIsNewGoalOpen((v) => !v);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] transition flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Goal</span>
                  </button>
                </div>

                {isNewGoalOpen && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const amt = parseFloat(newGoalAmount);
                      if (!newGoalTitle.trim()) {
                        setNewGoalError('Enter a savings goal title.');
                        return;
                      }
                      if (!Number.isFinite(amt) || amt <= 0) {
                        setNewGoalError('Enter a target amount greater than 0.');
                        return;
                      }
                      await addSavingsGoal({
                        title: newGoalTitle.trim(),
                        category: newGoalCategory.trim() || 'Savings',
                        targetAmount: amt,
                        currency: newGoalCurrency,
                        targetDate: newGoalTargetDate || undefined,
                      });
                      setIsNewGoalOpen(false);
                    }}
                    className="p-3.5 rounded-2xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.06] dark:border-white/[0.08] space-y-2.5 text-xs"
                  >
                    {newGoalError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {newGoalError}
                      </p>
                    )}
                    <div>
                      <label htmlFor="new-goal-title" className="sr-only">
                        Savings goal title
                      </label>
                      <input
                        id="new-goal-title"
                        type="text"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="Goal title (e.g. Emergency Buffer)"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label htmlFor="new-goal-category" className="sr-only">
                          Goal category
                        </label>
                        <input
                          id="new-goal-category"
                          type="text"
                          value={newGoalCategory}
                          onChange={(e) => setNewGoalCategory(e.target.value)}
                          placeholder="Category"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-goal-amount" className="sr-only">
                          Target amount
                        </label>
                        <input
                          id="new-goal-amount"
                          type="number"
                          step="any"
                          value={newGoalAmount}
                          onChange={(e) => setNewGoalAmount(e.target.value)}
                          placeholder="Target"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] font-mono text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-goal-currency" className="sr-only">
                          Goal currency
                        </label>
                        <select
                          id="new-goal-currency"
                          value={newGoalCurrency}
                          onChange={(e) => setNewGoalCurrency(e.target.value as CurrencyCode)}
                          className="w-full px-2 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                        >
                          <option value="KRW">KRW</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="PKR">PKR</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <label htmlFor="new-goal-target-date" className="sr-only">
                          Target date
                        </label>
                        <input
                          id="new-goal-target-date"
                          type="date"
                          value={newGoalTargetDate}
                          onChange={(e) => setNewGoalTargetDate(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsNewGoalOpen(false)}
                          className="px-3 py-1.5 rounded-lg text-[#6B7268] dark:text-[#8E9689] font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] font-semibold"
                        >
                          Save Goal
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {savingsGoals.length === 0 ? (
                  <p className="text-xs text-[#8E9689] py-4 text-center">
                    No savings goals yet. Create one to track your savings milestones.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {savingsGoals.map((goal) => {
                      const pct = Math.min(
                        100,
                        goal.targetAmount > 0
                          ? Math.round((goal.savedAmount / goal.targetAmount) * 100)
                          : 0
                      );
                      const isCompleted =
                        goal.status === 'completed' ||
                        goal.savedAmount >= goal.targetAmount;
                      const isDepositing = contributingGoal?.id === goal.id;
                      const transferTargets = activeAccounts.filter((a) => a.id !== depositAccountId);

                      return (
                        <div
                          key={goal.id}
                          className="p-3.5 rounded-2xl bg-[#F9FAF7] dark:bg-[#121511] border border-black/[0.06] dark:border-white/[0.06] space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] truncate">
                                  {goal.title}
                                </span>
                                {isCompleted && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C8EC45] shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689]">
                                {goal.category}
                                {goal.targetDate ? ` · Target ${goal.targetDate}` : ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setContributingGoal(isDepositing ? null : goal);
                                  setDepositAmount('');
                                  setDepositAccountId(activeAccounts[0]?.id || '');
                                  setDepositToAccountId('');
                                  setDepositNotes('');
                                  setDepositError('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold"
                              >
                                {isCompleted ? 'Add More' : 'Add Savings'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setGoalPendingDelete(goal)}
                                aria-label={`Delete ${goal.title}`}
                                className="p-1 text-[#8E9689] hover:text-rose-500 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                              <span className="text-[#6B7268] dark:text-[#8E9689]">
                                {formatCurrency(goal.savedAmount, goal.currency)} /{' '}
                                {formatCurrency(goal.targetAmount, goal.currency)}
                              </span>
                              <span className="font-semibold text-[#111315] dark:text-[#F4F5F0]">
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#C8EC45] transition-all duration-300"
                                style={{ width: `${Math.max(goal.savedAmount > 0 ? 4 : 0, pct)}%` }}
                              />
                            </div>
                          </div>

                          {isDepositing && (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setDepositError('');
                                const amt = parseFloat(depositAmount);
                                const res = await contributeSavingsGoal(
                                  goal.id,
                                  amt,
                                  depositAccountId,
                                  depositNotes,
                                  depositToAccountId || undefined
                                );
                                if (!res.ok) {
                                  setDepositError(res.error || 'Unable to record savings deposit.');
                                  return;
                                }
                                setContributingGoal(null);
                              }}
                              className="pt-2 border-t border-black/[0.06] dark:border-white/[0.07] space-y-2 text-xs"
                            >
                              {depositError && (
                                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                  {depositError}
                                </p>
                              )}
                              {activeAccounts.length === 0 ? (
                                <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                                  Link a bank account first to add savings toward this goal.
                                </p>
                              ) : (
                                <>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      step="any"
                                      aria-label={`Deposit amount for ${goal.title}`}
                                      value={depositAmount}
                                      onChange={(e) => setDepositAmount(e.target.value)}
                                      placeholder="Amount"
                                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] font-mono text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                                    />
                                    <select
                                      aria-label={`Source account for ${goal.title}`}
                                      value={depositAccountId}
                                      onChange={(e) => {
                                        const nextFrom = e.target.value;
                                        setDepositAccountId(nextFrom);
                                        if (depositToAccountId === nextFrom) {
                                          setDepositToAccountId('');
                                        }
                                      }}
                                      className="px-2 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                                    >
                                      {activeAccounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                          From: {acc.name} ({acc.currency})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {transferTargets.length > 0 && (
                                    <select
                                      aria-label={`Destination pocket for ${goal.title}`}
                                      value={depositToAccountId}
                                      onChange={(e) => setDepositToAccountId(e.target.value)}
                                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                                    >
                                      <option value="">Set aside in Goal Vault (deduct from account)</option>
                                      {transferTargets.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                          Transfer to: {acc.name} ({acc.currency})
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      aria-label={`Savings note for ${goal.title}`}
                                      value={depositNotes}
                                      onChange={(e) => setDepositNotes(e.target.value)}
                                      placeholder="Optional notes"
                                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                                    />
                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 rounded-lg bg-[#C8EC45] text-[#111315] font-semibold shrink-0"
                                    >
                                      Confirm
                                    </button>
                                  </div>
                                </>
                              )}
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Charity Pledges Card */}
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
                      Charity Pledges
                    </h2>
                    <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] mt-0.5">
                      Track Zakat, Sadaqah, and giving goals
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPledgeTitle('');
                      setNewPledgeCause('Zakat');
                      setNewPledgeAmount('');
                      setNewPledgeCurrency(activeCurrency);
                      setNewPledgeDueDate('');
                      setNewPledgeError('');
                      setIsNewPledgeOpen((v) => !v);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] transition flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Pledge</span>
                  </button>
                </div>

                {isNewPledgeOpen && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const amt = parseFloat(newPledgeAmount);
                      if (!newPledgeTitle.trim()) {
                        setNewPledgeError('Enter a pledge title.');
                        return;
                      }
                      if (!Number.isFinite(amt) || amt <= 0) {
                        setNewPledgeError('Enter an amount greater than 0.');
                        return;
                      }
                      await addCharityPledge({
                        title: newPledgeTitle.trim(),
                        cause: newPledgeCause.trim() || 'Charity',
                        pledgedAmount: amt,
                        currency: newPledgeCurrency,
                        dueDate: newPledgeDueDate || undefined,
                      });
                      setIsNewPledgeOpen(false);
                    }}
                    className="p-3.5 rounded-2xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.06] dark:border-white/[0.08] space-y-2.5 text-xs"
                  >
                    {newPledgeError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {newPledgeError}
                      </p>
                    )}
                    <div>
                      <label htmlFor="new-pledge-title" className="sr-only">
                        Pledge title
                      </label>
                      <input
                        id="new-pledge-title"
                        type="text"
                        value={newPledgeTitle}
                        onChange={(e) => setNewPledgeTitle(e.target.value)}
                        placeholder="Pledge title (e.g. Monthly Zakat)"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label htmlFor="new-pledge-cause" className="sr-only">
                          Cause
                        </label>
                        <input
                          id="new-pledge-cause"
                          type="text"
                          value={newPledgeCause}
                          onChange={(e) => setNewPledgeCause(e.target.value)}
                          placeholder="Cause"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-pledge-amount" className="sr-only">
                          Target amount
                        </label>
                        <input
                          id="new-pledge-amount"
                          type="number"
                          step="any"
                          value={newPledgeAmount}
                          onChange={(e) => setNewPledgeAmount(e.target.value)}
                          placeholder="Target"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] font-mono text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-pledge-currency" className="sr-only">
                          Currency
                        </label>
                        <select
                          id="new-pledge-currency"
                          value={newPledgeCurrency}
                          onChange={(e) => setNewPledgeCurrency(e.target.value as CurrencyCode)}
                          className="w-full px-2 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                        >
                          <option value="KRW">KRW</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="PKR">PKR</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <label htmlFor="new-pledge-due-date" className="sr-only">
                          Due date
                        </label>
                        <input
                          id="new-pledge-due-date"
                          type="date"
                          value={newPledgeDueDate}
                          onChange={(e) => setNewPledgeDueDate(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsNewPledgeOpen(false)}
                          className="px-3 py-1.5 rounded-lg text-[#6B7268] dark:text-[#8E9689] font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] font-semibold"
                        >
                          Save Pledge
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {charityPledges.length === 0 ? (
                  <p className="text-xs text-[#8E9689] py-4 text-center">
                    No charity pledges yet. Create one to track giving progress.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {charityPledges.map((pledge) => {
                      const pct = Math.min(
                        100,
                        pledge.pledgedAmount > 0
                          ? Math.round((pledge.fulfilledAmount / pledge.pledgedAmount) * 100)
                          : 0
                      );
                      const isFulfilled =
                        pledge.status === 'fulfilled' ||
                        pledge.fulfilledAmount >= pledge.pledgedAmount;
                      const isEditingFulfill = fulfillingPledge?.id === pledge.id;

                      return (
                        <div
                          key={pledge.id}
                          className="p-3.5 rounded-2xl bg-[#F9FAF7] dark:bg-[#121511] border border-black/[0.06] dark:border-white/[0.06] space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] truncate">
                                  {pledge.title}
                                </span>
                                {isFulfilled && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C8EC45] shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689]">
                                {pledge.cause}
                                {pledge.dueDate ? ` · Due ${pledge.dueDate}` : ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isFulfilled && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFulfillingPledge(isEditingFulfill ? null : pledge);
                                    setFulfillAmount('');
                                    setFulfillAccountId(activeAccounts[0]?.id || '');
                                    setFulfillNotes('');
                                    setFulfillError('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold"
                                >
                                  Fulfill
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setPledgePendingDelete(pledge)}
                                aria-label={`Delete ${pledge.title}`}
                                className="p-1 text-[#8E9689] hover:text-rose-500 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                              <span className="text-[#6B7268] dark:text-[#8E9689]">
                                {formatCurrency(pledge.fulfilledAmount, pledge.currency)} /{' '}
                                {formatCurrency(pledge.pledgedAmount, pledge.currency)}
                              </span>
                              <span className="font-semibold text-[#111315] dark:text-[#F4F5F0]">
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#C8EC45]"
                                style={{ width: `${Math.max(4, pct)}%` }}
                              />
                            </div>
                          </div>

                          {isEditingFulfill && (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setFulfillError('');
                                const amt = parseFloat(fulfillAmount);
                                const res = await fulfillCharityPledge(
                                  pledge.id,
                                  amt,
                                  fulfillAccountId,
                                  fulfillNotes
                                );
                                if (!res.ok) {
                                  setFulfillError(res.error || 'Unable to fulfill pledge.');
                                  return;
                                }
                                setFulfillingPledge(null);
                              }}
                              className="pt-2 border-t border-black/[0.06] dark:border-white/[0.07] space-y-2 text-xs"
                            >
                              {fulfillError && (
                                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                  {fulfillError}
                                </p>
                              )}
                              {activeAccounts.length === 0 ? (
                                <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                                  Link a bank account first to fulfill this pledge.
                                </p>
                              ) : (
                                <>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      step="any"
                                      value={fulfillAmount}
                                      onChange={(e) => setFulfillAmount(e.target.value)}
                                      placeholder="Amount"
                                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] font-mono text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                                    />
                                    <select
                                      value={fulfillAccountId}
                                      onChange={(e) => setFulfillAccountId(e.target.value)}
                                      className="px-2 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                                    >
                                      {activeAccounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                          {acc.name} ({acc.currency})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={fulfillNotes}
                                      onChange={(e) => setFulfillNotes(e.target.value)}
                                      placeholder="Optional notes"
                                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                                    />
                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 rounded-lg bg-[#C8EC45] text-[#111315] font-semibold shrink-0"
                                    >
                                      Confirm
                                    </button>
                                  </div>
                                </>
                              )}
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ANALYTICS, ITEM BREAKDOWN & BANK FLOW */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Filter Toolbar: Time Range & Bank */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="inline-flex p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.05]">
                {(
                  [
                    { id: 'all', label: 'All Time' },
                    { id: 'month', label: 'This Month' },
                    { id: '7d', label: '7 Days' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeRange(t.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                      timeRange === t.id
                        ? 'bg-white dark:bg-[#1E221C] text-[#111315] dark:text-[#F4F5F0] shadow-xs'
                        : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAnalyticsBankFilter(null)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                    analyticsBankFilter === null
                      ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] border-transparent'
                      : 'bg-white dark:bg-[#161915] border-black/[0.07] dark:border-white/[0.08] text-[#5E655A] dark:text-[#A4AC9E]'
                  }`}
                >
                  All Banks
                </button>
                {activeAccounts.map((acc) => {
                  const bankPreset = findBankPreset(acc.institution || acc.name);
                  const active = analyticsBankFilter === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAnalyticsBankFilter(active ? null : acc.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] border-transparent'
                          : 'bg-white dark:bg-[#161915] border-black/[0.07] dark:border-white/[0.08] text-[#5E655A] dark:text-[#A4AC9E]'
                      }`}
                    >
                      <BankLogo bank={bankPreset} size="xs" />
                      <span>{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-Column Lime & Obsidian Summary Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-[24px] bg-[#C8EC45] text-[#111315] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111315]/70">
                    Total Inflow
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#111315]" />
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight tabular-nums">
                  <HoldAmount amount={cashFlow.totalIncome} currency={activeCurrency} showSign />
                </div>
                <p className="text-xs font-medium text-[#111315]/75">
                  Savings rate {cashFlow.savingsRatePercent}% · Net {formatCurrency(cashFlow.netFlow, activeCurrency)}
                </p>
              </div>

              <div className="rounded-[24px] bg-[#141617] dark:bg-[#171A15] text-white p-6 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60">
                    Filtered Item Spend
                  </span>
                  <ArrowDownRight className="w-4 h-4 text-[#C8EC45]" />
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight tabular-nums">
                  <HoldAmount amount={itemAnalytics.totalSpent} currency={activeCurrency} prefix="-" />
                </div>
                <p className="text-xs font-medium text-white/60">
                  {itemAnalytics.totalItemCount} itemized purchases · {expenseCount} total logs
                </p>
              </div>
            </div>

            {/* Spending by Item Type (Granular Item Breakdown) */}
            <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
                    Spending by Item Type
                  </h3>
                  <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] mt-0.5">
                    Exact spend, frequency, and average cost per item type across receipts & bank logs
                  </p>
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#5E655A] dark:text-[#A4AC9E]">
                  {filteredItemGroups.length} item types
                </span>
              </div>

              {/* Category Chips */}
              {itemAnalytics.categoryBreakdowns.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedItemCategoryFilter(null)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      selectedItemCategoryFilter === null
                        ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315]'
                        : 'bg-[#F4F5F0] dark:bg-white/[0.06] text-[#5E655A] dark:text-[#A4AC9E]'
                    }`}
                  >
                    All Items
                  </button>
                  {itemAnalytics.categoryBreakdowns.map((cat) => (
                    <button
                      key={cat.categoryId}
                      type="button"
                      onClick={() =>
                        setSelectedItemCategoryFilter(
                          selectedItemCategoryFilter === cat.categoryId ? null : cat.categoryId
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        selectedItemCategoryFilter === cat.categoryId
                          ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315]'
                          : 'bg-[#F4F5F0] dark:bg-white/[0.06] text-[#5E655A] dark:text-[#A4AC9E]'
                      }`}
                    >
                      {cat.categoryName} ({cat.sharePercent}%)
                    </button>
                  ))}
                </div>
              )}

              {filteredItemGroups.length === 0 ? (
                <p className="text-xs text-[#8E9689] py-6 text-center">
                  No spending items recorded for this filter.
                </p>
              ) : (
                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {filteredItemGroups.map((item) => {
                    const cat = categories.find((c) => c.id === item.categoryId);
                    const bankNames = item.accountIds
                      .map((id) => accounts.find((a) => a.id === id)?.name)
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <div key={item.id} className="py-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <TransactionIcon
                              categoryName={cat?.name || item.categoryName}
                              categoryIcon={cat?.icon}
                              merchant={item.itemName}
                              type="expense"
                              isCharity={Boolean(cat?.isCharity)}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] truncate">
                                  {item.itemName}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#F4F5F0] dark:bg-white/[0.06] text-[#5E655A] dark:text-[#B4BCB0] shrink-0">
                                  {item.count}×
                                </span>
                              </div>
                              <div className="text-[10px] text-[#6B7268] dark:text-[#8E9689] truncate mt-0.5">
                                {item.categoryName}
                                {bankNames ? ` · ${bankNames}` : ''}
                                {` · avg ${formatCurrency(item.avgAmount, activeCurrency)}`}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono tabular-nums">
                            <span className="text-xs font-bold text-[#111315] dark:text-[#F4F5F0] block">
                              <HoldAmount amount={item.amount} currency={activeCurrency} />
                            </span>
                            <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689]">
                              {item.sharePercent}% of spend
                            </span>
                          </div>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-black/[0.05] dark:bg-white/[0.07] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#141617] dark:bg-[#C8EC45] transition-all duration-300"
                            style={{ width: `${Math.max(4, item.sharePercent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Spending by Bank Account */}
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
                    Cash Flow by Bank
                  </h3>
                  <span className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                    {activeAccounts.length} linked
                  </span>
                </div>

                {bankActivity.length === 0 ? (
                  <p className="text-xs text-[#8E9689] py-6 text-center">
                    Link a bank account to view per-bank cash flow.
                  </p>
                ) : (
                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {bankActivity.map((b) => (
                    <div
                      key={b.account.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BankLogo bank={b.bankPreset} size="md" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] block truncate">
                            {b.account.name}
                          </span>
                          <span className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                            {b.txCount} transactions
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono tabular-nums">
                        <span className="text-xs font-bold text-[#111315] dark:text-[#F4F5F0] block">
                          -{formatCurrency(b.spent, activeCurrency)}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-700 dark:text-[#C8EC45]">
                          +{formatCurrency(b.inflow, activeCurrency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Item-Weighted Spending by Category */}
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
                    Categories (Item-Weighted)
                  </h3>
                  <span className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                    Share of spending
                  </span>
                </div>

                {itemAnalytics.categoryBreakdowns.length === 0 ? (
                  <p className="text-xs text-[#8E9689] py-6 text-center">
                    No category expenses yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {itemAnalytics.categoryBreakdowns.map((item) => (
                      <div key={item.categoryId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <TransactionIcon
                              categoryName={item.category?.name || item.categoryName}
                              categoryIcon={item.category?.icon}
                              type="expense"
                              isCharity={Boolean(item.category?.isCharity)}
                              size="sm"
                            />
                            <span className="font-medium text-[#111315] dark:text-[#F4F5F0] truncate">
                              {item.categoryName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                            <span className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                              {item.sharePercent}%
                            </span>
                            <span className="font-semibold text-[#111315] dark:text-[#F4F5F0]">
                              {formatCurrency(item.totalAmount, activeCurrency)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-black/[0.05] dark:bg-white/[0.07] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#141617] dark:bg-[#C8EC45]"
                            style={{ width: `${Math.max(4, item.sharePercent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(accountPendingDelete)}
        title={
          accountPendingDelete
            ? `Remove ${accountPendingDelete.account.name}?`
            : 'Remove account?'
        }
        description={
          accountPendingDelete && accountPendingDelete.txCount > 0
            ? `This account has ${accountPendingDelete.txCount} ${
                accountPendingDelete.txCount === 1 ? 'transaction' : 'transactions'
              }. You can archive the account to preserve your transaction history, or delete the account and all of its transactions.`
            : 'This unlinks the bank account from your ledger.'
        }
        secondaryLabel={
          accountPendingDelete && accountPendingDelete.txCount > 0
            ? 'Archive account'
            : undefined
        }
        onSecondaryAction={
          accountPendingDelete && accountPendingDelete.txCount > 0
            ? async () => {
                const targetId = accountPendingDelete.account.id;
                setAccountPendingDelete(null);
                await deleteAccount(targetId, 'archive');
                setSelectedBankFilter(null);
              }
            : undefined
        }
        confirmLabel={
          accountPendingDelete && accountPendingDelete.txCount > 0
            ? 'Delete account & transactions'
            : 'Delete account'
        }
        onConfirm={async () => {
          if (!accountPendingDelete) return;
          const targetId = accountPendingDelete.account.id;
          setAccountPendingDelete(null);
          await deleteAccount(targetId, 'deleteWithTransactions');
          setSelectedBankFilter(null);
        }}
        onCancel={() => setAccountPendingDelete(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(pledgePendingDelete)}
        title={
          pledgePendingDelete
            ? `Delete "${pledgePendingDelete.title}"?`
            : 'Delete charity pledge?'
        }
        description="Existing fulfilled charity transactions remain in your transaction history, while the pledge tracker is removed."
        confirmLabel="Delete pledge"
        onConfirm={async () => {
          if (!pledgePendingDelete) return;
          const id = pledgePendingDelete.id;
          setPledgePendingDelete(null);
          await deleteCharityPledge(id);
        }}
        onCancel={() => setPledgePendingDelete(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(goalPendingDelete)}
        title={
          goalPendingDelete
            ? `Delete "${goalPendingDelete.title}"?`
            : 'Delete savings goal?'
        }
        description="Existing savings transactions remain in your transaction history, while the savings goal tracker is removed."
        confirmLabel="Delete goal"
        onConfirm={async () => {
          if (!goalPendingDelete) return;
          const id = goalPendingDelete.id;
          setGoalPendingDelete(null);
          await deleteSavingsGoal(id);
        }}
        onCancel={() => setGoalPendingDelete(null)}
      />
    </div>
  );
};
