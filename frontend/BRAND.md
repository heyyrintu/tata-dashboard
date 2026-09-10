# Brand assets — Drona Logitech

The files themselves live in `frontend/public/brand/`. This guide sits outside
that directory because Vite copies everything in `public/` into the served
build, and internal docs should not ship to visitors.

Everything here is served from the app's own origin. Nothing is hotlinked: the
favicon previously pointed at a `cdn.dribbble.com` URL, which put the brand's
appearance (and the browser tab's availability) in a third party's hands.

## Drop the real artwork in

**Overwrite these files, keep the filenames, change no code.** Every reference
in the app resolves through `src/lib/brand.ts` → `BRAND_ASSETS`, and the
filenames below are the contract.

| File | Used by | Format | Size / ratio |
| --- | --- | --- | --- |
| `logo.svg` **or** `logo.png` | Sign-in page, expanded sidebar | either | horizontal lockup, any sensible ratio |
| `logo-mark.svg` **or** `logo-mark.png` | Collapsed sidebar | either | **square**, 1:1 |
| `favicon.svg` | Browser tab | SVG | **square**, legible at 16×16 |
| `apple-touch-icon.png` | iOS home screen | PNG (iOS rejects SVG) | 180×180, no transparency |

`.svg` wins where both exist; otherwise `.png` is used, then the committed
placeholder. `src/components/BrandLogo.tsx` walks that list, so **either format
drops in with no code change** and the UI is never broken mid-swap.

The lockup is rendered 80px tall on the sign-in page and 48px on mobile, and its
width is `auto`, so any reasonable aspect ratio works. A raster lockup wants to
be at least 160px tall so it stays crisp on high-DPI screens.

A lockup cannot stand in for the square mark: the sidebar renders `logo-mark`
at 32×32, and a wide logo squeezed into a square is unreadable. Supply both.

The files currently in this directory are **placeholders** generated from the
brand gradient. They are real, self-hosted and unbroken — the app is fully
functional as it stands — but they are not the actual Drona Logitech logo.

### Prefer SVG where you have it

Vector artwork stays sharp at every size the app renders it. Raster is fully
supported — name it `logo.png` / `logo-mark.png` — but mind the minimum
heights above.

### Regenerating `apple-touch-icon.png`

It is a 180×180 raster of `logo-mark.svg`. Run from `public/brand/`. Any SVG→PNG tool will do:

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
