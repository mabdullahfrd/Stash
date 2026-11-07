/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
import { DEFAULT_EXCHANGE_RATES } from '../utils/currencies';
import {
  computeAccountBalances,
  computeCashFlow,
  computeCharityStats,
  computeNetWorth,
} from '../utils/calculations';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

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

  // Modals state
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  initialTransactionType?: TransactionType;
  openTransactionModal: (tx?: Transaction | Partial<Transaction> | null) => void;
  closeTransactionModal: () => void;

  isCharityModalOpen: boolean;
  openCharityModal: () => void;
  closeCharityModal: () => void;

  fulfillingPledge: CharityPledge | null;
  openFulfillModal: (pledge: CharityPledge) => void;
  closeFulfillModal: () => void;

  isAccountModalOpen: boolean;
  openAccountModal: () => void;
  closeAccountModal: () => void;

  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCOUNTS: 'aura_krw_accounts_v3',
  TRANSACTIONS: 'aura_krw_transactions_v3',
  CATEGORIES: 'aura_krw_categories_v3',
  CHARITY: 'aura_krw_charity_v3',
  CURRENCY: 'aura_krw_currency_v3',
  THEME: 'aura_krw_theme_v3',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isOnline } = useAuth();

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

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType | undefined>();
  const [isCharityModalOpen, setIsCharityModalOpen] = useState(false);
  const [fulfillingPledge, setFulfillingPledge] = useState<CharityPledge | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Firestore Real-Time Listener for Authenticated User
  useEffect(() => {
    if (!user) return;

    const accountsPath = `users/${user.uid}/accounts`;
    const txsPath = `users/${user.uid}/transactions`;
    const pledgesPath = `users/${user.uid}/charity_pledges`;

    // Listen to accounts
    const unsubAccounts = onSnapshot(
      collection(db, accountsPath),
      async (snapshot) => {
        if (snapshot.empty) {
          // Bootstrap user's cloud account with initial KRW accounts
          for (const acc of INITIAL_ACCOUNTS) {
            try {
              await setDoc(doc(db, 'users', user.uid, 'accounts', acc.id), {
                ...acc,
                userId: user.uid,
              });
            } catch (e) {
              console.error('Error seeding initial account:', e);
            }
          }
        } else {
          const cloudAccounts = snapshot.docs.map((d) => d.data() as Account);
          setAccounts(cloudAccounts);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, accountsPath);
      }
    );

    // Listen to transactions
    const unsubTxs = onSnapshot(
      collection(db, txsPath),
      async (snapshot) => {
        if (snapshot.empty) {
          // Bootstrap with initial transactions
          for (const tx of INITIAL_TRANSACTIONS) {
            try {
              await setDoc(doc(db, 'users', user.uid, 'transactions', tx.id), {
                ...tx,
                userId: user.uid,
              });
            } catch (e) {
              console.error('Error seeding initial transaction:', e);
            }
          }
        } else {
          const cloudTxs = snapshot.docs.map((d) => d.data() as Transaction);
          // Sort descending by date/createdAt
          cloudTxs.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
          setTransactions(cloudTxs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, txsPath);
      }
    );

    // Listen to charity pledges
    const unsubPledges = onSnapshot(
      collection(db, pledgesPath),
      async (snapshot) => {
        if (snapshot.empty) {
          for (const pledge of INITIAL_CHARITY_PLEDGES) {
            try {
              await setDoc(doc(db, 'users', user.uid, 'charity_pledges', pledge.id), {
                ...pledge,
                userId: user.uid,
              });
            } catch (e) {
              console.error('Error seeding initial pledge:', e);
            }
          }
        } else {
          const cloudPledges = snapshot.docs.map((d) => d.data() as CharityPledge);
          setCharityPledges(cloudPledges);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pledgesPath);
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

  // Mutations
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (user) {
      const path = `users/${user.uid}/transactions/${newTx.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'transactions', newTx.id), {
          ...newTx,
          userId: user.uid,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    const now = new Date().toISOString();
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates, updatedAt: now } : tx))
    );

    if (user) {
      const path = `users/${user.uid}/transactions/${id}`;
      try {
        const existingTx = transactions.find((t) => t.id === id);
        if (existingTx) {
          await setDoc(doc(db, 'users', user.uid, 'transactions', id), {
            ...existingTx,
            ...updates,
            updatedAt: now,
            userId: user.uid,
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
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
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const addAccount = async (accountData: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAccount]);

    if (user) {
      const path = `users/${user.uid}/accounts/${newAccount.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'accounts', newAccount.id), {
          ...newAccount,
          userId: user.uid,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const editAccount = async (id: string, updates: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );

    if (user) {
      const path = `users/${user.uid}/accounts/${id}`;
      try {
        const existingAcc = accounts.find((a) => a.id === id);
        if (existingAcc) {
          await setDoc(doc(db, 'users', user.uid, 'accounts', id), {
            ...existingAcc,
            ...updates,
            userId: user.uid,
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const deleteAccount = async (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));

    if (user) {
      const path = `users/${user.uid}/accounts/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'accounts', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
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
    const newPledge: CharityPledge = {
      ...pledgeData,
      id: `pledge-${Date.now()}`,
      fulfilledAmount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    setCharityPledges((prev) => [newPledge, ...prev]);

    if (user) {
      const path = `users/${user.uid}/charity_pledges/${newPledge.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'charity_pledges', newPledge.id), {
          ...newPledge,
          userId: user.uid,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
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

    const newTx: Transaction = {
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
    };

    setTransactions((prev) => [newTx, ...prev]);

    const newFulfilled = pledge.fulfilledAmount + amount;
    const newStatus = newFulfilled >= pledge.pledgedAmount ? 'fulfilled' : 'partially_fulfilled';
    const updatedPledge: CharityPledge = {
      ...pledge,
      fulfilledAmount: newFulfilled,
      status: newStatus,
      updatedAt: now,
    };

    setCharityPledges((prev) =>
      prev.map((p) => (p.id === pledgeId ? updatedPledge : p))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'transactions', newTx.id), {
          ...newTx,
          userId: user.uid,
        });
        await setDoc(doc(db, 'users', user.uid, 'charity_pledges', pledgeId), {
          ...updatedPledge,
          userId: user.uid,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
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
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const resetToDefaultData = async () => {
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(INITIAL_CATEGORIES);
    setCharityPledges(INITIAL_CHARITY_PLEDGES);
    setActiveCurrencyState('KRW');

    if (user) {
      try {
        for (const acc of INITIAL_ACCOUNTS) {
          await setDoc(doc(db, 'users', user.uid, 'accounts', acc.id), { ...acc, userId: user.uid });
        }
        for (const tx of INITIAL_TRANSACTIONS) {
          await setDoc(doc(db, 'users', user.uid, 'transactions', tx.id), { ...tx, userId: user.uid });
        }
        for (const p of INITIAL_CHARITY_PLEDGES) {
          await setDoc(doc(db, 'users', user.uid, 'charity_pledges', p.id), { ...p, userId: user.uid });
        }
      } catch (e) {
        console.error('Error resetting cloud data:', e);
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
    } else {
      setEditingTransaction(null);
      setInitialTransactionType(tx?.type || 'expense');
    }
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
    setInitialTransactionType(undefined);
  };

  const openCharityModal = () => setIsCharityModalOpen(true);
  const closeCharityModal = () => setIsCharityModalOpen(false);

  const openFulfillModal = (pledge: CharityPledge) => setFulfillingPledge(pledge);
  const closeFulfillModal = () => setFulfillingPledge(null);

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
        accountBalances,
        netWorth,
        cashFlow,
        charityStats,
        setActiveCurrency,
        setTheme,
        setActiveTab,
        addTransaction,
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
        isTransactionModalOpen,
        editingTransaction,
        initialTransactionType,
        openTransactionModal,
        closeTransactionModal,
        isCharityModalOpen,
        openCharityModal,
        closeCharityModal,
        fulfillingPledge,
        openFulfillModal,
        closeFulfillModal,
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
