#!/usr/bin/env node
/**
 * Generates website-builder church template from church-standalone HTML files.
 * Each page is a FULL HTML document (DOCTYPE, html, head with inline CSS, body)
 * like church-standalone - so GrapeJS preserves the structure when exporting.
 *
 * Run: node scripts/generate-church-template.mjs
 * Output: src/lib/church-template-generated.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const churchDir = path.join(__dirname, "../church-standalone");

const PAGES = [
  { file: "index.html", name: "Home" },
  { file: "about.html", name: "About" },
  { file: "events.html", name: "Events" },
  { file: "give.html", name: "Give" },
  { file: "ministries.html", name: "Ministries" },
  { file: "media.html", name: "Media" },
  { file: "visit.html", name: "Visit" },
];

function toPageId(name) {
  return "page-" + name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const SLUG_TO_PAGE_ID = Object.fromEntries(
  PAGES.map((p) => [p.file.replace(".html", ""), toPageId(p.name)])
);

function processHtml(html, pageSlug, pageName) {
  let out = html;
  // Replace each .html link with page://page-{id} for in-editor navigation
  for (const [slug, pageId] of Object.entries(SLUG_TO_PAGE_ID)) {
    const file = slug === "index" ? "index.html" : `${slug}.html`;
    const pageHref = `page://${pageId}`;
    out = out.replace(new RegExp(`href="${file.replace(".", "\\.")}"`, "g"), `href="${pageHref}"`);
  }
  // Fix invalid nav attributes (ABOUT, MINISTRIES etc) -> class="active" for current page
  out = out.replace(
    new RegExp(`href="page://[^"]+"\\s+${pageName.toUpperCase()}>`, "gi"),
    `href="#" class="active">`
  );
  return out;
}

const pages = [];

for (const { file, name } of PAGES) {
  const filePath = path.join(churchDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn("Missing:", filePath);
    continue;
  }
  const rawHtml = fs.readFileSync(filePath, "utf-8");
  const pageSlug = file.replace(".html", "");
  const fullHtml = processHtml(rawHtml, pageSlug, name);
  pages.push({ id: toPageId(name), name, component: fullHtml });
}

const outPath = path.join(__dirname, "../src/lib/church-template-generated.ts");

// Write as TS with JSON.stringify to escape properly (handles quotes, newlines, etc.)
function toJsonSafe(str) {
  return JSON.stringify(str);
}

const pagesJsonStr = pages
  .map((p) => `  { id: ${toJsonSafe(p.id)}, name: ${toJsonSafe(p.name)}, component: ${toJsonSafe(p.component)} }`)
  .join(",\n");

const tsContent = `/**
 * Auto-generated from church-standalone/*.html
 * Each page is a FULL HTML document with DOCTYPE, head (meta, fonts, style), body.
 * Run: node scripts/generate-church-template.mjs
 */
export const CHURCH_TEMPLATE_PAGES = [
${pagesJsonStr}
];
`;

fs.writeFileSync(outPath, tsContent, "utf-8");
console.log("Wrote", outPath);
console.log("Pages:", pages.length);
