---
name: app-design-skill
description: Create beautiful, mobile-first web apps with exceptional UI/UX design quality using Next.js 15+, Pretendard font, and modern design patterns. Focus on intuitive user experience and emotional design without SEO or marketing elements.
---

# Mobile-First Web App Design Skill

## Overview

This skill enables creation of **beautiful, user-centered web applications** with:
- **Mobile-First Design**: Optimized for touch interfaces and small screens
- **Exceptional UI Quality**: Clean, intuitive, emotionally resonant design
- **Modern Stack**: Next.js 15+ with TypeScript, Tailwind CSS, and ShadCN UI
- **Pretendard Typography**: Clean, readable Korean-optimized font
- **Dark Mode Support**: Built-in theme switching

**Philosophy**: A web app should be intuitive without tutorials, beautiful without complexity, and emotionally engaging without overwhelming users.

## When to Use This Skill

Use this skill when users request:
- Mobile-first web application development
- Next.js or React-based web apps
- Apps with focus on user experience and design quality
- Personal productivity, tracking, or journaling apps
- Apps requiring emotional design (memories, wellness, creativity)
- Projects that need both mobile and desktop support

## Design Thinking: Before You Code

Before implementing any web app, understand the **context and emotional direction**:

### 1. Understand Context
- **Purpose**: What problem does this app solve? What experience are we creating?
- **Target Users**: Who will use this? Age, tech-savviness, emotional needs?
- **Platform Priority**: Mobile-first? Desktop support level?
- **Core Actions**: What are the 2-3 main things users will do?

### 2. Choose an Emotional Direction

Pick a clear emotional tone that guides all design decisions:

**Warm & Nostalgic**
- Earth tones, amber, terracotta, warm browns
- Soft shadows, rounded corners
- Gentle animations (fade, slide)
- Examples: Memory apps, journaling, life tracking

**Clean & Professional**
- Cool grays, blues, minimal accent colors
- Sharp corners, clear hierarchy
- Subtle transitions
- Examples: Productivity tools, finance apps, dashboards

**Playful & Energetic**
- Bright colors, high contrast
- Bouncy animations
- Rounded shapes, friendly icons
- Examples: Habit trackers, learning apps, creative tools

**Calm & Minimal**
- Monochrome or limited palette (2-3 colors max)
- Generous whitespace
- Minimal motion
- Examples: Meditation apps, reading apps, note-taking

**Modern & Sleek**
- Gradients, glassmorphism
- Smooth animations
- Contemporary color schemes
- Examples: Tech tools, design apps, portfolios

**CRITICAL**: Choose ONE clear direction. Execute it consistently across all UI elements.

### 3. Define Your Design System

**Typography (Pretendard Only)**
- **Font**: Pretendard for all text (Korean-optimized, clean, readable)
- **Weights**: Use 400 (regular), 600 (semibold), 700 (bold)
- **Scale**: Establish clear hierarchy
  - H1: 2rem (32px) mobile, 2.5rem (40px) desktop
  - H2: 1.5rem (24px) mobile, 1.875rem (30px) desktop
  - H3: 1.25rem (20px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)

**Color Palette**
- **Primary Color**: Main brand color (buttons, links, accents)
- **Secondary Color**: Supporting color for variety
- **Neutral Palette**: Grays for text, borders, backgrounds
- **Semantic Colors**: Success (green), error (red), warning (yellow), info (blue)
- **Dark Mode**: Define all colors for both light and dark themes

**Spacing System**
- Use consistent spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- Mobile: Tighter spacing (16px, 24px)
- Desktop: More generous spacing (24px, 32px, 48px)

**Motion Strategy**
- **Page Transitions**: Fade or slide between routes
- **Element Reveals**: Fade-up on scroll or mount
- **Interactions**: Subtle scale, color shift on tap/click
- **Loading States**: Skeleton screens or spinners
- **Duration**: Fast (150ms), Medium (300ms), Slow (500ms)

## Mobile-First UI Patterns

### Core Mobile Patterns

#### 1. Bottom Navigation (Tab Bar)
**When to use**: 3-5 main app sections

**Design**:
- Fixed to bottom of screen
- Icon + label for each tab
- Active state clearly visible
- Safe area padding on iOS

