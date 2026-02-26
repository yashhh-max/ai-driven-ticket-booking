# 🎬 3D Ticket Booking System - Quick Reference Card

## Component Locations

```
components/
├── particle-system.tsx                 # Particle system + lighting
├── checkout-3d-animation.tsx           # 3D checkout with states
├── theatre-home-3d.tsx                 # Movie carousel home page
├── seat-selector-3d.tsx                # 3D seat selector
├── movie-card-3d.tsx                   # Individual 3D movie cards
├── theme-provider-3d.tsx               # Theme system (5 themes)
├── 3d-integration-examples.tsx         # Helper components
├── 3d-index.ts                         # Central exports
└── ui/                                 # Existing UI components
```

## Import Guide

```tsx
// Option 1: Import from 3d-index (recommended)
import {
  Theme3DProvider,
  ThemeSwitcher,
  ParticleSystem,
  AnimatedLighting,
  Checkout3DAnimation,
  TheatreHomePage3D,
  SeatSelector3D,
  MovieCard3D,
  ParticleBackground,
  FloatingCard3D,
  NeonButton3D,
  useTheme3D,
  useThemeColors,
} from '@/components/3d-index'

// Option 2: Import directly
import { Theme3DProvider, ThemeSwitcher } from '@/components/theme-provider-3d'
import { ParticleSystem, AnimatedLighting } from '@/components/particle-system'
import { Checkout3DAnimation } from '@/components/checkout-3d-animation'
import { TheatreHomePage3D } from '@/components/theatre-home-3d'
```

## Setup Steps

### 1️⃣ Root Layout
```tsx
// app/layout.tsx
import { Theme3DProvider } from '@/components/3d-index'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Theme3DProvider>
          {children}
        </Theme3DProvider>
      </body>
    </html>
  )
}
```

### 2️⃣ Add Theme Switcher
```tsx
// Any component
import { ThemeSwitcher } from '@/components/3d-index'

export default function Page() {
  return (
    <>
      <ThemeSwitcher />
      {/* Your content */}
    </>
  )
}
```

### 3️⃣ Home Page
```tsx
// app/page.tsx
import { TheatreHomePage3D } from '@/components/3d-index'

async function getMovies() {
  // Fetch from database
}

export default async function Home() {
  const movies = await getMovies()
  return <TheatreHomePage3D movies={movies} />
}
```

### 4️⃣ Booking Page
```tsx
// app/book/[showtimeId]/page.tsx
import SeatSelector3D from '@/components/3d-index'

export default function BookingPage({ params }) {
  return (
    <SeatSelector3D 
      showtimeId={params.showtimeId}
      onSelect={handleSelect}
    />
  )
}
```

### 5️⃣ Checkout Page
```tsx
// app/checkout/[bookingId]/page.tsx
'use client'

import { Checkout3DAnimation } from '@/components/3d-index'
import { useState } from 'react'

export default function CheckoutPage({ params }) {
  const [status, setStatus] = useState('processing')

  // Update status based on payment result
  
  return (
    <Checkout3DAnimation
      status={status}
      bookingId={params.bookingId}
      totalAmount={300}
    />
  )
}
```

## Hooks

```tsx
// Get current theme and change it
const { theme, themeMode, setTheme } = useTheme3D()

// Get just colors
const colors = useThemeColors()

// Change theme
setTheme('neon')      // 'dark' | 'neon' | 'ocean' | 'nature' | 'sunset'
```

## Helper Components

```tsx
import {
  ParticleBackground,      // Add particles to any page
  FloatingCard3D,           // 3D styled cards
  NeonButton3D,             // Interactive buttons
  AnimatedGradientText,     // Gradient text
} from '@/components/3d-index'

// Usage examples:
<ParticleBackground intensity={0.3} />

<FloatingCard3D className="my-card">
  <h2>Movie Title</h2>
  <p>Description</p>
</FloatingCard3D>

<NeonButton3D onClick={() => {}}>
  Book Now
</NeonButton3D>

<AnimatedGradientText>
  Special Offers
</AnimatedGradientText>
```

## Available Themes

| Theme | Primary | Secondary | Accent | Best For |
|-------|---------|-----------|--------|----------|
| Dark | Cyan | Magenta | Gold | Premium cinema |
| Neon | Green | Pink | Purple | Futuristic/gaming |
| Ocean | Turquoise | Blue | Sky Blue | Calm/professional |
| Nature | Green | Brown | Gold | Organic/earthy |
| Sunset | Orange Red | Orange | Gold | Warm/inviting |

