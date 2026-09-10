import { env } from './runtimeEnv';

/**
 * Drona Logitech brand identity.
 *
 * Single source of truth for the company's own name, copy and asset paths, so
 * a rename never leaves half the UI on the old identity - which is how the
 * sign-in footer ended up reading "Drona Technologies" while the wordmark two
 * inches above it read "Drona Logitech".
 *
 * COLOURS ARE NOT HERE. They are CSS custom properties in src/index.css under
 * `@theme`, so Tailwind can generate utilities from them. This file is for
 * strings and asset paths only.
 *
 * NOTE ON "NPL": NPL is the client this dashboard reports on - the data
 * domain, not Drona's branding. Strings like "NPL MIS master workbook" are
 * correct as they stand and must not be rebranded.
 */

/** Wordmark, split so the first half can carry the brand gradient. */
export const BRAND_MARK = 'DRONA';
export const BRAND_SUFFIX = 'Logitech';

/** Full company name, for prose and alt text. */
export const BRAND_NAME = `${BRAND_MARK.charAt(0)}${BRAND_MARK.slice(1).toLowerCase()} ${BRAND_SUFFIX}`;

/** Browser tab / PWA name. */
export const APP_TITLE = `${BRAND_NAME} Dashboard`;

export const BRAND_TAGLINE =
  'Intelligent fleet management and analytics platform for modern enterprises';

/**
 * Legal entity named in the copyright line. Kept separate from BRAND_NAME
 * because a registered company name and a trading name are not always the
 * same thing, even though they currently match.
 */
export const LEGAL_ENTITY = 'Drona Logitech';

/**
 * Copyright line. The year is computed rather than written down - the previous
 * hardcoded "2025" was already stale.
 */
export function copyrightLine(): string {
  return `© ${new Date().getFullYear()} ${LEGAL_ENTITY}. All rights reserved.`;
}

/**
 * Brand asset paths.
 *
 * Every file lives in frontend/public/brand/ and is served from the app's own
 * origin - nothing is hotlinked. The favicon used to point at a third-party CDN
 * URL, which put the brand's appearance at the mercy of someone else's uptime.
 *
 * To swap in real artwork, drop the files into frontend/public/brand/ and
 * change nothing here. See frontend/public/brand/README.md.
 *
 * Each slot lists candidates in priority order, and <BrandLogo> falls through
 * to the next one if a file is absent. That way SVG artwork and raster artwork
 * both drop in with no code change - a vector logo.svg wins where it exists,
 * a logo.png is picked up otherwise, and the committed placeholder is the
 * last resort so the UI is never broken.
 */
export const BRAND_ASSETS = {
  /** Full horizontal lockup: mark + wordmark. Sign-in page, sidebar (expanded). */
  logo: ['/brand/logo.svg', '/brand/logo.png'],
  /** Square mark alone, for tight spaces. Sidebar (collapsed). */
  mark: ['/brand/logo-mark.svg', '/brand/logo-mark.png'],
} as const;

/** Apple touch icon. Must be a raster PNG; iOS does not accept SVG. */
export const APPLE_TOUCH_ICON = '/brand/apple-touch-icon.png';

/**
 * Candidate sources for a brand slot, most-preferred first.
 *
 * VITE_LOGO_URL still overrides the lockup at runtime, so a deployment can
 * point at different artwork without a rebuild. When it is set it wins
 * outright; otherwise the bundled candidates are tried in order.
 */
export function logoSources(): readonly string[] {
  const override = env('VITE_LOGO_URL');
  return override ? [override] : BRAND_ASSETS.logo;
}

export function markSources(): readonly string[] {
  return BRAND_ASSETS.mark;
}