**Accessibility**:
- Min touch target: 44x44px
- Clear active/inactive states
- Haptic feedback (if supported)

#### 2. Floating Action Button (FAB)
**When to use**: Primary action (add, create, compose)

**Design**:
- Large circular button (56x56px)
- Positioned bottom-right or bottom-center
- Distinct color from other UI
- Elevation shadow

**Variants**:
- Single FAB: One primary action
- FAB with menu: Expands to show multiple actions
- Center FAB: Combined with bottom nav (center position)

#### 3. Top App Bar (Header)
**When to use**: Every screen for navigation context

**Design**:
- Logo or screen title on left
- Actions on right (search, settings, etc)
- Sticky or scrolls away
- Backdrop blur when over content

#### 4. Cards
**When to use**: Grouping related information

**Design**:
- Rounded corners (8px-16px)
- Subtle shadow or border
- Padding: 16px-24px
- Tappable area clear
- Preview content (image, title, metadata)

#### 5. Lists
**When to use**: Scrollable content, items, records

**Design**:
- Each item min 56px height
- Clear separators (dividers or spacing)
- Swipe actions (optional: delete, archive)
- Pull-to-refresh at top

#### 6. Modals & Bottom Sheets
**When to use**: Focused tasks, forms, selections

**Bottom Sheet** (preferred on mobile):
- Slides up from bottom
- Dismissible by drag down or tap outside
- Contains form or selections

**Modal** (use sparingly):
- Centered overlay
- Backdrop dimming
- Close button clearly visible

#### 7. Forms
**Design**:
- One column layout on mobile
- Large input fields (min 44px height)
- Clear labels above inputs
- Floating labels (optional)
- Inline validation
- Submit button at bottom, full width

#### 8. Empty States
**When to use**: No data, first time experience

**Design**:
- Centered illustration or icon
- Helpful message
- Clear CTA to add first item

### Navigation Patterns

#### Pattern A: Bottom Tab Bar (3-4 tabs)
```
Home | Explore | Profile
```
Best for: Apps with distinct sections

#### Pattern B: Bottom Tab Bar + Center FAB
```
Home | [FAB] | Profile
```
Best for: Apps with frequent creation action

#### Pattern C: Hamburger Menu + Top Bar
```
≡ Menu | Title | Actions
```
Best for: Apps with 5+ sections

#### Pattern D: Top Tabs
```
Tab 1 | Tab 2 | Tab 3
```
Best for: Content filtering/categorization

## Web App UI Elements

### Essential Components

#### Dashboard / Stats Screen
**Purpose**: Overview of user data, statistics

**Elements**:
- Summary cards (count, streak, total)
- Charts or graphs (line, bar, pie)
- Recent activity list
- Quick action buttons

**Layout**:
- Grid of stat cards (2 columns on mobile)
- Charts full-width
- Recent list below

#### Template/Block Builder (Notion-style)
**Purpose**: User-created content structures

**Elements**:
- Block selector (text, image, number, date, etc)
- Drag handles for reordering
- Block settings (edit, delete, duplicate)
- Add block button

**Blocks**:
- Text block (rich text editor)
- Image block (upload, preview)
- Number block (input with optional unit)
- Date block (date picker)
- Graph block (data visualization)
- Map block (location picker)

#### Category Cards
**Purpose**: Show user's templates/categories

**Design**:
```
┌─────────────────────────────┐
│  [Preview Content]          │  ← User-selected block or first block
│  (Image/Graph/Text/Map)     │     (Large, as background)
│                             │
│  Template Name              │  ← e.g., "Workout Log"
│  42 records                 │  ← Total count
└─────────────────────────────┘
```

**Interaction**:
- Tap to open category detail
- Long press for options (edit, delete)
- Preview shows latest entry

#### Dual View Modes

**Daily View**:
- Calendar or date picker
- Select date → show full entry for that date
- All blocks displayed

**Element View**:
- Filter by block type
- Show only photos, or only graphs, or only text
- Timeline of that element across all dates

#### List/Grid Toggle
- List view: Full cards, vertical scroll
- Grid view: Compact cards, 2-3 columns

#### Settings Screen
- Profile section
- Appearance (theme toggle)
- Preferences
- About/Help
- Logout/Account

### Animation Guidelines

