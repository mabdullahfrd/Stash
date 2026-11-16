/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Camera,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  ArrowRight,
  ImagePlus,
  AlertCircle,
  Check,
} from 'lucide-react';
import { ReceiptItem } from '../../types/finance';
import { formatCurrency } from '../../utils/currencies';
import { MinimalHeader } from '../common/MinimalHeader';
import { BankLogo } from '../common/BankLogo';
import { findBankPreset } from '../../utils/koreanBanks';
import { inferCategoryForItem } from '../../utils/autoCategorize';
import {
  detectBankAccountFromHint,
  normalizeParsedBankEntries,
  ParsedBankScreenshotItem,
  RawBankScreenshotEntry,
} from '../../utils/screenshotParser';

const SAMPLE_RECEIPTS = [
  {
    name: 'Market Haul (Eggs, Bread, Milk)',
    merchant: 'Emart Everyday (이마트)',
    items: [
      { id: '1', name: 'Fresh Grade-A Eggs (신선 계란 10구)', price: 4500, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: '2', name: 'Milk Toast Bread (우유 식빵)', price: 3800, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: '3', name: 'Iced Vanilla Latte (바닐라 라떼)', price: 5500, category: 'Coffee & Drinks' },
      { id: '4', name: 'Baskin Cup (배스킨라빈스)', price: 4200, category: 'Ice Cream & Treats' },
    ],
  },
  {
    name: 'Mega Coffee & Treats',
    merchant: 'Mega MGC Coffee (메가커피)',
    items: [
      { id: '1', name: 'Mega Iced Americano (메가 아메리카노)', price: 3000, category: 'Coffee & Drinks' },
      { id: '2', name: 'Strawberry Macaron (딸기 마카롱)', price: 3500, category: 'Ice Cream & Treats' },
    ],
  },
  {
    name: 'CU Convenience Store',
    merchant: 'CU Convenience Store (CU 편의점)',
    items: [
      { id: '1', name: 'Banana Milk (바나나맛 우유)', price: 1700, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: '2', name: 'Study Highlighter Set (형광펜 세트)', price: 3200, category: 'Study & Uni Gear' },
      { id: '3', name: 'Ice Cream Bar (메로나)', price: 1200, category: 'Ice Cream & Treats' },
    ],
  },
];

const SAMPLE_BANK_SCREENSHOTS: Array<{
  label: string;
  bankHint: 'toss' | 'hana';
  bankName: string;
  entries: RawBankScreenshotEntry[];
}> = [
  {
    label: 'Toss Payment History',
    bankHint: 'toss',
    bankName: 'Toss Bank (토스뱅크)',
    entries: [
      { merchant: 'Mega Coffee Iced Latte (메가커피)', amount: 4500, type: 'expense', date: '2026-11-14', notes: 'Toss Pay card' },
      { merchant: 'GS25 Fresh Eggs & Milk (GS25)', amount: 6200, type: 'expense', date: '2026-11-14', notes: 'Toss QR pay' },
      { merchant: 'Seoul Metro T-Money (교통카드)', amount: 1550, type: 'expense', date: '2026-11-13', notes: 'Transit auto-charge' },
      { merchant: 'Baemin Chicken Bowl (배달의민족)', amount: 16900, type: 'expense', date: '2026-11-12', notes: 'Toss Pay' },
      { merchant: 'Baskin Robbins Ice Cream (배라)', amount: 5200, type: 'expense', date: '2026-11-12', notes: 'Toss card' },
    ],
  },
  {
    label: 'Hana 1Q Spending Log',
    bankHint: 'hana',
    bankName: 'Hana Bank (하나은행)',
    entries: [
      { merchant: 'Kyobo Bookstore Study Gear (교보문고)', amount: 24000, type: 'expense', date: '2026-11-14', notes: 'Hana check card' },
      { merchant: 'Campus Cafeteria Lunch (학생식당)', amount: 6500, type: 'expense', date: '2026-11-13', notes: 'Hana Pay' },
      { merchant: 'Tutoring Allowance Deposit (과외 입금)', amount: 120000, type: 'income', date: '2026-11-12', notes: 'Hana transfer in' },
    ],
  },
];

