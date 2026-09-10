/**
 * Carrier pseudonymisation for the client-facing dashboard.
 *
 * This dashboard is shown to the client, and the sub-carrier panel names
 * Drona's own contractors alongside their punctuality. That is internal
 * commercial information, so real vendor names are replaced here - in the
 * backend, before the payload is serialised - rather than hidden in the UI,
 * where anyone could read them back out of the network tab.
 *
 * The label is derived from a hash of the name, not from its rank, so
 * "Carrier 4F2" means the same carrier in every report and in every month.
 * A rank-based label would silently re-point at a different carrier as soon
 * as volumes moved.
 *
 * Masking is decided PER REQUEST from the caller's role (see config/roles.ts)
 * and passed down explicitly as `masked`. It used to be a module-level constant
 * read once from process.env, which meant the whole process served one mode -
 * fine while there was a single audience, impossible once HO and the client
 * share a deployment.
 */

import { Role } from './roles';

/**
 * Deployment-wide override, applied on top of the per-request role.
 *
 *   auto (default) - mask for `client`, show real names to `ho`.
 *   always         - mask everyone, whatever their role. Kill switch: use it
 *                    if roles are misconfigured and names are leaking.
 *   off / false    - never mask. For a purely internal deployment with no
 *                    client audience. `false` is the historical spelling.
 *
 * Anything unrecognised falls back to `auto` rather than to "off", so a typo
 * cannot silently unmask the client dashboard.
 */
export type ClientViewMode = 'auto' | 'always' | 'off';

function parseClientView(raw: string | undefined): ClientViewMode {
  switch ((raw ?? '').trim().toLowerCase()) {
    case 'off':
    case 'false':
      return 'off';
    case 'always':
    case 'force':
      return 'always';
    case '':
    case 'auto':
    case 'true':
      return 'auto';
    default:
      return 'auto';
  }
}

export const CLIENT_VIEW: ClientViewMode = parseClientView(process.env.CLIENT_VIEW);

/**
 * The single place a role becomes a masking decision. Callers thread the
 * resulting boolean down; nothing below this line reads process.env.
 */
export function maskingFor(role: Role): boolean {
  if (CLIENT_VIEW === 'off') return false;
  if (CLIENT_VIEW === 'always') return true;
  return role !== 'ho';
}

/** FNV-1a, chosen only for being short, stable and dependency-free. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).toUpperCase().slice(0, 3).padStart(3, '0');
}

/** Stable display label for a carrier, e.g. "Carrier 4F2". */
export function carrierLabel(vendorName: string | null | undefined, masked: boolean): string | null {
  if (!vendorName) return null;
  if (!masked) return vendorName;
  return `Carrier ${hash(vendorName.trim().toUpperCase())}`;
}

/**
 * Resolve a label coming back from the filter bar to the real vendor name.
 * Without this, filtering by a pseudonym would match nothing.
 */
export function resolveCarrier(
  label: string | null | undefined,
  allVendors: string[],
  masked: boolean
): string | null {
  if (!label) return null;
  if (!masked) return label;
  return allVendors.find((v) => carrierLabel(v, true) === label) ?? label;
}