## Animation States (Checkout)

```tsx
// Processing state
<Checkout3DAnimation status="processing" {...props} />
// Shows: Spinning rings + rotating sphere + particle orbit + dots

// Success state
<Checkout3DAnimation status="success" {...props} />
// Shows: Checkmark animation + confetti spheres + pulse

// Failed state
<Checkout3DAnimation status="failed" {...props} />
// Shows: Error indicator + message
```

## Customization

### Particle Count
```tsx
<ParticleSystem count={500} />   // Low FPS-friendly
<ParticleSystem count={1000} />  // Standard
<ParticleSystem count={2000} />  // Maximum visual impact
```

### Disable Theme Awareness
```tsx
<ParticleSystem useTheme={false} color="#00D9FF" />
```

### Custom Theme
Add to `theme-provider-3d.tsx` themes object:
```tsx
export: {
  myTheme: {
    name: 'myTheme',
    colors: {
      primary: '#...',
      secondary: '#...',
      accent: '#...',
      // ... all 13 colors
    }
  }
}
```

## Performance Tips

✅ **DO**:
- Use 500-1000 particles on desktop
- Use 300-500 particles on mobile
- Lazy load movie images
- Use ThemeSwitcher for user preferences

❌ **DON'T**:
- Set particle count > 2000
- Render multiple canvases on same page
- Use max particles on mobile devices
- Change theme every frame

## Debugging

```tsx
// Check current theme
const { theme, themeMode } = useTheme3D()
console.log('Current theme:', themeMode)
console.log('Colors:', theme.colors)

// Check localStorage
localStorage.getItem('theme-mode-3d')
// Returns: 'dark' | 'neon' | 'ocean' | 'nature' | 'sunset'
```

## File Structure

```
✅ Created:
components/
  └── 3d/
      ├── particle-system.tsx
      ├── checkout-3d-animation.tsx
      ├── theatre-home-3d.tsx
      ├── seat-selector-3d.tsx
      ├── movie-card-3d.tsx
      ├── theme-provider-3d.tsx
      ├── 3d-integration-examples.tsx
      └── 3d-index.ts

📖 Documentation:
  ├── 3D_SETUP_GUIDE.md
  ├── 3D_COMPLETION_SUMMARY.md
  └── (This quick reference)
```

## Docs & Guides

- **[3D_SETUP_GUIDE.md](./3D_SETUP_GUIDE.md)** - Comprehensive integration guide
- **[3D_COMPLETION_SUMMARY.md](./3D_COMPLETION_SUMMARY.md)** - Full feature summary
- **This file** - Quick reference card

## Status Dashboard

| Feature | Status | File |
|---------|--------|------|
| Particle System | ✅ Ready | `particle-system.tsx` |
| Enhanced Lighting | ✅ Ready | `particle-system.tsx` |
| 3D Home Carousel | ✅ Ready | `theatre-home-3d.tsx` |
| 3D Checkout | ✅ Ready | `checkout-3d-animation.tsx` |
| 3D Seat Selector | ✅ Ready | `seat-selector-3d.tsx` |
| 3D Movie Cards | ✅ Ready | `movie-card-3d.tsx` |
| Theme System | ✅ Ready | `theme-provider-3d.tsx` |
| Helper Components | ✅ Ready | `3d-integration-examples.tsx` |

## Troubleshooting

**Q: Particles not showing?**
A: Ensure `ParticleSystem` is inside `<Canvas>` component

**Q: Theme not changing?**
A: Wrap app with `Theme3DProvider` first

**Q: Performance issues?**
A: Reduce particle count: `count={500}`

**Q: Colors not theme-aware?**
A: Add `useTheme={true}` to components

**Q: Can't import components?**
A: Use `3d-index.ts` for cleaner imports

## Next Steps

1. ✅ Add Theme3DProvider to root layout
2. ✅ Add ThemeSwitcher to header
3. ✅ Replace home page with 3D carousel
4. ✅ Integrate 3D seat selector
5. ✅ Add checkout animation
6. ✅ Test at localhost:3000
7. ⏳ Run SQL migration (Supabase)
8. 🚀 Deploy to Vercel

---

**Ready to deploy!** 🚀

For detailed setup, see [3D_SETUP_GUIDE.md](./3D_SETUP_GUIDE.md)
