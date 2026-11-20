/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ApiRequest, type ApiResponse, handleParseBankScreenshot } from '../server/geminiHandlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await handleParseBankScreenshot(req, res);
  } catch (err) {
    console.error('Unhandled /api/parse-bank-screenshot error:', err);
    return res.status(500).json({
      error: 'Screenshot parsing failed unexpectedly on the server. Please try again.',
    });
  }
}
