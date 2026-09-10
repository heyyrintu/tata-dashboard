/**
 * Vendor name aliases.
 *
 * The MIS sheet is typed by hand across four branches, so the same carrier
 * shows up under several spellings. Each entry maps a spelling to the single
 * canonical name used everywhere in the dashboard, so one vendor cannot be
 * split across two rows of the scorecard.
 *
 * TO ADD A MERGE: add a line for every spelling that appears in the sheet,
 * including the canonical one, pointing at the name you want displayed.
 * Keys are matched case- and whitespace-insensitively, so "krc  xpress"
 * and "KRC Xpress" both hit the same entry.
 *
 * Only merge names you have CONFIRMED are the same company. Two carriers with
 * similar names merged by guesswork would silently corrupt the on-time and
 * returns figures those scorecards are used to judge.
 */
export const VENDOR_ALIASES: Record<string, string> = {
  // Confirmed by the client, 2026-09-10.
  'KRC EXPRESS': 'KRC Express',
  'KRC XPRESS': 'KRC Express',
};

/** Lookup key: uppercased, punctuation-stripped, whitespace-collapsed. */
function aliasKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/[.\-_,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve a vendor name to its canonical form.
 * Returns the trimmed original when no alias is registered.
 */
export function canonicaliseVendor(raw: string | null): { name: string | null; aliased: boolean } {
  if (!raw) return { name: null, aliased: false };

  const trimmed = raw.replace(/\s+/g, ' ').trim();
  if (!trimmed) return { name: null, aliased: false };

  const canonical = VENDOR_ALIASES[aliasKey(trimmed)];
  if (!canonical) return { name: trimmed, aliased: false };

  return { name: canonical, aliased: canonical !== trimmed };
}
