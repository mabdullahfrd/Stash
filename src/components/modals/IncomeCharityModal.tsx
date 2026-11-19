/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';
import { useFinanceData, useFinanceUI } from '../../context/FinanceContext';
import { X, ArrowRight, Heart } from 'lucide-react';
import { formatCurrency, roundCurrencyAmount } from '../../utils/currencies';
import { findBankPreset } from '../../utils/koreanBanks';
import { BankLogo } from '../common/BankLogo';
import { ModalShell } from '../common/ModalShell';

export const IncomeCharityModal: React.FC = () => {
  const { accounts, confirm10PercentCharity } = useFinanceData();
  const { incomeCharityPrompt, dismissIncomeCharity } = useFinanceUI();
  const titleId = useId();

  if (!incomeCharityPrompt) return null;

  const { incomeAmount, currency, accountId, merchant } = incomeCharityPrompt;
  const charityAmount = roundCurrencyAmount(incomeAmount * 0.1, currency);
  const account = accounts.find((a) => a.id === accountId) || accounts[0];
  const bankInfo = account ? findBankPreset(account.institution || account.name) : null;

  return (
    <ModalShell
      isOpen={Boolean(incomeCharityPrompt)}
      onClose={dismissIncomeCharity}
      labelledBy={titleId}
      align="center"
      maxWidthClass="max-w-sm"
    >
      <div className="text-[#111315] dark:text-[#F4F5F0] p-6 relative space-y-5 overflow-y-auto no-scrollbar">
        <button
          type="button"
          onClick={dismissIncomeCharity}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F4F5F0] dark:bg-white/[0.06] flex items-center justify-center text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-2 pr-8">
          <div className="w-10 h-10 rounded-xl bg-[#C8EC45] text-[#111315] flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h2 id={titleId} className="text-lg font-bold tracking-tight">
            Allocate 10% to Charity?
          </h2>
          <p className="text-xs text-[#6B7268] dark:text-[#8E9689] leading-relaxed">
            You recorded{' '}
            <span className="font-mono font-semibold text-[#111315] dark:text-white">
              +{formatCurrency(incomeAmount, currency)}
            </span>
            {merchant ? ` from ${merchant}` : ''}. Log 10% as a charity expense?
          </p>
        </div>

        {/* Breakdown */}
        <div className="rounded-2xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-2.5 text-xs">
          {account && bankInfo && (
            <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/[0.06]">
              <span className="text-[#6B7268] dark:text-[#8E9689]">Account</span>
              <span className="font-semibold flex items-center gap-1.5">
                <BankLogo bank={bankInfo} size="xs" />
                {account.name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[#6B7268] dark:text-[#8E9689]">Income Recorded</span>
            <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-[#C8EC45]">
              +{formatCurrency(incomeAmount, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold">10% Charity Expense</span>
            <span className="font-mono font-bold tabular-nums">
              -{formatCurrency(charityAmount, currency)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void confirm10PercentCharity()}
            className="w-full py-3.5 px-4 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <span>Give {formatCurrency(charityAmount, currency)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={dismissIncomeCharity}
            className="w-full py-2.5 px-4 rounded-xl text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white font-medium text-xs transition"
          >
            Skip for now
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
