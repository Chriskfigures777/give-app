/**
 * The Exchange App — Marketing Plan DOCX Generator
 * Produces "The Exchange App - Marketing Plan.docx"
 *
 * Run: node scripts/generate-marketing-plan-docx.mjs
 * Requires: npm install docx (already in package.json)
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  TableLayoutType,
  convertInchesToTwip,
} from "docx";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "../The Exchange App - Marketing Plan.docx");

// ─── Palette ─────────────────────────────────────────────────────────────────
const GREEN      = "059669";
const DARK_GREEN = "047857";
const GOLD       = "D97706";
const BLUE       = "1D4ED8";
const GRAY       = "6B7280";
const BODY_COLOR = "1f2937";
const WHITE      = "FFFFFF";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, font: "Calibri", color: DARK_GREEN })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 560, after: 220 },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, font: "Calibri", color: GREEN })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 160 },
    border: { bottom: { color: "D1FAE5", size: 6, space: 4, style: BorderStyle.SINGLE } },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, font: "Calibri", color: DARK_GREEN })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 100 },
  });
}

function h4(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, font: "Calibri", color: GOLD })],
    spacing: { before: 200, after: 80 },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", color: BODY_COLOR, ...opts })],
    spacing: { before: 80, after: 80 },
  });
}

function italic(text) {
  return body(text, { italics: true, color: GRAY });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", color: BODY_COLOR })],
    bullet: { level },
    spacing: { before: 60, after: 60 },
  });
}

function subbullet(text) {
  return bullet(text, 1);
}

function quote(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", italics: true, color: GREEN, bold: true })],
    indent: { left: convertInchesToTwip(0.4) },
    spacing: { before: 160, after: 160 },
    border: { left: { color: "10b981", size: 24, space: 8, style: BorderStyle.SINGLE } },
  });
}

function divider() {
  return new Paragraph({
    text: "",
    border: { bottom: { color: "D1FAE5", size: 6, space: 4, style: BorderStyle.SINGLE } },
    spacing: { before: 240, after: 240 },
  });
}

function spacer() {
  return new Paragraph({ text: "", spacing: { before: 100, after: 100 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── Table helpers ────────────────────────────────────────────────────────────

// Page is 8.5" wide with 1.25" left + 1.0" right margins = 6.25" content = 9000 twips
// (1 inch = 1440 twips)
const CONTENT_WIDTH = 9000;

function tableCell(text, isHeader = false, widthTwips = null, bgColor = null) {
  const fill = bgColor
    ? { type: ShadingType.CLEAR, color: bgColor, fill: bgColor }
    : isHeader
    ? { type: ShadingType.CLEAR, color: DARK_GREEN, fill: DARK_GREEN }
    : undefined;

  const textColor = isHeader ? WHITE : BODY_COLOR;
  const bold = isHeader;

  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text), size: 20, font: "Calibri", color: textColor, bold })],
        spacing: { before: 80, after: 80 },
        alignment: AlignmentType.LEFT,
      }),
    ],
    shading: fill,
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    // DXA = twentieths-of-a-point (twips); explicit per-cell width locks the column
    width: widthTwips ? { size: widthTwips, type: WidthType.DXA } : undefined,
  });
}

function dataTable(headers, rows, colWidths = null) {
  // Convert percentage weights → absolute DXA twip values.
  // Word's FIXED layout requires BOTH columnWidths on the Table (which writes
  // the <w:tblGrid> element) AND matching cell widths; without tblGrid the
  // renderer ignores per-cell widths and collapses every column.
  const twipWidths = colWidths
    ? colWidths.map((pct) => Math.round((pct / 100) * CONTENT_WIDTH))
    : null;

  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      tableCell(h, true, twipWidths ? twipWidths[i] : null)
    ),
    tableHeader: true,
  });

  const dataRows = rows.map((row, rowIdx) => {
    const bg = rowIdx % 2 === 0 ? "F9FAFB" : WHITE;
    return new TableRow({
      children: row.map((cell, i) =>
        tableCell(String(cell ?? ""), false, twipWidths ? twipWidths[i] : null, bg)
      ),
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    // Table-level width in DXA ensures the table spans the full content area
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    // columnWidths writes <w:tblGrid> — required for FIXED layout to work
    ...(twipWidths ? { columnWidths: twipWidths } : {}),
    layout: TableLayoutType.FIXED,
    margins: { top: 120, bottom: 120 },
  });
}

// ─── Cover Page ──────────────────────────────────────────────────────────────

function buildCoverPage() {
  return [
    spacer(), spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: "THE EXCHANGE APP", bold: true, size: 52, font: "Calibri", color: DARK_GREEN })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Full Marketing Plan", size: 36, font: "Calibri", color: GREEN })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Digital Infrastructure for the Global Church Economy", size: 24, font: "Calibri", color: GRAY, italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
    }),
    divider(),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: "Survey → Pioneer Onboarding → Proven Ads → Scale → YouTube Program → Mobile App", size: 22, font: "Calibri", color: BODY_COLOR })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
    }),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: "Prepared for: Investors & Founding Team  |  The Exchange App LLC", size: 20, font: "Calibri", color: GRAY })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Version 1.0  |  2026", size: 20, font: "Calibri", color: GRAY })],
      alignment: AlignmentType.CENTER,
    }),
    spacer(), spacer(),
    divider(),
    spacer(),
    quote('"The Great Exchange — Christ took our sin and gave us His righteousness. We build a platform where the Body of Christ exchanges resources, generosity, service, and support."'),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: "2 Corinthians 5:21", size: 20, font: "Calibri", color: GRAY, italics: true })],
      alignment: AlignmentType.CENTER,
    }),
    pageBreak(),
  ];
}

// ─── Executive Summary ────────────────────────────────────────────────────────

function buildExecutiveSummary() {
  return [
    h1("Executive Summary"),
    body("The Exchange App is a faith-based SaaS platform built for churches, ministries, and Christian nonprofits. This marketing plan covers the full acquisition and retention strategy from pre-launch surveys through mobile app release, organized into six phases across 24 months."),
    spacer(),
    quote("Core marketing principle: Earn trust before spending money. Survey → pilot onboarding → proven ad tests → scale → influencer program → mobile app."),
    spacer(),
    h3("Platform Plans at Launch"),
    dataTable(
      ["Plan", "Price", "Trial Period"],
      [
        ["Free Forever", "$0/mo", "None"],
        ["Basic (Growth)", "$29/mo", "14 days"],
        ["Pro", "$49/mo", "14 days"],
        ["All-In (Payroll Analytics)", "$89/mo", "14 days"],
      ],
      [40, 30, 30]
    ),
    spacer(),
    h3("18-Month Marketing Budget Summary"),
    dataTable(
      ["Line Item", "Budget", "Notes"],
      [
        ["Facebook + YouTube Ads", "~$203,000", "Conservative test-first ramp ($1K → $20K/mo)"],
        ["YouTube Influencer Program", "$12,000", "Months 10–18, paid sponsorships only after organic proof"],
        ["Ministry Conferences (3)", "$15,000", "Phase 2–3 in-person events"],
        ["Brevo Email Platform", "~$2,000", "$25–$150/mo over 18 months"],
        ["Mobile App Development", "~$12,000", "AI-assisted build (Cursor + Claude) — no full dev team required"],
        ["App Launch Marketing (ASO)", "$3,000–$5,000", "One-time from capital reserve"],
        ["Clarity / Heatmap Tools", "$0", "Free tier"],
        ["Fillout.com Surveys", "$0", "Free tier"],
        ["TOTAL MARKETING", "~$247,000", "Over 18 months"],
      ],
      [35, 20, 45]
    ),
    pageBreak(),
  ];
}

// ─── Phase 0 ──────────────────────────────────────────────────────────────────

function buildPhase0() {
  return [
    h1("Phase 0 — Survey & Foot Traffic (Month 0–1)"),
    quote("Goal: Collect 50–100 church/nonprofit contacts and their pain points before spending a dollar on ads."),
    spacer(),
    h3("Approach"),
    body("Direct in-person outreach to churches, nonprofits, ministry events, and faith-based conferences. Every conversation ends with a QR code or text link to a Fillout.com survey."),
    spacer(),
    h3("Survey Tool: Fillout.com"),
    body("Use Fillout.com (free tier) for all survey collection. Advantages:"),
    bullet("Multi-step conditional logic — show payroll questions only if church has staff"),
    bullet("Branded form design that matches The Exchange visual identity"),
    bullet("Email capture built into every form submission"),
    bullet("Free tier supports unlimited responses — no cost in Phase 0"),
    spacer(),
    h4("Survey Questions"),
    bullet("What tools does your church currently use for donations? (multi-select)"),
    bullet("Does your church have a website? If yes, which platform?"),
    bullet("How many paid staff does your church employ?"),
    bullet("What is your biggest administrative pain point? (open-ended)"),
    bullet("Would a free 14-day trial of an all-in-one church platform interest you?"),
    bullet("Your name and email address (for follow-up)"),
    spacer(),
    h3("Foot Traffic Tactics"),
    bullet("Visit 3–5 local churches in person weekly; ask to speak with pastor or administrator"),
    bullet("Attend local faith-based networking events, nonprofit meetups, ministry conferences"),
    bullet("Carry a one-page 'what is The Exchange?' flyer with QR code to Fillout survey"),
    bullet("Bring a tablet/laptop to do a live 5-minute demo of the website builder and donation form"),
    spacer(),
    h3("Outcome Targets"),
    bullet("50–100 survey responses → loaded into Brevo as 'survey respondent' segment"),
    bullet("3-email welcome sequence sent to all respondents automatically via Brevo"),
    bullet("Identify 1–3 churches willing to be pilot users for Phase 1"),
    spacer(),
    body("Cost: $0 (Fillout free tier, founder time only)", { bold: true }),
    pageBreak(),
  ];
}

// ─── Phase 1 ──────────────────────────────────────────────────────────────────

function buildPhase1() {
  return [
    h1("Phase 1 — Pioneer Onboarding & Use Case Creation (Month 1–2)"),
    quote("Goal: Get 1–3 churches live on the platform and build the social proof assets needed before any paid ad spend scales above $1,000/mo."),
    spacer(),
    h3("Pilot Church Program"),
    body("Offer a comped Free or Growth plan (no cost to pilot church for first 2–3 months) with hands-on guided onboarding:"),
    bullet("Build their church website using the Exchange website builder"),
    bullet("Set up donation forms and giving page with live Stripe Connect integration"),
    bullet("Create a CRM list of congregation members"),
    bullet("Run a sample survey to their congregation via the platform"),
    bullet("Set up goal planning, event management, and giving campaigns"),
    bullet("Weekly check-in call during onboarding — Shawn and Christopher"),
    spacer(),
    h3("Required Deliverables Before Scaling Ads"),
    body("These assets must be complete and in hand before ad spend grows above $1,000/mo. Real proof beats any copywriter."),
    spacer(),
    dataTable(
      ["Deliverable", "Format", "Used In"],
      [
        ["Church Success Story", "1-page PDF", "Facebook/YouTube ads, sales calls, landing page"],
        ["Testimonial Video", "60-second on-camera", "Video ad creative, YouTube, website"],
        ["Screenshot Gallery", "5–10 screenshots", "Ad creative, landing page, email sequences"],
        ["Landing Page Quote", "Name, church, outcome", "Above-the-fold social proof on landing page"],
      ],
      [30, 25, 45]
    ),
    pageBreak(),
  ];
}

// ─── Phase 2 ──────────────────────────────────────────────────────────────────

function buildPhase2() {
  return [
    h1("Phase 2 — Ad Testing: $1,000/mo Test Budget (Month 2–4)"),
    quote("Goal: Find one proven ad set (creative + audience + copy) before scaling spend. Never scale an unproven ad."),
    spacer(),
    h3("The Test-First Principle"),
    body("Start at $1,000/mo total split across Facebook and YouTube. Running $5,000/mo into an unproven ad wastes capital. Spend $1,000/mo to find what works, then pour fuel on the winning set."),
    spacer(),
    h3("A/B Test Variables (Run Sequentially — One Variable at a Time)"),
    spacer(),
    h4("Test 1 — Hook Copy"),
    bullet("Version A: 'Get your church website free for 14 days'"),
    bullet("Version B: 'The all-in-one platform your church has been missing'"),
    bullet("Version C: 'Run your church's giving, website, and payroll from one place — $29/mo'"),
    spacer(),
    h4("Test 2 — Creative Format"),
    bullet("Version A: 60-second testimonial video (pilot church pastor speaking to camera)"),
    bullet("Version B: 90-second product demo (screen recording of website builder in action)"),
    bullet("Version C: Static image with data point ('380,000 US churches. Most use 5+ disconnected tools.')"),
    spacer(),
    h4("Test 3 — Facebook Audience Targeting"),
    bullet("Audience A: Pastors, church administrators, ministry leaders (job title targeting)"),
    bullet("Audience B: Nonprofit directors, faith-based business owners"),
    bullet("Audience C: Retargeting — anyone who visited the landing page but did not start trial"),
    spacer(),
    h4("Test 4 — CTA / Landing Page"),
    bullet("CTA A: 'Start Free 14-Day Trial' (no credit card required)"),
    bullet("CTA B: 'Watch a 2-Minute Demo'"),
    bullet("CTA C: 'Get Your Church Website Free'"),
    spacer(),
    h3("Graduation Criteria — Before Scaling Past $3,000/mo"),
    body("Do NOT increase budget past $3,000/mo until ALL of these are true for at least one ad set:"),
    bullet("Cost Per Lead (CPL) < $80"),
    bullet("Trial start rate from landing page > 30%"),
    bullet("Trial-to-paid rate > 25%"),
    bullet("Data collected across minimum 2 winning variations"),
    spacer(),
    h3("Analytics During Test Phase"),
    bullet("Facebook Ads Manager — CPL, CTR, conversion rate per creative set"),
    bullet("Microsoft Clarity (free) — heat maps and session recordings on landing page"),
    bullet("Easy Heatmap — click tracking on specific CTA areas"),
    bullet("Supabase — trial start events, plan activations, feature adoption in trial"),
    pageBreak(),
  ];
}

// ─── Phase 3 ──────────────────────────────────────────────────────────────────

function buildPhase3() {
  return [
    h1("Phase 3 — Paid Acquisition Scale (Month 4–12)"),
    quote("Goal: Scale only proven ad sets. Reach 150–200 paying churches by Month 12."),
    spacer(),
    h3("Budget Ramp — Conservative Test-First"),
    dataTable(
      ["Period", "Monthly Ad Budget", "Cumulative", "Notes"],
      [
        ["Month 1–2", "$1,000", "$2,000", "Test phase — A/B only"],
        ["Month 3–4", "$3,000", "$8,000", "Scale 1–2 proven ad sets"],
        ["Month 5–6", "$6,000", "$20,000", "Add retargeting layer"],
        ["Month 7–9", "$10,000", "$50,000", "Full Facebook + YouTube mix"],
        ["Month 10–12", "$15,000", "$95,000", "Advisor referral compounds"],
        ["Month 13–18", "$18,000–$20,000", "~$203,000", "Phase 3 full scale"],
      ],
      [20, 22, 20, 38]
    ),
    spacer(),
    h3("Primary Channels"),
    h4("Facebook / Instagram — 65% of Ad Spend"),
    bullet("Targeting: pastors, church administrators, ministry leaders, nonprofit directors"),
    bullet("Format: testimonial video (top of funnel) → retargeting with feature highlight → trial offer"),
    bullet("Retargeting pool: landing page visitors who did not convert within 7 days"),
    spacer(),
    h4("YouTube Pre-Roll — 35% of Ad Spend"),
    bullet("Target channels: Christian ministry, church leadership, nonprofit management content viewers"),
    bullet("15-second non-skippable + 30-second skippable versions of testimonial video"),
    bullet("Companion banner ads alongside ministry-related YouTube content"),
    spacer(),
    h3("Funnel Flow"),
    bullet("Ad (Facebook or YouTube)"),
    subbullet("→ Landing page: 'Free 14-Day Trial — No Credit Card'"),
    subbullet("→ Trial account created"),
    subbullet("→ Onboarding email sequence (Day 1, 3, 7, 13)"),
    subbullet("→ Paid subscription conversion"),
    subbullet("→ Plan upgrade drip (Free → $29 → $49 → $89)"),
    spacer(),
    h3("Lead & Conversion Targets"),
    dataTable(
      ["Phase", "Monthly Ad Spend", "Leads/Mo", "CPL Target", "Trial-to-Paid", "New Churches/Mo", "CAC"],
      [
        ["M1–2 (test)", "$1,000", "15–20", "<$70", ">25%", "4–5", "<$300"],
        ["M3–4", "$3,000", "40", "<$80", ">30%", "12", "<$300"],
        ["M5–6", "$6,000", "80", "<$80", ">33%", "25", "<$300"],
        ["M7–9", "$10,000", "120", "<$85", ">30%", "35", "<$350"],
        ["M10–12", "$15,000", "175", "<$90", ">28%", "40", "<$450"],
        ["M13–18", "$18,000–$20,000", "220–240", "<$90", ">30%", "50–60", "<$500"],
      ],
      [15, 18, 13, 13, 13, 14, 14]
    ),
    pageBreak(),
  ];
}

// ─── Email Marketing ──────────────────────────────────────────────────────────

function buildEmailMarketing() {
  return [
    h1("Email Marketing Strategy"),
    h3("Platform: Brevo (Recommended Over Mailchimp)"),
    body("Brevo offers lower cost at early-stage volumes, built-in transactional email API, and superior behavior-triggered automation flows."),
    spacer(),
    dataTable(
      ["Tier", "Monthly Cost", "Email Volume", "Contact Count"],
      [
        ["Starter", "$25/mo", "Up to 20K emails/mo", "Up to 9K contacts"],
        ["Business", "$65/mo", "Up to 60K emails/mo", "Up to 25K contacts"],
        ["Scale", "$150/mo", "Up to 120K emails/mo", "Up to 50K contacts"],
      ],
      [25, 25, 25, 25]
    ),
    spacer(),
    h3("Email Sequences by Segment"),
    spacer(),
    h4("Segment 1 — Survey Respondents (Not Yet Signed Up)"),
    body("Trigger: Fillout.com survey submission → auto-loaded into Brevo"),
    bullet("Email 1 (Immediate): 'Thanks for talking with us — here's what The Exchange is building'"),
    bullet("Email 2 (Day 3): 'See a real church that's already using it' — pilot church story + photos"),
    bullet("Email 3 (Day 7): 'Your free account is waiting — 14-day trial, no credit card'"),
    spacer(),
    h4("Segment 2 — Newsletter Subscribers (No Account)"),
    body("Trigger: Footer email signup form on website → POST /api/newsletter/subscribe → Brevo"),
    bullet("Email 1 (Immediate): 'Welcome to Church Stewardship Insights'"),
    bullet("Monthly: newsletter — platform updates, church financial tips, success stories"),
    spacer(),
    h4("Segment 3 — Free Plan Users → $29 Upgrade"),
    body("Trigger: Account creation on Free plan"),
    bullet("Day 7: 'You've been on The Exchange for a week — here's what you're missing on Growth'"),
    bullet("Day 14: 'Unlock your church's own website domain for $29/mo' — feature highlight"),
    bullet("Day 30: 'One month in — your church could have a custom website + 7 giving splits' — ROI framing"),
    bullet("Day 60: Final nudge — limited-time offer or testimonial from a $29 church"),
    spacer(),
    h4("Segment 4 — Growth ($29) → Pro ($49) Upgrade"),
    body("Trigger: Upgrade to Growth plan"),
    bullet("Day 30: 'Your Growth plan is running — here's what Pro unlocks' — CMS, analytics, missionaries"),
    bullet("Day 45: 'See how churches with Pro use broadcast messaging to re-engage their congregation'"),
    bullet("Day 65: 'Advanced analytics: see exactly which campaigns bring in the most giving'"),
    spacer(),
    h4("Segment 5 — Pro ($49) → Payroll Analytics ($89) Upgrade"),
    body("Trigger: Upgrade to Pro, OR approaching 3-employee limit in CRM"),
    bullet("Day 60: 'Your church has staff — do you know your giving-to-payroll ratio?'"),
    bullet("Day 75: 'Church payroll + banking + giving — one $89/mo plan'"),
    bullet("Day 90: 'What happens when payroll is tied to your church bank account'"),
    spacer(),
    h4("Segment 6 — Trial Users (Any Plan)"),
    body("Trigger: 14-day trial start on any paid plan"),
    bullet("Day 1: 'Your trial is live — here are your first 3 things to do'"),
    bullet("Day 3: 'Feature spotlight: build your church website in under 30 minutes'"),
    bullet("Day 7: 'Halfway through your trial — have you set up your giving page yet?'"),
    bullet("Day 13: 'Your trial ends tomorrow — lock in your plan'"),
    bullet("Day 15 (no conversion): 'Your trial ended — here's a 7-day extension if you need it'"),
    spacer(),
    h4("Segment 7 — Churned Users (Win-Back)"),
    body("Trigger: Subscription canceled"),
    bullet("Day 30: 'We've added new features since you left' — changelog highlights"),
    bullet("Day 60: 'Here's what's new at The Exchange' — major update or new plan feature"),
    bullet("Day 90: 'Come back for free — 30 days on us' — win-back offer for high-value churned users"),
    pageBreak(),
  ];
}

// ─── In-App UX ────────────────────────────────────────────────────────────────

function buildInAppMarketing() {
  return [
    h1("In-App UX Marketing — Upgrade Nudges"),
    body("The most cost-effective marketing happens inside the product. These nudges convert existing users to higher plans without any ad spend."),
    spacer(),
    h3("Paywall Gate Copy"),
    body("Each locked feature shows ROI-framing copy before the upgrade prompt:"),
    bullet("Website builder gate: 'Your church deserves a website that works as hard as you do. Unlock custom domain + website builder for $29/mo.'"),
    bullet("Broadcast gate: 'Reach your entire congregation in one message. Unlock SMS + email broadcast on Growth.'"),
    bullet("Payroll gate: 'Run payroll for your staff from the same account that receives your giving. $89/mo, 3 employees included.'"),
    spacer(),
    h3("Usage Limit Banners (Show at 80% of Limit, Not 100%)"),
    bullet("'You've used 2 of 2 split recipients — upgrade to Growth for up to 7 splits'"),
    bullet("'You've sent to 3 missionaries this month — Pro gives you unlimited'"),
    bullet("'3 active surveys used — upgrade to manage unlimited campaigns'"),
    spacer(),
    h3("Contextual In-App Trigger Nudges"),
    dataTable(
      ["User Action", "Nudge Message"],
      [
        ["Creates 3rd survey", "You're getting serious about member engagement — Growth plan gives you unlimited surveys + full CRM"],
        ["Adds 3rd staff member", "With 3 staff, payroll tracking matters. $89/mo runs payroll inside the same account your giving flows into."],
        ["Processes $500 in donations", "Congratulations on your first $500 in giving. Unlock advanced donation analytics on Pro."],
        ["Trial Day 10", "4 days left — here's a summary of what you've built. Don't lose it."],
        ["Exports a goal PDF", "Your goals are saved. Pro users get advanced reporting and giving-to-goal tracking."],
      ],
      [35, 65]
    ),
    spacer(),
    h3("Heat Mapping Integration"),
    bullet("Microsoft Clarity (free) — installed on landing page and app dashboard, reviewed weekly"),
    subbullet("Where users click before leaving the platform"),
    subbullet("Which features get hovered but not clicked — intent signals for upgrade nudge placement"),
    subbullet("Session recordings of churned users' last visits — identify friction points"),
    bullet("Easy Heatmap — supplemental on specific high-value pages: pricing, trial signup, website builder"),
    pageBreak(),
  ];
}

// ─── YouTube Program ─────────────────────────────────────────────────────────

function buildYouTubeProgram() {
  return [
    h1("YouTube Influencer Program (Month 6–18)"),
    quote("Only activate after 20–30 churches are actively using Exchange-built websites. Real examples are required — not promises."),
    spacer(),
    h3("Why YouTube"),
    body("The Exchange's target customer — church administrators and ministry leaders — responds to trusted, educational content. A 10-minute YouTube video from a trusted creator explaining 'how I manage my church's finances' converts at a dramatically higher rate than a 30-second ad, with zero ongoing cost after initial setup."),
    spacer(),
    h3("Target Creator Profile"),
    bullet("Platform: YouTube primary, podcast secondary"),
    bullet("Niche: church administration, faith-based financial stewardship, ministry leadership, nonprofit management, Christian entrepreneurship"),
    bullet("Subscriber range: 5,000–500,000 (mid-tier converts better than mega-influencers for B2B SaaS)"),
    bullet("Audience behavior: tactical and detail-oriented — people who take notes, save videos, click description links"),
    bullet("NOT: generic Christian lifestyle, devotional, or Sunday sermon channels"),
    spacer(),
    h3("Two-Track Outreach Strategy"),
    spacer(),
    h4("Track 1 — Generous Free Plan (No Payment)"),
    body("For creators with 5K–50K subscribers or highly aligned audiences:"),
    bullet("Offer a permanently free Pro or Payroll Analytics plan in exchange for an honest review video or dedicated mention"),
    bullet("No scripted talking points required — the platform earns the mention"),
    bullet("Authentic content audiences trust more than paid sponsorships"),
    bullet("Goal: 20–30 honest organic reviews before spending the paid budget"),
    spacer(),
    h4("Track 2 — Paid Sponsorship (After Organic Proof)"),
    body("For creators with 50K–500K subscribers:"),
    bullet("Only approach after Track 1 videos are published — use them as evidence in pitches"),
    bullet("Sponsorship rate: $500–$3,000 per dedicated video or pre-roll mention"),
    bullet("Total paid sponsorship budget: $12,000 (Months 10–18)"),
    spacer(),
    h3("Scale Target Timeline"),
    dataTable(
      ["Month", "Action", "Target"],
      [
        ["Month 6", "Identify 100 top Christian YouTubers in target niches", "100 creator list compiled"],
        ["Month 7–9", "Outreach to all 100 with Track 1 free plan offer", "30–40 creators accept"],
        ["Month 9–12", "Track 1 creators publish organic content", "20–30 videos live"],
        ["Month 10–18", "Paid Track 2 sponsorships with larger creators", "5–15 paid sponsors"],
      ],
      [18, 52, 30]
    ),
    spacer(),
    body("Projected outcome: 50–200 new leads/month passively from YouTube, zero incremental ad spend after initial outreach.", { bold: true }),
    spacer(),
    h3("Content Angles by Plan Tier"),
    dataTable(
      ["Tier", "Video Hook", "Target Audience"],
      [
        ["Free", "'Free church website in 10 minutes — no coding'", "Churches without a website (massive TAM)"],
        ["$29 Growth", "'How I manage all my church's giving in one place'", "Small to mid-size church admins"],
        ["$49 Pro", "'Church broadcast messaging, CMS, and analytics — one tool'", "Growing churches with multiple ministries"],
        ["$89 All-In", "'Church payroll + banking + giving — one $89/mo platform'", "Churches with paid staff, serious operators"],
      ],
      [15, 45, 40]
    ),
    pageBreak(),
  ];
}

// ─── Retention ────────────────────────────────────────────────────────────────

function buildRetention() {
  return [
    h1("Retention Strategy"),
    body("Acquisition gets churches in. Retention keeps them — and turns them into referrers. The Exchange is designed to become irreplaceable within 6–9 months of active use."),
    spacer(),
    h3("Goal Planning & PDF Export"),
    body("Churches and individual donors build financial goals, track progress month-over-month, and export printable PDF plans. This creates a habit loop: goals are set in The Exchange → tracked in The Exchange → plans printed from The Exchange. Moving to another platform means losing years of goal history."),
    spacer(),
    h3("Flock Tracking"),
    body("After each sermon or ministry event, churches send notes and surveys directly to their congregation. The platform shows engagement data — who opened, who responded, who hasn't been active in 30 days. This creates a member engagement record that becomes irreplaceable operational data. Churches use this weekly, not just when they remember to pay."),
    spacer(),
    h3("Financial Lock-In Stack"),
    dataTable(
      ["Feature", "Lock-In Mechanism"],
      [
        ["Website builder + custom domain", "Moving means rebuilding the church's entire public web presence from scratch"],
        ["Payroll processing", "Moving means simultaneously switching payroll provider AND church bank account"],
        ["Unit Banking FDIC account", "Church operating funds live inside the platform — cannot easily move"],
        ["Giving processing + donor relationships", "All recurring donors and giving history tied to the platform"],
      ],
      [35, 65]
    ),
    body("These four features stacked together create extremely high switching costs after Month 6–9 of active use.", { bold: true }),
    spacer(),
    h3("Community Feed & Peer Network"),
    body("Churches connect, share resources, support missionaries, and coordinate giving across organizations. As the network grows, it becomes more valuable — churches stay because other churches they know are here. This is the network effect moat."),
    spacer(),
    h3("Peer-to-Peer Transfers (Year 2)"),
    body("Once the mobile app and banking features launch (~Month 18–24), donors can send money directly to each other and to any church in the network. This makes The Exchange part of everyday financial life, not just Sunday morning operations."),
    spacer(),
    h3("Post Boosting Revenue (Year 2)"),
    body("~5% of active churches pay $5–$25/mo to boost events or posts to a wider audience within The Exchange network. A passive upsell that emerges naturally once the social layer has network density."),
    pageBreak(),
  ];
}

// ─── Mobile App ───────────────────────────────────────────────────────────────

function buildMobileApp() {
  return [
    h1("Mobile App Strategy — Year 1+ Release"),
    quote("Social features first. Banking features in a separate, later release. The network must exist before it can be monetized."),
    spacer(),
    h3("Phase A — Social App Launch (~Month 12–15)"),
    body("The mobile app launches with the community and social layer first:"),
    bullet("Community feed — posts, events, ministry updates from connected churches"),
    bullet("Peer networking and direct messaging between members and churches"),
    bullet("Event discovery and RSVP — powered by existing Eventbrite integration"),
    bullet("Giving campaigns — donate to a church or campaign directly from the app"),
    bullet("Goal tracking and progress dashboard for individual donors"),
    spacer(),
    body("Launch timing: after web platform has 150–200 active paying church accounts. Social features require network density to be useful — launch too early and the feed is empty."),
    spacer(),
    h4("App Store Marketing (ASO)"),
    body("Target keywords for App Store Optimization:"),
    bullet("'church giving app', 'faith community', 'church management', 'Christian giving', 'ministry platform'"),
    bullet("Feature real Exchange church websites and live campaigns in screenshots"),
    bullet("Request reviews after first successful donation processed through app"),
    bullet("App launch marketing budget: $3,000–$5,000 (one-time from capital reserve)"),
    spacer(),
    h3("Phase B — Banking App Launch (~Month 18–24)"),
    body("Unit Banking, debit card, and peer-to-peer transfer features come as a distinct second release:"),
    bullet("Unit Banking FDIC account management from mobile"),
    bullet("Church staff debit card controls and real-time spending visibility"),
    bullet("Peer-to-peer transfers within the Exchange network"),
    bullet("Bill pay and ACH transfer management"),
    spacer(),
    body("Requirement before launch: $15,000 security audit (budgeted in capital reserve) + Unit Banking mobile SDK integration."),
    spacer(),
    quote("Marketing hook: 'Your church bank account in your pocket.' No competitor in the faith-based space can say this."),
    spacer(),
    h3("AI-Accelerated Development"),
    body("The Exchange is built using AI-assisted development tools (Cursor + Claude) which eliminate the need for a large traditional dev team. The founding team ships features at a pace that previously required 5–10 engineers — keeping total mobile app development cost around $12,000 vs. the $49,000+ a conventional team would require. This is a structural cost advantage no competitor can easily replicate."),
    bullet("No full-time engineering salaries required to ship mobile features"),
    bullet("AI tooling compresses weeks of development into days"),
    bullet("Founding team retains full control of the codebase and release schedule"),
    bullet("Savings flow directly into marketing budget and runway extension"),
    pageBreak(),
  ];
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

function buildKPIs() {
  return [
    h1("KPIs & Performance Dashboard"),
    h3("Key Performance Indicators by Phase"),
    dataTable(
      ["Metric", "Phase 1 (M6)", "Phase 2 (M12)", "Phase 3 (M18)"],
      [
        ["Paying Churches", "65", "200", "450"],
        ["Monthly Recurring Revenue", "~$16,000", "~$37,600", "~$84,600"],
        ["Cost Per Lead", "<$80", "<$85", "<$90"],
        ["Customer Acquisition Cost", "<$300", "<$500", "<$750"],
        ["Trial-to-Paid Rate", ">33%", ">30%", ">30%"],
        ["Monthly Churn", "<5%", "<4%", "<3%"],
        ["LTV:CAC Ratio", ">7×", ">6×", ">5.5×"],
        ["Email Open Rate (avg)", ">35%", ">30%", ">28%"],
        ["YouTuber Partners (cumulative)", "0", "30–40", "80–100"],
        ["ARR Run Rate", ">$192K", ">$300K ✅", ">$700K"],
      ],
      [40, 20, 20, 20]
    ),
    spacer(),
    h3("Analytics Tools Stack"),
    dataTable(
      ["Tool", "Purpose", "Cost"],
      [
        ["Microsoft Clarity", "Heat maps, session recordings, click tracking on landing and dashboard", "Free"],
        ["Easy Heatmap", "Supplemental click/scroll tracking on key funnel pages", "Free / low cost"],
        ["Brevo Analytics", "Email open/click rates, A/B subject line testing, segment performance", "$25–$150/mo"],
        ["Supabase", "In-product usage tracking, upgrade events, feature adoption by plan", "In stack"],
        ["Facebook Ads Manager", "Ad CPL, CTR, ROAS, conversion rate per creative and audience", "In ad spend"],
        ["Fillout.com", "Survey response tracking and lead capture from foot traffic", "Free"],
      ],
      [25, 55, 20]
    ),
    spacer(),
    h3("Weekly Review Cadence"),
    body("Every Monday — review these reports before any ad budget decisions:"),
    bullet("Paid ad performance: CPL, CTR, conversion rate per creative"),
    bullet("Landing page: bounce rate, time on page (Clarity heat maps)"),
    bullet("Trial funnel: trial start rate, features used in trial, trial-to-paid conversion"),
    bullet("Email performance: open rate, click rate, unsubscribe rate per segment"),
    bullet("App usage: plan upgrade events, feature adoption by plan, churn alerts"),
    pageBreak(),
  ];
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function buildTimeline() {
  return [
    h1("18-Month Execution Timeline"),
    dataTable(
      ["Month", "Phase", "Key Marketing Actions"],
      [
        ["0–1", "Survey & Foot Traffic", "Fillout surveys, in-person church outreach, Brevo list seeding from survey emails"],
        ["1–2", "Pioneer Onboarding", "Onboard 1–3 pilot churches, collect testimonial video, build success story PDF"],
        ["2–4", "Ad Testing", "$1K/mo, A/B test 4 variables, prove 1 winning ad set before scaling"],
        ["4–6", "Scale Proven Ads", "$3K–$6K/mo, add retargeting, all Brevo email sequences live"],
        ["5–6", "Break-Even Prep", "65 churches, in-app nudges active, advisor referral outreach begins"],
        ["7–9", "Full Ad Scale", "$10K/mo, YouTube pre-roll, advisor network 100 referrers active"],
        ["9–10", "Break-Even", "~150 churches, $300K ARR — ad spend now funded by revenue"],
        ["6–9", "YouTube Outreach", "Identify 100 creators, send Track 1 free plan offers to all"],
        ["9–12", "YouTube Organic", "First 20–30 Track 1 creator videos publish, organic leads begin"],
        ["10–18", "Paid Sponsorships", "$12K sponsorship budget, 5–15 larger creators paid"],
        ["11–12", "Year 1 Close", "200 churches, marketing manager hired, mobile app in development"],
        ["12–15", "Mobile App Launch", "Social features release, ASO launch, app store marketing"],
        ["13–18", "Banking Ads", "Banking becomes #1 ad differentiator — 'no competitor offers this'"],
        ["18–24", "Banking App", "Unit Banking mobile features, debit card, P2P transfers release"],
      ],
      [12, 22, 66]
    ),
    pageBreak(),
  ];
}

// ─── Competitive Positioning ──────────────────────────────────────────────────

function buildCompetitive() {
  return [
    h1("Competitive Positioning"),
    quote("Primary message: No competitor offers giving + website + payroll + banking in one platform at $89/mo."),
    spacer(),
    dataTable(
      ["Competitor", "Their Strength", "Our Answer"],
      [
        ["Subsplash", "Mobile app, media streaming", "We have embedded banking + payroll — they don't"],
        ["Pushpay", "Enterprise giving at scale", "We're $89/mo vs. their thousands per month"],
        ["Tithe.ly", "Simple giving + ChMS", "We have website builder + banking + payroll"],
        ["Breeze", "ChMS / member management", "We have an embedded FDIC bank account and payroll"],
      ],
      [20, 35, 45]
    ),
    spacer(),
    h3("Brand Anchoring"),
    body("The Great Exchange — a theologically resonant name and concept that competitors cannot replicate. The platform is named in honor of the Gospel transaction described in 2 Corinthians 5:21."),
    spacer(),
    quote('"Built on the theology of the Great Exchange. Everything we have, He gave. Everything He asks, we steward."'),
    spacer(),
    divider(),
    spacer(),
    quote("By Month 10–12, at 165–200 paying churches and $300,000 in Annual Recurring Revenue, the platform generates enough monthly income to cover ALL operating costs. The $500K investment is not consumed — it is converted into a self-sustaining revenue engine. This is not a startup burning through capital. This is a ministry stewarding capital."),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: "2 Corinthians 5:21 — \"God made him who had no sin to be sin for us, so that in him we might become the righteousness of God.\"", size: 20, font: "Calibri", italics: true, color: GRAY })],
      alignment: AlignmentType.CENTER,
    }),
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const doc = new Document({
    creator: "The Exchange App",
    title: "The Exchange App — Full Marketing Plan",
    description: "Comprehensive marketing plan covering survey through mobile app launch",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: BODY_COLOR },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
            },
          },
        },
        children: [
          ...buildCoverPage(),
          ...buildExecutiveSummary(),
          ...buildPhase0(),
          ...buildPhase1(),
          ...buildPhase2(),
          ...buildPhase3(),
          ...buildEmailMarketing(),
          ...buildInAppMarketing(),
          ...buildYouTubeProgram(),
          ...buildRetention(),
          ...buildMobileApp(),
          ...buildKPIs(),
          ...buildTimeline(),
          ...buildCompetitive(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(OUTPUT_PATH, buffer);
  console.log(`✅  Saved: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("❌  Error generating marketing plan DOCX:", err);
  process.exit(1);
});
