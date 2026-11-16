/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KoreanBankPreset } from '../../utils/koreanBanks';

interface BankLogoProps {
  bank: KoreanBankPreset;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const OFFICIAL_BANK_ASSETS: Record<string, { src: string; fullBleed?: boolean }> = {
  shinhan: { src: '/logos/banks/shinhan.svg' },
  kakao: { src: '/logos/banks/kakao.svg', fullBleed: true },
  toss: { src: '/logos/banks/toss.png' },
  kb: { src: '/logos/banks/kb.svg' },
  woori: { src: '/logos/banks/woori.svg' },
  hana: { src: '/logos/banks/hana.svg' },
  nh: { src: '/logos/banks/nh.svg' },
  ibk: { src: '/logos/banks/ibk.svg' },
};

export const BankLogo: React.FC<BankLogoProps> = ({
  bank,
  size = 'md',
  className = '',
}) => {
  const containerClass =
    size === 'xs'
      ? 'w-4 h-4 rounded-[5px]'
      : size === 'sm'
      ? 'w-6 h-6 rounded-md'
      : size === 'lg'
      ? 'w-9 h-9 rounded-xl'
      : 'w-8 h-8 rounded-lg';

  const padClass =
    size === 'xs'
      ? 'p-[1.5px]'
      : size === 'sm'
      ? 'p-[3px]'
      : size === 'lg'
      ? 'p-1.5'
      : 'p-1';

  const official = OFFICIAL_BANK_ASSETS[bank.id];

  if (official) {
    if (official.fullBleed) {
      return (
        <span
          className={`${containerClass} inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${className}`}
          title={bank.name}
          aria-hidden="true"
        >
          <img
            src={official.src}
            alt={bank.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </span>
      );
    }

    return (
      <span
        className={`${containerClass} ${padClass} bg-white border border-black/[0.08] dark:border-white/[0.12] inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${className}`}
        title={bank.name}
        aria-hidden="true"
      >
        <img
          src={official.src}
          alt={bank.name}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </span>
    );
  }

  const iconPx = size === 'xs' ? 11 : size === 'sm' ? 14 : size === 'lg' ? 20 : 18;

  const renderFallbackMark = () => {
    if (bank.id === 'cash') {
      return (
        <svg width={iconPx} height={iconPx} viewBox="0 0 24 24" fill="none">
          <path
            d="M5.5 7L8.5 17L12 8.5L15.5 17L18.5 7"
            stroke={bank.textColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4.5 11.5H19.5" stroke={bank.textColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    }

    if (bank.id === 'global') {
      return (
        <svg width={iconPx} height={iconPx} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="7.5" stroke={bank.textColor} strokeWidth="1.9" />
          <ellipse cx="12" cy="12" rx="3.4" ry="7.5" stroke={bank.textColor} strokeWidth="1.7" />
          <path d="M5 12H19" stroke={bank.textColor} strokeWidth="1.7" />
        </svg>
      );
    }

    return (
      <svg width={iconPx} height={iconPx} viewBox="0 0 24 24" fill="none">
        <path d="M4.5 9.5L12 5L19.5 9.5H4.5Z" fill={bank.textColor} />
        <path
          d="M7 11.5V17M12 11.5V17M17 11.5V17M5 18.5H19"
          stroke={bank.textColor}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <span
      className={`${containerClass} inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ backgroundColor: bank.color }}
      title={bank.name}
      aria-hidden="true"
    >
      {renderFallbackMark()}
    </span>
  );
};
