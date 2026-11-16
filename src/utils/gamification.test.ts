/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelInfo, DEFAULT_QUESTS } from './gamification';
import { findBankPreset, KOREAN_BANKS } from './koreanBanks';

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

test('Default quests are initialized with appropriate XP targets', () => {
  assert.ok(DEFAULT_QUESTS.length >= 4);
  const bankQuest = DEFAULT_QUESTS.find((q) => q.id === 'quest-bank-demonstrate');
  assert.ok(bankQuest);
  assert.equal(bankQuest.rewardXp, 30);
});
