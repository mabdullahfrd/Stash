/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { useFinanceData } from '../../context/FinanceContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Shown once after signing in when entries made in guest mode are still on this device.
 * "Not now" only hides it for this session (the data stays, so it is offered again next time);
 * "Discard" removes the guest copy from the device.
 */
export const GuestImportDialog: React.FC = () => {
  const { guestImportPlan, acceptGuestImport, dismissGuestImport } = useFinanceData();
  const [hiddenForSession, setHiddenForSession] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stable reference: ConfirmDialog re-runs its focus/keyboard effect when onCancel changes.
  const hideForSession = useCallback(() => setHiddenForSession(true), []);

  if (!guestImportPlan || hiddenForSession) return null;

  const parts = [
    guestImportPlan.transactions.length > 0 && plural(guestImportPlan.transactions.length, 'transaction'),
    guestImportPlan.accounts.length > 0 && plural(guestImportPlan.accounts.length, 'pocket'),
    guestImportPlan.savingsGoals.length > 0 && plural(guestImportPlan.savingsGoals.length, 'savings goal'),
    guestImportPlan.charityPledges.length > 0 && plural(guestImportPlan.charityPledges.length, 'charity pledge'),
  ].filter(Boolean) as string[];

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    const result = await acceptGuestImport();
    setIsImporting(false);
    if (!result.ok) setError(result.error || 'Import failed. Please try again.');
  };

  return (
    <ConfirmDialog
      isOpen
      tone="neutral"
      title="Bring over your guest entries?"
      description={`You logged entries while trying Stash as a guest. Add ${parts.join(', ')} to your account so they sync across devices?`}
      confirmLabel={isImporting ? 'Importing…' : 'Import'}
      confirmDisabled={isImporting}
      cancelLabel="Not now"
      onConfirm={handleImport}
      onCancel={hideForSession}
    >
      <div className="space-y-2">
        {error && (
          <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={dismissGuestImport}
          disabled={isImporting}
          className="text-[11px] font-medium text-[#6B7268] dark:text-[#8E9689] underline underline-offset-2 hover:text-[#111315] dark:hover:text-white disabled:opacity-50"
        >
          Discard guest entries from this device
        </button>
      </div>
    </ConfirmDialog>
  );
};
