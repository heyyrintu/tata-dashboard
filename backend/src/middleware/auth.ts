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
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = process.env.API_KEY;
  const requestId = req.id || 'unknown';

  // If no API key is configured, allow all requests (development mode)
  if (!apiKey) {
    logger.warn('API_KEY not configured - allowing all requests', { requestId });
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

/**
 * Optional: IP Whitelist Middleware
 * Set ALLOWED_IPS in environment variable (comma-separated)
 */
export const ipWhitelist = (req: Request, res: Response, next: NextFunction): void => {
  const allowedIPs = process.env.ALLOWED_IPS;
  
  if (!allowedIPs) {
    // No whitelist configured, allow all
    return next();
  }

  const clientIP = req.ip || req.socket.remoteAddress || '';
  const allowedIPList = allowedIPs.split(',').map(ip => ip.trim());

  if (!allowedIPList.includes(clientIP)) {
    logger.warn('IP whitelist check failed', { 
      clientIP, 
      allowedIPs: allowedIPList,
      requestId: req.id 
    });
    return next(createError('Access denied. IP address not whitelisted.', 403));
  }

  next();
};

