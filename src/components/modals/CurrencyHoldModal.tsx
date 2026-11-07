/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Coins, ArrowRight, Check } from 'lucide-react';
import { CurrencyCode } from '../../types/finance';
import { formatCurrency, convertCurrency, CURRENCY_REGISTRY } from '../../utils/currencies';

export const CurrencyHoldModal: React.FC = () => {
  const { holdConvertAmount, closeHoldConvertModal, rates, activeCurrency, setActiveCurrency } = useFinance();

  if (!holdConvertAmount) return null;

  const { amount, sourceCurrency } = holdConvertAmount;
  const currencies: CurrencyCode[] = ['USD', 'EUR', 'KRW', 'PKR'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={closeHoldConvertModal}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Currency Conversion
              </h2>
              <span className="text-[10px] text-slate-400">
                Converted live across KRW, USD, EUR, and PKR
              </span>
            </div>
          </div>
          <button
            onClick={closeHoldConvertModal}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Display */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Original Amount
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white block mt-0.5">
              {formatCurrency(amount, sourceCurrency)}
            </span>
          </div>

          {/* Converted Currencies List */}
          <div className="space-y-2">
            {currencies.map((curr) => {
              const converted = convertCurrency(amount, sourceCurrency, curr, rates);
              const isPrimary = activeCurrency === curr;
              const meta = CURRENCY_REGISTRY[curr];

              return (
                <div
                  key={curr}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isPrimary
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                      {meta.symbol}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {curr}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {meta.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-slate-900 dark:text-white block">
                      {formatCurrency(converted, curr)}
                    </span>
                    {isPrimary ? (
                      <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 justify-end">
                        <Check className="w-2.5 h-2.5" />
                        Active Base
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveCurrency(curr)}
                        className="text-[9px] font-semibold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        Set as Base
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1">
            <button
              onClick={closeHoldConvertModal}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs transition active:scale-95 shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
