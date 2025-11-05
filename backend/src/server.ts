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

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to database and start server
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Start email polling service if credentials are configured
    // Note: In production, this can also run as a separate PM2 process
    if (
      process.env.OUTLOOK_CLIENT_ID &&
      process.env.OUTLOOK_CLIENT_SECRET &&
      process.env.OUTLOOK_TENANT_ID &&
      process.env.OUTLOOK_UPLOAD_EMAIL
    ) {
      console.log('[Server] Starting email polling service');
      console.log(`[Server] Polling interval: ${parseInt(process.env.OUTLOOK_POLL_INTERVAL || '600000', 10) / 1000}s`);
      emailPollingService.start();
    } else {
      console.log('[Server] Email polling service not configured (missing credentials)');
      console.log('[Server] Set OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, OUTLOOK_TENANT_ID, and OUTLOOK_UPLOAD_EMAIL in .env');
    }
  });
});

export default app;

