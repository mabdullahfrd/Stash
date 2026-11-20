/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  getUpdateOutcomeFromRegistration,
  PERIODIC_SW_UPDATE_CHECK_MS,
  shouldCheckForSwUpdate,
  shouldReloadOnControllerChange,
} from '../utils/pwaUpdate';

declare const __APP_BUILD_ID__: string | undefined;

export type PWAUpdateStatus =
  | 'idle'
  | 'checking'
  | 'updating'
  | 'ready'
  | 'up-to-date'
  | 'offline'
  | 'error';

interface PWAUpdateContextValue {
  buildId: string;
  updateStatus: PWAUpdateStatus;
  needRefresh: boolean;
  lastCheckedAt: number | null;
  checkForUpdates: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissUpdateBanner: () => void;
}

const PWAUpdateContext = createContext<PWAUpdateContextValue | undefined>(undefined);

export const PWAUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const buildId = typeof __APP_BUILD_ID__ === 'string' ? __APP_BUILD_ID__ : 'Local preview';

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheckedAtRef = useRef<number>(0);
  const reloadingRef = useRef<boolean>(false);
  const hadInitialControllerRef = useRef<boolean>(
    typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      Boolean(navigator.serviceWorker.controller)
  );

  const [updateStatus, setUpdateStatus] = useState<PWAUpdateStatus>('idle');
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      registrationRef.current = registration;

      const handleUpdateFound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        setUpdateStatus('updating');
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateStatus('ready');
          }
        });
      };

      registration.addEventListener('updatefound', handleUpdateFound);
      if (registration.waiting) {
        setUpdateStatus('ready');
        setNeedRefresh(true);
      }
    },
    onNeedRefresh() {
      setUpdateStatus('ready');
    },
    onRegisterError() {
      // Non-fatal; app still functions cleanly without SW registration
    },
  });

  const runUpdateCheck = useCallback(
    async (force: boolean) => {
      if (typeof navigator === 'undefined') return;
      if (!navigator.onLine) {
        if (force) setUpdateStatus('offline');
        return;
      }

      const now = Date.now();
      if (!force && !shouldCheckForSwUpdate(lastCheckedAtRef.current, now, navigator.onLine)) {
        return;
      }

      if (force) {
        setUpdateStatus('checking');
      }

      lastCheckedAtRef.current = now;
      setLastCheckedAt(now);

      try {
        let registration = registrationRef.current;
        if (!registration && 'serviceWorker' in navigator) {
          registration = (await navigator.serviceWorker.getRegistration()) ?? null;
          if (registration) {
            registrationRef.current = registration;
          }
        }

        if (!registration) {
          if (force) {
            setUpdateStatus('up-to-date');
          }
          return;
        }

        await registration.update();
        const outcome = getUpdateOutcomeFromRegistration(registration);
        if (outcome === 'update-found') {
          if (registration.waiting) {
            setUpdateStatus('ready');
            setNeedRefresh(true);
            if (force) {
              setUpdateStatus('updating');
              await updateServiceWorker(true);
            }
          } else {
            setUpdateStatus('updating');
          }
        } else if (force) {
          setUpdateStatus('up-to-date');
        }
      } catch {
        if (force) {
          setUpdateStatus('error');
        }
      }
    },
    [setNeedRefresh, updateServiceWorker]
  );

  const checkForUpdates = useCallback(async () => {
    await runUpdateCheck(true);
  }, [runUpdateCheck]);

  const applyUpdate = useCallback(async () => {
    setUpdateStatus('updating');
    try {
      await updateServiceWorker(true);
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, [updateServiceWorker]);

  const dismissUpdateBanner = useCallback(() => {
    setNeedRefresh(false);
    setUpdateStatus('idle');
  }, [setNeedRefresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      if (shouldReloadOnControllerChange(hadInitialControllerRef.current, reloadingRef.current)) {
        reloadingRef.current = true;
        setUpdateStatus('updating');
        window.location.reload();
      } else {
        hadInitialControllerRef.current = true;
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void runUpdateCheck(false);
      }
    };

    const handleOnline = () => {
      void runUpdateCheck(false);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleOnline);

    const intervalId = window.setInterval(() => {
      void runUpdateCheck(false);
    }, PERIODIC_SW_UPDATE_CHECK_MS);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleOnline);
      window.clearInterval(intervalId);
    };
  }, [runUpdateCheck]);

  return (
    <PWAUpdateContext.Provider
      value={{
        buildId,
        updateStatus,
        needRefresh,
        lastCheckedAt,
        checkForUpdates,
        applyUpdate,
        dismissUpdateBanner,
      }}
    >
      {children}
    </PWAUpdateContext.Provider>
  );
};

export function usePWAUpdate() {
  const ctx = useContext(PWAUpdateContext);
  if (!ctx) {
    throw new Error('usePWAUpdate must be used within PWAUpdateProvider');
  }
  return ctx;
}
