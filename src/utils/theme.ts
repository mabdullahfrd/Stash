/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeMode, ThemePreference } from '../types/finance';

/** Reads the saved preference; anything unrecognised (or nothing saved) means 'system'. */
export function parseThemePreference(saved: string | null | undefined): ThemePreference {
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

/** Turns a preference into the theme actually shown. */
export function resolveThemeFromPreference(preference: ThemePreference, prefersDark: boolean): ThemeMode {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

export function getSystemPrefersDark(
  win: { matchMedia?: (query: string) => { matches: boolean } } | undefined =
    typeof window !== 'undefined' ? window : undefined
): boolean {
  if (!win || typeof win.matchMedia !== 'function') return false;
  try {
    return win.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function resolveInitialTheme(
  savedTheme: string | null | undefined,
  prefersDark: boolean
): ThemeMode {
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  return prefersDark ? 'dark' : 'light';
}
