// ─── The Exchange App — Pitch Deck Generator (v7 — Minimal Professional) ─────
// Design: white backgrounds · one accent color · big type · no clutter
// Run:  node scripts/generate-pitch-deck.mjs

import PptxGenJS from "pptxgenjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../The Exchange App - Pitch Deck.pptx");

// ─── Design System ────────────────────────────────────────────────────────────
const C = {
  bg:     "FFFFFF",   // slide background
  card:   "F9FAFB",   // card fill
  bdr:    "E5E7EB",   // card / rule border
  h1:     "111827",   // headline text
  body:   "374151",   // body text
  muted:  "9CA3AF",   // captions
  emr:    "10B981",   // ONE accent color
  emrDk:  "047857",   // darker accent
  dark:   "0F172A",   // dark slide bg
  darkMd: "1F2937",   // dark card bg
  darkBd: "2D3748",   // dark border
  white:  "FFFFFF",
};

const FONT = "Barlow";
const W = 10, H = 5.63;

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: W, height: H });
pptx.layout  = "WIDE";
pptx.title   = "The Exchange — Investor Pitch Deck 2026";
pptx.subject = "$150K–$500K Seed Round";
pptx.author  = "The Exchange App";

// ─── Primitives ───────────────────────────────────────────────────────────────
const R = pptx.ShapeType.rect;
const RR = pptx.ShapeType.roundRect;
const EL = pptx.ShapeType.ellipse;
const LN = pptx.ShapeType.line;

function rect(slide, x, y, w, h, fill, lineColor = fill) {
  slide.addShape(R, { x, y, w, h, fill: { color: fill }, line: { color: lineColor } });
}
function card(slide, x, y, w, h, featured = false) {
  slide.addShape(RR, {
    x, y, w, h,
    fill: { color: C.card },
    line: { color: featured ? C.emr : C.bdr, width: featured ? 1.2 : 0.5 },
    rectRadius: 0.05,
  });
}
function darkCard(slide, x, y, w, h) {
  slide.addShape(RR, { x, y, w, h, fill: { color: C.darkMd }, line: { color: C.darkBd, width: 0.5 }, rectRadius: 0.05 });
}
function rule(slide, y, x = 0.5, w = W - 1) {
  slide.addShape(LN, { x, y, w, h: 0, line: { color: C.bdr, width: 0.5 } });
}
function darkRule(slide, y) {
  slide.addShape(LN, { x: 0.5, y, w: W - 1, h: 0, line: { color: C.darkBd, width: 0.5 } });
}

// ─── Slide shell ─────────────────────────────────────────────────────────────
function lightShell(slide, num) {
  rect(slide, 0, 0, W, H, C.bg);
  rect(slide, 0, 0, W, 0.06, C.emr);
  rect(slide, 0, H - 0.28, W, 0.28, "F3F4F6");
  drawMark(slide, 0.50, H - 0.24, 0.10, C.emr);
  slide.addText("THE Exchange  ·  theexchangeapp.church  ·  CONFIDENTIAL", {
    x: 1.10, y: H - 0.27, w: 7.5, h: 0.22, fontSize: 8, color: C.muted, fontFace: FONT,
  });
  if (num) slide.addText(String(num), {
    x: W - 0.56, y: H - 0.27, w: 0.40, h: 0.22, fontSize: 9, bold: true, color: C.emr, fontFace: FONT, align: "right",
  });
}
function darkShell(slide, num) {
  rect(slide, 0, 0, W, H, C.dark);
  rect(slide, 0, 0, W, 0.06, C.emr);
  rect(slide, 0, H - 0.28, W, 0.28, C.darkMd);
  drawMark(slide, 0.50, H - 0.24, 0.10, C.emr);
  slide.addText("THE Exchange  ·  theexchangeapp.church", {
    x: 1.10, y: H - 0.27, w: 7.5, h: 0.22, fontSize: 8, color: C.muted, fontFace: FONT,
  });
  if (num) slide.addText(String(num), {
    x: W - 0.56, y: H - 0.27, w: 0.40, h: 0.22, fontSize: 9, bold: true, color: C.emr, fontFace: FONT, align: "right",
  });
}

// ─── Slide header ─────────────────────────────────────────────────────────────
function header(slide, label, headline, onDark = false) {
  slide.addText(label.toUpperCase(), {
    x: 0.50, y: 0.16, w: W - 1, h: 0.24,
    fontSize: 9, bold: true, color: C.emr, fontFace: FONT, charSpacing: 1.8,
  });
  slide.addText(headline, {
    x: 0.50, y: 0.40, w: W - 1, h: 0.42,
    fontSize: 20, bold: true, color: onDark ? C.white : C.h1, fontFace: FONT,
  });
  rule(slide, 0.86, 0.50, W - 1);
}

// ─── Logo mark (3 connected circles) ─────────────────────────────────────────
function drawMark(slide, bx, by, D, color = C.emr) {
  const r  = D / 2;
  const lx = bx + r,           ly = by + D * 0.95 + r;
  const mx = bx + r + D * 1.9, my = by + r;
  const rx = bx + r + D * 3.8, ry = by + D * 0.95 + r;
  const lw = Math.max(0.8, D * 16);
  slide.addShape(LN, { x: lx, y: my, w: mx - lx, h: ly - my, line: { color, width: lw }, flipV: true });
  slide.addShape(LN, { x: mx, y: my, w: rx - mx, h: ry - my, line: { color, width: lw } });
  [[lx, ly], [mx, my], [rx, ry]].forEach(([cx, cy]) =>
    slide.addShape(EL, { x: cx - r, y: cy - r, w: D, h: D, fill: { color }, line: { color } })
  );
}
function addWordmark(slide, bx, by, D, onDark = true) {
  drawMark(slide, bx, by, D);
  const tx = bx + D * 4.9;
  slide.addText("THE",      { x: tx, y: by,          w: D * 5, h: D * 0.56, fontSize: Math.max(6, D * 40), bold: true, color: onDark ? C.muted : C.muted, fontFace: FONT, charSpacing: 2 });
  slide.addText("Exchange", { x: tx, y: by + D * 0.54, w: D * 7, h: D * 0.96, fontSize: Math.max(8, D * 62), bold: true, color: onDark ? C.white : C.h1, fontFace: FONT });
}

