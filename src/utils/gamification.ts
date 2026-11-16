/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardGems: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
  category: 'receipt' | 'bank' | 'expense' | 'charity';
}

export interface LevelInfo {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  badge: string;
}

export const LEVELS = [
  { level: 1, title: 'Won Starter (초보자)', requiredXp: 0, badge: 'Lv.1' },
  { level: 2, title: 'Budget Novice (절약 학생)', requiredXp: 200, badge: 'Lv.2' },
  { level: 3, title: 'Seoul Spender (스마트 소비자)', requiredXp: 500, badge: 'Lv.3' },
  { level: 4, title: 'Receipt Master (영수증 달인)', requiredXp: 1000, badge: 'Lv.4' },
  { level: 5, title: 'Bank Connoisseur (금융 마스터)', requiredXp: 2000, badge: 'Lv.5' },
  { level: 6, title: 'Won Sensei (자산 관리자)', requiredXp: 3500, badge: 'Lv.6' },
  { level: 7, title: 'Financial Legend (금융 전설)', requiredXp: 5000, badge: 'Lv.7' },
];

export function getLevelInfo(totalXp: number): LevelInfo {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].requiredXp) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || { ...LEVELS[i], requiredXp: LEVELS[i].requiredXp + 2000 };
      break;
    }
  }

  const range = nextLevel.requiredXp - currentLevel.requiredXp;
  const progressInLevel = Math.max(0, totalXp - currentLevel.requiredXp);
  const progressPercent = Math.min(100, Math.round((progressInLevel / (range || 1)) * 100));

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentLevelXp: progressInLevel,
    nextLevelXp: range,
    progressPercent,
    badge: currentLevel.badge,
  };
}

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'quest-daily-expense',
    title: 'Log an Expense or Receipt',
    description: 'Track at least 1 Korean won item today',
    rewardXp: 20,
    rewardGems: 5,
    progress: 1,
    target: 1,
    completed: true,
    claimed: false,
    icon: 'zap',
    category: 'expense',
  },
  {
    id: 'quest-scan-receipt',
    title: 'Scan a Receipt with Camera',
    description: 'Use the AI scanner on any grocery or store receipt',
    rewardXp: 50,
    rewardGems: 15,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    icon: 'camera',
    category: 'receipt',
  },
  {
    id: 'quest-bank-demonstrate',
    title: 'Verify Bank Account Usage',
    description: 'Demonstrate which bank is linked to your spending',
    rewardXp: 30,
    rewardGems: 10,
    progress: 1,
    target: 1,
    completed: true,
    claimed: false,
    icon: 'building',
    category: 'bank',
  },
  {
    id: 'quest-charity-tithe',
    title: 'Generosity Tithe (10%)',
    description: 'Give 10% of new income to charity',
    rewardXp: 100,
    rewardGems: 30,
    progress: 1,
    target: 1,
    completed: true,
    claimed: true,
    icon: 'heart',
    category: 'charity',
  },
];

// Web Audio API Synthesizer for cheerful Duolingo-like sound feedback
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  playCoin() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio playback silently suppressed if browser policy blocks it
    }
  }

  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Duolingo style cheer arpeggio: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {
      // Suppress audio failure
    }
  }

  playThunk() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Suppress audio failure
    }
  }
}

export const sounds = new SoundSynthesizer();
