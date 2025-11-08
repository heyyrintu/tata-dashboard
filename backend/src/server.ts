import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import requestId from 'express-request-id';
import { connectDatabase } from './config/database';
import uploadRoutes from './routes/upload';
import analyticsRoutes from './routes/analytics';
import emailRoutes from './routes/email';
import emailPollingService from './services/emailPollingService';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Security Middleware
// Helmet.js - Set various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false, // Disable in dev for easier debugging
  crossOriginEmbedderPolicy: false // Allow embedding if needed
}));

// Request ID middleware - Add unique ID to each request for tracking
app.use(requestId());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// CORS configuration - secure in production
const corsOptions = {
  origin: isProduction 
    ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : false)
    : '*', // Allow all in development
  credentials: true,
  optionsSuccessStatus: 200
};

if (isProduction && !process.env.FRONTEND_URL) {
  logger.warn('FRONTEND_URL not set in production. CORS will be disabled.');
}

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' })); // Increase limit for large Excel files
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/email', emailRoutes);

// Health check endpoint - Enhanced with system status
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const memoryUsage = process.memoryUsage();
    
    const healthStatus = {
      status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
      }
    };

    const statusCode = dbStatus === 'connected' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware - Must be last
app.use(errorHandler);

// Connect to database and start server
connectDatabase().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`, { 
      port: PORT, 
      environment: process.env.NODE_ENV || 'development' 
    });
    
    // Start email polling service if credentials are configured
    // Note: In production, this can also run as a separate PM2 process
    if (
      process.env.OUTLOOK_CLIENT_ID &&
      process.env.OUTLOOK_CLIENT_SECRET &&
      process.env.OUTLOOK_TENANT_ID &&
      process.env.OUTLOOK_UPLOAD_EMAIL
    ) {
      logger.info('Starting email polling service', {
        pollInterval: parseInt(process.env.OUTLOOK_POLL_INTERVAL || '600000', 10) / 1000
      });
      emailPollingService.start();
    } else {
      logger.info('Email polling service not configured (missing credentials)');
    }
  });
}).catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});

export default app;

