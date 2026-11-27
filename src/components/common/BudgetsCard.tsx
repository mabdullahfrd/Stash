/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import { useCustomization, useFinanceData } from '../../context/FinanceContext';
import { computeBudgetProgress, BudgetProgress } from '../../utils/customization';
import { formatCurrency } from '../../utils/currencies';
import { InlineAmountInput } from './InlineAmountInput';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const barClass: Record<BudgetProgress['status'], string> = {
  ok: 'bg-[#C8EC45]',
  warning: 'bg-amber-400',
  over: 'bg-rose-500',
};

/**
 * Monthly spending limits per expense category, with this month's progress.
 * Amounts are stored in the currency that was active when the budget was set.
 */
export const BudgetsCard: React.FC = () => {
  const { transactions, categories, rates, accounts, activeCurrency } = useFinanceData();
  const { budgets, setBudget, removeBudget } = useCustomization();

  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAmount, setNewAmount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [error, setError] = useState('');

  const rows = useMemo(
    () =>
      computeBudgetProgress(budgets, transactions, categories, rates, new Date(), accounts).sort(
        (a, b) => b.percent - a.percent
      ),
    [budgets, transactions, categories, rates, accounts]
  );

  const budgetedIds = new Set(budgets.map((b) => b.categoryId));
  const available = categories.filter(
    (c) => c.type === 'expense' && !c.isCharity && !budgetedIds.has(c.id)
  );
  const monthName = MONTHS[new Date().getMonth()];

  const startAdding = () => {
    setIsAdding(true);
    setNewCategoryId(available[0]?.id ?? '');
    setNewAmount(0);
    setError('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryId) return setError('Pick a category.');
    if (!(newAmount > 0)) return setError('Enter a monthly limit.');
    await setBudget(newCategoryId, newAmount, activeCurrency);
    setIsAdding(false);
  };

  return (
    <section
      aria-label="Monthly budgets"
      className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-[#111315] dark:text-[#F4F5F0] flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            Monthly budgets
          </h2>
          <p className="text-xs text-[#6B7268] dark:text-[#8E9689]">{monthName} spending against your limits</p>
        </div>
        {!isAdding && available.length > 0 && (
          <button
            type="button"
            onClick={startAdding}
            className="min-h-[40px] px-3 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.06] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] inline-flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Set budget
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 rounded-2xl bg-[#F4F5F0] dark:bg-[#0D0F0C] space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              aria-label="Budget category"
              className="flex-1 min-w-[140px] min-h-[36px] px-2 rounded-md bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium focus:outline-none"
            >
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <InlineAmountInput
              value={newAmount}
              currency={activeCurrency}
              onChange={setNewAmount}
              ariaLabel="Monthly limit"
            />
          </div>
          {error && <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="min-h-[36px] px-3 rounded-lg text-xs font-semibold text-[#5E655A] dark:text-[#A4AC9E]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[36px] px-3.5 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-xs font-semibold"
            >
              Save budget
            </button>
          </div>
        </form>
      )}

      {rows.length === 0 && !isAdding ? (
        <p className="text-xs text-[#6B7268] dark:text-[#8E9689]">
          Set a monthly limit for a category — for example Coffee {formatCurrency(activeCurrency === 'KRW' ? 50000 : 40, activeCurrency)} — and see how much is left as you spend.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((row) => {
            const { budget, category, spent, remaining, percent, status } = row;
            const isEditing = editingId === budget.categoryId;
            return (
              <li key={budget.categoryId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold leading-snug text-[#111315] dark:text-[#F4F5F0] line-clamp-2 break-words break-keep min-w-0">
                    {category?.name ?? 'Removed category'}
                  </span>
                  {isEditing ? (
                    <span className="flex items-center gap-1 shrink-0">
                      <InlineAmountInput
                        value={editAmount}
                        currency={budget.currency}
                        onChange={setEditAmount}
                        ariaLabel={`Monthly limit for ${category?.name ?? 'category'}`}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (editAmount > 0) await setBudget(budget.categoryId, editAmount, budget.currency);
                          setEditingId(null);
                        }}
                        className="min-h-[36px] px-2.5 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await removeBudget(budget.categoryId);
                          setEditingId(null);
                        }}
                        aria-label={`Remove budget for ${category?.name ?? 'category'}`}
                        className="w-9 h-9 rounded-lg text-[#8E9689] hover:text-rose-500 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-sm font-semibold font-mono tabular-nums ${
                          status === 'over'
                            ? 'text-rose-600 dark:text-rose-400'
                            : status === 'warning'
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-[#111315] dark:text-[#F4F5F0]'
                        }`}
                      >
                        {status === 'over'
                          ? `${formatCurrency(-remaining, budget.currency)} over`
                          : `${formatCurrency(remaining, budget.currency)} left`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(budget.categoryId);
                          setEditAmount(budget.amount);
                        }}
                        aria-label={`Edit budget for ${category?.name ?? 'category'}`}
                        className="w-9 h-9 -mr-2 rounded-lg text-[#8E9689] hover:text-[#111315] dark:hover:text-white flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </div>
                <div
                  className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden"
                  role="progressbar"
                  aria-label={`${category?.name ?? 'Budget'} used`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, percent)}
                >
                  <div className={`h-full rounded-full ${barClass[status]}`} style={{ width: `${Math.min(100, percent)}%` }} />
                </div>
                <p className="text-xs text-[#6B7268] dark:text-[#8E9689] tabular-nums">
                  {formatCurrency(spent, budget.currency)} of {formatCurrency(budget.amount, budget.currency)} spent ({percent}%)
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
