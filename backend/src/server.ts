import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import uploadRoutes from './routes/upload';
import analyticsRoutes from './routes/analytics';
import emailRoutes from './routes/email';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import dashboardRoutes from './routes/dashboard';
import emailPollingService from './services/emailPollingService';
import dashboardCache from './services/cacheService';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('FRONTEND_URL');
}
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many upload requests, please try again later.' }
});

// Body parsing with reasonable limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API root endpoint
app.get('/api', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'TATA Dashboard API',
    version: '1.0.0',
    endpoints: {
      upload: '/api/upload',
      analytics: {
        base: '/api/analytics',
        routes: [
          'GET /api/analytics - Get summary cards (totalIndents, totalTrips)',
          'GET /api/analytics/range-wise - Get range-wise summary',
          'GET /api/analytics/fulfillment - Get fulfillment analytics',
          'GET /api/analytics/load-over-time - Get load over time',
          'GET /api/analytics/revenue - Get revenue analytics',
          'GET /api/analytics/cost - Get cost analytics',
          'GET /api/analytics/profit-loss - Get profit/loss analytics',
          'GET /api/analytics/vehicle-cost - Get vehicle cost analytics',
          'GET /api/analytics/month-on-month - Get month-on-month data',
          'GET /api/analytics/debug/calculations - Debug all calculations',
          'GET /api/analytics/export-all - Export all indents to Excel (with date filter)',
          'GET /api/analytics/fulfillment/export-missing - Export missing indents to Excel'
        ]
      },
      email: '/api/email',
      health: '/health'
    }
  });
});

// Authentication middleware for all API routes
app.use('/api', authenticate);

// Routes with rate limiting
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/analytics/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/email', apiLimiter, emailRoutes);

console.log('[Server] Routes registered: /api/upload, /api/analytics, /api/email');

// Health check endpoint (no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Centralized error handler (must be last middleware)
app.use(errorHandler);

// Connect to database and start server
connectDatabase().then(async () => {
  // Warm up dashboard cache from DB snapshot on startup
  try {
    await dashboardCache.warmUp();
    console.log('[Server] Dashboard cache warmed up from DB snapshot');
  } catch (err) {
    console.warn('[Server] Dashboard cache warm-up failed (will compute on first request):', err);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Start email polling service if IMAP credentials are configured
    if (process.env.IMAP_USER && process.env.IMAP_PASSWORD) {
      console.log('[Server] Starting email polling service (IMAP)');
      console.log(`[Server] Polling interval: ${parseInt(process.env.EMAIL_POLL_INTERVAL || '600000', 10) / 1000}s`);
      emailPollingService.start();
    } else {
      console.log('[Server] Email polling service not configured (missing IMAP credentials)');
    }
  });
});

export default app;

