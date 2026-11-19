/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          variant === 'card'
            ? 'w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] text-xs font-semibold flex items-center justify-center gap-2 transition whitespace-nowrap'
            : 'h-9 px-3 rounded-xl bg-[#C8EC45] hover:bg-[#B8DE35] text-[#111315] text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0'
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'card'
              ? 'w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[#111315] dark:text-[#F4F5F0] text-xs font-semibold flex items-center justify-center gap-2 transition whitespace-nowrap'
              : 'h-9 px-3 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] flex items-center gap-1.5 transition whitespace-nowrap shrink-0'
          }
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-[24px] bg-white dark:bg-[#161915] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111315] dark:text-[#F4F5F0]">
                  Install Stash on iPhone
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install instructions"
                  className="w-8 h-8 rounded-full bg-[#F4F5F0] dark:bg-white/[0.06] flex items-center justify-center text-[#5E655A] dark:text-[#A4AC9E]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#5E655A] dark:text-[#A4AC9E] leading-relaxed">
                1. Tap the <strong>Share</strong> icon in Safari.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
