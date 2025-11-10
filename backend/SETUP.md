# Backend Setup Instructions

## Step 1: Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Storage** in the left sidebar
3. Click **Create Database** → Select **Postgres**
4. Choose a name for your database (e.g., "wallet-db")
5. Select a region closest to you
6. Click **Create**

## Step 2: Get Database Connection Strings

After creating the database:

1. Click on your database name
2. Go to the **.env.local** tab
3. Copy these three connection strings:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL` 
   - `POSTGRES_URL_NON_POOLING`

## Step 3: Run Database Schema

**Option A: Using Vercel SQL Editor (Easiest)**

1. In your database page, click on **SQL Editor** tab
2. Click **New Query**
3. Open the file `database/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for all statements to execute

**Option B: Using psql Command Line**

```bash
# Install psql if you don't have it
# On Windows: Download from https://www.postgresql.org/download/windows/
# On Mac: brew install postgresql
# On Linux: sudo apt-get install postgresql-client

# Run the schema
psql "YOUR_POSTGRES_URL_NON_POOLING" -f database/schema.sql
```

**Option C: Using Migration Script**

```bash
cd backend
npm install
# Create .env file with POSTGRES_URL
npm run migrate
```

## Step 4: Deploy Backend to Vercel

### Option A: Deploy via Vercel Dashboard

1. In Vercel Dashboard, click **Add New Project**
2. Import your GitHub repository
3. Configure the project:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add Environment Variables:
   - `POSTGRES_URL` = (from Step 2)
   - `POSTGRES_PRISMA_URL` = (from Step 2)
   - `POSTGRES_URL_NON_POOLING` = (from Step 2)
   - `JWT_SECRET` = (generate a random string - see below)
   - `CORS_ORIGIN` = `https://your-frontend-url.vercel.app`
   - `NODE_ENV` = `production`
5. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
cd backend
npm install -g vercel
vercel
# Follow the prompts
# When asked for environment variables, add them
```

## Step 5: Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET` environment variable.

## Step 6: Update Frontend Environment Variable

1. Go to your **frontend** Vercel project
2. Settings → Environment Variables
3. Add/Update `VITE_API_URL` = `https://your-backend-api.vercel.app/api`
4. Redeploy the frontend

## Step 7: Test the Setup

1. Test backend health:
   ```
   GET https://your-backend-api.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. Test registration:
   ```
   POST https://your-backend-api.vercel.app/api/auth/register
   Body: {
     "email": "test@example.com",
     "password": "password123",
     "full_name": "Test User"
   }
   ```

3. Test login:
   ```
   POST https://your-backend-api.vercel.app/api/auth/login
   Body: {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

## Troubleshooting

### Database Connection Errors
- Verify `POSTGRES_URL` is correct
- Check database is running in Vercel
- Ensure schema is migrated

### CORS Errors
- Update `CORS_ORIGIN` to match your frontend URL exactly
- Include `https://` protocol

### Authentication Errors
- Verify `JWT_SECRET` is set
- Check token is sent in `Authorization: Bearer <token>` header

### Build Errors
- Ensure `backend` is set as root directory
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`

