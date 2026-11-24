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
  Category,
  CharityPledge,
  CurrencyCode,
  ExchangeRates,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_CHARITY_PLEDGES,
  INITIAL_SAVINGS_GOALS,
  INITIAL_TRANSACTIONS,
} from '../data/seedData';
import { convertCurrency, DEFAULT_EXCHANGE_RATES, formatCurrency, roundCurrencyAmount } from '../utils/currencies';
import {
  computeAccountBalances,
  computeCashFlow,
  computeCharityStats,
  computeNetWorth,
  computePledgeFulfillment,
  computeSavingsContribution,
  computeSavingsStats,
} from '../utils/calculations';
import { useAuth } from './AuthContext';
import { useFinanceUI } from './UIContext';
import { useGamification } from './GamificationContext';
import {
  db,
  logFirestoreError,
  OperationType,
  upsertUserProfile,
  commitFirestoreOpsInChunks,
  clearUserLocalStorageCache,
} from '../services/firebase';
import { sanitizeForFirestore } from '../utils/firestoreSanitize';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  DocumentReference,
} from 'firebase/firestore';
import { localDateString } from '../utils/dates';
import { buildEmptyStarterState } from '../utils/accountStarter';
import { getFallbackCategory } from '../utils/autoCategorize';
import { parseBackupJson } from '../utils/backupSchema';
import { buildTransactionsCsv } from '../utils/csvExport';
import {
  fetchDailyExchangeRates,
  loadCachedExchangeRates,
} from '../utils/exchangeRates';
import {
  getStorageItem,
  setStorageItem,
  getStorageJSON,
  setStorageJSON,
  generateId,
} from '../utils/storage';

export interface ImportBackupResult {
  ok: boolean;
  error?: string;
  counts?: {
    accounts: number;
    transactions: number;
    pledges: number;
    savingsGoals: number;
  };
}

export interface PledgeFulfillResult {
  ok: boolean;
  error?: string;
}

export type SavingsContributeResult = PledgeFulfillResult;

const DATA_STORAGE_KEYS = {
  ACCOUNTS: 'stash_krw_accounts_v5',
  TRANSACTIONS: 'stash_krw_transactions_v5',
  CATEGORIES: 'stash_krw_categories_v5',
  CHARITY: 'stash_krw_charity_v5',
  SAVINGS: 'stash_krw_savings_v5',
  CURRENCY: 'stash_krw_currency_v5',
};

function mergeCategories(stored: Category[] | null): Category[] {
  const baseList = Array.isArray(stored) && stored.length > 0 ? stored : INITIAL_CATEGORIES;
  const cleaned = baseList
    .filter((c) => c.id !== 'cat-transfer')
    .map((c) =>
      c.id === 'cat-icecream' && c.name === 'Ice Cream & Treats'
        ? { ...c, name: 'Ice Cream', icon: 'IceCream', color: '#FF2D55' }
        : c
    );
  const byId = new Map(cleaned.map((c) => [c.id, c]));
  const canonicalIds = new Set(INITIAL_CATEGORIES.map((c) => c.id));
  const ordered: Category[] = INITIAL_CATEGORIES.map((cat) => byId.get(cat.id) || cat);
  for (const cat of cleaned) {
    if (!canonicalIds.has(cat.id)) {
      ordered.push(cat);
    }
  }
  return ordered;
}

