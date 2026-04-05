# Wallet Management PWA

A bilingual (Arabic/English) Progressive Web App for comprehensive wallet management with features including transactions, budgets, savings goals, investments, debts, and AI-powered financial assistance.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS + Headless UI
- **Charts**: Recharts
- **i18n**: react-i18next
- **State Management**: React Context + TanStack Query
- **Database**: Google Cloud Firestore (via Firebase Admin SDK on the API)
- **Deployment**: Vercel (or any Node host)

## Features

- 🔐 Authentication & User Management
- 💰 Wallet Management
- 💳 Transactions (with receipt upload)
- 🔄 Recurring Transactions
- 📊 Budgets & Tracking
- 🎯 Savings Goals
- 📈 Investments
- 💸 Debts Management
- 👨‍👩‍👧‍👦 Family Members
- 🤖 AI Financial Assistant
- 📋 Reports & Analytics
- 🔔 Notifications System
- 🌐 Bilingual Support (Arabic/English) with RTL
- 📱 PWA Support

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Firebase project with **Firestore** enabled
- Service account JSON for the Firebase project (for the API)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Environment for the PWA (Vite):
   - **Local dev:** copy `.env.example` to `.env` (or keep the default below). `npm run dev` loads `.env` and talks to the API on `http://localhost:3001`.
   - **Production build:** `npm run build` uses **`.env.production`**, which points at the hosted API: `https://backend-flax-sigma-87.vercel.app/api`. Update that file if your Vercel domain changes.

```env
VITE_API_URL=http://localhost:3001/api
```

4. Configure the **API** (`backend/.env`). Copy `backend/.env.example` to `backend/.env` and set:

```env
JWT_SECRET=your-long-random-secret
FIREBASE_PROJECT_ID=syriansmartwallet
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**Same project everywhere:** The service account JSON is tied to one GCP project (`project_id` inside the JSON). Set `FIREBASE_PROJECT_ID` to that same id (for this repo, **`syriansmartwallet`** — same as `.firebaserc` / `firebase use`). The API checks at startup that `FIREBASE_PROJECT_ID` matches the key’s `project_id`, so the backend cannot silently use a different Firestore than your CLI-selected project.

Generate the key in [Firebase Console](https://console.firebase.google.com/) → **Project settings** → **Service accounts** → **Generate new private key**.

Paste the full JSON as a **single line**, or use `GOOGLE_APPLICATION_CREDENTIALS` pointing to the JSON file (still set `FIREBASE_PROJECT_ID` for the check). Storage defaults to `{projectId}.appspot.com`; override with `FIREBASE_STORAGE_BUCKET` if needed. For uploads you can keep using Supabase instead by only setting Supabase env vars and leaving the bucket as default.

5. Start the API (from `backend/`):

```bash
cd backend
npm install
npm run dev
```

6. Start the development server for the PWA:
```bash
npm run dev
```

Data is stored in Firestore collections such as `users`, `wallets`, `transactions`, and related entity collections. The API keeps the same REST shape as before; transactions and budgets store an `owner_email` field for efficient per-user queries.

### Firestore setup (database)

Firestore has no fixed schema; collections are created when the API first writes. This repo includes:

- **`firestore.rules`** – Denies direct **client** reads/writes (the Node API uses the Admin SDK and bypasses rules). Deploy with Firebase CLI.
- **`firestore.indexes.json`** – Composite indexes (empty by default; add entries if the console prompts for an index).
- **Bootstrap script** – After `backend/.env` is configured, run once to verify writes:

```bash
cd backend
npm run db:prepare
```

Deploy rules and indexes to your Firebase project (same project as `.firebaserc`):

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

In the Firebase Console you should see Firestore enabled and, after `db:prepare`, a `system/bootstrap` document you can delete if you want.

### Documentation

- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — env vars, hosting, Firestore deploy
- **[docs/SECURITY.md](docs/SECURITY.md)** — checklist before pushing to GitHub (secrets, rotation)

## Project Structure

```
src/
├── app/                    # App configuration & providers
├── features/               # Feature-based modules
│   ├── auth/
│   ├── dashboard/
│   ├── wallets/
│   ├── transactions/
│   ├── recurring/
│   ├── budgets/
│   ├── savings-goals/
│   ├── investments/
│   ├── debts/
│   ├── family/
│   ├── ai-assistant/
│   ├── reports/
│   └── settings/
├── shared/                 # Shared utilities
│   ├── api/               # API client & services
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities
│   ├── types/            # TypeScript types
│   └── i18n/             # Translation files
├── data/                  # Data layer
└── domain/                # Business logic
```

## Database schema

Data lives in **Firestore** (see collections above). A legacy **PostgreSQL** `schema.sql` under `database/` is reference-only.

The application uses 12 main entities:
- User
- Wallet
- Transaction
- RecurringTransaction
- Budget
- SavingsGoal
- FamilyMember
- ExchangeRate
- Notification
- AIRecommendation
- Investment
- Debt

## API Integration

The app uses a RESTful API pattern. **Development:** set `VITE_API_URL` in `.env`. **Production:** set `VITE_API_URL` in `.env.production` (current hosted API: `https://backend-flax-sigma-87.vercel.app/api`).

## Building for Production

Uses `.env.production` so the bundle calls the Vercel backend (not localhost).

```bash
npm run build
```

Output is in `dist/`. Deploy to Firebase Hosting with `firebase deploy --only hosting` (after `firebase login` and correct project).

## License

MIT

