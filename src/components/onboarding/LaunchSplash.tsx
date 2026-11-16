/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface LaunchSplashProps {
  onComplete: () => void;
  readyToAdvance?: boolean;
}

export const LaunchSplash: React.FC<LaunchSplashProps> = ({
  onComplete,
  readyToAdvance = true,
}) => {
  useEffect(() => {
    if (!readyToAdvance) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const durationMs = reduced ? 550 : 1850;
    const timer = window.setTimeout(() => {
      onComplete();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [onComplete, readyToAdvance]);

  return (
    <div
      className="min-h-screen w-full bg-[#0D0F0C] text-[#F4F5F0] flex flex-col justify-between px-6 py-8 select-none overflow-hidden"
      data-testid="launch-splash"
    >
      {/* Top quiet spacing row with skip affordance */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-end">
        <button
          type="button"
          onClick={onComplete}
          className="min-h-[44px] px-4 rounded-xl text-xs font-medium text-[#8E9689] hover:text-[#F4F5F0] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span>Skip intro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Centered Animated Brand Emblem */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center anim-stash-badge">
          {/* Outer hairline geometric frame */}
          <div
            className="absolute -inset-4 rounded-[28px] border border-[#C8EC45]/35 pointer-events-none anim-stash-ring"
            aria-hidden="true"
          />

          {/* Core Animated Stash Mark */}
          <div
            className="w-20 h-20 rounded-[22px] bg-[#C8EC45] flex items-center justify-center shadow-[0_18px_48px_rgba(200,236,69,0.22)]"
            aria-hidden="true"
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Top ledger fold */}
              <path
                className="anim-stash-bar-1"
                d="M5.5 6.5C5.5 5.39543 6.39543 4.5 7.5 4.5H17.5C18.0523 4.5 18.5 4.94772 18.5 5.5V7.5C18.5 8.60457 17.6046 9.5 16.5 9.5H8.5C6.84315 9.5 5.5 8.15685 5.5 6.5Z"
                fill="#111315"
              />
              {/* Middle diagonal pocket ribbon */}
              <path
                className="anim-stash-bar-2"
                d="M5.5 12C5.5 10.6193 6.61929 9.5 8 9.5H16C17.3807 9.5 18.5 10.6193 18.5 12C18.5 13.3807 17.3807 14.5 16 14.5H8C6.61929 14.5 5.5 13.3807 5.5 12Z"
                fill="#111315"
                fillOpacity="0.72"
              />
              {/* Bottom pocket base */}
              <path
                className="anim-stash-bar-3"
                d="M5.5 16.5C5.5 15.3954 6.39543 14.5 7.5 14.5H15.5C17.1569 14.5 18.5 15.8431 18.5 17.5C18.5 18.6046 17.6046 19.5 16.5 19.5H6.5C5.94772 19.5 5.5 19.0523 5.5 18.5V16.5Z"
                fill="#111315"
              />
              {/* Precision pocket notch */}
              <circle
                className="anim-stash-notch"
                cx="15.75"
                cy="12"
                r="1.15"
                fill="#C8EC45"
              />
            </svg>
          </div>
        </div>

        {/* Wordmark Reveal */}
        <div className="mt-7 space-y-1.5 anim-stash-wordmark">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F5F0]">
            Stash
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9689] tracking-normal">
            Korean Won Banking · Receipt Clarity
          </p>
        </div>

        {/* Smooth Compositor-Only Progress Line */}
        <div
          className="mt-8 w-40 h-0.5 rounded-full bg-white/[0.1] overflow-hidden"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-[#C8EC45] anim-stash-progress" />
        </div>
      </div>

      {/* Bottom quiet region indicator */}
      <div className="w-full max-w-5xl mx-auto text-center">
        <p className="text-[11px] text-[#6B7268]">
          Hana Bank · Toss Bank · KRW / USD / EUR / PKR
        </p>
      </div>
    </div>
  );
};
