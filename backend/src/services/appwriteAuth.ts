import { createHash } from 'crypto';
import { Client, Account, Teams, AppwriteException } from 'node-appwrite';
import { Role } from '../config/roles';
import { logger } from '../utils/logger';

/**
 * Server-side verification of Appwrite JWTs.
 *
 * The client sends a JWT minted by `account.createJWT()`. We hand it straight
 * back to Appwrite: `account.get()` succeeds only if Appwrite considers the
 * signature and expiry valid, and `teams.list()` on the same JWT-scoped client
 * returns the teams Appwrite says that user belongs to. Both answers come from
 * Appwrite, not from the token's own claims, so a caller cannot mint or edit a
 * token to award itself the `ho` role.
 *
 * Appwrite publishes no JWKS, so there is no offline way to check the
 * signature - verification is necessarily a network call. Hence the cache
 * below: without it a single dashboard page load would make a dozen round
 * trips to Appwrite.
 */

const ENDPOINT = process.env.APPWRITE_ENDPOINT || '';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
/** Membership grants the right to see real carrier names. */
const HO_TEAM_ID = process.env.HO_TEAM_ID || '';
/** Membership grants the right to run POST /api/upload. Independent of HO. */
const ADMIN_TEAM_ID = process.env.ADMIN_TEAM_ID || '';

/** True when the backend has enough configuration to verify a JWT at all. */
export const appwriteAuthConfigured = Boolean(ENDPOINT && PROJECT_ID);

/**
 * Appwrite JWTs live 15 minutes. Cache a verified result for a short window so
 * the burst of calls behind one page load costs a single verification, while
 * still noticing a revoked session or a team change within about a minute.
 */
const POSITIVE_TTL_MS = 60_000;

/** Failures are cached briefly too, so a bad token cannot hammer Appwrite. */
const NEGATIVE_TTL_MS = 5_000;

/** Hard ceiling on the cache, so a flood of distinct tokens cannot grow it without bound. */
const MAX_ENTRIES = 5_000;

export interface VerifiedUser {
  userId: string;
  email: string | null;
  role: Role;
  isAdmin: boolean;
}

interface CacheEntry {
  expiresAt: number;
  /** null means "verification failed" - a cached rejection. */
  user: VerifiedUser | null;
}

const cache = new Map<string, CacheEntry>();

/**
 * Key on a digest, never the token itself: the raw JWT is a bearer credential
 * and this map ends up in heap dumps and debugging output.
 */
function cacheKey(jwt: string): string {
  return createHash('sha256').update(jwt).digest('hex');
}

function readCache(key: string): CacheEntry | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit;
}

function writeCache(key: string, user: VerifiedUser | null): void {
  if (cache.size >= MAX_ENTRIES) {
    // Cheapest useful eviction: drop whatever is oldest by insertion order.
    // Entries are short-lived anyway, so precision here buys nothing.
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, {
    user,
    expiresAt: Date.now() + (user ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
  });
}

/** Drop every cached verification. Used by tests and on configuration reload. */
export function clearVerificationCache(): void {
  cache.clear();
  inFlight.clear();
}

/**
 * A JWT is three base64url segments separated by dots. Used only to decide
 * whether a bearer token should be routed to Appwrite or compared against the
 * shared API key - never to read anything out of the token.
 */
export function looksLikeJwt(token: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(token);
}

function clientFor(jwt: string): Client {
  return new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setJWT(jwt);
}

/**
 * Verifications currently in flight, keyed the same way as the cache.
 *
 * The result cache alone does not stop the burst it was added for: one
 * dashboard page load fires several API calls at once, and on a cold cache
 * every one of them misses, so each does its own pair of Appwrite round trips.
 * Sharing the in-flight promise collapses that burst to a single verification.
 */
const inFlight = new Map<string, Promise<VerifiedUser | null>>();

/**
 * Verify a JWT and resolve the caller's role.
 *
 * Returns null when the token is not valid, or when Appwrite cannot be reached
 * - the caller treats both as "not authenticated". It never returns `ho` on a
 * partial failure: if the account verifies but the team lookup does not, the
 * user is `client`.
 */
export async function verifyJwt(jwt: string): Promise<VerifiedUser | null> {
  if (!appwriteAuthConfigured) return null;

  const key = cacheKey(jwt);
  const cached = readCache(key);
  if (cached) return cached.user;

  const pending = inFlight.get(key);
  if (pending) return pending;

  // Clear the entry once settled, whatever the outcome, so a failed
  // verification cannot pin every later request to the same rejection.
  const task = runVerification(jwt, key).finally(() => inFlight.delete(key));
  inFlight.set(key, task);
  return task;
}

async function runVerification(jwt: string, key: string): Promise<VerifiedUser | null> {
  const client = clientFor(jwt);

  let userId: string;
  let email: string | null;
  try {
    const account = await new Account(client).get();
    userId = account.$id;
    email = account.email || null;
  } catch (err) {
    // An expired or forged token lands here as a 401 - ordinary, not worth
    // logging at error level. Anything else means Appwrite itself is unhappy.
    const code = err instanceof AppwriteException ? err.code : undefined;
    if (code !== 401) {
      logger.warn('Appwrite JWT verification failed', {
        code,
        message: err instanceof Error ? err.message : String(err),
      });
    }
    writeCache(key, null);
    return null;
  }

  // Team membership decides both grants. `teams.list()` on a JWT-scoped client
  // is answered by Appwrite for that specific user, so it cannot be influenced
  // by anything the caller sent - and one call covers both teams.
  let role: Role = 'client';
  let isAdmin = false;
  if (HO_TEAM_ID || ADMIN_TEAM_ID) {
    try {
      const { teams } = await new Teams(client).list();
      const ids = new Set(teams.map((t) => t.$id));
      role = HO_TEAM_ID && ids.has(HO_TEAM_ID) ? 'ho' : 'client';
      isAdmin = Boolean(ADMIN_TEAM_ID && ids.has(ADMIN_TEAM_ID));
    } catch (err) {
      // Fail closed: a user whose teams we cannot read gets neither grant.
      logger.warn('Appwrite team lookup failed - granting neither HO nor admin', {
        userId,
        message: err instanceof Error ? err.message : String(err),
      });
      role = 'client';
      isAdmin = false;
    }
  }

  const user: VerifiedUser = { userId, email, role, isAdmin };
  writeCache(key, user);
  return user;
}
