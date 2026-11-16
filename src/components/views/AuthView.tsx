/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { StashLogo } from '../common/StashLogo';

export const AuthView: React.FC = () => {
  const {
    loginWithGoogle,
    signUpEmail,
    signInEmail,
    continueAsGuest,
    authError,
    setAuthError,
    isOnline,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setAuthError(null);
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
    try {
      await loginWithGoogle();
    } catch {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 min-h-[85vh]">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Brand Header */}
        <div className="space-y-3">
          <StashLogo size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
              Sign in to Stash
            </h1>
            <p className="text-xs text-[#6B7268] dark:text-[#8E9689] mt-1">
              Korean Won banking, receipt itemization & cash flow clarity.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-6 space-y-4">
          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={isSubmitting}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-[#F4F5F0] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] text-[#111315] dark:text-[#F4F5F0] font-semibold text-xs transition flex items-center justify-center gap-2.5 border border-black/[0.06] dark:border-white/[0.08]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8E9689]">
              or email
            </span>
            <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.08]" />
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 border border-rose-200/70 dark:border-rose-900/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="w-4 h-4 text-[#8E9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] placeholder:text-[#8E9689] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-[#8E9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] placeholder:text-[#8E9689] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] placeholder:text-[#8E9689] focus:outline-none focus:border-[#141617] dark:focus:border-[#C8EC45]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>
                {isSubmitting
                  ? 'Connecting...'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </span>
              {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setAuthError(null);
              }}
              className="text-xs font-medium text-[#5E655A] dark:text-[#A4AC9E] hover:text-[#111315] dark:hover:text-white transition"
            >
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Demo Mode Entry */}
        <div className="space-y-3">
          <button
            onClick={continueAsGuest}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-white dark:bg-[#161915] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-[#111315] dark:text-[#F4F5F0] font-semibold text-xs border border-black/[0.08] dark:border-white/[0.1] transition flex items-center justify-center gap-2"
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
  );
};
