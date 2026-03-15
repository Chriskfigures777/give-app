// ─── The Exchange App — Executive Summary Generator ──────────────────────────
// Run with:  node scripts/generate-executive-summary.mjs

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, convertInchesToTwip, TableLayoutType, UnderlineType,
} from "docx";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "../The Exchange App - Executive Summary.docx");

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY   = "0F172A";
const GOLD   = "B45309";
const DARK   = "1E293B";
const SLATE  = "64748B";
const GREEN  = "065F46";
const WHITE  = "FFFFFF";
const OFFWHT = "F8FAFC";
const FONT   = "Calibri";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function para(runs, opts = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
    alignment: opts.align ?? AlignmentType.LEFT,
    ...opts,
  });
}

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size ?? 22, ...opts });
}

function h1(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT, size: 28, bold: true, color: NAVY,
        characterSpacing: 40,
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 440, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 6 },
    },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: DARK })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 80 },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: GOLD })],
    spacing: { before: 200, after: 60 },
  });
}

function body(text, opts = {}) {
  return para(run(text, { size: 22, color: "1F2937", ...opts }), { before: 60, after: 60 });
}

function italic(text) {
  return para(run(text, { size: 22, color: SLATE, italics: true }), { before: 60, after: 60 });
}

function boldBody(text) {
  return body(text, { bold: true });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [run(text, { size: 21, color: "1F2937" })],
    bullet: { level },
    spacing: { before: 40, after: 40 },
    indent: { left: convertInchesToTwip(0.25 + level * 0.25) },
  });
}

function spacer(pts = 120) {
  return new Paragraph({ text: "", spacing: { before: pts, after: 0 } });
}

function divider() {
  return new Paragraph({
    text: "",
    spacing: { before: 160, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1", space: 4 },
    },
  });
}

function goldCallout(text) {
  return new Paragraph({
    children: [run(text, { size: 23, bold: true, color: NAVY })],
    spacing: { before: 120, after: 120 },
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: "FEF3C7" },
    indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
    border: {
      left: { style: BorderStyle.THICK, size: 16, color: GOLD, space: 8 },
    },
  });
}

function navyCallout(text) {
  return new Paragraph({
    children: [run(text, { size: 21, color: WHITE, italics: true })],
    spacing: { before: 120, after: 120 },
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: NAVY },
    indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
  });
}

// ─── Table helpers ────────────────────────────────────────────────────────────

function cell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, size: opts.size ?? 20, bold: opts.bold ?? false, color: opts.color ?? "1F2937" })],
      alignment: opts.align ?? AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
    })],
    shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
    width: opts.w ? { size: opts.w, type: WidthType.DXA } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

function headerRow(cols) {
  return new TableRow({
    children: cols.map((c) =>
      cell(c, { bold: true, bg: NAVY, color: WHITE, size: 20 })
    ),
    tableHeader: true,
  });
}

function dataRow(cols, evenBg = "F1F5F9") {
  return new TableRow({
    children: cols.map((c, i) =>
      cell(c, { bg: evenBg, size: 19, bold: i === 0 })
    ),
  });
}

function altRow(cols) {
  return dataRow(cols, WHITE);
}

