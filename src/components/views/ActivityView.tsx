/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Search,
  Plus,
  Receipt,
  Download,
  Coffee,
  IceCream,
  ShoppingCart,
  GraduationCap,
  Briefcase,
  HeartHandshake,
} from 'lucide-react';
import { HoldAmount } from '../common/HoldAmount';

export const ActivityView: React.FC = () => {
  const {
    transactions,
    categories,
    openTransactionModal,
    exportTransactionsCSV,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
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
  }, [transactions, searchQuery, selectedCategory, categories]);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Spending & Inflow
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Activity Log
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportTransactionsCSV}
            className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => openTransactionModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items, eggs, coffee, ice cream..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Filter Chips for Student categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          All Items
        </button>

        <button
          onClick={() => setSelectedCategory('income')}
          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'income'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          Placement & Income
        </button>

        {categories
          .filter((c) => c.type === 'expense')
          .map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
      </div>

      {/* Activity Items List */}
      <div className="space-y-2 flex-1 pb-6">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 p-6">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">No items found</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Try searching for groceries, coffee, or placement.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
            {filteredTransactions.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  onClick={() => openTransactionModal(tx)}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 text-xs font-bold"
                        style={{ backgroundColor: category?.color || '#8E8E93' }}
                      >
                        {isIncome ? '+' : '–'}
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span>{tx.merchant || category?.name || 'Item'}</span>
                          {tx.isCharity && (
                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                              Charity
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
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

                  {/* Itemized Allotment Preview if from Receipt Scan */}
                  {tx.receiptItems && tx.receiptItems.length > 0 && (
                    <div className="ml-12 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Itemized Receipt Allotment:
                      </span>
                      {tx.receiptItems.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span>• {it.name} ({it.category})</span>
                          <span className="font-mono font-medium">
                            <HoldAmount amount={it.price} currency={tx.currency} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
