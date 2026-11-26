/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, Undo2 } from 'lucide-react';
import { useFinanceUI } from '../../context/FinanceContext';

/**
 * "Expense saved · Undo" bar shown just above the tab bar for a few seconds
 * after creating an entry. Undo removes the entry it was shown for.
 */
export const UndoToast: React.FC = () => {
  const { undoToast, dismissUndoToast } = useFinanceUI();
  const [busy, setBusy] = useState(false);

  if (!undoToast) return null;

  const handleUndo = async () => {
    setBusy(true);
    try {
      await undoToast.onUndo();
    } finally {
      setBusy(false);
      dismissUndoToast();
    }
  };

  return (
    <div
      key={undoToast.key}
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-[55] flex justify-center px-4 pointer-events-none bottom-[calc(6.25rem+env(safe-area-inset-bottom))] sm:bottom-[calc(7rem+env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto w-full max-w-[360px] flex items-center justify-between gap-3 pl-4 pr-1.5 py-1.5 rounded-2xl bg-[#141617] dark:bg-[#F4F5F0] text-white dark:text-[#111315] shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
        <span className="flex items-center gap-2 text-xs font-semibold min-w-0">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C8EC45] dark:text-emerald-700" />
          <span className="truncate">{undoToast.message}</span>
        </span>
        <button
          type="button"
          onClick={handleUndo}
          disabled={busy}
          className="min-h-[40px] px-3.5 rounded-xl inline-flex items-center gap-1.5 text-xs font-bold text-[#C8EC45] dark:text-[#111315] hover:bg-white/10 dark:hover:bg-black/5 disabled:opacity-60 shrink-0"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>
      </div>
    </div>
  );
};
