// Must stay the FIRST import: it loads .env before any other module is constructed.
import { emailPollingEnabled } from './config/env';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import uploadRoutes from './routes/upload';
import analyticsRoutes from './routes/analytics';
import emailRoutes from './routes/email';
import { authenticate } from './middleware/auth';
import { errorHandler, createError } from './middleware/errorHandler';
import dashboardRoutes from './routes/dashboard';
import meRoutes from './routes/me';
import { appwriteAuthConfigured } from './services/appwriteAuth';
import { CLIENT_VIEW } from './config/vendorPrivacy';
import emailPollingService from './services/emailPollingService';
import dashboardCache from './services/cacheService';
import path from 'path';
import fs from 'fs';


// Validate required environment variables.
// API_KEY is mandatory in production: middleware/auth.ts falls through to
// open access when it is unset, which would publish every /api route -
// including POST /api/upload, which replaces the entire shipments table.
const requiredEnvVars = ['DATABASE_URL'];
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('FRONTEND_URL', 'API_KEY');
}
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the reverse proxies in front of us. This MUST be set before the rate
// limiters below are constructed: express-rate-limit v8 keys buckets on req.ip,
// and without it every client collapses onto the proxy's address (turning the
// per-client limits into one global cap) while its X-Forwarded-For validator
// throws at request time.
//
// The default walks back through private/loopback hops, which is what this
// topology actually needs - the in-container nginx (127.0.0.1) AND Coolify's
// proxy (a Docker bridge address) each append to X-Forwarded-For, so a fixed
// hop count of 1 would still resolve to the proxy rather than the caller.
// Override with TRUST_PROXY (a number, an IP/CIDR list, or `false`) if the
// deployment sits behind a different chain.
const trustProxyRaw = process.env.TRUST_PROXY ?? 'loopback, linklocal, uniquelocal';
const trustProxy =
  trustProxyRaw === 'false'
    ? false
    : /^\d+$/.test(trustProxyRaw)
      ? Number(trustProxyRaw)
      : trustProxyRaw;
app.set('trust proxy', trustProxy);

// Security middleware
app.use(helmet());

/**
 * Expand FRONTEND_URL into the set of allowed browser origins.
 *
 * Accepts a comma-separated list so apex + www (and any staging host) can share
 * one deployment, and adds the apex/www counterpart of each entry automatically
 * since that is the pair that actually bites in production.
 */
function expandOrigins(raw: string): string[] {
  const origins = new Set<string>();
  for (const entry of raw.split(',')) {
    const value = entry.trim().replace(/\/+$/, '');
    if (!value) continue;
    origins.add(value);
    try {
      const url = new URL(value);
      origins.add(
        url.host.startsWith('www.')
          ? `${url.protocol}//${url.host.slice(4)}`
          : `${url.protocol}//www.${url.host}`
      );
    } catch {
      // Not a parseable absolute URL - keep the literal entry only.
    }
  }
  return [...origins];
}

