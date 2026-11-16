/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Moon, Sun, SlidersHorizontal } from 'lucide-react';
import { CURRENCY_REGISTRY } from '../../utils/currencies';
import { StashLogo } from './StashLogo';

export const MinimalHeader: React.FC = () => {
  const {
    activeCurrency,
    theme,
    setTheme,
    openSettingsModal,
    openHoldConvertModal,
    netWorth,
  } = useFinance();

  const { user, isGuest } = useAuth();
  const displayName = user?.displayName || (isGuest ? 'Abdullah' : 'Personal');

  return (
    <header className="w-full px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-3">
      {/* Left: Editorial Wordmark & Account Context */}
      <div className="flex items-center gap-3 min-w-0">
        <StashLogo size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
              Stash
            </span>
            <span className="text-[11px] font-medium text-[#6B7268] dark:text-[#8E9689] truncate">
              · {displayName}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Clean Single-Row Utility Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => openHoldConvertModal(netWorth.netWorth, activeCurrency)}
          className="h-9 px-3 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition tabular-nums flex items-center gap-1.5"
          title="Switch or convert currency"
        >
          <span className="text-[#5E655A] dark:text-[#98A093] font-mono">
            {CURRENCY_REGISTRY[activeCurrency]?.symbol}
          </span>
          <span>{activeCurrency}</span>
        </button>

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="w-9 h-9 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition flex items-center justify-center"
          aria-label="Toggle theme"
          title="Toggle appearance"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <button
          onClick={openSettingsModal}
          className="w-9 h-9 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition flex items-center justify-center"
          aria-label="Settings"
          title="Settings & Account"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
