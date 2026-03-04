# AI Prompt: Banking App Design System (CSS, Colors, Dashboard, Animations)

Use this prompt to instruct an AI to design a **modern, green, luminous banking app** that looks polished and professional—**not dark, bullet-heavy, or generic**. This design spec is derived from the give-app-main codebase and should be applied to your banking app (Unit white-label wrapper, dashboard, etc.).

---

## Master Prompt (Copy & Paste)

```
You are designing a banking application. The current design is dark, bullet-heavy, and looks terrible. Your job is to make it look really nice: green, luminous, with a modern dashboard that displays beautifully with animations.

CRITICAL DESIGN GOALS:
- Use a GREEN-focused color palette (emerald, teal, mint) — NOT dark gray or black
- Prefer LIGHT mode by default — luminous whites, soft backgrounds
- Use Barlow font for typography
- Add smooth animations: fade-in, stagger, hover lifts, shimmer effects
- Display splits/segments in DIFFERENT colors (blue, purple, amber, cyan, etc.) so each category is visually distinct
- Cards should feel premium: subtle shadows, rounded corners, hover states
- Avoid: bullet lists, flat dark backgrounds, generic "banking gray"

---

## 1. COLOR PALETTE

### Primary Brand (Green — use for actions, active states, links, accents)
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Emerald 500 | `#10b981` | `emerald-500` | Primary buttons, active nav, links |
| Emerald 600 | `#059669` | `emerald-600` | Hover states, darker accents |
| Emerald 400 | `#34d399` | `emerald-400` | Lighter accents, highlights |
| Teal 600 | `#0d9488` | `teal-600` | Gradient end, charts |
| Cyan 500 | `#06b6d4` | `cyan-500` | Accent in gradients |

### Accent Gradient (buttons, logos, highlights)
```css
background: linear-gradient(135deg, #10b981 0%, #0d9488 50%, #06b6d4 100%);
/* Tailwind: from-emerald-500 via-emerald-600 to-teal-600 */
```

### Backgrounds & Surfaces (LIGHT MODE — preferred)
| Token | Value | Usage |
|-------|-------|-------|
| Main background | `hsl(220 20% 97%)` or `#f1f5f9` | Page background |
| Sidebar | `#ffffff` | Sidebar, nav |
| Cards | `#ffffff` | Card surfaces |
| Card hover | `hsl(220 14% 95%)` | Hover state |
| Input background | `hsl(220 20% 98%)` | Form inputs |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| Primary text | `hsl(222 47% 11%)` or `#0f172a` | Headings, body |
| Muted text | `hsl(215 16% 47%)` or `#64748b` | Labels, secondary |

### Split / Segment Colors (for charts, categories, different items)
Use distinct colors so each split/segment is visually different:
```javascript
const SPLIT_COLORS = [
  { fill: "#3b82f6", bg: "#eff6ff" },   // Blue
  { fill: "#8b5cf6", bg: "#f5f3ff" },   // Purple
  { fill: "#f59e0b", bg: "#fffbeb" },   // Amber
  { fill: "#ef4444", bg: "#fef2f2" },   // Red
  { fill: "#06b6d4", bg: "#ecfeff" },   // Cyan
  { fill: "#ec4899", bg: "#fdf2f8" },   // Pink
];
// Organization/primary: Emerald #10b981
```

### Status Badges
- Success: `bg-emerald-500/10 text-emerald-600` (light) / `bg-emerald-500/20 text-emerald-400` (dark)
- Pending: `bg-amber-500/10 text-amber-600`
- Error: `bg-red-500/10 text-red-600`

---

## 2. TYPOGRAPHY

### Font: Barlow
```css
/* Google Font import */
font-family: 'Barlow', ui-sans-serif, system-ui, sans-serif;

/* Weights: 400, 500, 600, 700, 900 */
```

### Hierarchy
- **Page title:** `text-2xl font-bold tracking-tight text-dashboard-text`
- **Section title:** `text-xl font-bold tracking-tight`
- **Card title:** `text-sm font-semibold`
- **Labels:** `text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted`
- **Body:** `text-sm text-dashboard-text` or `text-dashboard-text-muted`

---

## 3. DASHBOARD LAYOUT

### Structure
- **Sidebar:** 280px width, white background, collapsible with spring animation
- **Main content:** `min-h-screen`, padding `p-6` or `pl-8`, `max-w-[1400px] mx-auto`
- **Cards:** `rounded-xl` or `rounded-2xl`, `border border-dashboard-border`, `bg-dashboard-card`

### Sidebar
- Background: white (`#ffffff`)
- Border: `border-r border-dashboard-border/60`
- Logo/brand: Gradient pill `from-emerald-500 via-emerald-600 to-teal-600`, `rounded-xl`
- Active nav link: `bg-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3`
- Inactive nav: `text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text`

