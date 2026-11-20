/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_SW_UPDATE_CHECK_INTERVAL_MS = 60_000;
export const PERIODIC_SW_UPDATE_CHECK_MS = 30 * 60_000;

export type SwUpdateOutcome = 'update-found' | 'up-to-date' | 'unsupported';

export interface SwRegistrationLike {
  installing?: unknown | null;
  waiting?: unknown | null;
}

/**
 * Determines whether an automatic foreground/visibility service worker update check
 * should run now, avoiding redundant network checks while offline or within the
 * throttle window.
 */
export function shouldCheckForSwUpdate(
  lastCheckedAt: number,
  now: number,
  isOnline: boolean,
  minIntervalMs: number = DEFAULT_SW_UPDATE_CHECK_INTERVAL_MS
): boolean {
  if (!isOnline) return false;
  if (!Number.isFinite(now) || now < 0) return false;
  if (!Number.isFinite(lastCheckedAt) || lastCheckedAt <= 0) return true;
  return now - lastCheckedAt >= Math.max(0, minIntervalMs);
}

/**
 * Determines whether the page should reload after a service worker controllerchange
 * event. Fresh first-time installs (where no controller existed before) must not
 * trigger a reload loop; existing installed sessions reload once to pick up new code.
 */
export function shouldReloadOnControllerChange(
  hadInitialController: boolean,
  alreadyReloading: boolean
): boolean {
  return hadInitialController && !alreadyReloading;
}

/**
 * Classifies whether a ServiceWorkerRegistration already has a new worker
 * downloading (`installing`) or ready (`waiting`) after `registration.update()`.
 */
export function getUpdateOutcomeFromRegistration(
  registration: SwRegistrationLike | null | undefined
): SwUpdateOutcome {
  if (!registration) return 'unsupported';
  if (registration.installing || registration.waiting) {
    return 'update-found';
  }
  return 'up-to-date';
}
