# Complete Setup Guide - Wallet Management PWA

This guide will walk you through setting up both the frontend and backend on Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Basic understanding of environment variables

---

## Part 1: Create Vercel Postgres Database

### Step 1.1: Create Database
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** in the left sidebar
3. Click **Create Database**
4. Select **Postgres**
5. Name it: `wallet-db` (or any name you prefer)
6. Choose a region (closest to you)
7. Click **Create**

### Step 1.2: Get Connection Strings
1. Click on your newly created database
2. Go to the **.env.local** tab
3. Copy these three values (you'll need them later):
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

### Step 1.3: Run Database Schema
1. Still in your database page, click **SQL Editor** tab
2. Click **New Query**
3. Open the file `database/schema.sql` from this project
4. Copy **ALL** the contents (Ctrl+A, Ctrl+C)
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for execution to complete
8. You should see success messages for all CREATE statements

✅ **Database is now ready!**

---

## Part 2: Deploy Backend API

### Step 2.1: Create Backend Project in Vercel
1. In Vercel Dashboard, click **Add New Project**
2. Import your GitHub repository: `SSW-Syrian-Smart-Wallet-`
3. Configure the project:
   - **Project Name**: `wallet-api` (or any name)
   - **Root Directory**: Click **Edit** → Enter `backend`
   - **Framework Preset**: Select **Other**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy** (don't worry about env vars yet)

### Step 2.2: Set Backend Environment Variables
1. After deployment starts, go to **Settings** → **Environment Variables**
2. Add these variables (one by one):

   **Required Variables:**
   ```
   POSTGRES_URL = (paste from Step 1.2)
   POSTGRES_PRISMA_URL = (paste from Step 1.2)
   POSTGRES_URL_NON_POOLING = (paste from Step 1.2)
   JWT_SECRET = (generate using command below)
   CORS_ORIGIN = https://your-frontend-url.vercel.app
   NODE_ENV = production
   ```

   **Generate JWT_SECRET:**
   - Open terminal/command prompt
   - Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Copy the output and use it as `JWT_SECRET`

3. For each variable:
   - Select **Production**, **Preview**, and **Development** environments
   - Click **Save**

### Step 2.3: Redeploy Backend
1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete
5. Copy your backend URL (e.g., `https://wallet-api.vercel.app`)

✅ **Backend is now deployed!**

---

## Part 3: Update Frontend Configuration

### Step 3.1: Update Frontend Environment Variable
1. Go to your **frontend** Vercel project (the one you already imported)
2. Go to **Settings** → **Environment Variables**
3. Add/Update:
   ```
   VITE_API_URL = https://your-backend-url.vercel.app/api
   ```
   (Replace `your-backend-url` with your actual backend URL from Step 2.3)

4. Select all environments and click **Save**

### Step 3.2: Redeploy Frontend
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for deployment to complete

✅ **Frontend is now connected to backend!**

---

## Part 4: Test Your Setup

### Test 1: Backend Health Check
Open in browser:
```
https://your-backend-url.vercel.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Test 2: Register a User
Use Postman, curl, or browser console:

```bash
POST https://your-backend-url.vercel.app/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Test User"
}
```

Should return user object and token.

### Test 3: Frontend App
1. Visit your frontend URL
2. Try to register/login
3. Check browser console for any errors

---

## Troubleshooting

### Backend won't deploy
- Check **Build Logs** in Vercel
- Verify `backend/package.json` exists
- Ensure Root Directory is set to `backend`

### Database connection errors
- Verify `POSTGRES_URL` is correct
- Check database is running in Vercel
- Ensure schema was migrated (Step 1.3)

### CORS errors
- Update `CORS_ORIGIN` to match your frontend URL exactly
- Include `https://` protocol
- Redeploy backend after changing

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check backend URL is accessible
- Ensure backend `/api/health` endpoint works
- Redeploy frontend after changing env var

### Authentication not working
- Verify `JWT_SECRET` is set in backend
- Check token is being sent in requests
- Look at browser Network tab for API errors

---

## Next Steps

1. ✅ Database created and schema migrated
2. ✅ Backend deployed and configured
3. ✅ Frontend connected to backend
4. 🎉 **Your app is ready to use!**

You can now:
- Register users
- Create wallets
- Add transactions
- Use all features of the app

---

## Quick Reference

**Backend API URL:** `https://your-backend-url.vercel.app/api`
**Frontend URL:** `https://your-frontend-url.vercel.app`

**Important Endpoints:**
- Health: `GET /api/health`
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Get User: `GET /api/auth/me` (requires auth)

**Environment Variables Needed:**

**Backend:**
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `NODE_ENV`

**Frontend:**
- `VITE_API_URL`

