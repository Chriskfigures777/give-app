/**
 * Website builder templates.
 * GrapeJS Studio SDK: project data = { pages: [{ name, component }] }
 *
 * Church templates: generated from templates directory
 * Run: node scripts/generate-all-templates.mjs
 */

import {
  CHURCH_GRACE_PAGES,
  MODERN_MINIMAL_PAGES,
  WARM_HERITAGE_PAGES,
  BOLD_CONTEMPORARY_PAGES,
  SERENE_LIGHT_PAGES,
  DARK_ELEGANT_PAGES,
  VIBRANT_COMMUNITY_PAGES,
  CLASSIC_REFORMED_PAGES,
  ORGANIC_NATURAL_PAGES,
  URBAN_MODERN_PAGES,
} from "./templates-generated";

export type WebsiteTemplate = {
  id: string;
  name: string;
  description: string;
  /** HTML for template preview in selection card (srcdoc) */
  previewHtml?: string;
  project: {
    pages: Array<{ id?: string; name: string; component: string }>;
  };
};

const BLANK_COMPONENT =
  "<div style='padding:60px;text-align:center;'><h1>Your Website</h1><p>Start editing to build your page.</p></div>";

/** Preview HTML snippets for template picker cards - hero + nav with theme colors */
const PREVIEWS: Record<string, string> = {
  church_grace: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#FAF7F2;color:#333}.nav{background:#1A1A2E;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#C9A84C;font-weight:600}.nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.5)),url(https://images.pexels.com/photos/1006121/pexels-photo-1006121.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center}.hero em{color:#C9A84C}</style></head><body><nav class="nav"><span>Grace Community</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>A Place to <em>Belong,</em> Believe & Become</h1></section></body></html>`,
  modern_minimal: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:system-ui;background:#F8FAFC;color:#334155}.nav{background:#0F172A;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#0EA5E9;font-weight:600}.nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,.5)),url(https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center}.hero em{color:#0EA5E9}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Welcome <em>Home</em></h1></section></body></html>`,
  warm_heritage: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:Georgia,serif;background:#FFFBEB;color:#451A03}.nav{background:#422006;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#B45309;font-weight:600}.nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.5)),url(https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center;font-family:Georgia}.hero em{color:#B45309}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Rooted in <em>Faith</em></h1></section></body></html>`,
  bold_contemporary: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:system-ui;background:#F0F9FF;color:#0C4A6E}.nav{background:#0C4A6E;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#F97316;font-weight:700}.nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)),url(https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center;font-weight:700}.hero em{color:#F97316}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Bold <em>Faith</em></h1></section></body></html>`,
  serene_light: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:system-ui;background:#FAF5FF;color:#581C87}.nav{background:#4C1D95;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#7C3AED;font-weight:600}.nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,.5)),url(https://images.pexels.com/photos/5206038/pexels-photo-5206038.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center}.hero em{color:#A78BFA}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Peace & <em>Purpose</em></h1></section></body></html>`,
  dark_elegant: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:Georgia,serif;background:#262626;color:#E5E5E5}.nav{background:#0F0F0F;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#FBBF24;font-weight:600}.nav a{color:rgba(255,255,255,.6);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.6)),url(https://images.pexels.com/photos/1586996/pexels-photo-1586996.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center;font-family:Georgia}.hero em{color:#FBBF24}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Elegant <em>Worship</em></h1></section></body></html>`,
  vibrant_community: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:system-ui;background:#ECFDF5;color:#064E3B}.nav{background:#059669;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#fff;font-weight:700}.nav a{color:rgba(255,255,255,.85);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,.5)),url(https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center;font-weight:700}.hero em{color:#6EE7B7}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Vibrant <em>Community</em></h1></section></body></html>`,
  classic_reformed: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:system-ui;background:#FFF7ED;color:#431407}.nav{background:#7C2D12;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#B45309;font-weight:600}.nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.55)),url(https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center;font-family:Georgia}.hero em{color:#B45309}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Classic <em>Faith</em></h1></section></body></html>`,
  organic_natural: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:system-ui;background:#F7FEE7;color:#1A2E05}.nav{background:#365314;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#65A30D;font-weight:600}.nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)),url(https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center}.hero em{color:#84CC16}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Creation & <em>Community</em></h1></section></body></html>`,
  urban_modern: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:Inter,sans-serif;background:#F4F4F5;color:#18181B}.nav{background:#18181B;padding:12px 24px;display:flex;align-items:center;gap:16px}.nav span{color:#6366F1;font-weight:600}.nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:12px}.hero{min-height:180px;background:linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.55)),url(https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=400) center/cover;display:flex;align-items:center;justify-content:center;padding:24px}.hero h1{color:#fff;font-size:24px;text-align:center}.hero em{color:#818CF8}</style></head><body><nav class="nav"><span>Your Church</span><a href="#">About</a><a href="#">Events</a><a href="#">Give</a></nav><section class="hero"><h1>Urban <em>Faith</em></h1></section></body></html>`,
};

const CHURCH_DESCRIPTION =
  "Full church website: Home, About, Events, Give, Ministries, Media, Visit Us. All CMS blocks included.";

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch with an empty page",
    previewHtml: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:40px;text-align:center;background:#f8fafc;min-height:100%;font-family:Inter,sans-serif"><h2 style="color:#334155;margin-bottom:8px">Your Website</h2><p style="color:#64748b;font-size:14px">Start editing to build your page.</p></body></html>`,
    project: {
      pages: [{ id: "page-home", name: "Home", component: BLANK_COMPONENT }],
    },
  },
  {
    id: "church",
    name: "Church (Grace Community)",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.church_grace,
    project: { pages: CHURCH_GRACE_PAGES },
  },
  {
    id: "church-grace",
    name: "Church — Grace Style",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.church_grace,
    project: { pages: CHURCH_GRACE_PAGES },
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.modern_minimal,
    project: { pages: MODERN_MINIMAL_PAGES },
  },
  {
    id: "warm-heritage",
    name: "Warm Heritage",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.warm_heritage,
    project: { pages: WARM_HERITAGE_PAGES },
  },
  {
    id: "bold-contemporary",
    name: "Bold Contemporary",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.bold_contemporary,
    project: { pages: BOLD_CONTEMPORARY_PAGES },
  },
  {
    id: "serene-light",
    name: "Serene Light",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.serene_light,
    project: { pages: SERENE_LIGHT_PAGES },
  },
  {
    id: "dark-elegant",
    name: "Dark Elegant",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.dark_elegant,
    project: { pages: DARK_ELEGANT_PAGES },
  },
  {
    id: "vibrant-community",
    name: "Vibrant Community",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.vibrant_community,
    project: { pages: VIBRANT_COMMUNITY_PAGES },
  },
  {
    id: "classic-reformed",
    name: "Classic Reformed",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.classic_reformed,
    project: { pages: CLASSIC_REFORMED_PAGES },
  },
  {
    id: "organic-natural",
    name: "Organic Natural",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.organic_natural,
    project: { pages: ORGANIC_NATURAL_PAGES },
  },
  {
    id: "urban-modern",
    name: "Urban Modern",
    description: CHURCH_DESCRIPTION,
    previewHtml: PREVIEWS.urban_modern,
    project: { pages: URBAN_MODERN_PAGES },
  },
];

export function getTemplateById(id: string): WebsiteTemplate | undefined {
  return WEBSITE_TEMPLATES.find((t) => t.id === id);
}
