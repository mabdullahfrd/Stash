/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  testConnection,
} from '../services/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isOnline: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = 'stash_guest_mode_active';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GUEST_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection test
    testConnection().catch(() => {});

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        try {
          localStorage.removeItem(GUEST_KEY);
        } catch {}
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleLoginGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      setIsGuest(false);
      try {
        localStorage.removeItem(GUEST_KEY);
      } catch {}
      setAuthModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setAuthError(msg);
      throw err;
    }
  };

  const handleSignUpEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      await registerWithEmail(email, pass, name);
      setIsGuest(false);
      try {
        localStorage.removeItem(GUEST_KEY);
      } catch {}
      setAuthModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register account';
      setAuthError(msg);
      throw err;
    }
  };

  const handleSignInEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await loginWithEmail(email, pass);
      setIsGuest(false);
      try {
        localStorage.removeItem(GUEST_KEY);
      } catch {}
      setAuthModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setAuthError(msg);
      throw err;
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    try {
      localStorage.setItem(GUEST_KEY, 'true');
    } catch {}
    setAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setIsGuest(false);
      try {
        localStorage.removeItem(GUEST_KEY);
      } catch {}
    }
  };

  const isAuthenticated = Boolean(user || isGuest);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOnline,
        isGuest,
        isAuthenticated,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => {
          setAuthModalOpen(false);
          setAuthError(null);
        },
        loginWithGoogle: handleLoginGoogle,
        signUpEmail: handleSignUpEmail,
        signInEmail: handleSignInEmail,
        continueAsGuest,
        signOut: handleSignOut,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
