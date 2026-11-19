/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  Trash2,
  Check,
  Heart,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react';
import { CurrencyCode, TransactionType } from '../../types/finance';
import { CURRENCY_REGISTRY, formatCurrency } from '../../utils/currencies';
import { findBankPreset } from '../../utils/koreanBanks';
import { BankLogo } from '../common/BankLogo';
import { resolveTransactionIcon } from '../common/TransactionIcon';
import { inferCategoryForItem } from '../../utils/autoCategorize';

export const TransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    editingTransaction,
    initialTransactionType,
    initialAccountId,
    addTransaction,
    editTransaction,
    deleteTransaction,
    accounts,
    accountBalances,
    categories,
    activeCurrency,
    openAccountModal,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>(activeCurrency);
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isCharity, setIsCharity] = useState<boolean>(false);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [categoryManuallyPicked, setCategoryManuallyPicked] = useState<boolean>(false);
  const [autoMatchedLabel, setAutoMatchedLabel] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCurrency(editingTransaction.currency);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setCategoryId(editingTransaction.categoryId);
      setMerchant(editingTransaction.merchant || '');
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
      setIsCharity(editingTransaction.isCharity || false);
      setReceiptUrl(editingTransaction.receiptUrl || '');
      setCategoryManuallyPicked(true);
      setAutoMatchedLabel(null);
    } else {
      setType(initialTransactionType || 'expense');
      setAmount('');
      const targetAcc = accounts.find((a) => a.id === initialAccountId) || accounts[0];
      setCurrency(targetAcc?.currency || activeCurrency);
      setAccountId(targetAcc?.id || '');
      const nextAcc = accounts.find((a) => a.id !== targetAcc?.id);
      setToAccountId(nextAcc?.id || '');
      const defaultCat = categories.find((c) => c.type === (initialTransactionType || 'expense'));
      setCategoryId(defaultCat?.id || categories[0]?.id || '');
      setMerchant('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setIsCharity(false);
      setReceiptUrl('');
      setCategoryManuallyPicked(false);
      setAutoMatchedLabel(null);
    }
    setError('');
  }, [editingTransaction, isTransactionModalOpen, accounts, categories, activeCurrency, initialTransactionType, initialAccountId]);

  if (!isTransactionModalOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0];
  const selectedBankInfo = selectedAccount ? findBankPreset(selectedAccount.institution || selectedAccount.name) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }

    if (!accountId) {
      setError('Select the bank account used.');
      return;
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setError('Select a different destination bank account.');
      return;
    }

    const selectedCategoryObj = categories.find((c) => c.id === categoryId);
    const payload = {
      type,
      amount: numAmount,
      currency,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      categoryId,
      merchant: merchant.trim() || undefined,
      date,
      notes: notes.trim() || undefined,
      isCharity: isCharity || selectedCategoryObj?.isCharity || undefined,
      receiptUrl: receiptUrl || undefined,
    };

    if (editingTransaction) {
      editTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }

    closeTransactionModal();
  };

  const handleDelete = () => {
    if (editingTransaction) {
      deleteTransaction(editingTransaction.id);
      closeTransactionModal();
    }
  };

  const availableCategories = categories.filter((c) => {
    if (type === 'income') return c.type === 'income';
    if (type === 'expense') return c.type === 'expense';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#161915] rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08]">
        {/* Header */}
        <div className="px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.07] shrink-0">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
              Assign bank account, category, and amount
            </p>
          </div>
          <button
            onClick={closeTransactionModal}
            className="w-8 h-8 rounded-full bg-[#F4F5F0] dark:bg-white/[0.06] flex items-center justify-center text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Type Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C]">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryManuallyPicked(false);
                const inferred = inferCategoryForItem(merchant, categories, 'expense');
                if (inferred) {
                  setCategoryId(inferred.categoryId);
                  setIsCharity(inferred.isCharity);
                  setAutoMatchedLabel(inferred.categoryName);
                } else {
                  const cat = categories.find((c) => c.type === 'expense');
                  if (cat) setCategoryId(cat.id);
                  setAutoMatchedLabel(null);
                }
              }}
              className={`py-2 rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315]'
                  : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryManuallyPicked(false);
                const inferred = inferCategoryForItem(merchant, categories, 'income');
                if (inferred) {
                  setCategoryId(inferred.categoryId);
                  setIsCharity(false);
                  setAutoMatchedLabel(inferred.categoryName);
                } else {
                  const cat = categories.find((c) => c.type === 'income');
                  if (cat) setCategoryId(cat.id);
                  setAutoMatchedLabel(null);
                }
              }}
              className={`py-2 rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315]'
                  : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setAutoMatchedLabel(null);
              }}
              className={`py-2 rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1.5 ${
                type === 'transfer'
                  ? 'bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315]'
                  : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount & Currency */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[#8E9689] text-xl">
                {CURRENCY_REGISTRY[currency]?.symbol || '₩'}
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] font-mono text-2xl font-bold tabular-nums focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="py-3.5 px-3 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] font-semibold text-xs focus:outline-none"
            >
              {(['KRW', 'USD', 'EUR', 'PKR'] as CurrencyCode[]).map((curr) => (
                <option key={curr} value={curr}>
                  {curr} ({CURRENCY_REGISTRY[curr].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Specific Item & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-[#111315] dark:text-[#F4F5F0] text-xs block">
                Specific Item / Merchant
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => {
                  const val = e.target.value;
                  setMerchant(val);
                  if (!categoryManuallyPicked && type !== 'transfer') {
                    const inferred = inferCategoryForItem(val, categories, type);
                    if (inferred) {
                      setCategoryId(inferred.categoryId);
                      setIsCharity(inferred.isCharity);
                      setAutoMatchedLabel(inferred.categoryName);
                    } else {
                      setAutoMatchedLabel(null);
                    }
                  }
                }}
                placeholder="e.g. Eggs, Coffee, Subway, Zakat..."
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] text-xs focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#4B5248] dark:text-[#B4BCB0] text-xs block">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] text-xs focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>
          </div>

          {/* Category (Auto-assigned from Specific Item) */}
          {type !== 'transfer' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="font-semibold text-[#111315] dark:text-[#F4F5F0] text-xs block">
                  Category
                </label>
                {autoMatchedLabel && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#C8EC45]/35 dark:bg-[#C8EC45]/20 text-[#111315] dark:text-[#C8EC45] truncate">
                    Auto · {autoMatchedLabel}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {availableCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  const CatIcon = resolveTransactionIcon({
                    categoryName: cat.name,
                    categoryIcon: cat.icon,
                    type: cat.type === 'income' ? 'income' : 'expense',
                    isCharity: Boolean(cat.isCharity || cat.id === 'cat-charity'),
                  });
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(cat.id);
                        setIsCharity(Boolean(cat.isCharity));
                        setCategoryManuallyPicked(true);
                        setAutoMatchedLabel(null);
                      }}
                      className={`p-2 rounded-xl text-left font-medium text-[11px] border transition flex items-center gap-2 ${
                        isSelected
                          ? 'border-[#141617] dark:border-[#C8EC45] bg-[#F9FAF6] dark:bg-[#1E231C] text-[#111315] dark:text-white font-semibold'
                          : 'border-black/[0.06] dark:border-white/[0.06] bg-[#F4F5F0] dark:bg-[#0D0F0C] text-[#5E655A] dark:text-[#A4AC9E]'
                      }`}
                    >
                      <CatIcon className="w-3.5 h-3.5 shrink-0 stroke-[1.9]" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bank Account Selector */}
          <div className="space-y-2">
            <label className="font-semibold text-[#111315] dark:text-[#F4F5F0] text-xs block">
              {type === 'transfer' ? 'From Account' : 'Bank Account Used'}
            </label>

            {accounts.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-dashed border-black/[0.14] dark:border-white/[0.14] flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                  Link a bank account first to log transactions.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    closeTransactionModal();
                    openAccountModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold shrink-0"
                >
                  Link Bank
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-2">
              {accounts.map((acc) => {
                const isSelected = accountId === acc.id;
                const bankInfo = findBankPreset(acc.institution || acc.name);
                const bal = accountBalances[acc.id] ?? acc.balance;

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#F9FAF6] dark:bg-[#1E231C] border-[#141617] dark:border-[#C8EC45]'
                        : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06] opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <BankLogo bank={bankInfo} size="sm" />
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#141617] dark:text-[#C8EC45]" />
                      )}
                    </div>

                    <div>
                      <span className="font-semibold text-[#111315] dark:text-[#F4F5F0] block text-[11px] truncate">
                        {acc.name}
                      </span>
                      <span className="text-[10px] font-mono text-[#6B7268] dark:text-[#8E9689] block truncate tabular-nums">
                        {formatCurrency(bal, acc.currency)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            )}

            {selectedAccount && selectedBankInfo && (
              <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] flex items-center gap-1.5">
                <BankLogo bank={selectedBankInfo} size="xs" />
                <span>
                  {type === 'expense'
                    ? `Deducted from ${selectedAccount.name}`
                    : type === 'income'
                    ? `Deposited into ${selectedAccount.name}`
                    : `Transferring from ${selectedAccount.name}`}
                </span>
              </p>
            )}
          </div>

          {/* Transfer Destination */}
          {type === 'transfer' && (
            <div className="space-y-1.5">
              <label className="font-semibold text-[#111315] dark:text-[#F4F5F0] text-xs block">
                Destination Bank Account
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] text-xs font-medium focus:outline-none"
              >
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution}) · {formatCurrency(accountBalances[acc.id] ?? acc.balance, acc.currency)}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 10% Charity Notice on Income */}
          {type === 'income' && amount && parseFloat(amount) > 0 && (
            <div className="p-3 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C8EC45] text-[#111315] flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-[#4B5248] dark:text-[#B4BCB0]">
                After saving, you will be prompted to allocate 10% (
                <span className="font-mono font-semibold text-[#111315] dark:text-white">
                  {CURRENCY_REGISTRY[currency]?.symbol || '₩'}
                  {Math.round(parseFloat(amount) * 0.1).toLocaleString()}
                </span>
                ) to charity.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2.5">
            {editingTransaction && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition"
                title="Delete"
                aria-label="Delete transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition"
            >
              {editingTransaction ? 'Save Changes' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
