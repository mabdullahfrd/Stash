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
} from 'lucide-react';
import { HoldAmount } from '../common/HoldAmount';
import { MinimalHeader } from '../common/MinimalHeader';
import { BankLogo } from '../common/BankLogo';
import { TransactionIcon } from '../common/TransactionIcon';
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
              className="w-9 h-9 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-[#4B5248] dark:text-[#B4BCB0] hover:text-[#111315] dark:hover:text-white transition flex items-center justify-center"
              title="Export CSV"
              aria-label="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => openTransactionModal()}
              className="h-9 px-3.5 rounded-xl bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
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
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap border transition ${
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
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap border transition flex items-center gap-2 ${
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
            className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-black/[0.08] dark:bg-white/[0.12] text-[#111315] dark:text-white'
                : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
            }`}
          >
            All Categories
          </button>

          <button
            onClick={() => setSelectedCategory('income')}
            className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
              selectedCategory === 'income'
                ? 'bg-black/[0.08] dark:bg-white/[0.12] text-[#111315] dark:text-white'
                : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
            }`}
          >
            Inflow
          </button>

          {categories
            .filter((c) => c.type === 'expense')
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
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
                No matching transactions
              </h3>
              <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                Clear your bank filter or search query to view all records.
              </p>
            </div>
          ) : (
            <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden">
              {filteredTransactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                const isIncome = tx.type === 'income';
                const account = accounts.find((a) => a.id === tx.accountId);
                const bankInfo = account ? findBankPreset(account.institution || account.name) : null;

                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => openTransactionModal(tx)}
                    className="w-full text-left p-4 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition space-y-2.5 block"
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
                            <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] truncate">
                              {tx.merchant || category?.name || 'Transaction'}
                            </span>
                            {tx.isCharity && (
                              <Heart className="w-3 h-3 text-[#6B7268] dark:text-[#C8EC45] shrink-0" />
                            )}
                          </div>

                          <div className="text-[11px] text-[#6B7268] dark:text-[#8E9689] flex items-center gap-1.5 mt-0.5 truncate">
                            {bankInfo && account && (
                              <>
                                <span className="inline-flex items-center gap-1.5 text-[#111315] dark:text-[#D5DCD0] font-medium shrink-0">
                                  <BankLogo bank={bankInfo} size="xs" />
                                  {account.name}
                                  {account.isArchived ? ' (Archived)' : ''}
                                </span>
                                <span className="shrink-0">·</span>
                              </>
                            )}
                            <span className="truncate">{category?.name}</span>
                            <span className="shrink-0">·</span>
                            <span className="shrink-0">{tx.date}</span>
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
                    </div>

                    {tx.receiptItems && tx.receiptItems.length > 0 && (
                      <div className="ml-12 p-3 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.05] dark:border-white/[0.06] text-[11px] space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7268] dark:text-[#8E9689] block">
                          Itemized Receipt ({tx.receiptItems.length})
                        </span>
                        {tx.receiptItems.map((it, idx) => (
                          <div
                            key={idx}
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
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
