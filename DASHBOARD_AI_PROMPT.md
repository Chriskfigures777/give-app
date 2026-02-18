# AI Prompt: Recreate or Redesign the Give Dashboard

Use this prompt to instruct an AI to recreate the Give dashboard from scratch, or to redesign it while preserving its structure and style. The prompt is designed to give the AI **flexibility to customize** and **opportunity to improve** while **staying within the established color palette and design system**.

---

## Master Prompt (Copy & Paste)

```
You are to recreate / redesign a nonprofit donation dashboard called "Give".

CRITICAL: Stay within the established color palette. You may adjust layout, typography, spacing, animations, and component patterns—but the brand colors (emerald/teal/slate) must remain. This ensures visual consistency across the product.

FLEXIBILITY: You have full freedom to:
- Redesign the layout (sidebar placement, card layouts, table styles)
- Change typography hierarchy and font choices
- Modify animations and transitions
- Improve UX patterns (filters, navigation, modals)
- Reorganize sections or pages
- Add new UI patterns (e.g., tabs, breadcrumbs, command palette)
- Adjust spacing, border radius, shadows

CONSTRAINT: Do not introduce new accent colors outside the palette below. Use the provided CSS variables and Tailwind classes for all surfaces, text, and borders.

---

## Color Palette (REQUIRED — stay within these)

### Brand accent (primary actions, active states, links)
- Emerald gradient: `from-emerald-500 via-emerald-600 to-teal-600`
- Emerald solid: `emerald-500`, `emerald-600`, `emerald-400`
- Teal: `teal-600`, `#0d9488` (chart line)
- Hex accent: `#10b981` (emerald-500), `#0d9488` (teal-600)

### Backgrounds & surfaces (dark mode default)
- Main content: `--dashboard-bg` or `222 47% 11%` (#0F172A Slate 900)
- Sidebar: `--dashboard-sidebar` or `217 33% 17%` (#1E293B Slate 800)
- Cards: `--dashboard-card` or `217 33% 17%`
- Hover: `--dashboard-card-hover` or `215 28% 22%` (#334155 Slate 700)

### Text
- Primary: `--dashboard-text` or `210 40% 98%`
- Muted: `--dashboard-text-muted` or `215 20% 65%`

### Borders
- `--dashboard-border` or `217 33% 22%`

### Status badges
- Success/active: `bg-emerald-500/20 text-emerald-400`
- Pending: `bg-amber-500/20 text-amber-400`
- Failed/inactive: `bg-red-500/20 text-red-400` or `bg-slate-600/50 text-slate-400`

### Chart colors (for data viz)
`["#11B5AE", "#4046CA", "#F68512", "#DE3C82", "#7E84FA", "#72E06A"]`

---

## Layout Architecture

- **Sidebar**: 288px when open, collapsible via floating toggle button (left: 268px when open, 4px when closed)
- **Sidebar animation**: Framer Motion spring, stiffness: 400, damping: 35
- **Main content**: `min-h-screen`, `pl-8` (sidebar open) or `pl-14` (closed)
- **Sidebar persistence**: `localStorage["dashboard-sidebar-open"]`
- **Theme**: Dark default, light toggle via `localStorage["give-dashboard-theme"]`

---

## Brand Block (sidebar top)
- Logo: "G" in gradient pill (`from-emerald-500 via-emerald-600 to-teal-600`), rounded-xl
- App name: "Give" with subtitle "Dashboard"
- Homepage link: House icon, "Homepage"

---

## Navigation structure (3 sections)

### Section 1: Overview
- Overview (/dashboard)
- My donations (/dashboard/my-donations)
- Connections (/dashboard/connections) — when orgId present
- Messages (/dashboard/messages) — when orgId present

### Section 2: Organization
- Donations (/dashboard/donations)
- Events (/dashboard/events) — when org user
- Goals (/dashboard/goals)
- Givers (/dashboard/givers)
- Public page (/dashboard/profile)
- Customization (/dashboard/customization)
- Donation links (/dashboard/donation-links)

### Section 3: Account
- Settings (/dashboard/settings)
- Complete verification / Payout account (/dashboard/connect/verify)
- Manage billing (/dashboard/connect/manage) — when onboarding complete
- Platform Admin (/dashboard/admin) — platform_admin only

---

## Nav link styling
- Active: `bg-emerald-500/20 text-emerald-400 shadow-sm`
- Inactive: `text-dashboard-text-muted hover:bg-dashboard-card-hover/50 hover:text-dashboard-text`
- Section titles: `text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted`
- Links: `rounded-xl px-4 py-3 text-[15px] font-semibold`

---

## User block (sidebar footer)
- Avatar: First letter of name in `bg-gradient-to-br from-slate-600 to-slate-700`
- Display name + Sign out button
- Theme toggle (sun/moon)

---

## Shared UI patterns
- **Fade-in**: Use `dashboard-fade-in` and `dashboard-fade-in-delay-1` through `-12` for stagger
- **Cards**: `rounded-xl` or `rounded-2xl`, `border border-dashboard-border`, `bg-dashboard-card`
- **Inputs**: `bg-dashboard-input-bg`, `border-dashboard-input-border`, focus ring `ring-emerald-500`
- **Buttons**: Primary uses emerald; ghost/secondary use dashboard text colors

---

## Page structure (18 pages)
Include: Overview, My Donations, Connections, Messages, Donations, Donors, Givers, Events, Goals, Public Page (Profile), Customization, Donation Links, Settings, Connect Verify, Connect Manage, Platform Admin, Page Builder, Embed (redirects to Customization).

---

## Customization flexibility
When redesigning, you may:
1. Change the sidebar from left to right, or make it a top nav
2. Use different card layouts (grid vs list, masonry, etc.)
3. Add or remove animations
4. Change table styling (striped, bordered, hover effects)
5. Modify modal/dialog styling
6. Reorganize information hierarchy
7. Add tooltips, empty states, loading skeletons
8. Improve accessibility (focus states, ARIA)

Always preserve: the color palette, the navigation routes and permissions, and the core data/features per page.
```

---

## Shorter Variant (for quick redesigns)

```
Recreate the Give dashboard. Use emerald/teal/slate colors only. Dark mode default. Sidebar 288px, collapsible. Nav: Overview, My donations, Connections, Messages, Organization (Donations, Events, Goals, Givers, Profile, Customization, Donation links), Account (Settings, Connect, Admin). Active nav: bg-emerald-500/20 text-emerald-400. Keep all 18 routes and permission logic. You may redesign layout, typography, animations, and UX—but stay within the palette.
```

---

## For "Next Round" Iterations

After the first build, you can add:

```
For the next iteration:
- Improve [specific area, e.g., "the donations table" or "the overview KPI cards"]
- Add [specific feature, e.g., "keyboard shortcuts" or "bulk actions"]
- Make [component] more customizable (e.g., let users choose card density)
- Optimize for [mobile / accessibility / performance]
- Stay within the palette. No new accent colors.
```

---

## Key Files Reference

| Purpose | File |
|--------|------|
| Layout | `layout.tsx`, `dashboard-layout-client.tsx`, `dashboard-sidebar.tsx` |
| Nav | `dashboard-nav.tsx` |
| Theme | `dashboard-theme-provider.tsx`, `globals.css` (CSS variables) |
| Overview | `dashboard-overview.tsx`, `dashboard-charts.tsx` |
| Attributes | `DASHBOARD_ATTRIBUTES.md` |

---

*Use this prompt with any AI coding assistant to regenerate or redesign the dashboard while maintaining brand consistency and customization flexibility.*
