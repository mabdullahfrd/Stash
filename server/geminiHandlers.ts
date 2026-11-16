/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export interface ApiRequest {
  method?: string;
  body?: unknown;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(data: unknown): unknown;
}

function getGeminiClient(): GoogleGenAI | null {
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

function parseDataUrlImage(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(dataUrl.trim());
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return {
    mimeType: 'image/jpeg',
    data: dataUrl.replace(/^data:image\/\w+;base64,/, ''),
  };
}

function parseBodyObject(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof body === 'object') {
    return body as Record<string, unknown>;
  }
  return {};
}

export async function handleScanReceipt(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = parseBodyObject(req.body);
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
    const merchantHint = typeof body.merchantHint === 'string' ? body.merchantHint : '';
    const targetCurrency = typeof body.targetCurrency === 'string' ? body.targetCurrency : 'KRW';

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Set GEMINI_API_KEY in environment variables, or try a sample receipt below.',
      });
    }

    const { mimeType, data: cleanBase64 } = parseDataUrlImage(imageBase64);
    const prompt = `Analyze this shopping or cafe receipt image.
Extract the store merchant name, date (YYYY-MM-DD, fallback to today if unclear), totalAmount, and every line item purchased with its exact price and best category.
Primary currency: ${targetCurrency}.
Allowed category names:
- "Groceries (Eggs, Bread, Milk)" (eggs, bread, milk, produce, convenience groceries)
- "Coffee & Drinks" (coffee, latte, americano, tea, juice, cafe drinks)
- "Ice Cream & Treats" (ice cream, gelato, dessert, pastry, snacks)
- "Dining & Takeout" (meals, restaurant food, delivery, takeout)
- "Study & Uni Gear" (stationery, books, notebooks, campus supplies)
- "Transit & Metro" (subway, bus, taxi, T-money)`;

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

    const parsed = JSON.parse((response.text || '{}').trim());
    if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return res.status(422).json({
        error: 'Could not detect clear line items in this receipt image. Please try a sharper photo or add items manually.',
      });
    }

    return res.status(200).json({
      merchant: parsed.merchant || merchantHint || 'Scanned Store',
      totalAmount: parsed.totalAmount || 0,
      currency: parsed.currency || targetCurrency,
      date: parsed.date || new Date().toISOString().split('T')[0],
      items: parsed.items,
    });
  } catch (error: unknown) {
    console.error('Receipt scan error:', error);
    const errObj = error as { status?: number; message?: string };
    const status = typeof errObj?.status === 'number' ? errObj.status : 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: errObj?.message || 'Failed to parse receipt image via Gemini API.',
    });
  }
}

export async function handleParseBankScreenshot(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = parseBodyObject(req.body);
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
    const bankHint = typeof body.bankHint === 'string' ? body.bankHint : 'auto';
    const targetCurrency = typeof body.targetCurrency === 'string' ? body.targetCurrency : 'KRW';

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Set GEMINI_API_KEY in environment variables, or load the sample Toss payment history.',
      });
    }

    const { mimeType, data: cleanBase64 } = parseDataUrlImage(imageBase64);
    const today = new Date().toISOString().split('T')[0];

    const prompt = `Analyze this mobile banking or payment history screenshot (for example Toss / 토스 / 토스뱅크 / Hana Bank / 하나은행 / 1Q).
Extract EVERY transaction row shown in the screenshot.
Rules:
- Identify the bank app shown: set bankHint to "toss" for Toss/Toss Bank, "hana" for Hana Bank/1Q, or "other".
- Amounts in banking apps may look like "-4,500원" or "4,500원 출금" (expense) or "+120,000원" or "입금" (income). Return "amount" as a positive number and set "type" to "expense" or "income".
- Parse dates into YYYY-MM-DD (assume year ${today.slice(0, 4)} if month/day like "11.14" or "11월 14일" is shown; fallback to ${today} if no date appears).
- Assign "category" from:
  Expense: "Groceries (Eggs, Bread, Milk)", "Coffee & Drinks", "Ice Cream & Treats", "Dining & Takeout", "Study & Uni Gear", "Transit & Metro", "Charity & Giving", "Pocket Transfer".
  Income: "Work Placement & Salary", "Tutoring & Campus Job", "Allowance & Inflow".
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

    const parsed = JSON.parse((response.text || '{}').trim());
    if (!parsed.entries || !Array.isArray(parsed.entries) || parsed.entries.length === 0) {
      return res.status(422).json({
        error: 'No payment rows were detected in this screenshot. Make sure the transaction list and amounts are legible.',
      });
    }

    return res.status(200).json({
      bankName: parsed.bankName || 'Toss Bank',
      bankHint: parsed.bankHint || 'toss',
      currency: parsed.currency || targetCurrency,
      entries: parsed.entries,
    });
  } catch (error: unknown) {
    console.error('Bank screenshot parse error:', error);
    const errObj = error as { status?: number; message?: string };
    const status = typeof errObj?.status === 'number' ? errObj.status : 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: errObj?.message || 'Failed to parse bank screenshot via Gemini API.',
    });
  }
}
