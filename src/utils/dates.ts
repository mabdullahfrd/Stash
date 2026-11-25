/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns YYYY-MM-DD using the local timezone's calendar date parts,
 * avoiding UTC shifts from Date.prototype.toISOString().
 */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the local date `days` days before `date` (negative values move forward).
 */
export function shiftLocalDate(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - days);
}

export type DateRangePreset = 'all' | 'month' | '7d';

/**
 * Converts a range preset into inclusive YYYY-MM-DD bounds relative to `today`.
 * - 'all'   → undefined (no filtering)
 * - 'month' → first day of the current calendar month through today
 * - '7d'    → today and the 6 days before it
 */
export function getDateRangeBounds(
  range: DateRangePreset,
  today: Date = new Date()
): { start: string; end: string } | undefined {
  if (range === 'all') return undefined;
  const end = localDateString(today);
  if (range === 'month') {
    return { start: `${end.slice(0, 7)}-01`, end };
  }
  return { start: localDateString(shiftLocalDate(today, 6)), end };
}

/**
 * Validates a strict YYYY-MM-DD calendar date string.
 */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const check = new Date(year, month - 1, day);
  return (
    check.getFullYear() === year &&
    check.getMonth() === month - 1 &&
    check.getDate() === day
  );
}
