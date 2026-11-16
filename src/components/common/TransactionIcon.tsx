/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Coffee,
  ShoppingBag,
  IceCreamCone,
  Utensils,
  BookOpen,
  TrainFront,
  HeartHandshake,
  ArrowLeftRight,
  Briefcase,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
} from 'lucide-react';
import { TransactionType } from '../../types/finance';

interface TransactionIconProps {
  categoryName?: string;
  categoryIcon?: string;
  merchant?: string;
  type: TransactionType;
  isCharity?: boolean;
  hasReceipt?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function resolveTransactionIcon({
  categoryName = '',
  categoryIcon = '',
  merchant = '',
  type = 'expense',
  isCharity = false,
  hasReceipt = false,
}: {
  categoryName?: string;
  categoryIcon?: string;
  merchant?: string;
  type?: TransactionType;
  isCharity?: boolean;
  hasReceipt?: boolean;
}) {
  const query = `${categoryName} ${categoryIcon} ${merchant}`.toLowerCase();

  if (isCharity || query.includes('charity') || query.includes('zakat') || query.includes('sadaqah') || query.includes('tithe')) {
    return HeartHandshake;
  }
  if (type === 'transfer' || query.includes('transfer')) {
    return ArrowLeftRight;
  }
  if (query.includes('coffee') || query.includes('latte') || query.includes('cafe') || query.includes('drink') || query.includes('메가커피')) {
    return Coffee;
  }
  if (query.includes('ice cream') || query.includes('icecream') || query.includes('baskin') || query.includes('treat') || query.includes('macaron') || query.includes('배스킨')) {
    return IceCreamCone;
  }
  if (query.includes('grocer') || query.includes('emart') || query.includes('shoppingcart') || query.includes('egg') || query.includes('bread') || query.includes('milk') || query.includes('mart') || query.includes('cu ') || query.includes('gs25')) {
    return ShoppingBag;
  }
  if (query.includes('dining') || query.includes('utensil') || query.includes('takeout') || query.includes('meal') || query.includes('food')) {
    return Utensils;
  }
  if (query.includes('study') || query.includes('book') || query.includes('uni')) {
    return BookOpen;
  }
  if (query.includes('transit') || query.includes('metro') || query.includes('bus') || query.includes('subway') || query.includes('t-money')) {
    return TrainFront;
  }
  if (query.includes('placement') || query.includes('salary') || query.includes('stipend') || query.includes('briefcase')) {
    return Briefcase;
  }
  if (query.includes('tutor') || query.includes('graduation') || query.includes('campus')) {
    return GraduationCap;
  }
  if (hasReceipt) {
    return Receipt;
  }
  return type === 'income' ? ArrowUpRight : ArrowDownRight;
}

export const TransactionIcon: React.FC<TransactionIconProps> = ({
  categoryName = '',
  categoryIcon = '',
  merchant = '',
  type,
  isCharity = false,
  hasReceipt = false,
  size = 'md',
  className = '',
}) => {
  const IconComponent = resolveTransactionIcon({
    categoryName,
    categoryIcon,
    merchant,
    type,
    isCharity,
    hasReceipt,
  });
  const isIncome = type === 'income';

  const boxSize = size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-9 h-9 rounded-xl';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const surfaceClass = isIncome
    ? 'bg-[#C8EC45] text-[#111315]'
    : isCharity
    ? 'bg-[#141617] text-[#C8EC45] dark:bg-[#232820] dark:text-[#C8EC45]'
    : 'bg-[#F4F5F0] dark:bg-white/[0.06] text-[#111315] dark:text-[#F4F5F0]';

  return (
    <div
      className={`${boxSize} ${surfaceClass} flex items-center justify-center shrink-0 ${className}`}
      aria-hidden="true"
    >
      <IconComponent className={`${iconSize} stroke-[1.9]`} />
    </div>
  );
};
