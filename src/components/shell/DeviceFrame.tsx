/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, MailWarning, X } from 'lucide-react';
import { useGamification } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';

interface DeviceFrameProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children, footer }) => {
  const { xpFloatingNotice } = useGamification();
  const { user, isGuest, openAuthModal, resendVerificationEmail, reloadUser } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Hidden for the rest of this visit only; it returns next time so demo users keep a path to sign up.
  const [demoBarDismissed, setDemoBarDismissed] = useState(false);
  const isDemo = !user && isGuest;
  const [verifyNoticeStatus, setVerifyNoticeStatus] = useState<string | null>(null);

  const isPasswordUser = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );
  const showUnverifiedBanner = Boolean(
    user && isPasswordUser && !user.emailVerified && !bannerDismissed
  );

  return (
    <div className="min-h-dvh w-full pt-[env(safe-area-inset-top)] bg-[#F4F5F0] dark:bg-[#0D0F0C] text-[#111315] dark:text-[#F4F5F0] flex flex-col font-['Plus_Jakarta_Sans',-apple-system,BlinkMacSystemFont,sans-serif] transition-colors">
      {xpFloatingNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[calc(1rem+env(safe-area-inset-top))] inset-x-0 z-50 flex justify-center pointer-events-none px-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#141617] dark:bg-[#C8EC45] text-[#C8EC45] dark:text-[#111315] text-xs font-semibold shadow-lg border border-white/10 dark:border-black/10 animate-in fade-in slide-in-from-top-2 duration-150">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono font-bold">+{xpFloatingNotice.amount} XP</span>
            <span className="opacity-85">· {xpFloatingNotice.reason}</span>
          </div>
        </div>
      )}

      {showUnverifiedBanner && (
        <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 pt-3">
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 min-w-0">
              <MailWarning className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">
                {verifyNoticeStatus || 'Verify your email address to secure password recovery.'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await resendVerificationEmail();
                    setVerifyNoticeStatus('Verification email sent! Check your inbox.');
                  } catch {
                    setVerifyNoticeStatus('Could not send email right now. Try again shortly.');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold"
              >
                Resend
              </button>
              <button
                type="button"
                onClick={async () => {
                  const updated = await reloadUser();
                  if (!updated?.emailVerified) {
                    setVerifyNoticeStatus('Still unverified — open the link in your email first.');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] text-[11px] font-semibold"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss email verification notice"
                className="w-7 h-7 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isDemo && !demoBarDismissed && (
        <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 pt-3">
          <div
            role="status"
            className="rounded-2xl bg-[#C8EC45]/25 dark:bg-[#C8EC45]/10 border border-[#C8EC45]/70 dark:border-[#C8EC45]/30 pl-3.5 pr-1.5 py-1.5 flex items-center justify-between gap-2 text-xs text-[#111315] dark:text-[#F4F5F0]"
          >
            <span className="min-w-0">
              <span className="font-bold">Demo mode</span>
              <span className="text-[#4B5248] dark:text-[#B4BCB0]"> · entries stay on this device</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={openAuthModal}
                className="min-h-[36px] px-3 rounded-xl bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold"
              >
                Sign up to save
              </button>
              <button
                type="button"
                onClick={() => setDemoBarDismissed(true)}
                aria-label="Hide demo notice"
                className="w-9 h-9 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Centered Responsive Workspace Container */}
      <div className="flex-1 flex flex-col w-full max-w-[1040px] mx-auto relative pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {children}
      </div>

      {/* Persistent Floating Bottom Capsule Navigation */}
      {footer && (
        <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] px-4 flex justify-center">
          <div className="pointer-events-auto w-full max-w-[360px]">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
};
