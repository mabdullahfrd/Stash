/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDailyXpCap,
  createDefaultQuests,
  DEFAULT_QUESTS,
  getLevelInfo,
  resetQuestsIfNewDay,
  updateDailyStreak,
} from './gamification';
import { findBankPreset } from './koreanBanks';

test('Level calculations progress through levels properly', () => {
  const lv1 = getLevelInfo(50);
  assert.equal(lv1.level, 1);
  assert.equal(lv1.title, 'Won Starter (초보자)');

  const lv2 = getLevelInfo(250);
  assert.equal(lv2.level, 2);

  const lv4 = getLevelInfo(1200);
  assert.equal(lv4.level, 4);
  assert.equal(lv4.title, 'Receipt Master (영수증 달인)');
});

test('Korean bank presets correctly identify banks and attributes', () => {
  const shinhan = findBankPreset('Shinhan Bank (신한은행)');
  assert.equal(shinhan.id, 'shinhan');
  assert.equal(shinhan.badge, '신한');
  assert.equal(shinhan.color, '#0046FF');

  const kakao = findBankPreset('KakaoBank Vault');
  assert.equal(kakao.id, 'kakao');
  assert.equal(kakao.badge, '카카오');

  const toss = findBankPreset('Toss Bank Pocket');
  assert.equal(toss.id, 'toss');
  assert.equal(toss.badge, '토스');

  const custom = findBankPreset('Unknown Credit Union');
  assert.equal(custom.id, 'custom');
});

test('Default quests start incomplete each day and reset on a new day', () => {
  assert.ok(DEFAULT_QUESTS.length >= 4);
  assert.equal(DEFAULT_QUESTS.every((q) => !q.completed && !q.claimed && q.progress === 0), true);

  const completedQuests = createDefaultQuests().map((q) => ({ ...q, progress: 1, completed: true }));
  const sameDay = resetQuestsIfNewDay(completedQuests, '2026-11-19', '2026-11-19');
  assert.equal(sameDay.quests[0].completed, true);

  const nextDay = resetQuestsIfNewDay(completedQuests, '2026-11-19', '2026-11-20');
  assert.equal(nextDay.quests.every((q) => !q.completed && q.progress === 0), true);
  assert.equal(nextDay.questDate, '2026-11-20');
});

test('updateDailyStreak increments on consecutive days, stays flat same day, and resets after missed day', () => {
  const first = updateDailyStreak(0, null, '2026-11-18');
  assert.equal(first.streak, 1);

  const sameDay = updateDailyStreak(first.streak, first.lastActivityDate, '2026-11-18');
  assert.equal(sameDay.streak, 1);

  const nextDay = updateDailyStreak(sameDay.streak, sameDay.lastActivityDate, '2026-11-19');
  assert.equal(nextDay.streak, 2);

  const missedDay = updateDailyStreak(nextDay.streak, nextDay.lastActivityDate, '2026-11-21');
  assert.equal(missedDay.streak, 1);
});

test('applyDailyXpCap caps daily XP at 100 and resets on the next calendar day', () => {
  const r1 = applyDailyXpCap(0, null, 60, '2026-11-19');
  assert.equal(r1.grantedXp, 60);
  assert.equal(r1.nextDailyXpEarned, 60);

  const r2 = applyDailyXpCap(r1.nextDailyXpEarned, r1.xpDate, 80, '2026-11-19');
  assert.equal(r2.grantedXp, 40);
  assert.equal(r2.nextDailyXpEarned, 100);

  const r3 = applyDailyXpCap(r2.nextDailyXpEarned, r2.xpDate, 20, '2026-11-19');
  assert.equal(r3.grantedXp, 0);

  const nextDay = applyDailyXpCap(r3.nextDailyXpEarned, r3.xpDate, 50, '2026-11-20');
  assert.equal(nextDay.grantedXp, 50);
  assert.equal(nextDay.nextDailyXpEarned, 50);
});
