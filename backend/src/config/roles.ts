/**
 * Roles and what they are allowed to see.
 *
 * Two audiences share one deployment:
 *
 *   ho     - Drona HO. Internal. Sees real carrier names.
 *   client - NPL and anyone else. Sees pseudonymised carriers ("Carrier 4F2").
 *
 * `client` is the safe default everywhere. A request only becomes `ho` when
 * Appwrite itself confirms the user is in HO_TEAM_ID; every other outcome -
 * no token, an unverifiable token, a user in no team, Appwrite unreachable -
 * resolves to `client`. Nothing the caller sends can raise its own role.
 */

export type Role = 'ho' | 'client';

export const ROLES: readonly Role[] = ['ho', 'client'] as const;

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/**
 * Capabilities.
 *
 * Deliberately driven by TWO independent Appwrite teams, not by one rank:
 *
 *   HO_TEAM_ID    -> seeCarrierNames. Who may read real carrier names.
 *   ADMIN_TEAM_ID -> upload.          Who may replace the shipments table.
 *
 * They are different questions. An HO analyst can read real names without
 * being trusted to wipe and reload every shipment; an operator can be trusted
 * to run the upload without needing carrier identities. Collapsing them into
 * one role would make each grant strictly larger than it needs to be.
 */
export interface Capabilities {
  /** May read real carrier names instead of pseudonyms. From HO_TEAM_ID. */
  seeCarrierNames: boolean;
  /** May replace the entire shipments table via POST /api/upload. From ADMIN_TEAM_ID. */
  upload: boolean;
}

export type Capability = keyof Capabilities;

export function capabilitiesFor(role: Role, isAdmin: boolean): Capabilities {
  return {
    seeCarrierNames: role === 'ho',
    upload: isAdmin,
  };
}

/** Identity attached to every authenticated request. */
export interface AuthContext {
  /** Masking role, from HO_TEAM_ID membership. */
  role: Role;
  /** Upload rights, from ADMIN_TEAM_ID membership. Independent of `role`. */
  isAdmin: boolean;
  /** Appwrite user id, or null for the shared-API-key and dev paths. */
  userId: string | null;
  /** Appwrite account email, when a real user is behind the request. */
  email: string | null;
  /** How the request authenticated - for logging and for /api/me. */
  via: 'appwrite-jwt' | 'api-key' | 'dev';
  /** Effective masking decision, after CLIENT_VIEW is applied. */
  masked: boolean;
}

export function capabilitiesOf(auth: AuthContext): Capabilities {
  return capabilitiesFor(auth.role, auth.isAdmin);
}