export interface FinanceDataContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  charityPledges: CharityPledge[];
  savingsGoals: SavingsGoal[];
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
  ratesUpdatedAt: string;
  ratesSource: 'live' | 'default';
  isRefreshingRates: boolean;
  refreshExchangeRates: () => Promise<void>;
  isOnline: boolean;
  syncError: string | null;

  accountBalances: Record<string, number>;
  netWorth: { netWorth: number; totalAssets: number; totalLiabilities: number };
  cashFlow: {
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
    savingsRatePercent: number;
  };
  charityStats: {
    totalPledged: number;
    totalFulfilled: number;
    totalPending: number;
    fulfillmentPercent: number;
    pendingPledgesCount: number;
  };
  savingsStats: {
    totalTarget: number;
    totalSaved: number;
    totalRemaining: number;
    progressPercent: number;
    activeGoalsCount: number;
  };

  setActiveCurrency: (currency: CurrencyCode) => void;
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  addBatchTransactions: (
    txList: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => Promise<number>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  editAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (
    id: string,
    mode?: 'archive' | 'deleteWithTransactions'
  ) => Promise<void>;

  addCharityPledge: (pledge: {
    title: string;
    cause: string;
    pledgedAmount: number;
    currency: CurrencyCode;
    dueDate?: string;
    notes?: string;
  }) => Promise<void>;
  fulfillCharityPledge: (
    pledgeId: string,
    amount: number,
    accountId: string,
    notes?: string
  ) => Promise<PledgeFulfillResult>;
  deleteCharityPledge: (id: string) => Promise<void>;

  addSavingsGoal: (goal: {
    title: string;
    category: string;
    targetAmount: number;
    currency: CurrencyCode;
    targetDate?: string;
    notes?: string;
  }) => Promise<void>;
  contributeSavingsGoal: (
    goalId: string,
    amount: number,
    accountId: string,
    notes?: string,
    toAccountId?: string
  ) => Promise<SavingsContributeResult>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  resetToDefaultData: () => Promise<void>;
  clearAllDataToZero: () => Promise<void>;
  exportDataJSON: () => void;
  exportTransactionsCSV: () => void;
  importDataJSON: (jsonString: string) => Promise<ImportBackupResult>;
  confirm10PercentCharity: () => Promise<void>;
}

const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

