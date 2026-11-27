/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Flame, Gem, Check, ChevronDown, Trophy } from 'lucide-react';
import { useGamification } from '../../context/FinanceContext';
import { DAILY_XP_CAP } from '../../utils/gamification';

/**
 * Shows what XP is for: current level, progress to the next one, daily streak,
 * gems, and today's quests (which can only be claimed here).
 */
export const ProgressCard: React.FC = () => {
  const { xp, levelInfo, streak, gems, quests, claimQuest } = useGamification();
  const [showQuests, setShowQuests] = useState(false);

  const claimable = quests.filter((q) => q.completed && !q.claimed).length;
  const done = quests.filter((q) => q.claimed).length;
  const [englishTitle] = levelInfo.title.split(' (');

  return (
    <section
      aria-label="Your progress"
      className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#C8EC45] text-[#111315] flex flex-col items-center justify-center shrink-0">
            <Trophy className="w-4 h-4" />
            <span className="text-[9px] font-bold leading-none mt-0.5">{levelInfo.badge}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0] truncate">
              {englishTitle}
            </p>
            <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] tabular-nums">
              {xp.toLocaleString()} XP total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-semibold">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300"
            title="Days in a row with at least one entry"
          >
            <Flame className="w-3.5 h-3.5" />
            {streak} day{streak === 1 ? '' : 's'}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
            title="Gems from claimed quests"
          >
            <Gem className="w-3.5 h-3.5" />
            {gems}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div
          className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden"
          role="progressbar"
          aria-label="Progress to next level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={levelInfo.progressPercent}
        >
          <div
            className="h-full rounded-full bg-[#C8EC45] transition-all duration-500"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] tabular-nums">
          {Math.max(0, levelInfo.nextLevelXp - levelInfo.currentLevelXp)} XP to Level {levelInfo.level + 1} · up to{' '}
          {DAILY_XP_CAP} XP a day
        </p>
      </div>

      <div className="border-t border-black/[0.05] dark:border-white/[0.06] pt-3">
        <button
          type="button"
          onClick={() => setShowQuests((v) => !v)}
          aria-expanded={showQuests}
          className="w-full min-h-[36px] flex items-center justify-between text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]"
        >
          <span>
            Today&apos;s quests · {done}/{quests.length} done
            {claimable > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-[#C8EC45] text-[#111315] text-[10px]">
                {claimable} to claim
              </span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showQuests ? 'rotate-180' : ''}`} />
        </button>

        {showQuests && (
          <ul className="mt-2 space-y-2">
            {quests.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] truncate">{q.title}</p>
                  <p className="text-[10px] text-[#6B7268] dark:text-[#8E9689]">
                    +{q.rewardXp} XP · +{q.rewardGems} gems
                  </p>
                </div>
                {q.claimed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-[#C8EC45] shrink-0">
                    <Check className="w-3.5 h-3.5" /> Claimed
                  </span>
                ) : q.completed ? (
                  <button
                    type="button"
                    onClick={() => claimQuest(q.id)}
                    className="min-h-[36px] px-3 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold shrink-0"
                  >
                    Claim
                  </button>
                ) : (
                  <span className="text-[11px] text-[#8E9689] shrink-0">Not done yet</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
