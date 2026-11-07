/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  HeartHandshake,
  Plus,
  Calculator,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, convertCurrency } from '../../utils/currencies';
import { CharityPledge } from '../../types/finance';
import { HoldAmount } from '../common/HoldAmount';

export const CharityView: React.FC = () => {
  const {
    charityPledges,
    charityStats,
    activeCurrency,
    rates,
    netWorth,
    openCharityModal,
    openFulfillModal,
  } = useFinance();

  const [showZakatCalculator, setShowZakatCalculator] = useState(false);
  const [customZakatWealth, setCustomZakatWealth] = useState<number>(() => {
    // Net positive liquid assets as default
    return Math.max(0, Math.round(netWorth.totalAssets));
  });

  const calculatedZakat = Math.round(customZakatWealth * 0.025);

  const pendingPledges = charityPledges.filter((p) => p.status !== 'fulfilled');
  const fulfilledPledges = charityPledges.filter((p) => p.status === 'fulfilled');

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Philanthropy & Zakat
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Charity to Give
          </h1>
        </div>

        <button
          onClick={openCharityModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Pledge</span>
        </button>
      </div>

      {/* Main KPI Stat Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between text-emerald-200 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              Pending Charity to Distribute
            </span>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
              {charityStats.fulfillmentPercent}% Fulfilled
            </span>
          </div>

          <div className="mt-2 text-3xl font-extrabold tracking-tight font-mono tabular-nums text-white">
            <HoldAmount amount={charityStats.totalPending} currency={activeCurrency} />
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, charityStats.fulfillmentPercent)}%` }}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-emerald-300/80 block text-[11px]">Total Pledged</span>
              <span className="font-semibold text-white font-mono tabular-nums mt-0.5 block">
                <HoldAmount amount={charityStats.totalPledged} currency={activeCurrency} />
              </span>
            </div>

            <div>
              <span className="text-emerald-300/80 block text-[11px]">Fulfilled / Given</span>
              <span className="font-semibold text-emerald-300 font-mono tabular-nums mt-0.5 block">
                <HoldAmount amount={charityStats.totalFulfilled} currency={activeCurrency} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Zakat Quick Calculator Tool Accordion */}
      <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Zakat & Obligation Calculator
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                2.5% rate on eligible savings & net assets
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowZakatCalculator(!showZakatCalculator)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            {showZakatCalculator ? 'Hide' : 'Calculate'}
          </button>
        </div>

        {showZakatCalculator && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Net Liquid Assets ({activeCurrency})
              </label>
              <input
                type="number"
                value={customZakatWealth}
                onChange={(e) => setCustomZakatWealth(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium block">
                  Calculated Zakat Due (2.5%)
                </span>
                <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(calculatedZakat, activeCurrency)}
                </span>
              </div>

              <button
                onClick={() => {
                  openCharityModal();
                  setShowZakatCalculator(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
              >
                Pledge This
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Pledges List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Active Pending Commitments</span>
            <span className="text-xs text-slate-400 font-normal">({pendingPledges.length})</span>
          </h2>
        </div>

        {pendingPledges.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-800 p-4">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">All Commitments Fulfilled!</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              You have no outstanding pending charity or zakat pledges. Tap New Pledge to register a new commitment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPledges.map((pledge) => {
              const pendingAmount = Math.max(0, pledge.pledgedAmount - pledge.fulfilledAmount);
              const percent = Math.min(100, Math.round((pledge.fulfilledAmount / pledge.pledgedAmount) * 100));

              return (
                <div
                  key={pledge.id}
                  className="rounded-2xl bg-white dark:bg-[#1C1C1E] p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {pledge.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
                          {pledge.cause}
                        </span>
                      </div>
                      {pledge.dueDate && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Due {pledge.dueDate}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white block">
                        {formatCurrency(pendingAmount, pledge.currency)}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        Pending
                      </span>
                    </div>
                  </div>

                  {pledge.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl">
                      "{pledge.notes}"
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        Given: {formatCurrency(pledge.fulfilledAmount, pledge.currency)}
                      </span>
                      <span>
                        Goal: {formatCurrency(pledge.pledgedAmount, pledge.currency)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openFulfillModal(pledge)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Fulfill / Distribute</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Pledges History */}
      {fulfilledPledges.length > 0 && (
        <div className="space-y-2 pb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Fulfilled Archive</span>
            <span className="text-xs text-slate-400 font-normal">({fulfilledPledges.length})</span>
          </h2>

          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            {fulfilledPledges.map((pledge) => (
              <div key={pledge.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    {pledge.title}
                  </span>
                  <span className="text-[11px] text-slate-400">{pledge.cause}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                    {formatCurrency(pledge.fulfilledAmount, pledge.currency)}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    100% Complete
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
