/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  classifyGeminiApiError,
  normalizeBankScreenshotOutput,
  normalizeReceiptOutput,
  parseModelJsonResponse,
  SlidingWindowRateLimiter,
  validateBankScreenshotRequest,
  validateScanReceiptRequest,
} from './geminiValidation.mjs';

const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0154914697';
const perUserLimiter = new SlidingWindowRateLimiter(20, 60 * 60 * 1000);

/**
 * @returns {string}
 */
function resolveProjectId() {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }
  /** @type {Array<URL | string>} */
  const candidatePaths = [];
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    candidatePaths.push(new URL('../firebase-applet-config.json', import.meta.url));
  }
  candidatePaths.push(path.resolve(process.cwd(), 'firebase-applet-config.json'));

  for (const configPath of candidatePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (parsed && typeof parsed.projectId === 'string' && parsed.projectId) {
          return parsed.projectId;
        }
      }
    } catch (err) {
      console.error('Failed to read firebase-applet-config.json for projectId:', err);
    }
  }
  return DEFAULT_FIREBASE_PROJECT_ID;
}

function getFirebaseAdminAuth() {
  if (getApps().length === 0) {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountRaw) {
      try {
        const serviceAccount = JSON.parse(serviceAccountRaw);
        initializeApp({
          credential: cert(serviceAccount),
        });
      } catch (err) {
        console.error('Invalid FIREBASE_SERVICE_ACCOUNT JSON, falling back to projectId:', err);
        initializeApp({ projectId: resolveProjectId() });
      }
    } else {
      initializeApp({ projectId: resolveProjectId() });
    }
  }
  return getAuth(getApp());
}

/**
 * @param {Record<string, string | string[] | undefined>} [headers]
 * @returns {string | null}
 */
function extractBearerToken(headers) {
  if (!headers) return null;
  const authHeader = headers.authorization ?? headers.Authorization;
  const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (typeof raw !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match ? match[1].trim() : null;
}

/**
 * @param {{ method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }} req
 * @param {{ status(code: number): any; json(data: unknown): unknown; setHeader?(name: string, value: string): unknown }} res
 * @returns {Promise<string | null>}
 */
async function verifyAuthenticatedUser(req, res) {
  const token = extractBearerToken(req.headers);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in to use AI scanning.' });
    return null;
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (err) {
    console.error('Firebase ID token verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired sign-in session. Please sign in again.' });
    return null;
  }
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * @param {unknown} body
 * @returns {Record<string, unknown>}
 */
function parseBodyObject(body) {
  if (!body) return {};
  if (Buffer.isBuffer(body)) {
    try {
      const parsed = JSON.parse(body.toString('utf8'));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof body === 'object') {
    return /** @type {Record<string, unknown>} */ (body);
  }
  return {};
}

/**
 * @param {{ method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }} req
 * @param {{ status(code: number): any; json(data: unknown): unknown; setHeader?(name: string, value: string): unknown }} res
 */
export async function handleScanReceipt(req, res) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyAuthenticatedUser(req, res);
  if (!uid) return;

  const rateCheck = perUserLimiter.check(uid);
  if (!rateCheck.allowed) {
    res.setHeader?.('Retry-After', String(rateCheck.retryAfterSeconds));
    return res.status(429).json({
      error: 'Too many scan requests. Please wait a little while before scanning more receipts.',
    });
  }

  const body = parseBodyObject(req.body);
  const validation = validateScanReceiptRequest(body);
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error });
  }

  const { mimeType, cleanBase64, merchantHint, targetCurrency, today } = validation.value;

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Receipt scanning is temporarily unavailable because GEMINI_API_KEY is not configured on the server.',
    });
  }

  try {
    const prompt = `Analyze this shopping or cafe receipt image.
Extract the store merchant name, date (YYYY-MM-DD, fallback to ${today} if unclear), totalAmount, and every line item purchased with its exact price and best category.
Primary currency: ${targetCurrency}.
Allowed category names:
- "Groceries (Eggs, Bread, Milk)" (eggs, bread, milk, produce, convenience groceries)
- "Coffee" (espresso, latte, americano, cold brew, cafe coffee runs)
- "Drinks & Beverages" (tea, matcha, boba, juice, smoothies, soda, energy drinks, bottled drinks)
- "Ice Cream" (ice cream, gelato, bingsu, popsicles, soft serve, Baskin Robbins)
- "Treats & Snacks" (cookies, chocolate, cake, macarons, donuts, pastries, candy, chips)
- "Dining & Takeout" (meals, restaurant food, delivery, takeout)
- "Study & Uni Gear" (stationery, books, notebooks, campus supplies)
- "Transit & Metro" (subway, bus, taxi, T-money)
- "Travel & Flights" (flights, hotels, KTX, airport rail, travel)
- "Bills & Rent" (utilities, phone, internet, rent)
- "Subscriptions" (software, music, streaming, memberships)
- "Health" (pharmacy, clinic, medicine, doctor)
- "Fitness & Sports" (gym, pilates, sports, workout gear)
- "Beauty & Personal Care" (Olive Young, skincare, cosmetics, salon)
- "Entertainment & Events" (movies, concerts, tickets, events)
- "Shopping" (clothing, accessories, retail)
- "Tech & Software" (electronics, chargers, laptops, apps)
- "Household & Laundry" (detergent, tissue, cleaning, home items)
- "Gifts & Occasions" (gifts, flowers, presents)
- "Savings & Goals" (savings transfers or goal deposits)
- "Charity & Giving" (donations, zakat, charity)
- "Uncategorized" (anything else)`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: prompt },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING, description: 'Store or cafe merchant name' },
            totalAmount: { type: Type.NUMBER, description: 'Total receipt amount' },
            currency: { type: Type.STRING, description: 'ISO currency code, e.g. KRW or USD' },
            date: { type: Type.STRING, description: 'Receipt date in YYYY-MM-DD format' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Line item name' },
                  price: { type: Type.NUMBER, description: 'Line item price as positive number' },
                  category: { type: Type.STRING, description: 'Best matching expense category name' },
                },
                required: ['name', 'price', 'category'],
              },
            },
          },
          required: ['merchant', 'items'],
        },
      },
    });

    const parsedJson = parseModelJsonResponse(response.text);
    if (!parsedJson.ok) {
      console.error('Receipt scan JSON.parse error:', parsedJson.error);
      return res.status(502).json({
        error: 'Could not read the structured receipt response. Please try again with a clearer image.',
      });
    }

    const normalized = normalizeReceiptOutput(parsedJson.data, today, targetCurrency, merchantHint);
    if (!normalized) {
      return res.status(422).json({
        error: 'Could not detect clear line items in this receipt image. Please try a sharper photo or add items manually.',
      });
    }

    return res.status(200).json(normalized);
  } catch (error) {
    console.error('Receipt scan error:', error);
    const classified = classifyGeminiApiError(error, 'Receipt');
    return res.status(classified.status).json({
      error: classified.message,
    });
  }
}