export const ScannerView: React.FC = () => {
  const {
    categories,
    accounts,
    activeCurrency,
    addTransaction,
    addBatchTransactions,
    setActiveTab,
  } = useFinance();

  const [importMode, setImportMode] = useState<'bank' | 'receipt'>('bank');

  // Shared bank selection
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    detectBankAccountFromHint('toss', accounts)
  );

  useEffect(() => {
    if (!accounts.some((a) => a.id === selectedAccountId) && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Bank screenshot import state
  const [isParsingScreenshot, setIsParsingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [detectedBankLabel, setDetectedBankLabel] = useState<string>('Toss Bank');
  const [parsedEntries, setParsedEntries] = useState<ParsedBankScreenshotItem[]>(() =>
    normalizeParsedBankEntries(SAMPLE_BANK_SCREENSHOTS[0].entries, categories)
  );
  const [batchSuccessCount, setBatchSuccessCount] = useState<number | null>(null);

  // Store receipt scanner state
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState('Emart Everyday (이마트)');
  const [items, setItems] = useState<ReceiptItem[]>(SAMPLE_RECEIPTS[0].items);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [allotSuccess, setAllotSuccess] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Groceries (Eggs, Bread, Milk)');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // --- Bank Screenshot Handlers ---
  const handleBankScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingScreenshot(true);
    setScreenshotError(null);
    setBatchSuccessCount(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setScreenshotPreview(base64);

      try {
        const response = await fetch('/api/parse-bank-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            bankHint: 'auto',
            targetCurrency: activeCurrency,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setScreenshotError(data.error || 'Could not extract transactions from this screenshot.');
          return;
        }

        const matchedAccountId = detectBankAccountFromHint(data.bankHint || data.bankName, accounts);
        if (matchedAccountId) {
          setSelectedAccountId(matchedAccountId);
        }
        setDetectedBankLabel(data.bankName || 'Toss Bank');

        const normalized = normalizeParsedBankEntries(data.entries || [], categories);
        if (normalized.length === 0) {
          setScreenshotError('No valid payment amounts were found in this screenshot.');
        } else {
          setParsedEntries(normalized);
        }
      } catch (err) {
        console.error('Bank screenshot upload error:', err);
        setScreenshotError('Network error while reading screenshot. Please try again.');
      } finally {
        setIsParsingScreenshot(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadSampleBankScreenshot = (sample: (typeof SAMPLE_BANK_SCREENSHOTS)[0]) => {
    setScreenshotError(null);
    setBatchSuccessCount(null);
    setScreenshotPreview(null);
    setDetectedBankLabel(sample.bankName);
    const accId = detectBankAccountFromHint(sample.bankHint, accounts);
    if (accId) setSelectedAccountId(accId);
    setParsedEntries(normalizeParsedBankEntries(sample.entries, categories));
  };

  const toggleEntrySelected = (id: string) => {
    setParsedEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, selected: !entry.selected } : entry))
    );
  };

  const updateEntryCategory = (id: string, categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    setParsedEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              categoryId: cat.id,
              categoryName: cat.name,
              isCharity: Boolean(cat.isCharity),
            }
          : entry
      )
    );
  };

  const updateEntryType = (id: string, nextType: 'expense' | 'income') => {
    const fallbackCat = categories.find((c) => c.type === nextType) || categories[0];
    setParsedEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              type: nextType,
              categoryId: fallbackCat.id,
              categoryName: fallbackCat.name,
              isCharity: Boolean(fallbackCat.isCharity),
            }
          : entry
      )
    );
  };

  const removeParsedEntry = (id: string) => {
    setParsedEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const selectedEntries = parsedEntries.filter((e) => e.selected);
  const selectedNetExpense = selectedEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleImportSelectedEntries = async () => {
    if (selectedEntries.length === 0 || !selectedAccount) return;

    const payload = selectedEntries.map((entry) => ({
      type: entry.type,
      amount: entry.amount,
      currency: selectedAccount.currency || activeCurrency,
      date: entry.date,
      categoryId: entry.categoryId,
      accountId: selectedAccount.id,
      merchant: entry.merchant,
      notes: entry.notes || `Imported from ${detectedBankLabel} screenshot`,
      isCharity: entry.isCharity,
    }));

    const count = await addBatchTransactions(payload);
    setBatchSuccessCount(count);
    setTimeout(() => {
      setActiveTab('pockets');
    }, 900);
  };

  // --- Receipt Scanner Handlers ---
  const calculateReceiptTotal = items.reduce((sum, item) => sum + item.price, 0);

  const categoryBreakdown = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.price;
    return acc;
  }, {} as Record<string, number>);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningReceipt(true);
    setReceiptError(null);
    setAllotSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setReceiptImage(base64);

      try {
        const response = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            merchantHint: 'Store Receipt',
            targetCurrency: activeCurrency,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setReceiptError(data.error || 'Could not extract items from this receipt image.');
          return;
        }

        if (data.merchant) setMerchant(data.merchant);
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(
            data.items.map((it: { name: string; price: number; category: string }, idx: number) => ({
              id: `ai-${Date.now()}-${idx}`,
              name: it.name,
              price: Math.round(Math.abs(Number(it.price))) || 0,
              category: it.category || 'Groceries (Eggs, Bread, Milk)',
            }))
          );
        }
      } catch (err) {
        console.error('Receipt scan error:', err);
        setReceiptError('Network error while scanning receipt. Try again or load a sample receipt.');
      } finally {
        setIsScanningReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadSampleReceipt = (sample: (typeof SAMPLE_RECEIPTS)[0]) => {
    setReceiptError(null);
    setMerchant(sample.merchant);
    setItems(sample.items.map((it) => ({ ...it, id: `${it.id}-${Date.now()}` })));
    setAllotSuccess(false);
  };

  const handleRemoveReceiptItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddReceiptItem = () => {
    const trimmed = newItemName.trim();
    const parsedPrice = parseFloat(newItemPrice);
    if (!trimmed || isNaN(parsedPrice) || parsedPrice <= 0) return;

    const newItem: ReceiptItem = {
      id: `manual-${Date.now()}`,
      name: trimmed,
      price: Math.round(parsedPrice),
      category: newItemCategory,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setIsAddingItem(false);
  };

  const handleSaveAndAllotAll = () => {
    if (items.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    Object.entries(categoryBreakdown).forEach(([catName, sumAmount]) => {
      const matchedCategory =
        categories.find(
          (c) =>
            c.name.toLowerCase().includes(catName.toLowerCase()) ||
            catName.toLowerCase().includes(c.name.toLowerCase())
        ) || categories[0];

      const itemNames = items
        .filter((it) => it.category === catName)
        .map((it) => `${it.name} (${formatCurrency(it.price, activeCurrency)})`)
        .join(', ');

      addTransaction({
        type: 'expense',
        amount: Math.round(sumAmount),
        currency: activeCurrency,
        date: today,
        categoryId: matchedCategory.id,
        accountId: selectedAccountId || accounts[0]?.id || '',
        merchant,
        notes: `Allotted from scanned receipt: ${itemNames}`,
        receiptItems: items.filter((it) => it.category === catName),
        receiptUrl: receiptImage || undefined,
      });
    });

    setAllotSuccess(true);
    setTimeout(() => {
      setActiveTab('pockets');
    }, 900);
  };

  return (
    <div className="flex-1 flex flex-col">
      <MinimalHeader />

      <div className="px-4 sm:px-6 pt-2 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111315] dark:text-[#F4F5F0]">
              Import & Receipt Scan
            </h1>
            <p className="text-xs text-[#6B7268] dark:text-[#8E9689] mt-0.5">
              Auto-add past spending from a Toss / Hana screenshot or itemize a store receipt.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.05] self-start">
            <button
              type="button"
              onClick={() => setImportMode('bank')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                importMode === 'bank'
                  ? 'bg-white dark:bg-[#1E221C] text-[#111315] dark:text-[#F4F5F0] shadow-xs'
                  : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              Toss / Bank Screenshot
            </button>
            <button
              type="button"
              onClick={() => setImportMode('receipt')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                importMode === 'receipt'
                  ? 'bg-white dark:bg-[#1E221C] text-[#111315] dark:text-[#F4F5F0] shadow-xs'
                  : 'text-[#6B7268] dark:text-[#8E9689] hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              Store Receipt
            </button>
          </div>
        </div>

        {importMode === 'bank' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Screenshot Upload & Presets */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F4F5F0] dark:bg-white/[0.06] text-[#111315] dark:text-[#C8EC45] flex items-center justify-center mx-auto">
                  <ImagePlus className="w-5 h-5 stroke-[1.8]" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#111315] dark:text-[#F4F5F0]">
                    Upload Toss or Hana Screenshot
                  </h3>
                  <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] mt-1">
                    Extracts every payment row, date, amount, and auto-assigns categories.
                  </p>
                </div>

                <label className="w-full py-3 px-4 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer">
                  {isParsingScreenshot ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting transactions...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4" />
                      <span>Select Payment Screenshot</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBankScreenshotUpload}
                    disabled={isParsingScreenshot}
                    className="hidden"
                  />
                </label>

                {screenshotPreview && (
                  <div className="pt-2">
                    <img
                      src={screenshotPreview}
                      alt="Uploaded payment screenshot preview"
                      className="w-full max-h-48 object-contain rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F4F5F0] dark:bg-[#0D0F0C]"
                    />
                  </div>
                )}

                {screenshotError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 text-left border border-rose-200/70 dark:border-rose-900/40">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{screenshotError}</span>
                  </div>
                )}
              </div>

              {/* Sample Bank History Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#6B7268] dark:text-[#8E9689] block">
                  Or load sample history
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_BANK_SCREENSHOTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => loadSampleBankScreenshot(sample)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-[#111315] dark:text-[#F4F5F0] text-xs font-medium hover:border-black/20 dark:hover:border-white/20 transition"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Review Extracted Rows & Batch Add */}
            <div className="lg:col-span-7 rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-5">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.07]">
                <div>
                  <span className="text-[11px] font-medium text-[#6B7268] dark:text-[#8E9689] block">
                    Detected Source
                  </span>
                  <span className="font-bold text-sm text-[#111315] dark:text-[#F4F5F0]">
                    {detectedBankLabel} · {selectedEntries.length} selected
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-medium text-[#6B7268] dark:text-[#8E9689] block">
                    Selected Outflow
                  </span>
                  <span className="font-mono font-bold text-lg text-[#111315] dark:text-[#F4F5F0] tabular-nums">
                    {formatCurrency(selectedNetExpense, selectedAccount?.currency || activeCurrency)}
                  </span>
                </div>
              </div>

              {/* Bank Account Target */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] block">
                  Assign to Bank Account
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    const bankInfo = findBankPreset(acc.institution || acc.name);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-[#F9FAF6] dark:bg-[#1E231C] border-[#141617] dark:border-[#C8EC45]'
                            : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06] opacity-80'
                        }`}
                      >
                        <BankLogo bank={bankInfo} size="sm" />
                        <span className="font-semibold text-xs text-[#111315] dark:text-[#F4F5F0] truncate">
                          {acc.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extracted Transaction Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]">
                    Extracted Payments ({parsedEntries.length})
                  </span>
                  <span className="text-[11px] text-[#6B7268] dark:text-[#8E9689]">
                    Auto-categorized
                  </span>
                </div>

                {parsedEntries.length === 0 ? (
                  <p className="text-xs text-[#8E9689] py-6 text-center border border-dashed border-black/10 dark:border-white/10 rounded-xl">
                    Upload a screenshot or load a sample history to review items.
                  </p>
                ) : (
                  <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] rounded-xl overflow-hidden bg-[#F9FAF7] dark:bg-[#121511]">
                    {parsedEntries.map((entry) => (
                      <div key={entry.id} className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => toggleEntrySelected(entry.id)}
                              aria-label={`Include ${entry.merchant}`}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                                entry.selected
                                  ? 'bg-[#141617] dark:bg-[#C8EC45] border-[#141617] dark:border-[#C8EC45] text-white dark:text-[#111315]'
                                  : 'bg-white dark:bg-[#161915] border-black/20 dark:border-white/20 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>

                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-xs text-[#111315] dark:text-[#F4F5F0] block truncate">
                                {entry.merchant}
                              </span>
                              <span className="text-[10px] font-mono text-[#6B7268] dark:text-[#8E9689]">
                                {entry.date}
                                {entry.notes ? ` · ${entry.notes}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`font-mono font-bold text-xs tabular-nums ${
                                entry.type === 'income'
                                  ? 'text-emerald-700 dark:text-[#C8EC45]'
                                  : 'text-[#111315] dark:text-[#F4F5F0]'
                              }`}
                            >
                              {entry.type === 'income' ? '+' : '-'}
                              {formatCurrency(entry.amount, selectedAccount?.currency || activeCurrency)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeParsedEntry(entry.id)}
                              className="text-[#8E9689] hover:text-rose-500 p-1 transition"
                              aria-label={`Remove ${entry.merchant}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pl-7">
                          <select
                            aria-label={`Type for ${entry.merchant}`}
                            value={entry.type}
                            onChange={(e) =>
                              updateEntryType(entry.id, e.target.value as 'expense' | 'income')
                            }
                            className="px-2 py-1 rounded-md bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[11px] font-medium text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>

                          <select
                            aria-label={`Category for ${entry.merchant}`}
                            value={entry.categoryId}
                            onChange={(e) => updateEntryCategory(entry.id, e.target.value)}
                            className="flex-1 min-w-0 px-2 py-1 rounded-md bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[11px] font-medium text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                          >
                            {categories
                              .filter((c) => c.type === entry.type)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Confirm CTA */}
              <button
                type="button"
                onClick={handleImportSelectedEntries}
                disabled={selectedEntries.length === 0 || batchSuccessCount !== null}
                className="w-full py-3.5 px-4 rounded-xl bg-[#C8EC45] hover:bg-[#B8DE35] text-[#111315] font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {batchSuccessCount !== null ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Added {batchSuccessCount} Entries to {selectedAccount?.name || 'Account'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Add {selectedEntries.length} {selectedEntries.length === 1 ? 'Entry' : 'Entries'} to{' '}
                      {selectedAccount?.name || 'Account'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Capture & Samples */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F4F5F0] dark:bg-white/[0.06] text-[#111315] dark:text-[#C8EC45] flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5 stroke-[1.8]" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#111315] dark:text-[#F4F5F0]">
                    Upload Store Receipt
                  </h3>
                  <p className="text-[11px] text-[#6B7268] dark:text-[#8E9689] mt-1">
                    Emart, Mega Coffee, CU, GS25, Paris Baguette, Olive Young
                  </p>
                </div>

                <label className="w-full py-3 px-4 rounded-xl bg-[#141617] hover:bg-[#23272A] dark:bg-[#C8EC45] dark:hover:bg-[#B8DE35] text-white dark:text-[#111315] font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer">
                  {isScanningReceipt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reading line items...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Take Photo / Upload Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleReceiptUpload}
                    disabled={isScanningReceipt}
                    className="hidden"
                  />
                </label>

                {receiptError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 text-left border border-rose-200/70 dark:border-rose-900/40">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{receiptError}</span>
                  </div>
                )}
              </div>

              {/* Sample Receipts */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#6B7268] dark:text-[#8E9689] block">
                  Load sample receipt
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_RECEIPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => loadSampleReceipt(sample)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] text-[#111315] dark:text-[#F4F5F0] text-xs font-medium hover:border-black/20 dark:hover:border-white/20 transition"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Itemized Ledger & Allotment */}
            <div className="lg:col-span-7 rounded-[24px] bg-white dark:bg-[#161915] border border-black/[0.07] dark:border-white/[0.08] p-5 space-y-5">
              {/* Merchant & Live Total */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-[#6B7268] dark:text-[#8E9689] block">
                    Merchant
                  </span>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full font-bold text-sm text-[#111315] dark:text-[#F4F5F0] bg-transparent border-b border-dashed border-black/15 dark:border-white/15 focus:outline-none py-0.5 mt-0.5"
                  />
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-medium text-[#6B7268] dark:text-[#8E9689] block">
                    Total
                  </span>
                  <span className="font-mono font-bold text-lg text-[#111315] dark:text-[#F4F5F0] tabular-nums">
                    {formatCurrency(calculateReceiptTotal, activeCurrency)}
                  </span>
                </div>
              </div>

              {/* Bank Account Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0] block">
                  Bank Account Used
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    const bankInfo = findBankPreset(acc.institution || acc.name);

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-[#F9FAF6] dark:bg-[#1E231C] border-[#141617] dark:border-[#C8EC45]'
                            : 'bg-[#F4F5F0] dark:bg-[#0D0F0C] border-black/[0.06] dark:border-white/[0.06] opacity-80'
                        }`}
                      >
                        <BankLogo bank={bankInfo} size="sm" />
                        <span className="font-semibold text-xs text-[#111315] dark:text-[#F4F5F0] truncate">
                          {acc.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111315] dark:text-[#F4F5F0]">
                    Line Items ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingItem((v) => !v)}
                    className="text-xs font-semibold text-[#4B5248] dark:text-[#C8EC45] flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAddingItem ? 'Cancel' : 'Add item'}
                  </button>
                </div>

                {isAddingItem && (
                  <div className="p-3 rounded-xl bg-[#F4F5F0] dark:bg-[#0D0F0C] border border-black/[0.08] dark:border-white/[0.08] space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewItemName(val);
                          const match = inferCategoryForItem(val, categories, 'expense');
                          if (match) {
                            setNewItemCategory(match.categoryName);
                          }
                        }}
                        placeholder="Item (e.g. Eggs, Coffee, Subway)"
                        className="sm:col-span-6 px-3 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-xs text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                      />
                      <input
                        type="number"
                        step="any"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="Amount"
                        className="sm:col-span-3 px-3 py-2 rounded-lg bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-xs font-mono text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddReceiptItem}
                        className="sm:col-span-3 px-3 py-2 rounded-lg bg-[#141617] dark:bg-[#C8EC45] text-white dark:text-[#111315] text-xs font-semibold hover:opacity-90 transition"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-[#6B7268] dark:text-[#8E9689]">Category (auto-matched):</span>
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="px-2 py-1 rounded-md bg-white dark:bg-[#161915] border border-black/[0.08] dark:border-white/[0.1] text-[11px] font-medium text-[#111315] dark:text-[#F4F5F0] focus:outline-none"
                      >
                        {categories
                          .filter((c) => c.type === 'expense')
                          .map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] rounded-xl overflow-hidden bg-[#F9FAF7] dark:bg-[#121511]">
                  {items.map((it) => (
                    <div key={it.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-xs text-[#111315] dark:text-[#F4F5F0] block truncate">
                          {it.name}
                        </span>
                        <span className="text-[10px] text-[#6B7268] dark:text-[#8E9689]">
                          {it.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono font-semibold text-xs text-[#111315] dark:text-[#F4F5F0] tabular-nums">
                          {formatCurrency(it.price, activeCurrency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReceiptItem(it.id)}
                          className="text-[#8E9689] hover:text-rose-500 p-1 transition"
                          aria-label={`Remove ${it.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm CTA */}
              <button
                type="button"
                onClick={handleSaveAndAllotAll}
                disabled={items.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-[#C8EC45] hover:bg-[#B8DE35] text-[#111315] font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {allotSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved to {selectedAccount?.name || 'Account'}</span>
                  </>
                ) : (
                  <>
                    <span>Allot to {selectedAccount?.name || 'Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
