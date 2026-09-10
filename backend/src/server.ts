// Must stay the FIRST import: it loads .env before any other module is constructed.
import { emailPollingEnabled } from './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
    message: 'NPL DEF Dashboard API',
    version: '2.0.0',
    endpoints: {
      upload: 'POST /api/upload - Import an NPL MIS master workbook (replaces all data)',
      analytics: {
        base: '/api/analytics',
        routes: [
          'GET /api/analytics - Full dashboard payload (KPIs, on-time, volume, POD, vendors, lanes, data quality)',
          'GET /api/analytics/filters - Filter options (branches, vendors, SKUs, load types, date bounds)',
          'GET /api/analytics/shipments - Paginated shipment table',
          'GET /api/analytics/export - Export the filtered selection to Excel'
        ]
      },
      email: emailPollingEnabled ? '/api/email' : 'disabled (set ENABLE_EMAIL_POLLING=true)',
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
// Email ingestion is off by default; its routes are not mounted when disabled
// so a stray call fails fast with 404 rather than hitting a dead IMAP server.
if (emailPollingEnabled) {
  app.use('/api/email', apiLimiter, emailRoutes);
}

console.log(
  `[Server] Routes registered: /api/upload, /api/analytics${emailPollingEnabled ? ', /api/email' : ''}`
);

// Health check endpoint (no auth required)
app.get('/health', async (_req, res) => {
  try {
    const stats = await import('./lib/prisma').then((m) => m.default.$queryRaw<[{
      total_rows: bigint;
      rows_delivered: bigint;
      total_litres: number;
      pod_received: bigint;
      min_date: string;
      max_date: string;
    }]>`
      SELECT
        COUNT(*) AS total_rows,
        COUNT(CASE WHEN "deliveryStatus" = 'Delivered' THEN 1 END) AS rows_delivered,
        COALESCE(SUM("totalQuantityLtr"), 0) AS total_litres,
        COUNT(CASE WHEN "podReceived" THEN 1 END) AS pod_received,
        MIN("lrDate")::text AS min_date,
        MAX("lrDate")::text AS max_date
      FROM shipments
    `);
    const row = stats[0];
    res.json({
      status: 'OK',
      db: {
        totalRows: Number(row.total_rows),
        delivered: Number(row.rows_delivered),
        totalLitres: Number(row.total_litres),
        podReceived: Number(row.pod_received),
        dateRange: { min: row.min_date, max: row.max_date },
      },
    });
  } catch {
    res.json({ status: 'OK', message: 'Server is running', db: 'query failed' });
  }
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

    // Email polling is opt-in. NPL DEF ingests via the upload page, so the
    // poller stays off unless ENABLE_EMAIL_POLLING=true is set explicitly.
    if (!emailPollingEnabled) {
      console.log('[Server] Email polling disabled (set ENABLE_EMAIL_POLLING=true to enable)');
    } else if (process.env.IMAP_USER && process.env.IMAP_PASSWORD) {
      console.log('[Server] Starting email polling service (IMAP)');
      console.log(`[Server] Polling interval: ${parseInt(process.env.EMAIL_POLL_INTERVAL || '600000', 10) / 1000}s`);
      emailPollingService.start();
    } else {
      console.log('[Server] Email polling enabled but IMAP credentials are missing - not started');
    }
  });
});

export default app;