/**
 * @param {{ method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> }} req
 * @param {{ status(code: number): any; json(data: unknown): unknown; setHeader?(name: string, value: string): unknown }} res
 */
export async function handleParseBankScreenshot(req, res) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyAuthenticatedUser(req, res);
  if (!uid) return;

  const rateCheck = perUserLimiter.check(uid);
  if (!rateCheck.allowed) {
    res.setHeader?.('Retry-After', String(rateCheck.retryAfterSeconds));
    return res.status(429).json({
      error: 'Too many scan requests. Please wait a little while before scanning more screenshots.',
    });
  }

  const body = parseBodyObject(req.body);
  const validation = validateBankScreenshotRequest(body);
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error });
  }

  const { mimeType, cleanBase64, bankHint, targetCurrency, today } = validation.value;

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Screenshot import is temporarily unavailable because GEMINI_API_KEY is not configured on the server.',
    });
  }

  try {
    const prompt = `Analyze this mobile banking or payment history screenshot (for example Toss / 토스 / 토스뱅크 / Hana Bank / 하나은행 / 1Q).
Extract EVERY transaction row shown in the screenshot.
Rules:
- Identify the bank app shown: set bankHint to "toss" for Toss/Toss Bank, "hana" for Hana Bank/1Q, or "other".
- Amounts in banking apps may look like "-4,500원" or "4,500원 출금" (expense) or "+120,000원" or "입금" (income). Return "amount" as a positive number and set "type" to "expense" or "income".
- Parse dates into YYYY-MM-DD (assume year ${today.slice(0, 4)} if month/day like "11.14" or "11월 14일" is shown; fallback to ${today} if no date appears).
- Assign "category" from:
  Expense: "Groceries (Eggs, Bread, Milk)", "Coffee", "Drinks & Beverages", "Ice Cream", "Treats & Snacks", "Dining & Takeout", "Study & Uni Gear", "Transit & Metro", "Travel & Flights", "Bills & Rent", "Subscriptions", "Health", "Fitness & Sports", "Beauty & Personal Care", "Entertainment & Events", "Shopping", "Tech & Software", "Household & Laundry", "Gifts & Occasions", "Savings & Goals", "Charity & Giving", "Uncategorized".
  Income: "Work Placement & Salary", "Tutoring & Campus Job", "Allowance & Inflow", "Freelance & Side Gig", "Scholarship & Grants", "Interest & Dividends", "Refunds & Cashback", "Uncategorized".
- Primary currency fallback: ${targetCurrency}. Optional user hint: ${bankHint}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: prompt },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bankName: { type: Type.STRING, description: 'Detected bank or payment app name' },
            bankHint: { type: Type.STRING, description: 'toss | hana | other' },
            currency: { type: Type.STRING, description: 'Currency code such as KRW or USD' },
            entries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  merchant: { type: Type.STRING, description: 'Merchant, counterparty, or item description' },
                  amount: { type: Type.NUMBER, description: 'Positive numeric transaction amount' },
                  type: { type: Type.STRING, description: 'expense or income' },
                  date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
                  category: { type: Type.STRING, description: 'Matched category name' },
                  notes: { type: Type.STRING, description: 'Optional subtext or memo from screenshot' },
                },
                required: ['merchant', 'amount', 'type', 'date', 'category'],
              },
            },
          },
          required: ['bankHint', 'entries'],
        },
      },
    });

    const parsedJson = parseModelJsonResponse(response.text);
    if (!parsedJson.ok) {
      console.error('Bank screenshot JSON.parse error:', parsedJson.error);
      return res.status(502).json({
        error: 'Could not read the structured screenshot response. Please try again with a clearer image.',
      });
    }

    const normalized = normalizeBankScreenshotOutput(parsedJson.data, today, targetCurrency);
    if (!normalized) {
      return res.status(422).json({
        error: 'No payment rows were detected in this screenshot. Make sure it is a banking/payment history screen (for paper store receipts, use the Store Receipt tab).',
      });
    }

    return res.status(200).json(normalized);
  } catch (error) {
    console.error('Bank screenshot parse error:', error);
    const classified = classifyGeminiApiError(error, 'Screenshot');
    return res.status(classified.status).json({
      error: classified.message,
    });
  }
}
