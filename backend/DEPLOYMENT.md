# Backend API Deployment Guide

## Quick Start for Vercel

### 1. Create Vercel Postgres Database

1. Go to your Vercel Dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Create a new Postgres database
4. Copy the connection strings:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

### 2. Run Database Migration

**Option A: Using Vercel Dashboard**
1. Go to your database in Vercel
2. Click on **SQL Editor**
3. Copy and paste the contents of `database/schema.sql`
4. Execute the SQL

**Option B: Using psql (Local)**
```bash
# Get connection string from Vercel
psql "YOUR_POSTGRES_URL" -f ../../database/schema.sql
```

**Option C: Using Migration Script**
```bash
cd backend
npm install
# Set POSTGRES_URL in .env
npm run migrate
```

### 3. Deploy Backend to Vercel

**Option A: Vercel CLI**
```bash
cd backend
npm install -g vercel
vercel
# Follow prompts
# Set environment variables when prompted
```

**Option B: GitHub Integration**
1. Push backend folder to GitHub
2. In Vercel Dashboard → **Add New Project**
3. Import the backend repository
4. Configure:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4. Set Environment Variables in Vercel

In your Vercel project settings → Environment Variables, add:

```
POSTGRES_URL=your_postgres_url_from_vercel
POSTGRES_PRISMA_URL=your_prisma_url_from_vercel
POSTGRES_URL_NON_POOLING=your_non_pooling_url_from_vercel
JWT_SECRET=generate-a-random-secure-string-here
CORS_ORIGIN=https://your-frontend-url.vercel.app
NODE_ENV=production
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Update Frontend Environment Variable

In your **frontend** Vercel project:
- Add/Update `VITE_API_URL` = `https://your-backend-api.vercel.app/api`

### 6. Test the API

After deployment, test the health endpoint:
```
GET https://your-backend-api.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (requires auth)
- `PATCH /api/auth/me` (requires auth)

### Entities
- `GET /api/entities/{entity}` - List
- `GET /api/entities/{entity}/:id` - Get one
- `POST /api/entities/{entity}` - Create
- `PATCH /api/entities/{entity}/:id` - Update
- `DELETE /api/entities/{entity}/:id` - Delete

Available entities:
- `wallet`
- `transaction`
- `recurring-transaction`
- `budget`
- `savings-goal`
- `investment`
- `debt`
- `family-member`
- `exchange-rate`
- `notification`
- `ai-recommendation`

### Files
- `POST /api/files/upload` (requires auth, multipart/form-data)
- `POST /api/files/signed-url` (requires auth)

## Troubleshooting

### Database Connection Issues
- Verify `POSTGRES_URL` is set correctly
- Check database is created and running in Vercel
- Ensure schema is migrated

### CORS Issues
- Update `CORS_ORIGIN` to match your frontend URL
- Include protocol (https://)

### Authentication Issues
- Verify `JWT_SECRET` is set
- Check token is sent in `Authorization: Bearer <token>` header

