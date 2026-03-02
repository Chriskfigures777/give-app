#!/usr/bin/env node
/**
 * Generates completely unique template HTML files.
 * Each template has different: HTML structure, class names, CSS, images, typography.
 * Only CMS placeholders and required CMS class names stay the same.
 *
 * Run: node scripts/generate-unique-templates.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, "../templates");

const PEXELS = {
  worship1: "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=800",
  worship2: "https://images.pexels.com/photos/1586996/pexels-photo-1586996.jpeg?auto=compress&cs=tinysrgb&w=800",
  worship3: "https://images.pexels.com/photos/1006121/pexels-photo-1006121.jpeg?auto=compress&cs=tinysrgb&w=800",
  community1: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800",
  community2: "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800",
  pastor: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
  nature: "https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=800",
  urban: "https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=800",
  bible: "https://images.pexels.com/photos/5206038/pexels-photo-5206038.jpeg?auto=compress&cs=tinysrgb&w=800",
  kids: "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=700",
  youth: "https://images.pexels.com/photos/1448735/pexels-photo-1448735.jpeg?auto=compress&cs=tinysrgb&w=700",
  outreach: "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=700",
  event: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=700",
  sermon: "https://images.pexels.com/photos/8468459/pexels-photo-8468459.jpeg?auto=compress&cs=tinysrgb&w=800",
  welcome: "https://images.pexels.com/photos/8468471/pexels-photo-8468471.jpeg?auto=compress&cs=tinysrgb&w=900",
};

const TEMPLATES = {
  "serene-light": {
    brand: "Serene Church",
    fonts: "Nunito:wght@300;400;600;700&family=Lora:wght@400;600",
    vars: "--accent:#7C3AED;--dark:#4C1D95;--cream:#FAF5FF;--text:#581C87;--muted:#A78BFA",
    bodyFont: "'Nunito',sans-serif",
    headingFont: "'Lora',serif",
    navClass: "zen-nav",
    heroClass: "zen-hero",
    contentClass: "zen-content",
    footerClass: "zen-footer",
    heroTitle: "Peace, <em>Purpose</em>, and Community",
    heroSub: "We're a gentle community of faith. Come as you are.",
    img: PEXELS.worship2,
  },
  "dark-elegant": {
    brand: "Elegant Church",
    fonts: "Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;500;600",
    vars: "--accent:#FBBF24;--dark:#0F0F0F;--bg:#171717;--text:#E5E5E5;--muted:#A3A3A3",
    bodyFont: "'Inter',sans-serif",
    headingFont: "'Cormorant Garamond',serif",
    navClass: "elegant-top",
    heroClass: "elegant-hero",
    contentClass: "elegant-main",
    footerClass: "elegant-foot",
    heroTitle: "Elegant <em>Worship</em>",
    heroSub: "Where tradition meets reverence.",
    img: PEXELS.worship2,
    darkMode: true,
  },
  "vibrant-community": {
    brand: "Vibrant Church",
    fonts: "Poppins:wght@400;500;600;700;800&family=Fredoka:wght@400;600",
    vars: "--accent:#059669;--dark:#064E3B;--bg:#ECFDF5;--text:#065F46;--muted:#047857",
    bodyFont: "'Poppins',sans-serif",
    headingFont: "'Fredoka',sans-serif",
    navClass: "vib-header",
    heroClass: "vib-banner",
    contentClass: "vib-body",
    footerClass: "vib-foot",
    heroTitle: "Vibrant <em>Community</em>",
    heroSub: "Energy, color, and life. Join us!",
    img: PEXELS.community2,
  },
  "classic-reformed": {
    brand: "Reformed Church",
    fonts: "Libre+Baskerville:wght@400;700&family=Source+Serif+4:opsz,wght@8..60,400;600",
    vars: "--accent:#B45309;--dark:#431407;--cream:#FFF7ED;--text:#7C2D12;--muted:#9A3412",
    bodyFont: "'Source Serif 4',Georgia,serif",
    headingFont: "'Libre Baskerville',serif",
    navClass: "reformed-bar",
    heroClass: "reformed-mast",
    contentClass: "reformed-column",
    footerClass: "reformed-bottom",
    heroTitle: "Classic <em>Faith</em>",
    heroSub: "Rooted in Scripture, reformed in practice.",
    img: PEXELS.bible,
  },
  "organic-natural": {
    brand: "Organic Church",
    fonts: "Quicksand:wght@400;500;600;700&family=Merriweather:wght@400;700",
    vars: "--accent:#65A30D;--dark:#365314;--bg:#F7FEE7;--text:#1A2E05;--muted:#4D7C0F",
    bodyFont: "'Quicksand',sans-serif",
    headingFont: "'Merriweather',serif",
    navClass: "org-bar",
    heroClass: "org-hero",
    contentClass: "org-content",
    footerClass: "org-foot",
    heroTitle: "Creation & <em>Community</em>",
    heroSub: "Earthy, natural, grounded in grace.",
    img: PEXELS.nature,
  },
  "urban-modern": {
    brand: "Urban Church",
    fonts: "Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600",
    vars: "--accent:#6366F1;--dark:#18181B;--bg:#F4F4F5;--text:#27272A;--muted:#71717A",
    bodyFont: "'DM Sans',sans-serif",
    headingFont: "'Space Grotesk',sans-serif",
    navClass: "urb-nav",
    heroClass: "urb-hero",
    contentClass: "urb-main",
    footerClass: "urb-foot",
    heroTitle: "Urban <em>Faith</em>",
    heroSub: "City life. Real faith. Authentic community.",
    img: PEXELS.urban,
  },
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function genPage(tpl, page, slug) {
  const T = TEMPLATES[tpl];
  if (!T) return null;

  const navLinks = [
    { href: "index.html", label: "Home" },
    { href: "about.html", label: "About" },
    { href: "ministries.html", label: "Ministries" },
    { href: "events.html", label: "Events" },
    { href: "media.html", label: "Media" },
    { href: "give.html", label: "Give" },
    { href: "visit.html", label: "Visit" },
  ];

  const navHtml = `<header class="${T.navClass}">
  <a href="index.html" class="${T.navClass}-logo">${T.brand}</a>
  <nav class="${T.navClass}-links">${navLinks.map((l) => `<a href="${l.href}">${l.label}</a>`).join("")}</nav>
</header>`;

  const footerHtml = `<footer class="${T.footerClass}"><span>© 2025 ${T.brand}</span></footer>`;

  const cmsEventsList = '<div data-cms-block="events_list">{{cms:events_list}}</div>';
  const cmsEventsGrid = '<div data-cms-block="events_grid">{{cms:events_grid}}</div>';
  const cmsFeatured = '<div data-cms-block="featured_sermon">{{cms:featured_sermon}}</div>';
  const cmsArchive = '<div data-cms-block="sermon_archive">{{cms:sermon_archive}}</div>';
  const cmsPodcast = '<div data-cms-block="podcast">{{cms:podcast}}</div>';
  const cmsWorship = '<div data-cms-block="worship_recordings">{{cms:worship_recordings}}</div>';

  const cmsStyles = `
/* CMS blocks - required for renderer output */
.ev-full-list,.erow,.edate,.em,.eday,.einfo,.ev-grid,.ev-card,.ev-body,.ev-meta,.ev-date-pill,.ev-cat,.ev-detail,.sermon-featured,.sf-thumb,.sf-info,.sf-play,.play-btn,.sc,.sc-thumb,.sc-body,.stag,.smeta,.pod-ep,.ep-num,.ep-info,.ep-dur,.sec-title.light,.gold-divider{box-sizing:border-box}
.ev-full-list{display:flex;flex-direction:column;gap:12px}
.erow{display:grid;grid-template-columns:70px 1fr auto;gap:16px;align-items:center;padding:16px 20px}
.edate{text-align:center}
.einfo h4{font-weight:600;margin-bottom:4px}
.einfo p{font-size:13px;opacity:0.8}
.ev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
.ev-card{background:inherit;border-radius:12px;overflow:hidden}
.ev-card img{width:100%;height:140px;object-fit:cover}
.ev-body{padding:20px}
.ev-meta{display:flex;gap:12px;margin-bottom:8px}
.ev-body h3{font-weight:600;margin-bottom:8px}
.ev-body p{font-size:13px;line-height:1.5}
.btn-primary{display:inline-block;padding:10px 20px;border-radius:8px;font-weight:600;text-decoration:none;margin-top:12px}
.sermon-featured{display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:16px;overflow:hidden}
.sf-thumb{position:relative;min-height:280px}
.sf-thumb img{width:100%;height:100%;object-fit:cover}
.sf-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3)}
.play-btn{width:64px;height:64px;border-radius:50%;border:none;cursor:pointer;font-size:20px}
.sf-info{padding:32px}
.sermon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px}
.sc{border-radius:12px;overflow:hidden}
.sc-thumb{position:relative}
.sc-thumb img{width:100%;height:160px;object-fit:cover}
.sc-body{padding:20px}
.pod-ep{display:grid;grid-template-columns:48px 1fr auto;gap:16px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.1)}
.pod-ep:last-child{border-bottom:none}
.media-two-col{display:grid;grid-template-columns:1fr 1fr;gap:40px}
@media(max-width:900px){.sermon-featured{grid-template-columns:1fr}.media-two-col,.ev-grid{grid-template-columns:1fr}.erow{grid-template-columns:60px 1fr}}`;

  const headingColor = T.darkMode ? "var(--text)" : "var(--dark)";
  const baseStyles = `
