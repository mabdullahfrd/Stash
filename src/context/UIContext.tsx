/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Account,
  CurrencyCode,
  StudentNavTab,
  ThemeMode,
  Transaction,
  TransactionType,
} from '../types/finance';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { getSystemPrefersDark, resolveInitialTheme } from '../utils/theme';

export interface IncomeCharityPromptData {
  incomeAmount: number;
  currency: CurrencyCode;
  accountId: string;
  merchant?: string;
}

export interface UIContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeTab: StudentNavTab;
  setActiveTab: (tab: StudentNavTab) => void;
  selectedBankFilter: string | null;
  setSelectedBankFilter: React.Dispatch<React.SetStateAction<string | null>>;

  holdConvertAmount: { amount: number; sourceCurrency: CurrencyCode } | null;
  openHoldConvertModal: (amount: number, sourceCurrency: CurrencyCode) => void;
  closeHoldConvertModal: () => void;

  incomeCharityPrompt: IncomeCharityPromptData | null;
  triggerIncomeCharityPrompt: (prompt: IncomeCharityPromptData) => void;
  dismissIncomeCharity: () => void;

  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  initialTransactionType?: TransactionType;
  initialAccountId?: string;
  openTransactionModal: (tx?: Transaction | Partial<Transaction> | null) => void;
  closeTransactionModal: () => void;

  isAccountModalOpen: boolean;
  editingAccount: Account | null;
  initialBankPresetId: string | null;
  openAccountModal: (presetBankId?: string) => void;
  openEditAccountModal: (account: Account) => void;
  closeAccountModal: () => void;

  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  /** Short-lived "Saved · Undo" toast shown after creating an entry. */
  undoToast: UndoToastData | null;
  showUndoToast: (message: string, onUndo: () => void | Promise<void>) => void;
  dismissUndoToast: () => void;
}

export interface UndoToastData {
  key: number;
  message: string;
  onUndo: () => void | Promise<void>;
}

export const UNDO_TOAST_MS = 6000;

const THEME_STORAGE_KEY = 'stash_krw_theme_v5';

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    resolveInitialTheme(getStorageItem(THEME_STORAGE_KEY), getSystemPrefersDark())
  );
  const [activeTab, setActiveTab] = useState<StudentNavTab>('pockets');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string | null>(null);

  const [holdConvertAmount, setHoldConvertAmount] = useState<{
    amount: number;
    sourceCurrency: CurrencyCode;
  } | null>(null);
  const [incomeCharityPrompt, setIncomeCharityPrompt] =
    useState<IncomeCharityPromptData | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialTransactionType, setInitialTransactionType] = useState<
    TransactionType | undefined
  >();
  const [initialAccountId, setInitialAccountId] = useState<string | undefined>();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [initialBankPresetId, setInitialBankPresetId] = useState<string | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [undoToast, setUndoToast] = useState<UndoToastData | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissUndoToast = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setUndoToast(null);
  }, []);

  const showUndoToast = useCallback(
    (message: string, onUndo: () => void | Promise<void>) => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoToast({ key: Date.now(), message, onUndo });
      undoTimerRef.current = setTimeout(() => {
        undoTimerRef.current = null;
        setUndoToast(null);
      }, UNDO_TOAST_MS);
    },
    []
  );

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    setStorageItem(THEME_STORAGE_KEY, t);
  }, []);

  const openHoldConvertModal = useCallback(
    (amount: number, sourceCurrency: CurrencyCode) => {
      setHoldConvertAmount({ amount, sourceCurrency });
    },
    []
  );

  const closeHoldConvertModal = useCallback(() => {
    setHoldConvertAmount(null);
  }, []);

  const triggerIncomeCharityPrompt = useCallback((prompt: IncomeCharityPromptData) => {
    setIncomeCharityPrompt(prompt);
  }, []);

  const dismissIncomeCharity = useCallback(() => {
    setIncomeCharityPrompt(null);
  }, []);

  const openTransactionModal = useCallback(
    (tx?: Transaction | Partial<Transaction> | null) => {
      if (tx && 'id' in tx && tx.id) {
        setEditingTransaction(tx as Transaction);
        setInitialTransactionType(tx.type);
        setInitialAccountId(tx.accountId);
      } else {
        setEditingTransaction(null);
        setInitialTransactionType(tx?.type || 'expense');
        setInitialAccountId(tx?.accountId);
      }
      setIsTransactionModalOpen(true);
    },
    []
  );

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
    setInitialTransactionType(undefined);
    setInitialAccountId(undefined);
  }, []);

  const openAccountModal = useCallback((presetBankId?: string) => {
    setEditingAccount(null);
    setInitialBankPresetId(presetBankId || null);
    setIsAccountModalOpen(true);
  }, []);

  const openEditAccountModal = useCallback((account: Account) => {
    setEditingAccount(account);
    setInitialBankPresetId(account.bankCode || null);
    setIsAccountModalOpen(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setIsAccountModalOpen(false);
    setEditingAccount(null);
    setInitialBankPresetId(null);
  }, []);

  const openSettingsModal = useCallback(() => setIsSettingsModalOpen(true), []);
  const closeSettingsModal = useCallback(() => setIsSettingsModalOpen(false), []);

  const value = useMemo<UIContextType>(
    () => ({
      theme,
      setTheme,
      activeTab,
      setActiveTab,
      selectedBankFilter,
      setSelectedBankFilter,
      holdConvertAmount,
      openHoldConvertModal,
      closeHoldConvertModal,
      incomeCharityPrompt,
      triggerIncomeCharityPrompt,
      dismissIncomeCharity,
      isTransactionModalOpen,
      editingTransaction,
      initialTransactionType,
      initialAccountId,
      openTransactionModal,
      closeTransactionModal,
      isAccountModalOpen,
      editingAccount,
      initialBankPresetId,
      openAccountModal,
      openEditAccountModal,
      closeAccountModal,
      isSettingsModalOpen,
      openSettingsModal,
      closeSettingsModal,
      undoToast,
      showUndoToast,
      dismissUndoToast,
    }),
    [
      theme,
      setTheme,
      activeTab,
      selectedBankFilter,
      holdConvertAmount,
      openHoldConvertModal,
      closeHoldConvertModal,
      incomeCharityPrompt,
      triggerIncomeCharityPrompt,
      dismissIncomeCharity,
      isTransactionModalOpen,
      editingTransaction,
      initialTransactionType,
      initialAccountId,
      openTransactionModal,
      closeTransactionModal,
      isAccountModalOpen,
      editingAccount,
      initialBankPresetId,
      openAccountModal,
      openEditAccountModal,
      closeAccountModal,
      isSettingsModalOpen,
      openSettingsModal,
      closeSettingsModal,
      undoToast,
      showUndoToast,
      dismissUndoToast,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export function useFinanceUI(): UIContextType {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('useFinanceUI must be used within UIProvider');
  }
  return ctx;
}
