/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Category, CategoryBudget, CurrencyCode } from '../types/finance';
import { useAuth } from './AuthContext';
import { commitFirestoreOpsInChunks, db, logFirestoreError, OperationType } from '../services/firebase';
import { sanitizeForFirestore } from '../utils/firestoreSanitize';
import { getStorageJSON, removeStorageItem, setStorageJSON } from '../utils/storage';
import { sanitizeBudgets, sanitizeCustomCategories } from '../utils/customization';

/** Device-only copies used in Demo Mode (and offered for import after signing up). */
export const CUSTOMIZATION_STORAGE_KEYS = {
  CATEGORIES: 'stash_krw_custom_categories_v1',
  BUDGETS: 'stash_krw_budgets_v1',
};

export interface CustomizationContextType {
  customCategories: Category[];
  budgets: CategoryBudget[];
  customizationError: string | null;
  saveCustomCategory: (category: Category) => Promise<void>;
  deleteCustomCategory: (id: string) => Promise<void>;
  setBudget: (categoryId: string, amount: number, currency: CurrencyCode) => Promise<void>;
  removeBudget: (categoryId: string) => Promise<void>;
  /** Writes many categories / budgets at once (backup restore, guest import). */
  importCustomizations: (categories: Category[], budgets: CategoryBudget[]) => Promise<void>;
  /** Reads the Demo Mode copies stored on this device. */
  readGuestCustomizations: () => { categories: Category[]; budgets: CategoryBudget[] };
  clearGuestCustomizations: () => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

/**
 * Custom categories and monthly budgets.
 * Signed in: live-synced from users/{uid}/categories and users/{uid}/budgets.
 * Demo Mode: kept in localStorage on this device.
 */
export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [customizationError, setCustomizationError] = useState<string | null>(null);

  const readGuestCustomizations = useCallback(
    () => ({
      categories: sanitizeCustomCategories(getStorageJSON<unknown>(CUSTOMIZATION_STORAGE_KEYS.CATEGORIES, [])),
      budgets: sanitizeBudgets(getStorageJSON<unknown>(CUSTOMIZATION_STORAGE_KEYS.BUDGETS, [])),
    }),
    []
  );

  const clearGuestCustomizations = useCallback(() => {
    removeStorageItem(CUSTOMIZATION_STORAGE_KEYS.CATEGORIES);
    removeStorageItem(CUSTOMIZATION_STORAGE_KEYS.BUDGETS);
  }, []);

  // Load: cloud listeners when signed in, device storage in Demo Mode, nothing otherwise.
  useEffect(() => {
    setCustomizationError(null);
    if (!user) {
      if (isGuest) {
        const local = readGuestCustomizations();
        setCustomCategories(local.categories);
        setBudgets(local.budgets);
      } else {
        setCustomCategories([]);
        setBudgets([]);
      }
      return;
    }

    setCustomCategories([]);
    setBudgets([]);
    const catPath = `users/${user.uid}/categories`;
    const budgetPath = `users/${user.uid}/budgets`;
    const unsubCats = onSnapshot(
      collection(db, catPath),
      (snap) => setCustomCategories(sanitizeCustomCategories(snap.docs.map((d) => d.data()))),
      (err) => setCustomizationError(`Categories sync warning: ${logFirestoreError(err, OperationType.LIST, catPath).error}`)
    );
    const unsubBudgets = onSnapshot(
      collection(db, budgetPath),
      (snap) => setBudgets(sanitizeBudgets(snap.docs.map((d) => d.data()))),
      (err) => setCustomizationError(`Budgets sync warning: ${logFirestoreError(err, OperationType.LIST, budgetPath).error}`)
    );
    return () => {
      unsubCats();
      unsubBudgets();
    };
  }, [user?.uid, isGuest, readGuestCustomizations]);

  // Persist Demo Mode copies on this device.
  useEffect(() => {
    if (!user && isGuest) setStorageJSON(CUSTOMIZATION_STORAGE_KEYS.CATEGORIES, customCategories);
  }, [customCategories, user, isGuest]);
  useEffect(() => {
    if (!user && isGuest) setStorageJSON(CUSTOMIZATION_STORAGE_KEYS.BUDGETS, budgets);
  }, [budgets, user, isGuest]);

