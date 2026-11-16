/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleParseBankScreenshot, handleScanReceipt } from './server/geminiHandlers.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Smart AI Receipt Scanner endpoint
app.post('/api/scan-receipt', (req, res) => {
  void handleScanReceipt(req, res);
});

// Smart AI Toss / Korean Bank Payment History Screenshot Parser
app.post('/api/parse-bank-screenshot', (req, res) => {
  void handleParseBankScreenshot(req, res);
});

// Vite middleware in development
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const hmrDisabled = process.env.DISABLE_HMR === 'true';
  const vite = await createServer({
    server: {
      middlewareMode: true,
      ws: hmrDisabled ? false : { server: httpServer },
      hmr: hmrDisabled ? false : { server: httpServer },
      watch: hmrDisabled ? null : {},
    },
    appType: 'spa',
  });

  if (hmrDisabled) {
    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result) return next();
        const code = result.code.replace(
          /let wsTransport = createWebSocketModuleRunnerTransport\(\{[\s\S]*?\}\);/,
          'let wsTransport = { async connect() {}, async disconnect() {}, send() {} };'
        );
        res.status(200).setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.send(code);
      } catch (err) {
        next(err);
      }
    });
  }

  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`Stash Mobile App server running on port ${PORT}`);
});
