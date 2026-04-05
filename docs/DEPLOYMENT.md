# Deployment

## Stack

- **Frontend (PWA):** Vite build → static `dist/` (Firebase Hosting, Vercel, or any static host).
- **Backend (API):** Node + Express on Vercel, Cloud Run, Railway, etc.
- **Data:** Google Firestore (Firebase project).
- **Files (optional):** Firebase Storage or Supabase Storage (env-driven).

## Environment variables

### Frontend (`.env` at repo root)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL of the API (e.g. `https://your-api.example.com/api`) |

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `JWT_SECRET` | Yes (prod) | Signing key for JWTs; use a long random string |
| `FIREBASE_PROJECT_ID` | Recommended | Must match the service account project |
| `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS` | Yes | Firebase Admin credentials |
| `CORS_ORIGIN` | Optional | Frontend origin if not using defaults in code |
| `FIREBASE_STORAGE_BUCKET` | Optional | Defaults to `{projectId}.appspot.com` |
| `SUPABASE_*` | Optional | Only if using Supabase for file uploads instead of Firebase Storage |

See `backend/.env.example` for examples.

## Firestore

Deploy rules and indexes from the repo root:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Bootstrap check (writes `system/bootstrap` once):

```bash
cd backend && npm run db:prepare
```

## Hosting the PWA

Build, then deploy `dist/`:

```bash
npm run build
firebase deploy --only hosting
```

## Backend on Vercel

Set the same backend env vars in the Vercel project. The app exports the Express `app` for serverless (`vercel.json` in `backend/` if present).
