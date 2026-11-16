/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiRequest, ApiResponse, handleScanReceipt } from '../server/geminiHandlers.ts';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  return handleScanReceipt(req, res);
}
