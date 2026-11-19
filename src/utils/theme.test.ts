/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInitialTheme } from './theme';

test('resolveInitialTheme honors saved preference and falls back to system color scheme', () => {
  assert.equal(resolveInitialTheme('light', true), 'light');
  assert.equal(resolveInitialTheme('dark', false), 'dark');
  assert.equal(resolveInitialTheme(null, true), 'dark');
  assert.equal(resolveInitialTheme(null, false), 'light');
  assert.equal(resolveInitialTheme('invalid', true), 'dark');
});
