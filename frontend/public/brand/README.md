# Brand assets — Drona Logitech

Everything here is served from the app's own origin. Nothing is hotlinked: the
favicon previously pointed at a `cdn.dribbble.com` URL, which put the brand's
appearance (and the browser tab's availability) in a third party's hands.

## Drop the real artwork in

**Overwrite these files, keep the filenames, change no code.** Every reference
in the app resolves through `src/lib/brand.ts` → `BRAND_ASSETS`, and the
filenames below are the contract.

| File | Used by | Format | Size / ratio |
| --- | --- | --- | --- |
| `logo.svg` | Sign-in page, expanded sidebar | SVG (preferred) | horizontal lockup, roughly 5:1 |
| `logo-mark.svg` | Collapsed sidebar | SVG | **square**, 1:1 |
| `favicon.svg` | Browser tab | SVG | **square**, legible at 16×16 |
| `apple-touch-icon.png` | iOS home screen | PNG (iOS rejects SVG) | 180×180, no transparency |

The files currently in this directory are **placeholders** generated from the
brand gradient. They are real, self-hosted and unbroken — the app is fully
functional as it stands — but they are not the actual Drona Logitech logo.

### If your logo is a PNG rather than an SVG

Name it `logo.png` and update the single `logo` entry in
`src/lib/brand.ts` → `BRAND_ASSETS`. Prefer SVG where you have it: the sign-in
page renders the lockup at 80px tall and the sidebar at 32px, and a raster
asset will soften on high-DPI displays at one of those sizes.

### Regenerating `apple-touch-icon.png`

It is a 180×180 raster of `logo-mark.svg`. Any SVG→PNG tool will do:

```bash
rsvg-convert -w 180 -h 180 logo-mark.svg -o apple-touch-icon.png
# or
magick -background none logo-mark.svg -resize 180x180 apple-touch-icon.png
```

## Colours are not here

Brand colours are CSS custom properties in `src/index.css` under `@theme`
(`--color-brand-*`). That is the only place to change them. They must live
there rather than in `tailwind.config.js`, because this project runs Tailwind
v4 with no `@config` directive — a config file would never be read.

## Names and copy

Company name, tagline, and the copyright line live in `src/lib/brand.ts`.

Note that **"NPL" is not branding** — it is the client this dashboard reports
on. Strings like "NPL MIS master workbook" are the data domain and are correct
as they stand.
