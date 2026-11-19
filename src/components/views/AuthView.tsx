/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MIN_PASSWORD_LENGTH, validatePassword } from '../../utils/firestoreSanitize';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { StashLogo } from '../common/StashLogo';

interface AuthViewProps {
  onBackToHighlights?: () => void;
  onReplaySplash?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onBackToHighlights,
  onReplaySplash,
}) => {
  const {
    loginWithGoogle,
    signUpEmail,
    signInEmail,
    resetPassword,
    continueAsGuest,
    authError,
    setAuthError,
    isOnline,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (mode === 'reset') {
      setIsSubmitting(true);
      setAuthError(null);
      setResetMessage(null);
      try {
        await resetPassword(email);
        setResetMessage('Password reset email sent. Check your inbox and spam folder.');
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
    setResetMessage(null);
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

  const handleGoogle = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    setResetMessage(null);
    try {
      await loginWithGoogle();
    } catch {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#F4F5F0] dark:bg-[#0D0F0C] text-[#111315] dark:text-[#F4F5F0] flex flex-col justify-between px-5 sm:px-8 py-5 sm:py-7 anim-stash-fade-up"
      data-testid="auth-view"
    >
      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <StashLogo size="sm" />
          <span className="text-base font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
            Stash
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBackToHighlights && (
            <button
              type="button"
              onClick={onBackToHighlights}
              className="min-h-[44px] px-3.5 rounded-xl text-xs font-semibold text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-[#F4F5F0] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>App highlights</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Responsive Split Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex items-center py-6 sm:py-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Editorial Column (Desktop & Tablet Context) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <StashLogo size="lg" />
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0] text-balance leading-[1.15]">
                {mode === 'reset'
                  ? 'Reset your password'
                  : mode === 'signup'
                  ? 'Create your Stash account'
                  : 'Sign in to Stash'}
              </h1>
              <p className="text-sm sm:text-base text-[#5E655A] dark:text-[#A4AC9E] leading-relaxed max-w-md">
                Korean Won banking, instant Toss screenshot imports, and item-level spending clarity in one workspace.
              </p>
            </div>

            {/* Clean Hairline Feature Ledger (Hidden on compact phones to keep Sign-In front & center) */}
            <div className="hidden sm:block border-t border-black/[0.08] dark:border-white/[0.08] divide-y divide-black/[0.08] dark:divide-white/[0.08] max-w-md">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]">
                  Linked Korean Accounts
                </span>
                <span className="text-xs text-[#6B7268] dark:text-[#8E9689]">
                  Hana Bank · Toss Bank
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]">
                  Receipt & History Import
                </span>
                <span className="text-xs text-[#6B7268] dark:text-[#8E9689]">
                  Auto-categorized items
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]">
                  Multi-Currency View
                </span>
                <span className="text-xs font-mono tabular-nums text-[#6B7268] dark:text-[#8E9689]">
                  KRW · USD · EUR · PKR
                </span>
              </div>
            </div>

            {onReplaySplash && (
              <div className="hidden lg:block">
                <button
                  type="button"
                  onClick={onReplaySplash}
                  className="min-h-[44px] inline-flex items-center gap-2 text-xs font-medium text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-[#F4F5F0] transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay launch animation</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Auth Card Column */}
          <div className="lg:col-span-6 w-full max-w-[440px] lg:max-w-none mx-auto space-y-4">
            <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-6 sm:p-7 space-y-4">
              {mode !== 'reset' && (
                <>
                  {/* Google Sign In */}
                  <button
                    onClick={handleGoogle}
                    disabled={isSubmitting}
                    type="button"
                    className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] text-[#111315] dark:text-[#F4F5F0] font-semibold text-xs transition flex items-center justify-center gap-2.5 border border-black/[0.06] dark:border-white/[0.08] whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.08]" />
                    <span className="text-[11px] font-medium text-[#8E9689]">or email</span>
                    <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.08]" />
                  </div>
                </>
              )}

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 border border-rose-200/70 dark:border-rose-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {resetMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-[#C8EC45] text-xs flex items-center gap-2 border border-emerald-200/70 dark:border-emerald-900/40">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resetMessage}</span>
                </div>
              )}

              {/* Email/Password or Password Reset Form */}
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
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] placeholder:text-[#8E9689] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
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
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] placeholder:text-[#8E9689] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
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
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] placeholder:text-[#8E9689] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
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
                        setResetMessage(null);
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
                  className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap"
                >
                  <span>
                    {isSubmitting
                      ? 'Connecting...'
                      : mode === 'reset'
                      ? 'Send reset email'
                      : mode === 'signin'
                      ? 'Sign In'
                      : 'Create Account'}
                  </span>
                  {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </form>

              <div className="text-center pt-1">
                {mode === 'reset' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setAuthError(null);
                      setResetMessage(null);
                    }}
                    className="min-h-[44px] px-3 text-xs font-medium text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
                  >
                    Back to sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setAuthError(null);
                      setResetMessage(null);
                    }}
                    className="min-h-[44px] px-3 text-xs font-medium text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
                  >
                    {mode === 'signin'
                      ? "Don't have an account? Create one"
                      : 'Already have an account? Sign in'}
                  </button>
                )}
              </div>
            </div>

            {/* Demo Mode Entry */}
            <div className="space-y-3">
              <button
                onClick={continueAsGuest}
                type="button"
                className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-white dark:bg-[#161915] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-[#111315] dark:text-[#F4F5F0] font-semibold text-xs border border-black/[0.08] dark:border-white/[0.1] transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>Explore Demo Mode</span>
                <span className="text-[11px] font-normal text-[#6B7268] dark:text-[#8E9689]">
                  · Local workspace
                </span>
              </button>

              <p className="text-center text-[11px] text-[#8E9689]">
                {isOnline ? 'Cloud sync ready' : 'Offline local storage active'} · KRW / USD / EUR / PKR
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-[11px] text-[#8E9689] pt-2">
        <span>Stash Personal Finance</span>
        {onReplaySplash && (
          <button
            type="button"
            onClick={onReplaySplash}
            className="lg:hidden min-h-[44px] px-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-[#F4F5F0]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay intro</span>
          </button>
        )}
      </footer>
    </div>
  );
};
