# 3D Ticket Booking Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ROOT LAYOUT                              │
│              (Theme3DProvider wraps app)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────────┐      ┌──────▼──────┐
    │ ThemeSwitcher│      │   Header    │
    │  (Top Right) │      │  Component  │
    └──────────────┘      └─────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │     Page Content                       │
    │  (Dynamic based on route)             │
    └────────────────────────────────────────┘
```

## Component Hierarchy

```
Theme3DProvider (Context)
│
├── useTheme3D()
│   ├── theme (colors & config)
│   ├── themeMode (current theme name)
│   └── setTheme() (change theme)
│
├── useThemeColors()
│   └── Returns: { primary, secondary, accent, ... }
│
├── ThemeSwitcher
│   └── Buttons for: Dark, Neon, Ocean, Nature, Sunset
│
└── Components using theme
    ├── ParticleSystem (adapts colors)
    ├── AnimatedLighting (adapts light colors)
    ├── Checkout3DAnimation (adapts UI colors)
    ├── TheatreHomePage3D (adapts all visual elements)
    ├── SeatSelector3D (adapts seat colors)
    └── MovieCard3D (adapts card colors)
```

## Page Integration Flow

```
Home (/)
└── TheatreHomePage3D
    ├── Canvas
    │   ├── Theater3DHomePage (group)
    │   │   ├── Movie carousel (8 items)
    │   │   ├── Stage (golden floor)
    │   │   ├── Spotlight (center)
    │   │   ├── ParticleSystem (500)
    │   │   └── AnimatedLighting
    │   └── PerspectiveCamera
    └── UI Overlay
        ├── Movie title
        └── Selection info

Movie Page (/movies/[id])
└── MovieCard3D
    ├── Rotating cube
    ├── Neon glow
    └── Floating animation

Booking Page (/book/[showtimeId])
└── SeatSelector3D
    ├── Canvas
    │   ├── Rotating seats
    │   ├── Color-coded by type
    │   └── Lighting
    └── Seat info overlay

Checkout Page (/checkout/[bookingId])
└── Checkout3DAnimation
    ├── Canvas
    │   ├── Processing state
    │   │   ├── Spinning rings
    │   │   ├── Central sphere
    │   │   └── Particle orbit
    │   ├── Success state
    │   │   ├── Checkmark
    │   │   └── Confetti
    │   └── Failed state
    │       └── Error display
    └── Info overlay
        ├── Booking ID
        └── Amount paid

Confirmation Page (/confirmation/[bookingId])
└── Status display
    └── Uses checkout animation colors
```

## Theme System Flow

```
User Action (Click Theme Button)
    │
    ▼
ThemeSwitcher Component
    │
    ├─→ setTheme('neon')
    │
    ▼
Theme Context Updates
    │
    ├─→ localStorage.setItem('theme-mode-3d', 'neon')
    │
    ▼
All Subscribed Components Re-render
    │
    ├─→ useTheme3D() returns new theme
    ├─→ useThemeColors() returns new colors
    │
    ▼
3D Components Update
    ├─→ Materials change colors
    ├─→ Lights adapt colors
    ├─→ UI adapts colors
    │
    ▼
User Sees Instant Theme Switch
```

## Data Flow Example: Booking Process

```
1. User selects movie on home page
   └─→ TheatreHomePage3D receives selection

2. Navigate to booking page
   └─→ SeatSelector3D loads showtimeId

3. User selects seat
   └─→ Calls createSeatLock() API
   └─→ Database creates lock with 10-min expiry

4. User confirms seats
   └─→ Creates booking record
   └─→ Navigate to checkout

5. On checkout page
   └─→ Checkout3DAnimation shows "processing"
   └─→ Payment API processes transaction
   └─→ Updates animation state to "success"
   └─→ Shows booking ID + amount

6. On confirmation page
   └─→ Display ticket details
   └─→ Option to download/share
```

## 3D Rendering Pipeline

```
Canvas Initialization
    │
    ├── PerspectiveCamera
    │   └── Position: [0, 0, 15]
    │   └── FOV: 75°
    │
    ├── Scene Setup
    │   ├── Background color (theme-aware)
    │   ├── Fog (theme-aware)
    │   └── Lighting
    │
    ├── Geometry Objects
    │   ├── Boxes (stage, elements)
    │   ├── Spheres (particles, lights)
    │   ├── Torus (rings, frames)
    │   └── Points (particle system)
    │
    └── Materials
        ├── MeshStandardMaterial (3D objects)
        ├── PointsMaterial (particles)
        └── All color-aware via useThemeColors()

Frame Loop (useFrame hook)
    │
    ├── Update positions
    │   ├── Particle velocities
    │   ├── Rotations
    │   └── Scales
    │
    ├── Update lighting
    │   ├── Directional lights
    │   ├── Point lights
    │   └── Shadows
    │
    ├── Render frame
    │   └── WebGL rendering
    │
    └── Next frame (repeat)
```

## State Management

```
Global State (Theme)
├── useTheme3D()
│   ├── theme: Theme (object)
│   ├── themeMode: ThemeMode (string)
│   ├── setTheme: (mode) => void
│   └── themes: Record<ThemeMode, Theme>
│
└── localStorage
    └── 'theme-mode-3d': ThemeMode

