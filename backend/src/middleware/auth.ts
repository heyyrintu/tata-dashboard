import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createError } from './errorHandler';

/**
 * API Key Authentication Middleware
 * 
 * For production, use API key authentication via header:
 * Authorization: Bearer <API_KEY>
 * 
 * Or via query parameter (less secure, not recommended):
 * ?apiKey=<API_KEY>
 * 
 * Set API_KEY in environment variables
 */
// Warn once at first use rather than on every request. Each dashboard page
// load fires several API calls, which turned this into hundreds of identical
// log lines that drowned out everything else.
let openAccessWarned = false;

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = process.env.API_KEY;
  const requestId = req.id || 'unknown';

  // If no API key is configured, allow all requests (development mode only).
  //
  // server.ts refuses to boot without API_KEY when NODE_ENV=production, so this
  // branch should be unreachable there. The explicit production check is a
  // second lock on the same door: an open /api means anyone can call
  // POST /api/upload, which replaces every row in the shipments table.
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('API_KEY is not configured - refusing to serve API requests', { requestId });
      return next(createError('Server authentication is not configured.', 500));
    }
    if (!openAccessWarned) {
      openAccessWarned = true;
      logger.warn('API_KEY not configured - all API requests are being allowed without authentication');
    }
    return next();
  }

  // Check for API key in Authorization header
  const authHeader = req.headers.authorization;
  let providedKey: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.substring(7);
  } else if (req.query.apiKey) {
    // Also check query parameter (less secure, for compatibility)
    providedKey = req.query.apiKey as string;
    logger.warn('API key provided via query parameter (less secure)', { requestId });
  }

  if (!providedKey) {
    logger.warn('Authentication failed: No API key provided', { requestId });
    return next(createError('Authentication required. Please provide API key in Authorization header.', 401));
  }

  if (providedKey !== apiKey) {
    logger.warn('Authentication failed: Invalid API key', { requestId });
    return next(createError('Invalid API key.', 401));
  }

  logger.debug('Authentication successful', { requestId });
  next();
};


