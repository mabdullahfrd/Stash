/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CurrencyCode } from '../../types/finance';
import { formatCurrency } from '../../utils/currencies';

interface HoldAmountProps {
  amount: number;
  currency?: CurrencyCode;
  className?: string;
  prefix?: string;
  showSign?: boolean;
}

export const HoldAmount: React.FC<HoldAmountProps> = ({
  amount,
  currency,
  className = '',
  prefix = '',
  showSign = false,
}) => {
  const { activeCurrency, openHoldConvertModal } = useFinance();
  const targetCurrency = currency || activeCurrency;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    timerRef.current = setTimeout(() => {
      openHoldConvertModal(amount, targetCurrency);
    }, 450); // 450ms hold trigger
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
    <span
      onClick={handleClick}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      title="Tap or hold to convert to USD, EUR, KRW, PKR"
      className={`cursor-pointer active:scale-95 transition-transform select-none ${className}`}
    >
      {prefix}
      {formatCurrency(amount, targetCurrency, { showSign })}
    </span>
  );
};