*{box-sizing:border-box;margin:0;padding:0}
:root{${T.vars}}
body{font-family:${T.bodyFont};background:var(--bg,var(--cream,#fff));color:var(--text);line-height:1.6}
.${T.navClass}{position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 40px;display:flex;align-items:center;justify-content:space-between;background:var(--dark);color:white}
.${T.navClass}-logo{font-family:${T.headingFont};font-size:20px;font-weight:600;color:white;text-decoration:none}
.${T.navClass}-links{display:flex;gap:24px}
.${T.navClass}-links a{color:rgba(255,255,255,0.75);text-decoration:none;font-size:14px;font-weight:500}
.${T.navClass}-links a:hover{color:var(--accent)}
.${T.contentClass}{max-width:720px;margin:0 auto;padding:120px 40px 80px}
.${T.contentClass} h1{font-family:${T.headingFont};font-size:clamp(28px,4vw,44px);font-weight:400;color:${headingColor};margin-bottom:16px}
.${T.contentClass} h2{font-family:${T.headingFont};font-size:22px;color:${headingColor};margin-bottom:16px}
.${T.contentClass} p{font-size:16px;line-height:1.7;margin-bottom:20px;color:var(--muted)}
.${T.footerClass}{padding:32px 40px;text-align:center;color:var(--muted);font-size:13px}
@media(max-width:900px){.${T.navClass}-links{display:none}}`;

  const pages = {
    index: () => `<!DOCTYPE html>
<html lang="en">
<head><title>Home — ${T.brand}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${T.fonts}&display=swap" rel="stylesheet">
<style>${baseStyles}
.${T.heroClass}{min-height:85vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 40px;background:linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.5)),url('${T.img}') center/cover}
.${T.heroClass} h1{font-family:${T.headingFont};font-size:clamp(36px,6vw,56px);color:white;margin-bottom:20px}
.${T.heroClass} h1 em{font-style:italic;color:var(--accent)}
.${T.heroClass} p{color:rgba(255,255,255,0.9);font-size:18px;margin-bottom:32px;max-width:500px}
.${T.heroClass} a{display:inline-block;background:var(--accent);color:white;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none}
.${T.contentClass}{padding:80px 40px}
.${T.contentClass} h2{font-family:${T.headingFont};font-size:24px;margin-bottom:20px}
${cmsStyles}</style></head>
<body>
${navHtml}
<section class="${T.heroClass}">
  <h1>${T.heroTitle}</h1>
  <p>${T.heroSub}</p>
  <a href="visit.html">Plan Your Visit</a>
</section>
<div class="${T.contentClass}">
  <h2>Upcoming Events</h2>
  ${cmsEventsList}
  <p><a href="events.html" style="color:var(--accent);font-weight:600;">View all →</a></p>
</div>
${footerHtml}
</body></html>`,

    about: () => `<!DOCTYPE html>
<html lang="en">
<head><title>About — ${T.brand}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${T.fonts}&display=swap" rel="stylesheet">
<style>${baseStyles}</style></head>
<body>
${navHtml}
<div class="${T.contentClass}">
  <h1>Our Story</h1>
  <p>We're a community rooted in faith, committed to loving our neighbors and serving our city.</p>
  <p>Founded over fifty years ago, we've grown from a small gathering to a church that serves thousands.</p>
  <h2>Our Values</h2>
  <p><strong>Faith</strong> — We trust God's Word and seek to live it out daily.</p>
  <p><strong>Community</strong> — We grow better together than alone.</p>
  <p><strong>Service</strong> — We use our gifts to love and serve others.</p>
  <p><a href="visit.html" style="color:var(--accent);font-weight:600;">Plan your visit →</a></p>
</div>
${footerHtml}
</body></html>`,

    events: () => `<!DOCTYPE html>
<html lang="en">
<head><title>Events — ${T.brand}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${T.fonts}&display=swap" rel="stylesheet">
<style>${baseStyles}${cmsStyles}</style></head>
<body>
${navHtml}
<div class="${T.contentClass}">
  <h1>Events</h1>
  <p>Join us for worship, fellowship, and community</p>
  <h2>Upcoming</h2>
  ${cmsEventsList}
  <h2>Featured</h2>
  ${cmsEventsGrid}
</div>
${footerHtml}
</body></html>`,

    give: () => `<!DOCTYPE html>
<html lang="en">
<head><title>Give — ${T.brand}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${T.fonts}&display=swap" rel="stylesheet">
<style>${baseStyles}
.${T.heroClass}{min-height:50vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 40px}
.${T.heroClass} h1{font-family:${T.headingFont};font-size:clamp(32px,5vw,48px);color:var(--dark)}
.${T.heroClass} a{display:inline-block;background:var(--accent);color:white;padding:16px 36px;border-radius:8px;font-weight:600;text-decoration:none;margin-top:20px}
</style></head>
<body>
${navHtml}
<section class="${T.heroClass}">
  <h1>Give</h1>
  <p>Your generosity fuels our mission. Every gift makes a difference.</p>
  <a href="#">Give Online</a>
</section>
${footerHtml}
</body></html>`,

    ministries: () => `<!DOCTYPE html>
<html lang="en">
<head><title>Ministries — ${T.brand}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${T.fonts}&display=swap" rel="stylesheet">
<style>${baseStyles}
.min-item{padding:28px 0;border-bottom:1px solid rgba(0,0,0,0.08)}
.min-item:last-child{border-bottom:none}
.min-item h3{font-family:${T.headingFont};font-size:20px;margin-bottom:8px}
</style></head>
<body>
${navHtml}
<div class="${T.contentClass}">
  <h1>Ministries</h1>
  <p>Find your place to belong</p>
  <div class="min-item"><h3>Children</h3><p>Age-appropriate programs for kids from birth through 5th grade.</p></div>
  <div class="min-item"><h3>Youth</h3><p>Middle and high school students building faith and friendships.</p></div>
  <div class="min-item"><h3>Small Groups</h3><p>Connect in smaller settings for study and community.</p></div>
  <div class="min-item"><h3>Serve</h3><p>Use your gifts to love our church and our city.</p></div>
</div>
${footerHtml}
</body></html>`,

    media: () => `<!DOCTYPE html>
<html lang="en">
<head><title>Media — ${T.brand}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${T.fonts}&display=swap" rel="stylesheet">
<style>${baseStyles}
.media-dark{background:var(--dark);border-radius:16px;padding:48px;margin-top:24px;color:white}
.media-dark .sec-title.light{font-family:${T.headingFont};font-size:22px;color:white;margin-bottom:12px}
.gold-divider{width:40px;height:3px;background:var(--accent);margin:12px 0}
.media-dark .btns{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
.media-dark .btn-primary{background:var(--accent);color:white}
.media-dark .btn-outline{border:2px solid rgba(255,255,255,0.5);color:white;padding:10px 20px;border-radius:8px;text-decoration:none}
${cmsStyles}</style></head>
<body>
${navHtml}
<div class="${T.contentClass}">
  <h1>Media</h1>
  <p>Sermons, podcasts, and worship</p>
  ${cmsFeatured}
  <h2>Sermon Archive</h2>
  ${cmsArchive}
  <div class="media-dark">
    <div class="media-two-col">
      <div>${cmsPodcast}</div>
      <div>${cmsWorship}</div>
    </div>
  </div>
</div>
${footerHtml}
</body></html>`,

    visit: () => `<!DOCTYPE html>
<html lang="en">
<head><title>Visit — ${T.brand}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${T.fonts}&display=swap" rel="stylesheet">
<style>${baseStyles}
.visit-row{margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid rgba(0,0,0,0.08)}
.visit-row:last-child{border-bottom:none}
.visit-row h3{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.visit-row a{color:var(--accent);font-weight:600;text-decoration:none}
</style></head>
<body>
${navHtml}
<div class="${T.contentClass}">
  <h1>Plan Your Visit</h1>
  <div class="visit-row"><h3>Location</h3><p>123 Faith Avenue, Grand Rapids, MI 49503<br><a href="#">Get directions →</a></p></div>
  <div class="visit-row"><h3>Service Times</h3><p>Sunday 8:00 & 10:30 AM · Wednesday 6:30 PM</p></div>
  <div class="visit-row"><h3>Contact</h3><p><a href="tel:6165550199">(616) 555-0199</a><br><a href="mailto:info@church.org">info@church.org</a></p></div>
  <a href="give.html" style="display:inline-block;background:var(--accent);color:white;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none;margin-top:16px">Give Online</a>
</div>
${footerHtml}
</body></html>`,
  };

  const fn = pages[slug];
  return fn ? fn() : null;
}

// Generate files
for (const [tplId, config] of Object.entries(TEMPLATES)) {
  const dir = path.join(templatesDir, tplId);
  ensureDir(dir);
  const pages = ["index", "about", "events", "give", "ministries", "media", "visit"];
  for (const slug of pages) {
    const html = genPage(tplId, null, slug);
    if (html) {
      const fname = slug === "index" ? "index.html" : `${slug}.html`;
      fs.writeFileSync(path.join(dir, fname), html, "utf-8");
      console.log(`  ${tplId}/${slug}.html`);
    }
  }
}

console.log("\nDone. Run: node scripts/generate-all-templates.mjs");
