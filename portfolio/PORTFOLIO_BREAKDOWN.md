# Portfolio Codebase Breakdown

A comprehensive reference for understanding and extending this portfolio.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Design System](#design-system)
4. [Component Architecture](#component-architecture)
5. [Data Layer (Supabase)](#data-layer-supabase)
6. [Game Engine](#game-engine)
7. [Animation Patterns](#animation-patterns)
8. [Adding New Features](#adding-new-features)
9. [Build & Development](#build--development)

---

## Project Structure

```
portfolio/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Home page (all sections)
│   │   ├── layout.tsx            # Root layout, fonts, SEO
│   │   ├── globals.css           # Design tokens + Tailwind
│   │   ├── resume/               # Resume PDF viewer
│   │   ├── slingshot/            # Game page
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── layout/               # Navbar, SmoothScroll
│   │   ├── sections/             # Hero, About, Experience, etc.
│   │   └── slingshot/            # Game components
│   └── lib/
│       ├── utils.ts              # Utilities (cn for class merging)
│       └── supabase.ts           # Supabase client
├── slingshot-engine/             # C++ game engine → WASM
│   ├── CMakeLists.txt
│   ├── src/                      # Engine source code
│   └── levels/                   # Level definitions
├── public/
│   ├── wasm/                     # Compiled game (js, wasm, data)
│   └── sitemap.xml, robots.txt   # SEO assets
├── supabase/migrations/          # Database migrations
└── Makefile                      # Build automation
```

---

## Tech Stack

### Core Framework

| Technology       | Version | Purpose                          |
| ---------------- | ------- | -------------------------------- |
| Next.js          | 16.x    | React framework with App Router  |
| React            | 19.x    | UI library                       |
| TypeScript       | 5.x     | Type safety                      |
| Bun              | -       | Package manager & runtime        |

### Styling & Animation

| Library          | Purpose                                      |
| ---------------- | -------------------------------------------- |
| Tailwind CSS 4   | Utility-first styling                        |
| GSAP 3.14        | Timeline animations, ScrollTrigger           |
| Lenis 1.3        | Smooth scrolling (integrated with GSAP)      |
| tsparticles      | Particle effects (Skills section)            |
| Framer Motion    | React transitions (minimal usage)            |

### Backend

| Service          | Purpose                                      |
| ---------------- | -------------------------------------------- |
| Supabase         | PostgreSQL database, auth, storage           |

### Game Engine

| Technology       | Purpose                                      |
| ---------------- | -------------------------------------------- |
| C++ / Emscripten | Custom engine compiled to WebAssembly        |
| SDL2             | Cross-platform rendering                     |
| WebGL2           | Hardware-accelerated graphics                |

### Dev Tools

| Tool             | Purpose                                      |
| ---------------- | -------------------------------------------- |
| ESLint 9         | Linting (Next.js + TypeScript presets)       |
| Prettier 3.7     | Formatting + Tailwind class sorting          |
| Sharp            | Image optimization                           |

---

## Design System

### Color Palette

Defined in `src/app/globals.css` via `@theme`:

```css
/* Primary Gradient (Plum → Rose) */
--color-primary-dark:   #410056;  /* Deep Plum */
--color-primary-mid:    #8e4585;  /* Plum */
--color-primary-light:  #c4739b;  /* Dusty Rose */

/* Accent */
--color-accent-primary: #f59e0b;  /* Warm Amber */
--color-accent-hover:   #fbbf24;  /* Light Amber */

/* Background */
--color-bg-dark:        #0a0414;  /* Near-black, purple tint */
--color-bg-surface:     #1a1125;  /* Elevated surface */

/* Text */
--color-text-primary:   #faf8fc;  /* Off-white */
--color-text-muted:     #c1b3cd;  /* Muted lavender */
```

**Usage in Tailwind:**
```tsx
<div className="bg-bg-dark text-text-primary" />
<button className="bg-accent-primary hover:bg-accent-hover" />
<h1 className="bg-plum-gradient bg-clip-text text-transparent" />
```

### Typography

| Variable         | Font           | Usage              |
| ---------------- | -------------- | ------------------ |
| `--font-sans`    | Inter          | Body text          |
| `--font-heading` | Space Grotesk  | Headings           |
| `--font-mono`    | JetBrains Mono | Code / technical   |

### Utility Classes

```css
/* Glass card effect */
.glass-card {
  @apply bg-bg-surface/80 backdrop-blur-md border border-primary-mid/20;
}

/* Gradient text */
.text-gradient {
  @apply bg-plum-gradient bg-clip-text text-transparent;
}
```

---

## Component Architecture

### Layout Components (`src/components/layout/`)

#### Navbar.tsx
- Sticky header with scroll-based opacity
- Desktop nav + mobile hamburger menu
- Links to all sections + resume button

#### SmoothScroll.tsx
- Client-side wrapper component
- Integrates Lenis smooth scroll with GSAP ScrollTrigger
- **Must wrap page content** for scroll animations to work

### Section Components (`src/components/sections/`)

Each section follows this pattern:

```tsx
// 1. Imports
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

// 2. Data fetching (if needed)
const { data } = await supabase.from('table').select()

// 3. Animation setup
useGSAP(() => {
  gsap.timeline()
    .from('.element', { opacity: 0, y: 20 })
}, { scope: containerRef })

// 4. Render with section ID for navigation
return (
  <section id="section-name" ref={containerRef}>
    {/* content */}
  </section>
)
```

#### Section Overview

| Section           | Data Source            | Animation                        |
| ----------------- | ---------------------- | -------------------------------- |
| Hero              | Supabase storage       | Sequential timeline              |
| About             | Supabase storage       | Scroll fade-in                   |
| Experience        | `experiences` table    | Timeline tracing beam + cards    |
| Projects          | `projects` table       | Grid with hover effects          |
| Skills            | `skills` table         | Orbital system with pinning      |
| SlingshotSection  | Static                 | Simple fade-in                   |
| Contact           | Static                 | Stagger fade-in                  |

### Game Components (`src/components/slingshot/`)

| Component            | Purpose                                    |
| -------------------- | ------------------------------------------ |
| SlingshotCanvas.tsx  | WASM module loader, canvas management      |
| SlingshotUI.tsx      | HUD, menus, overlays (Rules/Win/Lose)      |
| Leaderboard.tsx      | Top 10 display modal                       |
| useSlingshotGame.ts  | Player state hook (localStorage + Supabase)|

---

## Data Layer (Supabase)

### Tables

```sql
-- Experience entries
experiences (
  id, company, role, period, description,
  image_name, display_order
)

-- Portfolio projects
projects (
  id, title, description, tech_stack[],
  github_url, live_url, image_name, display_order
)

-- Skill categories (Frontend, Backend, etc.)
skill_categories (id, name, display_order)

-- Individual skills
skills (
  id, name, category_id, proficiency,
  icon_name, display_order
)

-- Game players
slingshot_players (id, ...)

-- Leaderboard view
slingshot_leaderboard (display_name, level_id, attempts, rank)
```

### Storage Buckets

**`assets` bucket (public):**
- `profile_picture.jpg` - Hero image
- `about_me_fun.jpg` - About section
- Experience company logos
- Project screenshots
- `resume_benjamin_marler.pdf`

### Client Usage

```tsx
import { supabase } from '@/lib/supabase'

// Fetch data
const { data } = await supabase
  .from('projects')
  .select('*')
  .order('display_order')

// Get image URL
const imageUrl = supabase.storage
  .from('assets')
  .getPublicUrl('image.jpg').data.publicUrl
```

---

## Game Engine

### Architecture

```
slingshot-engine/src/
├── main.cpp           # WASM entry + JS bindings
├── core/              # Rendering (SDL2 + WebGL2)
├── physics/           # Orbital mechanics simulation
├── game/              # Game logic, state machine
├── entities/          # Planets, ship, projectiles
├── math/              # Vector math
└── config/            # Game configuration
```

### JavaScript Interface

The WASM module exposes:

```typescript
interface SlingshotModule {
  startGame(): void
  resetGame(): void
  retryLevel(): void
  setLevel(levelId: number): void
  getAttempts(): number
  getCurrentLevel(): number
  getGameState(): number
  getTotalLevels(): number
  dismissRules(): void
}
```

### Callbacks to JavaScript

```javascript
// Set these on window before loading module
window.onSlingshotWin = (levelId, attempts) => { ... }
window.onSlingshotLose = () => { ... }
```

### Building the Engine

```bash
make init       # Configure CMake with Emscripten
make build      # Compile to WASM → public/wasm/
make rebuild    # Clean + build
```

---

## Animation Patterns

### GSAP + Lenis Integration

The `SmoothScroll` component syncs Lenis with GSAP:

```tsx
// In SmoothScroll.tsx
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
```

### ScrollTrigger Animations

```tsx
useGSAP(() => {
  gsap.from('.card', {
    scrollTrigger: {
      trigger: '.card',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    y: 50,
    opacity: 0
  })
})
```

### Pinned Sections (Skills)

```tsx
ScrollTrigger.create({
  trigger: containerRef.current,
  start: 'top top',
  end: '+=200%',
  pin: true,
  scrub: 1,
  onUpdate: (self) => {
    // Animate based on scroll progress (0-1)
  }
})
```

### Timeline Sequences (Hero)

```tsx
gsap.timeline()
  .from('.image', { scale: 0.8, opacity: 0 })
  .from('.name', { y: 20, opacity: 0 }, '-=0.3')
  .from('.tagline', { y: 20, opacity: 0 }, '-=0.2')
  .from('.buttons', { y: 20, opacity: 0 }, '-=0.2')
```

---

## Adding New Features

### Adding a New Section

1. **Create component** in `src/components/sections/`:
   ```tsx
   // NewSection.tsx
   'use client'
   import { useRef } from 'react'
   import { useGSAP } from '@gsap/react'
   import gsap from 'gsap'

   export default function NewSection() {
     const containerRef = useRef<HTMLElement>(null)

     useGSAP(() => {
       // Animations here
     }, { scope: containerRef })

     return (
       <section id="new-section" ref={containerRef} className="min-h-screen">
         {/* Content */}
       </section>
     )
   }
   ```

2. **Add to home page** (`src/app/page.tsx`):
   ```tsx
   import NewSection from '@/components/sections/NewSection'

   // In return:
   <NewSection />
   ```

3. **Add nav link** (if needed) in `Navbar.tsx`

### Adding New Data

1. **Create Supabase table** via migration or dashboard
2. **Fetch in component**:
   ```tsx
   const { data } = await supabase
     .from('new_table')
     .select('*')
     .order('display_order')
   ```

### Adding a New Page

Create `src/app/new-page/page.tsx`:

```tsx
export const metadata = {
  title: 'Page Title | Benjamin Marler'
}

export default function NewPage() {
  return (
    <main className="min-h-screen bg-bg-dark text-text-primary">
      {/* Content */}
    </main>
  )
}
```

### Adding New Animations

1. **Import GSAP hook**:
   ```tsx
   import { useGSAP } from '@gsap/react'
   import gsap from 'gsap'
   ```

2. **Use within component**:
   ```tsx
   useGSAP(() => {
     gsap.from('.target', {
       scrollTrigger: { trigger: '.target', start: 'top 80%' },
       y: 30,
       opacity: 0,
       duration: 0.6
     })
   }, { scope: containerRef })
   ```

### Extending the Game

1. **Add level** in `slingshot-engine/levels/`
2. **Rebuild**: `make build`
3. **Update UI** if needed in `SlingshotUI.tsx`

---

## Build & Development

### Commands

| Command        | Action                                    |
| -------------- | ----------------------------------------- |
| `bun dev`      | Start Next.js dev server                  |
| `bun build`    | Production build                          |
| `bun lint`     | Run ESLint                                |
| `make up`      | Build WASM + start dev server             |
| `make build`   | Compile C++ to WASM                       |
| `make rebuild` | Clean + full rebuild                      |

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_PROJECT_ID=xxx
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxx
NEXT_PUBLIC_APP_URL=https://bamarler.com
```

### Deployment

- **Frontend**: Vercel (auto-deploys from GitHub)
- **Backend**: Supabase cloud
- **Game**: Static files in `/public/wasm/`

---

## Quick Reference

### File Naming

| Type       | Convention                  | Example                 |
| ---------- | --------------------------- | ----------------------- |
| Components | PascalCase                  | `Hero.tsx`              |
| Hooks      | camelCase with `use` prefix | `useSlingshotGame.ts`   |
| Utils      | camelCase                   | `utils.ts`              |
| Pages      | `page.tsx` in folder        | `app/resume/page.tsx`   |

### Common Imports

```tsx
// Utilities
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// Animation
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Icons
import { IconName } from 'lucide-react'
```

### Styling Patterns

```tsx
// Conditional classes
className={cn(
  'base-classes',
  condition && 'conditional-classes'
)}

// Design tokens
className="bg-bg-dark text-text-primary"
className="bg-primary-mid hover:bg-primary-light"
className="border-accent-primary"
```
