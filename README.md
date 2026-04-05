# Wallet Management PWA

A bilingual (Arabic and English) Progressive Web Application for personal finance: wallets, transactions, budgets, savings goals, investments, debts, and an AI-assisted assistant. The UI supports RTL for Arabic.

## Overview

| Area | Technology |
|------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Headless UI |
| Charts | Recharts |
| Internationalization | react-i18next |
| Data fetching & cache | TanStack Query; React Context where appropriate |
| Backend / data | REST API with Firebase Admin (Firestore); file uploads via Vercel Blob and/or Firebase Storage |
| Deployment | Vercel or any Node-compatible host for the API; static hosting for the PWA |

## Features

- Authentication and user management
- Wallets and transactions (including receipt upload)
- Recurring transactions
- Budgets and tracking
- Savings goals, investments, and debts
- Family members
- AI financial assistant
- Reports and analytics
- Notifications
- Arabic and English with RTL
- Installable PWA

## Prerequisites

- Node.js 18 or later and npm (or yarn)
- A Firebase project with Firestore enabled
- A Firebase service account JSON for server-side API access

## Installation

1. Clone the repository and install root dependencies:

```bash
npm install
```

2. **Frontend environment** — Copy `.env.example` to `.env` for local development. `npm run dev` loads `.env` and expects the API at `http://localhost:3001` by default.

```env
VITE_API_URL=http://localhost:3001/api
```

For production builds, `npm run build` uses **`.env.production`**. This repository’s default points the PWA at the hosted API (Vercel):

```env
VITE_API_URL=https://backend-flax-sigma-87.vercel.app/api
```

Change that URL if your backend is deployed elsewhere.

3. **Backend environment** — Copy `backend/.env.example` to `backend/.env` and set at least:

```env
JWT_SECRET=<a long random secret>
FIREBASE_PROJECT_ID=syriansmartwallet
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

The default Firebase project id above matches **`.firebaserc`** (`firebase use`). The value of `FIREBASE_PROJECT_ID` must match the `project_id` inside the service account JSON; the API validates this at startup. Generate the key in the Firebase Console under **Project settings → Service accounts → Generate new private key**. You may pass the JSON as a single line or use `GOOGLE_APPLICATION_CREDENTIALS` pointing to the file while still setting `FIREBASE_PROJECT_ID`. Storage defaults to `{projectId}.appspot.com`; override with `FIREBASE_STORAGE_BUCKET` if needed. Optional **Vercel Blob** for uploads is documented in `backend/.env.example` and `docs/DEPLOYMENT.md`.

4. Run the API:

```bash
cd backend
npm install
npm run dev
```

5. Run the PWA (from the repository root):

```bash
npm run dev
```

Data is stored in Firestore collections such as `users`, `wallets`, and `transactions`. The REST API shape is stable; transactions and budgets include an `owner_email` field for per-user queries.

## Firestore

Firestore creates collections on first write. This repository includes:

- `firestore.rules` — Denies direct client reads and writes; the Node API uses the Admin SDK and bypasses these rules. Deploy with the Firebase CLI.
- `firestore.indexes.json` — Composite indexes (extend if the console requests an index).
- Bootstrap: with `backend/.env` configured, run once to verify writes:

```bash
cd backend
npm run db:prepare
```

Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

After `db:prepare`, you may see a `system/bootstrap` document in the console; you can remove it if you prefer.

## Documentation

- [Deployment](docs/DEPLOYMENT.md) — Environment variables, hosting, Firestore deployment
- [Security](docs/SECURITY.md) — Checklist before publishing (secrets, rotation)

## Project structure

```
src/
├── app/                 # App shell, providers, routing
├── features/            # Feature modules (auth, dashboard, wallets, …)
├── shared/              # API client, components, hooks, i18n, types
├── data/
└── domain/
```

## Data model (high level)

The app models users, wallets, transactions, recurring transactions, budgets, savings goals, family members, exchange rates, notifications, AI recommendations, investments, and debts. A legacy PostgreSQL `schema.sql` under `database/` is reference-only; the live store is Firestore.

## Production build

Production builds read **`VITE_API_URL`** from `.env.production` (this repo defaults to `https://backend-flax-sigma-87.vercel.app/api`). Update that file if your API hostname changes.

```bash
npm run build
```

Output is written to `dist/`. Deploy static assets with Firebase Hosting (`firebase deploy --only hosting`) or another static host after `firebase login` and project selection (default project in `.firebaserc` is `syriansmartwallet`).

## License

This project is licensed under the [MIT License](LICENSE).

Third-party libraries are subject to their respective licenses; see each package’s `package.json` and upstream notices.
