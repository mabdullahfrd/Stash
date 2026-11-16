/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeForFirestore, formatFirebaseAuthError } from './firestoreSanitize';

test('sanitizeForFirestore removes undefined keys and oversized base64 receiptUrl', () => {
  const payload = {
    id: 'tx-1',
    amount: 4500,
    merchant: 'Mega Coffee',
    notes: undefined,
    toAccountId: undefined,
    receiptUrl: 'data:image/png;base64,' + 'A'.repeat(2000),
    receiptItems: [
      { id: '1', name: 'Latte', price: 4500, category: 'Coffee & Drinks', extra: undefined },
    ],
  };

  const clean = sanitizeForFirestore(payload) as Record<string, unknown>;
  assert.equal('notes' in clean, false);
  assert.equal('toAccountId' in clean, false);
  assert.equal('receiptUrl' in clean, false);
  assert.equal(clean.merchant, 'Mega Coffee');
  assert.equal((clean.receiptItems as Array<Record<string, unknown>>)[0].name, 'Latte');
  assert.equal('extra' in (clean.receiptItems as Array<Record<string, unknown>>)[0], false);
});

test('formatFirebaseAuthError maps common Firebase Auth codes cleanly', () => {
  assert.match(
    formatFirebaseAuthError({ code: 'auth/operation-not-allowed', message: 'raw' }),
    /Continue with Google/i
  );
  assert.match(
    formatFirebaseAuthError({ code: 'auth/popup-blocked', message: 'raw' }),
    /popup/i
  );
  assert.match(
    formatFirebaseAuthError({ code: 'auth/invalid-credential', message: 'raw' }),
    /Incorrect email or password/i
  );
  assert.match(
    formatFirebaseAuthError({ code: 'auth/unauthorized-domain', message: 'raw' }),
    /Authorized domains/i
  );
});
