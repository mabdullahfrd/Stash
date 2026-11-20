import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const buildId = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        devOptions: {
          enabled: false,
        },
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//, /^\/__\/auth\//],
        },
        manifest: {
          id: '/',
          name: 'Stash — Personal Finance Tracker',
          short_name: 'Stash',
          description:
            'Personal finance tracker in Korean Won with multi-currency and cloud sync.',
          theme_color: '#141617',
          background_color: '#0D0F0C',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
      }),
    ],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'firebase',
                test: /node_modules[\\/](?:@?firebase)/,
              },
              {
                name: 'react-vendor',
                test: /node_modules[\\/](?:react|react-dom|scheduler)/,
              },
              {
                name: 'icons',
                test: /node_modules[\\/]lucide-react/,
              },
              {
                name: 'zod',
                test: /node_modules[\\/]zod/,
              },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
