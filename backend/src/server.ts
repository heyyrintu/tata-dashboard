import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import uploadRoutes from './routes/upload';
import analyticsRoutes from './routes/analytics';
import emailRoutes from './routes/email';
import emailPollingService from './services/emailPollingService';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow requests from frontend domain
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // In production, set FRONTEND_URL to your domain
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increase limit for large Excel files
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API root endpoint
app.get('/api', (req, res) => {
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

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/email', emailRoutes);

// Debug: Log all registered routes
console.log('[Server] ========================================');
console.log('[Server] Routes registered:');
console.log('[Server] - /api/upload');
console.log('[Server] - /api/analytics');
console.log('[Server]   └─ /api/analytics/export-all (NEW - Excel export)');
console.log('[Server] - /api/email');
console.log('[Server] ========================================');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to database and start server
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Start email polling service if IMAP credentials are configured
    if (process.env.IMAP_USER && process.env.IMAP_PASSWORD) {
      console.log('[Server] Starting email polling service (IMAP)');
      console.log(`[Server] IMAP Host: ${process.env.IMAP_HOST || 'imap.hostinger.com'}`);
      console.log(`[Server] IMAP User: ${process.env.IMAP_USER}`);
      console.log(`[Server] Allowed Sender: ${process.env.IMAP_ALLOWED_SENDER || '(any)'}`);
      console.log(`[Server] Polling interval: ${parseInt(process.env.EMAIL_POLL_INTERVAL || '600000', 10) / 1000}s`);
      emailPollingService.start();
    } else {
      console.log('[Server] Email polling service not configured (missing IMAP credentials)');
      console.log('[Server] Set IMAP_USER, IMAP_PASSWORD, and optionally IMAP_ALLOWED_SENDER in environment');
    }
  });
});

export default app;

