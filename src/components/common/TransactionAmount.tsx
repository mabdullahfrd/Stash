/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Transaction } from '../../types/finance';
import { HoldAmount } from './HoldAmount';

/**
 * Ledger amount with type-aware styling:
 * - income   → green with "+"
 * - expense  → "-"
 * - transfer → neutral, no sign (moving money between your own pockets is not spending)
 */
export const TransactionAmount: React.FC<{ tx: Transaction; size?: 'sm' | 'md' }> = ({ tx, size = 'sm' }) => {
  const isIncome = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';

  const colorClass = isIncome
    ? 'text-emerald-700 dark:text-[#C8EC45]'
    : isTransfer
      ? 'text-[#5E655A] dark:text-[#A4AC9E]'
      : 'text-[#111315] dark:text-[#F4F5F0]';

  return (
    <span className={`${size === 'md' ? 'text-sm' : 'text-xs'} font-bold font-mono tabular-nums ${colorClass}`}>
      <HoldAmount
        amount={tx.amount}
        currency={tx.currency}
        showSign={isIncome}
        prefix={tx.type === 'expense' ? '-' : ''}
        interactive={false}
      />
    </span>
  );
};
