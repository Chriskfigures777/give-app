#!/usr/bin/env node
/**
 * Generates 9 template variants from templates/church-grace by applying theme-specific CSS and font changes.
 * Preserves all CMS blocks, placeholders, and structure. Only visual styling changes.
 *
 * Run: node scripts/generate-template-variants.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, "../templates/church-grace");
const templatesDir = path.join(__dirname, "../templates");

const PAGES = [
  "index.html",
  "about.html",
  "events.html",
  "give.html",
  "ministries.html",
  "media.html",
  "visit.html",
];

const THEMES = [
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    vars: {
      "--gold": "#0EA5E9",
      "--deep": "#0F172A",
      "--navy": "#1E293B",
      "--cream": "#F8FAFC",
      "--text": "#334155",
      "--muted": "#64748B",
    },
    fonts:
      "family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
    bodyFont: "'DM Sans', system-ui, sans-serif",
    headingFont: "'Space Grotesk', system-ui, sans-serif",
    heroImg: "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  {
    id: "warm-heritage",
    name: "Warm Heritage",
    vars: {
      "--gold": "#B45309",
      "--deep": "#422006",
      "--navy": "#78350F",
      "--cream": "#FFFBEB",
      "--text": "#451A03",
      "--muted": "#78716C",
    },
    fonts: "family=Cormorant+Garamond:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,400;600&display=swap",
    bodyFont: "'Source Serif 4', Georgia, serif",
    headingFont: "'Cormorant Garamond', Georgia, serif",
    heroImg: "https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  {
    id: "bold-contemporary",
    name: "Bold Contemporary",
    vars: {
      "--gold": "#F97316",
      "--deep": "#0C4A6E",
      "--navy": "#0369A1",
      "--cream": "#F0F9FF",
      "--text": "#0C4A6E",
      "--muted": "#64748B",
    },
    fonts: "family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap",
    bodyFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    headingFont: "'Outfit', system-ui, sans-serif",
    heroImg: "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  {
    id: "serene-light",
    name: "Serene Light",
    vars: {
      "--gold": "#7C3AED",
      "--deep": "#4C1D95",
      "--navy": "#5B21B6",
      "--cream": "#FAF5FF",
      "--text": "#581C87",
      "--muted": "#7C3AED",
    },
    fonts: "family=Nunito:wght@300;400;600;700&family=Lora:wght@400;600;700&display=swap",
    bodyFont: "'Nunito', system-ui, sans-serif",
    headingFont: "'Lora', Georgia, serif",
    heroImg: "https://images.pexels.com/photos/5206038/pexels-photo-5206038.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  {
    id: "dark-elegant",
    name: "Dark Elegant",
    vars: {
      "--gold": "#FBBF24",
      "--deep": "#0F0F0F",
      "--navy": "#171717",
      "--cream": "#262626",
      "--text": "#E5E5E5",
      "--muted": "#A3A3A3",
    },
    fonts: "family=Cinzel:wght@400;600;700&family=Cormorant:wght@400;500;600&display=swap",
    bodyFont: "'Cormorant', Georgia, serif",
    headingFont: "'Cinzel', Georgia, serif",
    heroImg: "https://images.pexels.com/photos/1586996/pexels-photo-1586996.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  {
    id: "vibrant-community",
    name: "Vibrant Community",
    vars: {
      "--gold": "#10B981",
      "--deep": "#059669",
      "--navy": "#047857",
      "--cream": "#ECFDF5",
      "--text": "#064E3B",
      "--muted": "#6B7280",
    },
    fonts: "family=Nunito:wght@400;600;700;800&family=Fredoka:wght@400;500;600&display=swap",
    bodyFont: "'Nunito', system-ui, sans-serif",
    headingFont: "'Fredoka', system-ui, sans-serif",
    heroImg: "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  {
    id: "classic-reformed",
    name: "Classic Reformed",
    vars: {
      "--gold": "#B45309",
      "--deep": "#7C2D12",
      "--navy": "#9A3412",
      "--cream": "#FFF7ED",
      "--text": "#431407",
      "--muted": "#78716C",
    },
    fonts: "family=Libre+Baskerville:wght@400;700&family=Lato:wght@400;700&display=swap",
    bodyFont: "'Lato', system-ui, sans-serif",
    headingFont: "'Libre Baskerville', Georgia, serif",
    heroImg: "https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  {
    id: "organic-natural",
    name: "Organic Natural",
    vars: {
      "--gold": "#65A30D",
      "--deep": "#365314",
      "--navy": "#4D7C0F",
      "--cream": "#F7FEE7",
      "--text": "#1A2E05",
      "--muted": "#4D7C0F",
    },
    fonts: "family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600;700&display=swap",
    bodyFont: "'Open Sans', system-ui, sans-serif",
    headingFont: "'Merriweather', Georgia, serif",
    heroImg: "https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  {
    id: "urban-modern",
    name: "Urban Modern",
    vars: {
      "--gold": "#6366F1",
      "--deep": "#18181B",
      "--navy": "#27272A",
      "--cream": "#F4F4F5",
      "--text": "#18181B",
      "--muted": "#71717A",
    },
    fonts: "family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap",
    bodyFont: "'Inter', system-ui, sans-serif",
    headingFont: "'Inter', system-ui, sans-serif",
    heroImg: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
];

function applyTheme(html, theme) {
  let out = html;

  // Replace :root variables
  out = out.replace(
    /:root\s*\{[^}]*\}/s,
    `:root {\n  ${Object.entries(theme.vars)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ")};\n}`
  );

  // Replace font import
  out = out.replace(
    /<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">/,
    `<link href="https://fonts.googleapis.com/css2?${theme.fonts}" rel="stylesheet">`
  );

  // Replace body font
  out = out.replace(
    /body\s*\{\s*font-family:\s*'[^']+',[^}]+\}/,
    `body { font-family: ${theme.bodyFont}; background: var(--cream); color: var(--text); }`
  );

  // Replace Playfair Display with heading font (multiple occurrences)
  out = out.replace(/font-family:\s*'Playfair Display',\s*serif/g, `font-family: ${theme.headingFont}`);

  // Replace hero background on index (first hero-bg)
  out = out.replace(
    /\.hero-bg\{[^}]*background-image:url\('[^']+'\)[^}]*\}/,
    `.hero-bg{position:absolute;inset:0;background-image:url('${theme.heroImg}');background-size:cover;background-position:center;filter:brightness(0.3);}`
  );

  return out;
}

for (const theme of THEMES) {
  const targetDir = path.join(templatesDir, theme.id);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  for (const file of PAGES) {
    const srcPath = path.join(baseDir, file);
    const destPath = path.join(targetDir, file);
    if (!fs.existsSync(srcPath)) {
      console.warn("Missing base:", srcPath);
      continue;
    }
    let html = fs.readFileSync(srcPath, "utf-8");
    html = applyTheme(html, theme);
    fs.writeFileSync(destPath, html, "utf-8");
  }
  console.log("Generated:", theme.id);
}

console.log("Done. Generated", THEMES.length, "template variants.");
