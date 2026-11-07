/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Wallet,
  Camera,
  Plus,
  HeartHandshake,
  Clock,
} from 'lucide-react';

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, openTransactionModal, charityStats } = useFinance();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="px-2 py-1.5 w-full select-none"
    >
      <div className="flex items-center justify-around relative max-w-sm mx-auto">
        {/* Tab 1: Scan spending */}
        <button
          onClick={() => setActiveTab('pockets')}
          className={`flex flex-col items-center justify-center min-w-[62px] min-h-[46px] transition-colors ${
            activeTab === 'pockets'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
          aria-label="Scan spending"
        >
          <Wallet className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-1 font-semibold tracking-tight">Scan spending</span>
        </button>

        {/* Tab 2: Scan receipt */}
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex flex-col items-center justify-center min-w-[62px] min-h-[46px] transition-colors ${
            activeTab === 'scanner'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
          aria-label="Scan receipt"
        >
          <Camera className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-1 font-semibold tracking-tight">Scan receipt</span>
        </button>

        {/* Center Floating (+) Quick Action */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            onClick={() => openTransactionModal()}
            className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/35 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
            aria-label="Add"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] mt-1 font-bold text-slate-500 dark:text-slate-400">Add</span>
        </div>

        {/* Tab 3: Charity */}
        <button
          onClick={() => setActiveTab('charity')}
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[46px] relative transition-colors ${
            activeTab === 'charity'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
          aria-label="Charity"
        >
          <div className="relative">
            <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
            {charityStats.pendingPledgesCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1C1C1E]">
                {charityStats.pendingPledgesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold tracking-tight">Charity</span>
        </button>

        {/* Tab 4: Activity */}
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[46px] transition-colors ${
            activeTab === 'activity'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
          aria-label="Activity"
        >
          <Clock className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-1 font-semibold tracking-tight">Activity</span>
        </button>
      </div>
    </nav>
  );
};
