/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, ScanLine } from 'lucide-react';
import { StashLogo } from '../common/StashLogo';
import { CurrencyCode } from '../../types/finance';
import {
  ONBOARDING_SLIDES,
  clampSlideIndex,
  getPreviewAccountBalances,
} from '../../utils/onboardingFlow';

interface OnboardingFlowProps {
  onComplete: () => void;
  onReplaySplash: () => void;
}

const PREVIEW_CURRENCIES: CurrencyCode[] = ['KRW', 'USD', 'EUR', 'PKR'];

const TOSS_SAMPLE_ROWS = [
  { name: 'Mega Coffee Vanilla Latte', category: 'Coffee & Drinks', amount: '-₩4,500' },
  { name: 'Emart Everyday (이마트)', category: 'Groceries', amount: '-₩18,000' },
  { name: 'Baskin Robbins', category: 'Ice Cream', amount: '-₩5,200' },
];

const RECEIPT_SAMPLE_ROWS = [
  { name: 'Whole Grain Sourdough', category: 'Groceries', amount: '-₩4,800' },
  { name: 'Fresh Farm Eggs (10ct)', category: 'Groceries', amount: '-₩6,400' },
  { name: 'Seoul Milk 1L', category: 'Groceries', amount: '-₩3,200' },
];

const WEEKLY_PACE_BARS = [
  { day: 'M', heightPct: 48, active: false },
  { day: 'T', heightPct: 28, active: false },
  { day: 'W', heightPct: 92, active: true },
  { day: 'T', heightPct: 16, active: false },
  { day: 'F', heightPct: 60, active: false },
  { day: 'S', heightPct: 40, active: false },
  { day: 'S', heightPct: 24, active: false },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onReplaySplash,
}) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [previewCurrency, setPreviewCurrency] = useState<CurrencyCode>('KRW');
  const [scannerPreviewMode, setScannerPreviewMode] = useState<'toss' | 'receipt'>('toss');
  const [hanaImgError, setHanaImgError] = useState(false);
  const [tossImgError, setTossImgError] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const activeSlide = ONBOARDING_SLIDES[slideIndex];
  const isLastSlide = slideIndex === ONBOARDING_SLIDES.length - 1;
  const balances = getPreviewAccountBalances(previewCurrency);

  const goToSlide = (next: number) => {
    setSlideIndex(clampSlideIndex(next));
  };

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      goToSlide(slideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (slideIndex > 0) {
      goToSlide(slideIndex - 1);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSlideIndex((prev) => clampSlideIndex(prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setSlideIndex((prev) => clampSlideIndex(prev - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 42) return;
    if (deltaX < 0 && !isLastSlide) {
      goToSlide(slideIndex + 1);
    } else if (deltaX > 0 && slideIndex > 0) {
      goToSlide(slideIndex - 1);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#F4F5F0] dark:bg-[#0D0F0C] text-[#111315] dark:text-[#F4F5F0] flex flex-col justify-between px-5 sm:px-8 py-5 sm:py-7 anim-stash-fade-up"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="onboarding-flow"
    >
      {/* Top Bar: Brand + Single Skip Action */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <StashLogo size="sm" />
          <span className="text-base font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
            Stash
          </span>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-[#F4F5F0] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0"
        >
          Skip to Sign In
        </button>
      </header>

      {/* Main Split Showcase Stage */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex items-center py-6 sm:py-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Interactive Visual Preview Stage */}
          <div className="lg:col-span-7">
            <div className="rounded-[28px] bg-[#141617] text-[#F4F5F0] p-5 sm:p-7 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.12)] min-h-[340px] sm:min-h-[390px] flex flex-col justify-between overflow-hidden relative">
              {activeSlide.id === 'banking' && (
                <div
                  key="slide-banking"
                  className="flex-1 flex flex-col justify-between gap-6 anim-stash-fade-up"
                >
                  {/* Header & Live Currency Switcher */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#8E9689]">Consolidated Balance</p>
                      <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-[#F4F5F0] mt-1">
                        {balances.totalFormatted}
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.06]"
                      role="group"
                      aria-label="Preview currency"
                    >
                      {PREVIEW_CURRENCIES.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setPreviewCurrency(code)}
                          className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            previewCurrency === code
                              ? 'bg-[#C8EC45] text-[#111315]'
                              : 'text-[#A4AC9E] hover:text-white'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Linked Bank Account Preview Rows */}
                  <div className="divide-y divide-white/[0.08] border-t border-white/[0.08]">
                    <div className="py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                          {!hanaImgError ? (
                            <img
                              src="/logos/banks/hana.svg"
                              alt="Hana Bank logo"
                              referrerPolicy="no-referrer"
                              onError={() => setHanaImgError(true)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[#008485]">HB</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F4F5F0] truncate">
                            Hana 1Q Checking
                          </p>
                          <p className="text-xs text-[#8E9689] font-mono tabular-nums">
                            •••• 4921 · Primary
                          </p>
                        </div>
                      </div>
                      <p className="text-base font-bold tabular-nums text-[#F4F5F0] shrink-0">
                        {balances.hanaFormatted}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-1">
                          {!tossImgError ? (
                            <img
                              src="/logos/banks/toss.png"
                              alt="Toss Bank logo"
                              referrerPolicy="no-referrer"
                              onError={() => setTossImgError(true)}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[#0064FF]">TB</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F4F5F0] truncate">
                            Toss Bank Account
                          </p>
                          <p className="text-xs text-[#8E9689] font-mono tabular-nums">
                            •••• 1044 · Daily Spend
                          </p>
                        </div>
                      </div>
                      <p className="text-base font-bold tabular-nums text-[#C8EC45] shrink-0">
                        {balances.tossFormatted}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSlide.id === 'scanner' && (
                <div
                  key="slide-scanner"
                  className="flex-1 flex flex-col justify-between gap-5 anim-stash-fade-up"
                >
                  {/* Header + Interactive Preview Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#C8EC45]">
                      <ScanLine className="w-4 h-4 shrink-0" />
                      <span>Auto-Itemized Detection</span>
                    </div>

                    <div
                      className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.06]"
                      role="group"
                      aria-label="Import preview type"
                    >
                      <button
                        type="button"
                        onClick={() => setScannerPreviewMode('toss')}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          scannerPreviewMode === 'toss'
                            ? 'bg-[#C8EC45] text-[#111315]'
                            : 'text-[#A4AC9E] hover:text-white'
                        }`}
                      >
                        Toss History
                      </button>
                      <button
                        type="button"
                        onClick={() => setScannerPreviewMode('receipt')}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          scannerPreviewMode === 'receipt'
                            ? 'bg-[#C8EC45] text-[#111315]'
                            : 'text-[#A4AC9E] hover:text-white'
                        }`}
                      >
                        Paper Receipt
                      </button>
                    </div>
                  </div>

                  {/* Scan Sweep Box + Extracted Rows */}
                  <div className="relative rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 overflow-hidden">
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8EC45] to-transparent pointer-events-none anim-stash-scan"
                    />

                    <div
                      key={scannerPreviewMode}
                      className="divide-y divide-white/[0.08] anim-stash-fade-up"
                    >
                      {(scannerPreviewMode === 'toss'
                        ? TOSS_SAMPLE_ROWS
                        : RECEIPT_SAMPLE_ROWS
                      ).map((row) => (
                        <div
                          key={`${scannerPreviewMode}-${row.name}`}
                          className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#F4F5F0] truncate">
                              {row.name}
                            </p>
                            <p className="text-xs text-[#8E9689] mt-0.5">{row.category}</p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums text-[#F4F5F0] shrink-0">
                            {row.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#8E9689]">
                    Matched automatically to Toss Bank Account · Instant edit before saving
                  </p>
                </div>
              )}

              {activeSlide.id === 'clarity' && (
                <div
                  key="slide-clarity"
                  className="flex-1 flex flex-col justify-between gap-5 anim-stash-fade-up"
                >
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#8E9689]">Weekly Spending Pace</p>
                      <p className="text-3xl font-bold tracking-tight tabular-nums text-[#F4F5F0] mt-1">
                        ₩179,800
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#C8EC45]">
                      7-day breakdown
                    </span>
                  </div>

                  {/* Minimal 7-Day Bar Graph */}
                  <div className="grid grid-cols-7 gap-2.5 items-end h-32 pt-4 pb-1 border-b border-white/[0.08]">
                    {WEEKLY_PACE_BARS.map((bar, i) => (
                      <div
                        key={`${bar.day}-${i}`}
                        className="h-full flex flex-col items-center justify-end gap-2"
                      >
                        <div className="w-full flex-1 flex items-end">
                          <div
                            style={{
                              height: `${bar.heightPct}%`,
                              animationDelay: `${i * 45}ms`,
                            }}
                            className={`w-full rounded-lg anim-stash-bar-grow ${
                              bar.active ? 'bg-[#C8EC45]' : 'bg-white/[0.16]'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-medium ${
                            bar.active ? 'text-[#C8EC45]' : 'text-[#8E9689]'
                          }`}
                        >
                          {bar.day}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Clean Unboxed Category Shares */}
                  <div className="grid grid-cols-3 gap-3 text-left">
                    <div>
                      <p className="text-xs text-[#8E9689] truncate">Groceries</p>
                      <p className="text-sm font-bold tabular-nums text-[#F4F5F0] mt-0.5">
                        42%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8E9689] truncate">Coffee</p>
                      <p className="text-sm font-bold tabular-nums text-[#F4F5F0] mt-0.5">
                        28%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8E9689] truncate">Dining</p>
                      <p className="text-sm font-bold tabular-nums text-[#C8EC45] mt-0.5">
                        30%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Editorial Copy & Navigation Controls */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <div key={activeSlide.id} className="space-y-3 anim-stash-fade-up">
              <p className="text-xs font-semibold text-[#5E655A] dark:text-[#8E9689] tabular-nums">
                {activeSlide.stepNumber} / 0{ONBOARDING_SLIDES.length} · {activeSlide.eyebrow}
              </p>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0] text-balance leading-[1.15]">
                {activeSlide.title}
              </h1>

              <p className="text-sm sm:text-base text-[#5E655A] dark:text-[#A4AC9E] leading-relaxed">
                {activeSlide.description}
              </p>
            </div>

            {/* Interactive Step Segments */}
            <div
              className="flex items-center gap-2"
              role="tablist"
              aria-label="Onboarding highlights"
            >
              {ONBOARDING_SLIDES.map((slide, idx) => {
                const isActive = idx === slideIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Highlight ${idx + 1}: ${slide.eyebrow}`}
                    onClick={() => goToSlide(idx)}
                    className="py-3 flex-1 group focus-visible:outline-none"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-[#141617] dark:bg-[#C8EC45]'
                          : 'bg-black/[0.12] dark:bg-white/[0.14] group-hover:bg-black/[0.25] dark:group-hover:bg-white/[0.3]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Primary & Secondary Actions */}
            <div className="flex items-center gap-3 pt-1">
              {slideIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous highlight"
                  className="min-h-[48px] min-w-[48px] px-4 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[#111315] dark:text-[#F4F5F0] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition flex items-center justify-center shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 min-h-[48px] px-6 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-sm transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>{activeSlide.ctaLabel}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={onReplaySplash}
                className="min-h-[44px] inline-flex items-center gap-2 text-xs font-medium text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-[#F4F5F0] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay launch animation</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
