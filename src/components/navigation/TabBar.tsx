/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinanceUI } from '../../context/FinanceContext';
import { Wallet, ScanLine, Plus, Clock } from 'lucide-react';

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, openTransactionModal } = useFinanceUI();

  return (
    <nav
      aria-label="Primary Navigation"
      className="w-full select-none"
    >
      <div className="flex items-center justify-between px-2.5 py-2 rounded-full bg-[#141617] dark:bg-[#1B1F19] border border-white/[0.08] shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
        {/* Tab 1: Spending */}
        <button
          type="button"
          onClick={() => setActiveTab('pockets')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-colors ${
            activeTab === 'pockets'
              ? 'text-[#C8EC45]'
              : 'text-[#8E9689] hover:text-white'
          }`}
          aria-label="Spending"
          aria-current={activeTab === 'pockets' ? 'page' : undefined}
        >
          <Wallet className="w-[18px] h-[18px] stroke-[2]" />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">
            Spending
          </span>
        </button>

        {/* Tab 2: Import & Scan Receipt */}
        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-colors ${
            activeTab === 'scanner'
              ? 'text-[#C8EC45]'
              : 'text-[#8E9689] hover:text-white'
          }`}
          aria-label="Import"
          aria-current={activeTab === 'scanner' ? 'page' : undefined}
        >
          <ScanLine className="w-[18px] h-[18px] stroke-[2]" />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">
            Import
          </span>
        </button>

        {/* Center Primary Action: Add (+) in Chartreuse Lime */}
        <div className="px-1.5">
          <button
            type="button"
            onClick={() => openTransactionModal()}
            className="w-11 h-11 rounded-full bg-[#C8EC45] hover:bg-[#B8DE35] text-[#111315] flex items-center justify-center transition-transform active:scale-95"
            aria-label="Add Transaction"
            title="Add Transaction"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Activity */}
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-colors ${
            activeTab === 'activity'
              ? 'text-[#C8EC45]'
              : 'text-[#8E9689] hover:text-white'
          }`}
          aria-label="Activity"
          aria-current={activeTab === 'activity' ? 'page' : undefined}
        >
          <Clock className="w-[18px] h-[18px] stroke-[2]" />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">
            Activity
          </span>
        </button>
      </div>
    </nav>
  );
};