export const FinanceDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isGuest, isOnline } = useAuth();
  const {
    setSelectedBankFilter,
    incomeCharityPrompt,
    triggerIncomeCharityPrompt,
    dismissIncomeCharity,
  } = useFinanceUI();
  const { addXp, recordDailyActivity, markQuestCompleted, setGems } = useGamification();

  const [syncError, setSyncError] = useState<string | null>(null);
  const prevUserUidRef = useRef<string | null>(null);

  const [accounts, setAccounts] = useState<Account[]>(() => {
    if (!user && isGuest) {
      return getStorageJSON<Account[]>(DATA_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (!user && isGuest) {
      return getStorageJSON<Transaction[]>(
        DATA_STORAGE_KEYS.TRANSACTIONS,
        INITIAL_TRANSACTIONS
      );
    }
    return [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = getStorageJSON<Category[] | null>(DATA_STORAGE_KEYS.CATEGORIES, null);
    return mergeCategories(stored);
  });

  const [charityPledges, setCharityPledges] = useState<CharityPledge[]>(() => {
    if (!user && isGuest) {
      return getStorageJSON<CharityPledge[]>(
        DATA_STORAGE_KEYS.CHARITY,
        INITIAL_CHARITY_PLEDGES
      );
    }
    return [];
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    if (!user && isGuest) {
      return getStorageJSON<SavingsGoal[]>(
        DATA_STORAGE_KEYS.SAVINGS,
        INITIAL_SAVINGS_GOALS
      );
    }
    return [];
  });

  const [activeCurrency, setActiveCurrencyState] = useState<CurrencyCode>(() => {
    const saved = getStorageItem(DATA_STORAGE_KEYS.CURRENCY);
    return saved === 'USD' || saved === 'EUR' || saved === 'KRW' || saved === 'PKR'
      ? saved
      : 'KRW';
  });

  const initialCachedRates = useMemo(() => loadCachedExchangeRates().cached, []);
  const [rates, setRates] = useState<ExchangeRates>(
    initialCachedRates?.rates || DEFAULT_EXCHANGE_RATES
  );
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string>(
    initialCachedRates?.updatedAt || ''
  );
  const [ratesSource, setRatesSource] = useState<'live' | 'default'>(
    initialCachedRates?.source || 'default'
  );
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  const refreshExchangeRates = useCallback(async () => {
    setIsRefreshingRates(true);
    try {
      const result = await fetchDailyExchangeRates(fetch, true);
      setRates(result.rates);
      setRatesUpdatedAt(result.updatedAt);
      setRatesSource(result.source);
    } finally {
      setIsRefreshingRates(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchDailyExchangeRates()
      .then((result) => {
        if (!active) return;
        setRates(result.rates);
        setRatesUpdatedAt(result.updatedAt);
        setRatesSource(result.source);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const activeCurrencyRef = useRef(activeCurrency);
  activeCurrencyRef.current = activeCurrency;

  // Firestore Real-Time Listener for Authenticated User
  useEffect(() => {
    if (!user) {
      if (prevUserUidRef.current) {
        prevUserUidRef.current = null;
        setSyncError(null);
        setSelectedBankFilter(null);
      }
      if (isGuest) {
        setAccounts(
          getStorageJSON<Account[]>(DATA_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS)
        );
        setTransactions(
          getStorageJSON<Transaction[]>(
            DATA_STORAGE_KEYS.TRANSACTIONS,
            INITIAL_TRANSACTIONS
          )
        );
        setCharityPledges(
          getStorageJSON<CharityPledge[]>(
            DATA_STORAGE_KEYS.CHARITY,
            INITIAL_CHARITY_PLEDGES
          )
        );
        setSavingsGoals(
          getStorageJSON<SavingsGoal[]>(
            DATA_STORAGE_KEYS.SAVINGS,
            INITIAL_SAVINGS_GOALS
          )
        );
      } else {
        const empty = buildEmptyStarterState();
        setAccounts(empty.accounts);
        setTransactions(empty.transactions);
        setCharityPledges(empty.charityPledges);
        setSavingsGoals(empty.savingsGoals);
      }
      return;
    }

    const uid = user.uid;
    prevUserUidRef.current = uid;
    setSyncError(null);
    setSelectedBankFilter(null);
    clearUserLocalStorageCache(uid);
    setAccounts([]);
    setTransactions([]);
    setCharityPledges([]);
    setSavingsGoals([]);

    upsertUserProfile(user, activeCurrencyRef.current);

    const accountsPath = `users/${uid}/accounts`;
    const txsPath = `users/${uid}/transactions`;
    const pledgesPath = `users/${uid}/charity_pledges`;
    const savingsPath = `users/${uid}/savings_goals`;

    const unsubAccounts = onSnapshot(
      collection(db, accountsPath),
      (snapshot) => {
        setSyncError(null);
        const cloudAccounts = snapshot.empty
          ? []
          : snapshot.docs.map((d) => d.data() as Account);
        setAccounts(cloudAccounts);
      },
      (error) => {
        const info = logFirestoreError(error, OperationType.LIST, accountsPath);
        setSyncError(`Cloud accounts sync warning: ${info.error}`);
      }
    );

    const unsubTxs = onSnapshot(
      collection(db, txsPath),
      (snapshot) => {
        const cloudTxs = snapshot.empty
          ? []
          : snapshot.docs.map((d) => d.data() as Transaction);
        cloudTxs.sort(
          (a, b) =>
            new Date(b.date || b.createdAt).getTime() -
            new Date(a.date || a.createdAt).getTime()
        );
        setTransactions(cloudTxs);
      },
      (error) => {
        const info = logFirestoreError(error, OperationType.LIST, txsPath);
        setSyncError(`Cloud transactions sync warning: ${info.error}`);
      }
    );

    const unsubPledges = onSnapshot(
      collection(db, pledgesPath),
      (snapshot) => {
        const cloudPledges = snapshot.empty
          ? []
          : snapshot.docs.map((d) => d.data() as CharityPledge);
        setCharityPledges(cloudPledges);
      },
      (error) => {
        logFirestoreError(error, OperationType.LIST, pledgesPath);
      }
    );

    const unsubSavings = onSnapshot(
      collection(db, savingsPath),
      (snapshot) => {
        const cloudGoals = snapshot.empty
          ? []
          : snapshot.docs.map((d) => d.data() as SavingsGoal);
        setSavingsGoals(cloudGoals);
      },
      (error) => {
        logFirestoreError(error, OperationType.LIST, savingsPath);
      }
    );

    return () => {
      unsubAccounts();
      unsubTxs();
      unsubPledges();
      unsubSavings();
    };
  }, [user?.uid, isGuest, setSelectedBankFilter]);

  useEffect(() => {
    if (!user && isGuest) {
      setStorageJSON(DATA_STORAGE_KEYS.ACCOUNTS, accounts);
    }
  }, [accounts, user, isGuest]);

  useEffect(() => {
    if (!user && isGuest) {
      setStorageJSON(DATA_STORAGE_KEYS.TRANSACTIONS, transactions);
    }
  }, [transactions, user, isGuest]);

  useEffect(() => {
    setStorageJSON(DATA_STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    if (!user && isGuest) {
      setStorageJSON(DATA_STORAGE_KEYS.CHARITY, charityPledges);
    }
  }, [charityPledges, user, isGuest]);

  useEffect(() => {
    if (!user && isGuest) {
      setStorageJSON(DATA_STORAGE_KEYS.SAVINGS, savingsGoals);
    }
  }, [savingsGoals, user, isGuest]);

  const setActiveCurrency = useCallback((curr: CurrencyCode) => {
    setActiveCurrencyState(curr);
    setStorageItem(DATA_STORAGE_KEYS.CURRENCY, curr);
  }, []);

  const accountBalances = useMemo(
    () => computeAccountBalances(accounts, transactions, rates),
    [accounts, transactions, rates]
  );

  const netWorth = useMemo(
    () => computeNetWorth(accounts, accountBalances, activeCurrency, rates),
    [accounts, accountBalances, activeCurrency, rates]
  );

  const cashFlow = useMemo(
    () => computeCashFlow(transactions, activeCurrency, rates, undefined, accounts),
    [transactions, activeCurrency, rates, accounts]
  );

  const charityStats = useMemo(
    () => computeCharityStats(charityPledges, activeCurrency, rates),
    [charityPledges, activeCurrency, rates]
  );

  const savingsStats = useMemo(
    () => computeSavingsStats(savingsGoals, activeCurrency, rates),
    [savingsGoals, activeCurrency, rates]
  );

  const addTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newTx: Transaction = sanitizeForFirestore({
        ...txData,
        id: generateId('tx'),
        createdAt: now,
        updatedAt: now,
      });

      setTransactions((prev) => [newTx, ...prev]);
      recordDailyActivity();
      addXp(20, txData.type === 'income' ? 'Income logged' : 'Expense logged');
      markQuestCompleted('quest-daily-expense');

      if (txData.type === 'income' && txData.amount > 0) {
        triggerIncomeCharityPrompt({
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
    },
    [user, recordDailyActivity, addXp, markQuestCompleted, triggerIncomeCharityPrompt]
  );

  const confirm10PercentCharity = useCallback(async () => {
    if (!incomeCharityPrompt) return;
    const { incomeAmount, currency, accountId, merchant } = incomeCharityPrompt;
    const charityAmount = roundCurrencyAmount(incomeAmount * 0.1, currency);
    const charityCat =
      categories.find((c) => c.isCharity || c.id === 'cat-charity') ||
      getFallbackCategory(categories, 'expense');
    const today = localDateString();

    await addTransaction({
      type: 'expense',
      amount: charityAmount,
      currency,
      date: today,
      categoryId: charityCat.id,
      accountId,
      merchant: 'Charity Giving (10% of Income)',
      notes: `10% charity tithe from income of ${formatCurrency(incomeAmount, currency)}${
        merchant ? ` (${merchant})` : ''
      }`,
      isCharity: true,
    });

    addXp(50, 'Generosity Tithe 10%');
    setGems((g) => g + 30);
    markQuestCompleted('quest-charity-tithe');
    dismissIncomeCharity();
  }, [
    incomeCharityPrompt,
    categories,
    addTransaction,
    addXp,
    setGems,
    markQuestCompleted,
    dismissIncomeCharity,
  ]);

  const addBatchTransactions = useCallback(
    async (
      txList: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]
    ): Promise<number> => {
      if (!txList.length) return 0;
      const now = new Date().toISOString();

      const newTxs: Transaction[] = txList.map((txData) =>
        sanitizeForFirestore({
          ...txData,
          id: generateId('tx'),
          createdAt: now,
          updatedAt: now,
        })
      );

      setTransactions((prev) => {
        const merged = [...newTxs, ...prev];
        merged.sort(
          (a, b) =>
            new Date(b.date || b.createdAt).getTime() -
            new Date(a.date || a.createdAt).getTime()
        );
        return merged;
      });

      recordDailyActivity();
      addXp(newTxs.length * 15, `Imported ${newTxs.length} entries`);
      markQuestCompleted('quest-daily-expense');
      markQuestCompleted('quest-scan-receipt');

      const totalIncomeInBatch = newTxs
        .filter((t) => t.type === 'income' && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      if (totalIncomeInBatch > 0) {
        const firstIncome = newTxs.find((t) => t.type === 'income' && t.amount > 0)!;
        triggerIncomeCharityPrompt({
          incomeAmount: totalIncomeInBatch,
          currency: firstIncome.currency,
          accountId: firstIncome.accountId,
          merchant: 'Imported Bank Inflows',
        });
      }

      if (user) {
        const path = `users/${user.uid}/transactions`;
        try {
          await commitFirestoreOpsInChunks(newTxs, (batch, tx) => {
            batch.set(
              doc(db, 'users', user.uid, 'transactions', tx.id),
              sanitizeForFirestore({
                ...tx,
                userId: user.uid,
              })
            );
          });
        } catch (error) {
          const info = logFirestoreError(error, OperationType.WRITE, path);
          setSyncError(`Failed to sync batch import: ${info.error}`);
        }
      }

      return newTxs.length;
    },
    [user, recordDailyActivity, addXp, markQuestCompleted, triggerIncomeCharityPrompt]
  );

  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;
  const charityPledgesRef = useRef(charityPledges);
  charityPledgesRef.current = charityPledges;
  const savingsGoalsRef = useRef(savingsGoals);
  savingsGoalsRef.current = savingsGoals;

  const editTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      const now = new Date().toISOString();
      const existingTx = transactionsRef.current.find((t) => t.id === id);
      const updatedPayload = existingTx
        ? sanitizeForFirestore({ ...existingTx, ...updates, updatedAt: now })
        : null;

      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id
            ? sanitizeForFirestore({ ...tx, ...updates, updatedAt: now })
            : tx
        )
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
    },
    [user]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
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
    },
    [user]
  );

  const addAccount = useCallback(
    async (accountData: Omit<Account, 'id'>) => {
      const newAccount: Account = sanitizeForFirestore({
        ...accountData,
        id: generateId('acc'),
      });
      setAccounts((prev) => [...prev, newAccount]);

      addXp(30, 'Bank account linked');
      setGems((g) => g + 10);
      markQuestCompleted('quest-bank-demonstrate');

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
    },
    [user, addXp, setGems, markQuestCompleted]
  );

  const editAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      const existingAcc = accountsRef.current.find((a) => a.id === id);
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === id ? sanitizeForFirestore({ ...acc, ...updates }) : acc
        )
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
    },
    [user]
  );

  const deleteAccount = useCallback(
    async (
      id: string,
      mode: 'archive' | 'deleteWithTransactions' = 'deleteWithTransactions'
    ) => {
      if (mode === 'archive') {
        setSelectedBankFilter((prev) => (prev === id ? null : prev));
        await editAccount(id, { isArchived: true });
        return;
      }

      const affectedTxIds = transactionsRef.current
        .filter((t) => t.accountId === id || t.toAccountId === id)
        .map((t) => t.id);

      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      setTransactions((prev) =>
        prev.filter((t) => t.accountId !== id && t.toAccountId !== id)
      );
      setSelectedBankFilter((prev) => (prev === id ? null : prev));

      if (user) {
        const path = `users/${user.uid}/accounts/${id}`;
        try {
          const refs: DocumentReference[] = [
            doc(db, 'users', user.uid, 'accounts', id),
            ...affectedTxIds.map((txId) =>
              doc(db, 'users', user.uid, 'transactions', txId)
            ),
          ];
          await commitFirestoreOpsInChunks(refs, (batch, ref) => batch.delete(ref));
        } catch (error) {
          const info = logFirestoreError(error, OperationType.DELETE, path);
          setSyncError(`Failed to delete account: ${info.error}`);
        }
      }
    },
    [user, setSelectedBankFilter, editAccount]
  );

  const addCharityPledge = useCallback(
    async (pledgeData: {
      title: string;
      cause: string;
      pledgedAmount: number;
      currency: CurrencyCode;
      dueDate?: string;
      notes?: string;
    }) => {
      const now = localDateString();
      const newPledge: CharityPledge = sanitizeForFirestore({
        ...pledgeData,
        id: generateId('pledge'),
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
    },
    [user]
  );

  const fulfillCharityPledge = useCallback(
    async (
      pledgeId: string,
      amount: number,
      accountId: string,
      notes?: string
    ): Promise<PledgeFulfillResult> => {
      const pledge = charityPledgesRef.current.find((p) => p.id === pledgeId);
      if (!pledge) {
        return { ok: false, error: 'Charity pledge not found.' };
      }

      const sourceAccount = accountsRef.current.find(
        (a) => a.id === accountId && !a.isArchived
      );
      if (!sourceAccount) {
        return {
          ok: false,
          error: 'Select an active bank account to record this fulfillment.',
        };
      }

      const paidAmount = roundCurrencyAmount(amount, sourceAccount.currency);
      const fulfillment = computePledgeFulfillment(
        pledge,
        paidAmount,
        sourceAccount.currency,
        rates
      );

      if (!fulfillment.ok) {
        return { ok: false, error: fulfillment.error };
      }

      const charityCat =
        categories.find((c) => c.isCharity || c.id === 'cat-charity') ||
        getFallbackCategory(categories, 'expense');

      const today = localDateString();
      const now = new Date().toISOString();

      const newTx: Transaction = sanitizeForFirestore({
        id: generateId('tx-charity'),
        type: 'expense',
        amount: paidAmount,
        currency: sourceAccount.currency,
        date: today,
        categoryId: charityCat.id,
        accountId: sourceAccount.id,
        merchant: `Charity: ${pledge.title}`,
        notes: notes?.trim() || `Fulfillment for "${pledge.title}"`,
        isCharity: true,
        charityPledgeId: pledge.id,
        createdAt: now,
        updatedAt: now,
      });

      const updatedPledge: CharityPledge = sanitizeForFirestore({
        ...pledge,
        fulfilledAmount: fulfillment.newFulfilledAmount,
        status: fulfillment.newStatus,
        updatedAt: now,
      });

      setTransactions((prev) => [newTx, ...prev]);
      setCharityPledges((prev) =>
        prev.map((p) => (p.id === pledgeId ? updatedPledge : p))
      );
      recordDailyActivity();
      addXp(30, 'Charity pledge fulfilled');

      if (user) {
        try {
          const batch = writeBatch(db);
          batch.set(
            doc(db, 'users', user.uid, 'transactions', newTx.id),
            sanitizeForFirestore({
              ...newTx,
              userId: user.uid,
            })
          );
          batch.set(
            doc(db, 'users', user.uid, 'charity_pledges', pledgeId),
            sanitizeForFirestore({
              ...updatedPledge,
              userId: user.uid,
            })
          );
          await batch.commit();
        } catch (error) {
          const info = logFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          setSyncError(`Failed to sync charity fulfillment: ${info.error}`);
          return { ok: false, error: 'Failed to sync fulfillment to cloud.' };
        }
      }

      return { ok: true };
    },
    [user, rates, categories, recordDailyActivity, addXp]
  );

  const deleteCharityPledge = useCallback(
    async (id: string) => {
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
    },
    [user]
  );

  const addSavingsGoal = useCallback(
    async (goalData: {
      title: string;
      category: string;
      targetAmount: number;
      currency: CurrencyCode;
      targetDate?: string;
      notes?: string;
    }) => {
      const now = localDateString();
      const newGoal: SavingsGoal = sanitizeForFirestore({
        ...goalData,
        id: generateId('goal'),
        savedAmount: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      setSavingsGoals((prev) => [newGoal, ...prev]);

      if (user) {
        const path = `users/${user.uid}/savings_goals/${newGoal.id}`;
        try {
          await setDoc(
            doc(db, 'users', user.uid, 'savings_goals', newGoal.id),
            sanitizeForFirestore({
              ...newGoal,
              userId: user.uid,
            })
          );
        } catch (error) {
          const info = logFirestoreError(error, OperationType.WRITE, path);
          setSyncError(`Failed to sync savings goal: ${info.error}`);
        }
      }
    },
    [user]
  );

  const contributeSavingsGoal = useCallback(
    async (
      goalId: string,
      amount: number,
      accountId: string,
      notes?: string,
      toAccountId?: string
    ): Promise<SavingsContributeResult> => {
      const goal = savingsGoalsRef.current.find((g) => g.id === goalId);
      if (!goal) {
        return { ok: false, error: 'Savings goal not found.' };
      }

      const sourceAccount = accountsRef.current.find(
        (a) => a.id === accountId && !a.isArchived
      );
      if (!sourceAccount) {
        return {
          ok: false,
          error: 'Select an active bank account to record this deposit.',
        };
      }

      const destAccount =
        toAccountId && toAccountId !== sourceAccount.id
          ? accountsRef.current.find((a) => a.id === toAccountId && !a.isArchived)
          : undefined;

      const depositAmount = roundCurrencyAmount(amount, sourceAccount.currency);
      const contribution = computeSavingsContribution(
        goal,
        depositAmount,
        sourceAccount.currency,
        rates
      );

      if (!contribution.ok) {
        return { ok: false, error: contribution.error };
      }

      const savingsCat =
        categories.find((c) => c.id === 'cat-savings') ||
        getFallbackCategory(categories, 'expense');

      const today = localDateString();
      const now = new Date().toISOString();

      const resolvedToAmount = destAccount
        ? destAccount.currency === sourceAccount.currency
          ? depositAmount
          : convertCurrency(depositAmount, sourceAccount.currency, destAccount.currency, rates)
        : undefined;

      const newTx: Transaction = sanitizeForFirestore({
        id: generateId('tx-savings'),
        type: destAccount ? 'transfer' : 'expense',
        amount: depositAmount,
        toAmount: resolvedToAmount,
        currency: sourceAccount.currency,
        date: today,
        categoryId: savingsCat.id,
        accountId: sourceAccount.id,
        toAccountId: destAccount ? destAccount.id : undefined,
        merchant: `Savings: ${goal.title}`,
        notes: notes?.trim() || `Saved toward "${goal.title}"`,
        savingsGoalId: goal.id,
        createdAt: now,
        updatedAt: now,
      });

      const updatedGoal: SavingsGoal = sanitizeForFirestore({
        ...goal,
        savedAmount: contribution.newSavedAmount,
        status: contribution.newStatus,
        updatedAt: now,
      });

      setTransactions((prev) => [newTx, ...prev]);
      setSavingsGoals((prev) =>
        prev.map((g) => (g.id === goalId ? updatedGoal : g))
      );
      recordDailyActivity();
      addXp(30, 'Savings goal contribution');

      if (user) {
        try {
          const batch = writeBatch(db);
          batch.set(
            doc(db, 'users', user.uid, 'transactions', newTx.id),
            sanitizeForFirestore({
              ...newTx,
              userId: user.uid,
            })
          );
          batch.set(
            doc(db, 'users', user.uid, 'savings_goals', goalId),
            sanitizeForFirestore({
              ...updatedGoal,
              userId: user.uid,
            })
          );
          await batch.commit();
        } catch (error) {
          const info = logFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          setSyncError(`Failed to sync savings deposit: ${info.error}`);
          return { ok: false, error: 'Failed to sync savings deposit to cloud.' };
        }
      }

      return { ok: true };
    },
    [user, rates, categories, recordDailyActivity, addXp]
  );

  const deleteSavingsGoal = useCallback(
    async (id: string) => {
      setSavingsGoals((prev) => prev.filter((g) => g.id !== id));

      if (user) {
        const path = `users/${user.uid}/savings_goals/${id}`;
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'savings_goals', id));
        } catch (error) {
          const info = logFirestoreError(error, OperationType.DELETE, path);
          setSyncError(`Failed to delete savings goal: ${info.error}`);
        }
      }
    },
    [user]
  );

  const clearAllDataToZero = useCallback(async () => {
    const empty = buildEmptyStarterState();
    setAccounts(empty.accounts);
    setTransactions(empty.transactions);
    setCharityPledges(empty.charityPledges);
    setSavingsGoals(empty.savingsGoals);
    setSelectedBankFilter(null);

    if (user) {
      try {
        const [accSnap, txSnap, pledgeSnap, savingsSnap] = await Promise.all([
          getDocs(collection(db, `users/${user.uid}/accounts`)),
          getDocs(collection(db, `users/${user.uid}/transactions`)),
          getDocs(collection(db, `users/${user.uid}/charity_pledges`)),
          getDocs(collection(db, `users/${user.uid}/savings_goals`)),
        ]);
        const refs: DocumentReference[] = [
          ...accSnap.docs.map((d) => d.ref),
          ...txSnap.docs.map((d) => d.ref),
          ...pledgeSnap.docs.map((d) => d.ref),
          ...savingsSnap.docs.map((d) => d.ref),
        ];
        await commitFirestoreOpsInChunks(refs, (batch, ref) => batch.delete(ref));
      } catch (e) {
        logFirestoreError(e, OperationType.DELETE, `users/${user.uid}`);
      }
    }
  }, [user, setSelectedBankFilter]);

  const resetToDefaultData = useCallback(async () => {
    if (user) {
      await clearAllDataToZero();
      return;
    }

    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(INITIAL_CATEGORIES);
    setCharityPledges(INITIAL_CHARITY_PLEDGES);
    setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setActiveCurrencyState('KRW');
    setSelectedBankFilter(null);
  }, [user, clearAllDataToZero, setSelectedBankFilter]);

  const exportDataJSON = useCallback(() => {
    const data = {
      accounts,
      transactions,
      categories,
      charityPledges,
      savingsGoals,
      exportDate: new Date().toISOString(),
      primaryCurrency: activeCurrency,
      version: '3.1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Stash_Finance_${localDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [accounts, transactions, categories, charityPledges, savingsGoals, activeCurrency]);

  const exportTransactionsCSV = useCallback(() => {
    const csvContent = buildTransactionsCsv(transactions, categories, accounts);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Stash_Spending_${localDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions, categories, accounts]);

  const importDataJSON = useCallback(
    async (jsonString: string): Promise<ImportBackupResult> => {
      const parsed = parseBackupJson(jsonString);
      if (!parsed.ok) {
        return { ok: false, error: parsed.error };
      }

      const {
        accounts: nextAccs,
        transactions: nextTxs,
        categories: nextCats,
        charityPledges: nextPledges,
        savingsGoals: nextGoals = [],
        primaryCurrency,
      } = parsed.data;

      setAccounts(nextAccs);
      setTransactions(nextTxs);
      if (nextCats) {
        setCategories(mergeCategories(nextCats));
      }
      setCharityPledges(nextPledges);
      setSavingsGoals(nextGoals);
      if (primaryCurrency) {
        setActiveCurrency(primaryCurrency);
      }
      setSelectedBankFilter(null);

      if (user) {
        try {
          type WriteTarget =
            | { collectionName: 'accounts'; data: Account }
            | { collectionName: 'transactions'; data: Transaction }
            | { collectionName: 'charity_pledges'; data: CharityPledge }
            | { collectionName: 'savings_goals'; data: SavingsGoal };

          const targets: WriteTarget[] = [
            ...nextAccs.map((data) => ({ collectionName: 'accounts' as const, data })),
            ...nextTxs.map((data) => ({
              collectionName: 'transactions' as const,
              data,
            })),
            ...nextPledges.map((data) => ({
              collectionName: 'charity_pledges' as const,
              data,
            })),
            ...nextGoals.map((data) => ({
              collectionName: 'savings_goals' as const,
              data,
            })),
          ];

          await commitFirestoreOpsInChunks(targets, (batch, item) => {
            batch.set(
              doc(db, 'users', user.uid, item.collectionName, item.data.id),
              sanitizeForFirestore({
                ...item.data,
                userId: user.uid,
              })
            );
          });
        } catch (error) {
          const info = logFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          setSyncError(`Failed to sync restored backup: ${info.error}`);
          return {
            ok: false,
            error: `Restored locally, but cloud sync failed: ${info.error}`,
          };
        }
      }

      return {
        ok: true,
        counts: {
          accounts: nextAccs.length,
          transactions: nextTxs.length,
          pledges: nextPledges.length,
          savingsGoals: nextGoals.length,
        },
      };
    },
    [user, setActiveCurrency, setSelectedBankFilter]
  );

  const value = useMemo<FinanceDataContextType>(
    () => ({
      accounts,
      transactions,
      categories,
      charityPledges,
      savingsGoals,
      activeCurrency,
      rates,
      ratesUpdatedAt,
      ratesSource,
      isRefreshingRates,
      refreshExchangeRates,
      isOnline,
      syncError,
      accountBalances,
      netWorth,
      cashFlow,
      charityStats,
      savingsStats,
      setActiveCurrency,
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
      addSavingsGoal,
      contributeSavingsGoal,
      deleteSavingsGoal,
      resetToDefaultData,
      clearAllDataToZero,
      exportDataJSON,
      exportTransactionsCSV,
      importDataJSON,
      confirm10PercentCharity,
    }),
    [
      accounts,
      transactions,
      categories,
      charityPledges,
      savingsGoals,
      activeCurrency,
      rates,
      ratesUpdatedAt,
      ratesSource,
      isRefreshingRates,
      refreshExchangeRates,
      isOnline,
      syncError,
      accountBalances,
      netWorth,
      cashFlow,
      charityStats,
      savingsStats,
      setActiveCurrency,
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
      addSavingsGoal,
      contributeSavingsGoal,
      deleteSavingsGoal,
      resetToDefaultData,
      clearAllDataToZero,
      exportDataJSON,
      exportTransactionsCSV,
      importDataJSON,
      confirm10PercentCharity,
    ]
  );

  return (
    <FinanceDataContext.Provider value={value}>
      {children}
    </FinanceDataContext.Provider>
  );
};

export function useFinanceData(): FinanceDataContextType {
  const ctx = useContext(FinanceDataContext);
  if (!ctx) {
    throw new Error('useFinanceData must be used within FinanceDataProvider');
  }
  return ctx;
}
