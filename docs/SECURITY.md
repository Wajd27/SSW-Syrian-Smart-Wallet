# Security checklist (before pushing to GitHub)

## Never commit

- `backend/.env`, `.env`, `.env.local`, or any file containing real secrets
- Firebase **service account JSON** files (`*firebase-adminsdk*.json`)
- Private keys (`.pem`, etc.)
- `.firebase/` debug logs if they contain tokens

This repo’s `.gitignore` is set to ignore common cases; **verify** with:

```bash
git status
git check-ignore -v backend/.env
```

## Rotate if exposed

If any of these were ever committed or pasted in an issue:

- Firebase service account key → Google Cloud Console → IAM → delete key, create new
- `JWT_SECRET` → generate a new random value (invalidates existing user sessions)
- Supabase service role key → Supabase dashboard → rotate

## Production

- Set `NODE_ENV=production` on the API so `JWT_SECRET` is **required** (no dev fallback).
- Use HTTPS only for the API and frontend.
- Restrict Firestore: this project ships rules that **deny client SDK** access; only the Admin SDK used by your API should touch data (unless you intentionally add client rules later).
