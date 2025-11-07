# UI Components

This directory contains reusable UI primitive components.

## Components

- `background-beams.tsx` - Animated background beams effect
- `moving-border.tsx` - Button with animated border
- `typewriter-effect.tsx` - Typewriter text animation
- `dotted-glow-background.tsx` - Dotted glow background
- `floating-navbar.tsx` - Floating navigation bar
- `lamp.tsx` - Lamp spotlight effect

## Usage

Copy these components to your project and import them:

```tsx
import { BackgroundBeams } from './components/ui/background-beams';
import { Button } from './components/ui/moving-border';
import { TypewriterEffect } from './components/ui/typewriter-effect';
```

**Note:** These components use `@/lib/utils` for the `cn` utility. Make sure to update the import paths or copy the `lib/utils.ts` file to match your project structure.

