/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  Camera,
  Trash2,
  HeartHandshake,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { CurrencyCode, TransactionType } from '../../types/finance';
import { CURRENCY_REGISTRY } from '../../utils/currencies';

export const TransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    editingTransaction,
    initialTransactionType,
    addTransaction,
    editTransaction,
    deleteTransaction,
    accounts,
    categories,
    charityPledges,
    activeCurrency,
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
  const [charityPledgeId, setCharityPledgeId] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
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
      setCharityPledgeId(editingTransaction.charityPledgeId || '');
      setReceiptUrl(editingTransaction.receiptUrl || '');
    } else {
      setType(initialTransactionType || 'expense');
      setAmount('');
      setCurrency(activeCurrency);
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      const defaultCat = categories.find((c) => c.type === 'expense');
      setCategoryId(defaultCat?.id || categories[0]?.id || '');
      setMerchant('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setIsCharity(false);
      setCharityPledgeId('');
      setReceiptUrl('');
    }
    setError('');
  }, [editingTransaction, isTransactionModalOpen, accounts, categories, activeCurrency]);

  if (!isTransactionModalOpen) return null;

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateReceipt = () => {
    // Generate a sleek canvas SVG receipt preview for offline testing
    const simulatedReceipt = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" fill="%23f8fafc"><rect width="300" height="200" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="20" y="35" font-family="monospace" font-size="14" font-weight="bold" fill="%230f172a">OFFICIAL RECEIPT</text><text x="20" y="60" font-family="sans-serif" font-size="11" fill="%2364748b">Merchant: ${merchant || 'Organic Store'}</text><text x="20" y="80" font-family="sans-serif" font-size="11" fill="%2364748b">Date: ${date}</text><text x="20" y="100" font-family="sans-serif" font-size="11" fill="%2364748b">Currency: ${currency}</text><line x1="20" y1="120" x2="280" y2="120" stroke="%23e2e8f0" stroke-dasharray="4"/><text x="20" y="150" font-family="monospace" font-size="16" font-weight="bold" fill="%230f172a">TOTAL: ${currency} ${amount || '0.00'}</text><text x="20" y="180" font-family="sans-serif" font-size="10" fill="%2394a3b8">Verified Digital Attachment</text></svg>`;
    setReceiptUrl(simulatedReceipt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!accountId) {
      setError('Please select an account.');
      return;
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setError('Please select a different destination account for the transfer.');
      return;
    }

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
      isCharity: isCharity || undefined,
      charityPledgeId: isCharity && charityPledgeId ? charityPledgeId : undefined,
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
    return true; // transfer
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            onClick={closeTransactionModal}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Type Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                  type === t
                    ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Big Amount & Currency Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-lg">
                {CURRENCY_REGISTRY[currency]?.symbol || '$'}
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="py-3.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none"
            >
              {(['USD', 'EUR', 'KRW', 'PKR'] as CurrencyCode[]).map((curr) => (
                <option key={curr} value={curr}>
                  {curr} ({CURRENCY_REGISTRY[curr].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Account Selector */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Destination Account */}
          {type === 'transfer' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                To Account
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Category Selector (when not transfer) */}
          {type !== 'transfer' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Merchant & Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Merchant / Description
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Whole Foods, Korail"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Charity Link Toggle */}
          {type === 'expense' && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-800 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={isCharity}
                  onChange={(e) => setIsCharity(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <span>Mark as Philanthropic / Charity Gift</span>
              </label>

              {isCharity && charityPledges.length > 0 && (
                <div className="pt-2">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Link to Pending Pledge:
                  </label>
                  <select
                    value={charityPledgeId}
                    onChange={(e) => setCharityPledgeId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Independent Charity Gift</option>
                    {charityPledges
                      .filter((p) => p.status !== 'fulfilled')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.currency} {p.pledgedAmount})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add memo or itemized notes..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Receipt Attachment Photo */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-600 dark:text-slate-400 block">
              Receipt Attachment
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-200 transition">
                <Camera className="w-4 h-4 text-blue-500" />
                <span>Choose Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleSimulateReceipt}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 transition"
              >
                Scan Receipt Demo
              </button>

              {receiptUrl && (
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="text-rose-500 hover:underline text-[11px] font-semibold ml-auto"
                >
                  Remove
                </button>
              )}
            </div>

            {receiptUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-36 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2">
                <img
                  src={receiptUrl}
                  alt="Receipt Preview"
                  className="max-h-32 object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            {editingTransaction && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 transition"
                title="Delete Transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition text-sm"
            >
              {editingTransaction ? 'Save Changes' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
