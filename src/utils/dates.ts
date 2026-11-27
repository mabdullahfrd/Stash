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

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Human-friendly heading for a YYYY-MM-DD date: "Today", "Yesterday",
 * "Mon, Nov 24", or "Mon, Nov 24, 2025" when not in the current year.
 */
export function formatDayHeading(dateStr: string, today: Date = new Date()): string {
  if (dateStr === localDateString(today)) return 'Today';
  if (dateStr === localDateString(shiftLocalDate(today, 1))) return 'Yesterday';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr || 'Unknown date';
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const base = `${SHORT_WEEKDAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === today.getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

function parseLocalDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Compact date for cards: "Dec 31", or "Feb 15, 2027" when not in the current year.
 */
export function formatShortDate(dateStr: string, today: Date = new Date()): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  const base = `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === today.getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

export type DeadlineTone = 'overdue' | 'soon' | 'later';

/**
 * Describes how close a deadline is, for goal / pledge badges.
 * - past         → "Overdue by 2 days"  (overdue)
 * - today        → "Due today"          (soon)
 * - within 14 d  → "5 days left"        (soon)
 * - further out  → "Dec 31"             (later)
 */
export function describeDeadline(
  dateStr: string,
  today: Date = new Date()
): { label: string; tone: DeadlineTone } | null {
  const due = parseLocalDate(dateStr);
  if (!due) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((due.getTime() - start.getTime()) / 86_400_000);
  if (days < 0) {
    const n = -days;
    return { label: `Overdue by ${n} day${n === 1 ? '' : 's'}`, tone: 'overdue' };
  }
  if (days === 0) return { label: 'Due today', tone: 'soon' };
  if (days <= 14) return { label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'soon' };
  return { label: formatShortDate(dateStr, today), tone: 'later' };
}

/** Compact list date: "Today", "Yesterday", otherwise "Nov 24" (year added outside the current year). */
export function formatRelativeShortDate(dateStr: string, today: Date = new Date()): string {
  if (dateStr === localDateString(today)) return 'Today';
  if (dateStr === localDateString(shiftLocalDate(today, 1))) return 'Yesterday';
  return formatShortDate(dateStr, today);
}

/**
 * Groups items by their `date` (YYYY-MM-DD), newest day first.
 * Order within a day is preserved from the input.
 */
export function groupByDay<T extends { date: string }>(items: T[]): { date: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.date);
    if (list) list.push(item);
    else groups.set(item.date, [item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, list]) => ({ date, items: list }));
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