  const saveCustomCategory = useCallback(
    async (category: Category) => {
      const clean: Category = { ...category, name: category.name.trim(), isCustom: true };
      setCustomCategories((prev) => {
        const exists = prev.some((c) => c.id === clean.id);
        return exists ? prev.map((c) => (c.id === clean.id ? clean : c)) : [...prev, clean];
      });
      if (!user) return;
      const path = `users/${user.uid}/categories/${clean.id}`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'categories', clean.id),
          sanitizeForFirestore({ ...clean, userId: user.uid, updatedAt: new Date().toISOString() })
        );
      } catch (err) {
        setCustomizationError(`Failed to save category: ${logFirestoreError(err, OperationType.WRITE, path).error}`);
      }
    },
    [user]
  );

  const deleteCustomCategory = useCallback(
    async (id: string) => {
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
      if (!user) return;
      try {
        await Promise.all([
          deleteDoc(doc(db, 'users', user.uid, 'categories', id)),
          deleteDoc(doc(db, 'users', user.uid, 'budgets', id)),
        ]);
      } catch (err) {
        setCustomizationError(
          `Failed to delete category: ${logFirestoreError(err, OperationType.DELETE, `users/${user.uid}/categories/${id}`).error}`
        );
      }
    },
    [user]
  );

  const setBudget = useCallback(
    async (categoryId: string, amount: number, currency: CurrencyCode) => {
      const budget: CategoryBudget = {
        id: categoryId,
        categoryId,
        amount,
        currency,
        updatedAt: new Date().toISOString(),
      };
      setBudgets((prev) => [...prev.filter((b) => b.categoryId !== categoryId), budget]);
      if (!user) return;
      const path = `users/${user.uid}/budgets/${categoryId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'budgets', categoryId), { ...budget, userId: user.uid });
      } catch (err) {
        setCustomizationError(`Failed to save budget: ${logFirestoreError(err, OperationType.WRITE, path).error}`);
      }
    },
    [user]
  );

  const removeBudget = useCallback(
    async (categoryId: string) => {
      setBudgets((prev) => prev.filter((b) => b.categoryId !== categoryId));
      if (!user) return;
      const path = `users/${user.uid}/budgets/${categoryId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'budgets', categoryId));
      } catch (err) {
        setCustomizationError(`Failed to remove budget: ${logFirestoreError(err, OperationType.DELETE, path).error}`);
      }
    },
    [user]
  );

  const importCustomizations = useCallback(
    async (rawCategories: Category[], rawBudgets: CategoryBudget[]) => {
      const cats = sanitizeCustomCategories(rawCategories);
      const buds = sanitizeBudgets(rawBudgets);
      if (cats.length === 0 && buds.length === 0) return;

      setCustomCategories((prev) => {
        const ids = new Set(cats.map((c) => c.id));
        return [...prev.filter((c) => !ids.has(c.id)), ...cats];
      });
      setBudgets((prev) => {
        const ids = new Set(buds.map((b) => b.categoryId));
        return [...prev.filter((b) => !ids.has(b.categoryId)), ...buds];
      });
      if (!user) return;

      const now = new Date().toISOString();
      type Op =
        | { kind: 'category'; data: Category }
        | { kind: 'budget'; data: CategoryBudget };
      const ops: Op[] = [
        ...cats.map((data) => ({ kind: 'category' as const, data })),
        ...buds.map((data) => ({ kind: 'budget' as const, data })),
      ];
      try {
        await commitFirestoreOpsInChunks(ops, (batch, op) => {
          if (op.kind === 'category') {
            batch.set(
              doc(db, 'users', user.uid, 'categories', op.data.id),
              sanitizeForFirestore({ ...op.data, userId: user.uid, updatedAt: now })
            );
          } else {
            batch.set(doc(db, 'users', user.uid, 'budgets', op.data.categoryId), {
              ...op.data,
              id: op.data.categoryId,
              userId: user.uid,
              updatedAt: op.data.updatedAt || now,
            });
          }
        });
      } catch (err) {
        setCustomizationError(
          `Failed to sync categories and budgets: ${logFirestoreError(err, OperationType.WRITE, `users/${user.uid}`).error}`
        );
      }
    },
    [user]
  );

  const value = useMemo<CustomizationContextType>(
    () => ({
      customCategories,
      budgets,
      customizationError,
      saveCustomCategory,
      deleteCustomCategory,
      setBudget,
      removeBudget,
      importCustomizations,
      readGuestCustomizations,
      clearGuestCustomizations,
    }),
    [
      customCategories,
      budgets,
      customizationError,
      saveCustomCategory,
      deleteCustomCategory,
      setBudget,
      removeBudget,
      importCustomizations,
      readGuestCustomizations,
      clearGuestCustomizations,
    ]
  );

  return <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>;
};

export function useCustomization(): CustomizationContextType {
  const ctx = useContext(CustomizationContext);
  if (!ctx) throw new Error('useCustomization must be used within CustomizationProvider');
  return ctx;
}
