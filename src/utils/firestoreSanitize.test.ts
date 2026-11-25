/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeReceiptItems,
  normalizeTransactionDoc,
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

test('sanitizeReceiptItems keeps valid items and drops malformed ones beyond the first', () => {
  const good = { id: 'i1', name: 'Milk', price: 2500, category: 'Groceries' };
  const result = sanitizeReceiptItems([
    good,
    { id: 'i2', name: 'Bread', price: '3000', category: 'Groceries' }, // price as string
    { id: 'i3', name: '', price: 100, category: 'Snacks' }, // empty name
    { id: 'i4', name: 'Juice', price: 1800 }, // missing category
    null,
    { id: 'i5', name: 'Eggs', price: 4200, category: 'Groceries', extra: 'x' }, // extra field stripped
  ]);
  assert.deepEqual(result, [good, { id: 'i5', name: 'Eggs', price: 4200, category: 'Groceries' }]);
  assert.equal(sanitizeReceiptItems('not a list'), undefined);
});

test('normalizeTransactionDoc sanitizes receipt items and leaves other transactions untouched', () => {
  const base = {
    id: 'tx1',
    type: 'expense' as const,
    amount: 5000,
    currency: 'KRW' as const,
    date: '2026-11-26',
    categoryId: 'cat',
    accountId: 'acc',
    createdAt: 'now',
    updatedAt: 'now',
  };
  assert.equal(normalizeTransactionDoc(base), base);
  const withBad = normalizeTransactionDoc({ ...base, receiptItems: [{ id: 'x' }] as never });
  assert.deepEqual(withBad.receiptItems, []);
  const notList = normalizeTransactionDoc({ ...base, receiptItems: 'oops' as never });
  assert.equal('receiptItems' in notList, false);
});
