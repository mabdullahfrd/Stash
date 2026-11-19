/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeForFirestore,
  validatePassword,
  isStandalonePwa,
  shouldFallbackToRedirect,
  formatFirebaseAuthError,
} from './firestoreSanitize';

test('sanitizeForFirestore recursively strips undefined fields', () => {
  const cleaned = sanitizeForFirestore({
    id: 'tx-1',
    merchant: undefined,
    nested: { a: 1, b: undefined },
    items: [undefined, { name: 'Milk', note: undefined }],
  });

  assert.deepEqual(cleaned, {
    id: 'tx-1',
    nested: { a: 1 },
    items: [{ name: 'Milk' }],
  });
});

test('validatePassword enforces minimum 8 characters', () => {
  assert.equal(validatePassword('1234567').valid, false);
  assert.equal(validatePassword('').valid, false);
  assert.equal(validatePassword('12345678').valid, true);
});

test('isStandalonePwa detects iOS standalone and display-mode standalone', () => {
  assert.equal(isStandalonePwa({ standalone: true }, undefined), true);
  assert.equal(
    isStandalonePwa(undefined, { matchMedia: () => ({ matches: true }) }),
    true
  );
  assert.equal(
    isStandalonePwa({ standalone: false }, { matchMedia: () => ({ matches: false }) }),
    false
  );
});

test('shouldFallbackToRedirect only triggers on popup-blocked or unsupported env', () => {
  assert.equal(shouldFallbackToRedirect({ code: 'auth/popup-blocked' }), true);
  assert.equal(
    shouldFallbackToRedirect({ code: 'auth/operation-not-supported-in-this-environment' }),
    true
  );
  assert.equal(shouldFallbackToRedirect({ code: 'auth/popup-closed-by-user' }), false);
});

test('formatFirebaseAuthError maps weak-password and requires-recent-login cleanly', () => {
  assert.match(formatFirebaseAuthError({ code: 'auth/weak-password' }), /8 characters/);
  assert.match(
    formatFirebaseAuthError({ code: 'auth/requires-recent-login' }),
    /re-authenticate/i
  );
});
