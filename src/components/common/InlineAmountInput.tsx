/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CurrencyCode } from '../../types/finance';
import { CURRENCY_REGISTRY } from '../../utils/currencies';

/** Strips everything but digits and a single decimal point (commas allowed while typing). */
export function cleanAmountText(raw: string, allowDecimals: boolean): string {
  const digits = raw.replace(/,/g, '').replace(allowDecimals ? /[^\d.]/g : /\D/g, '');
  if (!allowDecimals) return digits;
  const [whole, ...rest] = digits.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
}

/**
 * Compact editable amount for review lists. Keeps its own text while typing
 * (so "12." isn't swallowed) and reports a number on every change; 0 means empty/invalid.
 */
export const InlineAmountInput: React.FC<{
  value: number;
  currency: CurrencyCode;
  onChange: (value: number) => void;
  ariaLabel: string;
  sign?: '+' | '-';
  invalid?: boolean;
  className?: string;
}> = ({ value, currency, onChange, ariaLabel, sign, invalid, className = '' }) => {
  const allowDecimals = (CURRENCY_REGISTRY[currency]?.decimals ?? 2) > 0;
  const [text, setText] = useState(() => (value > 0 ? String(value) : ''));

  // Follow outside changes (e.g. a new scan) without fighting the user's typing.
  useEffect(() => {
    const parsed = parseFloat(text);
    if (!(Number.isFinite(parsed) && parsed === value) && !(value === 0 && text === '')) {
      setText(value > 0 ? String(value) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 min-h-[36px] bg-white dark:bg-[#161915] focus-within:border-[#141617] dark:focus-within:border-[#C8EC45] ${
        invalid ? 'border-rose-400 dark:border-rose-500' : 'border-black/[0.08] dark:border-white/[0.1]'
      } ${className}`}
    >
      <span className="font-mono text-[11px] text-[#8E9689]">
        {sign ?? ''}
        {CURRENCY_REGISTRY[currency]?.symbol ?? ''}
      </span>
      <input
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        autoComplete="off"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        value={text}
        placeholder="0"
        onChange={(e) => {
          const next = cleanAmountText(e.target.value, allowDecimals);
          setText(next);
          const parsed = parseFloat(next);
          onChange(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
        }}
        className="w-[5.5rem] bg-transparent text-right font-mono font-bold text-xs tabular-nums text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
      />
    </span>
  );
};