function simpleTable(headers, rows, widths) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow(headers),
      ...rows.map((r, i) => (i % 2 === 0 ? dataRow(r) : altRow(r))),
    ],
    columnWidths: widths,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: "Normal",
        name: "Normal",
        run: { font: FONT, size: 22, color: "1F2937" },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(0.9),
            bottom: convertInchesToTwip(0.9),
            left:   convertInchesToTwip(1.0),
            right:  convertInchesToTwip(1.0),
          },
        },
      },
      children: [

        // ─── COVER ──────────────────────────────────────────────────────────

        new Paragraph({
          children: [new TextRun({
            text: "THE EXCHANGE",
            font: FONT, size: 56, bold: true, color: NAVY, characterSpacing: 80,
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 80 },
        }),

        new Paragraph({
          children: [new TextRun({
            text: "Executive Summary",
            font: FONT, size: 30, color: GOLD, italics: true,
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
        }),

        new Paragraph({
          children: [new TextRun({
            text: "Digital Infrastructure for the Global Church Economy",
            font: FONT, size: 24, color: SLATE,
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 320 },
        }),

        new Paragraph({
          children: [new TextRun({
            text: '"The Great Exchange — Christ took our sin and gave us His righteousness. We build a platform where the Body of Christ exchanges resources, generosity, service, and support."',
            font: FONT, size: 20, color: SLATE, italics: true,
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          shading: { type: ShadingType.SOLID, color: "F8FAFC" },
          indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
        }),

        new Paragraph({
          children: [new TextRun({ text: "2 Corinthians 5:21", font: FONT, size: 18, color: GOLD, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 480 },
        }),

        // Seed round summary bar
        simpleTable(
          ["SEED ROUND", "STEWARDSHIP HORIZON", "BREAK-EVEN", "3-YR REVENUE TARGET"],
          [["$500,000", "18–24 Months", "Month 9–10", "$4.38 Million"]],
          [2268, 2268, 2268, 2268]
        ),

        spacer(400),

        new Paragraph({
          children: [new TextRun({ text: "Shawn Fair — Co-Founder & CFO / Fair Stewardship Group", font: FONT, size: 20, bold: true, color: NAVY })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "shawn@fairstewardshipgroup.com  •  586-248-1966  •  theexchangeapp.church", font: FONT, size: 20, color: SLATE })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
        }),

        // Page break to content
        new Paragraph({ children: [new PageBreak()] }),

        // ─── 1. COMPANY OVERVIEW ────────────────────────────────────────────

        h1("1. Company Overview"),

        body(
          "The Exchange is a comprehensive faith-based financial and community platform purpose-built for churches, " +
          "ministries, Christian nonprofits, and individual believers. It combines donation management, embedded banking, " +
          "payroll processing, CRM, surveys, notes, goal tracking, peer networking, website publishing, and marketplace " +
          "capabilities into a single mission-aligned ecosystem."
        ),

        spacer(80),

        goldCallout(
          "The Exchange is not a concept — it is a fully functioning, production-ready platform " +
          "already serving organizations with real financial flows, member engagement tools, and operational infrastructure."
        ),

        spacer(80),

        body(
          "The name is theologically grounded. In Christian theology, the Great Exchange refers to the Gospel transaction: " +
          "Christ took our sin and gave us His righteousness (2 Corinthians 5:21). The platform is named in honor of this " +
          "principle — a network where the Body of Christ exchanges resources, generosity, service, and support."
        ),

        spacer(120),

        simpleTable(
          ["Category", "Detail"],
          [
            ["Entity",           "The Exchange App LLC"],
            ["Platform Status",  "Production-ready, fully deployed"],
            ["Primary Market",   "US Churches & Faith-Based Organizations"],
            ["Seed Round",       "$500,000"],
            ["Break-Even",       "Month 9–10 (165 paying churches)"],
            ["3-Year Revenue",   "$4.38 Million cumulative"],
            ["Banking Partner",  "Unit Banking (FDIC-insured)"],
            ["Payments Partner", "Stripe + Stripe Connect"],
            ["Payroll Partner",  "Check Payroll API"],
          ],
          [3600, 5400]
        ),

        divider(),

        // ─── 2. THE PROBLEM ─────────────────────────────────────────────────

        h1("2. The Problem"),

        body(
          "The global church ecosystem is one of the largest coordinated trust networks in human history — yet it is " +
          "digitally fragmented. Despite $130 billion in annual US church giving and over 380,000 US churches, most " +
          "organizations operate with disconnected, single-purpose tools. There is no interoperability between congregations, " +
          "no coordinated resource-sharing infrastructure, and no unified financial stack for the faith economy."
        ),

        spacer(80),

        simpleTable(
          ["Market Metric", "Scale"],
          [
            ["Global Christians",       "~2.3 Billion"],
            ["Churches Worldwide",      "5–7 Million"],
            ["US Churches",             "380,000+"],
            ["US Annual Church Giving", "$130 Billion"],
            ["Global Christian Giving", "$700 Billion+"],
            ["Avg Tools Per Church",    "5+ disconnected platforms"],
          ],
          [4500, 4500]
        ),

        spacer(120),

        body(
          "The result: Massive generosity exists — but it is not coordinated. No platform connects churches to each other, " +
          "provides embedded banking, processes payroll, and manages giving under one roof at an accessible price point."
        ),

        spacer(80),

        h3("The Timing Shift"),
        body("Three conditions recently changed, making this platform possible today:"),
        bullet("Digital giving adoption — churches now widely accept digital payments post-COVID"),
        bullet("API-based fintech infrastructure — Unit and Stripe enable purpose-built financial tools for niche markets"),
        bullet("Network-based platforms — community-driven ecosystems have become the dominant software model"),

        divider(),

        // ─── 3. THE SOLUTION ────────────────────────────────────────────────

        h1("3. The Solution"),

        body(
          "The Exchange provides an integrated platform that connects churches, believers, and ministries into a shared " +
          "digital economy. The platform covers every dimension of church operations:"
        ),

        spacer(80),

        simpleTable(
          ["Module", "Description"],
          [
            ["💰  Giving & Donations",   "Online giving with 1% transaction fee; split recipients, campaigns, analytics"],
            ["🏦  Embedded Banking",      "Unit Banking FDIC-insured accounts; debit cards, bill pay, ACH transfers"],
            ["💼  Payroll Processing",    "Check Payroll API integration; full payroll for 3 staff included in All-In plan"],
            ["🌐  Website Builder",       "GrapesJS-powered drag-and-drop builder; custom domain publishing"],
            ["📊  CRM & Member Mgmt",     "Church member database, communication history, engagement tracking"],
            ["📣  Broadcasts",            "SMS + email campaigns to entire congregation from one dashboard"],
            ["🤝  Advisor Network",       "Directory of faith-based financial advisors; missionary disbursement"],
            ["🧠  AI Credits",            "Platform-wide AI assistance for church admin, content, and communications"],
            ["🎯  Goals & Notes",         "Financial goal tracking, sermon notes, flock engagement analytics"],
          ],
          [2600, 6400]
        ),

        divider(),

        // ─── 4. PRICING & REVENUE MODEL ─────────────────────────────────────

        h1("4. Pricing & Revenue Model"),

        body("Four plans designed to capture churches at every stage of growth:"),

        spacer(80),

        simpleTable(
          ["Plan", "Price", "Key Features"],
          [
            ["Basic",        "$29/mo",  "Giving (1% fee), CRM, surveys, 50 AI credits"],
            ["Pro",          "$49/mo",  "Everything in Basic + website builder, banking, broadcasts, 200 AI credits"],
            ["All-In ⭐",    "$89/mo",  "Everything in Pro + payroll (3 staff), debit cards, bill pay, ACH — MOST STICKY"],
            ["Advisor",      "$150/mo", "Multi-org dashboard, public advisor directory, 500 AI credits"],
          ],
          [1800, 1440, 5760]
        ),

        spacer(120),

        h3("Revenue Streams"),
        bullet("Monthly subscription fees ($29 / $49 / $89 / $150)"),
        bullet("1% transaction fee on all donations processed"),
        bullet("$12/employee/month for payroll employees beyond the 3 included"),
        bullet("AI credit top-up purchases"),
        bullet("Website hosting fees"),
        bullet("Banking interchange (~1.2% per debit card swipe) — Year 2"),

        spacer(120),

        goldCallout(
          "Why the $89 All-In plan is the stickiest product: Once a church runs payroll tied to their embedded " +
          "Unit Banking account, the switching cost becomes extraordinarily high. They cannot easily move their " +
          "payroll AND bank AND giving platform simultaneously. This creates a deeply embedded, recurring revenue " +
          "stream with near-zero churn."
        ),

        divider(),

        // ─── 5. FINANCIAL PROJECTIONS ───────────────────────────────────────

        h1("5. Financial Projections"),

        simpleTable(
          ["Metric", "Year 1", "Year 2", "Year 3", "3-Year Total"],
          [
            ["Paying Churches",   "200",        "450",          "900",          "—"],
            ["Total Revenue",     "$344,253",   "$1,279,610",   "$2,754,035",   "$4,377,898"],
            ["Total Costs",       "$318,272",   "$426,000",     "$613,000",     "$1,357,272"],
            ["Net Income",        "$25,981",    "$853,610",     "$2,141,035",   "$3,020,626"],
            ["Net Margin",        "7.5%",       "66.7%",        "77.7%",        "—"],
          ],
          [2200, 1575, 1575, 1575, 2075]
        ),

        spacer(120),

        h3("Year 1 Monthly Ramp Highlights"),
        bullet("Month 5: First profitable month ($480 net income)"),
        bullet("Month 6: 90 churches / $28K revenue / $6,760 net"),
        bullet("Month 10: $300K ARR achieved — investment draw-down stops ✅"),
        bullet("Month 12: 200 paying churches / $62,800/month revenue"),

        spacer(120),

        h3("The $300K ARR Milestone (Month 10–11)"),
        body(
          "At $300K ARR (~165 churches), the platform generates enough monthly income to cover ALL operating costs " +
          "(founder salaries + tech stack + legal + advertising). The $500K seed investment is no longer being drawn down " +
          "for survival. The remaining capital (~$200K+) transitions from survival capital to growth capital — entirely " +
          "from a position of financial strength."
        ),

        divider(),

        // ─── 6. UNIT ECONOMICS ──────────────────────────────────────────────

        h1("6. Unit Economics"),

        simpleTable(
          ["Phase", "CAC", "3-Year LTV", "LTV:CAC Ratio"],
          [
            ["Phase 1 (Months 1–6)",    "$333–$500", "$3,500", "7–10.5×"],
            ["Phase 2 (Months 7–12)",   "$750",      "$4,500", "6×"],
            ["Phase 3 (Months 13–18)",  "$1,000",    "$5,500", "5.5×"],
            ["Year 2 Steady State",      "$500",      "$5,500", "11×"],
          ],
          [2700, 2700, 2700, 900]
        ),

        spacer(120),

        goldCallout("A LTV:CAC ratio above 3× is considered healthy for SaaS. The Exchange targets 5–11× across all phases."),

        spacer(80),

        h3("Capital Recovery Math"),
        bullet("$200K in ads ÷ $600 avg CAC = 333 churches acquired from marketing spend alone"),
        bullet("Average 3-year LTV per church: $4,500"),
        bullet("Total 3-year LTV from $200K in ads: $1.5 million — 7.5× return on marketing spend"),
        bullet("CAC break-even (LTV payback period): ~5–7 months per church"),

        divider(),

        // ─── 7. COMPETITIVE ADVANTAGE ───────────────────────────────────────

        h1("7. Competitive Advantage"),

        simpleTable(
          ["Feature", "The Exchange", "Subsplash", "Pushpay", "Tithe.ly", "Breeze"],
          [
            ["Giving Platform",       "✅ (1%)", "✅",       "✅",       "✅",       "✅"],
            ["Embedded FDIC Banking", "✅",       "❌",       "❌",       "❌",       "❌"],
            ["Payroll Processing",    "✅ $89",   "❌",       "❌",       "❌",       "❌"],
            ["Website Builder",       "✅",       "✅",       "❌",       "❌",       "❌"],
            ["AI Credits",            "✅",       "❌",       "❌",       "❌",       "❌"],
            ["All-in-One Pricing",    "✅ $89",   "❌",       "❌",       "❌",       "❌"],
            ["Entry Price",           "$29/mo",   "~$99+",   "~$200+",  "$39/mo",  "$72/mo"],
          ],
          [2268, 1620, 1400, 1400, 1220, 1092]
        ),

        spacer(80),

        body("No competitor offers embedded banking + payroll + giving in a single $89/month plan."),

        divider(),

        // ─── 8. FIVE MOATS ──────────────────────────────────────────────────

        h1("8. Defensibility — Five Compounding Moats"),

        bullet("Data Network Effect — Every church adds data that improves AI features and giving benchmarks for all churches"),
        bullet("Financial Lock-In — Payroll + banking integration creates switching costs that compound monthly"),
        bullet("Community Network — Churches that connect, share missionaries, and give to each other cannot easily leave"),
        bullet('Theological Brand — "The Great Exchange" (2 Cor. 5:21) is deeply resonant theology competitors cannot replicate'),
        bullet("Platform Stickiness — Website + payroll + banking + CRM + giving history = a full church operating system"),

        divider(),

        // ─── 9. GO-TO-MARKET ────────────────────────────────────────────────

        h1("9. Go-To-Market Strategy"),

        h3("Phase 0–1: Survey & Pilot (Month 0–2)  —  $0 Cost"),
        body("In-person church outreach + Fillout.com surveys. Onboard 1–3 pilot churches for free. Capture testimonial video and success story PDF before scaling any ads."),

        h3("Phase 2: Ad Testing (Month 2–4)  —  $1K/month"),
        body("A/B test hook copy, creative format, audience targeting, and landing page CTA. Do not scale past $3K/mo until CPL <$80 and trial-to-paid rate >25%."),

        h3("Phase 3: Paid Scale (Month 4–12)  —  $3K → $15K/month"),
        body("Facebook (65%) + YouTube (35%) proven ad sets scaled progressively. Retargeting layer. YouTube influencer program at 20+ churches (organic first, paid later)."),

        h3("Phase 4: Advisor Network (Month 8–18)  —  $0 CAC"),
        body("100 faith-based financial advisors recruited. Each refers 5 churches on average = 500 zero-cost leads. Blended CAC drops from ~$500 to ~$180 as advisor channel matures."),

        divider(),

        // ─── 10. $500K SEED INVESTMENT ──────────────────────────────────────

        h1("10. The $500,000 Seed Investment"),

        body("The $500K seed round funds 18 months of operations with a conservative ramp. This is not a burn rate — it is a stewardship fund."),

        spacer(80),

        simpleTable(
          ["Category", "Amount", "% of Seed"],
          [
            ["Facebook + YouTube Ads (18-mo ramp)", "$200,000", "40.0%"],
            ["Founder Salaries (3 × $3K × 18 mo)",  "$162,000", "32.4%"],
            ["Product Development (one-time)",        "$49,000",  "9.8%"],
            ["Tech Stack + Misc Buffer",              "$44,000",  "8.8%"],
            ["Legal + Compliance (18 mo)",            "$18,000",  "3.6%"],
            ["Ministry Conferences (3 events)",       "$15,000",  "3.0%"],
            ["Podcast Sponsorships",                  "$12,000",  "2.4%"],
            ["TOTAL",                                 "$500,000", "100%"],
          ],
          [4500, 2250, 2250]
        ),

        spacer(120),

        h3("Investment Timeline"),
        bullet("Months 1–6: $21,500/mo draw-down → $129K cumulative"),
        bullet("Months 7–12: $26,500/mo draw-down → $288K cumulative"),
        bullet("Month 10–11: $300K ARR reached → draw-down stops"),
        bullet("Months 13–18: remaining capital deployed for banking launch + conferences"),
        bullet("Estimated seed remaining after Month 18: $29K–$167K (depending on revenue offset)"),

        spacer(80),

        navyCallout(
          '"By the time The Exchange reaches $300,000 in Annual Recurring Revenue — approximately Month 10–11 ' +
          'at 165 paying churches — the platform\'s monthly income fully covers all operating expenses. ' +
          'The $500K investment is not consumed; it is converted into a self-sustaining revenue engine."'
        ),

        divider(),

        // ─── 11. THE TEAM ────────────────────────────────────────────────────

        h1("11. The Team"),

        simpleTable(
          ["Founder", "Role", "Focus", "Salary (Seed Phase)"],
          [
            ["Christopher Figures", "Founder & CEO / Chief Product Officer",    "55% Product / 20% Marketing",     "$3,000/mo"],
            ["Shawn Fair",          "Co-Founder & CFO / Business Strategist",  "70% Sales & BD / 15% Onboarding", "$3,000/mo"],
            ["Nathan VandenHoek",   "CTO / Backend Dev & Security Lead",       "45% Dev / 35% Ops & Infra",       "$3,000/mo"],
          ],
          [1800, 2700, 2700, 1800]
        ),

        spacer(120),

        body("All three founders are paid equally and intentionally below-market during the seed phase to maximize capital deployed toward growth."),

        spacer(60),

        h3("Salary Escalation Milestones"),
        bullet("$3,000/mo per founder during seed phase (current)"),
        bullet("$4,500/mo per founder at $300K ARR (Month 10–11)"),
        bullet("$6,000/mo per founder at $750K ARR"),
        bullet("Market-rate compensation from operating income at $1.5M ARR"),

        divider(),

        // ─── 12. HIRING ROADMAP ──────────────────────────────────────────────

        h1("12. Hiring Roadmap (Revenue-Funded, Not Seed-Funded)"),

        simpleTable(
          ["Trigger", "Role", "Monthly Cost", "Funded By"],
          [
            ["100–150 churches",   "Onboarding Specialist",      "$4,000",     "Revenue"],
            ["200–300 churches",   "Marketing Manager / Agency", "$5,000–$8,000", "Revenue"],
            ["300–500 churches",   "Customer Success Rep",       "$4,000",     "Revenue"],
            ["Phase 3 launch",     "Security Audit (one-time)",  "$15,000",    "Reserve buffer"],
            ["500+ churches",      "Additional Backend Developer","$7,000",    "Revenue"],
          ],
          [2268, 2268, 2268, 2196]
        ),

        divider(),

        // ─── 13. KEY METRICS DASHBOARD ───────────────────────────────────────

        h1("13. Key Metrics Dashboard"),

        simpleTable(
          ["Metric", "Phase 1 (M6)", "Phase 2 (M12)", "Phase 3 (M18)"],
          [
            ["Paying Churches",         "90",        "200",       "450"],
            ["Monthly Recurring Rev",   "$16,921",   "$37,600",   "$84,601"],
            ["Annual Run Rate",         "$203K",     "$300K ✅",  "$700K+"],
            ["Cost Per Lead (CPL)",     "<$80",      "<$85",      "<$90"],
            ["Customer Acq. Cost",      "<$500",     "<$800",     "<$1,000"],
            ["Trial-to-Paid Rate",      ">33%",      ">30%",      ">35%"],
            ["Monthly Churn",           "<5%",       "<4%",       "<3%"],
            ["LTV:CAC Ratio",           ">7×",       ">6×",       ">5.5×"],
            ["Seed Capital Remaining",  ">$371K",    ">$212K",    ">$123K"],
          ],
          [2700, 1800, 1800, 1800]
        ),

        divider(),

        // ─── 14. TECH STACK ──────────────────────────────────────────────────

        h1("14. Technology Stack"),

        body("Total active monthly tech cost: $1,106/month ($13,272/year) — lean, battle-tested infrastructure."),

        spacer(80),

        simpleTable(
          ["Category", "Services", "Monthly Cost"],
          [
            ["Core Infrastructure",      "AWS, Supabase, Vercel",                    "$105"],
            ["AI & Development",          "Anthropic Claude, Cursor",                 "$460"],
            ["Communications",            "Resend, Brevo, Twilio",                    "$185"],
            ["Website Builder",           "GrapesJS (open source) + AWS S3",          "$23"],
            ["Third-Party Integrations",  "GoDaddy, Google Maps",                     "$55"],
            ["Team Tools",                "GitHub, Sentry, Figma, Notion, Zoom",      "$168"],
            ["Payroll (Phase 2)",          "HelloSign",                                "$25"],
            ["Payments",                  "Stripe, Unit Banking, Check Payroll API",  "Revenue-share (no flat fee)"],
            ["TOTAL",                     "",                                          "$1,106/mo"],
          ],
          [2268, 4000, 2732]
        ),

        spacer(80),

        italic("Note: Payments infrastructure (Stripe, Unit Banking, Check Payroll API) operates on revenue-share with no flat monthly fee — costs scale only with revenue."),

        divider(),

        // ─── CLOSING ─────────────────────────────────────────────────────────

        h1("Investment Opportunity"),

        body(
          "The Exchange is raising $500,000 in a seed round to fund 18 months of operations, marketing, and product " +
          "development. The platform is production-ready. The market is proven. The theology is resonant. The unit " +
          "economics are strong."
        ),

        spacer(80),

        bullet("Production-ready platform — no MVP risk"),
        bullet("LTV:CAC of 5–11× across all growth phases"),
        bullet("Break-even at Month 9–10 — capital returned as operating engine"),
        bullet("No competitor matches the giving + banking + payroll + website stack at $89/mo"),
        bullet("$700B+ global Christian giving market with zero dominant all-in-one platform"),

        spacer(120),

        goldCallout(
          '"This is not a startup burning through capital. This is a ministry stewarding capital."'
        ),

        spacer(160),

        new Paragraph({
          children: [new TextRun({ text: "CONTACT", font: FONT, size: 24, bold: true, color: NAVY, characterSpacing: 60 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
        }),

        new Paragraph({
          children: [new TextRun({ text: "Shawn Fair  |  Co-Founder & CFO  |  Fair Stewardship Group", font: FONT, size: 22, bold: true, color: DARK })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "shawn@fairstewardshipgroup.com", font: FONT, size: 22, color: GOLD })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "586-248-1966  |  theexchangeapp.church", font: FONT, size: 22, color: SLATE })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
        }),

        new Paragraph({
          children: [new TextRun({ text: "2 Corinthians 5:21", font: FONT, size: 20, color: GOLD, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 0 },
        }),
      ],
    },
  ],
});

// ─── Write file ───────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then((buffer) => {
  writeFileSync(OUTPUT_PATH, buffer);
  console.log("✅  Executive Summary generated:");
  console.log("    " + OUTPUT_PATH);
  console.log("");
  console.log("📌  Upload to Google Drive → Right-click → 'Open with Google Docs'");
});
