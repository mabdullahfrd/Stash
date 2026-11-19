/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeMode } from '../types/finance';

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
