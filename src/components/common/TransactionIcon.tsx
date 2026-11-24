/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Coffee,
  ShoppingBag,
  ShoppingCart,
  IceCreamCone,
  Cookie,
  Utensils,
  BookOpen,
  TrainFront,
  HeartHandshake,
  Heart,
  ArrowLeftRight,
  Briefcase,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  PiggyBank,
  Dumbbell,
  Sparkles,
  Film,
  Plane,
  Smartphone,
  Home,
  Gift,
  Stethoscope,
  Repeat,
  Laptop,
  Award,
  TrendingUp,
  RotateCcw,
  Tag,
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
  if (query.includes('savings') || query.includes('piggybank') || query.includes('emergency fund')) {
    return PiggyBank;
  }
  if (query.includes('coffee') || query.includes('latte') || query.includes('cafe') || query.includes('drink') || query.includes('메가커피')) {
    return Coffee;
  }
  if (query.includes('ice cream') || query.includes('icecream') || query.includes('baskin') || query.includes('haagen') || query.includes('bingsu') || query.includes('gelato') || query.includes('메로나') || query.includes('배스킨')) {
    return IceCreamCone;
  }
  if (query.includes('treats') || query.includes('snack') || query.includes('cookie') || query.includes('macaron') || query.includes('chocolate') || query.includes('cake') || query.includes('donut') || query.includes('candy')) {
    return Cookie;
  }
  if (query.includes('fitness') || query.includes('dumbbell') || query.includes('gym') || query.includes('pilates')) {
    return Dumbbell;
  }
  if (query.includes('health') || query.includes('stethoscope') || query.includes('pharmacy') || query.includes('clinic')) {
    return Stethoscope;
  }
  if (query.includes('beauty') || query.includes('sparkles') || query.includes('skincare') || query.includes('olive young')) {
    return Sparkles;
  }
  if (query.includes('entertainment') || query.includes('film') || query.includes('cinema') || query.includes('movie') || query.includes('concert')) {
    return Film;
  }
  if (query.includes('travel') || query.includes('plane') || query.includes('flight') || query.includes('hotel')) {
    return Plane;
  }
  if (query.includes('tech') || query.includes('smartphone') || query.includes('software') || query.includes('macbook')) {
    return Smartphone;
  }
  if (query.includes('household') || query.includes('laundry') || query.includes('home')) {
    return Home;
  }
  if (query.includes('gift') || query.includes('occasions')) {
    return Gift;
  }
  if (query.includes('subscription') || query.includes('repeat') || query.includes('netflix') || query.includes('spotify')) {
    return Repeat;
  }
  if (query.includes('bills') || query.includes('rent')) {
    return Receipt;
  }
  if (query.includes('grocer') || query.includes('emart') || query.includes('shoppingcart') || query.includes('egg') || query.includes('bread') || query.includes('milk') || query.includes('mart') || query.includes('cu ') || query.includes('gs25')) {
    return ShoppingCart;
  }
  if (query.includes('shoppingbag') || query.includes('shopping')) {
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
  if (query.includes('freelance') || query.includes('laptop')) {
    return Laptop;
  }
  if (query.includes('scholarship') || query.includes('grant') || query.includes('award')) {
    return Award;
  }
  if (query.includes('dividend') || query.includes('interest') || query.includes('trendingup')) {
    return TrendingUp;
  }
  if (query.includes('refund') || query.includes('cashback') || query.includes('rotateccw')) {
    return RotateCcw;
  }
  if (query.includes('placement') || query.includes('salary') || query.includes('stipend') || query.includes('briefcase')) {
    return Briefcase;
  }
  if (query.includes('tutor') || query.includes('graduation') || query.includes('campus')) {
    return GraduationCap;
  }
  if (query.includes('allowance') || query.includes('inflow') || query.includes('heart')) {
    return Heart;
  }
  if (query.includes('uncategorized') || query.includes('tag')) {
    return Tag;
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
