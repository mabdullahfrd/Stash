/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRelativeShortDate,
  describeDeadline,
  formatShortDate,
  formatDayHeading,
  getDateRangeBounds,
  groupByDay,
  isValidDateString,
  localDateString,
} from './dates';

test('formatDayHeading uses Today / Yesterday / weekday labels and adds year only when needed', () => {
  const today = new Date(2026, 10, 26); // Thu Nov 26, 2026
  assert.equal(formatDayHeading('2026-11-26', today), 'Today');
  assert.equal(formatDayHeading('2026-11-25', today), 'Yesterday');
  assert.equal(formatDayHeading('2026-11-24', today), 'Tue, Nov 24');
  assert.equal(formatDayHeading('2025-11-24', today), 'Mon, Nov 24, 2025');
  assert.equal(formatDayHeading('not-a-date', today), 'not-a-date');
});

test('formatRelativeShortDate keeps list dates short', () => {
  const today = new Date(2026, 10, 27);
  assert.equal(formatRelativeShortDate('2026-11-27', today), 'Today');
  assert.equal(formatRelativeShortDate('2026-11-26', today), 'Yesterday');
  assert.equal(formatRelativeShortDate('2026-11-07', today), 'Nov 7');
  assert.equal(formatRelativeShortDate('2025-12-31', today), 'Dec 31, 2025');
});

test('groupByDay groups newest day first and keeps order within a day', () => {
  const groups = groupByDay([
    { id: 'a', date: '2026-11-24' },
    { id: 'b', date: '2026-11-26' },
    { id: 'c', date: '2026-11-24' },
  ]);
  assert.deepEqual(
    groups.map((g) => [g.date, g.items.map((i) => i.id)]),
    [
      ['2026-11-26', ['b']],
      ['2026-11-24', ['a', 'c']],
    ]
  );
});

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

test('formatShortDate shows month and day, adding the year only outside the current year', () => {
  const today = new Date(2026, 10, 27);
  assert.equal(formatShortDate('2026-12-31', today), 'Dec 31');
  assert.equal(formatShortDate('2027-02-15', today), 'Feb 15, 2027');
  assert.equal(formatShortDate('bad', today), 'bad');
});

test('describeDeadline flags overdue and upcoming deadlines', () => {
  const today = new Date(2026, 10, 27, 15, 30); // time of day must not matter
  assert.deepEqual(describeDeadline('2026-11-25', today), { label: 'Overdue by 2 days', tone: 'overdue' });
  assert.deepEqual(describeDeadline('2026-11-26', today), { label: 'Overdue by 1 day', tone: 'overdue' });
  assert.deepEqual(describeDeadline('2026-11-27', today), { label: 'Due today', tone: 'soon' });
  assert.deepEqual(describeDeadline('2026-11-28', today), { label: '1 day left', tone: 'soon' });
  assert.deepEqual(describeDeadline('2026-12-11', today), { label: '14 days left', tone: 'soon' });
  assert.deepEqual(describeDeadline('2026-12-31', today), { label: 'Dec 31', tone: 'later' });
  assert.equal(describeDeadline('', today), null);
});
