/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useFinanceData, useFinanceUI } from '../../context/FinanceContext';
import {
  Search,
  Plus,
  Download,
  Heart,
  ChevronDown,
} from 'lucide-react';
import { formatDayHeading, groupByDay } from '../../utils/dates';
import { HoldAmount } from '../common/HoldAmount';
import { MinimalHeader } from '../common/MinimalHeader';
import { BankLogo } from '../common/BankLogo';
import { TransactionIcon } from '../common/TransactionIcon';
import { TransactionAmount } from '../common/TransactionAmount';
import { findBankPreset } from '../../utils/koreanBanks';

export const ActivityView: React.FC = () => {
  const { transactions, accounts, categories, exportTransactionsCSV } = useFinanceData();
  const { openTransactionModal, selectedBankFilter, setSelectedBankFilter } = useFinanceUI();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isArchived), [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedBankFilter) {
        if (tx.accountId !== selectedBankFilter && tx.toAccountId !== selectedBankFilter) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMerchant = (tx.merchant || '').toLowerCase().includes(q);
        const matchNotes = (tx.notes || '').toLowerCase().includes(q);
        const matchCategory = categories.find((c) => c.id === tx.categoryId)?.name.toLowerCase().includes(q);
        const matchItems = (tx.receiptItems || []).some((it) => it.name.toLowerCase().includes(q));
        if (!matchMerchant && !matchNotes && !matchCategory && !matchItems) return false;
      }

      if (selectedCategory !== 'all') {
        if (selectedCategory === 'income') {
          if (tx.type !== 'income') return false;
        } else if (selectedCategory === 'charity') {
          if (!tx.isCharity) return false;
        } else {
          if (tx.categoryId !== selectedCategory) return false;
        }
      }

      return true;
    });
  }, [transactions, selectedBankFilter, searchQuery, selectedCategory, categories]);

  const dayGroups = useMemo(() => groupByDay(filteredTransactions), [filteredTransactions]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Receipt item lists start collapsed so one long receipt doesn't swamp the ledger.
  const [expandedReceipts, setExpandedReceipts] = useState<Set<string>>(() => new Set());
  const toggleReceipt = (id: string) => {
    setExpandedReceipts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasActiveFilters =
    Boolean(selectedBankFilter) || searchQuery.trim() !== '' || selectedCategory !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBankFilter(null);
  };

  return (
    <div className="flex-1 flex flex-col">
      <MinimalHeader />

      <div className="px-4 sm:px-6 pt-2 space-y-4 flex-1 flex flex-col">
        {/* Title Row */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
              Activity Ledger
            </h1>
            <p className="text-xs text-[#6B7268] dark:text-[#8E9689] mt-0.5">
              {filteredTransactions.length} entries across {activeAccounts.length} linked banks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportTransactionsCSV}
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-[#4B5248] dark:text-[#B4BCB0] hover:text-[#111315] dark:hover:text-white transition flex items-center justify-center"
              title="Export CSV"
              aria-label="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => openTransactionModal()}
              className="h-10 px-3.5 rounded-xl bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Search transactions, merchants, notes, or receipt items"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchants, notes, or receipt items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-xs text-[#111315] dark:text-[#F4F5F0] placeholder-[#8E9689] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
          />
        </div>

        {/* Bank Account Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedBankFilter(null)}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap border transition ${
              !selectedBankFilter
                ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] border-transparent'
                : 'bg-white dark:bg-[#161915] text-[#5E655A] dark:text-[#A4AC9E] border-black/[0.07] dark:border-white/[0.08]'
            }`}
          >
            All Banks
          </button>

          {activeAccounts.map((acc) => {
            const bankInfo = findBankPreset(acc.institution || acc.name);
            const isSelected = selectedBankFilter === acc.id;

            return (
              <button
                key={acc.id}
                onClick={() => setSelectedBankFilter(isSelected ? null : acc.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap border transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] border-transparent'
                    : 'bg-white dark:bg-[#161915] text-[#5E655A] dark:text-[#A4AC9E] border-black/[0.07] dark:border-white/[0.08]'
                }`}
              >
                <BankLogo bank={bankInfo} size="xs" />
                <span>{acc.name}</span>
              </button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-black/[0.08] dark:bg-white/[0.12] text-[#111315] dark:text-white'
                : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
            }`}
          >
            All Categories
          </button>

          <button
            onClick={() => setSelectedCategory('income')}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
              selectedCategory === 'income'
                ? 'bg-black/[0.08] dark:bg-white/[0.12] text-[#111315] dark:text-white'
                : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
            }`}
          >
            Inflow
          </button>

          <button
            onClick={() => setSelectedCategory('charity')}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition inline-flex items-center gap-1 ${
              selectedCategory === 'charity'
                ? 'bg-black/[0.08] dark:bg-white/[0.12] text-[#111315] dark:text-white'
                : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
            }`}
          >
            <Heart className="w-3 h-3" />
            Charity
          </button>

          {categories
            .filter((c) => c.type === 'expense')
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-black/[0.08] dark:bg-white/[0.12] text-[#111315] dark:text-white font-semibold'
                    : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>

        {/* Transactions Ledger */}
        <div className="flex-1 pb-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-14 rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-6 space-y-1.5">
              <Search className="w-6 h-6 mx-auto text-[#8E9689] stroke-[1.5]" />
              <h3 className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]">
                {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
              </h3>
              <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                {hasActiveFilters
                  ? 'Your search, bank, or category filter is hiding every entry.'
                  : 'Tap New Entry to log your first one.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 h-8 px-3.5 rounded-xl bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-xs font-semibold transition active:scale-95"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {dayGroups.map((group) => (
                <section key={group.date} aria-label={formatDayHeading(group.date)}>
                  <h2 className="px-1 pb-2 text-[13px] font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                    {formatDayHeading(group.date)}
                  </h2>
                  <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden">
                    {group.items.map((tx) => {
                      const category = categoryById.get(tx.categoryId);
                      const account = accountById.get(tx.accountId);
                      const bankInfo = account ? findBankPreset(account.institution || account.name) : null;
                      const toAccount =
                        tx.type === 'transfer' && tx.toAccountId
                          ? accountById.get(tx.toAccountId)
                          : undefined;
                      const itemCount = tx.receiptItems?.length ?? 0;
                      const isExpanded = expandedReceipts.has(tx.id);

                      return (
                        <div key={tx.id}>
                          <button
                            type="button"
                            onClick={() => openTransactionModal(tx)}
                            className="w-full text-left p-4 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition block"
                          >
                            <div className="flex items-center justify-between gap-3">
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
                                    <span className="text-sm font-semibold leading-snug text-[#111315] dark:text-[#F4F5F0] line-clamp-2 break-words break-keep">
                                      {tx.merchant || category?.name || 'Transaction'}
                                    </span>
                                    {tx.isCharity && (
                                      <Heart className="w-3 h-3 text-[#6B7268] dark:text-[#C8EC45] shrink-0" />
                                    )}
                                  </div>

                                  <div className="text-xs text-[#6B7268] dark:text-[#8E9689] flex items-center gap-1.5 mt-0.5 truncate">
                                    {bankInfo && account && (
                                      <>
                                        <span className="inline-flex items-center gap-1.5 text-[#111315] dark:text-[#D5DCD0] font-medium shrink-0">
                                          <BankLogo bank={bankInfo} size="xs" />
                                          {account.name}
                                          {account.isArchived ? ' (Archived)' : ''}
                                          {toAccount && ` → ${toAccount.name}`}
                                        </span>
                                        <span className="shrink-0">·</span>
                                      </>
                                    )}
                                    <span className="truncate">
                                      {tx.type === 'transfer' ? 'Transfer' : category?.name}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <TransactionAmount tx={tx} size="md" />
                              </div>
                            </div>
                          </button>

                          {itemCount > 0 && (
                            <div className="pl-16 pr-4 pb-3 -mt-1">
                              <button
                                type="button"
                                onClick={() => toggleReceipt(tx.id)}
                                aria-expanded={isExpanded}
                                aria-controls={`receipt-${tx.id}`}
                                className="min-h-[36px] inline-flex items-center gap-1 text-[11px] font-semibold text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                                {isExpanded ? 'Hide' : 'Show'} {itemCount} receipt {itemCount === 1 ? 'item' : 'items'}
                              </button>

                              {isExpanded && (
                                <div
                                  id={`receipt-${tx.id}`}
                                  className="mt-2 p-3 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.05] dark:border-white/[0.06] text-[11px] space-y-1"
                                >
                                  {tx.receiptItems!.map((it) => (
                                    <div
                                      key={it.id}
                                      className="flex items-center justify-between text-[#3E443C] dark:text-[#C8CFC4]"
                                    >
                                      <span className="truncate pr-2">
                                        {it.name} · {it.category}
                                      </span>
                                      <span className="font-mono font-semibold tabular-nums shrink-0">
                                        <HoldAmount amount={it.price} currency={tx.currency} interactive={false} />
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
