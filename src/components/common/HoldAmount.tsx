/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useFinanceData, useFinanceUI } from '../../context/FinanceContext';
import { CurrencyCode } from '../../types/finance';
import { formatCurrency } from '../../utils/currencies';

interface HoldAmountProps {
  amount: number;
  currency?: CurrencyCode;
  className?: string;
  prefix?: string;
  showSign?: boolean;
  interactive?: boolean;
}

export const HoldAmount: React.FC<HoldAmountProps> = ({
  amount,
  currency,
  className = '',
  prefix = '',
  showSign = false,
  interactive = true,
}) => {
  const { activeCurrency } = useFinanceData();
  const { openHoldConvertModal } = useFinanceUI();
  const targetCurrency = currency || activeCurrency;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatted = `${prefix}${formatCurrency(amount, targetCurrency, { showSign })}`;

  if (!interactive) {
    return <span className={className}>{formatted}</span>;
  }

  const handleStart = () => {
    timerRef.current = setTimeout(() => {
      openHoldConvertModal(amount, targetCurrency);
    }, 450);
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openHoldConvertModal(amount, targetCurrency);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      title="Tap or hold to convert to USD, EUR, KRW, PKR"
      aria-label={`Convert ${formatted} across currencies`}
      className={`inline text-left cursor-pointer active:scale-95 transition-transform select-none ${className}`}
    >
      {formatted}
    </button>
  );
};
