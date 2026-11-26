/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describeDeadline, formatShortDate } from '../../utils/dates';

/**
 * Deadline text for goal / pledge cards.
 * - Completed items, or deadlines far away: plain "· Due Dec 31".
 * - Within 14 days: amber pill ("5 days left", "Due today").
 * - Past due: red pill ("Overdue by 2 days").
 */
export const DeadlineLabel: React.FC<{
  date?: string;
  prefix: string; // e.g. "Due" or "Target"
  isComplete: boolean;
}> = ({ date, prefix, isComplete }) => {
  if (!date) return null;
  const deadline = describeDeadline(date);

  if (isComplete || !deadline || deadline.tone === 'later') {
    return (
      <span>
        {' · '}
        <span className="whitespace-nowrap">{`${prefix} ${formatShortDate(date)}`}</span>
      </span>
    );
  }

  const toneClass =
    deadline.tone === 'overdue'
      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
      : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';

  return (
    <span
      className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${toneClass}`}
      title={`${prefix} ${formatShortDate(date)}`}
    >
      {deadline.label}
    </span>
  );
};
