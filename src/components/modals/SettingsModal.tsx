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
  Moon,
  Sun,
  Download,
  RotateCcw,
  Trash2,
  Check,
  User,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

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
    clearAllDataToZero,
    exportDataJSON,
    exportTransactionsCSV,
  } = useFinance();

  const { user, isOnline, openAuthModal } = useAuth();

  if (!isOpen) return null;

  const currencies: CurrencyCode[] = ['KRW', 'USD', 'EUR', 'PKR'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#161915] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl border border-black/[0.08] dark:border-white/[0.08] max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-[#111315] dark:text-[#F4F5F0]">
              Settings
            </h3>
            <p className="text-xs text-[#6B7268] dark:text-[#8E9689]">
              Currency, cloud account, and appearance
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5F0] dark:bg-white/[0.06] flex items-center justify-center text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Cloud Account */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7268] dark:text-[#8E9689] mb-2">
              Account & Sync
            </label>
            <div
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="p-3.5 rounded-2xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between cursor-pointer hover:border-black/15 dark:hover:border-white/15 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#141617] dark:bg-[#C8EC45] flex items-center justify-center text-[#C8EC45] dark:text-[#111315]">
                  {user ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]">
                      {user ? user.displayName || user.email : 'Sign In / Connect Account'}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                    {user ? 'Real-time cloud sync active' : 'Sync data across devices'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E9689]" />
            </div>
          </div>

          {/* Primary Currency */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7268] dark:text-[#8E9689]">
                Primary Currency
              </label>
              <span className="text-[11px] font-mono font-semibold text-[#111315] dark:text-[#C8EC45]">
                {activeCurrency} ({CURRENCY_REGISTRY[activeCurrency].symbol})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {currencies.map((code) => {
                const meta = CURRENCY_REGISTRY[code];
                const isSelected = activeCurrency === code;
                return (
                  <button
                    key={code}
                    onClick={() => setActiveCurrency(code)}
                    type="button"
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#F9FAF6] dark:bg-[#1E231C] border-[#141617] dark:border-[#C8EC45]'
                        : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-xs text-[#111315] dark:text-[#F4F5F0] block">
                        {meta.symbol} {code}
                      </span>
                      <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689] block truncate">
                        {meta.name}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#141617] dark:text-[#C8EC45] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Appearance */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7268] dark:text-[#8E9689] mb-2">
              Appearance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('light')}
                type="button"
                className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  theme === 'light'
                    ? 'bg-[#141617] text-white border-[#141617]'
                    : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06] text-[#5E655A] dark:text-[#A4AC9E]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                type="button"
                className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  theme === 'dark'
                    ? 'bg-[#C8EC45] text-[#111315] border-[#C8EC45]'
                    : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06] text-[#5E655A] dark:text-[#A4AC9E]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
            </div>
          </div>

          {/* Data Actions */}
          <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.07] space-y-2">
            <PWAInstallButton variant="card" />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportTransactionsCSV}
                className="py-2.5 px-3 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={exportDataJSON}
                className="py-2.5 px-3 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Backup JSON
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                await clearAllDataToZero();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-500/25 hover:bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {user ? 'Start Fresh (Clear All to ₩0)' : 'Clear All to ₩0'}
            </button>

            {!user && (
              <button
                type="button"
                onClick={async () => {
                  await resetToDefaultData();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-black/[0.07] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-xs font-medium text-[#6B7268] dark:text-[#8E9689] flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Data (KRW)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
