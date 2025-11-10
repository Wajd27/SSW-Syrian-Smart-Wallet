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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/files', fileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
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
export default app;

