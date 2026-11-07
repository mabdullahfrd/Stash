/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { formatCurrency, CURRENCY_REGISTRY } from '../../utils/currencies';

export const FulfillCharityModal: React.FC = () => {
  const { fulfillingPledge, closeFulfillModal, fulfillCharityPledge, accounts } = useFinance();

  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (fulfillingPledge) {
      const pending = Math.max(0, fulfillingPledge.pledgedAmount - fulfillingPledge.fulfilledAmount);
      setAmount(pending.toString());
      setAccountId(accounts[0]?.id || '');
      setNotes(`Fulfillment distribution for "${fulfillingPledge.title}"`);
      setError('');
    }
  }, [fulfillingPledge, accounts]);

  if (!fulfillingPledge) return null;

  const pendingAmount = Math.max(0, fulfillingPledge.pledgedAmount - fulfillingPledge.fulfilledAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid distribution amount.');
      return;
    }
    if (!accountId) {
      setError('Please select a payment account.');
      return;
    }

    fulfillCharityPledge(fulfillingPledge.id, num, accountId, notes);
    closeFulfillModal();
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />

        <div className="px-5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Distribute Charity
            </h2>
          </div>
          <button
            onClick={closeFulfillModal}
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

          {/* Commitment Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
              {fulfillingPledge.cause}
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {fulfillingPledge.title}
            </h3>
            <div className="flex items-center justify-between text-xs pt-1 text-slate-600 dark:text-slate-400">
              <span>Remaining Pending:</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(pendingAmount, fulfillingPledge.currency)}
              </span>
            </div>
          </div>

          {/* Amount to Give */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Amount to Distribute
              </label>
              <button
                type="button"
                onClick={() => setAmount(pendingAmount.toString())}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Pay Full Pending
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                {CURRENCY_REGISTRY[fulfillingPledge.currency]?.symbol}
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Source Account */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Pay From Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
            {selectedAccount && (
              <span className="text-[10px] text-slate-400 block pt-0.5">
                Will be recorded as a Charity expense in {selectedAccount.currency} on {selectedAccount.name}.
              </span>
            )}
          </div>

          {/* Distribution Memo */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              Distribution Memo / Beneficiary
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Wire transfer to Red Crescent / Food Basket distribution"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Distribution</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