### Card Styling
```css
/* Default card */
border-radius: 1rem; /* rounded-xl */
border: 1px solid hsl(var(--dashboard-border));
background: hsl(var(--dashboard-card));
box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);

/* Hover */
box-shadow: 0 4px 16px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04);
transform: translateY(-2px);
transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 4. ANIMATIONS

### Page / Section Fade-In
```css
@keyframes dashboardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.99);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}
.dashboard-fade-in {
  animation: dashboardFadeIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
```

### Stagger Delays (for multiple cards)
```css
.dashboard-fade-in-delay-1 { animation-delay: 0.06s; }
.dashboard-fade-in-delay-2 { animation-delay: 0.12s; }
.dashboard-fade-in-delay-3 { animation-delay: 0.18s; }
/* ... up to delay-12 */
```

### Progress Bar Fill
```css
@keyframes progressBarFill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.progress-bar-fill {
  animation: progressBarFill 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transform-origin: left;
}
```

### KPI Card Shimmer (subtle)
```css
@keyframes kpiShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.kpi-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: kpiShimmer 3s ease-in-out infinite;
}
```

### Button Hover Glow
```css
.glow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
}
```

### Input Focus Ring
```css
input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
```

---

## 5. GREEN THEME (data-dashboard-theme="green")

For a banking app that should feel fresh and green:
```css
[data-dashboard-theme="green"] {
  --dashboard-bg: 152 25% 96%;        /* Soft mint background */
  --dashboard-sidebar: 0 0% 100%;     /* White sidebar */
  --dashboard-card: 0 0% 100%;       /* White cards */
  --dashboard-card-hover: 152 20% 93%;
  --dashboard-border: 152 18% 88%;
  --dashboard-text: 160 50% 10%;
  --dashboard-text-muted: 160 25% 35%;
  --dashboard-accent: 160 84% 32%;
  --accent-gradient: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
  --accent-glow: 0 0 24px rgba(16, 185, 129, 0.2);
}
```

---

## 6. SPLITS / SEGMENTS (Different Colors)

When displaying splits (e.g., donation splits, account categories, transaction types):
- **Use a distinct color per segment** — blue, purple, amber, red, cyan, pink
- **Organization/primary** = Emerald (#10b981)
- **Others** = rotate through the palette above
- Add **hover glow** on segments: `filter: drop-shadow(0 0 8px rgba(color, 0.35))`
- Smooth **stroke-width transition** on hover
- **Progress bars** per split: use `accent-color` or `background` matching segment color

---

## 7. UNIT WHITE-LABEL APP SETTINGS

Pass to Unit elements via `settings-json`:
```json
{
  "global": {
    "colors": { "primary": "#059669" },
    "buttons": {
      "primary": { "default": { "border": { "radius": "8px" } } },
      "outline": { "default": { "border": { "radius": "8px" } } },
      "flat": { "default": { "border": { "radius": "8px" } } }
    }
  }
}
```

---

## 8. AVOID (What Makes It Look Terrible)

- **Dark mode by default** — use light, luminous backgrounds
- **Bullet lists** — use cards, grids, or styled lists instead
- **Flat gray** — add depth with shadows, borders, hover states
- **Generic banking gray** — use green accents and warm whites
- **No animations** — add fade-in, stagger, hover lifts
- **Single color for everything** — use split colors for different categories

---

## 9. CSS VARIABLES (Full Set)

```css
:root {
  --dashboard-bg: 220 20% 97%;
  --dashboard-sidebar: 0 0% 100%;
  --dashboard-card: 0 0% 100%;
  --dashboard-card-hover: 220 14% 95%;
  --dashboard-border: 220 15% 92%;
  --dashboard-text: 222 47% 11%;
  --dashboard-text-muted: 215 16% 47%;
  --dashboard-accent: 160 84% 39%;
  --dashboard-input-bg: 220 20% 98%;
  --dashboard-input-border: 220 13% 89%;
  --accent-gradient: linear-gradient(135deg, #10b981 0%, #0d9488 50%, #06b6d4 100%);
  --accent-glow: 0 0 24px rgba(16, 185, 129, 0.15);
  --card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
  --card-shadow-hover: 0 4px 16px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04);
  --radius: 0.75rem;
}
```

Use with Tailwind: `bg-dashboard`, `text-dashboard-text`, `border-dashboard-border`, etc.

---

## 10. QUICK REFERENCE

| Element | Class / Value |
|---------|---------------|
| Primary button | `bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20` |
| Card | `rounded-2xl border border-dashboard-border bg-dashboard-card` |
| Page title | `text-2xl font-bold tracking-tight text-dashboard-text` |
| Fade-in | `dashboard-fade-in` + `dashboard-fade-in-delay-N` |
| Active nav | `bg-emerald-500/20 text-emerald-400` |
| Input focus | `focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20` |

---

*Use this prompt with any AI coding assistant to style your banking app with a modern, green, luminous design—not dark or bullet-heavy.*
