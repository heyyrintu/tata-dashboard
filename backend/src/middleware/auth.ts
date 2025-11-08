import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createError } from './errorHandler';

/**
 * API Key Authentication Middleware
 * 
 * Security model:
 * - Requests from trusted frontend origins (FRONTEND_URL) are allowed without API key
 *   (CORS already restricts these, so this is safe for internal dashboard access)
 * - External/direct API access requires API key via Authorization header:
 *   Authorization: Bearer <API_KEY>
 * - Or via query parameter (less secure, not recommended):
 *   ?apiKey=<API_KEY>
 * 
 * Set API_KEY and FRONTEND_URL in environment variables
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = process.env.API_KEY;
  const frontendUrl = process.env.FRONTEND_URL;
  const requestId = req.id || 'unknown';
  const isProduction = process.env.NODE_ENV === 'production';

  // If no API key is configured, allow all requests (development mode)
  if (!apiKey) {
    logger.warn('API_KEY not configured - allowing all requests', { requestId });
    return next();
  }

  // Check if request is from trusted frontend origin
  // This allows the frontend to access the API without exposing the key in the browser
  if (isProduction && frontendUrl) {
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigins = frontendUrl.split(',').map(url => url.trim());
    
    // Check if origin matches any allowed frontend URL
    if (origin) {
      const originUrl = new URL(origin);
      const isTrustedOrigin = allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.origin === allowedUrl.origin;
        } catch {
          // If allowed URL is not a full URL, check if origin matches
          return origin.includes(allowed);
        }
      });

      if (isTrustedOrigin) {
        logger.debug('Authentication bypassed: Request from trusted frontend origin', { 
          requestId, 
          origin 
        });
        return next();
      }
    }
  }

  // For external/direct API access, require API key
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

