#!/usr/bin/env node
/**
 * Generates templates-generated.ts from all template directories.
 * Each template dir has 7 HTML files. Processes links for GrapeJS (page://page-id).
 *
 * Run: node scripts/generate-all-templates.mjs
 * Output: src/lib/templates-generated.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, "../templates");

const PAGES = [
  { file: "index.html", name: "Home" },
  { file: "about.html", name: "About" },
  { file: "events.html", name: "Events" },
  { file: "give.html", name: "Give" },
  { file: "ministries.html", name: "Ministries" },
  { file: "media.html", name: "Media" },
  { file: "visit.html", name: "Visit" },
];

const TEMPLATE_IDS = [
  "church-grace",
  "modern-minimal",
  "warm-heritage",
  "bold-contemporary",
  "serene-light",
  "dark-elegant",
  "vibrant-community",
  "classic-reformed",
  "organic-natural",
  "urban-modern",
];

function toPageId(name) {
  return "page-" + name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const SLUG_TO_PAGE_ID = Object.fromEntries(
  PAGES.map((p) => [p.file.replace(".html", ""), toPageId(p.name)])
);

function processHtml(html, pageSlug, pageName) {
  let out = html;
  for (const [slug, pageId] of Object.entries(SLUG_TO_PAGE_ID)) {
    const file = slug === "index" ? "index.html" : `${slug}.html`;
    const pageHref = `page://${pageId}`;
    out = out.replace(new RegExp(`href="${file.replace(".", "\\.")}"`, "g"), `href="${pageHref}"`);
  }
  out = out.replace(
    new RegExp(`href="page://[^"]+"\\s+${pageName.toUpperCase()}>`, "gi"),
    `href="#" class="active">`
  );
  return out;
}

function loadTemplatePages(templateId) {
  const dir = path.join(templatesDir, templateId);
  const pages = [];
  for (const { file, name } of PAGES) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) {
      console.warn("Missing:", filePath);
      continue;
    }
    const rawHtml = fs.readFileSync(filePath, "utf-8");
    const pageSlug = file.replace(".html", "");
    const fullHtml = processHtml(rawHtml, pageSlug, name);
    pages.push({ id: toPageId(name), name, component: fullHtml });
  }
  return pages;
}

function toJsonSafe(str) {
  return JSON.stringify(str);
}

const templateExports = [];

for (const templateId of TEMPLATE_IDS) {
  const pages = loadTemplatePages(templateId);
  const varName = templateId.replace(/-/g, "_").toUpperCase() + "_PAGES";
  const pagesJsonStr = pages
    .map(
      (p) =>
        `  { id: ${toJsonSafe(p.id)}, name: ${toJsonSafe(p.name)}, component: ${toJsonSafe(p.component)} }`
    )
    .join(",\n");
  templateExports.push({
    id: templateId,
    varName,
    pagesJsonStr,
    pageCount: pages.length,
  });
}

const tsContent = `/**
 * Auto-generated from templates directory
 * Run: node scripts/generate-all-templates.mjs
 */


${templateExports
  .map(
    (t) =>
      `export const ${t.varName} = [\n${t.pagesJsonStr}\n];`
  )
  .join("\n\n")}

export const TEMPLATE_PAGE_SETS = {
${templateExports.map((t) => `  "${t.id}": ${t.varName},`).join("\n")}
};
`;

const outPath = path.join(__dirname, "../src/lib/templates-generated.ts");
fs.writeFileSync(outPath, tsContent, "utf-8");
console.log("Wrote", outPath);
templateExports.forEach((t) => console.log("  ", t.id, ":", t.pageCount, "pages"));
console.log("Total templates:", templateExports.length);