const allowedOrigins = expandOrigins(process.env.FRONTEND_URL || 'http://localhost:5173');
console.log(`[Server] CORS allowed origins: ${allowedOrigins.join(', ')}`);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl and the container health check send no Origin
    // header at all - those are not cross-origin and must not be rejected.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    // Tag it 403 so the error handler does not report a rejected origin as an
    // internal server error.
    return callback(createError(`Origin ${origin} is not allowed by CORS`, 403));
  },
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
app.use('/api/me', apiLimiter, meRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/analytics/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
// Email ingestion is off by default; its routes are not mounted when disabled
// so a stray call fails fast with 404 rather than hitting a dead IMAP server.
if (emailPollingEnabled) {
  app.use('/api/email', apiLimiter, emailRoutes);
}

console.log(
  `[Server] Routes registered: /api/me, /api/upload, /api/analytics${emailPollingEnabled ? ', /api/email' : ''}`
);

// Role resolution is what decides whether a caller sees real carrier names, so
// say plainly at boot which mode this process is in.
console.log(`[Server] Carrier masking mode: CLIENT_VIEW=${CLIENT_VIEW}`);
if (appwriteAuthConfigured) {
  console.log(
    process.env.HO_TEAM_ID
      ? '[Server] Appwrite auth enabled; real carrier names granted via HO_TEAM_ID'
      : '[Server] Appwrite auth enabled but HO_TEAM_ID is unset - every user resolves to "client"'
  );
  console.log(
    process.env.ADMIN_TEAM_ID
      ? '[Server] Upload rights granted via ADMIN_TEAM_ID'
      : '[Server] ADMIN_TEAM_ID is unset - nobody can POST /api/upload'
  );
} else if (process.env.NODE_ENV === 'production') {
  console.warn(
    '[Server] APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID are not set - user sign-in cannot be verified, ' +
      'so every request falls back to the shared API key and the masked "client" role.'
  );
}

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
  } catch (err) {
    // The database is the only dependency this service has - if the probe query
    // fails the app cannot serve anything useful, so report it as unhealthy.
    // Returning 200 here made Coolify's health check report green straight
    // through a database outage.
    console.error('[Health] Database probe failed:', err);
    res.status(503).json({
      status: 'ERROR',
      message: 'Database unavailable',
      db: 'query failed',
    });
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

  const server = app.listen(PORT, () => {
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

  registerShutdownHandlers(server);
});

/**
 * Graceful shutdown.
 *
 * Coolify sends SIGTERM on every redeploy. Without this the process is killed
 * mid-request: an in-flight /api/upload (which truncates and repopulates the
 * shipments table) dies half-done, and the Prisma pool leaves connections open
 * on the remote database until they time out.
 *
 * Sequence: stop accepting new connections, let in-flight requests finish, stop
 * the email poller, disconnect Prisma, exit. A hard timeout guards against a
 * request that never completes, so the container still exits before Docker's
 * own SIGKILL deadline.
 */
function registerShutdownHandlers(server: import('http').Server): void {
  // A malformed SHUTDOWN_TIMEOUT_MS must not silently defeat graceful
  // shutdown: parseInt('abc') is NaN and setTimeout treats NaN (and any value
  // <= 0) as "fire now", so a typo would kill in-flight requests the instant
  // SIGTERM arrived - the exact failure this handler exists to prevent.
  // Fall back to the documented default rather than refusing to run: a bad
  // shutdown timer is no reason to take down a healthy server.
  const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;
  const configuredTimeout = Number(process.env.SHUTDOWN_TIMEOUT_MS);
  const SHUTDOWN_TIMEOUT_MS =
    Number.isSafeInteger(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : DEFAULT_SHUTDOWN_TIMEOUT_MS;
  if (process.env.SHUTDOWN_TIMEOUT_MS && SHUTDOWN_TIMEOUT_MS !== configuredTimeout) {
    console.warn(
      `[Server] SHUTDOWN_TIMEOUT_MS="${process.env.SHUTDOWN_TIMEOUT_MS}" is not a positive integer - ` +
        `using ${DEFAULT_SHUTDOWN_TIMEOUT_MS}ms`
    );
  }
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      console.warn(`[Server] Received ${signal} while already shutting down - ignoring`);
      return;
    }
    shuttingDown = true;
    console.log(`[Server] ${signal} received - starting graceful shutdown`);

    const forceExit = setTimeout(() => {
      console.error(`[Server] Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms - forcing exit`);
      // Cut off whatever is still hanging so the process can actually leave.
      server.closeAllConnections?.();
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    // Do not let the timer alone keep the event loop alive.
    forceExit.unref();

    try {
      const closed = new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      // server.close() stops new connections but waits for existing ones, and
      // an idle keep-alive socket (every browser holds a few) never finishes on
      // its own. Drop the idle ones immediately; sockets with a request still
      // in flight are left alone to complete.
      server.closeIdleConnections?.();
      await closed;
      console.log('[Server] HTTP server closed');

      if (emailPollingEnabled) {
        try {
          emailPollingService.stop();
          console.log('[Server] Email polling stopped');
        } catch (err) {
          console.warn('[Server] Failed to stop email polling cleanly:', err);
        }
      }

      const prisma = (await import('./lib/prisma')).default;
      await prisma.$disconnect();
      console.log('[Server] Database disconnected');

      clearTimeout(forceExit);
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during shutdown:', err);
      clearTimeout(forceExit);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

export default app;

