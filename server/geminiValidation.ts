/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_GEMINI_BODY_BYTES = 6 * 1024 * 1024; // 6 MB

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_CURRENCIES = new Set(['KRW', 'USD', 'EUR', 'PKR']);

export const ALLOWED_BANK_HINTS = new Set(['auto', 'toss', 'hana', 'other']);

export const ALLOWED_EXPENSE_CATEGORIES = new Set([
  'Groceries (Eggs, Bread, Milk)',
  'Coffee & Drinks',
  'Ice Cream & Treats',
  'Dining & Takeout',
  'Study & Uni Gear',
  'Transit & Metro',
  'Bills & Rent',
  'Subscriptions',
  'Health',
  'Shopping',
  'Charity & Giving',
  'Uncategorized',
]);

export const ALLOWED_INCOME_CATEGORIES = new Set([
  'Work Placement & Salary',
  'Tutoring & Campus Job',
  'Allowance & Inflow',
  'Uncategorized',
]);

export function isValidIsoDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const [y, m, d] = trimmed.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function parseDataUrlImage(input: string): { mimeType: string; data: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(trimmed);
  if (match) {
    const mimeType = match[1].toLowerCase();
    const data = match[2].replace(/\s+/g, '');
    if (!ALLOWED_MIME_TYPES.has(mimeType) || !data) {
      return null;
    }
    return { mimeType, data };
  }

  return null;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; error: string };

export interface ValidatedReceiptRequest {
  mimeType: string;
  cleanBase64: string;
  merchantHint: string;
  targetCurrency: string;
  today: string;
}

export interface ValidatedBankScreenshotRequest {
  mimeType: string;
  cleanBase64: string;
  bankHint: string;
  targetCurrency: string;
  today: string;
}

function validateCommonImageRequest(
  body: Record<string, unknown>
): ValidationResult<{
  mimeType: string;
  cleanBase64: string;
  targetCurrency: string;
  today: string;
}> {
  const rawPayloadSize = Buffer.byteLength(JSON.stringify(body), 'utf8');
  if (rawPayloadSize > MAX_GEMINI_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Image payload exceeds the 6 MB upload limit.' };
  }

  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  if (!imageBase64) {
    return { ok: false, status: 400, error: 'Missing imageBase64' };
  }

  const parsedImage = parseDataUrlImage(imageBase64);
  if (!parsedImage) {
    return {
      ok: false,
      status: 400,
      error: 'Unsupported image format. Please upload a JPEG, PNG, or WebP image.',
    };
  }

  const targetCurrency =
    body.targetCurrency === undefined ? 'KRW' : String(body.targetCurrency).trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.has(targetCurrency)) {
    return {
      ok: false,
      status: 400,
      error: 'Unsupported targetCurrency. Allowed values: KRW, USD, EUR, PKR.',
    };
  }

  const today = typeof body.today === 'string' ? body.today.trim() : '';
  if (!isValidIsoDateString(today)) {
    return {
      ok: false,
      status: 400,
      error: 'Missing or invalid today date. Expected YYYY-MM-DD.',
    };
  }

  return {
    ok: true,
    value: {
      mimeType: parsedImage.mimeType,
      cleanBase64: parsedImage.data,
      targetCurrency,
      today,
    },
  };
}

export function validateScanReceiptRequest(
  body: Record<string, unknown>
): ValidationResult<ValidatedReceiptRequest> {
  const common = validateCommonImageRequest(body);
  if (!common.ok) return common;

  const merchantHint =
    typeof body.merchantHint === 'string' ? body.merchantHint.trim().slice(0, 120) : '';

  return {
    ok: true,
    value: {
      ...common.value,
      merchantHint,
    },
  };
}

export function validateBankScreenshotRequest(
  body: Record<string, unknown>
): ValidationResult<ValidatedBankScreenshotRequest> {
  const common = validateCommonImageRequest(body);
  if (!common.ok) return common;

  const bankHint =
    body.bankHint === undefined ? 'auto' : String(body.bankHint).trim().toLowerCase();
  if (!ALLOWED_BANK_HINTS.has(bankHint)) {
    return {
      ok: false,
      status: 400,
      error: 'Unsupported bankHint. Allowed values: auto, toss, hana, other.',
    };
  }

  return {
    ok: true,
    value: {
      ...common.value,
      bankHint,
    },
  };
}

export interface NormalizedReceiptItem {
  name: string;
  price: number;
  category: string;
}

export interface NormalizedReceiptOutput {
  merchant: string;
  totalAmount: number;
  currency: string;
  date: string;
  items: NormalizedReceiptItem[];
}

