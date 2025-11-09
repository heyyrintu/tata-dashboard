import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Centralized error handling middleware
 * Sanitizes error messages in production to prevent information leakage
 */
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const requestId = req.id || 'unknown';

  // Log error with context
  logger.error('Error occurred', {
    requestId,
    method: req.method,
    path: req.path,
    error: {
      message: err.message,
      stack: isProduction ? undefined : err.stack,
      statusCode: (err as AppError).statusCode
    }
  });

  // Determine status code
  const statusCode = (err as AppError).statusCode || 500;

  // Sanitize error message for production
  let errorMessage: string;
  if (isProduction) {
    // Don't expose internal error details in production
    if (statusCode >= 500) {
      errorMessage = 'An internal server error occurred. Please try again later.';
    } else {
      // For client errors (4xx), we can show the message but sanitize it
      errorMessage = err.message || 'An error occurred';
    }
  } else {
    // In development, show full error details
    errorMessage = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    ...(isProduction ? {} : { 
      stack: err.stack,
      details: err.message 
    }),
    requestId
  });
};

/**
 * Create an operational error (known error that we handle)
 */
export const createError = (message: string, statusCode: number = 400): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

