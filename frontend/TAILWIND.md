# Tailwind in this project

**Version 4**, loaded via `@import "tailwindcss"` in `src/index.css`.

## There is no `tailwind.config.js`

There used to be, and it was never read. Tailwind v4 only loads a JS config
when CSS explicitly asks for it with an `@config` directive, and this project
never did. Everything the file declared was inert:

- the `primary` 50–900 colour scale emitted **zero CSS**, which is why
  `border-primary-200` in `LoadingSpinner.tsx` rendered a borderless spinner;
- the `fontFamily.sans` override did nothing (the Inter font actually comes
  from the `body` rule in `index.css`);
- `@tailwindcss/forms` was listed as a plugin but was not applied.

Keeping a config file that looks authoritative but changes nothing is worse
than not having one, so it was removed.

## Where theme tokens live now

In `src/index.css`, under `@theme`. Entries named `--color-*` generate the
matching utilities, so `--color-brand-600` gives `bg-brand-600`,
`text-brand-600`, `border-brand-600`, `ring-brand-600`, `from-brand-600`, and
so on.

Brand colours are the `--color-brand-*` block. That is the single place to
change them.

## If you want `@tailwindcss/forms` back

Add `@plugin "@tailwindcss/forms";` to `src/index.css` after the Tailwind
import. Be aware this was **not** in effect before, so enabling it will restyle
every input, select and checkbox in the app — worth doing deliberately and
reviewing, not as a side effect of a rebrand.
