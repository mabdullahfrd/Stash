/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getDateRangeBounds, isValidDateString, localDateString } from './dates';

test('getDateRangeBounds returns inclusive month-to-date and rolling 7-day windows', () => {
  const today = new Date(2026, 10, 26); // Nov 26, 2026 (local)
  assert.equal(getDateRangeBounds('all', today), undefined);
  assert.deepEqual(getDateRangeBounds('month', today), { start: '2026-11-01', end: '2026-11-26' });
  assert.deepEqual(getDateRangeBounds('7d', today), { start: '2026-11-20', end: '2026-11-26' });
  // Crosses a month boundary
  assert.deepEqual(getDateRangeBounds('7d', new Date(2026, 11, 3)), { start: '2026-11-27', end: '2026-12-03' });
});

test('localDateString produces local calendar date in Asia/Seoul (2026-11-19T22:30:00Z -> 2026-11-20)', () => {
  const prevTz = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Seoul';
    const d = new Date('2026-11-19T22:30:00Z');
    assert.equal(localDateString(d), '2026-11-20');
  } finally {
    if (prevTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = prevTz;
    }
  }
});

test('localDateString produces local calendar date in America/Los_Angeles without advancing prematurely', () => {
  const prevTz = process.env.TZ;
  try {
    process.env.TZ = 'America/Los_Angeles';
    const d = new Date('2026-11-20T03:30:00Z');
    assert.equal(localDateString(d), '2026-11-19');
  } finally {
    if (prevTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = prevTz;
    }
  }
});

test('isValidDateString validates real YYYY-MM-DD dates and rejects invalid calendar dates', () => {
  assert.equal(isValidDateString('2026-11-20'), true);
  assert.equal(isValidDateString('2026-02-29'), false);
  assert.equal(isValidDateString('2024-02-29'), true);
  assert.equal(isValidDateString('2026-13-01'), false);
  assert.equal(isValidDateString('11/20/2026'), false);
  assert.equal(isValidDateString(null), false);
});
