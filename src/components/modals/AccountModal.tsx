/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Check } from 'lucide-react';
import { AccountType, CurrencyCode } from '../../types/finance';
import { CURRENCY_REGISTRY } from '../../utils/currencies';
import { KOREAN_BANKS, KoreanBankPreset } from '../../utils/koreanBanks';
import { BankLogo } from '../common/BankLogo';

function defaultNicknameForPreset(preset: KoreanBankPreset): string {
  return `${preset.name} ${
    preset.defaultType === 'savings' ? 'Vault' : preset.defaultType === 'cash' ? '' : 'Account'
  }`.trim();
}

export const AccountModal: React.FC = () => {
  const {
    isAccountModalOpen,
    initialBankPresetId,
    closeAccountModal,
    addAccount,
    activeCurrency,
  } = useFinance();

  const [selectedPreset, setSelectedPreset] = useState<KoreanBankPreset>(KOREAN_BANKS[0]);
  const [name, setName] = useState(defaultNicknameForPreset(KOREAN_BANKS[0]));
  const [accountNumber, setAccountNumber] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState<CurrencyCode>(activeCurrency);
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAccountModalOpen) return;
    const preset =
      (initialBankPresetId && KOREAN_BANKS.find((b) => b.id === initialBankPresetId)) ||
      KOREAN_BANKS[0];
    setSelectedPreset(preset);
    setName(defaultNicknameForPreset(preset));
    setType(preset.defaultType);
    setCurrency(activeCurrency);
    setAccountNumber(preset.id === 'cash' ? 'Cash in Hand' : '');
    setBalance('');
    setError('');
  }, [isAccountModalOpen, initialBankPresetId, activeCurrency]);

  if (!isAccountModalOpen) return null;

  const handleSelectPreset = (preset: KoreanBankPreset) => {
    setSelectedPreset(preset);
    setName(defaultNicknameForPreset(preset));
    setType(preset.defaultType);
    if (preset.id === 'cash') {
      setAccountNumber('Cash in Hand');
    } else if (accountNumber === 'Cash in Hand') {
      setAccountNumber('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter an account nickname.');
      return;
    }

    const numBalance = parseFloat(balance) || 0;

    addAccount({
      name: name.trim(),
      type,
      currency,
      balance: numBalance,
      institution: selectedPreset.name,
      accountNumber: accountNumber.trim() || undefined,
      bankCode: selectedPreset.id,
      color: selectedPreset.color,
      icon: type === 'cash' ? 'Wallet' : type === 'savings' ? 'PiggyBank' : 'Building2',
    });

    closeAccountModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#161915] rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08]">
        {/* Header */}
        <div className="px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.07] shrink-0">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
              Add Bank Account
            </h2>
            <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
              Link a Korean or multi-currency bank to track spending per account
            </p>
          </div>
          <button
            onClick={closeAccountModal}
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

          {/* Bank Presets */}
          <div className="space-y-2">
            <label className="font-semibold text-[#111315] dark:text-[#F4F5F0] text-xs block">
              Select Bank
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KOREAN_BANKS.map((bank) => {
                const isSelected = selectedPreset.id === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => handleSelectPreset(bank)}
                    className={`p-2.5 rounded-xl border text-left transition relative flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#F9FAF6] dark:bg-[#1E231C] border-[#141617] dark:border-[#C8EC45]'
                        : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06] opacity-85'
                    }`}
                  >
                    <BankLogo bank={bank} size="md" />

                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[#111315] dark:text-[#F4F5F0] block text-[11px] truncate">
                        {bank.name}
                      </span>
                      <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689] block truncate">
                        {bank.koreanName}
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

          {/* Nickname & Digits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                Account Nickname
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shinhan Checking"
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] text-xs focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                Last 4 Digits
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. •••• 4921"
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] font-mono text-xs focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>
          </div>

          {/* Account Type */}
          <div className="space-y-1">
            <label className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
              Account Type
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C]">
              {(['checking', 'savings', 'credit', 'cash'] as AccountType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 text-[11px] font-semibold rounded-lg capitalize transition ${
                    type === t
                      ? 'bg-white dark:bg-[#1E221C] text-[#111315] dark:text-white shadow-xs'
                      : 'text-[#6B7268] dark:text-[#8E9689]'
                  }`}
                >
                  {t === 'checking' ? 'Checking' : t === 'savings' ? 'Vault' : t === 'credit' ? 'Credit' : 'Cash'}
                </button>
              ))}
            </div>
          </div>

          {/* Currency & Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] text-xs font-medium focus:outline-none"
              >
                {(['KRW', 'USD', 'EUR', 'PKR'] as CurrencyCode[]).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_REGISTRY[c].symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                Starting Balance
              </label>
              <input
                type="number"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="500000"
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] font-mono font-semibold text-xs tabular-nums focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition"
            >
              Link Bank Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
