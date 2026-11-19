# Stash — Personal Finance & Receipt Tracker

KRW-first personal finance PWA with multi-currency tracking (`KRW`, `USD`, `EUR`, `PKR`), Toss/Hana bank screenshot parsing, itemized receipt scanning, charity pledge tracking, and real-time Firebase Auth & Firestore sync.

## Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS 4, TypeScript (`strict: true`), `vite-plugin-pwa`
- **Backend / Serverless**: Express (`server.ts`) & Vercel Functions (`api/scan-receipt.ts`, `api/parse-bank-screenshot.ts`)
- **AI Extraction**: `@google/genai` (`gemini-4-hydrogen`) for store receipt itemization & Toss/Hana bank screenshot parsing
- **Auth & Persistence**: Firebase Authentication (Google OAuth + Email/Password) and Cloud Firestore (`persistentLocalCache`)

## Local Development

```bash
npm install
cp .env.example .env
# Populate GEMINI_API_KEY (and FIREBASE_SERVICE_ACCOUNT if testing signed-in AI endpoints locally)
npm run dev
```

App runs on `http://localhost:3000`.

## Scripts

- `npm run dev` — Start Express + Vite middleware dev server on port 3000
- `npm test` — Run `node:test` unit suites (`src/utils/*.test.ts`)
- `npm run lint` — TypeScript check (`tsc --noEmit`)
- `npm run build` — Build production bundle + Service Worker (`dist/`)
- `npm run clean` — Cross-platform cleanup of `dist/` and `dev-dist/`

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes (server) | Server-side Gemini API access for `/api/scan-receipt` and `/api/parse-bank-screenshot` |
| `FIREBASE_SERVICE_ACCOUNT` | Yes in prod (Vercel/Node) | Service account JSON string (or ADC) for verifying `Authorization: Bearer <ID token>` via `firebase-admin` |
| `APP_URL` | Optional | Origin URL when running behind custom hosts |

Never expose `GEMINI_API_KEY` or `FIREBASE_SERVICE_ACCOUNT` to the client (`VITE_*`).

## Deployment (Vercel + Firebase)

1. Push the repository to Vercel (`vercel.json` configures `vite` build, SPA rewrites excluding `/api/*`, and `maxDuration: 30` for serverless functions).
2. Add `GEMINI_API_KEY` and `FIREBASE_SERVICE_ACCOUNT` in Vercel Project Environment Variables.
3. Deploy `firestore.rules` to your Firebase project (`firebase deploy --only firestore:rules`).
4. In Firebase Console → Authentication → Settings → **Authorized domains**, add your production domain (e.g., `stash-v1.vercel.app`).
5. Restrict your Firebase Web API key in Google Cloud Console (HTTP referrers + Firebase Auth/Firestore APIs only) and consider enabling Firebase App Check.
