# Site Builder

A simple, comprehensive website builder for **churches, nonprofits, and institutions**. Build pages with a grid-based layout, themed design, and one-click export.

## Features

- **Grid system** — 8, 10, or 12-column app grid; each component can span 1–12 columns
- **Component library** — Hero, Header, Section, CTA, Events, Testimonial, Donate, Footer, Text, Image, Columns, Spacer
- **Side panels** (Webflow-style)
  - **Left:** Add components (click to add to canvas)
  - **Right:** Theme picker, color customization, layout (grid columns), and selected block properties (move up/down, remove)
- **Themes** — Institutional, Church, Nonprofit, Minimal + full color control (primary, secondary, accent, background, surface, text)
- **Modes** — **Edit** (builder), **Preview** (full-page preview), **Publish** (export / host instructions and HTML download)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## How the grid works

- The canvas uses CSS Grid with a configurable number of columns (Layout in the right panel).
- Every block has a **column span** (1–12). Full-width sections use 12; side-by-side content uses smaller spans (e.g. two columns = 6 each).
- Select a block to change its span and all other properties in the right panel.

## Hosting

In **Publish** mode you can download a starter HTML file. For a full static site, use Preview and your preferred method (e.g. print to PDF, or integrate with a static site generator).
