/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { usePWAUpdate } from '../../context/PWAUpdateContext';

export const PWAUpdateBanner: React.FC = () => {
  const { updateStatus, needRefresh, applyUpdate, dismissUpdateBanner } = usePWAUpdate();

  const shouldShow = needRefresh || updateStatus === 'ready' || updateStatus === 'updating';
  if (!shouldShow) return null;

  const isUpdating = updateStatus === 'updating';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-[#141617] dark:bg-[#1E231C] text-white border border-white/10 dark:border-[#C8EC45]/30 shadow-2xl px-4 py-3 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-[#C8EC45] text-[#111315] flex items-center justify-center shrink-0">
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">
            {isUpdating ? 'Updating Stash…' : 'New update ready'}
          </p>
          <p className="text-[11px] text-white/70 truncate">
            {isUpdating ? 'Applying the latest version now' : 'Tap refresh to switch to the latest build'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {!isUpdating && (
          <>
            <button
              type="button"
              onClick={() => void applyUpdate()}
              className="px-3 py-1.5 rounded-xl bg-[#C8EC45] hover:bg-[#B8DE35] text-[#111315] text-xs font-bold transition"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={dismissUpdateBanner}
              aria-label="Dismiss update notification"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/75 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
