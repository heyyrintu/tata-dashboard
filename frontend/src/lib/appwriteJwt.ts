import { account, BYPASS_AUTH } from './appwrite';

/**
 * Supplies the Appwrite JWT that every API request carries.
 *
 * The backend derives the caller's role from this token by asking Appwrite who
 * it belongs to, so it is the only thing that decides whether a response
 * contains real carrier names. Nothing else the client sends influences that -
 * which is the point: the browser cannot award itself the HO role.
 *
 * Tokens are valid for 15 minutes. We hold one in memory (never in
 * localStorage - it is a bearer credential, and a session already survives
 * reloads via Appwrite's own cookie) and mint a fresh one shortly before it
 * lapses, or on demand after a 401.
 */

/** Renew this long before the 15-minute expiry, to absorb a slow request. */
const LIFETIME_MS = 15 * 60 * 1000;
const RENEW_MARGIN_MS = 2 * 60 * 1000;

let token: string | null = null;
let expiresAt = 0;
/** In-flight mint, so a burst of parallel requests triggers only one. */
let pending: Promise<string | null> | null = null;

async function mint(): Promise<string | null> {
  try {
    const { jwt } = await account.createJWT();
    token = jwt;
    expiresAt = Date.now() + LIFETIME_MS;
    return token;
  } catch {
    // No session (signed out, or expired). Requests go out unauthenticated and
    // the backend answers 401, which the app already handles by routing to the
    // login screen.
    token = null;
    expiresAt = 0;
    return null;
  } finally {
    pending = null;
  }
}

/** A usable JWT, minting one if the cached token is missing or nearly expired. */
export async function getJwt(): Promise<string | null> {
  if (BYPASS_AUTH) return null;
  if (token && Date.now() < expiresAt - RENEW_MARGIN_MS) return token;
  if (!pending) pending = mint();
  return pending;
}

/**
 * Discard the cached token so the next request mints a fresh one. Called after
 * a 401 (the session may have been revoked) and on sign-out.
 */
export function clearJwt(): void {
  token = null;
  expiresAt = 0;
  pending = null;
}
