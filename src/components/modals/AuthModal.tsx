/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinanceData } from '../../context/FinanceContext';
import { MIN_PASSWORD_LENGTH, validatePassword } from '../../utils/firestoreSanitize';
import {
  X,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ModalShell } from '../common/ModalShell';

export const AuthModal: React.FC = () => {
  const {
    user,
    authModalOpen,
    closeAuthModal,
    loginWithGoogle,
    signUpEmail,
    signInEmail,
    resetPassword,
    resendVerificationEmail,
    reloadUser,
    signOut,
    authError,
    setAuthError,
    isOnline,
  } = useAuth();
  const { syncError } = useFinanceData();
  const titleId = useId();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const isPasswordUser = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );
  const needsEmailVerification = Boolean(user && isPasswordUser && !user.emailVerified);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (mode === 'reset') {
      setIsSubmitting(true);
      setAuthError(null);
      setStatusMessage(null);
      try {
        await resetPassword(email);
        setStatusMessage('Password reset email sent. Check your inbox and spam folder.');
      } catch {
        // Handled in AuthContext
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) return;
    if (mode === 'signup') {
      const check = validatePassword(password);
      if (!check.valid) {
        setAuthError(check.error);
        return;
      }
    }

    setIsSubmitting(true);
    setAuthError(null);
    setStatusMessage(null);
    try {
      if (mode === 'signup') {
        await signUpEmail(email, password, displayName);
      } else {
        await signInEmail(email, password);
      }
    } catch {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    setStatusMessage(null);
    try {
      await loginWithGoogle();
    } catch {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={authModalOpen}
      onClose={closeAuthModal}
      labelledBy={titleId}
      maxWidthClass="max-w-md"
    >
      <div className="p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#141617] dark:bg-[#C8EC45] flex items-center justify-center text-[#C8EC45] dark:text-[#111315]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id={titleId} className="text-base font-bold text-[#111315] dark:text-[#F4F5F0]">
                {user
                  ? 'Cloud Account'
                  : mode === 'reset'
                  ? 'Reset Password'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </h3>
              <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                {isOnline ? 'Cloud sync ready' : 'Offline local storage'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-[#F4F5F0] dark:bg-white/[0.06] flex items-center justify-center text-[#5E655A] dark:text-[#A4AC9E]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#141617] dark:bg-[#C8EC45] text-[#C8EC45] dark:text-[#111315] font-bold flex items-center justify-center text-base">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[#111315] dark:text-[#F4F5F0] truncate">
                    {user.displayName || 'Personal Account'}
                  </h4>
                  <p className="text-xs text-[#6B7268] dark:text-[#8E9689] truncate">
                    {user.email}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-[#C8EC45] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Firestore sync active</span>
                  </div>
                </div>
              </div>
            </div>

            {needsEmailVerification && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 space-y-2.5">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Your email address is not verified yet. Verify your inbox to secure recovery.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setStatusMessage(null);
                      try {
                        await resendVerificationEmail();
                        setStatusMessage('Verification email resent. Check your inbox.');
                      } catch {}
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-[11px] font-semibold"
                  >
                    Resend verification
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = await reloadUser();
                      if (updated?.emailVerified) {
                        setStatusMessage('Email verified!');
                      } else {
                        setStatusMessage('Still awaiting verification. Click the link in your email first.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.08] text-[#111315] dark:text-[#F4F5F0] text-[11px] font-semibold inline-flex items-center gap-1 border border-black/[0.08] dark:border-white/[0.1]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    I&apos;ve verified
                  </button>
                </div>
              </div>
            )}

            {statusMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-[#C8EC45] text-xs flex items-center gap-2 border border-emerald-200/70 dark:border-emerald-900/40">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {syncError && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2 border border-amber-200/70 dark:border-amber-900/40">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{syncError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                await signOut();
                closeAuthModal();
              }}
              className="w-full py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition flex items-center justify-center gap-2 border border-rose-200/60 dark:border-rose-900/30"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {mode !== 'reset' && (
              <>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] text-[#111315] dark:text-[#F4F5F0] font-semibold text-xs transition flex items-center justify-center gap-2.5 border border-black/[0.06] dark:border-white/[0.08]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.08]" />
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8E9689]">
                    or email
                  </span>
                  <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.08]" />
                </div>
              </>
            )}

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {statusMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-[#C8EC45] text-xs flex items-center gap-2 border border-emerald-200/70 dark:border-emerald-900/40">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Full name"
                    placeholder="Full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  aria-label="Email address"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
                />
              </div>

              {mode !== 'reset' && (
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : 1}
                    aria-label="Password"
                    placeholder={
                      mode === 'signup'
                        ? `Password (min. ${MIN_PASSWORD_LENGTH} characters)`
                        : 'Password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
                  />
                </div>
              )}

              {mode === 'signin' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setAuthError(null);
                      setStatusMessage(null);
                    }}
                    className="text-[11px] font-medium text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-[#F4F5F0] transition"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition"
              >
                {isSubmitting
                  ? 'Processing...'
                  : mode === 'reset'
                  ? 'Send reset email'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            <div className="text-center pt-1">
              {mode === 'reset' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setAuthError(null);
                    setStatusMessage(null);
                  }}
                  className="text-xs font-medium text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
                >
                  Back to sign in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setAuthError(null);
                    setStatusMessage(null);
                  }}
                  className="text-xs font-medium text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
                >
                  {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
};
