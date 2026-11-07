/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Building2, CreditCard, PiggyBank, Wallet } from 'lucide-react';
import { AccountType, CurrencyCode } from '../../types/finance';
import { CURRENCY_REGISTRY } from '../../utils/currencies';

export const AccountModal: React.FC = () => {
  const { isAccountModalOpen, closeAccountModal, addAccount, activeCurrency } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState<CurrencyCode>(activeCurrency);
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [institution, setInstitution] = useState('');
  const [color, setColor] = useState('#007AFF');
  const [error, setError] = useState('');

  if (!isAccountModalOpen) return null;

  const colors = [
    '#007AFF', // Blue
    '#34C759', // Green
    '#5856D6', // Indigo
    '#FF9500', // Orange
    '#AF52DE', // Purple
    '#FF2D55', // Pink
    '#8E8E93', // Gray
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an account name.');
      return;
    }
    const numBalance = parseFloat(balance) || 0;
    const numLimit = creditLimit ? parseFloat(creditLimit) : undefined;

    const icon =
      type === 'checking'
        ? 'Building2'
        : type === 'savings'
        ? 'PiggyBank'
        : type === 'credit'
        ? 'CreditCard'
        : 'Wallet';

    addAccount({
      name: name.trim(),
      type,
      currency,
      balance: numBalance,
      creditLimit: numLimit,
      institution: institution.trim() || name.trim(),
      color,
      icon,
    });

    closeAccountModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />

        <div className="px-5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Add New Account
            </h2>
          </div>
          <button
            onClick={closeAccountModal}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Account Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Account Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Chartered Checking, Woori Bank Won"
              autoFocus
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Account Type */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Account Type
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {(['checking', 'savings', 'credit', 'cash'] as AccountType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 text-[11px] font-semibold rounded-lg capitalize transition-all ${
                    type === t
                      ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Currency & Initial Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none"
              >
                {(['USD', 'EUR', 'KRW', 'PKR'] as CurrencyCode[]).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_REGISTRY[c].symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                {type === 'credit' ? 'Current Debt Owed' : 'Starting Balance'}
              </label>
              <input
                type="number"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Credit Limit (if Credit) */}
          {type === 'credit' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Credit Limit
              </label>
              <input
                type="number"
                step="any"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none"
              />
            </div>
          )}

          {/* Institution */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Institution / Provider
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Chase, KakaoBank, Habib Bank"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Card Color */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-600 dark:text-slate-400 block">
              Theme Accent Color
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