Local State (Pages)
├── Home Page
│   └── selectedMovieIndex: number
│
├── Booking Page
│   ├── selectedSeats: string[]
│   └── seatLocks: { seatId, expiresAt }
│
└── Checkout Page
    ├── status: 'processing' | 'success' | 'failed'
    └── paymentData: { bookingId, amount }
```

## Theme Color Mapping

```
Theme
├── dark
│   ├── Primary: #00D9FF (Cyan)
│   ├── Secondary: #FF1493 (Magenta)
│   ├── Accent: #FFD700 (Gold)
│   ├── ParticleColor: #00D9FF
│   ├── LightColor1: #00D9FF (Key light)
│   ├── LightColor2: #FF1493 (Fill light)
│   └── LightColor3: #00FF00 (Back light)
│
├── neon
│   ├── Primary: #0FFF50
│   ├── Secondary: #FF006E
│   ├── Accent: #8338EC
│   └── (light colors follow)
│
├── ocean
│   ├── Primary: #00CED1
│   ├── Secondary: #1E90FF
│   ├── Accent: #00BFFF
│   └── (light colors follow)
│
├── nature
│   ├── Primary: #00D95F
│   ├── Secondary: #9D5D00
│   ├── Accent: #FFD700
│   └── (light colors follow)
│
└── sunset
    ├── Primary: #FF6B35
    ├── Secondary: #F7931E
    ├── Accent: #FDB833
    └── (light colors follow)
```

## Performance Optimization

```
Particle System
├── Float32Array (efficient memory)
├── Geometry reuse (single buffer)
├── Update on demand (only positions)
└── Size: ~1000 particles (configurable)

Canvas Rendering
├── WebGL renderer (GPU accelerated)
├── Frustum culling (hidden objects)
├── LOD system (optional)
└── Target: 60 FPS

Component Rendering
├── React components (re-render on theme)
├── Memoization (prevent re-renders)
├── Context (efficient updates)
└── localStorage (instant persistence)
```

## API Integration Points

```
Supabase Connection
├── Movies
│   └── GET /api/movies (fetch all)
│
├── Showtimes
│   └── GET /api/showtimes/[movieId]
│
├── Seat Locks
│   ├── POST /api/seats/lock (create)
│   ├── PUT /api/seats/lock (update)
│   └── DELETE /api/seats/lock (release)
│
├── Bookings
│   ├── POST /api/bookings (create)
│   ├── GET /api/bookings/[id]
│   └── PUT /api/bookings/[id] (update status)
│
└── Payments
    ├── POST /api/process-payment
    └── POST /api/process-prebookings (cron)
```

## Error Handling Flow

```
Seat Lock Error
├── "duplicate key value" detected
├── Trigger fallback: check existing lock
├── If exists: update expires_at
├── If not: create new lock
└── User experience: seamless

Payment Error
├── "processing" state shown
├── Error occurs
├── Update to "failed" state
├── Show retry button
└── User can retry

Theme Error
├── Theme not found
├── Fallback to 'dark'
├── Log warning
└── Continue normally
```

## Mobile Optimization

```
Desktop
├── Particle Count: 1000
├── Resolution: 1920x1080
├── FPS Target: 60
└── Interaction: Mouse + Keyboard

Tablet
├── Particle Count: 750
├── Resolution: Adaptive
├── FPS Target: 60
└── Interaction: Touch + Keyboard

Mobile
├── Particle Count: 300-500
├── Resolution: 720-1080
├── FPS Target: 30-60
└── Interaction: Touch only
```

## Security & Performance

```
Client-Side
├── Theme stored in localStorage (safe)
├── No sensitive data in localStorage
├── All 3D rendering on GPU
└── No blocking operations

Server-Side
├── Seat lock validation
├── Booking verification
├── Payment processing (secure)
└── Auto-booking via cron

Database
├── RLS policies enabled
├── Seat lock constraints
├── Booking validation
└── Audit logging
```

---

## Summary Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    User Interface Layer                         │
│  TheatreHomePage3D | SeatSelector3D | Checkout3DAnimation      │
└────────────┬───────────────────────────────────────┬────────────┘
             │                                       │
        ┌────▼─────────────┐                    ┌───▼──────────┐
        │  Canvas Layer    │                    │  UI Overlay  │
        │  (Three.js 3D)   │                    │  (React)     │
        └────┬─────────────┘                    └───┬──────────┘
             │                                      │
        ┌────▼──────────────────────────────────────▼─────┐
        │         Theme Context (useTheme3D)              │
        │  ┌──────────────────────────────────────────┐   │
        │  │  5 Themes × N Color Properties          │   │
        │  │  + localStorage persistence              │   │
        │  └──────────────────────────────────────────┘   │
        └────┬──────────────────────────────────────────┬──┘
             │                                          │
        ┌────▼──────────┐                    ┌─────────▼────┐
        │ 3D Rendering  │                    │ Database     │
        │ (WebGL/GPU)   │                    │ (Supabase)   │
        └───────────────┘                    └──────────────┘
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2024  
**Status**: ✅ Complete
