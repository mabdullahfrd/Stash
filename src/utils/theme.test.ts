/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseThemePreference, resolveInitialTheme, resolveThemeFromPreference } from './theme';

test('resolveInitialTheme honors saved preference and falls back to system color scheme', () => {
  assert.equal(resolveInitialTheme('light', true), 'light');
  assert.equal(resolveInitialTheme('dark', false), 'dark');
  assert.equal(resolveInitialTheme(null, true), 'dark');
  assert.equal(resolveInitialTheme(null, false), 'light');
  assert.equal(resolveInitialTheme('invalid', true), 'dark');
});

test('theme preference: saved light/dark win, system (or nothing saved) follows the device', () => {
  assert.equal(parseThemePreference('light'), 'light');
  assert.equal(parseThemePreference('system'), 'system');
  assert.equal(parseThemePreference(null), 'system');
  assert.equal(parseThemePreference('purple'), 'system');
  assert.equal(resolveThemeFromPreference('light', true), 'light');
  assert.equal(resolveThemeFromPreference('dark', false), 'dark');
  assert.equal(resolveThemeFromPreference('system', true), 'dark');
  assert.equal(resolveThemeFromPreference('system', false), 'light');
});
