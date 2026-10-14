import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createError } from './errorHandler';
import { isDevelopment } from '../config/env';

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

  // No API key configured.
  //
  // Allowed through only when NODE_ENV is explicitly "development", which is
  // the ordinary local case. Every other value - including NODE_ENV unset -
  // fails closed: /api/upload truncates and repopulates the shipments table, so
  // a misconfigured deploy must not serve an open API just because NODE_ENV was
  // forgotten alongside API_KEY. server.ts already refuses to boot under the
  // same rule; this is the second layer, so the guarantee does not rest on that
  // one check alone.
  if (!apiKey) {
    if (!isDevelopment) {
      logger.error('API_KEY is not configured - refusing all API requests', { requestId });
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