#### Page Transitions
```css
/* Fade transition */
opacity: 0 → 1
duration: 300ms

/* Slide transition */
transform: translateX(100%) → translateX(0)
duration: 300ms
```

#### Element Reveals
```css
/* Fade up on scroll */
opacity: 0
transform: translateY(20px)
→
opacity: 1
transform: translateY(0)
duration: 500ms
```

#### Button/Card Interactions
```css
/* Tap feedback */
scale: 1 → 0.95 (on press) → 1
duration: 150ms

/* Hover (desktop) */
scale: 1 → 1.02
shadow: sm → md
duration: 200ms
```

## Technology Stack Requirements

### Required Technologies
- **Next.js 15+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **ShadCN UI** for base components
- **Pretendard** font (Google Fonts or self-hosted)

### Font Setup: Pretendard

**Option A: Google Fonts (Recommended for external hosting)**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

// Note: Use Inter as fallback, then switch to Pretendard via CSS
const inter = Inter({ subsets: ['latin'] })

// Or use next/font/local for self-hosted Pretendard
import localFont from 'next/font/local'

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
})
```

**Option B: CSS Import (Simple)**
```css
/* app/globals.css */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

body {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

**Option C: Self-Hosted (Best Performance)**
1. Download Pretendard from https://github.com/orioncactus/pretendard
2. Place fonts in `public/fonts/`
3. Use `next/font/local` (see Option A)

### ShadCN UI Components

Install these essential components:

```bash
# Navigation & Layout
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add separator
npx shadcn@latest add tabs

# Forms
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add label

# Overlays
npx shadcn@latest add dialog
npx shadcn@latest add sheet (bottom sheet)
npx shadcn@latest add popover
npx shadcn@latest add dropdown-menu

# Feedback
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add badge
npx shadcn@latest add progress
npx shadcn@latest add skeleton

# Data Display
npx shadcn@latest add table
npx shadcn@latest add avatar
npx shadcn@latest add accordion
npx shadcn@latest add calendar
```

**IMPORTANT**: ShadCN components are starting points. Customize them:
- Modify colors in `tailwind.config.ts`
- Override styles with `className` props
- Create wrapper components for app-specific variants

### Dark Mode Setup

```typescript
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... light mode colors */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode colors */
  }
}
```

## Project Structure

```
webapp/
├── app/
│   ├── layout.tsx          # Root layout with font, theme
│   ├── page.tsx            # Dashboard/Home
│   ├── globals.css         # Design system CSS
│   ├── (auth)/             # Auth pages (optional)
│   ├── dashboard/          # Main app screens
│   ├── settings/           # Settings screen
│   └── api/                # API routes (if needed)
├── components/
│   ├── ui/                 # ShadCN components
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   ├── TopBar.tsx
│   │   └── FAB.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── RecentActivity.tsx
│   │   └── Chart.tsx
│   ├── category/
│   │   ├── CategoryCard.tsx
│   │   └── CategoryGrid.tsx
│   ├── template/
│   │   ├── BlockEditor.tsx
│   │   ├── TextBlock.tsx
│   │   ├── ImageBlock.tsx
│   │   └── ... (other blocks)
│   └── shared/
│       ├── EmptyState.tsx
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── utils.ts            # Helper functions
│   ├── types.ts            # TypeScript types
│   └── constants.ts        # Constants, configs
├── public/
│   ├── fonts/              # Self-hosted fonts (if used)
│   └── images/             # Static images
└── package.json
```

## Implementation Workflow

### Step 1: Design System Setup

**1.1 Define CSS Variables**

```css
/* app/globals.css */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

@layer base {
  :root {
    /* Colors - Light Mode (Warm theme example) */
    --primary: 25 95% 53%;        /* Amber/Gold */
    --secondary: 10 80% 50%;      /* Terracotta */
    --background: 0 0% 100%;      /* White */
    --foreground: 20 10% 10%;     /* Near black */

    /* Neutrals */
    --muted: 25 20% 95%;
    --border: 25 20% 85%;

    /* Semantic */
    --success: 142 76% 36%;
    --error: 0 84% 60%;
    --warning: 38 92% 50%;

    /* Spacing */
    --spacing-unit: 0.25rem; /* 4px */
  }

  .dark {
    /* Colors - Dark Mode */
    --primary: 25 95% 53%;
    --secondary: 10 80% 50%;
    --background: 20 10% 10%;
    --foreground: 0 0% 95%;

    --muted: 20 10% 15%;
    --border: 20 10% 25%;
  }

  * {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  }
}
```

**1.2 Update Tailwind Config**

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... etc
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'unit': 'var(--spacing-unit)',
      },
    },
  },
}
```

### Step 2: Setup Layout Structure

**2.1 Root Layout**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'App Name',
  description: 'App description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**2.2 Main Layout with Navigation**

```typescript
// components/layout/MainLayout.tsx
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { FAB } from './FAB'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <FAB />
    </div>
  )
}
```

### Step 3: Build Core Components

**3.1 Bottom Navigation**

```typescript
// components/layout/BottomNav.tsx
'use client'

