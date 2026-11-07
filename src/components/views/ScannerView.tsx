/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  Receipt,
  ArrowRight,
  Loader2,
  Store,
  Coffee,
  IceCream,
  ShoppingCart,
  GraduationCap,
  Edit2,
  Check,
} from 'lucide-react';
import { ReceiptItem } from '../../types/finance';
import { formatCurrency } from '../../utils/currencies';

const SAMPLE_RECEIPTS = [
  {
    name: "Market Haul (Eggs, Bread, Coffee & Ice Cream)",
    merchant: "Emart Everyday (이마트)",
    items: [
      { id: '1', name: 'Grade-A Fresh Eggs (신선 특란 10구)', price: 4500, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: '2', name: 'Artisan Toast Bread (우유 식빵)', price: 3800, category: 'Groceries (Eggs, Bread, Milk)' },
      { id: '3', name: 'Iced Vanilla Oat Latte (아이스 오트라떼)', price: 5500, category: 'Coffee & Drinks' },
      { id: '4', name: 'Haagen-Dazs Vanilla Cup (하겐다즈)', price: 4200, category: 'Ice Cream & Treats' },
    ],
  },
  {
    name: "Bakery & Coffee Break",
    merchant: "Paris Baguette & Cafe",
    items: [
      { id: '1', name: 'Cold Brew Americano (콜드브루)', price: 4500, category: 'Coffee & Drinks' },
      { id: '2', name: 'Fresh Juice (생과일 주스)', price: 5000, category: 'Coffee & Drinks' },
      { id: '3', name: 'Chocolate Pastry (초코 페스츄리)', price: 3400, category: 'Ice Cream & Treats' },
    ],
  },
  {
    name: "Campus Store & Treats",
    merchant: "CU Convenience Store (CU 편의점)",
    items: [
      { id: '1', name: 'Bakin Robbins Cone (배스킨라빈스)', price: 3900, category: 'Ice Cream & Treats' },
      { id: '2', name: 'Study Notebook (캠퍼스 노트)', price: 2500, category: 'Study & Uni Gear' },
      { id: '3', name: 'Black Coffee Can (칸타타 커피)', price: 2200, category: 'Coffee & Drinks' },
    ],
  },
];

