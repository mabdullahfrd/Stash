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
  'Coffee',
  'Drinks & Beverages',
  'Ice Cream',
  'Treats & Snacks',
  'Dining & Takeout',
  'Study & Uni Gear',
  'Transit & Metro',
  'Travel & Flights',
  'Bills & Rent',
  'Subscriptions',
  'Health',
  'Fitness & Sports',
  'Beauty & Personal Care',
  'Entertainment & Events',
  'Shopping',
  'Tech & Software',
  'Household & Laundry',
  'Gifts & Occasions',
  'Savings & Goals',
  'Charity & Giving',
  'Uncategorized',
]);

export const ALLOWED_INCOME_CATEGORIES = new Set([
  'Work Placement & Salary',
  'Tutoring & Campus Job',
  'Allowance & Inflow',
  'Freelance & Side Gig',
  'Scholarship & Grants',
  'Interest & Dividends',
  'Refunds & Cashback',
  'Uncategorized',
]);

const ICE_CREAM_ITEM_REGEX = /(ice\s*cream|gelato|bingsu|baskin|haagen|sorbet|popsicle|sundae|melona|배스킨|아이스크림|메로나|빙수)/i;
const COFFEE_ITEM_REGEX = /(coffee|latte|americano|espresso|cappuccino|macchiato|mocha|cold\s*brew|starbucks|mega\s*coffee|커피|라떼|아메리카노|콜드브루|에스프레소|스타벅스|메가커피)/i;
const DRINK_ITEM_REGEX = /(drinks?|beverages?|tea|matcha|boba|bubble\s*tea|gong\s*cha|smoothie|juice|lemonade|ade|soda|cola|coca\s*cola|coke|pepsi|sprite|energy\s*drink|red\s*bull|monster|gatorade|pocari|음료|주스|스무디|버블티|공차|녹차|홍차|말차|콜라|사이다|탄산|에이드|포카리)/i;

/**
 * @param {string} rawCategory
 * @param {string} itemOrMerchant
 * @param {'expense' | 'income'} type
 * @returns {string}
 */