// ─── Stat box (large number + label) ─────────────────────────────────────────
function stat(slide, x, y, w, h, value, label, vc = C.emr, featured = false) {
  card(slide, x, y, w, h, featured);
  slide.addText(value, { x, y: y + 0.10, w, h: h * 0.52, fontSize: 22, bold: true, color: vc, fontFace: FONT, align: "center", valign: "middle" });
  slide.addText(label, { x, y: y + h * 0.56, w, h: h * 0.38, fontSize: 9.5, color: C.muted, fontFace: FONT, align: "center", valign: "middle" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  darkShell(slide, null);

  addWordmark(slide, 0.52, 0.38, 0.28, true);

  slide.addText("Digital Infrastructure for the\nGlobal Church & Faith-Based Economy", {
    x: 0.52, y: 1.30, w: 7.0, h: 1.00,
    fontSize: 26, bold: true, color: C.white, fontFace: FONT,
  });

  slide.addShape(LN, { x: 0.52, y: 2.40, w: 3.6, h: 0, line: { color: C.emr, width: 1.5 } });

  slide.addText(
    "Inspired by 2 Corinthians 5:21 — the Great Exchange.\nWe build the platform where the Body of Christ gives, banks, and grows together.",
    { x: 0.52, y: 2.54, w: 6.8, h: 0.62, fontSize: 11, color: "9CA3AF", fontFace: FONT, italic: true }
  );

  const badges = [
    { v: "$150K–$500K", l: "SEED ROUND",   featured: true  },
    { v: "24 Months", l: "RUNWAY PLAN",  featured: false },
    { v: "Year 2",    l: "BREAK-EVEN",   featured: false },
  ];
  badges.forEach(({ v, l, featured }, i) => {
    const bx = 0.52 + i * 2.30;
    slide.addShape(RR, { x: bx, y: 3.42, w: 2.10, h: 0.82, fill: { color: featured ? C.emr : C.darkMd }, line: { color: featured ? C.emr : C.darkBd, width: 0.5 }, rectRadius: 0.05 });
    slide.addText(v, { x: bx, y: 3.48, w: 2.10, h: 0.38, fontSize: 19, bold: true, color: featured ? C.dark : C.white, fontFace: FONT, align: "center" });
    slide.addText(l, { x: bx, y: 3.86, w: 2.10, h: 0.24, fontSize: 8.5, bold: true, color: featured ? C.darkMd : C.muted, fontFace: FONT, align: "center", charSpacing: 0.8 });
  });

  slide.addText("Shawn Fair (Co-Founder)   586-248-1966   shawn@fairstewardshipgroup.com", {
    x: 0.52, y: 4.44, w: 8, h: 0.24, fontSize: 10, color: C.muted, fontFace: FONT,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — THE PROBLEM
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 2);
  header(slide, "The Problem", "The Church is the world's largest trust network — yet digitally fragmented.");

  const stats = [
    { v: "~2.3B",  l: "Estimated Christians Globally", c: C.h1 },
    { v: "380K+",  l: "US Churches & Faith Nonprofits", c: C.emr },
    { v: "$130B",  l: "Estimated Annual US Church Giving", c: C.emr },
    { v: "$700B+", l: "Estimated Global Christian Giving", c: C.emrDk },
    { v: "5+",     l: "Disconnected Tools Per Church (avg)", c: "DC2626" },
    { v: "0",      l: "All-In-One Platforms Serving Them", c: C.h1 },
  ];
  const sw = (W - 1) / 3, sh = 0.88;
  stats.forEach(({ v, l, c }, i) => {
    stat(slide, 0.50 + (i % 3) * sw, 0.98 + Math.floor(i / 3) * (sh + 0.10), sw - 0.10, sh, v, l, c, i === 1 || i === 2);
  });

  rect(slide, 0, 3.92, W, 0.70, C.h1);
  slide.addText(
    "Most churches juggle 5 or more separate tools for giving, email, payroll, banking, and member management with zero interoperability between them. The generosity exists. The infrastructure does not.",
    { x: 0.60, y: 4.00, w: W - 1.2, h: 0.56, fontSize: 10.5, color: C.white, fontFace: FONT }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — WHY NOW
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 3);
  header(slide, "Why Now", "Three conditions just converged. This platform was not viable 5 years ago.");

  const items = [
    {
      n: "01", title: "Permanent Digital Giving Behavior",
      body: "Post-COVID digital payment adoption is irreversible in churches and nonprofits. Congregations now expect online tithing, digital receipts, and mobile-accessible giving tools as a baseline — not a premium.",
    },
    {
      n: "02", title: "API-Based Fintech Infrastructure",
      body: "Platforms like Unit (FDIC banking-as-a-service) and Stripe now make bank-grade financial tools accessible to niche verticals without building a bank. This infrastructure did not exist at reasonable cost 5 years ago.",
    },
    {
      n: "03", title: "Network-Based Platform Model",
      body: "Community-driven ecosystems are the dominant software model. The Exchange combines a complete financial stack with a social network, compounding value for every organization that joins the network.",
    },
  ];

  items.forEach(({ n, title, body }, i) => {
    const y = 1.02 + i * 1.12;
    card(slide, 0.50, y, W - 1, 0.98);
    slide.addShape(EL, { x: 0.72, y: y + 0.26, w: 0.50, h: 0.50, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(n, { x: 0.72, y: y + 0.26, w: 0.50, h: 0.50, fontSize: 11, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle" });
    slide.addText(title, { x: 1.38, y: y + 0.10, w: W - 2.0, h: 0.30, fontSize: 12, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(body,  { x: 1.38, y: y + 0.44, w: W - 2.0, h: 0.46, fontSize: 10, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — THE SOLUTION
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 4);
  header(slide, "The Solution", "One platform for everything a church or faith-based nonprofit needs to operate.");

  slide.addText(
    "Give  ·  Bank  ·  Broadcast  ·  Build  ·  Track  ·  Operate — all connected, all in one place.",
    { x: 0.50, y: 0.92, w: W - 1, h: 0.24, fontSize: 10, color: C.muted, fontFace: FONT, italic: true }
  );

  const features = [
    "Giving & Donations",
    "Joint Shared Giving",
    "Revenue Splits",
    "Payment Transfers",
    "Website Builder + Hosting",
    "Custom Form Builder",
    "Flock Management (CRM)",
    "AI Notes & Engagement",
    "Surveys & Insights",
    "Broadcasts (SMS + Email)",
    "Budget Sheet (Personal & Org)",
    "Payroll Processing",
  ];

  const cols = 3, fw = (W - 1.1) / cols, fh = 0.56, fgap = 0.07;
  features.forEach((name, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const fx = 0.50 + col * (fw + 0.05);
    const fy = 1.24 + row * (fh + fgap);
    card(slide, fx, fy, fw, fh);
    // Emerald left accent
    slide.addShape(RR, { x: fx, y: fy, w: 0.04, h: fh, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0.02 });
    slide.addText(name, { x: fx + 0.14, y: fy + 0.08, w: fw - 0.22, h: fh - 0.16, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT, valign: "middle" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — SIGNATURE FEATURES
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 5);
  header(slide, "Signature Features", "Three capabilities we have not found combined in any platform we researched.");

  const panels = [
    {
      title: "AI Notes to Smart Engagement",
      steps: [
        "Pastor or leader writes or records sermon and meeting notes",
        "AI saves note and auto-generates survey questions from the content",
        "Survey is sent automatically to congregation or member list",
        "Members scored: 2+ responses = Active  ·  1 = Middle  ·  0 = Inactive",
        "Inactive members flagged for personal outreach by the leader",
      ],
    },
    {
      title: "Joint Shared Giving",
      steps: [
        "Organization A sends a connection request to Organization B",
        "Both orgs approve a shared giving percentage in their dashboards",
        "A configured share of every tithe auto-routes to the partner org",
        "Example: 10% of all tithes flows to a connected missionary organization",
        "Both orgs see real-time split reporting and donor-facing receipts",
      ],
    },
    {
      title: "Exchange Banking Ecosystem",
      steps: [
        "FDIC-insured accounts via Unit — no separate bank account needed",
        "Debit cards issued to leadership, staff, and ministry departments",
        "Bill pay, payroll, and ACH all managed from one dashboard",
        "Exchange Banking App (Year 2): peer-to-peer transfers for members",
        "Emergency fund sharing through the faith network — instantly",
      ],
    },
  ];

  const pw = (W - 1.1) / 3;
  panels.forEach(({ title, steps }, i) => {
    const px = 0.50 + i * (pw + 0.05);
    card(slide, px, 0.98, pw, 3.96);
    // Top accent bar on card
    slide.addShape(RR, { x: px, y: 0.98, w: pw, h: 0.04, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0.02 });
    slide.addText(title, { x: px + 0.14, y: 1.08, w: pw - 0.28, h: 0.50, fontSize: 11, bold: true, color: C.h1, fontFace: FONT });
    rule(slide, 1.62, px + 0.14, pw - 0.28);
    steps.forEach((step, si) => {
      slide.addShape(EL, { x: px + 0.14, y: 1.72 + si * 0.46, w: 0.12, h: 0.12, fill: { color: C.emr }, line: { color: C.emr } });
      slide.addText(step, { x: px + 0.34, y: 1.68 + si * 0.46, w: pw - 0.48, h: 0.40, fontSize: 9.5, color: C.body, fontFace: FONT });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — SOCIAL NETWORK & DISCOVERY LAYER
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 6);
  header(slide, "Social Network", "Search. Connect. Give. — A living network where faith communities discover, donate, and support each other.");

  const LW = 4.40, RW = 4.40, CX = 5.10, LX = 0.50;
  const cardY = 0.98, cardH = 3.24;

  // Left card — Community Layer (Live Today)
  card(slide, LX, cardY, LW, cardH);
  slide.addShape(RR, { x: LX, y: cardY, w: LW, h: 0.04, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0.02 });
  slide.addText("Community Layer — Live Today", { x: LX + 0.14, y: 1.08, w: LW - 0.28, h: 0.28, fontSize: 11.5, bold: true, color: C.h1, fontFace: FONT });
  rule(slide, 1.40, LX + 0.14, LW - 0.28);

  const leftItems = [
    { title: "Community Feed", body: "Churches and nonprofits post updates, events, campaigns, and ministry moments. Members engage, share, and comment in real time." },
    { title: "Discover & Donate", body: "Any user can search churches, nonprofits, and causes by name, city, or category — then donate directly from the search results." },
    { title: "Connect Forms", body: "In-app membership survey lets people join a church digitally. Every form submitted brings a new user onto the platform — free, organic growth with zero CAC." },
    { title: "AI-Generated Surveys", body: "Pastor inputs sermon notes → AI auto-generates survey questions → sent to the congregation. Active members stay engaged on the platform." },
  ];

  leftItems.forEach(({ title, body }, i) => {
    const iy = 1.50 + i * 0.66;
    slide.addShape(EL, { x: LX + 0.14, y: iy + 0.06, w: 0.10, h: 0.10, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(title, { x: LX + 0.30, y: iy, w: LW - 0.44, h: 0.24, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(body,  { x: LX + 0.30, y: iy + 0.24, w: LW - 0.44, h: 0.36, fontSize: 9.5, color: C.body, fontFace: FONT });
  });

  // Right card — The Vision
  card(slide, CX, cardY, RW, cardH);
  slide.addShape(RR, { x: CX, y: cardY, w: RW, h: 0.04, fill: { color: C.emrDk }, line: { color: C.emrDk }, rectRadius: 0.02 });
  slide.addText("Where We Are Going", { x: CX + 0.14, y: 1.08, w: RW - 0.28, h: 0.28, fontSize: 11.5, bold: true, color: C.h1, fontFace: FONT });
  rule(slide, 1.40, CX + 0.14, RW - 0.28);

  const rightItems = [
    { title: "Anonymous Fund Requests", body: "A member in need sends a private request → routes through their church → church broadcasts to the network → real-time funds arrive. No public shame. No bank rejection. The Body of Christ taking care of its own — instantly." },
    { title: "Post Boosting  (New Revenue Stream)", body: "Organizations boost posts for $10–$20 to reach a wider audience inside the Exchange network. In-platform ad revenue — no third-party ad network required." },
    { title: "Mobile-First Social App  (6–8 Months)", body: "Dedicated iOS + Android app launching 6–8 months from seed close. Social, discovery, and giving features prioritized first. Built for daily use, not quarterly reporting." },
  ];

  rightItems.forEach(({ title, body }, i) => {
    const iy = 1.50 + i * 0.88;
    slide.addShape(EL, { x: CX + 0.14, y: iy + 0.06, w: 0.10, h: 0.10, fill: { color: C.emrDk }, line: { color: C.emrDk } });
    slide.addText(title, { x: CX + 0.30, y: iy, w: RW - 0.44, h: 0.24, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(body,  { x: CX + 0.30, y: iy + 0.24, w: RW - 0.44, h: 0.58, fontSize: 9.5, color: C.body, fontFace: FONT });
  });

  // Bottom banner
  card(slide, 0.50, 4.32, W - 1, 0.92, true);
  slide.addShape(RR, { x: 0.50, y: 4.32, w: 0.04, h: 0.92, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0 });
  slide.addText(
    "Most social platforms monetize attention. The Exchange monetizes generosity. Every connection on this platform has the potential to move real resources to real people — in real time.",
    { x: 0.66, y: 4.36, w: W - 1.28, h: 0.82, fontSize: 11.5, color: C.emrDk, fontFace: FONT, italic: true, valign: "middle" }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — MARKET OPPORTUNITY
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 7);
  header(slide, "Market Opportunity", "An estimated $130B+ annual giving market with no dominant all-in-one platform.");

  // Left: TAM/SAM/SOM
  card(slide, 0.50, 0.98, 4.50, 3.70);
  slide.addText("TAM", { x: 0.70, y: 1.06, w: 0.60, h: 0.26, fontSize: 9, bold: true, color: C.emr, fontFace: FONT });
  slide.addText("~$700B+ Estimated Global Christian Giving", { x: 0.70, y: 1.32, w: 4.08, h: 0.34, fontSize: 13, bold: true, color: C.h1, fontFace: FONT });
  rule(slide, 1.70, 0.70, 4.08);

  slide.addText("SAM", { x: 0.70, y: 1.80, w: 0.60, h: 0.26, fontSize: 9, bold: true, color: C.emr, fontFace: FONT });
  slide.addText("Estimated $5–15B  ·  ~380,000 US Churches & Faith Organizations", { x: 0.70, y: 2.06, w: 4.08, h: 0.34, fontSize: 11.5, bold: true, color: C.h1, fontFace: FONT });
  rule(slide, 2.44, 0.70, 4.08);

  slide.addText("SOM", { x: 0.70, y: 2.52, w: 0.60, h: 0.26, fontSize: 9, bold: true, color: C.emr, fontFace: FONT });
  slide.addText("$3.2M+ ARR at 3,000 orgs (est. 1% US penetration)", { x: 0.70, y: 2.78, w: 4.08, h: 0.34, fontSize: 11, bold: true, color: C.emrDk, fontFace: FONT });

  slide.addShape(RR, { x: 0.50, y: 3.26, w: 4.50, h: 1.32, fill: { color: "F0FDF4" }, line: { color: C.emr, width: 0.5 }, rectRadius: 0.05 });
  slide.addText("At 1% market penetration, 3,800 organizations at an estimated blended $55/mo generates approximately $3.87M in annual recurring revenue — self-sustaining in Year 2.", {
    x: 0.70, y: 3.36, w: 4.08, h: 1.08, fontSize: 10, color: C.emrDk, fontFace: FONT,
  });

  // Right KPIs
  const mktStats = [
    { v: "380K+",   l: "Estimated US Addressable Orgs" },
    { v: "~$55/mo", l: "Conservative Blended ARPU (Year 1-2 Est.)" },
    { v: "3,800",   l: "Orgs = Approx. 1% Market Share" },
    { v: "$3.87M",  l: "Estimated ARR at 1% US Penetration" },
  ];
  mktStats.forEach(({ v, l }, i) => stat(slide, 5.30, 0.98 + i * 0.92, 4.20, 0.82, v, l, C.emr, i === 3));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — PRICING
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 8);
  header(slide, "Pricing", "Start free. Upgrade when you need more. No pressure, no credit card required.");

  slide.addText(
    "Anyone can sign up free — individuals and organizations alike. The $29 and $49 plans add a 14-day free trial of premium features like the website builder and AI tools. Payroll ($89) targets Month 6. Banking is a separate free layer around Month 12.",
    { x: 0.50, y: 0.92, w: W - 1, h: 0.24, fontSize: 10, color: C.muted, fontFace: FONT, italic: true }
  );

  const plans = [
    {
      name: "FREE",   price: "$0",     sub: "Organizations, Churches & Individuals",
      features: ["Free forever — no credit card", "Accept donations (1% transaction fee)", "Personal & org budget sheet", "Donor receipts & giving history", "Community feed, connections & chat", "Custom donation forms & QR codes"],
      featured: false,
    },
    {
      name: "BASIC",  price: "$29/mo", sub: "Small Churches & Nonprofits",
      features: ["14-day free trial of premium features", "Joint Shared Giving", "Flock Management CRM", "Surveys & Engagement Scoring", "Custom Form Builder", "50 AI Credits per month"],
      featured: false,
    },
    {
      name: "PRO",    price: "$49/mo", sub: "Growing Organizations",
      features: ["14-day free trial of premium features", "Website Builder + Custom Domain", "AI Notes → Auto Surveys", "Broadcasts — SMS + Email", "Revenue Splits & Advanced Analytics", "200 AI Credits per month"],
      featured: true,
    },
  ];

  plans.forEach(({ name, price, sub, features, featured }, i) => {
    const x = 0.50 + i * 2.72;
    card(slide, x, 1.22, 2.52, 3.50, featured);
    if (featured) {
      slide.addShape(RR, { x: x, y: 1.22, w: 2.52, h: 0.04, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0.02 });
      slide.addText("MOST POPULAR", { x, y: 1.28, w: 2.52, h: 0.24, fontSize: 8, bold: true, color: C.emr, fontFace: FONT, align: "center", charSpacing: 1 });
    }
    const nameY = featured ? 1.54 : 1.36;
    slide.addText(name,  { x, y: nameY,       w: 2.52, h: 0.30, fontSize: 13, bold: true, color: C.h1, fontFace: FONT, align: "center" });
    slide.addText(price, { x, y: nameY + 0.30, w: 2.52, h: 0.46, fontSize: 26, bold: true, color: featured ? C.emr : C.h1, fontFace: FONT, align: "center" });
    slide.addText(sub,   { x, y: nameY + 0.76, w: 2.52, h: 0.24, fontSize: 9, color: C.muted, fontFace: FONT, align: "center", italic: true });
    rule(slide, nameY + 1.06, x + 0.16, 2.20);
    features.forEach((f, fi) => {
      slide.addShape(EL, { x: x + 0.18, y: nameY + 1.16 + fi * 0.34, w: 0.10, h: 0.10, fill: { color: C.emr }, line: { color: C.emr } });
      slide.addText(f, { x: x + 0.34, y: nameY + 1.12 + fi * 0.34, w: 2.04, h: 0.30, fontSize: 9.5, color: C.body, fontFace: FONT });
    });
  });

  // Coming soon
  card(slide, 8.66, 1.22, 1.24, 1.56);
  slide.addText("COMING SOON", { x: 8.66, y: 1.30, w: 1.24, h: 0.22, fontSize: 8, bold: true, color: C.muted, fontFace: FONT, align: "center", charSpacing: 0.8 });
  slide.addText("$89/mo\nPayroll\nMonth 6 target", { x: 8.66, y: 1.54, w: 1.24, h: 0.70, fontSize: 9.5, color: C.muted, fontFace: FONT, align: "center" });
  rule(slide, 2.80, 8.74, 1.08);
  card(slide, 8.66, 2.94, 1.24, 1.68);
  slide.addText("$150/mo\nAdvisor\nNetwork\n(Phase 3+)", { x: 8.66, y: 3.04, w: 1.24, h: 1.42, fontSize: 9.5, color: C.muted, fontFace: FONT, align: "center" });

  // Budget callout — two-column detail
  card(slide, 0.50, 4.70, W - 1, 0.58, true);
  slide.addShape(RR, { x: 0.50, y: 4.70, w: 0.04, h: 0.58, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0 });
  slide.addText("Budget Sheet — Free for Everyone", { x: 0.66, y: 4.74, w: W - 1.30, h: 0.22, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT });
  const budgetCols = [
    "Personal budget: income, fixed & variable expenses, transaction log, net cash flow — auto-generated for all 12 months at once",
    "Org budget: shared across all church admins and staff  ·  Analytics with year-over-year comparison  ·  Excel export for board presentations",
  ];
  budgetCols.forEach((line, i) => {
    const bx = 0.66 + i * ((W - 1.30) / 2 + 0.04);
    slide.addShape(EL, { x: bx, y: 5.00, w: 0.08, h: 0.08, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(line, { x: bx + 0.16, y: 4.96, w: (W - 1.30) / 2 - 0.20, h: 0.28, fontSize: 9, color: C.body, fontFace: FONT });
  });

  card(slide, 0.50, 5.34, W - 1, 0.22, false);
  slide.addText("Revenue streams: Subscriptions  ·  1% Transaction Fees  ·  AI Credits  ·  Website Hosting  ·  Post Boosting ($10–$20)  ·  Banking Interchange (future)", {
    x: 0.60, y: 5.36, w: W - 1.2, h: 0.18, fontSize: 9, color: C.muted, fontFace: FONT, align: "center",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — REVENUE DIRECTION
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 9);
  header(slide, "Revenue Direction", "Simple model. Ads start small. Revenue grows with every organization that joins.");

  // ── Three simple revenue milestones ──
  const steps = [
    { label: "Year 1 Goal", value: "$50K–$80K", sub: "Prove the model works", icon: "01" },
    { label: "Year 2 Goal", value: "Break-Even", sub: "Revenue covers all operating costs", icon: "02" },
    { label: "Year 3+",     value: "Scale",       sub: "Network compounds. Revenue follows.", icon: "03" },
  ];
  steps.forEach(({ label, value, sub }, i) => {
    const x = 0.50 + i * 3.17;
    card(slide, x, 0.98, 2.92, 2.00, i === 1);
    if (i === 1) slide.addShape(RR, { x, y: 0.98, w: 2.92, h: 0.04, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0.02 });
    slide.addText(label, { x, y: 1.08, w: 2.92, h: 0.28, fontSize: 10, bold: true, color: C.emr, fontFace: FONT, align: "center" });
    slide.addText(value, { x, y: 1.36, w: 2.92, h: 0.60, fontSize: i === 1 ? 26 : 28, bold: true, color: i === 1 ? C.emr : C.h1, fontFace: FONT, align: "center" });
    slide.addText(sub,   { x, y: 2.00, w: 2.92, h: 0.32, fontSize: 10, color: C.muted, fontFace: FONT, align: "center" });
  });

  // ── How revenue is earned (simple list) ──
  card(slide, 0.50, 3.14, W - 1, 1.10);
  slide.addText("Where Revenue Comes From", { x: 0.70, y: 3.22, w: W - 1.4, h: 0.28, fontSize: 11.5, bold: true, color: C.h1, fontFace: FONT });
  rule(slide, 3.54, 0.70, W - 1.4);
  const streams = [
    "Monthly subscriptions — $29 Basic and $49 Pro plans",
    "1% transaction fee on donations processed through the platform",
    "Post boosting — organizations promote posts inside the network for $10–$20",
    "Payroll processing ($89/mo plan, launching around Month 6)",
    "Banking interchange revenue as the Exchange Banking layer matures",
  ];
  const col = Math.ceil(streams.length / 2);
  streams.forEach((s, si) => {
    const cx = si < col ? 0.70 : W / 2 + 0.10;
    const cy = 3.62 + (si % col) * 0.26;
    slide.addShape(EL, { x: cx, y: cy + 0.06, w: 0.09, h: 0.09, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(s, { x: cx + 0.18, y: cy, w: W / 2 - 0.50, h: 0.24, fontSize: 9.5, color: C.body, fontFace: FONT });
  });

  // ── Ad spend note ──
  card(slide, 0.50, 4.36, W - 1, 0.72, true);
  slide.addShape(RR, { x: 0.50, y: 4.36, w: 0.04, h: 0.72, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0 });
  slide.addText(
    "Ads start at $1,000/month — controlled testing on Facebook first. We do not scale spend until the data shows it is working. Detailed financials are available privately.",
    { x: 0.68, y: 4.42, w: W - 1.28, h: 0.60, fontSize: 10.5, color: C.emrDk, fontFace: FONT, italic: true, valign: "middle" }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — COMPETITIVE LANDSCAPE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 10);
  header(slide, "Competitive Landscape", "Verified March 2026. Tithe.ly acquired Breeze ChMS in 2024 — now unified at $119/mo All Access.");

  card(slide, 0.50, 0.94, W - 1, 0.30, true);
  slide.addText("Based on our research, no platform we studied combines social network + banking + AI notes-to-surveys + giving + payroll in one place. Limited = partial feature only.", {
    x: 0.64, y: 0.98, w: W - 1.28, h: 0.22, fontSize: 9.5, bold: true, color: C.emrDk, fontFace: FONT,
  });

  // ── Verified as of March 2026 (sources: platform websites + third-party reviews) ──
  // Tithe.ly acquired Breeze ChMS; Breeze is now Tithely Church Management (included in All Access $119/mo)
  // Subsplash: quote-based pricing ($99+/mo estimated), website, forms, CRM, Pulpit AI (sermon CONTENT only — not engagement AI or notes-to-surveys)
  //            The Church App has geolocation-based church discovery (separate consumer app, not org-to-org platform network)
  //            Group messaging/prayer/polls = limited social tools — no true social feed
  // Pushpay: owned by Ministry Brands; no website builder, no banking, no social feed, no church discovery
  //          AI = data search + giving analytics only. Forms via ChMS. Group participation (notifications), not social.
  // Tithe.ly: All Access $119/mo includes Breeze CRM, website, forms, giving, two-way push notifications
  //           No banking, no payroll, no social feed, no church discovery, no AI notes
  // Planning Center: modular free–$49/mo; website (Publishing product), forms, CRM, giving — no banking, payroll, social, or discovery
  const headers = ["Feature", "The Exchange", "Subsplash", "Pushpay", "Tithe.ly", "Planning Center"];
  const rows = [
    ["Giving Platform",              "Yes (1%)",  "Yes",      "Yes",      "Yes",      "Yes"         ],
    ["Joint Shared Giving",          "Yes",       "No",       "No",       "No",       "No"          ],
    ["Revenue Splits",               "Yes",       "No",       "No",       "No",       "No"          ],
    ["Social Feed / Network",        "Yes",       "Limited",  "No",       "No",       "No"          ],
    ["Church + Event Discovery",     "Yes",       "Limited",  "No",       "No",       "No"          ],
    ["Banking App / FDIC Banking",   "Yes",       "No",       "No",       "No",       "No"          ],
    ["Payroll Processing",           "Yes ($89)", "No",       "No",       "No",       "No"          ],
    ["AI Notes + Surveys",           "Yes",       "No",       "No",       "No",       "No"          ],
    ["Custom Form Builder",          "Yes",       "Yes",      "Yes",      "Yes",      "Yes"         ],
    ["CRM + Flock Management",       "Yes",       "Yes",      "Yes",      "Yes",      "Yes"         ],
    ["Website Builder + Hosting",    "Yes",       "Yes",      "No",       "Yes",      "Yes"         ],
    ["Entry Price",                  "$29/mo",    "$99+/mo",  "$199+/mo", "$72/mo",   "Free-$49/mo" ],
  ];

  const colW = [2.1, 1.48, 1.48, 1.48, 1.48, 1.48];
  const tableData = [
    headers.map((h, ci) => ({
      text: h,
      options: { fontSize: 9.5, bold: true, fontFace: FONT, align: "center",
        color: ci === 1 ? C.white : C.white,
        fill: { color: ci === 1 ? C.emr : C.h1 },
      },
    })),
    ...rows.map((r, ri) => r.map((cell, ci) => ({
      text: cell,
      options: {
        fontSize: 9, fontFace: FONT, align: "center", bold: ci === 1,
        color: ci === 1
          ? C.emr
          : cell === "No"
            ? "D1D5DB"
            : cell === "Yes"
              ? "059669"
              : cell === "Limited"
                ? "D97706"
                : C.body,
        fill: { color: ci === 1 ? "F0FDF4" : ri % 2 === 0 ? C.bg : C.card },
      },
    }))),
  ];

  slide.addTable(tableData, {
    x: 0.50, y: 1.30, colW,
    rowH: 0.27, border: { type: "solid", color: C.bdr, pt: 0.4 }, fontFace: FONT,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — MARKETING STRATEGY (Overview)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 11);
  header(slide, "Marketing Strategy", "Earn proof before spending money. Each phase unlocks the next.");

  slide.addText(
    "Core principle: Survey and pilot first, test ads second, scale only what is proven, then let the network and referral engine compound.",
    { x: 0.50, y: 0.92, w: W - 1, h: 0.24, fontSize: 10, color: C.muted, fontFace: FONT, italic: true }
  );

  const phases = [
    { phase: "Phase 0-1", months: "Month 0-3",  spend: "$0",
      title: "Foot Traffic + Pilot Onboarding + Organic Platform Growth",
      body:  "In-person outreach — conferences, events, direct church visits. Onboard 1-3 pilot churches at no cost. Connect forms and AI-generated surveys create organic in-platform growth from day one — every member who fills out a connect survey or responds to a pastor's survey becomes a platform user at zero CAC. No paid social until real proof exists." },
    { phase: "Phase 2",   months: "Month 3-6",  spend: "$1K/mo",
      title: "Controlled Ad Testing — Facebook + YouTube",
      body:  "Start on Facebook. Test one variable at a time: hook copy, creative format, audience, then CTA. We do not scale any ad set until the data shows it is working. What 'working' looks like will be defined by what we observe, not a pre-set number." },
    { phase: "Phase 3",   months: "Month 6-18", spend: "$5K-$18K/mo",
      title: "Paid Scale + TikTok + Christian Networks",
      body:  "Scale proven Facebook and YouTube ad sets. Add TikTok ($3.50 CPM — cheapest major platform) for brand awareness. Add Beacon Ad Network and FrontGate Media for direct placement on Gospel Coalition, Blue Letter Bible, and Christian leadership sites. $89 plan activates. Influencer program launches." },
    { phase: "Phase 4",   months: "Month 18+",  spend: "$0 CAC",
      title: "Advisor Referral Engine",
      body:  "Recruit 100 faith-based financial advisors to refer churches. Each advisor estimated to refer 5 organizations. At 33% trial-to-paid, this channel alone generates 165 paid organizations at near-zero CAC." },
  ];

  phases.forEach(({ phase, months, spend, title, body }, i) => {
    const y = 1.22 + i * 1.00;
    card(slide, 0.50, y, W - 1, 0.86);
    slide.addShape(RR, { x: 0.50, y, w: 1.16, h: 0.86, fill: { color: "F0FDF4" }, line: { color: C.emr, width: 0.5 }, rectRadius: 0.05 });
    slide.addText(phase.toUpperCase(),  { x: 0.50, y: y + 0.04, w: 1.16, h: 0.30, fontSize: 8, bold: true, color: C.emr, fontFace: FONT, align: "center", charSpacing: 0.5 });
    slide.addText(months, { x: 0.50, y: y + 0.34, w: 1.16, h: 0.22, fontSize: 8.5, color: C.muted, fontFace: FONT, align: "center" });
    slide.addText(spend,  { x: 0.50, y: y + 0.56, w: 1.16, h: 0.24, fontSize: 9, bold: true, color: C.emrDk, fontFace: FONT, align: "center" });
    slide.addText(title, { x: 1.82, y: y + 0.08, w: W - 2.46, h: 0.26, fontSize: 11.5, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(body,  { x: 1.82, y: y + 0.38, w: W - 2.46, h: 0.40, fontSize: 10, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 12 — PAID ACQUISITION (Facebook + YouTube)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 12);
  header(slide, "Paid Acquisition", "Researched across 13 platforms — Facebook, YouTube, and TikTok are the optimal stack.");

  // Platform CPM comparison mini-table
  const cpmData = [
    ["Platform",         "Avg CPM",   "Best For",                 "Phase"],
    ["TikTok",           "$3.50-$9",  "Brand awareness, young staff",   "Month 6+"],
    ["Facebook/Instagram","$10-$15",  "Church admin, pastor targeting", "Month 3+"],
    ["YouTube",          "$9-$36",    "Video product demos",            "Month 3+"],
    ["TikTok",           "$3.50-$9",  "Brand awareness, young staff",   "Month 6+"],
    ["Beacon/FrontGate", "$5-$15",    "Gospel Coalition, Blue Letter Bible","Month 6+"],
    ["LinkedIn",         "$30-$50",   "Enterprise / large churches only","Phase 3+"],
  ];
  const cpmColW = [1.76, 0.86, 2.80, 1.00];
  const cpmTableData = cpmData.map((row, ri) => row.map((cell, ci) => ({
    text: cell,
    options: {
      fontSize: ri === 0 ? 8.5 : 9, bold: ri === 0 || (ri > 0 && ci === 0),
      color: ri === 0 ? C.white : ci === 1 && cell === "FREE" ? "059669" : ci === 0 ? C.emrDk : C.body,
      fill: { color: ri === 0 ? C.h1 : ri % 2 === 0 ? C.bg : C.card },
      fontFace: FONT, align: ci === 1 ? "center" : "left",
    },
  })));
  slide.addTable(cpmTableData, { x: 0.50, y: 0.94, colW: cpmColW, rowH: 0.26, border: { type: "solid", color: C.bdr, pt: 0.4 }, fontFace: FONT });

  // Channel split
  const splitY = 2.72;
  card(slide, 0.50, splitY, 4.60, 1.04);
  slide.addText("Facebook / Instagram", { x: 0.66, y: splitY + 0.08, w: 4.24, h: 0.26, fontSize: 12, bold: true, color: C.h1, fontFace: FONT });
  slide.addText("Primary platform (Phase 1)   CPM $10-$15   Best job-title targeting available", { x: 0.66, y: splitY + 0.34, w: 4.24, h: 0.22, fontSize: 9.5, color: C.emr, fontFace: FONT, bold: true });
  slide.addText("Job title targeting: Pastor, Executive Pastor, Church Administrator, Ministry Director. Funnel: video testimonial top, retargeting feature highlight, then trial offer.", {
    x: 0.66, y: splitY + 0.58, w: 4.24, h: 0.38, fontSize: 9.5, color: C.body, fontFace: FONT });

  card(slide, 5.38, splitY, 4.12, 1.04);
  slide.addText("YouTube Pre-Roll", { x: 5.54, y: splitY + 0.08, w: 3.76, h: 0.26, fontSize: 12, bold: true, color: C.h1, fontFace: FONT });
  slide.addText("35% of paid social spend   CPV $0.05-$0.10   CPM $9-$36", { x: 5.54, y: splitY + 0.34, w: 3.76, h: 0.22, fontSize: 9.5, color: C.emr, fontFace: FONT, bold: true });
  slide.addText("15s non-skippable pre-roll on church leadership and ministry finance channels. Product demo testimonial — 100% completion rate.", {
    x: 5.54, y: splitY + 0.58, w: 3.76, h: 0.38, fontSize: 9.5, color: C.body, fontFace: FONT });

  // Budget ramp table
  slide.addText("Budget Ramp", { x: 0.50, y: 3.86, w: 4, h: 0.24, fontSize: 11, bold: true, color: C.h1, fontFace: FONT });
  const rampData = [
    ["Period",       "Monthly Budget", "Cumulative", "Milestone"],
    ["Month 1-2",    "$1,000",         "$2,000",     "A/B testing only"],
    ["Month 3-4",    "$3,000",         "$8,000",     "Scale 1-2 proven ad sets"],
    ["Month 5-6",    "$6,000",         "$20,000",    "Retargeting added"],
    ["Month 7-9",    "$10,000",        "$50,000",    "Full Facebook + YouTube"],
    ["Month 10-18",  "$15K-$20K",      "~$203,000",  "TikTok + influencer compounds"],
  ];
  const rColW = [1.4, 1.3, 1.3, 2.0];
  const rTableData = rampData.map((row, ri) => row.map((cell, ci) => ({
    text: cell,
    options: {
      fontSize: ri === 0 ? 8.5 : 9, bold: ri === 0,
      color: ri === 0 ? C.white : ci === 0 ? C.emr : C.body,
      fill: { color: ri === 0 ? C.h1 : ri % 2 === 0 ? C.bg : C.card },
      fontFace: FONT, align: ci === 0 ? "left" : "center",
    },
  })));
  slide.addTable(rTableData, { x: 0.50, y: 4.12, colW: rColW, rowH: 0.26, border: { type: "solid", color: C.bdr, pt: 0.4 }, fontFace: FONT });

  // Graduation gates
  card(slide, 6.62, 3.86, 2.88, 1.66, true);
  slide.addText("Scale Discipline", { x: 6.78, y: 3.92, w: 2.52, h: 0.26, fontSize: 11, bold: true, color: C.emrDk, fontFace: FONT });
  slide.addText("We do not scale any channel until the data supports it:", { x: 6.78, y: 4.18, w: 2.52, h: 0.22, fontSize: 9.5, color: C.body, fontFace: FONT });
  [
    "Trial start rate is trending positive",
    "Trial-to-paid conversion is validated",
    "2+ ad variations show consistent results",
    "Unit economics support the next spend tier",
  ].forEach((g, gi) => {
    slide.addShape(EL, { x: 6.78, y: 4.44 + gi * 0.26, w: 0.10, h: 0.10, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(g, { x: 6.94, y: 4.40 + gi * 0.26, w: 2.36, h: 0.24, fontSize: 9.5, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 13 — AD PLATFORM STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 13);
  header(slide, "Ad Platform Strategy", "Start on one platform. Get it right. Then scale to others over time.");

  slide.addText(
    "Trying to advertise on multiple platforms at once divides attention, divides budget, and delays results on every channel. Each platform has its own content strategy, creative format, audience behavior, and testing logic. We do not split focus.",
    { x: 0.50, y: 0.92, w: W - 1, h: 0.28, fontSize: 10, color: C.muted, fontFace: FONT, italic: true }
  );

  // Three phase cards across the top
  const phases = [
    {
      phase: "NOW — Phase 1",
      color: C.emr,
      platform: "Facebook (Primary)",
      why: "Best job-title targeting of any platform. Reaches Executive Pastors, Church Administrators, and Ministry Directors directly. We test at a small budget, study what works, then scale what the data supports.",
      cpm: "$10–$15 CPM  ·  Cost per trial to be measured in market",
    },
    {
      phase: "PHASE 2 — Once Facebook is proven",
      color: C.emrDk,
      platform: "YouTube (Secondary)",
      why: "Best format for a product demo. Pre-roll at $0.05–$0.10 per view targets church management and ministry finance channels. Viewers are already in the mindset. Activate after Facebook ROAS is positive.",
      cpm: "$0.05–$0.10 CPV  ·  Added after Facebook economics are proven",
    },
    {
      phase: "PHASE 3+ — Scale over time",
      color: "6B7280",
      platform: "TikTok, Faith Networks, Others",
      why: "TikTok has the cheapest CPM at $3.50–$9. Faith networks (Beacon, FrontGate) place ads directly on Gospel Coalition and Bible sites. Each added only after Facebook and YouTube are proven and self-funding.",
      cpm: "TikTok $3.50–$9 CPM  ·  Subject to change based on results",
    },
  ];

  phases.forEach(({ phase, color, platform, why, cpm }, i) => {
    const cx = 0.50 + i * 3.17;
    card(slide, cx, 1.28, 3.00, 3.00);
    slide.addShape(RR, { x: cx, y: 1.28, w: 3.00, h: 0.04, fill: { color }, line: { color }, rectRadius: 0 });
    slide.addText(phase,    { x: cx + 0.14, y: 1.34, w: 2.72, h: 0.22, fontSize: 8.5, bold: true, color, fontFace: FONT });
    slide.addText(platform, { x: cx + 0.14, y: 1.58, w: 2.72, h: 0.28, fontSize: 13, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(why,      { x: cx + 0.14, y: 1.92, w: 2.72, h: 1.40, fontSize: 9.5, color: C.body, fontFace: FONT });
    slide.addText(cpm,      { x: cx + 0.14, y: 3.96, w: 2.72, h: 0.26, fontSize: 8.5, color: C.muted, fontFace: FONT, italic: true });
  });

  // Platform reference table — compact, below cards
  const platformData = [
    ["Platform",         "CPM",         "Format",             "Est. Cost/Trial",   "When We Use It"       ],
    ["Facebook / Insta", "$10–$15",     "Video + image",      "Phase 1 — start here",  "Best targeting precision"    ],
    ["YouTube",          "$0.05/view",  "Pre-roll video",     "$30–$70",           "Phase 2"              ],
    ["TikTok",           "$3.50–$9",    "Short video",        "$20–$50",           "Phase 3+"             ],
    ["Beacon/FrontGate", "$5–$15",      "Faith site banners", "$30–$60",           "Phase 3+"             ],
    ["LinkedIn",         "$30–$50",     "Sponsored content",  "$150–$300",         "Phase 4+ enterprise"  ],
  ];
  const pColW = [1.55, 0.86, 1.24, 1.30, 1.55];
  const pTableData = platformData.map((row, ri) => row.map((cell, ci) => ({
    text: cell,
    options: {
      fontSize: ri === 0 ? 8 : 8.5, bold: ri === 0,
      color: ri === 0 ? C.white : cell === "FREE" || cell === "$0 in ad spend" ? "059669" : cell.includes("start here") ? C.emrDk : C.body,
      fill: { color: ri === 0 ? C.h1 : ri === 2 ? "F0FDF4" : ri % 2 === 0 ? C.bg : C.card },
      fontFace: FONT, align: "left",
    },
  })));
  slide.addTable(pTableData, { x: 0.50, y: 4.30, colW: pColW, rowH: 0.22, border: { type: "solid", color: C.bdr, pt: 0.4 }, fontFace: FONT });

  card(slide, 6.10, 4.30, W - 6.60, 1.54, true);
  slide.addShape(RR, { x: 6.10, y: 4.30, w: W - 6.60, h: 0.04, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0 });
  slide.addText("Why not all at once?", { x: 6.24, y: 4.40, w: 3.20, h: 0.24, fontSize: 10, bold: true, color: C.h1, fontFace: FONT });
  [
    "Every platform needs dedicated creative, its own testing logic, and its own optimization rhythm.",
    "Spreading budget before proof = wasted money and delayed results on every channel.",
    "One proven platform funds the next. This is not limitation — it is discipline.",
  ].forEach((line, i) => {
    slide.addText(line, { x: 6.24, y: 4.68 + i * 0.36, w: 3.20, h: 0.32, fontSize: 9, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 14 — TRIAL CONVERSION ECONOMICS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 14);
  header(slide, "Trial Conversion Goal", "Primary conversion: 14-day free trial on the $29 or $49 plan. Everything else is upstream of that.");

  slide.addText(
    "The free plan is always available with no trial needed. The 14-day trial unlocks premium features — website builder, AI tools, advanced analytics. That is what we are driving toward with every ad dollar.",
    { x: 0.50, y: 0.92, w: W - 1, h: 0.28, fontSize: 10, color: C.muted, fontFace: FONT, italic: true }
  );

  // Funnel visualization — 5 steps across the slide
  const funnelSteps = [
    { step: "1", label: "Ad Shown",         num: "1,000",  unit: "impressions",    color: C.h1      },
    { step: "2", label: "Click to Website", num: "Some",   unit: "click through",  color: "374151"  },
    { step: "3", label: "Free Signup",      num: "Some",   unit: "sign up free",   color: C.emrDk   },
    { step: "4", label: "14-Day Trial",     num: "Some",   unit: "start trial",    color: C.emr     },
    { step: "5", label: "Paid Plan",        num: "Goal",   unit: "convert to paid",color: "047857"  },
  ];

  const fw = (W - 1.0) / 5;
  funnelSteps.forEach(({ step, label, num, unit, color }, i) => {
    const cx = 0.50 + i * fw;
    const fh = 1.70 - i * 0.22;
    const fy = 1.28 + (1.70 - fh);
    // Funnel bar
    slide.addShape(RR, { x: cx + 0.08, y: fy, w: fw - 0.16, h: fh, fill: { color }, line: { color: "00000000" }, rectRadius: 0.04 });
    slide.addText(num,  { x: cx + 0.08, y: fy + 0.22, w: fw - 0.16, h: 0.34, fontSize: 14, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle" });
    slide.addText(unit, { x: cx + 0.08, y: fy + 0.56, w: fw - 0.16, h: 0.22, fontSize: 8.5, color: "E5E7EB", fontFace: FONT, align: "center" });
    // Label below
    slide.addText(label, { x: cx, y: 3.14, w: fw, h: 0.26, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT, align: "center" });
    // Arrow between steps
    if (i < 4) {
      slide.addShape(LN, { x: cx + fw - 0.10, y: fy + fh / 2, w: 0.10, h: 0, line: { color: C.bdr, width: 1.5 } });
    }
  });

  // Platform cost per trial table
  slide.addText("Platform Benchmarks — Cost Per Lead Will Be Measured in Market", { x: 0.50, y: 3.48, w: W - 1, h: 0.26, fontSize: 11, bold: true, color: C.h1, fontFace: FONT });
  const trialData = [
    ["Platform",         "Avg CPM",    "Best Use Case",               "When We Use It",      "Notes"],
    ["Facebook/Insta",   "$10–$15",    "Pastor & admin targeting",    "Phase 1 — start here","Most precise audience targeting"],
    ["YouTube",          "$0.05/view", "Product demo pre-roll",       "Phase 2",             "Church leadership channel targeting"],
    ["TikTok",           "$3.50–$9",   "Brand awareness, young staff","Phase 3+",            "Cheapest CPM — add after FB proven"],
  ];
  const tColW = [1.34, 0.82, 1.80, 1.30, 2.24];
  const trialTableData = trialData.map((row, ri) => row.map((cell, ci) => ({
    text: cell,
    options: {
      fontSize: ri === 0 ? 8.5 : 9, bold: ri === 0,
      color: ri === 0 ? C.white : cell === "FREE" || cell === "$0 (free budget)" || cell === "$0 direct" ? "059669" : ri === 1 ? "047857" : C.body,
      fill: { color: ri === 0 ? C.h1 : ri === 1 ? "F0FDF4" : ri % 2 === 0 ? C.bg : C.card },
      fontFace: FONT, align: ci > 1 ? "center" : "left",
    },
  })));
  slide.addTable(trialTableData, { x: 0.50, y: 3.76, colW: tColW, rowH: 0.26, border: { type: "solid", color: C.bdr, pt: 0.4 }, fontFace: FONT });

  card(slide, 0.50, 4.96, W - 1, 0.38, true);
  slide.addText("Primary CTA: \"Start free — no credit card.\"  Premium CTA: \"Try the website builder free for 14 days.\"  The free plan is always available; the trial is the on-ramp to paid.", {
    x: 0.66, y: 5.02, w: W - 1.32, h: 0.28, fontSize: 9.5, bold: true, color: C.emrDk, fontFace: FONT, align: "center",
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 15 — EMAIL ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 15);
  header(slide, "Email Engine", "Seven behavioral sequences — from first contact to win-back. Platform: Brevo.");

  slide.addText(
    "The most cost-effective marketing happens inside the inbox. Every segment is triggered by behavior, not a calendar.",
    { x: 0.50, y: 0.92, w: W - 1, h: 0.24, fontSize: 10, color: C.muted, fontFace: FONT, italic: true }
  );

  const segments = [
    { seg: "1", trigger: "Website signup or ad landing page lead",  name: "New Lead Welcome Drip",
      emails: "3 emails in 7 days — platform intro, pilot church proof story, then free trial invite" },
    { seg: "2", trigger: "Email newsletter signup",           name: "Newsletter Subscribers",
      emails: "Monthly: Church Stewardship Insights — platform updates, success stories, stewardship tips" },
    { seg: "3", trigger: "Free plan account created",        name: "Free to $29 Upgrade Path",
      emails: "Day 7, 14, 30, 60 — feature ROI framing per email, leading with website builder and CRM" },
    { seg: "4", trigger: "Upgraded to $29 Growth plan",      name: "$29 to $49 Upgrade Path",
      emails: "Day 30, 45, 65 — broadcast messaging, advanced analytics, and unlimited missionaries" },
    { seg: "5", trigger: "Upgraded to $49 Pro plan",         name: "$49 to $89 Upgrade Path",
      emails: "Day 60, 75, 90 — payroll-to-giving ratio hook, then one-account payroll story" },
    { seg: "6", trigger: "Any 14-day trial started",         name: "Trial Nurture",
      emails: "Day 1, 3, 7, 13 — onboarding steps plus urgency. Day 15: 7-day extension offer if no conversion" },
    { seg: "7", trigger: "Subscription canceled",            name: "Churned User Win-Back",
      emails: "Day 30, 60, 90 — feature updates, changelog highlights, then a 30-day free return offer" },
  ];

  const sw = (W - 1.1) / 2;
  segments.forEach(({ seg, trigger, name, emails }, i) => {
    const col = i % 2 === 0 && i === 6 ? 0 : i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.50 + col * (sw + 0.10);
    const cy = 1.22 + row * 0.88;
    if (i === 6) {
      card(slide, 0.50, cy, W - 1, 0.76);
    } else {
      card(slide, cx, cy, sw, 0.76);
    }
    slide.addShape(EL, { x: cx + 0.14, y: cy + 0.30, w: 0.22, h: 0.22, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(seg, { x: cx + 0.14, y: cy + 0.30, w: 0.22, h: 0.22, fontSize: 8, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle" });
    slide.addText(name,    { x: cx + 0.44, y: cy + 0.06, w: (i === 6 ? W - 1.14 : sw) - 0.50, h: 0.24, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT });
    slide.addText("Trigger: " + trigger, { x: cx + 0.44, y: cy + 0.30, w: (i === 6 ? W - 1.14 : sw) - 0.50, h: 0.20, fontSize: 9, color: C.emr, fontFace: FONT });
    slide.addText(emails,  { x: cx + 0.44, y: cy + 0.50, w: (i === 6 ? W - 1.14 : sw) - 0.50, h: 0.22, fontSize: 9.5, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 16 — YOUTUBE INFLUENCER PROGRAM
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 16);
  header(slide, "YouTube Influencer Program", "Trusted creators convert at a dramatically higher rate than any paid ad.");

  slide.addText(
    "A 10-minute YouTube video from a trusted church admin creator outperforms a 30-second ad with zero ongoing cost after production. Launch Month 6 — only after 20-30 paying churches are active.",
    { x: 0.50, y: 0.92, w: W - 1, h: 0.30, fontSize: 10, color: C.muted, fontFace: FONT, italic: true }
  );

  // Two tracks
  card(slide, 0.50, 1.30, 4.60, 2.42);
  slide.addShape(RR, { x: 0.50, y: 1.30, w: 4.60, h: 0.04, fill: { color: C.emr }, line: { color: C.emr }, rectRadius: 0.02 });
  slide.addText("Track 1 — Free Plan Offer  (Month 6-9)", { x: 0.66, y: 1.40, w: 4.24, h: 0.28, fontSize: 12, bold: true, color: C.h1, fontFace: FONT });
  slide.addText("Budget: $0   Target: 5K-50K subscriber creators", { x: 0.66, y: 1.68, w: 4.24, h: 0.22, fontSize: 9.5, color: C.emr, fontFace: FONT, bold: true });
  [
    "Offer a permanently free Pro plan in exchange for an honest review video",
    "No scripted talking points — the platform earns the mention on its own merits",
    "Provides authentic content audiences trust far more than paid sponsorships",
    "Goal: 20-40 creators publish organic content before any paid budget is spent",
    "Start here. Build proof. Never pay before organic proof exists.",
  ].forEach((line, li) => {
    slide.addShape(EL, { x: 0.66, y: 1.98 + li * 0.32, w: 0.10, h: 0.10, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(line, { x: 0.82, y: 1.94 + li * 0.32, w: 4.10, h: 0.28, fontSize: 9.5, color: C.body, fontFace: FONT });
  });

  card(slide, 5.38, 1.30, 4.12, 2.42);
  slide.addShape(RR, { x: 5.38, y: 1.30, w: 4.12, h: 0.04, fill: { color: C.h1 }, line: { color: C.h1 }, rectRadius: 0.02 });
  slide.addText("Track 2 — Paid Sponsorship  (Month 10-18)", { x: 5.54, y: 1.40, w: 3.76, h: 0.28, fontSize: 12, bold: true, color: C.h1, fontFace: FONT });
  slide.addText("Budget: $12,000   Target: 50K-500K sub creators", { x: 5.54, y: 1.68, w: 3.76, h: 0.22, fontSize: 9.5, color: C.muted, fontFace: FONT, bold: true });
  [
    "Only approach after Track 1 videos are published as social proof",
    "Use organic videos as evidence when pitching larger creators",
    "Rate: $500 to $3,000 per dedicated video or pre-roll mention",
    "5 to 15 larger creators across Months 10 to 18",
    "Projected: 50-200 new leads/month at zero ongoing ad cost",
  ].forEach((line, li) => {
    slide.addShape(EL, { x: 5.54, y: 1.98 + li * 0.32, w: 0.10, h: 0.10, fill: { color: C.h1 }, line: { color: C.h1 } });
    slide.addText(line, { x: 5.70, y: 1.94 + li * 0.32, w: 3.56, h: 0.28, fontSize: 9.5, color: C.body, fontFace: FONT });
  });

  // Creator target + content angles
  card(slide, 0.50, 3.84, W - 1, 1.02);
  slide.addText("Target Creator Profile", { x: 0.66, y: 3.90, w: 3, h: 0.24, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT });
  slide.addText("Niche: church administration, faith-based financial stewardship, ministry leadership, Christian nonprofit management — NOT generic devotional or sermon channels.", {
    x: 0.66, y: 4.14, w: 4.0, h: 0.40, fontSize: 9.5, color: C.body, fontFace: FONT });
  slide.addText("Content Angles by Plan Tier", { x: 5.10, y: 3.90, w: 4, h: 0.24, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT });
  [
    ["Free plan",  "Free church website in 10 minutes"],
    ["$29/mo",     "How I manage all my church's giving in one place"],
    ["$49/mo",     "Church broadcasts, analytics, and AI — one tool"],
    ["$89/mo",     "Church payroll workflow — $89/mo (banking separate and free)"],
  ].forEach(([tier, hook], ti) => {
    slide.addText(`${tier}: `, { x: 5.10, y: 4.18 + ti * 0.20, w: 0.80, h: 0.18, fontSize: 9, bold: true, color: C.emrDk, fontFace: FONT });
    slide.addText(hook, { x: 5.90, y: 4.18 + ti * 0.20, w: 3.54, h: 0.18, fontSize: 9, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 17 — IN-APP RETENTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 17);
  header(slide, "Retention Engine", "Acquisition gets churches in. Retention compounds their value — and turns them into referrers.");

  // Left: In-app nudges
  card(slide, 0.50, 0.98, 4.60, 2.60);
  slide.addText("In-App Upgrade Nudges", { x: 0.66, y: 1.06, w: 4.24, h: 0.28, fontSize: 12, bold: true, color: C.h1, fontFace: FONT });
  slide.addText("Highest ROI marketing channel — zero additional ad spend.", { x: 0.66, y: 1.34, w: 4.24, h: 0.22, fontSize: 9.5, color: C.emr, fontFace: FONT, bold: true });
  rule(slide, 1.62, 0.66, 4.24);
  [
    { trigger: "Any locked feature",    nudge: "ROI-framing copy at every gate — a value proposition, not just a wall" },
    { trigger: "80% of usage limit",    nudge: "Usage-limit banner appears before frustration, not after hitting the cap" },
    { trigger: "3rd survey created",    nudge: "You are getting serious about member engagement — CRM upsell fires" },
    { trigger: "3rd staff member added",nudge: "Payroll tracking matters at 3 staff — $89 payroll upsell fires" },
    { trigger: "Trial Day 10",          nudge: "Your trial ends in 4 days — here is what you have built, do not lose it" },
    { trigger: "$500 in donations",     nudge: "Congratulations on $500 in giving — unlock analytics on Pro" },
  ].forEach(({ trigger, nudge }, ni) => {
    const y = 1.72 + ni * 0.30;
    slide.addText(trigger + ":", { x: 0.66, y, w: 1.66, h: 0.26, fontSize: 9, bold: true, color: C.emrDk, fontFace: FONT });
    slide.addText(nudge,         { x: 2.36, y, w: 2.64, h: 0.26, fontSize: 9.5, color: C.body, fontFace: FONT });
  });

  // Right: Financial lock-in stack
  card(slide, 5.38, 0.98, 4.12, 2.60);
  slide.addText("Financial Lock-In Stack", { x: 5.54, y: 1.06, w: 3.76, h: 0.28, fontSize: 12, bold: true, color: C.h1, fontFace: FONT });
  slide.addText("After Month 6-9, switching becomes extremely costly.", { x: 5.54, y: 1.34, w: 3.76, h: 0.22, fontSize: 9.5, color: C.emr, fontFace: FONT, bold: true });
  rule(slide, 1.62, 5.54, 3.76);
  [
    { feature: "Website + Custom Domain", lock: "Moving means rebuilding the church's entire public web presence" },
    { feature: "Payroll Processing",      lock: "Moving means reconfiguring payroll workflows, compliance setup, and staff processes" },
    { feature: "FDIC Banking Account",    lock: "Church operating funds live inside the platform — not easily extracted" },
    { feature: "Giving + Donor History",  lock: "All recurring donors and giving history are tied to the platform" },
    { feature: "Joint Shared Giving",     lock: "Moving breaks active revenue-split partnerships with other organizations" },
  ].forEach(({ feature, lock }, fi) => {
    const y = 1.72 + fi * 0.34;
    slide.addText(feature + ":", { x: 5.54, y, w: 1.80, h: 0.22, fontSize: 9, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(lock,           { x: 5.54, y: y + 0.18, w: 3.76, h: 0.18, fontSize: 9, color: C.muted, fontFace: FONT });
  });

  // Bottom summary
  card(slide, 0.50, 3.70, W - 1, 1.04, true);
  slide.addText("The Retention Math", { x: 0.66, y: 3.78, w: 3.5, h: 0.26, fontSize: 11, bold: true, color: C.h1, fontFace: FONT });
  [
    "Monthly churn target: under 5% in Phase 1, under 3% by Phase 3",
    "At 3% monthly churn and $55 ARPU, average church LTV is approximately $1,833 on $29 plan and $3,267 on $49 plan",
    "Every church that adopts website + payroll + banking is estimated to have very low churn — the switching cost is high relative to most alternatives we studied",
  ].forEach((t, ti) => {
    slide.addShape(EL, { x: 0.66, y: 4.08 + ti * 0.20, w: 0.10, h: 0.10, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(t, { x: 0.82, y: 4.04 + ti * 0.20, w: W - 1.46, h: 0.18, fontSize: 9.5, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 18 — CUSTOMER SUCCESS & LIFECYCLE MARKETING
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 18);
  header(slide, "Customer Success & Lifecycle Marketing", "Three internal tiers that convert free users to paid — without advertising.");

  slide.addText(
    "Once a church is inside the platform, three compounding layers move them from free to Basic, from Basic to Pro, and from Pro to All-In — through celebration, communication, and relationship.",
    { x: 0.50, y: 0.92, w: W - 1, h: 0.28, fontSize: 10, color: C.muted, fontFace: FONT, italic: true }
  );

  // Three tier cards
  const tiers = [
    {
      num: "1",
      title: "In-App Milestones & Celebrations",
      sub: "Zero cost — highest trust channel",
      color: C.emr,
      points: [
        "First donation processed: congratulatory message + soft unlock prompt for analytics",
        "First survey sent to members: celebrate + show CRM upgrade path",
        "Fifth staff member added: celebrate + surface payroll plan with one-tap upgrade",
        "Website published: celebrate + show custom domain unlock on next tier",
        "Giving reaches $500 milestone: highlight Pro analytics as the natural next step",
        "Message tone: genuine celebration first, upgrade second — never a hard wall",
      ],
    },
    {
      num: "2",
      title: "SMS + Email Outreach",
      sub: "Behavioral triggers — timed, personal, not spam",
      color: C.emrDk,
      points: [
        "Day 3 text: a quick welcome message with a link to the getting-started checklist",
        "Day 7 email: a summary of what the church built this week, with next-step suggestion",
        "Day 14 text: feature spotlight — one feature they have not used yet, with value context",
        "Day 30 email: monthly stewardship summary with ROI framing for the next plan tier",
        "Day 60 text: a two-tap upgrade offer — time-limited, framed as a milestone unlock",
        "Churn signal text: if usage drops 3+ days, a gentle check-in from the team",
      ],
    },
    {
      num: "3",
      title: "Customer Success Calls",
      sub: "Human relationship — converts free to paid through trust",
      color: "0F172A",
      points: [
        "Free plan users receive a personal call within their first 14 days from a team member",
        "Call goal: how is it going, what are you trying to accomplish, what is blocking you",
        "No script pressure — just genuine ministry-oriented curiosity and helpful guidance",
        "Identify one feature they have not discovered and walk them through it live on the call",
        "Natural upgrade conversation: if three or more use cases align with a paid tier, present it",
        "Target conversion: estimated 15 to 25% of free users to paid within 90 days via this channel",
      ],
    },
  ];

  const tw = (W - 1.1) / 3;
  tiers.forEach(({ num, title, sub, color, points }, i) => {
    const cx = 0.50 + i * (tw + 0.05);
    const cy = 1.28;
    card(slide, cx, cy, tw, 3.90);
    slide.addShape(RR, { x: cx, y: cy, w: tw, h: 0.04, fill: { color }, line: { color }, rectRadius: 0 });
    // Number badge
    slide.addShape(EL, { x: cx + 0.14, y: cy + 0.14, w: 0.36, h: 0.36, fill: { color }, line: { color } });
    slide.addText(num, { x: cx + 0.14, y: cy + 0.14, w: 0.36, h: 0.36, fontSize: 11, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle" });
    slide.addText(title, { x: cx + 0.58, y: cy + 0.14, w: tw - 0.72, h: 0.36, fontSize: 10.5, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(sub,   { x: cx + 0.14, y: cy + 0.56, w: tw - 0.28, h: 0.22, fontSize: 9, bold: true, color, fontFace: FONT });
    rule(slide, cy + 0.84, cx + 0.14, tw - 0.28);
    points.forEach((pt, pi) => {
      slide.addShape(EL, { x: cx + 0.14, y: cy + 0.98 + pi * 0.44, w: 0.08, h: 0.08, fill: { color: C.bdr }, line: { color: C.bdr } });
      slide.addText(pt, { x: cx + 0.28, y: cy + 0.93 + pi * 0.44, w: tw - 0.42, h: 0.40, fontSize: 9.5, color: C.body, fontFace: FONT });
    });
  });

  card(slide, 0.50, 5.26, W - 1, 0.24, true);
  slide.addText(
    "Three tiers × behavioral timing = compounding internal conversion. No additional ad spend required.",
    { x: 0.66, y: 5.30, w: W - 1.32, h: 0.16, fontSize: 9.5, bold: true, color: C.emrDk, fontFace: FONT, align: "center" }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 19 — PRODUCT ROADMAP
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 19);
  header(slide, "24-Month Roadmap", "Two apps. One ecosystem. One faith-based financial network.");

  const phases = [
    { label: "Months 1-6",  title: "Foundation",       orgs: "~50 orgs",  kpi: "Product-Market Fit", note: "Web platform live\nPilot churches\nAds testing at $1K/mo" },
    { label: "Months 7-12", title: "Paid Scale",        orgs: "~115 orgs", kpi: "~$19K MRR",          note: "$89 payroll activates ~M6\nMobile app launches ~M6-8\nBanking layer launches ~M12 (free)" },
    { label: "Months 13-18",title: "Exchange App",      orgs: "~165 orgs", kpi: "~$28K MRR",          note: "Social-first iOS + Android\nPost boosting revenue live\nBreak-even zone" },
    { label: "Months 19-24",title: "Banking App",       orgs: "~210 orgs", kpi: "Break-Even",         note: "Expand banking app depth\nDebit cards + P2P scale\nAdvisor engine (Phase 3+)" },
  ];

  // Timeline bar
  slide.addShape(LN, { x: 0.70, y: 2.24, w: W - 1.4, h: 0, line: { color: C.bdr, width: 1.5 } });

  phases.forEach(({ label, title, orgs, kpi, note }, i) => {
    const x = 0.50 + i * 2.35, dot = x + 1.05;
    slide.addShape(EL, { x: dot - 0.12, y: 2.12, w: 0.24, h: 0.24, fill: { color: C.emr }, line: { color: C.emr } });

    // Card above line
    card(slide, x, 0.98, 2.14, 1.14);
    slide.addText(label, { x, y: 1.04, w: 2.14, h: 0.22, fontSize: 9, color: C.emr, fontFace: FONT, align: "center", bold: true });
    slide.addText(title, { x, y: 1.26, w: 2.14, h: 0.32, fontSize: 12, bold: true, color: C.h1, fontFace: FONT, align: "center" });
    slide.addText(orgs,  { x, y: 1.58, w: 2.14, h: 0.22, fontSize: 9, color: C.muted, fontFace: FONT, align: "center" });

    // KPI below line
    card(slide, x, 2.50, 2.14, 0.66, i === 3);
    slide.addText(kpi, { x, y: 2.54, w: 2.14, h: 0.56, fontSize: 13, bold: true, color: i === 3 ? C.emr : C.h1, fontFace: FONT, align: "center", valign: "middle" });

    // Notes
    slide.addText(note, { x, y: 3.24, w: 2.14, h: 0.80, fontSize: 9, color: C.muted, fontFace: FONT, align: "center" });
  });

  card(slide, 0.50, 4.16, W - 1, 1.04);
  rule(slide, 4.16, 0.50, W - 1);
  slide.addText("Two Apps. One Ecosystem.", { x: 0.70, y: 4.22, w: W - 1.4, h: 0.26, fontSize: 12, bold: true, color: C.h1, fontFace: FONT, align: "center" });
  [
    { a: "The Exchange App  (Month 12-18)",     b: "Social feed, giving, AI notes, surveys, flock management, Joint Shared Giving — iOS and Android" },
    { a: "Exchange Banking App  (Month 12+ rollout)", b: "Free banking layer starts around Month 12, then expands to FDIC features, debit cards, and peer-to-peer transfers" },
  ].forEach(({ a, b }, i) => {
    slide.addText(a, { x: 0.60 + i * 4.8, y: 4.50, w: 4.6, h: 0.26, fontSize: 10, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(b, { x: 0.60 + i * 4.8, y: 4.76, w: 4.6, h: 0.28, fontSize: 9.5, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 20 — DEFENSIBILITY
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 20);
  header(slide, "Defensibility", "Five compounding moats. The Exchange becomes harder to displace every month.");

  const moats = [
    { n: "1", title: "Data Network Effect",
      body: "Every organization on the platform improves AI notes, giving benchmarks, and engagement insights for all others." },
    { n: "2", title: "Financial Lock-In",
      body: "Payroll + banking + Joint Shared Giving creates compounding switching costs. A church cannot easily separate payroll, bank, and giving." },
    { n: "3", title: "Community Network",
      body: "Joint Shared Giving, revenue splits, missionary coordination, and peer transfers create inter-organization dependencies that grow stronger over time." },
    { n: "4", title: "Theological Brand Identity",
      body: "The Great Exchange (2 Cor. 5:21) is deeply resonant theology that competitors cannot replicate. theexchangeapp.church is category-defining." },
    { n: "5", title: "Platform Stickiness",
      body: "Website, domain, payroll, banking, CRM, AI notes, forms, and giving history together form a complete operating system. Churning means rebuilding everything." },
  ];

  moats.forEach(({ n, title, body }, i) => {
    const col = i < 3 ? 0 : 1, row = i < 3 ? i : i - 3;
    const x = 0.50 + col * 4.88, y = 0.98 + row * 1.30, w = 4.62;
    card(slide, x, y, w, 1.16);
    slide.addShape(EL, { x: x + 0.16, y: y + 0.30, w: 0.54, h: 0.54, fill: { color: C.emr }, line: { color: C.emr } });
    slide.addText(n, { x: x + 0.16, y: y + 0.30, w: 0.54, h: 0.54, fontSize: 14, bold: true, color: C.white, fontFace: FONT, align: "center", valign: "middle" });
    slide.addText(title, { x: x + 0.88, y: y + 0.12, w: w - 1.08, h: 0.30, fontSize: 11.5, bold: true, color: C.h1, fontFace: FONT });
    slide.addText(body,  { x: x + 0.88, y: y + 0.48, w: w - 1.08, h: 0.60, fontSize: 10, color: C.body, fontFace: FONT });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 21 — THE TEAM
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  lightShell(slide, 21);
  header(slide, "The Team", "Three founders. Zero outside hires needed for Phase 1.");

  const team = [
    { name: "Christopher Figures", role: "Founder & CEO  ·  Chief Product Officer",
      bio:  "Founder and architect of The Exchange. Full-stack product vision, AI-assisted development lead, and primary brand voice. Drives platform roadmap and customer experience.",
      contact: "christopher@figuressolutions.com" },
    { name: "Shawn Fair",          role: "Co-Founder & CFO  ·  Business Strategist",
      bio:  "Founder of Fair Stewardship Group. Deep faith-based financial advisory relationships with church clients. Leads investor communications, sales, and financial strategy.",
      contact: "shawn@fairstewardshipgroup.com   586-248-1966" },
    { name: "Nathan VandenHoek",   role: "CTO  ·  Backend Dev & Security Lead",
      bio:  "Backend architecture, security infrastructure, and API integrations — Unit, Stripe, Check Payroll. Maintains production stack on AWS, Supabase, and Vercel.",
      contact: null },
  ];

  team.forEach(({ name, role, bio, contact }, i) => {
    const x = 0.50 + i * 3.17;
    card(slide, x, 1.10, 2.92, 3.90);
    slide.addShape(EL, { x: x + 1.06, y: 1.18, w: 0.80, h: 0.80, fill: { color: "F0FDF4" }, line: { color: C.emr, width: 1.2 } });
    drawMark(slide, x + 1.12, 1.26, 0.14, C.emr);
    slide.addText(name, { x, y: 2.10, w: 2.92, h: 0.32, fontSize: 12, bold: true, color: C.h1,  fontFace: FONT, align: "center" });
    slide.addText(role, { x, y: 2.42, w: 2.92, h: 0.24, fontSize: 9,  color: C.emr, fontFace: FONT, align: "center" });
    rule(slide, 2.72, x + 0.22, 2.48);
    slide.addText(bio,  { x: x + 0.14, y: 2.80, w: 2.64, h: 1.10, fontSize: 9.5, color: C.body, fontFace: FONT });
    if (contact) slide.addText(contact, { x, y: 3.96, w: 2.92, h: 0.24, fontSize: 9, color: C.emrDk, fontFace: FONT, align: "center" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 22 — THE ASK  (dark)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  darkShell(slide, 22);

  slide.addText("The Ask", { x: 0.50, y: 0.16, w: W - 1, h: 0.24, fontSize: 9, bold: true, color: C.emr, fontFace: FONT, charSpacing: 1.8 });
  slide.addText("We are seeking $150,000–$500,000 in seed investment.", { x: 0.50, y: 0.40, w: W - 1, h: 0.40, fontSize: 20, bold: true, color: C.white, fontFace: FONT });
  darkRule(slide, 0.86);

  slide.addText("Smaller check, same conviction. Investment scales with the round size. All financial details discussed privately.", {
    x: 0.50, y: 0.94, w: W - 1, h: 0.26, fontSize: 11, color: C.emr, fontFace: FONT, italic: true,
  });

  // ── What the investment enables ──
  const enables = [
    {
      n: "01",
      title: "Launch & Prove",
      body: "Bring the platform to its first paying organizations. Run controlled ad tests starting at $1,000/month on Facebook. Validate that the market wants this before scaling spend.",
    },
    {
      n: "02",
      title: "Build the Network",
      body: "Develop the mobile social app (6-8 months). Activate payroll around Month 6. Launch the free banking layer around Month 12. Every new feature deepens lock-in.",
    },
    {
      n: "03",
      title: "Reach Break-Even",
      body: "A disciplined, stewardship-first plan that targets self-sustaining revenue by Year 2 — without needing a second round to survive.",
    },
  ];

  enables.forEach(({ n, title, body }, i) => {
    const x = 0.50 + i * 3.17;
    darkCard(slide, x, 1.30, 2.92, 2.50);
    slide.addText(n,     { x, y: 1.38, w: 2.92, h: 0.30, fontSize: 10, bold: true, color: C.emr, fontFace: FONT, align: "center", charSpacing: 2 });
    slide.addText(title, { x, y: 1.68, w: 2.92, h: 0.34, fontSize: 13, bold: true, color: C.white, fontFace: FONT, align: "center" });
    slide.addShape(LN, { x: x + 0.60, y: 2.06, w: 1.72, h: 0, line: { color: C.darkBd, width: 0.5 } });
    slide.addText(body,  { x: x + 0.20, y: 2.14, w: 2.52, h: 0.58, fontSize: 9.5, color: "9CA3AF", fontFace: FONT, align: "center" });
  });

  // ── Contact line ──
  darkCard(slide, 0.50, 3.92, W - 1, 0.88);
  slide.addText("Ready to talk?", { x: 0.70, y: 4.00, w: W - 1.4, h: 0.28, fontSize: 12, bold: true, color: C.white, fontFace: FONT, align: "center" });
  slide.addText("Shawn Fair  ·  (616) 228-5159  ·  theexchangeapp.church", {
    x: 0.70, y: 4.30, w: W - 1.4, h: 0.26, fontSize: 11, color: C.emr, fontFace: FONT, align: "center",
  });
  slide.addText("Full financials, projections, and investment terms available in private conversation.", {
    x: 0.70, y: 4.56, w: W - 1.4, h: 0.20, fontSize: 9, color: "6B7280", fontFace: FONT, align: "center", italic: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 23 — CLOSING  (dark)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  darkShell(slide, null);

  addWordmark(slide, (W - 0.32 * 4.5 * 4.5) / 2 - 0.3, 0.26, 0.32, true);

  slide.addText("Building the Digital Network for the\nGlobal Church & Faith-Based Economy", {
    x: 1.0, y: 1.26, w: W - 2, h: 0.82, fontSize: 20, bold: true, color: C.white, fontFace: FONT, align: "center",
  });

  slide.addShape(LN, { x: 2.0, y: 2.16, w: W - 4, h: 0, line: { color: C.emr, width: 1.5 } });

  slide.addText(
    "God made him who had no sin to be sin for us,\nso that in him we might become the righteousness of God.",
    { x: 1.0, y: 2.28, w: W - 2, h: 0.64, fontSize: 12, color: "9CA3AF", fontFace: FONT, align: "center", italic: true }
  );
  slide.addText("2 Corinthians 5:21", { x: 1.0, y: 2.94, w: W - 2, h: 0.26, fontSize: 11, color: C.emr, fontFace: FONT, align: "center" });

  const contacts = [
    { label: "Founder",    value: "Christopher Figures",    sub: "christopher@figuressolutions.com" },
    { label: "Co-Founder", value: "Shawn Fair",             sub: "shawn@fairstewardshipgroup.com"   },
    { label: "Phone",      value: "586-248-1966",           sub: "Shawn Fair — Direct"              },
    { label: "Platform",   value: "theexchangeapp.church",   sub: "Live product — try it today"      },
  ];
  contacts.forEach(({ label, value, sub }, i) => {
    const x = 0.58 + i * 2.22;
    darkCard(slide, x, 3.32, 2.04, 0.92);
    slide.addShape(LN, { x, y: 3.32, w: 2.04, h: 0, line: { color: C.emr, width: 1.0 } });
    slide.addText(label.toUpperCase(), { x, y: 3.36, w: 2.04, h: 0.22, fontSize: 8.5, color: C.emr, fontFace: FONT, align: "center", bold: true, charSpacing: 1 });
    slide.addText(value, { x, y: 3.58, w: 2.04, h: 0.28, fontSize: 11, bold: true, color: C.white, fontFace: FONT, align: "center" });
    slide.addText(sub,   { x, y: 3.86, w: 2.04, h: 0.24, fontSize: 9,  color: C.muted, fontFace: FONT, align: "center" });
  });

  slide.addText("This is not a startup burning through capital. This is a ministry stewarding capital.", {
    x: 0.5, y: 4.40, w: W - 1, h: 0.28, fontSize: 11.5, bold: true, color: C.emr, fontFace: FONT, align: "center",
  });

  rect(slide, 0, H - 0.42, W, 0.42, C.emr);
  slide.addText("$150K–$500K SEED ROUND   ·   24-Month Stewardship Plan   ·   Year 2 Break-Even Target   ·   theexchangeapp.church", {
    x: 0, y: H - 0.42, w: W, h: 0.42, fontSize: 10, bold: true, color: C.dark, fontFace: FONT, align: "center", valign: "middle",
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: OUTPUT }).then(() => {
  console.log("✅  Pitch deck generated (v12 — 23 slides, high-level finance, $150K–$500K ask):");
  console.log("    " + OUTPUT);
  console.log("");
  console.log("📌  Design: White backgrounds · one accent (emerald) · no color clutter");
  console.log("📌  23 slides  ·  Slide 6: Social Network  ·  Finance high-level (Slide 9)  ·  Marketing slides 11-18  ·  All fonts ≥ 9pt");
});