import { Home, Search, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()

  const items = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Explore', href: '/explore' },
    { icon: User, label: 'Profile', href: '/profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**3.2 Floating Action Button**

```typescript
// components/layout/FAB.tsx
'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FAB() {
  return (
    <Button
      size="lg"
      className="fixed bottom-20 right-4 md:bottom-4 w-14 h-14 rounded-full shadow-lg"
      onClick={() => {/* Handle add action */}}
    >
      <Plus className="w-6 h-6" />
    </Button>
  )
}
```

**3.3 Category Card**

```typescript
// components/category/CategoryCard.tsx
import { Card } from '@/components/ui/card'
import Image from 'next/image'

interface CategoryCardProps {
  name: string
  count: number
  previewContent: {
    type: 'image' | 'text' | 'graph'
    data: string
  }
}

export function CategoryCard({ name, count, previewContent }: CategoryCardProps) {
  return (
    <Card className="relative overflow-hidden h-48 cursor-pointer hover:shadow-lg transition-shadow">
      {/* Preview Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60">
        {previewContent.type === 'image' && (
          <Image
            src={previewContent.data}
            alt={name}
            fill
            className="object-cover"
          />
        )}
        {previewContent.type === 'text' && (
          <div className="p-4 text-foreground/30 text-sm">
            {previewContent.data}
          </div>
        )}
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm opacity-80">{count}개 기록</p>
      </div>
    </Card>
  )
}
```

### Step 4: Implement Mobile Interactions

**4.1 Touch Feedback**

```css
/* globals.css */
@layer utilities {
  .touch-feedback {
    @apply active:scale-95 transition-transform duration-150;
  }

  .touch-highlight {
    -webkit-tap-highlight-color: transparent;
  }
}
```

**4.2 Pull-to-Refresh (Optional)**

Use library like `react-simple-pull-to-refresh`

**4.3 Swipe Gestures (Optional)**

Use library like `react-swipeable` for swipe-to-delete, etc.

### Step 5: Responsive Design

**Mobile-First Approach:**

```typescript
// Always start with mobile styles
<div className="p-4 md:p-8">
  {/* 16px padding on mobile, 32px on desktop */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column mobile, 2 desktop, 3 large desktop */}
</div>
```

**Breakpoints:**
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktops)
- `xl`: 1280px (large desktops)

### Step 6: Performance Optimization

**6.1 Images**
```typescript
import Image from 'next/image'

<Image
  src="/path"
  alt="Description"
  width={400}
  height={300}
  className="object-cover"
  priority={false} // true for above-fold only
/>
```

**6.2 Code Splitting**
```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // client-only if needed
})
```

**6.3 Font Optimization**
- Use `next/font` for automatic optimization
- Subset fonts if possible (latin only, etc)
- Use variable fonts (Pretendard Variable)

### Step 7: Accessibility

**7.1 Semantic HTML**
```typescript
<header>...</header>
<nav>...</nav>
<main>...</main>
<footer>...</footer>
```

**7.2 ARIA Labels**
```typescript
<button aria-label="Add new item">
  <Plus />
</button>
```

**7.3 Keyboard Navigation**
- Test with Tab key
- Ensure focus styles visible
- Modal/sheet should trap focus

**7.4 Reduced Motion**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Validation Checklist

### Design Quality ✅
- [ ] **Emotional direction** chosen and consistent
- [ ] **Pretendard font** used for all text
- [ ] **Color palette** defined with CSS variables
- [ ] **Dark mode** implemented and tested
- [ ] **Animations** smooth and purposeful
- [ ] **Touch targets** minimum 44x44px
- [ ] **One-handed use** optimized for mobile

### Mobile-First UI ✅
- [ ] **Bottom navigation** or appropriate pattern
- [ ] **FAB** for primary action (if applicable)
- [ ] **Top bar** with context/navigation
- [ ] **Cards** for content grouping
- [ ] **Forms** mobile-optimized (large inputs)
- [ ] **Empty states** for no data scenarios
- [ ] **Loading states** skeleton or spinner

### Technical Requirements ✅
- [ ] Next.js 15+ with App Router
- [ ] TypeScript types defined
- [ ] Tailwind CSS styling
- [ ] ShadCN UI components customized
- [ ] Responsive design (mobile-first)
- [ ] Images optimized (Next.js Image)
- [ ] Accessibility standards (WCAG AA)
- [ ] Performance optimized

### Final Polish ✅
- [ ] Tested on actual mobile device
- [ ] Tested in dark mode
- [ ] Tested on desktop (responsive)
- [ ] Keyboard navigation works
- [ ] Touch interactions feel responsive
- [ ] No horizontal scroll on mobile
- [ ] Safe area insets handled (iOS)

## Best Practices

### Mobile UX Principles
1. **One-handed operation**: Primary actions within thumb reach
2. **Clear hierarchy**: Most important info visible first
3. **Instant feedback**: Loading states, haptics, animations
4. **Forgiving interactions**: Undo, confirm destructive actions
5. **Progressive disclosure**: Show details on demand

### Typography Best Practices
- **Pretendard only**: Don't mix fonts
- **Scale**: 16px minimum body text on mobile
- **Line height**: 1.5-1.6 for body text
- **Contrast**: WCAG AA minimum (4.5:1)
- **Weights**: Use 400, 600, 700 appropriately

### Color Best Practices
- **Warm palette**: Amber, terracotta, warm neutrals for emotional apps
- **Cool palette**: Blues, grays for professional apps
- **Limited**: 2-3 main colors max
- **Dark mode**: Test all colors in both themes
- **Semantic**: Consistent meanings (green = success, red = error)

### Animation Best Practices
- **Purpose**: Every animation serves UX
- **Duration**: Fast interactions (150ms), medium transitions (300ms)
- **Easing**: Use cubic-bezier for natural feel
- **Reduced motion**: Always respect user preference
- **Performance**: Use transform and opacity only

### Performance Best Practices
- **Images**: WebP format, lazy loading, proper sizing
- **Fonts**: Pretendard Variable for smallest size
- **Code splitting**: Dynamic imports for heavy features
- **Target**: LCP < 2.5s, FID < 100ms, CLS < 0.1

## Common Patterns

### Personal Productivity Apps
**Examples**: Todo lists, habit trackers, journals
**UI Focus**:
- Dashboard with stats and streaks
- Quick add via FAB
- List view for items
- Calendar view for daily entries
- Progress visualization (charts)

### Memory/Tracking Apps
**Examples**: Photo journals, life logs, travel diaries
**UI Focus**:
- Category cards with preview images
- Timeline view (chronological)
- Gallery view (grid of images)
- Rich media support (photos, videos, maps)
- Search and filter

### Data Recording Apps
**Examples**: Workout logs, expense trackers, mood journals
**UI Focus**:
- Custom templates/forms
- Graph and chart visualization
- Quick numerical input
- Date-based organization
- Statistics dashboard

## Notes & Philosophy

### Core Principles
1. **Mobile-first**: Design for small screens, enhance for large
2. **User-centered**: Intuitive without tutorials
3. **Emotional design**: Connect with users through aesthetics
4. **Pretendard typography**: Clean, readable, Korean-optimized
5. **Dark mode**: Equal quality in both themes

### Success Metrics
- **Task completion**: Can users complete core actions easily?
- **Time to value**: How quickly do users see benefits?
- **Emotional response**: Do users enjoy using the app?
- **Retention**: Do users return regularly?

### Remember
Every web app should feel native to mobile, beautiful in both themes, and emotionally resonant with users. Pretendard ensures readability, warm colors create emotional connection, and smooth animations make interactions delightful.

**The best apps are invisible**: Users focus on their tasks, not the interface.
