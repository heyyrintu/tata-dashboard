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
 * origin - nothing is hotlinked. The favicon used to point at a dribbble CDN
 * URL, which put the brand's appearance at the mercy of a third party.
 *
 * To swap in real artwork, overwrite the files in frontend/public/brand/ and
 * change nothing here. See frontend/public/brand/README.md for the exact
 * filenames and sizes expected.
 */
export const BRAND_ASSETS = {
  /** Full horizontal lockup: mark + wordmark. Sign-in page, sidebar (expanded). */
  logo: '/brand/logo.svg',
  /** Square mark alone, for tight spaces. Sidebar (collapsed), favicon. */
  mark: '/brand/logo-mark.svg',
  /** Apple touch icon. Must be a raster PNG; iOS does not accept SVG. */
  appleTouchIcon: '/brand/apple-touch-icon.png',
} as const;

/**
 * Logo source for the sign-in page.
 *
 * VITE_LOGO_URL still overrides it at runtime, so a deployment can point at a
 * different lockup without a rebuild, but the default is now a self-hosted
 * file rather than a missing /logo.png.
 */
export function logoUrl(): string {
  return env('VITE_LOGO_URL', BRAND_ASSETS.logo);
}
