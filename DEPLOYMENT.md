# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Vercel Postgres recommended)
- Vercel account (for deployment)

## Local Development Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
- `VITE_API_URL`: Your backend API URL
- `VITE_AI_API_URL`: Optional AI API URL
- `DATABASE_URL`: Database connection string (for backend)

5. Start the development server:
```bash
npm run dev
```

## Database Setup

1. Create a PostgreSQL database (Vercel Postgres or any PostgreSQL provider)
2. Run the schema from `database/schema.sql`:
```bash
psql -d your_database -f database/schema.sql
```

## Backend API

This frontend expects a REST API backend. The API should implement:

- `/api/auth/*` - Authentication endpoints
- `/api/entities/*` - CRUD operations for all entities
- `/api/files/*` - File upload/download endpoints

See `src/shared/api/` for the expected API structure.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deploying to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

The PWA will be automatically configured with service workers and offline support.

## PWA Features

- Service Worker for offline support
- App Manifest for installability
- Caching strategies for API calls
- Responsive design for mobile/tablet/desktop

## Environment Variables

Required:
- `VITE_API_URL`: Backend API URL

Optional:
- `VITE_AI_API_URL`: AI service URL
- `DATABASE_URL`: Database connection (for backend only)

