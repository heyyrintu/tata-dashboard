import { useState } from 'react';
import { BRAND_NAME, logoSources, markSources } from '../lib/brand';

/**
 * Brand artwork, with a format fallback.
 *
 * Real logos arrive as SVG or as PNG depending on what the design team has to
 * hand, and which one it is should not decide whether someone has to edit code.
 * This tries each candidate from lib/brand.ts in order and steps to the next on
 * a load error, so dropping either `logo.svg` or `logo.png` into
 * public/brand/ just works. The committed placeholder is last in the list, so
 * the UI is never broken while real artwork is outstanding.
 *
 * The fallback only ever moves forward through the list, so a missing file
 * cannot put the element into a reload loop.
 */
export default function BrandLogo({
  variant = 'lockup',
  className,
  decorative = false,
}: {
  /** 'lockup' is the full horizontal logo; 'mark' is the square icon. */
  variant?: 'lockup' | 'mark';
  className?: string;
  /** True where an adjacent text wordmark already names the brand. */
  decorative?: boolean;
}) {
  const sources = variant === 'mark' ? markSources() : logoSources();
  const [index, setIndex] = useState(0);

  return (
    <img
      src={sources[index]}
      alt={decorative ? '' : BRAND_NAME}
      aria-hidden={decorative || undefined}
      className={className}
      onError={() => {
        setIndex((i) => (i + 1 < sources.length ? i + 1 : i));
      }}
    />
  );
}
