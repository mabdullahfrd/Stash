/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Check } from 'lucide-react';
import { CurrencyCode } from '../../types/finance';
import { formatCurrency, convertCurrency, CURRENCY_REGISTRY } from '../../utils/currencies';

export const CurrencyHoldModal: React.FC = () => {
  const { holdConvertAmount, closeHoldConvertModal, rates, activeCurrency, setActiveCurrency } = useFinance();

  if (!holdConvertAmount) return null;

  const { amount, sourceCurrency } = holdConvertAmount;
  const currencies: CurrencyCode[] = ['KRW', 'USD', 'EUR', 'PKR'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={closeHoldConvertModal}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#161915] rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08] animate-in slide-in-from-bottom duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.07]">
          <div>
            <h2 className="text-sm font-bold text-[#111315] dark:text-[#F4F5F0]">
              Currency Conversion
            </h2>
            <span className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
              KRW, USD, EUR, and PKR live rates
            </span>
          </div>
          <button
            onClick={closeHoldConvertModal}
            className="w-8 h-8 rounded-full bg-[#F4F5F0] dark:bg-white/[0.06] flex items-center justify-center text-[#5E655A] dark:text-[#A4AC9E]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#141617] dark:bg-[#0D0F0C] text-white text-center border border-white/[0.08]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 block">
              Selected Amount ({sourceCurrency})
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums block mt-1">
              {formatCurrency(amount, sourceCurrency)}
            </span>
          </div>

          <div className="space-y-2">
            {currencies.map((curr) => {
              const converted = convertCurrency(amount, sourceCurrency, curr, rates);
              const isPrimary = activeCurrency === curr;
              const meta = CURRENCY_REGISTRY[curr];

              return (
                <div
                  key={curr}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isPrimary
                      ? 'bg-[#F9FAF6] dark:bg-[#1E231C] border-[#141617] dark:border-[#C8EC45]'
                      : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.06] dark:border-white/[0.06] text-[#111315] dark:text-[#F4F5F0] font-semibold text-xs flex items-center justify-center font-mono">
                      {meta.symbol}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] block">
                        {curr}
                      </span>
                      <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689] block">
                        {meta.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-[#111315] dark:text-[#F4F5F0] tabular-nums block">
                      {formatCurrency(converted, curr)}
                    </span>
                    {isPrimary ? (
                      <span className="text-[10px] font-semibold text-[#111315] dark:text-[#C8EC45] inline-flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        Primary
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveCurrency(curr)}
                        className="text-[10px] font-medium text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white transition"
                      >
                        Set primary
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={closeHoldConvertModal}
            className="w-full py-3 rounded-xl bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] font-semibold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
