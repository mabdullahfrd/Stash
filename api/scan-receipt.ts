/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ApiRequest, type ApiResponse, handleScanReceipt } from '../server/geminiHandlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await handleScanReceipt(req, res);
  } catch (err) {
    console.error('Unhandled /api/scan-receipt error:', err);
    return res.status(500).json({
      error: 'Receipt scanning failed unexpectedly on the server. Please try again.',
    });
  }
}
