/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Wallet,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Cloud,
  Sparkles,
  Receipt,
  Coins,
} from 'lucide-react';

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
    <div className="flex-1 flex flex-col justify-between p-6 max-w-sm mx-auto w-full text-slate-900 dark:text-white min-h-[780px]">
      {/* Top Branding Section */}
      <div className="pt-6 space-y-4 text-center">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-blue-500/20 dark:bg-blue-500/30 blur-xl transform scale-125" />
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Wallet className="w-8 h-8 stroke-[2.2]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stash
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal Finance & Smart Receipt Tracker
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <Coins className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <span className="text-[10px] font-semibold block text-slate-700 dark:text-slate-300">
              Korean Won ₩
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <Receipt className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <span className="text-[10px] font-semibold block text-slate-700 dark:text-slate-300">
              Receipt Scan
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <Cloud className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <span className="text-[10px] font-semibold block text-slate-700 dark:text-slate-300">
              Live Cloud Sync
            </span>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="my-auto py-4 space-y-4">
        {/* Google Sign In */}
        <button
          onClick={handleGoogle}
          disabled={isSubmitting}
          type="button"
          className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-semibold text-xs transition flex items-center justify-center gap-3 border border-slate-200 dark:border-white/10 shadow-sm active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            or email
          </span>
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Error notification */}
        {authError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/40">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {mode === 'signup' && (
            <div>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Your Name (e.g. Abdullah)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Connecting...</span>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In with Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Create New Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle signin / signup */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setAuthError(null);
            }}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>

      {/* Demo / Guest Mode & Cloud Status Footer */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 text-center space-y-3">
        <button
          onClick={continueAsGuest}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs transition active:scale-[0.98]"
        >
          Explore Demo Mode (No sign in needed)
        </button>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{isOnline ? 'Cloud Database Connected (Firestore)' : 'Offline Local Mode'}</span>
        </div>
      </div>
    </div>
  );
};
