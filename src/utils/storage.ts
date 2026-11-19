/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key: string, value: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(key: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getStorageJSON<T>(key: string, fallback: T): T {
  try {
    const raw = getStorageItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStorageJSON(key: string, value: unknown): boolean {
  try {
    return setStorageItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function generateId(prefix: string): string {
  const uuid =
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${uuid}` : uuid;
}
