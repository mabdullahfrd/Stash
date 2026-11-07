/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { CurrencyCode } from '../../types/finance';
import { CURRENCY_REGISTRY } from '../../utils/currencies';
import {
  X,
  Coins,
  Cloud,
  Moon,
  Sun,
  Download,
  RotateCcw,
  Check,
  User,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    activeCurrency,
    setActiveCurrency,
    theme,
    setTheme,
    resetToDefaultData,
    exportDataJSON,
    exportTransactionsCSV,
  } = useFinance();

  const { user, isOnline, openAuthModal } = useAuth();

  if (!isOpen) return null;

  const currencies: CurrencyCode[] = ['KRW', 'USD', 'EUR', 'PKR'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Settings & Preferences</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize currency, account sync, and theme
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Cloud Account & Real-time sync row */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Cloud Account & Sync
            </label>
            <div
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {user ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user ? user.displayName || user.email : 'Sign In / Connect Account'}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user
                      ? 'Live real-time cloud sync active'
                      : 'Google or Email sign-in for multi-device sync'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Primary Currency Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Primary Currency
              </label>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Current: {activeCurrency} ({CURRENCY_REGISTRY[activeCurrency].symbol})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {currencies.map((code) => {
                const meta = CURRENCY_REGISTRY[code];
                const isSelected = activeCurrency === code;
                return (
                  <button
                    key={code}
                    onClick={() => setActiveCurrency(code)}
                    type="button"
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500/60 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {meta.symbol} {code}
                        </span>
                        {code === 'KRW' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {meta.name}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              All balance totals, spending categories, and reports will calculate in your selected primary currency.
            </p>
          </div>

          {/* Theme Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Appearance
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setTheme('light')}
                type="button"
                className={`py-3 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  theme === 'light'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4" />
                Apple Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                type="button"
                className={`py-3 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  theme === 'dark'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4" />
                OLED Dark
              </button>
            </div>
          </div>

          {/* Data Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportTransactionsCSV}
                className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={exportDataJSON}
                className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Backup JSON
              </button>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Reset all accounts and sample transactions to default Korean Won data?')) {
                  resetToDefaultData();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Data (KRW)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
