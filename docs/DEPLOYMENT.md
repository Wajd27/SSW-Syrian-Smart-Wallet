# Deployment

## Stack

- **Frontend (PWA):** Vite build → static `dist/` (Firebase Hosting, Vercel, or any static host).
- **Backend (API):** Node + Express on Vercel, Cloud Run, Railway, etc.
- **Data:** Google Firestore (Firebase project).
- **Files (optional):** Vercel Blob (recommended when the API runs on Vercel), then Firebase Storage (env-driven).

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
| `BLOB_READ_WRITE_TOKEN` | Optional | **Vercel Blob** — set when you use Blob storage for uploads (see below) |
| `FIREBASE_STORAGE_BUCKET` | Optional | Firebase Storage bucket name; if omitted, defaults to `{FIREBASE_PROJECT_ID}.appspot.com` (same as Admin SDK init) |
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

After code changes, **redeploy** the Vercel project (or push to the connected Git branch) so the API serves the new build.

### Vercel Blob (images / uploads)

1. In [Vercel Dashboard](https://vercel.com) → your API project → **Storage** → **Blob** → create a store (or use an existing one).
2. Connect the store to the project so **`BLOB_READ_WRITE_TOKEN`** is available to serverless functions (or copy the read-write token into **Settings → Environment Variables** for Production / Preview).
3. Redeploy the backend. Uploads go to `POST /api/files/upload` and are stored under `{user id}/{filename}` (Firestore user document id, path-safe) as **public** blobs; URLs look like `https://….public.blob.vercel-storage.com/…`.

If `BLOB_READ_WRITE_TOKEN` is not set or Blob upload fails, the API uses Firebase Storage when Firebase Admin is configured.

## Admin users (exchange rates)

`POST /api/entities/exchange-rate` is restricted to Firestore users with **`role: "admin"`** (string on the `users/{userId}` document). Regular users still use `GET /api/entities/exchange-rate` for reads.

1. In Firebase Console → Firestore → open a user document under `users`.
2. Add or set field **`role`** = **`admin`** (string).
3. That user’s JWT session can POST new exchange rates; others receive **403 Forbidden**.

## Making security fixes live (checklist)

1. **Commit and push** changes to your Git remote.
2. **Backend:** deploy the API (e.g. Vercel dashboard → Deployments → Redeploy, or push to the production branch).
3. **Frontend:** run `npm run build` and deploy `dist/` (Firebase Hosting, Vercel, etc.); ensure `VITE_API_URL` points at the deployed API.
4. **Smoke test** login, one CRUD flow, and (if you use uploads) file signed URL for your own files only.
