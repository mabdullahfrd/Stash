/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrencyCode } from '../types/finance';
import { convertCurrency, formatCurrency } from './currencies';

export type PreAuthStage = 'splash' | 'onboarding' | 'auth';

export interface OnboardingSlideMeta {
  id: 'banking' | 'scanner' | 'clarity';
  stepNumber: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export const ONBOARDING_SLIDES: OnboardingSlideMeta[] = [
  {
    id: 'banking',
    stepNumber: '01',
    eyebrow: 'Korean Banking',
    title: 'Hana & Toss, unified in one calm ledger.',
    description:
      'Track balances across your Korean accounts and convert every won to USD, EUR, or PKR with a single tap.',
    ctaLabel: 'Next',
  },
  {
    id: 'scanner',
    stepNumber: '02',
    eyebrow: 'Smart Import',
    title: 'Drop a Toss screenshot or paper receipt.',
    description:
      'Line items, merchant names, and amounts are extracted automatically and matched to the right spending category.',
    ctaLabel: 'Next',
  },
  {
    id: 'clarity',
    stepNumber: '03',
    eyebrow: 'Itemized Clarity',
    title: 'See where every category actually goes.',
    description:
      'Split groceries from coffee runs, log quick manual entries in seconds, and sync securely across your devices.',
    ctaLabel: 'Continue to Sign In',
  },
];

export function resolveInitialPreAuthStage(search: string): PreAuthStage {
  try {
    const params = new URLSearchParams(search);
    if (params.get('autostart') === '1' || params.get('skipIntro') === '1') {
      return 'auth';
    }
  } catch {
    // Ignore malformed query strings
  }
  return 'splash';
}

export function clampSlideIndex(index: number, totalSlides = ONBOARDING_SLIDES.length): number {
  if (totalSlides <= 0) return 0;
  if (index < 0) return 0;
  if (index >= totalSlides) return totalSlides - 1;
  return Math.floor(index);
}

export function getPreviewAccountBalances(targetCurrency: CurrencyCode): {
  hanaFormatted: string;
  tossFormatted: string;
  totalFormatted: string;
} {
  const hanaKrw = 7_119_000;
  const tossKrw = 592_300;
  const hanaConverted = convertCurrency(hanaKrw, 'KRW', targetCurrency);
  const tossConverted = convertCurrency(tossKrw, 'KRW', targetCurrency);
  const totalConverted = convertCurrency(hanaKrw + tossKrw, 'KRW', targetCurrency);

  return {
    hanaFormatted: formatCurrency(hanaConverted, targetCurrency),
    tossFormatted: formatCurrency(tossConverted, targetCurrency),
    totalFormatted: formatCurrency(totalConverted, targetCurrency),
  };
}
