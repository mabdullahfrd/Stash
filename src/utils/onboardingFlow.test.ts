/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ONBOARDING_SLIDES,
  clampSlideIndex,
  getPreviewAccountBalances,
  resolveInitialPreAuthStage,
} from './onboardingFlow';

test('resolveInitialPreAuthStage defaults to splash and respects autostart query', () => {
  assert.equal(resolveInitialPreAuthStage(''), 'splash');
  assert.equal(resolveInitialPreAuthStage('?foo=bar'), 'splash');
  assert.equal(resolveInitialPreAuthStage('?autostart=1'), 'auth');
  assert.equal(resolveInitialPreAuthStage('?skipIntro=1'), 'auth');
});

test('clampSlideIndex stays bounded across all onboarding slides', () => {
  assert.equal(ONBOARDING_SLIDES.length, 3);
  assert.equal(clampSlideIndex(-2), 0);
  assert.equal(clampSlideIndex(0), 0);
  assert.equal(clampSlideIndex(1), 1);
  assert.equal(clampSlideIndex(2), 2);
  assert.equal(clampSlideIndex(10), 2);
});

test('getPreviewAccountBalances converts Hana and Toss balances accurately', () => {
  const krw = getPreviewAccountBalances('KRW');
  assert.equal(krw.hanaFormatted, '₩7,119,000');
  assert.equal(krw.tossFormatted, '₩592,300');
  assert.equal(krw.totalFormatted, '₩7,711,300');

  const usd = getPreviewAccountBalances('USD');
  assert.ok(usd.hanaFormatted.startsWith('$'));
  assert.ok(usd.tossFormatted.startsWith('$'));
  assert.ok(usd.totalFormatted.startsWith('$'));
});
