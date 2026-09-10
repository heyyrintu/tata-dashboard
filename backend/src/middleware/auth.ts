import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createError } from './errorHandler';
import { AuthContext, Capability, Role, capabilitiesOf, isRole } from '../config/roles';
import { maskingFor } from '../config/vendorPrivacy';
import { appwriteAuthConfigured, looksLikeJwt, verifyJwt } from '../services/appwriteAuth';

/**
 * Authentication and role resolution for /api.
 *
 * Two credentials are accepted on the same Authorization header:
 *
 *   1. An Appwrite JWT (`account.createJWT()`), verified server-side. Role
 *      comes from Appwrite team membership - see services/appwriteAuth.ts.
 *   2. The shared API_KEY, for non-browser callers. It has no user behind it,
 *      so it always resolves to `client`: the masked, least-privileged role.
 *      VITE_API_KEY ships this same value to every browser, so treating it as
 *      internal would hand out real carrier names to anyone reading the bundle.
 *
 * Role is NEVER read from a request header or query parameter. The masking it
 * controls exists precisely so the client cannot lift it.
 */

// Warn once at first use rather than on every request. Each dashboard page
// load fires several API calls, which turned this into hundreds of identical
// log lines that drowned out everything else.
let openAccessWarned = false;
let devRoleWarned = false;

/**
 * Development-only role override, for running without Appwrite (the frontend's
 * VITE_BYPASS_AUTH=true skips login, so no JWT exists to send). Ignored
 * outright in production, where it would be a way to mint an `ho` session.
 */
function devRole(): Role | null {
  if (process.env.NODE_ENV === 'production') return null;
  const raw = process.env.DEV_ROLE;
  if (!raw) return null;
  if (!isRole(raw)) {
    logger.warn(`DEV_ROLE="${raw}" is not a valid role - ignoring`);
    return null;
  }
  return raw;
}

/**
 * Upload rights in development. Defaults to following DEV_ROLE=ho so a local
 * run is usable out of the box, but can be set explicitly to test the split
 * that ADMIN_TEAM_ID and HO_TEAM_ID make in production - an HO user who cannot
 * upload, or an uploader who sees pseudonyms.
 */
function devAdmin(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const raw = process.env.DEV_ADMIN;
  if (raw !== undefined) return raw === 'true';
  return devRole() === 'ho';
}

function contextFor(
  role: Role,
  isAdmin: boolean,
  via: AuthContext['via'],
  userId: string | null = null,
  email: string | null = null
): AuthContext {
  return { role, isAdmin, via, userId, email, masked: maskingFor(role) };
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = process.env.API_KEY;
  const requestId = req.id || 'unknown';

  const authHeader = req.headers.authorization;
  const bearer =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;

  // ---- 1. Appwrite JWT
  //
  // The shared key is compared first so a key that happens to be JWT-shaped is
  // never mistaken for a token, and so this branch is only entered by
  // something that is genuinely meant to be a user session.
  if (bearer && bearer !== apiKey && looksLikeJwt(bearer)) {
    if (!appwriteAuthConfigured) {
      // Returning 401 here would send the user back to a login screen that
      // cannot possibly fix it. Say what is actually wrong.
      logger.error(
        'Received an Appwrite JWT but APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID are not configured',
        { requestId }
      );
      return next(createError('Server is not configured to verify user sign-in.', 500));
    }
    const user = await verifyJwt(bearer);
    if (user) {
      req.auth = contextFor(user.role, user.isAdmin, 'appwrite-jwt', user.userId, user.email);
      logger.debug('Authenticated via Appwrite JWT', {
        requestId,
        userId: user.userId,
        role: user.role,
        isAdmin: user.isAdmin,
      });
      return next();
    }
    logger.warn('Authentication failed: Appwrite JWT rejected', { requestId });
    return next(createError('Session expired or invalid. Please sign in again.', 401));
  }

  // ---- 2. Shared API key (header, or the legacy query parameter)
  let providedKey: string | undefined = bearer;
  if (!providedKey && req.query.apiKey) {
    providedKey = String(req.query.apiKey);
    logger.warn('API key provided via query parameter (less secure)', { requestId });
  }

  if (!apiKey) {
    // server.ts refuses to boot without API_KEY when NODE_ENV=production, so
    // this branch should be unreachable there. The explicit production check
    // is a second lock on the same door: an open /api means anyone can call
    // POST /api/upload, which replaces every row in the shipments table.
    if (process.env.NODE_ENV === 'production') {
      logger.error('API_KEY is not configured - refusing to serve API requests', { requestId });
      return next(createError('Server authentication is not configured.', 500));
    }

    const override = devRole();
    if (override && !devRoleWarned) {
      devRoleWarned = true;
      logger.warn(`DEV_ROLE=${override} - development requests are running as "${override}"`);
    }
    if (!openAccessWarned) {
      openAccessWarned = true;
      logger.warn('API_KEY not configured - all API requests are being allowed without authentication');
    }
    req.auth = contextFor(override ?? 'client', devAdmin(), 'dev');
    return next();
  }

  if (!providedKey) {
    logger.warn('Authentication failed: No credentials provided', { requestId });
    return next(createError('Authentication required. Please provide an API key or sign in.', 401));
  }

  if (providedKey !== apiKey) {
    logger.warn('Authentication failed: Invalid API key', { requestId });
    return next(createError('Invalid API key.', 401));
  }

  // The shared key is always the least-privileged role. In development a
  // DEV_ROLE override may raise it; in production devRole() returns null.
  const override = devRole();
  if (override && override !== 'client' && !devRoleWarned) {
    devRoleWarned = true;
    logger.warn(`DEV_ROLE=${override} - shared-key requests are running as "${override}"`);
  }
  // The shared key confers no upload right of its own; only DEV_ADMIN can add
  // one, and only outside production.
  req.auth = contextFor(override ?? 'client', devAdmin(), override ? 'dev' : 'api-key');
  next();
};

/**
 * Route guard for a single capability.
 *
 * Capabilities come from two independent Appwrite teams (see config/roles.ts),
 * so this asks "may you upload?" rather than "are you senior enough?".
 *
 * Applied to POST /api/upload, which truncates and repopulates the shipments
 * table. Before per-user identity existed that endpoint was reachable by
 * anything holding the shared key - including every browser, since the key
 * ships to them as VITE_API_KEY.
 */
export const requireCapability = (capability: Capability) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const auth = req.auth;
    if (!auth) {
      // authenticate() runs first on every /api route; reaching here means the
      // guard was mounted somewhere it does not, so refuse rather than assume.
      logger.error('requireCapability used on a route without authenticate()', { path: req.path });
      return next(createError('Server authorization is misconfigured.', 500));
    }
    if (!capabilitiesOf(auth)[capability]) {
      logger.warn('Authorization failed: missing capability', {
        requestId: req.id || 'unknown',
        userId: auth.userId,
        role: auth.role,
        isAdmin: auth.isAdmin,
        required: capability,
        path: req.path,
      });
      return next(createError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
