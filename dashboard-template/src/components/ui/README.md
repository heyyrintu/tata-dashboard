# UI Components

This directory contains reusable UI primitive components.

## Components

- `background-beams.tsx` - Animated background beams effect (used in BaseDashboard)
- `moving-border.tsx` - Button with animated border
- `typewriter-effect.tsx` - Typewriter text animation (used in BaseHeader)

## Usage

These components are already integrated into the template and can be imported using relative paths:

```tsx
import { BackgroundBeams } from '../ui/background-beams';
import { Button, MovingBorder } from '../ui/moving-border';
import { TypewriterEffect } from '../ui/typewriter-effect';
```

**Note:** These components use `../../lib/utils` for the `cn` utility function, which uses `clsx` and `tailwind-merge` for proper class name merging.