export function normalizeReceiptOutput(
  parsed: unknown,
  fallbackDate: string,
  fallbackCurrency: string,
  merchantHint = ''
): NormalizedReceiptOutput | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.items)) return null;

  const items: NormalizedReceiptItem[] = [];
  for (const rawItem of obj.items) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const row = rawItem as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim().slice(0, 120) : '';
    const price = Number(row.price);
    if (!name || !Number.isFinite(price) || price < 0) continue;

    const rawCat = typeof row.category === 'string' ? row.category.trim() : '';
    const category = ALLOWED_EXPENSE_CATEGORIES.has(rawCat) ? rawCat : 'Uncategorized';

    items.push({ name, price, category });
  }

  if (items.length === 0) return null;

  const rawTotal = Number(obj.totalAmount);
  const totalAmount =
    Number.isFinite(rawTotal) && rawTotal >= 0
      ? rawTotal
      : items.reduce((sum, item) => sum + item.price, 0);

  const rawCurrency =
    typeof obj.currency === 'string' ? obj.currency.trim().toUpperCase() : '';
  const currency = ALLOWED_CURRENCIES.has(rawCurrency) ? rawCurrency : fallbackCurrency;

  const date = isValidIsoDateString(obj.date) ? obj.date.trim() : fallbackDate;
  const rawMerchant = typeof obj.merchant === 'string' ? obj.merchant.trim().slice(0, 120) : '';

  return {
    merchant: rawMerchant || merchantHint || 'Scanned Store',
    totalAmount,
    currency,
    date,
    items,
  };
}

export interface NormalizedBankEntry {
  merchant: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  category: string;
  notes?: string;
}

export interface NormalizedBankScreenshotOutput {
  bankName: string;
  bankHint: 'toss' | 'hana' | 'other';
  currency: string;
  entries: NormalizedBankEntry[];
}

export function normalizeBankScreenshotOutput(
  parsed: unknown,
  fallbackDate: string,
  fallbackCurrency: string
): NormalizedBankScreenshotOutput | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.entries)) return null;

  const entries: NormalizedBankEntry[] = [];
  for (const rawEntry of obj.entries) {
    if (!rawEntry || typeof rawEntry !== 'object') continue;
    const row = rawEntry as Record<string, unknown>;
    const merchant = typeof row.merchant === 'string' ? row.merchant.trim().slice(0, 120) : '';
    const amount = Number(row.amount);
    if (!merchant || !Number.isFinite(amount) || amount < 0) continue;

    const rawType = typeof row.type === 'string' ? row.type.trim().toLowerCase() : 'expense';
    const type: 'expense' | 'income' = rawType === 'income' ? 'income' : 'expense';

    const rawCat = typeof row.category === 'string' ? row.category.trim() : '';
    const allowedSet =
      type === 'income' ? ALLOWED_INCOME_CATEGORIES : ALLOWED_EXPENSE_CATEGORIES;
    const category = allowedSet.has(rawCat) ? rawCat : 'Uncategorized';

    const date = isValidIsoDateString(row.date) ? row.date.trim() : fallbackDate;
    const notes = typeof row.notes === 'string' ? row.notes.trim().slice(0, 200) : undefined;

    entries.push({
      merchant,
      amount,
      type,
      date,
      category,
      ...(notes ? { notes } : {}),
    });
  }

  if (entries.length === 0) return null;

  const rawHint = typeof obj.bankHint === 'string' ? obj.bankHint.trim().toLowerCase() : '';
  const bankHint: 'toss' | 'hana' | 'other' =
    rawHint === 'toss' || rawHint === 'hana' ? rawHint : 'other';

  const rawBankName =
    typeof obj.bankName === 'string' ? obj.bankName.trim().slice(0, 80) : '';
  const bankName =
    rawBankName ||
    (bankHint === 'toss' ? 'Toss Bank' : bankHint === 'hana' ? 'Hana Bank' : 'Bank Account');

  const rawCurrency =
    typeof obj.currency === 'string' ? obj.currency.trim().toUpperCase() : '';
  const currency = ALLOWED_CURRENCIES.has(rawCurrency) ? rawCurrency : fallbackCurrency;

  return {
    bankName,
    bankHint,
    currency,
    entries,
  };
}

export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number = 20,
    private readonly windowMs: number = 60 * 60 * 1000
  ) {}

  check(
    key: string,
    nowMs: number = Date.now()
  ): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const cutoff = nowMs - this.windowMs;
    const existing = (this.hits.get(key) || []).filter((ts) => ts > cutoff);

    if (existing.length >= this.maxRequests) {
      const oldest = existing[0] ?? nowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - nowMs) / 1000));
      this.hits.set(key, existing);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    existing.push(nowMs);
    this.hits.set(key, existing);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - existing.length),
      retryAfterSeconds: 0,
    };
  }
}
