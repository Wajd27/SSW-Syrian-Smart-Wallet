# Wallet Management API

Backend API for the Wallet Management PWA application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables:
- `POSTGRES_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CORS_ORIGIN`: Frontend URL (e.g., http://localhost:3000)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for server-side operations)
- `SUPABASE_BUCKET_NAME`: Storage bucket name (default: `uploads`)

4. Run database migrations:
```bash
npm run migrate
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update current user
- `POST /api/auth/logout` - Logout

### Entities
- `GET /api/entities/{entity}` - List entities
- `GET /api/entities/{entity}/:id` - Get entity by ID
- `POST /api/entities/{entity}` - Create entity
- `PATCH /api/entities/{entity}/:id` - Update entity
- `DELETE /api/entities/{entity}/:id` - Delete entity

Available entities:
- wallet
- transaction
- recurring-transaction
- budget
- savings-goal
- investment
- debt
- family-member
- exchange-rate
- notification
- ai-recommendation

### Files
- `POST /api/files/upload` - Upload file (max 2MB, any MIME type)
- `POST /api/files/signed-url` - Get signed URL for file

**Note:** File uploads use Supabase Storage. Make sure to:
1. Create a bucket named `uploads` (or set `SUPABASE_BUCKET_NAME`)
2. Configure bucket policies in Supabase Dashboard:
   - **Public Access**: Set to `public` if you want public URLs, or `private` for signed URLs only
   - **File Size Limit**: Set to 2MB (2097152 bytes)
   - **Allowed MIME Types**: Leave empty or set to `*/*` to allow any file type

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Environment Variables for Vercel

Set these in your Vercel project settings:
- `POSTGRES_URL` - From Vercel Postgres or Supabase
- `JWT_SECRET` - Generate a secure random string
- `CORS_ORIGIN` - Your frontend URL
- `NODE_ENV` - `production`
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SUPABASE_BUCKET_NAME` - Storage bucket name (default: `uploads`)

