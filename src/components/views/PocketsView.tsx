/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  HeartHandshake,
  Plus,
  Camera,
  Coffee,
  IceCream,
  ShoppingCart,
  GraduationCap,
  Briefcase,
  ChevronRight,
  Receipt,
  Wallet,
  Settings as SettingsIcon,
  User as UserIcon,
  ShieldCheck,
  BarChart3,
  PieChart,
  Target,
  Sparkles,
  ArrowUpRight,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { HoldAmount } from '../common/HoldAmount';
import { convertCurrency, formatCurrency } from '../../utils/currencies';

export const PocketsView: React.FC = () => {
  const {
    netWorth,
    cashFlow,
    accounts,
    accountBalances,
    transactions,
    categories,
    activeCurrency,
    rates,
    charityStats,
    setActiveTab,
    openTransactionModal,
    openAccountModal,
    openSettingsModal,
  } = useFinance();

  const { user, isOnline, isGuest, openAuthModal } = useAuth();
  const [viewMode, setViewMode] = useState<'overview' | 'analytics'>('overview');

  // Breakdown of spending by category
  const spendingByCategory = useMemo(() => {
    const map: Record<string, { amount: number; count: number; items: string[] }> = {};
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      const converted = convertCurrency(tx.amount, tx.currency, activeCurrency, rates);
      if (!map[tx.categoryId]) {
        map[tx.categoryId] = { amount: 0, count: 0, items: [] };
      }
      map[tx.categoryId].amount += converted;
      map[tx.categoryId].count += 1;
      if (tx.merchant && !map[tx.categoryId].items.includes(tx.merchant)) {
        map[tx.categoryId].items.push(tx.merchant);
      }
    }
    return map;
  }, [transactions, activeCurrency, rates]);

  // Breakdown of income sources
  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type !== 'income') continue;
      const converted = convertCurrency(tx.amount, tx.currency, activeCurrency, rates);
      map[tx.categoryId] = (map[tx.categoryId] || 0) + converted;
    }
    return map;
  }, [transactions, activeCurrency, rates]);

  // Deep Analytics Computations
  const analytics = useMemo(() => {
    const totalSpent = cashFlow.totalExpenses;
    const totalIncome = cashFlow.totalIncome;

    // Category percentage distribution
    const categoryShares = categories
      .filter((c) => c.type === 'expense' && !c.isCharity)
      .map((cat) => {
        const spent = spendingByCategory[cat.id]?.amount || 0;
        const count = spendingByCategory[cat.id]?.count || 0;
        const percent = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
        return {
          category: cat,
          spent,
          count,
          percent: Number(percent.toFixed(1)),
        };
      })
      .sort((a, b) => b.spent - a.spent);

    // Top individual expenses
    const topExpenses = [...transactions]
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Pockets allocation percentage
    const totalAssets = netWorth.totalAssets;
    const pocketAllocations = accounts.map((acc) => {
      const bal = accountBalances[acc.id] ?? acc.balance;
      const converted = convertCurrency(bal, acc.currency, activeCurrency, rates);
      const share = totalAssets > 0 ? (converted / totalAssets) * 100 : 0;
      return {
        account: acc,
        balanceConverted: converted,
        share: Number(share.toFixed(1)),
      };
    });

    // Daily average spending (assuming 30-day month)
    const dailyAverage = totalSpent / 30;

    return {
      categoryShares,
      topExpenses,
      pocketAllocations,
      dailyAverage,
      savingsRate: cashFlow.savingsRatePercent,
    };
  }, [cashFlow, categories, spendingByCategory, transactions, accounts, accountBalances, activeCurrency, rates, netWorth]);

  const recentTransactions = transactions.slice(0, 5);

  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('coffee') || lower.includes('drink')) return Coffee;
    if (lower.includes('ice cream') || lower.includes('treat')) return IceCream;
    if (lower.includes('grocer') || lower.includes('egg') || lower.includes('bread')) return ShoppingCart;
    if (lower.includes('study') || lower.includes('uni')) return GraduationCap;
    if (lower.includes('placement') || lower.includes('salary')) return Briefcase;
    if (lower.includes('charity')) return HeartHandshake;
    return Wallet;
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-12">
      {/* Top Header with Profile & Settings */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Personal Finance
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stash
          </h1>
        </div>

        {/* User Account & Settings Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* User Account / Sign In Button */}
          <button
            onClick={openAuthModal}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 shadow-xs hover:border-slate-300 transition"
            title="Account & Cloud Sync"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : user ? (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            ) : isGuest ? (
              <Sparkles className="w-4 h-4 text-amber-500" />
            ) : (
              <UserIcon className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[80px] truncate">
              {user ? user.displayName?.split(' ')[0] || 'Cloud' : isGuest ? 'Demo' : 'Sign In'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </button>

          {/* Settings Button */}
          <button
            onClick={openSettingsModal}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs"
            title="Settings"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher: Overview vs Statistics & Analysis */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/80 dark:bg-white/10 rounded-2xl gap-1 text-xs select-none">
        <button
          onClick={() => setViewMode('overview')}
          className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === 'overview'
              ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setViewMode('analytics')}
          className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            viewMode === 'analytics'
              ? 'bg-white dark:bg-[#1C1C1E] text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Statistics & Analysis</span>
        </button>
      </div>

      {/* MAIN VIEW CONTROLLER */}
      {viewMode === 'overview' ? (
        <>
          {/* Main Balance Card (In Korean Won) */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-5 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Available Balance & Net Assets</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-semibold font-mono">
                  {activeCurrency}
                </span>
              </div>

              {/* Main Amount - Press/Hold converts to USD, EUR, KRW, PKR */}
              <div className="text-3xl font-extrabold font-mono tracking-tight text-white cursor-pointer select-none">
                <HoldAmount amount={netWorth.netWorth} currency={activeCurrency} />
              </div>

              {/* Inflow vs Spending */}
              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    What I Got
                  </span>
                  <span className="text-base font-bold font-mono text-white block mt-0.5">
                    <HoldAmount amount={cashFlow.totalIncome} currency={activeCurrency} />
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Stipend & Earnings</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    What I Spent
                  </span>
                  <span className="text-base font-bold font-mono text-white block mt-0.5">
                    <HoldAmount amount={cashFlow.totalExpenses} currency={activeCurrency} />
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Groceries & Everyday</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Scan Receipt & Log Spending */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('scanner')}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Receipt</span>
            </button>

            <button
              onClick={() => openTransactionModal({ type: 'expense' })}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs hover:bg-slate-50 transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>+ Log Item</span>
            </button>
          </div>

          {/* SECTION 1: WHAT I'M SPENDING ON (Items: Groceries, Coffee, Ice Cream, etc.) */}
          <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  What I'm Spending On (By Item)
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Tap item to convert</span>
            </div>

            <div className="space-y-2.5">
              {categories
                .filter((c) => c.type === 'expense' && !c.isCharity)
                .map((cat) => {
                  const spent = spendingByCategory[cat.id]?.amount || 0;
                  const count = spendingByCategory[cat.id]?.count || 0;
                  const Icon = getCategoryIcon(cat.name);

                  return (
                    <div
                      key={cat.id}
                      onClick={() => openTransactionModal({ type: 'expense', categoryId: cat.id })}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {count > 0 ? `${count} items logged` : 'No spending yet'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                          <HoldAmount amount={spent} currency={activeCurrency} />
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* SECTION 2: WHAT I GOT (Income Sources) */}
          <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  What I Got (Income & Placement)
                </h2>
              </div>
              <button
                onClick={() => openTransactionModal({ type: 'income' })}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                Add Income
              </button>
            </div>

            <div className="space-y-2">
              {categories
                .filter((c) => c.type === 'income')
                .map((cat) => {
                  const amount = incomeByCategory[cat.id] || 0;
                  const Icon = getCategoryIcon(cat.name);

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {cat.name}
                        </span>
                      </div>

                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        <HoldAmount amount={amount} currency={activeCurrency} prefix="+" />
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* DEDICATED SECTION: Pending Charity to Give */}
          <div
            onClick={() => setActiveTab('charity')}
            className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 dark:border-emerald-500/20 p-4 cursor-pointer hover:border-emerald-500/50 transition-all shadow-xs"
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      Pending Charity to Give
                    </span>
                    {charityStats.pendingPledgesCount > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {charityStats.pendingPledgesCount} Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pledged Zakat, Sadaqah & Commitments
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                    <HoldAmount amount={charityStats.totalPending} currency={activeCurrency} />
                  </span>
                  <span className="text-[10px] text-slate-400">to distribute</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Pockets & Accounts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                My Pockets & Cards
              </h2>
              <button
                onClick={openAccountModal}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline"
              >
                <Plus className="w-3 h-3" />
                Add Pocket
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {accounts.map((acc) => {
                const balance = accountBalances[acc.id] ?? acc.balance;

                return (
                  <div
                    key={acc.id}
                    className="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {acc.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {acc.currency}
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        <HoldAmount amount={balance} currency={acc.currency} />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                        {acc.institution}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Purchases & Income */}
          <div className="space-y-2 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                Recent Purchases & Inflow
              </h2>
              <button
                onClick={() => setActiveTab('activity')}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                See All
              </button>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              {recentTransactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    onClick={() => openTransactionModal(tx)}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: category?.color || '#8E8E93' }}
                      >
                        {isIncome ? '+' : '–'}
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                          <span>{tx.merchant || category?.name || 'Item'}</span>
                          {tx.receiptItems && (
                            <span className="text-[9px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-1 py-0.2 rounded font-semibold flex items-center gap-0.5">
                              <Receipt className="w-2.5 h-2.5" />
                              {tx.receiptItems.length} items
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {category?.name} · {tx.date}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        <HoldAmount
                          amount={tx.amount}
                          currency={tx.currency}
                          showSign={isIncome}
                          prefix={isIncome ? '' : '-'}
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* STATISTICS & ANALYSIS MODE */
        <div className="space-y-4 pb-6 animate-in fade-in duration-200">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Savings Rate
              </span>
              <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {analytics.savingsRate}%
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Of total income retained
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Daily Burn Rate
              </span>
              <div className="text-xl font-extrabold font-mono text-rose-500 mt-1">
                {formatCurrency(analytics.dailyAverage, activeCurrency)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Avg. daily expense pace
              </span>
            </div>
          </div>

          {/* Category Distribution Analysis */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Spending Breakdown & Share
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                Total: {formatCurrency(cashFlow.totalExpenses, activeCurrency)}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {analytics.categoryShares.map(({ category, spent, percent, count }) => (
                <div key={category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {category.name}
                      </span>
                      <span className="text-[10px] text-slate-400">({count} items)</span>
                    </div>
                    <div className="text-right flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(spent, activeCurrency)}
                      </span>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold min-w-[38px] text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Visual percentage bar */}
                  <div className="w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, percent)}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pockets Wealth Allocation */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Asset & Pocket Distribution
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-400">
                Liquid Assets
              </span>
            </div>

            <div className="space-y-2.5">
              {analytics.pocketAllocations.map(({ account, balanceConverted, share }) => (
                <div key={account.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {account.name}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {formatCurrency(balanceConverted, activeCurrency)} ({share}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.max(3, share)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Scanned & Logged Purchases */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Top Expense Items
              </h3>
              <span className="text-[10px] text-slate-400">Ranked by cost</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {analytics.topExpenses.map((t, idx) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center font-bold text-[10px] text-slate-500">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {t.merchant || 'Expense Item'}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.date}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-rose-500">
                    -{formatCurrency(t.amount, t.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
