import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Connect to MongoDB with retry logic and connection pooling
 */
export const connectDatabase = async (retryCount: number = 0): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tata-dashboard';
    
    // Configure connection options
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
    };
    
    await mongoose.connect(mongoURI, options);
    logger.info('MongoDB connected successfully', {
      uri: mongoURI.replace(/\/\/.*@/, '//***@'), // Mask credentials in logs
      retryCount
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('MongoDB connection error', {
      error: errorMessage,
      retryCount,
      maxRetries: MAX_RETRIES
    });

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying MongoDB connection in ${RETRY_DELAY / 1000} seconds...`, {
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES
      });
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDatabase(retryCount + 1);
    }

    logger.error('MongoDB connection failed after maximum retries', {
      maxRetries: MAX_RETRIES
    });
    logger.warn('Server will start but database operations may fail.');
    logger.warn('Please start MongoDB to enable full functionality.');
    // Don't exit - let the server start anyway for graceful degradation
  }
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

