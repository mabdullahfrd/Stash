/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Recursively removes `undefined` fields so Firestore `setDoc` never rejects
 * payloads, and omits oversized inline `data:image/...` strings from `receiptUrl`
 * to stay well below Firestore's 1 MB document limit.
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val === undefined) continue;
      if (
        key === 'receiptUrl' &&
        typeof val === 'string' &&
        (val.startsWith('data:image/') || val.length > 500)
      ) {
        continue;
      }
      out[key] = sanitizeForFirestore(val);
    }
    return out as T;
  }

  return value;
}

/**
 * Maps raw Firebase Auth errors into clear, actionable messages.
 */
export function formatFirebaseAuthError(error: unknown, fallback = 'Authentication failed.'): string {
  if (!error || typeof error !== 'object') return fallback;
  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  const message = error instanceof Error ? error.message : String(error);

  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in window was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Browser blocked the Google sign-in popup. Please allow popups for this site.';
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location?.hostname : '';
    return host
      ? `Domain "${host}" is not authorized in Firebase Auth yet. Add "${host}" under Authentication → Settings → Authorized domains in Firebase Console, or use Demo Mode.`
      : 'This domain is not yet authorized in Firebase Auth settings. Add it under Authentication → Settings → Authorized domains in Firebase Console, or use Demo Mode.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/password sign-in is disabled in Firebase Console. Please use Continue with Google or Demo Mode.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password. Please check your credentials or create an account.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network unavailable. Check your internet connection or use Demo Mode.';
  }

  return message || fallback;
}
