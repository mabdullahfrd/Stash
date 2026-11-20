import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_SW_UPDATE_CHECK_INTERVAL_MS,
  getUpdateOutcomeFromRegistration,
  shouldCheckForSwUpdate,
  shouldReloadOnControllerChange,
} from './pwaUpdate.ts';

describe('shouldCheckForSwUpdate', () => {
  it('skips checks while offline', () => {
    assert.equal(shouldCheckForSwUpdate(0, 100_000, false), false);
    assert.equal(shouldCheckForSwUpdate(1_000, 1_000_000, false), false);
  });

  it('allows the first check when online and never checked before', () => {
    assert.equal(shouldCheckForSwUpdate(0, 5_000, true), true);
  });

  it('throttles repeated automatic checks inside the minimum interval', () => {
    const start = 1_000_000;
    assert.equal(
      shouldCheckForSwUpdate(start, start + DEFAULT_SW_UPDATE_CHECK_INTERVAL_MS - 1, true),
      false
    );
    assert.equal(
      shouldCheckForSwUpdate(start, start + DEFAULT_SW_UPDATE_CHECK_INTERVAL_MS, true),
      true
    );
  });
});

describe('shouldReloadOnControllerChange', () => {
  it('reloads only when updating an existing controller and not already reloading', () => {
    assert.equal(shouldReloadOnControllerChange(true, false), true);
    assert.equal(shouldReloadOnControllerChange(false, false), false);
    assert.equal(shouldReloadOnControllerChange(true, true), false);
    assert.equal(shouldReloadOnControllerChange(false, true), false);
  });
});

describe('getUpdateOutcomeFromRegistration', () => {
  it('detects installing or waiting workers as update-found', () => {
    assert.equal(getUpdateOutcomeFromRegistration({ installing: {}, waiting: null }), 'update-found');
    assert.equal(getUpdateOutcomeFromRegistration({ installing: null, waiting: {} }), 'update-found');
    assert.equal(getUpdateOutcomeFromRegistration({ installing: null, waiting: null }), 'up-to-date');
    assert.equal(getUpdateOutcomeFromRegistration(null), 'unsupported');
  });
});
