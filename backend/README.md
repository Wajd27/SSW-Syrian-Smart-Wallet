# Wallet Management API

Node.js + Express API with **Firestore** (Firebase Admin SDK).

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env — see ../docs/DEPLOYMENT.md and ../docs/SECURITY.md
npm run dev
```

Listens on `http://localhost:3001` by default (`PORT` overrides).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with watch |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled `dist/index.js` |
| `npm run db:prepare` | Verify Firestore write (`system/bootstrap`) |

Full project documentation is in the repository root **README.md** and **`docs/`**.
