/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StashLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StashLogo: React.FC<StashLogoProps> = ({ size = 'md', className = '' }) => {
  const dims =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-9 h-9 rounded-xl';

  const svgSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 20;

  return (
    <div
      className={`${dims} bg-[#141617] dark:bg-[#C8EC45] flex items-center justify-center shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top folded ledger bar in Lime (on dark) / Obsidian (on lime) */}
        <path
          d="M5.5 6.5C5.5 5.39543 6.39543 4.5 7.5 4.5H17.5C18.0523 4.5 18.5 4.94772 18.5 5.5V7.5C18.5 8.60457 17.6046 9.5 16.5 9.5H8.5C6.84315 9.5 5.5 8.15685 5.5 6.5Z"
          className="fill-[#C8EC45] dark:fill-[#111315]"
        />
        {/* Middle interlocking diagonal pocket ribbon */}
        <path
          d="M5.5 12C5.5 10.6193 6.61929 9.5 8 9.5H16C17.3807 9.5 18.5 10.6193 18.5 12C18.5 13.3807 17.3807 14.5 16 14.5H8C6.61929 14.5 5.5 13.3807 5.5 12Z"
          className="fill-white/90 dark:fill-[#111315]/75"
        />
        {/* Bottom pocket base bar */}
        <path
          d="M5.5 16.5C5.5 15.3954 6.39543 14.5 7.5 14.5H15.5C17.1569 14.5 18.5 15.8431 18.5 17.5C18.5 18.6046 17.6046 19.5 16.5 19.5H6.5C5.94772 19.5 5.5 19.0523 5.5 18.5V16.5Z"
          className="fill-[#C8EC45] dark:fill-[#111315]"
        />
        {/* Crisp vertical pocket notch */}
        <circle
          cx="15.75"
          cy="12"
          r="1.15"
          className="fill-[#141617] dark:fill-[#C8EC45]"
        />
      </svg>
    </div>
  );
};
