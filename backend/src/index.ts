import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/connection.js';
import authRoutes from './routes/auth.js';
import entityRoutes from './routes/entities.js';
import fileRoutes from './routes/files.js';

dotenv.config();

const app = express();

// Middleware
// CORS configuration - allow both production and preview deployments
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'https://ssw-syrian-smart-wallet.vercel.app',
  'http://localhost:3000',
].filter(Boolean).map(origin => origin?.replace(/\/+$/, '')); // Remove trailing slashes

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origins or is a Vercel preview deployment
    const isAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      // Exact match
      if (origin === allowed) return true;
      // Match Vercel preview deployments (e.g., https://ssw-syrian-smart-wallet-*.vercel.app)
      if (allowed.includes('vercel.app') && origin.includes('vercel.app')) {
        const baseDomain = allowed.replace('https://', '').split('.')[0];
        const originBase = origin.replace('https://', '').split('.')[0];
        // Allow if it's the same project (starts with same base name)
        if (originBase.startsWith(baseDomain.split('-')[0])) {
          return true;
        }
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Wallet Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      entities: '/api/entities',
      files: '/api/files'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug middleware to log all requests (before routes)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request URL:', req.url);
  console.log('Request Original URL:', req.originalUrl);
  next();
});

// Test route to verify routing works
app.get('/api/test', (req, res) => {
  res.json({ message: 'API routing is working', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/files', fileRoutes);

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize database (non-blocking for serverless)
initDatabase().catch((error) => {
  console.error('Database initialization error:', error);
  // Don't exit in serverless - let it retry on next invocation
});

// For Vercel serverless functions, export the app as handler
// @vercel/node will automatically wrap this Express app
export default app;

// Also export as a named export for compatibility
export { app };

// Export handler function for Vercel (alternative format)
export const handler = app;

