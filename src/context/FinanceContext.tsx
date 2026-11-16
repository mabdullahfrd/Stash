/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Account,
  Category,
  CharityPledge,
  CurrencyCode,
  ExchangeRates,
  StudentNavTab,
  ThemeMode,
  Transaction,
  TransactionType,
} from '../types/finance';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_CHARITY_PLEDGES,
  INITIAL_TRANSACTIONS,
} from '../data/seedData';
import { DEFAULT_EXCHANGE_RATES, formatCurrency } from '../utils/currencies';
import {
  computeAccountBalances,
  computeCashFlow,
  computeCharityStats,
  computeNetWorth,
} from '../utils/calculations';
import { useAuth } from './AuthContext';
import {
  db,
  logFirestoreError,
  OperationType,
  upsertUserProfile,
} from '../services/firebase';
import { sanitizeForFirestore } from '../utils/firestoreSanitize';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_QUESTS,
  getLevelInfo,
  LevelInfo,
  Quest,
} from '../utils/gamification';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  charityPledges: CharityPledge[];
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
  theme: ThemeMode;
  activeTab: StudentNavTab;
  isOnline: boolean;
  syncError: string | null;

  // Gamification (Duolingo Style)
  xp: number;
  streak: number;
  gems: number;
  levelInfo: LevelInfo;
  quests: Quest[];
  xpFloatingNotice: { amount: number; reason: string } | null;
  mascotSpeech: string;
  addXp: (amount: number, reason?: string) => void;
  claimQuest: (questId: string) => void;
  setMascotSpeech: (text: string) => void;

  // Bank Account Filtering & Demonstration
  selectedBankFilter: string | null;
  setSelectedBankFilter: (accountId: string | null) => void;

  // Computed metrics
  accountBalances: Record<string, number>;
  netWorth: { netWorth: number; totalAssets: number; totalLiabilities: number };
  cashFlow: { totalIncome: number; totalExpenses: number; netFlow: number; savingsRatePercent: number };
  charityStats: {
    totalPledged: number;
    totalFulfilled: number;
    totalPending: number;
    fulfillmentPercent: number;
    pendingPledgesCount: number;
  };

  // Controls & Mutators
  setActiveCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemeMode) => void;
  setActiveTab: (tab: StudentNavTab) => void;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addBatchTransactions: (txList: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<number>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  editAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  addCharityPledge: (pledge: {
    title: string;
    cause: string;
    pledgedAmount: number;
    currency: CurrencyCode;
    dueDate?: string;
    notes?: string;
  }) => Promise<void>;
  fulfillCharityPledge: (pledgeId: string, amount: number, accountId: string, notes?: string) => Promise<void>;
  deleteCharityPledge: (id: string) => Promise<void>;

  resetToDefaultData: () => Promise<void>;
  exportDataJSON: () => void;
  exportTransactionsCSV: () => void;
  importDataJSON: (jsonString: string) => boolean;

  // Hold to Convert Currency state
  holdConvertAmount: { amount: number; sourceCurrency: CurrencyCode } | null;
  openHoldConvertModal: (amount: number, sourceCurrency: CurrencyCode) => void;
  closeHoldConvertModal: () => void;

  // Income 10% Charity Prompt state
  incomeCharityPrompt: { incomeAmount: number; currency: CurrencyCode; accountId: string; merchant?: string } | null;
  triggerIncomeCharityPrompt: (prompt: { incomeAmount: number; currency: CurrencyCode; accountId: string; merchant?: string }) => void;
  confirm10PercentCharity: () => Promise<void>;
  dismissIncomeCharity: () => void;

  // Modals state
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  initialTransactionType?: TransactionType;
  initialAccountId?: string;
  openTransactionModal: (tx?: Transaction | Partial<Transaction> | null) => void;
  closeTransactionModal: () => void;

  isAccountModalOpen: boolean;
  openAccountModal: () => void;
  closeAccountModal: () => void;

  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCOUNTS: 'stash_krw_accounts_v5',
  TRANSACTIONS: 'stash_krw_transactions_v5',
  CATEGORIES: 'stash_krw_categories_v5',
  CHARITY: 'stash_krw_charity_v5',
  CURRENCY: 'stash_krw_currency_v5',
  THEME: 'stash_krw_theme_v5',
  XP: 'stash_krw_xp_v5',
  GEMS: 'stash_krw_gems_v5',
  STREAK: 'stash_krw_streak_v5',
  QUESTS: 'stash_krw_quests_v5',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isOnline } = useAuth();
  const [syncError, setSyncError] = useState<string | null>(null);
  const prevUserUidRef = useRef<string | null>(null);

  // Accounts
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Charity Pledges
  const [charityPledges, setCharityPledges] = useState<CharityPledge[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHARITY);
      return saved ? JSON.parse(saved) : INITIAL_CHARITY_PLEDGES;
    } catch {
      return INITIAL_CHARITY_PLEDGES;
    }
  });

  // Primary Currency: Default is KRW
  const [activeCurrency, setActiveCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      return (saved as CurrencyCode) || 'KRW';
    } catch {
      return 'KRW';
    }
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return (saved as ThemeMode) || 'light';
    } catch {
      return 'light';
    }
  });

  const [activeTab, setActiveTab] = useState<StudentNavTab>('pockets');
  const [rates] = useState<ExchangeRates>(DEFAULT_EXCHANGE_RATES);

  // Hold Currency Converter Modal
  const [holdConvertAmount, setHoldConvertAmount] = useState<{ amount: number; sourceCurrency: CurrencyCode } | null>(null);

  // Income 10% Charity Prompt state
  const [incomeCharityPrompt, setIncomeCharityPrompt] = useState<{
    incomeAmount: number;
    currency: CurrencyCode;
    accountId: string;
    merchant?: string;
  } | null>(null);

  // Gamification State (Duolingo Style)
  const [xp, setXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.XP);
      return saved ? parseInt(saved, 10) : 740;
    } catch {
      return 740;
    }
  });

  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STREAK);
      return saved ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  const [gems, setGems] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GEMS);
      return saved ? parseInt(saved, 10) : 280;
    } catch {
      return 280;
    }
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTS);
      return saved ? JSON.parse(saved) : DEFAULT_QUESTS;
    } catch {
      return DEFAULT_QUESTS;
    }
  });

  const [xpFloatingNotice, setXpFloatingNotice] = useState<{ amount: number; reason: string } | null>(null);
  const [mascotSpeech, setMascotSpeech] = useState<string>('');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string | null>(null);

  const levelInfo = useMemo(() => getLevelInfo(xp), [xp]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.XP, xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STREAK, streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GEMS, gems.toString());
  }, [gems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
  }, [quests]);

  const addXp = (amount: number, _reason?: string) => {
    setXp((prev) => prev + amount);
  };

  const claimQuest = (questId: string) => {
    const q = quests.find((quest) => quest.id === questId);
    if (!q || q.claimed || !q.completed) return;
    setQuests((prev) =>
      prev.map((quest) => (quest.id === questId ? { ...quest, claimed: true } : quest))
    );
    setXp((prev) => prev + q.rewardXp);
    setGems((g) => g + q.rewardGems);
  };

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType | undefined>();
  const [initialAccountId, setInitialAccountId] = useState<string | undefined>();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Firestore Real-Time Listener for Authenticated User
  useEffect(() => {
    if (!user) {
      if (prevUserUidRef.current) {
        // User signed out: reset state back to local demo defaults
        prevUserUidRef.current = null;
        setSyncError(null);
        setAccounts(INITIAL_ACCOUNTS);
        setTransactions(INITIAL_TRANSACTIONS);
        setCharityPledges(INITIAL_CHARITY_PLEDGES);
        setSelectedBankFilter(null);
      }
      return;
    }

    prevUserUidRef.current = user.uid;
    setSyncError(null);

    // Ensure /users/{uid} profile document is up to date
    upsertUserProfile(user, activeCurrency);

    const accountsPath = `users/${user.uid}/accounts`;
    const txsPath = `users/${user.uid}/transactions`;
    const pledgesPath = `users/${user.uid}/charity_pledges`;

    // Listen to accounts
    const unsubAccounts = onSnapshot(
      collection(db, accountsPath),
      async (snapshot) => {
        setSyncError(null);
        if (snapshot.empty) {
          for (const acc of INITIAL_ACCOUNTS) {
            try {
              await setDoc(
                doc(db, 'users', user.uid, 'accounts', acc.id),
                sanitizeForFirestore({
                  ...acc,
                  userId: user.uid,
                })
              );
            } catch (e) {
              logFirestoreError(e, OperationType.WRITE, `${accountsPath}/${acc.id}`);
            }
          }
        } else {
          const cloudAccounts = snapshot.docs.map((d) => d.data() as Account);
          setAccounts(cloudAccounts);
        }
      },
      (error) => {
        const info = logFirestoreError(error, OperationType.LIST, accountsPath);
        setSyncError(`Cloud accounts sync warning: ${info.error}`);
      }
    );

    // Listen to transactions
    const unsubTxs = onSnapshot(
      collection(db, txsPath),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const tx of INITIAL_TRANSACTIONS) {
            try {
              await setDoc(
                doc(db, 'users', user.uid, 'transactions', tx.id),
                sanitizeForFirestore({
                  ...tx,
                  userId: user.uid,
                })
              );
            } catch (e) {
              logFirestoreError(e, OperationType.WRITE, `${txsPath}/${tx.id}`);
            }
          }
        } else {
          const cloudTxs = snapshot.docs.map((d) => d.data() as Transaction);
          cloudTxs.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
          setTransactions(cloudTxs);
        }
      },
      (error) => {
        const info = logFirestoreError(error, OperationType.LIST, txsPath);
        setSyncError(`Cloud transactions sync warning: ${info.error}`);
      }
    );

    // Listen to charity pledges
    const unsubPledges = onSnapshot(
      collection(db, pledgesPath),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const pledge of INITIAL_CHARITY_PLEDGES) {
            try {
              await setDoc(
                doc(db, 'users', user.uid, 'charity_pledges', pledge.id),
                sanitizeForFirestore({
                  ...pledge,
                  userId: user.uid,
                })
              );
            } catch (e) {
              logFirestoreError(e, OperationType.WRITE, `${pledgesPath}/${pledge.id}`);
            }
          }
        } else {
          const cloudPledges = snapshot.docs.map((d) => d.data() as CharityPledge);
          setCharityPledges(cloudPledges);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.LIST, pledgesPath);
      }
    );

    return () => {
      unsubAccounts();
      unsubTxs();
      unsubPledges();
    };
  }, [user]);

  // Theme synchronization with documentElement
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Local storage persistence (always keeps offline copy)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHARITY, JSON.stringify(charityPledges));
  }, [charityPledges]);

  const setActiveCurrency = (curr: CurrencyCode) => {
    setActiveCurrencyState(curr);
    localStorage.setItem(STORAGE_KEYS.CURRENCY, curr);
  };

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEYS.THEME, t);
  };

  // Calculations
  const accountBalances = useMemo(() => {
    return computeAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  const netWorth = useMemo(() => {
    return computeNetWorth(accounts, accountBalances, activeCurrency, rates);
  }, [accounts, accountBalances, activeCurrency, rates]);

  const cashFlow = useMemo(() => {
    return computeCashFlow(transactions, activeCurrency, rates);
  }, [transactions, activeCurrency, rates]);

  const charityStats = useMemo(() => {
    return computeCharityStats(charityPledges, activeCurrency, rates);
  }, [charityPledges, activeCurrency, rates]);

  // Hold convert modal controls
  const openHoldConvertModal = (amount: number, sourceCurrency: CurrencyCode) => {
    setHoldConvertAmount({ amount, sourceCurrency });
  };
  const closeHoldConvertModal = () => {
    setHoldConvertAmount(null);
  };

  // Income 10% Charity Prompt handlers
  const triggerIncomeCharityPrompt = (prompt: {
    incomeAmount: number;
    currency: CurrencyCode;
    accountId: string;
    merchant?: string;
  }) => {
    setIncomeCharityPrompt(prompt);
  };

  const confirm10PercentCharity = async () => {
    if (!incomeCharityPrompt) return;
    const { incomeAmount, currency, accountId, merchant } = incomeCharityPrompt;
    const charityAmount = Math.round(incomeAmount * 0.1);
    const charityCat = categories.find((c) => c.isCharity || c.id === 'cat-charity') || categories[0];
    const today = new Date().toISOString().split('T')[0];

    await addTransaction({
      type: 'expense',
      amount: charityAmount,
      currency,
      date: today,
      categoryId: charityCat.id,
      accountId,
      merchant: 'Charity Giving (10% of Income)',
      notes: `10% charity tithe from income of ${formatCurrency(incomeAmount, currency)}${merchant ? ` (${merchant})` : ''}`,
      isCharity: true,
    });

    addXp(100, 'Generosity Tithe 10%! +100 XP');
    setGems((g) => g + 30);
    setQuests((prev) =>
      prev.map((q) => (q.id === 'quest-charity-tithe' ? { ...q, progress: 1, completed: true, claimed: true } : q))
    );

    setIncomeCharityPrompt(null);
  };

  const dismissIncomeCharity = () => {
    setIncomeCharityPrompt(null);
  };

  // Mutations
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTx: Transaction = sanitizeForFirestore({
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    });

    setTransactions((prev) => [newTx, ...prev]);

    addXp(20, txData.type === 'income' ? 'Income Logged! +20 XP' : 'Expense Logged! +20 XP');
    setQuests((prev) =>
      prev.map((q) => (q.id === 'quest-daily-expense' ? { ...q, progress: 1, completed: true } : q))
    );

    if (txData.type === 'income' && txData.amount > 0) {
      setIncomeCharityPrompt({
        incomeAmount: txData.amount,
        currency: txData.currency,
        accountId: txData.accountId,
        merchant: txData.merchant,
      });
    }

    if (user) {
      const path = `users/${user.uid}/transactions/${newTx.id}`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'transactions', newTx.id),
          sanitizeForFirestore({
            ...newTx,
            userId: user.uid,
          })
        );
      } catch (error) {
        const info = logFirestoreError(error, OperationType.WRITE, path);
        setSyncError(`Failed to sync transaction: ${info.error}`);
      }
    }
  };

  const addBatchTransactions = async (
    txList: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<number> => {
    if (!txList.length) return 0;
    const now = new Date().toISOString();
    const baseTime = Date.now();

    const newTxs: Transaction[] = txList.map((txData, idx) =>
      sanitizeForFirestore({
        ...txData,
        id: `tx-${baseTime}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      })
    );

    setTransactions((prev) => {
      const merged = [...newTxs, ...prev];
      merged.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
      return merged;
    });

    addXp(newTxs.length * 15, `Imported ${newTxs.length} entries`);
    setQuests((prev) =>
      prev.map((q) => (q.id === 'quest-daily-expense' ? { ...q, progress: 1, completed: true } : q))
    );

    // If the batch includes income inflows, offer a single 10% charity prompt for the largest/sum income
    const totalIncomeInBatch = newTxs
      .filter((t) => t.type === 'income' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    if (totalIncomeInBatch > 0) {
      const firstIncome = newTxs.find((t) => t.type === 'income' && t.amount > 0)!;
      setIncomeCharityPrompt({
        incomeAmount: totalIncomeInBatch,
        currency: firstIncome.currency,
        accountId: firstIncome.accountId,
        merchant: 'Imported Bank Inflows',
      });
    }

    if (user) {
      const path = `users/${user.uid}/transactions`;
      try {
        const batch = writeBatch(db);
        for (const tx of newTxs) {
          batch.set(
            doc(db, 'users', user.uid, 'transactions', tx.id),
            sanitizeForFirestore({
              ...tx,
              userId: user.uid,
            })
          );
        }
        await batch.commit();
      } catch (error) {
        const info = logFirestoreError(error, OperationType.WRITE, path);
        setSyncError(`Failed to sync batch import: ${info.error}`);
      }
    }

    return newTxs.length;
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    const now = new Date().toISOString();
    const existingTx = transactions.find((t) => t.id === id);
    const updatedPayload = existingTx
      ? sanitizeForFirestore({ ...existingTx, ...updates, updatedAt: now })
      : null;

    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? sanitizeForFirestore({ ...tx, ...updates, updatedAt: now }) : tx))
    );

    if (user && updatedPayload) {
      const path = `users/${user.uid}/transactions/${id}`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'transactions', id),
          sanitizeForFirestore({
            ...updatedPayload,
            userId: user.uid,
          })
        );
      } catch (error) {
        const info = logFirestoreError(error, OperationType.WRITE, path);
        setSyncError(`Failed to update transaction: ${info.error}`);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    if (user) {
      const path = `users/${user.uid}/transactions/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      } catch (error) {
        const info = logFirestoreError(error, OperationType.DELETE, path);
        setSyncError(`Failed to delete transaction: ${info.error}`);
      }
    }
  };

  const addAccount = async (accountData: Omit<Account, 'id'>) => {
    const newAccount: Account = sanitizeForFirestore({
      ...accountData,
      id: `acc-${Date.now()}`,
    });
    setAccounts((prev) => [...prev, newAccount]);

    addXp(30, 'Bank Account Linked! +30 XP');
    setGems((g) => g + 10);
    setQuests((prev) =>
      prev.map((q) => (q.id === 'quest-bank-demonstrate' ? { ...q, progress: 1, completed: true } : q))
    );

    if (user) {
      const path = `users/${user.uid}/accounts/${newAccount.id}`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'accounts', newAccount.id),
          sanitizeForFirestore({
            ...newAccount,
            userId: user.uid,
          })
        );
      } catch (error) {
        const info = logFirestoreError(error, OperationType.WRITE, path);
        setSyncError(`Failed to sync account: ${info.error}`);
      }
    }
  };

  const editAccount = async (id: string, updates: Partial<Account>) => {
    const existingAcc = accounts.find((a) => a.id === id);
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? sanitizeForFirestore({ ...acc, ...updates }) : acc))
    );

    if (user && existingAcc) {
      const path = `users/${user.uid}/accounts/${id}`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'accounts', id),
          sanitizeForFirestore({
            ...existingAcc,
            ...updates,
            userId: user.uid,
          })
        );
      } catch (error) {
        const info = logFirestoreError(error, OperationType.WRITE, path);
        setSyncError(`Failed to update account: ${info.error}`);
      }
    }
  };

  const deleteAccount = async (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    setSelectedBankFilter((prev) => (prev === id ? null : prev));

    if (user) {
      const path = `users/${user.uid}/accounts/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'accounts', id));
      } catch (error) {
        const info = logFirestoreError(error, OperationType.DELETE, path);
        setSyncError(`Failed to delete account: ${info.error}`);
      }
    }
  };

  const addCharityPledge = async (pledgeData: {
    title: string;
    cause: string;
    pledgedAmount: number;
    currency: CurrencyCode;
    dueDate?: string;
    notes?: string;
  }) => {
    const now = new Date().toISOString().split('T')[0];
    const newPledge: CharityPledge = sanitizeForFirestore({
      ...pledgeData,
      id: `pledge-${Date.now()}`,
      fulfilledAmount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    setCharityPledges((prev) => [newPledge, ...prev]);

    if (user) {
      const path = `users/${user.uid}/charity_pledges/${newPledge.id}`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'charity_pledges', newPledge.id),
          sanitizeForFirestore({
            ...newPledge,
            userId: user.uid,
          })
        );
      } catch (error) {
        const info = logFirestoreError(error, OperationType.WRITE, path);
        setSyncError(`Failed to sync charity pledge: ${info.error}`);
      }
    }
  };

  const fulfillCharityPledge = async (pledgeId: string, amount: number, accountId: string, notes?: string) => {
    const pledge = charityPledges.find((p) => p.id === pledgeId);
    if (!pledge) return;

    const sourceAccount = accounts.find((a) => a.id === accountId);
    const charityCat = categories.find((c) => c.isCharity) || categories[0];

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const newTx: Transaction = sanitizeForFirestore({
      id: `tx-charity-${Date.now()}`,
      type: 'expense',
      amount,
      currency: sourceAccount ? sourceAccount.currency : pledge.currency,
      date: today,
      categoryId: charityCat.id,
      accountId,
      merchant: `Charity: ${pledge.title}`,
      notes: notes || `Fulfillment distribution for "${pledge.title}"`,
      isCharity: true,
      charityPledgeId: pledge.id,
      createdAt: now,
      updatedAt: now,
    });

    setTransactions((prev) => [newTx, ...prev]);

    const newFulfilled = pledge.fulfilledAmount + amount;
    const newStatus = newFulfilled >= pledge.pledgedAmount ? 'fulfilled' : 'partially_fulfilled';
    const updatedPledge: CharityPledge = sanitizeForFirestore({
      ...pledge,
      fulfilledAmount: newFulfilled,
      status: newStatus,
      updatedAt: now,
    });

    setCharityPledges((prev) =>
      prev.map((p) => (p.id === pledgeId ? updatedPledge : p))
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'transactions', newTx.id),
          sanitizeForFirestore({
            ...newTx,
            userId: user.uid,
          })
        );
        await setDoc(
          doc(db, 'users', user.uid, 'charity_pledges', pledgeId),
          sanitizeForFirestore({
            ...updatedPledge,
            userId: user.uid,
          })
        );
      } catch (error) {
        const info = logFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        setSyncError(`Failed to sync charity fulfillment: ${info.error}`);
      }
    }
  };

  const deleteCharityPledge = async (id: string) => {
    setCharityPledges((prev) => prev.filter((p) => p.id !== id));

    if (user) {
      const path = `users/${user.uid}/charity_pledges/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'charity_pledges', id));
      } catch (error) {
        const info = logFirestoreError(error, OperationType.DELETE, path);
        setSyncError(`Failed to delete charity pledge: ${info.error}`);
      }
    }
  };

  const resetToDefaultData = async () => {
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(INITIAL_CATEGORIES);
    setCharityPledges(INITIAL_CHARITY_PLEDGES);
    setActiveCurrencyState('KRW');
    setSelectedBankFilter(null);

    if (user) {
      try {
        for (const acc of INITIAL_ACCOUNTS) {
          await setDoc(
            doc(db, 'users', user.uid, 'accounts', acc.id),
            sanitizeForFirestore({ ...acc, userId: user.uid })
          );
        }
        for (const tx of INITIAL_TRANSACTIONS) {
          await setDoc(
            doc(db, 'users', user.uid, 'transactions', tx.id),
            sanitizeForFirestore({ ...tx, userId: user.uid })
          );
        }
        for (const p of INITIAL_CHARITY_PLEDGES) {
          await setDoc(
            doc(db, 'users', user.uid, 'charity_pledges', p.id),
            sanitizeForFirestore({ ...p, userId: user.uid })
          );
        }
      } catch (e) {
        logFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const exportDataJSON = () => {
    const data = {
      accounts,
      transactions,
      categories,
      charityPledges,
      exportDate: new Date().toISOString(),
      primaryCurrency: activeCurrency,
      version: '3.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Stash_Finance_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTransactionsCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Merchant', 'Notes', 'IsCharity'];
    const rows = transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name || '';
      const acc = accounts.find((a) => a.id === t.accountId)?.name || '';
      return [
        t.id,
        t.date,
        t.type,
        t.amount,
        t.currency,
        `"${cat}"`,
        `"${acc}"`,
        `"${t.merchant || ''}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        t.isCharity ? 'Yes' : 'No',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Stash_Spending_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.accounts && parsed.transactions && parsed.charityPledges) {
        setAccounts(parsed.accounts);
        setTransactions(parsed.transactions);
        if (parsed.categories) setCategories(parsed.categories);
        setCharityPledges(parsed.charityPledges);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const openTransactionModal = (tx?: Transaction | Partial<Transaction> | null) => {
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
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
    setInitialTransactionType(undefined);
    setInitialAccountId(undefined);
  };

  const openAccountModal = () => setIsAccountModalOpen(true);
  const closeAccountModal = () => setIsAccountModalOpen(false);

  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        charityPledges,
        activeCurrency,
        rates,
        theme,
        activeTab,
        isOnline,
        syncError,
        accountBalances,
        netWorth,
        cashFlow,
        charityStats,
        setActiveCurrency,
        setTheme,
        setActiveTab,
        addTransaction,
        addBatchTransactions,
        editTransaction,
        deleteTransaction,
        addAccount,
        editAccount,
        deleteAccount,
        addCharityPledge,
        fulfillCharityPledge,
        deleteCharityPledge,
        resetToDefaultData,
        exportDataJSON,
        exportTransactionsCSV,
        importDataJSON,
        holdConvertAmount,
        openHoldConvertModal,
        closeHoldConvertModal,
        incomeCharityPrompt,
        triggerIncomeCharityPrompt,
        confirm10PercentCharity,
        dismissIncomeCharity,
        xp,
        streak,
        gems,
        levelInfo,
        quests,
        xpFloatingNotice,
        mascotSpeech,
        addXp,
        claimQuest,
        setMascotSpeech,
        selectedBankFilter,
        setSelectedBankFilter,
        isTransactionModalOpen,
        editingTransaction,
        initialTransactionType,
        initialAccountId,
        openTransactionModal,
        closeTransactionModal,
        isAccountModalOpen,
        openAccountModal,
        closeAccountModal,
        isSettingsModalOpen,
        openSettingsModal,
        closeSettingsModal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
