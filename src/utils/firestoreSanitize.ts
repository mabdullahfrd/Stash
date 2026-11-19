/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Recursively removes `undefined` fields so Firestore `setDoc` never rejects payloads.
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
      out[key] = sanitizeForFirestore(val);
    }
    return out as T;
  }

  return value;
}

/**
 * Validates sign-up password requirements.
 */
export function validatePassword(
  password: string
): { valid: true } | { valid: false; error: string } {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  return { valid: true };
}

/**
 * Detects whether the app is running as an installed standalone PWA (iOS or Android).
 */
export function isStandalonePwa(
  nav: { standalone?: boolean } | undefined = typeof navigator !== 'undefined'
    ? (navigator as { standalone?: boolean })
    : undefined,
  win: { matchMedia?: (query: string) => { matches: boolean } } | undefined =
    typeof window !== 'undefined' ? window : undefined
): boolean {
  if (nav?.standalone === true) return true;
  if (typeof win?.matchMedia === 'function') {
    try {
      return win.matchMedia('(display-mode: standalone)').matches;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Checks whether a Firebase Google popup sign-in failure should automatically retry with redirect.
 */
export function shouldFallbackToRedirect(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-this-environment'
  );
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
    return 'Browser blocked the Google sign-in popup. Trying redirect sign-in instead.';
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
    return `Password should be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (code === 'auth/requires-recent-login') {
    return 'For your security, please re-authenticate before deleting your account.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (code === 'auth/user-mismatch') {
    return 'The signed-in account does not match the credentials provided.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network unavailable. Check your internet connection or use Demo Mode.';
  }

  return message || fallback;
}
