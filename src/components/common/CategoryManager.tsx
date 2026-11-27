/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Tag, Trash2, Check, X } from 'lucide-react';
import { useCustomization, useFinanceData } from '../../context/FinanceContext';
import { Category } from '../../types/finance';
import { createCustomCategory, pickReplacementCategory, validateCategoryName } from '../../utils/customization';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Settings section for the user's own categories: add, rename, delete.
 * Deleting a category that entries use moves those entries to the fallback
 * category (e.g. "Uncategorized") after confirmation.
 */
export const CategoryManager: React.FC = () => {
  const { categories, transactions, editTransaction } = useFinanceData();
  const { customCategories, saveCustomCategory, deleteCustomCategory, customizationError } = useCustomization();

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ category: Category; uses: number } | null>(null);

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of transactions) counts.set(tx.categoryId, (counts.get(tx.categoryId) ?? 0) + 1);
    return counts;
  }, [transactions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateCategoryName(newName, newType, categories);
    if (err) {
      setAddError(err);
      return;
    }
    await saveCustomCategory(createCustomCategory(newName, newType));
    setNewName('');
    setAddError('');
  };

  const handleRename = async (cat: Category) => {
    const err = validateCategoryName(editName, cat.type, categories, cat.id);
    if (err) {
      setEditError(err);
      return;
    }
    await saveCustomCategory({ ...cat, name: editName.trim() });
    setEditingId(null);
    setEditError('');
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { category } = pendingDelete;
    const replacement = pickReplacementCategory(categories, category);
    const affected = transactions.filter((tx) => tx.categoryId === category.id);
    if (replacement) {
      await Promise.all(affected.map((tx) => editTransaction(tx.id, { categoryId: replacement.id })));
    }
    await deleteCustomCategory(category.id);
    setPendingDelete(null);
  };

  const fallbackName = pendingDelete ? pickReplacementCategory(categories, pendingDelete.category)?.name ?? '' : '';

  return (
    <div className="space-y-2.5">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7268] dark:text-[#8E9689]">
        Your categories
      </span>

      {customCategories.length === 0 ? (
        <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
          Add categories that fit your life, like "Gym" or "Mosque donations". They sync to your account.
        </p>
      ) : (
        <ul className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden">
          {customCategories.map((cat) => {
            const uses = usage.get(cat.id) ?? 0;
            const isEditing = editingId === cat.id;
            return (
              <li key={cat.id} className="px-3 py-2 bg-[#F4F5F0] dark:bg-[#0D0F0C]">
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleRename(cat);
                    }}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        aria-label={`New name for ${cat.name}`}
                        className="flex-1 min-w-0 min-h-[36px] px-2.5 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-xs focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
                      />
                      <button type="submit" aria-label="Save name" className="w-9 h-9 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel rename"
                        onClick={() => {
                          setEditingId(null);
                          setEditError('');
                        }}
                        className="w-9 h-9 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {editError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{editError}</p>}
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
                      <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] truncate">{cat.name}</span>
                      <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689] shrink-0">
                        {cat.type === 'income' ? 'Income' : 'Expense'} · {uses} {uses === 1 ? 'entry' : 'entries'}
                      </span>
                    </span>
                    <span className="flex items-center shrink-0">
                      <button
                        type="button"
                        aria-label={`Rename ${cat.name}`}
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                          setEditError('');
                        }}
                        className="w-9 h-9 rounded-lg text-[#5E655A] dark:text-[#A4AC9E] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${cat.name}`}
                        onClick={() => setPendingDelete({ category: cat, uses })}
                        className="w-9 h-9 rounded-lg text-[#8E9689] hover:text-rose-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (addError) setAddError('');
            }}
            placeholder="New category name"
            aria-label="New category name"
            maxLength={60}
            className="flex-1 min-w-0 min-h-[40px] px-3 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'expense' | 'income')}
            aria-label="Category type"
            className="min-h-[40px] px-2 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold focus:outline-none"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button
            type="submit"
            className="min-h-[40px] px-3 rounded-xl bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-xs font-semibold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
        {addError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{addError}</p>}
        {customizationError && <p className="text-[11px] text-amber-700 dark:text-amber-300">{customizationError}</p>}
      </form>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={`Delete "${pendingDelete?.category.name ?? ''}"?`}
        description={
          pendingDelete && pendingDelete.uses > 0
            ? `${pendingDelete.uses} ${pendingDelete.uses === 1 ? 'entry uses' : 'entries use'} this category. ${pendingDelete.uses === 1 ? 'It' : 'They'} will move to "${fallbackName}". Any budget for it is removed too.`
            : 'No entries use this category. Any budget for it is removed too.'
        }
        confirmLabel="Delete category"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
