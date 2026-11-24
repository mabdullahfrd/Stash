/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleParseBankScreenshot } from '../server/geminiHandlers.mjs';

export default async function handler(req, res) {
  try {
    return await handleParseBankScreenshot(req, res);
  } catch (err) {
    console.error('Unhandled /api/parse-bank-screenshot error:', err);
    return res.status(500).json({
      error: 'Screenshot parsing failed unexpectedly on the server. Please try again.',
    });
  }
}
