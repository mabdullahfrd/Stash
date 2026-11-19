/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useId, useState } from 'react';
import { useFinanceData, useFinanceUI } from '../../context/FinanceContext';
import { X, Check } from 'lucide-react';
import { AccountType, CurrencyCode } from '../../types/finance';
import { CURRENCY_REGISTRY, roundCurrencyAmount } from '../../utils/currencies';
import { KOREAN_BANKS, KoreanBankPreset } from '../../utils/koreanBanks';
import { BankLogo } from '../common/BankLogo';
import { getFallbackCategory } from '../../utils/autoCategorize';
import { localDateString } from '../../utils/dates';
import { ModalShell } from '../common/ModalShell';

const MAX_ACCOUNT_AMOUNT = 1_000_000_000_000;

function defaultNicknameForPreset(preset: KoreanBankPreset): string {
  return `${preset.name} ${
    preset.defaultType === 'savings' ? 'Vault' : preset.defaultType === 'cash' ? '' : 'Account'
  }`.trim();
}

export const AccountModal: React.FC = () => {
  const {
    addAccount,
    editAccount,
    addTransaction,
    accountBalances,
    categories,
    activeCurrency,
  } = useFinanceData();
  const {
    isAccountModalOpen,
    editingAccount,
    initialBankPresetId,
    closeAccountModal,
  } = useFinanceUI();
  const titleId = useId();

  const [selectedPreset, setSelectedPreset] = useState<KoreanBankPreset>(KOREAN_BANKS[0]);
  const [name, setName] = useState(defaultNicknameForPreset(KOREAN_BANKS[0]));
  const [last4Digits, setLast4Digits] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState<CurrencyCode>(activeCurrency);
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAccountModalOpen) return;

    if (editingAccount) {
      const matchedPreset =
        KOREAN_BANKS.find(
          (b) =>
            b.id === editingAccount.bankCode ||
            editingAccount.institution.toLowerCase().includes(b.name.toLowerCase())
        ) || KOREAN_BANKS[0];
      setSelectedPreset(matchedPreset);
      setName(editingAccount.name);
      setType(editingAccount.type);
      setCurrency(editingAccount.currency);
      const digitsMatch = editingAccount.accountNumber?.match(/(\d{4})$/);
      setLast4Digits(digitsMatch ? digitsMatch[1] : '');
      const currentBal = accountBalances[editingAccount.id] ?? editingAccount.balance;
      setBalance(currentBal.toString());
      setCreditLimit(
        typeof editingAccount.creditLimit === 'number'
          ? editingAccount.creditLimit.toString()
          : ''
      );
      setError('');
      return;
    }

    const preset =
      (initialBankPresetId && KOREAN_BANKS.find((b) => b.id === initialBankPresetId)) ||
      KOREAN_BANKS[0];
    setSelectedPreset(preset);
    setName(defaultNicknameForPreset(preset));
    setType(preset.defaultType);
    setCurrency(activeCurrency);
    setLast4Digits('');
    setBalance('');
    setCreditLimit('');
    setError('');
  }, [isAccountModalOpen, editingAccount?.id, initialBankPresetId]);

  if (!isAccountModalOpen) return null;

  const isCashAccount = type === 'cash' || (!editingAccount && selectedPreset.id === 'cash');

  const handleSelectPreset = (preset: KoreanBankPreset) => {
    setSelectedPreset(preset);
    if (!editingAccount) {
      setName(defaultNicknameForPreset(preset));
      setType(preset.defaultType);
    }
    if (preset.id === 'cash') {
      setLast4Digits('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter an account nickname.');
      return;
    }

    const cleanDigits = last4Digits.replace(/\D/g, '');
    if (!isCashAccount && !/^\d{4}$/.test(cleanDigits)) {
      setError('Enter the exact 4 digits for this account.');
      return;
    }

    const rawBal = balance.trim() === '' ? 0 : parseFloat(balance);
    if (!Number.isFinite(rawBal) || Math.abs(rawBal) > MAX_ACCOUNT_AMOUNT) {
      setError('Enter a valid balance amount.');
      return;
    }
    const safeBalance = roundCurrencyAmount(rawBal, currency);

    let safeCreditLimit: number | undefined;
    if (type === 'credit' && creditLimit.trim() !== '') {
      const parsedLimit = parseFloat(creditLimit);
      if (!Number.isFinite(parsedLimit) || parsedLimit < 0 || parsedLimit > MAX_ACCOUNT_AMOUNT) {
        setError('Enter a valid credit limit (0 or greater).');
        return;
      }
      safeCreditLimit = roundCurrencyAmount(parsedLimit, currency);
    }

    if (editingAccount) {
      const currentComputedBalance = roundCurrencyAmount(
        accountBalances[editingAccount.id] ?? editingAccount.balance,
        editingAccount.currency
      );

      await editAccount(editingAccount.id, {
        name: name.trim(),
        type,
        currency,
        creditLimit: type === 'credit' ? safeCreditLimit : undefined,
        institution: selectedPreset.name,
        accountNumber: isCashAccount ? 'Cash in Hand' : `•••• ${cleanDigits}`,
        bankCode: selectedPreset.id,
        color: selectedPreset.color,
        icon: type === 'cash' ? 'Wallet' : type === 'savings' ? 'PiggyBank' : 'Building2',
      });

      const delta = roundCurrencyAmount(safeBalance - currentComputedBalance, currency);
      if (Math.abs(delta) > 0) {
        const isCredit = type === 'credit';
        // For asset accounts: positive delta is income, negative is expense.
        // For credit cards (positive = owed liability): positive delta is expense, negative is income/repayment.
        const adjType = isCredit
          ? delta > 0
            ? 'expense'
            : 'income'
          : delta > 0
          ? 'income'
          : 'expense';
        const fallbackCat = getFallbackCategory(categories, adjType);
        await addTransaction({
          type: adjType,
          amount: Math.abs(delta),
          currency,
          date: localDateString(),
          categoryId: fallbackCat.id,
          accountId: editingAccount.id,
          merchant: 'Balance Adjustment',
          notes: 'Manual balance reconciliation',
        });
      }

      closeAccountModal();
      return;
    }

    await addAccount({
      name: name.trim(),
      type,
      currency,
      balance: safeBalance,
      creditLimit: type === 'credit' ? safeCreditLimit : undefined,
      institution: selectedPreset.name,
      accountNumber: isCashAccount ? 'Cash in Hand' : `•••• ${cleanDigits}`,
      bankCode: selectedPreset.id,
      color: selectedPreset.color,
      icon: type === 'cash' ? 'Wallet' : type === 'savings' ? 'PiggyBank' : 'Building2',
    });

    closeAccountModal();
  };

  return (
    <ModalShell
      isOpen={isAccountModalOpen}
      onClose={closeAccountModal}
      labelledBy={titleId}
      maxWidthClass="max-w-lg"
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.07] shrink-0">
        <div>
          <h2 id={titleId} className="text-base font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
            {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
          </h2>
          <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
            {editingAccount
              ? 'Update details or reconcile your current balance'
              : 'Link a Korean or multi-currency bank to track spending per account'}
          </p>
        </div>
        <button
          type="button"
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
              <label htmlFor="acc-nickname" className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                Account Nickname
              </label>
              <input
                id="acc-nickname"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shinhan Checking"
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] text-xs focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="acc-last4" className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                Last 4 Digits
              </label>
              <input
                id="acc-last4"
                type="text"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                disabled={isCashAccount}
                value={isCashAccount ? 'Cash' : last4Digits}
                onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4921"
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] font-mono text-xs focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45] disabled:opacity-60"
              />
            </div>
          </div>

          {/* Account Type */}
          <div className="space-y-1">
            <span className="font-semibold text-[#4B5248] dark:text-[#B4BCB0] block">
              Account Type
            </span>
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
              <label htmlFor="acc-currency" className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                Currency
              </label>
              <select
                id="acc-currency"
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
              <label htmlFor="acc-balance" className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                {editingAccount ? 'Current Balance (Adjusts via Entry)' : 'Starting Balance'}
              </label>
              <input
                id="acc-balance"
                type="number"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="500000"
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] font-mono font-semibold text-xs tabular-nums focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>
          </div>

          {type === 'credit' && (
            <div className="space-y-1">
              <label htmlFor="acc-credit-limit" className="font-semibold text-[#4B5248] dark:text-[#B4BCB0]">
                Credit Limit ({currency})
              </label>
              <input
                id="acc-credit-limit"
                type="number"
                step="any"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="2000000"
                className="w-full p-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] font-mono font-semibold text-xs tabular-nums focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition"
            >
              {editingAccount ? 'Save Account Changes' : 'Link Bank Account'}
            </button>
          </div>
        </form>
    </ModalShell>
  );
};
