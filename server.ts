/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { handleParseBankScreenshot, handleScanReceipt } from './server/geminiHandlers.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(compression());
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://apis.google.com',
          'https://www.gstatic.com',
          'https://*.firebaseapp.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: [
          "'self'",
          'https://*.googleapis.com',
          'https://*.gstatic.com',
          'https://*.firebaseapp.com',
          'https://identitytoolkit.googleapis.com',
          'https://securetoken.googleapis.com',
          'https://firestore.googleapis.com',
          'https://firebasestorage.googleapis.com',
          'https://open.er-api.com',
          'https://api.frankfurter.app',
        ],
        frameSrc: [
          "'self'",
          'https://*.firebaseapp.com',
          'https://accounts.google.com',
        ],
      },
    },
  })
);

app.use(express.json({ limit: '6mb' }));

// Return clean JSON error on oversized or malformed JSON bodies
app.use(
  (
    err: { type?: string; status?: number },
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err?.type === 'entity.too.large' || err?.status === 413) {
      res.status(413).json({ error: 'Request payload exceeds the 6 MB upload limit.' });
      return;
    }
    if (err?.type === 'entity.parse.failed' || err?.status === 400) {
      res.status(400).json({ error: 'Malformed JSON request body.' });
      return;
    }
    next(err);
  }
);

// Smart AI Receipt Scanner endpoint
app.post('/api/scan-receipt', (req, res) => {
  void handleScanReceipt(req, res);
});

// Smart AI Toss / Korean Bank Payment History Screenshot Parser
app.post('/api/parse-bank-screenshot', (req, res) => {
  void handleParseBankScreenshot(req, res);
});

// Unknown /api/* routes return 404 JSON
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
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
  const distDir = path.resolve(__dirname, 'dist');
  app.use(
    express.static(distDir, {
      setHeaders: (res, filePath) => {
        const fileName = path.basename(filePath);
        if (
          fileName === 'sw.js' ||
          fileName === 'registerSW.js' ||
          fileName === 'manifest.webmanifest' ||
          fileName === 'index.html' ||
          fileName.startsWith('workbox-')
        ) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    })
  );
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`Stash Mobile App server running on port ${PORT}`);
});
