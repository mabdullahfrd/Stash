/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { localDateString } from '../utils/dates';
import {
  getStorageItem,
  setStorageItem,
  getStorageJSON,
  setStorageJSON,
} from '../utils/storage';
import {
  applyDailyXpCap,
  getLevelInfo,
  LevelInfo,
  Quest,
  resetQuestsIfNewDay,
  sounds,
  updateDailyStreak,
} from '../utils/gamification';

const GAMIFICATION_KEYS = {
  XP: 'stash_krw_xp_v5',
  GEMS: 'stash_krw_gems_v5',
  STREAK: 'stash_krw_streak_v5',
  LAST_ACTIVITY_DATE: 'stash_krw_last_activity_date_v5',
  QUESTS: 'stash_krw_quests_v5',
  QUEST_DATE: 'stash_krw_last_quest_date_v5',
  DAILY_XP: 'stash_krw_daily_xp_v5',
  DAILY_XP_DATE: 'stash_krw_last_xp_date_v5',
  SOUNDS_ENABLED: 'stash_krw_sounds_v5',
};

function readIntStorage(key: string, fallback = 0): number {
  const raw = getStorageItem(key);
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export interface GamificationContextType {
  xp: number;
  streak: number;
  gems: number;
  setGems: React.Dispatch<React.SetStateAction<number>>;
  levelInfo: LevelInfo;
  quests: Quest[];
  xpFloatingNotice: { amount: number; reason: string } | null;
  mascotSpeech: string;
  soundEffectsEnabled: boolean;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  addXp: (amount: number, reason?: string) => void;
  recordDailyActivity: () => void;
  markQuestCompleted: (questId: string) => void;
  claimQuest: (questId: string) => void;
  completeScannerQuest: () => void;
  setMascotSpeech: React.Dispatch<React.SetStateAction<string>>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [xp, setXp] = useState<number>(() => readIntStorage(GAMIFICATION_KEYS.XP, 0));
  const [streak, setStreak] = useState<number>(() =>
    readIntStorage(GAMIFICATION_KEYS.STREAK, 0)
  );
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(() =>
    getStorageItem(GAMIFICATION_KEYS.LAST_ACTIVITY_DATE)
  );
  const lastActivityDateRef = useRef(lastActivityDate);
  lastActivityDateRef.current = lastActivityDate;

  const [gems, setGems] = useState<number>(() =>
    readIntStorage(GAMIFICATION_KEYS.GEMS, 0)
  );

  const [questState, setQuestState] = useState<{ quests: Quest[]; questDate: string }>(
    () => {
      const today = localDateString();
      const storedQuests = getStorageJSON<Quest[]>(GAMIFICATION_KEYS.QUESTS, []);
      const storedDate = getStorageItem(GAMIFICATION_KEYS.QUEST_DATE);
      return resetQuestsIfNewDay(storedQuests, storedDate, today);
    }
  );

  const [dailyXpState, setDailyXpState] = useState<{ earned: number; date: string }>(
    () => {
      const today = localDateString();
      const savedDate = getStorageItem(GAMIFICATION_KEYS.DAILY_XP_DATE);
      const savedEarned = readIntStorage(GAMIFICATION_KEYS.DAILY_XP, 0);
      return {
        earned: savedDate === today ? savedEarned : 0,
        date: today,
      };
    }
  );

  const [soundEffectsEnabled, setSoundEffectsEnabledState] = useState<boolean>(() => {
    const saved = getStorageItem(GAMIFICATION_KEYS.SOUNDS_ENABLED);
    const enabled = saved === null ? true : saved === 'true';
    sounds.setEnabled(enabled);
    return enabled;
  });

  const [xpFloatingNotice, setXpFloatingNotice] = useState<{
    amount: number;
    reason: string;
  } | null>(null);
  const [mascotSpeech, setMascotSpeech] = useState<string>('');

  const levelInfo = useMemo(() => getLevelInfo(xp), [xp]);

  useEffect(() => {
    setStorageItem(GAMIFICATION_KEYS.XP, xp.toString());
  }, [xp]);

  useEffect(() => {
    setStorageItem(GAMIFICATION_KEYS.STREAK, streak.toString());
  }, [streak]);

  useEffect(() => {
    if (lastActivityDate) {
      setStorageItem(GAMIFICATION_KEYS.LAST_ACTIVITY_DATE, lastActivityDate);
    }
  }, [lastActivityDate]);

  useEffect(() => {
    setStorageItem(GAMIFICATION_KEYS.GEMS, gems.toString());
  }, [gems]);

  useEffect(() => {
    setStorageJSON(GAMIFICATION_KEYS.QUESTS, questState.quests);
    setStorageItem(GAMIFICATION_KEYS.QUEST_DATE, questState.questDate);
  }, [questState]);

  useEffect(() => {
    setStorageItem(GAMIFICATION_KEYS.DAILY_XP, dailyXpState.earned.toString());
    setStorageItem(GAMIFICATION_KEYS.DAILY_XP_DATE, dailyXpState.date);
  }, [dailyXpState]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    };
  }, []);

  const setSoundEffectsEnabled = useCallback((enabled: boolean) => {
    setSoundEffectsEnabledState(enabled);
    sounds.setEnabled(enabled);
    setStorageItem(GAMIFICATION_KEYS.SOUNDS_ENABLED, enabled ? 'true' : 'false');
  }, []);

  const showXpNotice = useCallback((amount: number, reason: string) => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    setXpFloatingNotice({ amount, reason });
    noticeTimeoutRef.current = setTimeout(() => {
      setXpFloatingNotice(null);
    }, 2500);
  }, []);

  const addXp = useCallback(
    (amount: number, reason = 'Progress logged') => {
      const today = localDateString();
      setDailyXpState((prevDaily) => {
        const { grantedXp, nextDailyXpEarned, xpDate } = applyDailyXpCap(
          prevDaily.earned,
          prevDaily.date,
          amount,
          today
        );
        if (grantedXp > 0) {
          setXp((prev) => prev + grantedXp);
          sounds.playCoin();
          showXpNotice(grantedXp, reason);
        }
        return { earned: nextDailyXpEarned, date: xpDate };
      });
    },
    [showXpNotice]
  );

  const recordDailyActivity = useCallback(() => {
    const today = localDateString();
    setStreak((prevStreak) => {
      const next = updateDailyStreak(prevStreak, lastActivityDateRef.current, today);
      setLastActivityDate(next.lastActivityDate);
      return next.streak;
    });
  }, []);

  const markQuestCompleted = useCallback((questId: string) => {
    const today = localDateString();
    setQuestState((prev) => {
      const base = resetQuestsIfNewDay(prev.quests, prev.questDate, today);
      return {
        questDate: base.questDate,
        quests: base.quests.map((q) =>
          q.id === questId ? { ...q, progress: q.target, completed: true } : q
        ),
      };
    });
  }, []);

  const completeScannerQuest = useCallback(() => {
    markQuestCompleted('quest-scan-receipt');
  }, [markQuestCompleted]);

  const claimQuest = useCallback(
    (questId: string) => {
      setQuestState((prev) => {
        const q = prev.quests.find((quest) => quest.id === questId);
        if (!q || q.claimed || !q.completed) return prev;
        addXp(q.rewardXp, `Quest claimed: ${q.title}`);
        setGems((g) => g + q.rewardGems);
        sounds.playSuccess();
        return {
          ...prev,
          quests: prev.quests.map((quest) =>
            quest.id === questId ? { ...quest, claimed: true } : quest
          ),
        };
      });
    },
    [addXp]
  );

  const value = useMemo<GamificationContextType>(
    () => ({
      xp,
      streak,
      gems,
      setGems,
      levelInfo,
      quests: questState.quests,
      xpFloatingNotice,
      mascotSpeech,
      soundEffectsEnabled,
      setSoundEffectsEnabled,
      addXp,
      recordDailyActivity,
      markQuestCompleted,
      claimQuest,
      completeScannerQuest,
      setMascotSpeech,
    }),
    [
      xp,
      streak,
      gems,
      levelInfo,
      questState.quests,
      xpFloatingNotice,
      mascotSpeech,
      soundEffectsEnabled,
      setSoundEffectsEnabled,
      addXp,
      recordDailyActivity,
      markQuestCompleted,
      claimQuest,
      completeScannerQuest,
    ]
  );

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export function useGamification(): GamificationContextType {
  const ctx = useContext(GamificationContext);
  if (!ctx) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return ctx;
}