function resolveValidatedCategory(rawCategory, itemOrMerchant, type) {
  if (type === 'income') {
    return ALLOWED_INCOME_CATEGORIES.has(rawCategory) ? rawCategory : 'Uncategorized';
  }
  if (rawCategory === 'Ice Cream & Treats') {
    return ICE_CREAM_ITEM_REGEX.test(itemOrMerchant) ? 'Ice Cream' : 'Treats & Snacks';
  }
  if (rawCategory === 'Coffee & Drinks') {
    return DRINK_ITEM_REGEX.test(itemOrMerchant) && !COFFEE_ITEM_REGEX.test(itemOrMerchant)
      ? 'Drinks & Beverages'
      : 'Coffee';
  }
  return ALLOWED_EXPENSE_CATEGORIES.has(rawCategory) ? rawCategory : 'Uncategorized';
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isValidIsoDateString(value) {
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

/**
 * @param {string} input
 * @returns {{ mimeType: string; data: string } | null}
 */
export function parseDataUrlImage(input) {
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

/**
 * @param {Record<string, unknown>} body
 * @returns {{ ok: true; value: { mimeType: string; cleanBase64: string; targetCurrency: string; today: string } } | { ok: false; status: number; error: string }}
 */
function validateCommonImageRequest(body) {
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

/**
 * @param {Record<string, unknown>} body
 * @returns {{ ok: true; value: { mimeType: string; cleanBase64: string; targetCurrency: string; today: string; merchantHint: string } } | { ok: false; status: number; error: string }}
 */
export function validateScanReceiptRequest(body) {
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

/**
 * @param {Record<string, unknown>} body
 * @returns {{ ok: true; value: { mimeType: string; cleanBase64: string; targetCurrency: string; today: string; bankHint: string } } | { ok: false; status: number; error: string }}
 */
export function validateBankScreenshotRequest(body) {
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

/**
 * @param {unknown} parsed
 * @param {string} fallbackDate
 * @param {string} fallbackCurrency
 * @param {string} [merchantHint]
 */
export function normalizeReceiptOutput(
  parsed,
  fallbackDate,
  fallbackCurrency,
  merchantHint = ''
) {
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  if (!Array.isArray(obj.items)) return null;

  /** @type {Array<{ name: string; price: number; category: string }>} */
  const items = [];
  for (const rawItem of obj.items) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const row = /** @type {Record<string, unknown>} */ (rawItem);
    const name = typeof row.name === 'string' ? row.name.trim().slice(0, 120) : '';
    const price = Number(row.price);
    if (!name || !Number.isFinite(price) || price < 0) continue;

    const rawCat = typeof row.category === 'string' ? row.category.trim() : '';
    const category = resolveValidatedCategory(rawCat, name, 'expense');

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

/**
 * @param {unknown} parsed
 * @param {string} fallbackDate
 * @param {string} fallbackCurrency
 */
export function normalizeBankScreenshotOutput(parsed, fallbackDate, fallbackCurrency) {
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  if (!Array.isArray(obj.entries)) return null;

  /** @type {Array<{ merchant: string; amount: number; type: 'expense' | 'income'; date: string; category: string; notes?: string }>} */
  const entries = [];
  for (const rawEntry of obj.entries) {
    if (!rawEntry || typeof rawEntry !== 'object') continue;
    const row = /** @type {Record<string, unknown>} */ (rawEntry);
    const merchant = typeof row.merchant === 'string' ? row.merchant.trim().slice(0, 120) : '';
    const amount = Number(row.amount);
    if (!merchant || !Number.isFinite(amount) || amount < 0) continue;

    const rawType = typeof row.type === 'string' ? row.type.trim().toLowerCase() : 'expense';
    /** @type {'expense' | 'income'} */
    const type = rawType === 'income' ? 'income' : 'expense';

    const rawCat = typeof row.category === 'string' ? row.category.trim() : '';
    const category = resolveValidatedCategory(rawCat, merchant, type);

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
  /** @type {'toss' | 'hana' | 'other'} */
  const bankHint = rawHint === 'toss' || rawHint === 'hana' ? rawHint : 'other';

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
  /** @type {Map<string, number[]>} */
  hits = new Map();
  /** @type {number} */
  maxRequests;
  /** @type {number} */
  windowMs;

  constructor(maxRequests = 20, windowMs = 60 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * @param {string} key
   * @param {number} [nowMs]
   */
  check(key, nowMs = Date.now()) {
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

/**
 * @param {string | undefined} rawText
 * @returns {{ ok: true; data: unknown } | { ok: false; error: unknown }}
 */
export function parseModelJsonResponse(rawText) {
  let cleaned = (rawText || '{}').trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(cleaned);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  try {
    return { ok: true, data: JSON.parse(cleaned || '{}') };
  } catch (err) {
    return { ok: false, error: err };
  }
}

/**
 * @param {unknown} err
 * @param {'Receipt' | 'Screenshot'} featureLabel
 * @returns {{ status: number; message: string }}
 */
export function classifyGeminiApiError(err, featureLabel) {
  const anyErr = /** @type {{ status?: number; code?: string | number; message?: string } | null} */ (err);
  const status = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  const msg = typeof anyErr?.message === 'string' ? anyErr.message.toUpperCase() : '';

  if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA')) {
    return {
      status: 429,
      message: `${featureLabel} scanning is temporarily busy due to AI rate limits. Please wait a minute and try again.`,
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('API KEY')
  ) {
    return {
      status: 503,
      message: `${featureLabel} scanning is temporarily unavailable. Check that GEMINI_API_KEY is valid on the server.`,
    };
  }

  if (status === 404 || msg.includes('NOT_FOUND')) {
    return {
      status: 502,
      message: `${featureLabel} analysis model is temporarily unavailable. Please try again shortly.`,
    };
  }

  return {
    status: 502,
    message: `${featureLabel} analysis could not be completed right now. Please try again shortly.`,
  };
}
