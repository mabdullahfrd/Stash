/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Transaction } from '../types/finance';

/**
 * Picks the categories to show by default in the entry form, so people don't
 * have to scroll past every category to reach the account picker and Save.
 *
 * Order: the user's most-used categories for this entry type (ties keep the
 * list's own order), padded with the first categories in the list. The currently
 * selected category is always included, replacing the last slot if needed.
 */
export function pickQuickCategories(
  available: Category[],
  transactions: Transaction[],
  selectedId: string,
  limit = 6
): Category[] {
  if (available.length <= limit) return available;

  const availableIds = new Set(available.map((c) => c.id));
  const counts = new Map<string, number>();
  for (const tx of transactions) {
    if (availableIds.has(tx.categoryId)) {
      counts.set(tx.categoryId, (counts.get(tx.categoryId) ?? 0) + 1);
    }
  }

  const order = new Map(available.map((c, i) => [c.id, i]));
  const ranked = [...available].sort((a, b) => {
    const diff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
    return diff !== 0 ? diff : (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
  });

  const picked = ranked.slice(0, limit);
  const selected = available.find((c) => c.id === selectedId);
  if (selected && !picked.some((c) => c.id === selected.id)) {
    picked[picked.length - 1] = selected;
  }
  return picked;
}
