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
 * Set CLIENT_VIEW=false to show real names on an internal deployment.
 */

export const CLIENT_VIEW = process.env.CLIENT_VIEW !== 'false';

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
export function carrierLabel(vendorName: string | null | undefined): string | null {
  if (!vendorName) return null;
  if (!CLIENT_VIEW) return vendorName;
  return `Carrier ${hash(vendorName.trim().toUpperCase())}`;
}

/**
 * Resolve a label coming back from the filter bar to the real vendor name.
 * Without this, filtering by a pseudonym would match nothing.
 */
export function resolveCarrier(label: string | null | undefined, allVendors: string[]): string | null {
  if (!label) return null;
  if (!CLIENT_VIEW) return label;
  return allVendors.find((v) => carrierLabel(v) === label) ?? label;
}