export const ScannerView: React.FC = () => {
  const { categories, accounts, activeCurrency, addTransaction, setActiveTab } = useFinance();

  const [isScanning, setIsScanning] = useState(false);
  const [merchant, setMerchant] = useState('Emart Everyday (이마트)');
  const [items, setItems] = useState<ReceiptItem[]>(SAMPLE_RECEIPTS[0].items);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [allotSuccess, setAllotSuccess] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const availableCategories = categories.filter((c) => c.type === 'expense' && !c.isCharity);

  const calculateTotal = items.reduce((sum, item) => sum + item.price, 0);

  // Group items by category to show the allotment breakdown
  const categoryBreakdown = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.price;
    return acc;
  }, {} as Record<string, number>);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setAllotSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setReceiptImage(base64);

      try {
        const response = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, merchantHint: 'Store Receipt' }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.items && Array.isArray(data.items)) {
            setMerchant(data.merchant || 'Scanned Store');
            // Parse detected items; if prices are small numbers in dollars, convert to KRW equivalents or use raw
            setItems(
              data.items.map((it: any, idx: number) => {
                let p = parseFloat(it.price) || 0;
                // If the AI scanned an amount under 100 in KRW mode, it might be in USD, so convert to realistic KRW
                if (p > 0 && p < 100 && activeCurrency === 'KRW') {
                  p = Math.round(p * 1350);
                }
                return {
                  id: `scanned-${idx}-${Date.now()}`,
                  name: it.name,
                  price: p,
                  category: it.category || 'Groceries (Eggs, Bread, Milk)',
                };
              })
            );
          }
        }
      } catch (err) {
        console.error('Scan failed, using sample items', err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (sample: typeof SAMPLE_RECEIPTS[0]) => {
    setMerchant(sample.merchant);
    setItems(sample.items.map((it) => ({ ...it, id: `${it.id}-${Date.now()}` })));
    setAllotSuccess(false);
  };

  const handleUpdateItemCategory = (id: string, newCat: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category: newCat } : item))
    );
  };

  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: newPrice } : item))
    );
  };

  const handleUpdateItemName = (id: string, newName: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `manual-${Date.now()}`,
      name: 'New Item (Coffee / Ice Cream / Groceries)',
      price: activeCurrency === 'KRW' ? 4500 : 3.5,
      category: 'Coffee & Drinks',
    };
    setItems((prev) => [...prev, newItem]);
    setEditingItemId(newItem.id);
  };

  const handleSaveAndAllotAll = () => {
    if (items.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    // For each unique category group, create a transaction allotted to that bucket
    Object.entries(categoryBreakdown).forEach(([catName, sumAmount]) => {
      const matchedCategory =
        categories.find((c) => c.name.toLowerCase().includes(catName.toLowerCase()) || catName.toLowerCase().includes(c.name.toLowerCase())) ||
        categories[0];

      const itemNames = items
        .filter((it) => it.category === catName)
        .map((it) => `${it.name} (${formatCurrency(it.price, activeCurrency)})`)
        .join(', ');

      addTransaction({
        type: 'expense',
        amount: activeCurrency === 'KRW' ? Math.round(sumAmount) : Number(sumAmount.toFixed(2)),
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
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-12">
      {/* Header */}
      <div className="pt-1">
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Receipt Scanner
        </span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Scanned Receipt & Allotment
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Scan receipt photos to automatically feed line items: eggs & bread to groceries, coffee to drinks, and ice cream to treats.
        </p>
      </div>

      {/* Camera / Upload Card */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Smart Receipt Scanner
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
              Auto Feed & Edit
            </span>
          </div>

          <p className="text-xs text-blue-100/90 leading-relaxed">
            Snap your receipt. Every item is automatically parsed and allotted to its exact spending category. You can also edit items freely before saving.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md cursor-pointer hover:bg-blue-50 active:scale-95 transition">
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning & Categorizing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Scan Receipt / Upload Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                disabled={isScanning}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Sample Receipts Quick Selector */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
          Or try ready sample receipts:
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {SAMPLE_RECEIPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => loadSample(sample)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap hover:border-blue-400 transition shadow-xs"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Itemized Allotment Review Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-4">
        {/* Merchant & Account Selector */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              Store / Merchant
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              Charged to Pocket
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Allotment Summary Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-900 dark:text-white block">
            Automatic Categorization Breakdown:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(categoryBreakdown).map(([cat, amount]) => (
              <div
                key={cat}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60"
              >
                <span className="font-semibold">{cat}:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(amount, activeCurrency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Itemized List */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Itemized Line Items ({items.length})</span>
            <button
              onClick={handleAddItem}
              className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline"
            >
              <Plus className="w-3 h-3" />
              <span>Add Line</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {items.map((item) => {
              const isEditing = editingItemId === item.id;
              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                          className="w-full text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">Amount:</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleUpdateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-24 text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                        {item.name}
                      </span>
                    )}

                    {/* Category allotment picker */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-400">Allotted to:</span>
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItemCategory(item.id, e.target.value)}
                        className="text-[11px] font-medium rounded px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 focus:outline-none"
                      >
                        {availableCategories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isEditing && (
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {formatCurrency(item.price, activeCurrency)}
                      </span>
                    )}

                    <button
                      onClick={() => setEditingItemId(isEditing ? null : item.id)}
                      className="p-1 text-slate-400 hover:text-blue-500 transition"
                      title={isEditing ? 'Done editing' : 'Edit item'}
                    >
                      {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Edit2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total & Action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Receipt Total
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(calculateTotal, activeCurrency)}
            </span>
          </div>

          <button
            onClick={handleSaveAndAllotAll}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
          >
            {allotSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Allotted & Saved!</span>
              </>
            ) : (
              <>
                <span>Save Allotted to Spending</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
