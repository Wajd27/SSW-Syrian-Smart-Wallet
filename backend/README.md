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
- `POST /api/files/upload` - Upload file
- `POST /api/files/signed-url` - Get signed URL for file

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
- `POSTGRES_URL` - From Vercel Postgres
- `JWT_SECRET` - Generate a secure random string
- `CORS_ORIGIN` - Your frontend URL
- `NODE_ENV` - `production`

