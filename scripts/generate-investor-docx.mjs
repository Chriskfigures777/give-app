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
const OUTPUT_PATH = join(__dirname, "../INVESTOR_BUSINESS_PLAN.docx");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
  });
}
function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
  });
}
function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100 },
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", color: "1f2937", ...opts })],
    spacing: { before: 80, after: 80 },
  });
}
function bold(text) {
  return body(text, { bold: true });
}
function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", color: "1f2937" })],
    bullet: { level },
    spacing: { before: 60, after: 60 },
  });
}
function quote(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", italics: true, color: "059669", bold: true })],
    indent: { left: convertInchesToTwip(0.4) },
    spacing: { before: 160, after: 160 },
    border: { left: { color: "10b981", size: 24, space: 8, style: BorderStyle.SINGLE } },
  });
}
function divider() {
  return new Paragraph({
    text: "",
    border: { bottom: { color: "d1d5db", size: 6, space: 4, style: BorderStyle.SINGLE } },
    spacing: { before: 200, after: 200 },
  });
}
function spacer() {
  return new Paragraph({ text: "", spacing: { before: 80, after: 80 } });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function tbl(headers, rows) {
  const makeCell = (text, isHeader = false) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 20,
              font: "Calibri",
              bold: isHeader,
              color: isHeader ? "ffffff" : "1f2937",
            }),
          ],
          spacing: { before: 60, after: 60 },
        }),
      ],
      shading: isHeader
        ? { type: ShadingType.SOLID, color: "059669", fill: "059669" }
        : undefined,
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: headers.map((h) => makeCell(h, true)),
        tableHeader: true,
      }),
      ...rows.map(
        (row, i) =>
          new TableRow({
            children: row.map((cell) => {
              const c = makeCell(cell, false);
              c.options = c.options || {};
              if (i % 2 === 0) {
                c.properties = { shading: { type: ShadingType.SOLID, color: "f9fafb", fill: "f9fafb" } };
              }
              return c;
            }),
          })
      ),
    ],
  });
}

// ─── Title Page ───────────────────────────────────────────────────────────────
const titlePage = [
  spacer(), spacer(), spacer(),
  new Paragraph({
    children: [new TextRun({ text: "THE EXCHANGE APP", size: 72, bold: true, font: "Calibri", color: "059669" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Investor Business Plan", size: 44, font: "Calibri", color: "1f2937" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "The Digital Infrastructure for the Global Church Economy", size: 28, italics: true, font: "Calibri", color: "4b5563" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
  }),
  divider(),
  spacer(),
  new Paragraph({
    children: [new TextRun({ text: '"Where the Body of Christ shares, serves, and gives."', size: 28, italics: true, bold: true, font: "Calibri", color: "059669" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 400 },
  }),
  spacer(), spacer(),
  new Paragraph({
    children: [new TextRun({ text: "Confidential — For Investor Review Only", size: 20, font: "Calibri", color: "9ca3af", italics: true })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [new TextRun({ text: "Strategic Advisor: Shawn Fair, Fair Stewardship Group", size: 20, font: "Calibri", color: "6b7280" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
  }),
  pageBreak(),
];

// ─── 1. Executive Summary ─────────────────────────────────────────────────────
const execSummary = [
  h1("1. Executive Summary"),
  body("The Exchange is a comprehensive faith-based financial and community platform purpose-built for churches, ministries, Christian nonprofits, and individual believers. It combines donation management, embedded banking, debit card infrastructure, CRM, surveys, notes, goal tracking, peer networking, website publishing, and marketplace capabilities into a single mission-aligned ecosystem."),
  spacer(),
  body("The platform is architecturally complete and production-ready. The Exchange is not a concept — it is a functioning, full-stack application built on Next.js 14, Supabase, Stripe, Unit Banking, and a comprehensive suite of integrated services."),
  spacer(),
  h3("The Theological Foundation"),
  body("In Christian theology, the Great Exchange refers to the Gospel transaction: Christ took our sin and gave us His righteousness (2 Corinthians 5:21). The platform is named in honor of this principle — a network where the Body of Christ exchanges resources, generosity, service, and support."),
  spacer(),
  quote('"The Exchange is building the digital network where the global Church can share resources, support one another, and coordinate generosity."'),
  spacer(),
  h3("Brand Strength: 9/10"),
  bullet("Short and memorable"),
  bullet("Deep theological significance — The Great Exchange (2 Cor 5:21)"),
  bullet("Platform meaning: marketplace, financial flow, network"),
  bullet("Works globally across finance, commerce, and ministry"),
  bullet("Scalable to a billion-dollar brand"),
  pageBreak(),
];

// ─── 2. The Problem ───────────────────────────────────────────────────────────
const theProblem = [
  h1("2. The Problem"),
  body("The global church ecosystem is one of the largest coordinated trust networks in human history — yet it is digitally fragmented."),
  spacer(),
  tbl(["Category", "Scale"], [
    ["Global Christians", "~2.3 billion"],
    ["Churches worldwide", "~5–7 million"],
    ["US churches", "380,000+"],
    ["US annual church giving", "~$130 billion"],
    ["Global Christian giving", "~$700 billion+"],
  ]),
  spacer(),
  body("Despite this scale, most churches operate with:"),
  bullet("Disconnected single-purpose tools (giving app, church management, event software)"),
  bullet("No interoperability between congregations"),
  bullet("No coordinated resource-sharing infrastructure"),
  bullet("No digital identity or financial infrastructure for the faith economy"),
  spacer(),
  quote('"Massive generosity exists — but it is not coordinated."'),
  spacer(),
  h3("The Timing Shift — Why Now"),
  bullet("Digital giving adoption: churches widely adopted digital payments post-COVID"),
  bullet("API-based fintech: Unit, Stripe, and Plaid now enable purpose-built financial tools"),
  bullet("Network platforms: community-driven ecosystems have become the dominant software model"),
  pageBreak(),
];

// ─── 3. Pricing Plans ─────────────────────────────────────────────────────────
const pricingPlans = [
  h1("3. Pricing Plans & Core Revenue Structure"),
  body("The Exchange operates on two simple, accessible subscription tiers designed to convert churches quickly and create a natural upgrade path as they grow. Both plans include the 1% platform transaction fee on all giving processed."),
  spacer(),

  h2("Plan A — Basic | $29/month"),
  body("Who it's for: Small to mid-size churches getting started with digital giving and congregation engagement."),
  spacer(),
  body("Includes:"),
  bullet("Giving platform (donation pages, campaigns, QR codes, donation links)"),
  bullet("1% platform transaction fee on all giving"),
  bullet("CRM (contacts, tags, activity history, notes)"),
  bullet("Surveys — up to 3 active surveys with AI question generation"),
  bullet("Notes module with Bible panel"),
  bullet("Goals tracker with progress rings and milestones"),
  bullet("Events management with reminders"),
  bullet("Peer networking and connections"),
  bullet("Social feed and donation sharing"),
  bullet("Basic messaging and fund requests"),
  bullet("Organization public profile with QR code"),
  bullet("50 AI credits/month for survey and content generation"),
  spacer(),
  bold("Revenue per church: $29/month + 1% of giving volume"),
  spacer(),

  h2("Plan B — Pro | $49/month"),
  body("Who it's for: Growing churches and ministries that want the full platform — banking, website, advisor network, and unlimited scale."),
  spacer(),
  body("Includes everything in Basic, plus:"),
  bullet("Embedded banking (Unit Banking deposit accounts)"),
  bullet("Debit card issuance for church staff and leadership"),
  bullet("Payment splits and internal fund routing"),
  bullet("Website builder with custom domain management"),
  bullet("Broadcast messaging (email + SMS)"),
  bullet("Campaigns with advanced analytics and exports"),
  bullet("Advisor/Missionary network access"),
  bullet("Endowment fund management"),
  bullet("Priority matrix (Eisenhower tool)"),
  bullet("Explore featured placement (1 slot included)"),
  bullet("200 AI credits/month"),
  bullet("Advanced survey analytics and exports"),
  spacer(),
  bold("Revenue per church: $49/month + 1% of giving volume"),
  spacer(),

  h2("Plan C — All-In (Giving + Payroll) | $89/month ⭐ Most Powerful"),
  body("Who it's for: Churches that want the complete operating system — giving, banking, AND payroll all in one platform. This is the stickiest plan on the platform."),
  spacer(),
  body("Includes everything in Pro, plus:"),
  bullet("ALL incoming church giving processed through the platform (1% transaction fee still applies)"),
  bullet("Full payroll processing — 3 employees included in the base plan"),
  bullet("Additional employees: $12/employee/month beyond the 3 included"),
  bullet("Debit card issuance for church staff and leadership"),
  bullet("Bill pay + ACH transfers via Unit Banking"),
  bullet("Missionary disbursement embed"),
  bullet("200 AI credits/month"),
  spacer(),
  bold("Revenue per church: $89/month + $12/emp (beyond 3) + 1% of giving volume"),
  spacer(),
  quote('"Once a church runs payroll tied to their embedded banking account, switching cost becomes extraordinarily high. They cannot move their payroll, bank, AND giving platform separately. This is the stickiest possible product in the church technology market."'),
  spacer(),
  body("Revenue example — 100 churches on the All-In plan:"),
  bullet("100 × $89/mo = $8,900/mo in plan subscriptions"),
  bullet("100 churches × avg 4 extra employees × $12 = $4,800/mo in employee fees"),
  bullet("100 churches × avg $12,500 giving × 1% = $12,500/mo in transaction fees"),
  bold("Total from 100 All-In churches: $26,200/month"),
  spacer(),

  h2("Transaction Fee: 1% on All Giving"),
  body("Every dollar that flows through The Exchange generates platform revenue. The 1% fee applies across all financial activity: donations, fund requests, campaign contributions, missionary support, split distributions, and marketplace transactions."),
  spacer(),
  tbl(["Monthly Giving Volume", "1% Fee Revenue", "Annual Fee Revenue"], [
    ["$10,000", "$100", "$1,200"],
    ["$50,000", "$500", "$6,000"],
    ["$100,000", "$1,000", "$12,000"],
    ["$500,000", "$5,000", "$60,000"],
    ["$1,000,000", "$10,000", "$120,000"],
  ]),
  spacer(),
  body("This is the primary revenue engine. As churches grow their giving volume, the platform earns more — perfectly aligning our incentives with theirs."),
  pageBreak(),
];

// ─── 4. Banking & Card ────────────────────────────────────────────────────────
const bankingCard = [
  h1("4. Embedded Banking & Debit Card Program"),
  body("The Exchange Pro plan includes full embedded banking powered by Unit Banking-as-a-Service — one of the most powerful features differentiating the platform from every competitor in the church software market."),
  spacer(),

  h2("Church Banking Accounts"),
  bullet("FDIC-insured deposit accounts for churches and ministries"),
  bullet("Customer onboarding with KYC verification (required by law)"),
  bullet("Multiple account types: operating, benevolence, missions, endowment"),
  bullet("External bank account linking via Plaid"),
  bullet("Bill pay: pay vendors, utilities, and contractors directly from the platform"),
  bullet("Real-time transaction history and account dashboard"),
  bullet("Automated payout routing from Stripe Connect"),
  bullet("ACH transfers via Dwolla for large disbursements"),
  spacer(),

  h2("Exchange Debit Card — For Churches & Leaders"),
  body("Pro plan organizations can issue debit cards to church staff, pastors, elders, and designated leaders. This is a major differentiator — no competitor in the faith-based software market offers church-issued debit cards."),
  spacer(),
  bold("How it works:"),
  bullet("Church activates banking through Unit on the Pro plan"),
  bullet("Church admin issues virtual or physical debit cards to authorized staff"),
  bullet("Each card is tied to the church's Exchange account balance"),
  bullet("Cards can have individual spending limits set by church leadership"),
  bullet("Real-time transaction notifications for all card activity"),
  bullet("Expense categorization for ministry budgets (missions, events, operations)"),
  bullet("Church admins can freeze/unfreeze cards instantly from the dashboard"),
  bullet("Card usage generates interchange revenue for The Exchange"),
  spacer(),
  bold("Card Revenue Model:"),
  bullet("Interchange fee: The Exchange earns ~1–1.5% on every debit card purchase"),
  bullet("If 200 churches each have 3 active cards spending $2,000/month:"),
  bullet("200 × 3 cards × $2,000/month × 1.2% interchange = $14,400/month = $172,800/year"),
  spacer(),
  body("This interchange revenue is generated passively — churches use their cards for normal ministry expenses (supplies, food, travel, vendors) and The Exchange earns a fee on every transaction with no additional cost to the church."),
  spacer(),

  h2("Why Banking + Cards Changes Everything"),
  body("Most church software platforms are tools. The Exchange becomes infrastructure. Once a church has:"),
  bullet("Their operational checking account in The Exchange"),
  bullet("Staff debit cards issued through The Exchange"),
  bullet("Donations flowing in through The Exchange giving platform"),
  bullet("Splits routing funds automatically through The Exchange"),
  spacer(),
  body("...the switching cost becomes extremely high. The church's entire financial life is inside the platform. This is the stickiest possible product in the church technology market."),
  spacer(),
  quote('"Once a church banks with us, they stay. The Exchange becomes the financial operating system of the congregation."'),
  spacer(),

  h2("Advisor Network — $150/month Banking Tier"),
  body("The Advisor Network is a premium tier for ministry leaders, financial advisors, missionaries, and church consultants who operate across multiple organizations and need full banking access with enhanced financial management tools."),
  spacer(),
  body("Advisor Network Plan — $150/month includes:"),
  bullet("Full Exchange Banking App with Unit deposit accounts"),
  bullet("Ability to manage multiple church accounts from one dashboard"),
  bullet("Advisory profile visible to all churches on the platform"),
  bullet("Missionary fundraising embed capabilities"),
  bullet("Advanced financial reporting and analytics"),
  bullet("Private chat with church leaders across the network"),
  bullet("Featured placement in the Advisor Directory"),
  bullet("500 AI credits/month"),
  bullet("Priority support"),
  bullet("Debit card issuance for advisor operations"),
  spacer(),
  body("Who signs up:"),
  bullet("Independent financial stewardship advisors (like Shawn Fair's network)"),
  bullet("Missionaries operating their own fundraising campaigns"),
  bullet("Denominational leaders overseeing multiple congregations"),
  bullet("Church consultants serving multiple clients"),
  bullet("Ministry network directors"),
  spacer(),
  bold("Revenue projection: 100 advisors × $150/month = $15,000/month = $180,000/year"),
  spacer(),
  body("Strategic multiplier: Every advisor is a sales channel. When an advisor recommends The Exchange to their church clients, they bring 3–5 churches with them per advisor. 100 advisors = potential 300–500 church referrals."),
  pageBreak(),
];

// ─── 5. AI Credits ────────────────────────────────────────────────────────────
const aiCredits = [
  h1("5. AI Credits — Pay-As-You-Go Revenue"),
  body("Every plan includes a monthly AI credit allowance for features powered by Anthropic Claude: survey question generation, content suggestions, sermon notes analysis, and engagement insights. When a church exhausts their monthly credits, they purchase additional credits on demand."),
  spacer(),

  h2("Credit Allowances by Plan"),
  tbl(["Plan", "Monthly Credits Included", "Cost"], [
    ["Basic ($29/mo)", "50 credits", "Included"],
    ["Pro ($49/mo)", "200 credits", "Included"],
    ["Advisor Network ($150/mo)", "500 credits", "Included"],
  ]),
  spacer(),

  h2("Credit Pack Pricing (When Credits Run Out)"),
  tbl(["Pack Size", "Price", "Price Per Credit"], [
    ["100 credits", "$10", "$0.10"],
    ["500 credits", "$40", "$0.08"],
    ["1,000 credits", "$75", "$0.075"],
    ["5,000 credits", "$300", "$0.06"],
  ]),
  spacer(),

  h3("What Happens When Credits Run Out"),
  body("When a church exhausts their monthly AI credit allowance, they receive a prompt in the dashboard offering them options:"),
  bullet("Purchase a credit pack immediately (one-click, charged to card on file)"),
  bullet("Upgrade to the next plan tier (which includes more credits)"),
  bullet("Wait until next billing cycle for credit refresh"),
  body("No AI features are available during credit shortage — but all non-AI features continue working without interruption. This creates a natural upsell moment without frustrating the user."),
  spacer(),

  h3("Credit Allowances — Updated for All Plans"),
  tbl(["Plan", "Monthly Credits", "API Cost to Exchange", "Margin"],  [
    ["Basic ($29/mo)", "50 credits", "~$0.25/mo", "~99%"],
    ["Pro ($49/mo)", "200 credits", "~$1.00/mo", "~98%"],
    ["All-In ($89/mo)", "200 credits", "~$1.00/mo", "~99%"],
    ["Advisor ($150/mo)", "500 credits", "~$2.50/mo", "~98%"],
  ]),
  spacer(),

  h3("Revenue Projection"),
  body("If 200 churches purchase additional credit packs per month at an average of $40 per purchase:"),
  bullet("200 churches × $40/month = $8,000/month = $96,000/year"),
  body("This is purely incremental revenue on top of subscription and transaction fee income, with zero marginal cost to The Exchange (Anthropic API costs are passed through with margin)."),
  spacer(),
  body("Heavy AI users — large churches running quarterly congregational surveys to hundreds of members — become high-value contributors even on the Basic plan, generating $40–$75/month in AI credit purchases on top of their $29 subscription."),
  pageBreak(),
];

// ─── 6. Growth Strategy ───────────────────────────────────────────────────────
const growthStrategy = [
  h1("6. Growth Strategy — Path to 200 Churches (Year 1) and 900 (Year 3)"),
  body("The Exchange's growth strategy begins locally, proves the model, then scales nationally using investor capital for strategic marketing and digital advertising. Year 1 target: 200 paying churches with a conservative, sustainable ramp."),
  spacer(),

  h2("The Grand Rapids Beachhead"),
  body("Grand Rapids, Michigan is the ideal launch city:"),
  bullet("Home to a dense, collaborative Christian community with strong inter-church culture"),
  bullet("Dozens of established churches across multiple denominations and traditions"),
  bullet("Strong Reformed and evangelical tradition with history of cooperation"),
  bullet("Michigan-based founding team has existing pastoral relationships in the market"),
  bullet("Grand Rapids is a hub of faith-based business and philanthropy (Dick DeVos, ArtPrize, etc.)"),
  bullet("Success here creates a credible proof point for national investor conversations"),
  spacer(),

  h2("Surveys as the Entry Wedge"),
  body("The survey module is the lowest-friction entry point into the platform. A pastor can launch a congregation survey in under 10 minutes, see immediate engagement from members, and experience platform value before committing to financial features."),
  spacer(),
  body("This creates the natural on-ramp:"),
  bullet("Pastor launches survey → members respond on phones"),
  bullet("Pastor sees CRM value — member data organized automatically"),
  bullet("Church activates donation features → first giving campaign"),
  bullet("Church upgrades to Pro → activates banking and website"),
  bullet("Church issues debit cards → fully embedded in the platform"),
  spacer(),
  body("Growth mechanic: Every survey sent is a branded touchpoint to dozens or hundreds of people who might bring The Exchange to their own church. Surveys are a viral distribution mechanism disguised as a productivity tool."),
  spacer(),

  h2("Conservative Church Growth Roadmap"),
  tbl(["Milestone", "Timeline", "Strategy", "Est. MRR", "Investment Status"], [
    ["15 churches", "Month 2", "Personal outreach + free trial launch", "$4,710", "Drawing: ~$21.5K/mo"],
    ["50 churches", "Month 4", "Ads at $10K/mo + referral program", "$15,700", "Drawing: ~$21.5K/mo"],
    ["90 churches", "Month 6", "Optimized ads + All-In plan push", "$28,260", "Near break-even"],
    ["150 churches", "Month 9", "Ministry conference + referral compound", "$47,100", "Break-even achieved"],
    ["165 churches", "Month 10–11", "$300K ARR milestone — CAPITAL REPLACED", "$51,810", "Draw-down STOPS"],
    ["200 churches", "Month 12", "Year 1 close; seed reserve = ~$207K+", "$62,800", "Seed = growth fund"],
    ["450 churches", "Month 18", "Phase 3 banking + podcasts + conferences", "$84,601", "Fully self-funded"],
    ["900 churches", "Month 24", "Series A close; all 4 revenue tiers live", "$169,200", "Series A fuel"],
  ]),
  spacer(),
  quote('"The $500K seed is not a 12-month burn rate. It is an 18-to-24-month stewardship fund. By Month 10–11, when Annual Recurring Revenue reaches $300,000, the platform self-funds all monthly costs. The remaining capital becomes a growth reserve — not a survival budget."'),
  spacer(),

  h2("Recovering Investor Capital — Stewardship Not Speed"),
  body("Ad spend ramps with church growth. The investment is not front-loaded. This approach ensures we validate product-market fit before scaling spend."),
  spacer(),
  bold("Cost Per Lead: $67–$83 per church (demo or free trial signup)"),
  bold("Customer Acquisition Cost (CAC): $333–$750 per paying church"),
  bold("Average 3-Year LTV per church: $3,500–$5,500"),
  bold("LTV:CAC Ratio: 5–11× across all phases"),
  spacer(),
  body("Marketing channels:"),
  bullet("Facebook/Instagram ads targeting church administrators and pastors — primary channel"),
  bullet("YouTube pre-roll on Christian content channels and sermon libraries"),
  bullet("Ministry conference booths: Exponential, EFCA One, National Pastors Conference"),
  bullet("Podcast sponsorships on popular Christian leadership podcasts"),
  bullet("Pastor-to-pastor referral program (1 free month per successful referral)"),
  spacer(),
  body("Phase 1 example — $10,000/mo in ads:"),
  bullet("130 leads/month at $77 CPL"),
  bullet("78 trial signups (60% trial rate)"),
  bullet("20 new paying churches (26% trial-to-paid)"),
  bullet("CAC = $500 | 3-yr LTV = $3,500 | LTV:CAC = 7×"),
  spacer(),

  h2("Pastor-to-Pastor Referral Network"),
  body("Churches trust other churches. The most powerful growth channel is personal recommendation from pastor to pastor:"),
  bullet("Referral reward: 1 month free for every church a pastor successfully refers"),
  bullet("Pastoral network partnerships — denomination connections, ministry alliances"),
  bullet("Church council and elder board testimonials in marketing materials"),
  spacer(),

  h2("Advisor Network as a Sales Force"),
  body("Every advisor on the $150/month Advisor Network plan is a natural sales channel:"),
  bullet("Advisors work with 3–10 churches simultaneously as clients"),
  bullet("When advisor recommends The Exchange, referred churches trust them"),
  bullet("Advisor benefits: manage all client churches in one dashboard"),
  bullet("100 advisors × average 5 church clients = 500 churches within advisor reach"),
  pageBreak(),
];

// ─── 7. All Revenue Streams ───────────────────────────────────────────────────
const allRevenue = [
  h1("7. All Revenue Streams — Complete Picture"),
  spacer(),

  h2("Stream 1 — Transaction Fee: 1% on All Giving"),
  bullet("Rate: 1% flat on every dollar processed through the platform"),
  bullet("Scope: Donations, campaigns, fund requests, missionary support, marketplace, exchange fees"),
  bullet("Benchmark: Tithe.ly 2.9% + $0.30; Pushpay 1–2%; PayPal 2.9%"),
  bullet("Our advantage: Lower rate builds loyalty; volume compensates at scale"),
  spacer(),

  h2("Stream 2 — Basic Plan: $29/month per Church"),
  bullet("Target: Small-to-mid churches, first-time digital giving adopters"),
  bullet("Includes: giving, CRM, surveys, notes, goals, events, networking, 50 AI credits"),
  bullet("Path to 1,000 churches: 600 Basic subscribers = $17,400/month"),
  spacer(),

  h2("Stream 3 — Pro Plan: $49/month per Church"),
  bullet("Target: Growing churches wanting banking, website, and full platform"),
  bullet("Includes: Everything in Basic + banking, debit cards, website builder, broadcast, 200 AI credits"),
  bullet("At 200 churches (35% on Pro): 70 churches × $49 = $3,430/month"),
  spacer(),

  h2("Stream 3b — All-In Plan: $89/month per Church (+ $12/employee)"),
  bullet("Target: Churches wanting the complete operating system — giving + payroll + banking in one"),
  bullet("Includes: Everything in Pro + payroll processing (3 employees included) + all incoming giving processed"),
  bullet("Per-Employee Fee: $12/employee/month beyond the 3 included (avg 4 extra = $48/mo additional)"),
  bullet("At 200 churches (25% on All-In): 50 churches × $89 = $4,450/mo subscriptions + $2,400/mo emp fees"),
  bullet("This is the stickiest plan: payroll tied to banking account creates near-zero churn"),
  spacer(),

  h2("Stream 4 — Advisor Network: $150/month per Advisor"),
  bullet("Target: Financial advisors, missionaries, consultants, denominational leaders"),
  bullet("Includes: Full banking access, multi-org dashboard, advisory profile, 500 AI credits, debit card"),
  bullet("Path to 1,000 churches: 100 advisors = $15,000/month"),
  bullet("Strategic value: Each advisor brings 3–5 church clients with them"),
  spacer(),

  h2("Stream 5 — AI Credits (Pay-As-You-Go)"),
  bullet("Included: 50 credits/month (Basic), 200 (Pro), 500 (Advisor)"),
  bullet("Overage packs: $10 (100 credits) | $40 (500) | $75 (1,000) | $300 (5,000)"),
  bullet("What happens when credits run out: Dashboard prompt to purchase pack or upgrade; no AI features until credits restored, all other features unaffected"),
  bullet("Projection at scale: 200 churches buying packs/month = $8,000+/month"),
  spacer(),

  h2("Stream 6 — Debit Card Interchange"),
  bullet("Model: The Exchange earns ~1–1.5% interchange on every debit card transaction"),
  bullet("Scope: Church staff and leadership cards issued through Unit Banking on Pro plan"),
  bullet("Example: 200 churches × 3 cards × $2,000/month spend × 1.2% = $14,400/month"),
  bullet("Annual projection: $172,800/year — fully passive, no cost to churches"),
  spacer(),

  h2("Stream 7 — Banking Interchange & Account Fees"),
  bullet("Model: Revenue share on debit/credit interchange through Unit Banking"),
  bullet("Additional: Monthly account maintenance fees for church financial accounts"),
  bullet("Benchmark: Unit Banking partners earn $0.10–$0.25/transaction + interchange"),
  bullet("Projection: 500 active banking accounts × $10/month = $60,000/year"),
  spacer(),

  h2("Stream 8 — Exchange Marketplace Fees"),
  bullet("Model: 5–10% fee on resource, service, and skill exchanges within the platform"),
  bullet("Scope: Service marketplace, digital resources, ministry curriculum, asset lending"),
  bullet("Benchmark: Etsy 6.5%; Amazon marketplace 8–15%"),
  spacer(),

  h2("Stream 9 — Missionary & Ministry Fundraising Fee"),
  bullet("Model: Platform percentage on all missionary support processed"),
  bullet("Scope: Monthly recurring missionary support, one-time mission gifts, ministry campaigns"),
  bullet("Benchmark: Cru and similar organizations retain 10–15% of supporter transactions"),
  spacer(),

  h2("Stream 10 — Endowment Management Fees"),
  bullet("Model: Basis-point fee on assets under management in endowment funds"),
  bullet("Rate: 0.25–0.75% AUM annually"),
  bullet("Projection: $10M in endowments = $25K–$75K/year"),
  spacer(),

  h2("Stream 11 — Website Hosting & Custom Domains"),
  bullet("Model: Premium add-on for churches using the website builder with a custom domain"),
  bullet("Pricing: $9.99/month for custom domain hosting (above Pro plan subscription)"),
  bullet("Projection: 200 websites hosted = $2,000/month = $24,000/year"),
  spacer(),

  h2("Stream 12 — Featured Listings & Promoted Placement"),
  bullet("Model: Organizations pay to appear featured in Explore and public discovery pages"),
  bullet("Pricing: $49–$299/month for featured placement tiers"),
  spacer(),

  h2("Stream 13 — Broadcast & SMS Credits"),
  bullet("Model: SMS message credits for broadcast campaigns beyond plan limits"),
  bullet("Pricing: $0.01 per SMS message (industry standard)"),
  bullet("Projection: 500 churches sending 500 SMS/month = $2,500/month"),
  spacer(),

  h2("Stream 14 — Donor Services (Premium Donor Accounts)"),
  bullet("Model: Optional premium tier for individual donors"),
  bullet("Features: Year-end receipt management, giving portfolio dashboard, saved organizations"),
  bullet("Pricing: $4.99/month per donor"),
  spacer(),

  h2("Stream 15 — White-Label Licensing (Long-Term)"),
  bullet("Model: License the full platform to denominations, church networks, or Christian associations"),
  bullet("Scope: White-labeled giving, banking, CRM, and surveys under their brand"),
  bullet("Benchmark: White-label SaaS licensing at 5–15% of licensee revenue"),
  bullet("Target: 3–5 denomination deals within 24 months"),
  spacer(),

  h2("Revenue Projection Summary (Conservative — v4 Model)"),
  body("Note: Previous model (v3) projected $600K in Year 1 transaction fees based on 400 churches at $25K avg giving. This has been corrected to a realistic ramp of 200 churches at $12,500 avg giving."),
  spacer(),
  tbl(["Revenue Stream", "Month 12 (200 churches)", "Month 18 (450 churches)", "Month 24 (900 churches)"], [
    ["1% Transaction Fee", "$25,000", "$56,250", "$112,500"],
    ["Basic Plans ($29 × 40%)", "$2,320", "$5,220", "$10,440"],
    ["Pro Plans ($49 × 35%)", "$3,430", "$7,718", "$15,435"],
    ["All-In Plans ($89 × 25%)", "$4,450", "$10,013", "$20,025"],
    ["Employee Fees ($12/emp)", "$2,400", "$5,400", "$10,800"],
    ["AI Credit Top-Ups", "$900", "$3,000", "$6,500"],
    ["Banking Interchange (~1.2%)", "$0", "$5,000", "$18,000"],
    ["Website Hosting ($9.99)", "$500", "$1,200", "$2,500"],
    ["Advisor Network ($150)", "$0", "$0", "$4,500"],
    ["TOTAL MONTHLY REVENUE", "~$39,000", "~$93,801", "~$200,700"],
    ["TOTAL ANNUAL REVENUE", "~$468,000", "~$1,125,612", "~$2,408,400"],
  ]),
  pageBreak(),
];

// ─── 8. Feature Inventory ─────────────────────────────────────────────────────
const features = [
  h1("8. Platform Features — Complete Capability Inventory"),
  body("The Exchange is not a single-feature app. It is a comprehensive ecosystem covering every dimension of church operations, generosity, and community. Below is the full feature inventory currently live in the platform."),
  spacer(),

  h2("Feature 1: Donation & Giving Platform"),
  bullet("Multi-form donation pages with custom branding"), bullet("Recurring donation subscriptions"),
  bullet("Donation campaigns with goals and progress bars"), bullet("Split donations to multiple funds simultaneously"),
  bullet("Donation QR codes for in-person giving"), bullet("Embeddable donation forms for any website"),
  bullet("Shareable donation links"), bullet("Real-time donation feed"),
  bullet("Donation receipts and year-end tax reports"), bullet("Fund request system (chat-based peer giving)"),
  spacer(),

  h2("Feature 2: Embedded Banking (Unit Banking)"),
  bullet("FDIC-insured church deposit accounts"), bullet("Customer onboarding and KYC verification"),
  bullet("External account linking via Plaid"), bullet("Bill pay functionality"),
  bullet("Account management dashboard"), bullet("Webhook-driven real-time transaction events"),
  bullet("Payout account management via Stripe Connect"),
  spacer(),

  h2("Feature 3: Debit Card Program"),
  bullet("Issuance of virtual and physical debit cards to church staff and leadership"),
  bullet("Individual spending limits per card set by church admin"),
  bullet("Real-time transaction notifications for all card activity"),
  bullet("Expense categorization for ministry budgets"),
  bullet("Instant card freeze/unfreeze from admin dashboard"),
  bullet("Interchange revenue generated on every card purchase"),
  spacer(),

  h2("Feature 4: Payment Splits & Fund Routing"),
  bullet("Internal splits — percentage-based routing to internal fund buckets"),
  bullet("External splits — route portions to partner ministries or missionaries"),
  bullet("Split percentage visualization"), bullet("Split proposals in chat"),
  spacer(),

  h2("Feature 5: CRM — People & Contacts"),
  bullet("Contact database with search and filters"),
  bullet("Full contact profiles: name, phone, email, address"),
  bullet("Activity history, tags, and segmentation"),
  bullet("Private staff notes per contact"),
  bullet("Survey distribution and broadcast messaging per contact"),
  spacer(),

  h2("Feature 6: Surveys & Forms (Growth Entry Point)"),
  bullet("Survey builder with multiple question types"),
  bullet("AI-powered question generation (Anthropic Claude)"),
  bullet("Send to members, contacts, or selected recipients"),
  bullet("Public survey response pages"),
  bullet("Analytics dashboard with Recharts visualizations"),
  bullet("Custom payment forms with branding and Typeform integration"),
  spacer(),

  h2("Feature 7: Notes & Knowledge Management"),
  bullet("TipTap-based rich text editor"),
  bullet("Bible reference panel side-by-side with notes"),
  bullet("Voice dictation support"),
  bullet("Note gallery with search and organization"),
  spacer(),

  h2("Feature 8: Goals System"),
  bullet("Explorer-style gallery grid with cover images and animated progress rings"),
  bullet("Milestone checklist with confetti celebration on completion"),
  bullet("Active Member Widget (Green/Yellow/Red engagement tiers)"),
  bullet("Horizon filters: All / 90-Day / 1-Year / 3-Year"),
  bullet("DOCX and PDF export for reporting"),
  spacer(),

  h2("Feature 9: Events Management"),
  bullet("Event creation with automated reminders"),
  bullet("Eventbrite integration for large events"),
  bullet("Event discovery on Explore page"),
  spacer(),

  h2("Feature 10: Peer Networking & The Exchange Network"),
  bullet("Peer connection requests between believers and leaders across the platform"),
  bullet("Cross-church peer search and discovery"),
  bullet("Connection notifications and management dashboard"),
  spacer(),

  h2("Feature 11: Messaging & Chat"),
  bullet("Direct messaging between users"),
  bullet("Fund requests embedded in chat (give money directly from a conversation)"),
  bullet("Split proposals and acceptance/rejection in chat"),
  spacer(),

  h2("Feature 12: Social Feed"),
  bullet("Feed posts with media, donation sharing, comments, and reactions"),
  bullet("Live donation ticker and platform statistics pulse"),
  spacer(),

  h2("Feature 13: Website Builder & Publishing"),
  bullet("Drag-and-drop page builder with CMS"),
  bullet("Sermon archive, podcast episodes, and worship recording library"),
  bullet("Custom domain management, DNS wizard, and SSL automation (AWS)"),
  bullet("Pexels stock photo/video integration"),
  spacer(),

  h2("Feature 14: Advisor Network (Missionary & Ministry Network)"),
  bullet("Missionary profile pages with embedded fundraising"),
  bullet("Missionary invite, creation, and convert-to-missionary pathway"),
  bullet("Sponsor organization tracking and giver management"),
  bullet("Missionary embed cards — shareable fundraising widgets"),
  spacer(),

  h2("Feature 15: Endowment Funds"),
  bullet("Endowment fund creation and management"),
  bullet("Admin endowment dashboard with balance tracking and update history"),
  spacer(),

  h2("Feature 16: Priority Management (Eisenhower Matrix)"),
  bullet("Visual Eisenhower Matrix whiteboard for ministry leaders"),
  bullet("Priority item creation, editing, and quadrant management"),
  spacer(),

  h2("Feature 17: Campaigns, Broadcast & Explore"),
  bullet("Time-bounded campaign management with progress analytics"),
  bullet("Broadcast messaging to contacts (email + SMS)"),
  bullet("Explore & Discovery: organization search, cause filters, featured placement"),
  spacer(),

  h2("Feature 18: Organization Profiles & Platform Administration"),
  bullet("Fully branded organization public profile with QR code and embeddable giving card"),
  bullet("Team member showcase and management"),
  bullet("Platform admin: user/org management, endowment oversight, survey analytics, Stripe setup"),
  pageBreak(),
];

// ─── 9. Market & Competition ──────────────────────────────────────────────────
const market = [
  h1("9. Market Opportunity & Competitive Landscape"),
  tbl(["Segment", "Size"], [
    ["U.S. church giving annually", "~$130 billion"],
    ["Global Christian giving annually", "~$700 billion+"],
    ["U.S. churches", "380,000+"],
    ["Global faith-based nonprofits", "Hundreds of thousands"],
    ["Global Christians", "~2.3 billion"],
  ]),
  spacer(),
  body("The Serviceable Addressable Market (SAM) — U.S. churches using digital giving platforms — is estimated at $5–15 billion annually and growing."),
  spacer(),
  h2("Competitive Landscape"),
  tbl(["Competitor", "Focus", "Limitation"], [
    ["Tithe.ly", "Online giving", "Single-purpose, charges 2.9% + $0.30"],
    ["Pushpay", "Church giving + engagement", "Expensive ($500+/mo), no network layer"],
    ["Planning Center", "Church operations", "No giving, no banking"],
    ["Church Center", "App for Planning Center users", "No financial infrastructure"],
    ["Subsplash", "App + giving", "No banking, no network"],
  ]),
  spacer(),
  bold("The Exchange's position: The only faith-based platform combining giving, embedded banking, payroll processing, debit cards, CRM, surveys, notes, goals, website builder, messaging, peer networking, and missionary support — at $29/$49/$89/month."),
  spacer(),
  body("No competitor offers embedded banking + payroll + giving in a single $89/month All-In plan. Once a church processes payroll through The Exchange tied to their Unit Banking account, the switching cost is extremely high."),
  pageBreak(),
];

// ─── 10. Defensibility ───────────────────────────────────────────────────────
const defensibility = [
  h1("10. Network Effects & Defensibility"),
  body("The Exchange is designed to become harder to leave as it grows. Five defensibility layers compound over time:"),
  spacer(),
  h3("1. Network Effects"),
  body("Value increases as more churches join. Cross-church giving, resource sharing, and collaboration require network density — creating a flywheel where each new church makes the platform more valuable for all existing participants."),
  spacer(),
  h3("2. Financial Infrastructure Lock-In"),
  body("Once churches use Exchange banking accounts and debit cards for operational finances, switching costs become extremely high. Financial infrastructure is the stickiest possible moat in any market."),
  spacer(),
  h3("3. Identity & Trust Layer"),
  body("Church verification, member identities, and relationship history accumulate inside the platform over time. This trusted identity layer cannot be easily replicated."),
  spacer(),
  h3("4. Mission Alignment Moat"),
  body("Generic fintech cannot replicate the theological trust and community context of The Exchange. The platform's identity is inseparable from its mission."),
  spacer(),
  h3("5. Data Coordination Advantage"),
  body("At scale, the platform gains unique visibility into needs, resources, and generosity flows across the church ecosystem — enabling coordination that no single-church tool can provide."),
  spacer(),
  quote('"The Church is the largest pre-existing trust network in the world. The Exchange simply needs to become its digital infrastructure."'),
  spacer(),
  h2("Why The Exchange Could Become the PayPal of the Global Church"),
  tbl(["PayPal's Path", "The Exchange's Path"], [
    ["Solved a specific trust problem", "Solves cross-church generosity fragmentation"],
    ["Built network effects", "More churches = more resources = more reasons to join"],
    ["Became infrastructure", "Banking + debit cards = operational dependency"],
    ["Expanded from one use case", "Giving → Banking → Marketplace → Advisory → Exchange Network"],
  ]),
  pageBreak(),
];

// ─── 11. Domain & Brand ───────────────────────────────────────────────────────
const domainBrand = [
  h1("11. Domain & Brand Strategy"),
  h2("Domain Strategy"),
  tbl(["Domain", "Purpose"], [
    ["theexchangeapp.church", "Primary — signals church mission, instant recognition"],
    ["theexchangeapp.church", "Brand variant redirect"],
    ["theexchangeapp.org", "Trust redirect — donors expect .org"],
    ["theexchange.org", "Protection redirect"],
    ["theexchange.app", "Optional tech audience protection"],
  ]),
  spacer(),
  h2("Theological Brand Significance"),
  tbl(["Humanity Gives", "Christ Gives"], [
    ["Sin", "Righteousness"], ["Death", "Life"], ["Curse", "Blessing"], ["Guilt", "Forgiveness"],
  ]),
  spacer(),
  quote('"The Gospel itself begins with an exchange. The Exchange App is built on that same principle — a place where the body of Christ can share, give, serve, and support one another."'),
  pageBreak(),
];

// ─── 12. Legal & Governance ───────────────────────────────────────────────────
const legal = [
  h1("12. Legal & Governance Structure"),
  h2("Recommended Dual Structure"),
  bold("The Exchange Foundation (Nonprofit)"),
  bullet("Christian nonprofit membership organization"),
  bullet("Members affirm Christian faith and mission alignment"),
  bullet("Governs platform values, theological standards, and community conduct"),
  bullet("Theological advisory council from diverse church traditions"),
  spacer(),
  bold("The Exchange Platform LLC/Inc (Operating Company)"),
  bullet("Manages technology, banking integrations, and revenue"),
  bullet("Eligible for venture investment"),
  bullet("Responsible for regulatory compliance: BSA, AML, KYC, FDIC, state money transmission laws"),
  spacer(),
  quote('"By creating an account, users affirm that they are participating as members or supporters of the Christian community and will use the platform in alignment with its Christian mission."'),
  pageBreak(),
];

// ─── 13. Roadmap & Metrics ────────────────────────────────────────────────────
const roadmapMetrics = [
  h1("13. Strategic Roadmap & Key Metrics"),
  h2("Phase-by-Phase Roadmap"),
  tbl(["Phase", "Timeline", "Church Target", "Revenue Focus", "Investment Status"], [
    ["Phase 1 — Foundation", "Months 1–6", "90 churches", "$29/$49/$89 plans + 1% txn fee", "Drawing ~$21.5K/mo"],
    ["Phase 2 — Payroll Scale", "Months 7–12", "200 churches", "All-In plan upsell; $300K ARR", "Draw-down stops M10–11"],
    ["Phase 3 — Banking Launch", "Months 13–18", "450 churches", "Unit Banking + debit + interchange", "Fully self-funded"],
    ["Phase 4 — Advisor Network", "Months 19–24", "900 churches", "$150/mo advisor tier; Series A", "Series A fuel"],
  ]),
  spacer(),
  h2("$300K ARR — The Capital Replacement Milestone"),
  body("$300,000 in Annual Recurring Revenue = $25,000/month. This is reached at approximately 165 paying churches (~Month 10–11). At this milestone:"),
  bullet("Platform monthly income covers ALL operating costs (salaries + tech + ads)"),
  bullet("The $500K seed investment is no longer being drawn down"),
  bullet("Remaining ~$207K transitions from survival capital to growth capital"),
  bullet("This is the stewardship promise: the investment is converted into recurring revenue, not consumed"),
  spacer(),
  h2("Key Metrics for Investors"),
  tbl(["Metric", "Month 6", "Month 12 (Year 1)", "Month 18", "Month 24"], [
    ["Paying Churches", "90", "200", "450", "900"],
    ["Monthly Recurring Revenue", "$28,260", "$62,800", "$93,801", "$200,700"],
    ["Annual Run Rate (ARR)", "$339,120", "$753,600", "$1,125,612", "$2,408,400"],
    ["Cost Per Lead (CPL)", "<$80", "<$85", "<$90", "<$90"],
    ["Customer Acquisition Cost", "<$500", "<$750", "<$1,000", "<$750"],
    ["Trial-to-Paid Rate", ">33%", ">30%", ">35%", ">40%"],
    ["Monthly Churn Rate", "<5%", "<4%", "<3%", "<3%"],
    ["Seed Capital Remaining", "~$371K", "~$207K+", "~$100K+", "Fully self-funded"],
    ["All-In Plan Adoption", "15%", "25%", "30%", "35%"],
    ["Banking Accounts Active", "0", "30+", "200+", "450+"],
  ]),
  pageBreak(),
];

// ─── 14. Investor Q&A ─────────────────────────────────────────────────────────
const investorQA = [
  h1("14. Investor Questions & Responses"),
  spacer(),
  h3('Q: "Churches are slow to adopt technology."'),
  body("We start with surveys — a feature pastors can use in 10 minutes with immediate, visible impact. No risk, no financial commitment. The survey entry point converts to giving features, which convert to Pro plans and banking."),
  spacer(),
  h3('Q: "Why hasn\'t someone built this already?"'),
  body("The infrastructure required didn't exist ten years ago. Unit Banking's BaaS, Stripe Connect, Plaid, and modern cloud platforms only recently made this feasible. We are building at precisely the right technological moment."),
  spacer(),
  h3('Q: "What prevents another company from copying this?"'),
  body("Network effects, financial infrastructure lock-in (banking + debit cards), and mission alignment moat. Generic fintech cannot replicate theological trust. By the time a competitor notices us, we will have the network and the banking relationships."),
  spacer(),
  h3('Q: "How do you recover investor capital?"'),
  body("Strategic digital marketing — Facebook/Instagram targeting church admins and pastors, Google search ads, YouTube pre-roll on Christian channels, and ministry conference presence. At $150–300 CAC and $2,000–8,000 LTV, every $50,000 in marketing spend generates $400,000–1,300,000 in 3-year lifetime value."),
  spacer(),
  h3('Q: "What prevents fragmentation again?"'),
  body("Five compounding moats: network effects, financial lock-in, identity layer, mission alignment, and data coordination. Once a church banks with us and uses debit cards for daily operations, they stay."),
  spacer(),
  h3('Q: "What is the plan to get to 1,000 churches?"'),
  body("Grand Rapids beachhead (personal outreach + surveys, Months 1–4) → Michigan statewide via pastor referrals (Months 5–8) → Midwest ministry conferences and strategic marketing (Months 9–12) → National digital marketing with investor capital (Months 13–24). Advisor Network members act as a 100-person sales force, each bringing 3–5 church clients."),
  pageBreak(),
];

// ─── 15. Investment Ask ───────────────────────────────────────────────────────
const investmentAsk = [
  h1("15. Investment Opportunity — $500,000 Seed Round"),
  body("The Exchange is seeking a $500,000 seed investment. This is not a 12-month burn rate — it is an 18-to-24-month stewardship fund. By the time Annual Recurring Revenue reaches $300,000 (~Month 10–11 at 165 churches), the platform fully self-funds all monthly costs. The remaining seed capital then fuels growth — not survival."),
  spacer(),

  h2("Use of Funds — $500,000 Stewardship Allocation (18 Months)"),
  tbl(["Category", "Amount", "Detail"], [
    ["Christopher — CEO ($3K/mo × 18 mo)", "$54,000", "Founder salary — seed-funded through Month 18"],
    ["Shawn — CFO/Strategist ($3K/mo × 18 mo)", "$54,000", "Founder salary — seed-funded through Month 18"],
    ["Nathan — CTO/Dev ($3K/mo × 18 mo)", "$54,000", "Founder salary — seed-funded through Month 18"],
    ["Product Development (one-time)", "$49,000", "Mobile app, QA, payroll API, security audit"],
    ["Facebook + YouTube Ads (18 mo ramp)", "$200,000", "Ramps $5K→$20K/mo as church base grows"],
    ["Ministry Conferences (3 events)", "$15,000", "Phase 3 in-person launch events"],
    ["Podcast Sponsorships", "$12,000", "Faith-based podcast network (6 months)"],
    ["Legal + Compliance ($1K/mo × 18)", "$18,000", "Ongoing legal and regulatory compliance"],
    ["Tech Stack + Misc Buffer", "$44,000", "$1,106/mo tech stack × 18 + contingency"],
    ["TOTAL", "$500,000", ""],
  ]),
  spacer(),

  h2("Investment Stewardship — Monthly Draw-Down Schedule"),
  tbl(["Period", "Monthly Draw", "Revenue Offset", "Net Burn", "Seed Remaining"], [
    ["Month 1", "$21,500", "$0", "$21,500", "~$478,500"],
    ["Month 3", "$21,500", "$9,420", "$12,080", "~$430,000"],
    ["Month 6", "$21,500", "$28,260", "$0 (break-even)", "~$371,000"],
    ["Month 9", "$26,500", "$47,100", "Revenue covers costs", "~$300,000"],
    ["Month 10–11", "$26,500", "$51,810+", "DRAW-DOWN STOPS — $300K ARR", "~$207,000+"],
    ["Month 18", "$31,500", "$93,801", "Fully self-funded", "~$100K+ reserve"],
  ]),
  spacer(),
  quote('"The stewardship promise: By Month 10–11, recurring revenue replaces the seed investment as the operating engine. The remaining $200K+ is a growth reserve — deployed from strength, not desperation."'),
  spacer(),

  h2("Founder Compensation — Exact Amounts"),
  tbl(["Founder", "Role", "Monthly", "Annual", "18-Month Seed Coverage"], [
    ["Christopher", "CEO / Chief Product Officer", "$3,000", "$36,000", "$54,000"],
    ["Shawn", "CFO / Business & Financial Strategist", "$3,000", "$36,000", "$54,000"],
    ["Nathan", "CTO / Backend Developer & Security Lead", "$3,000", "$36,000", "$54,000"],
    ["TOTAL", "", "$9,000/mo", "$108,000/yr", "$162,000"],
  ]),
  spacer(),

  h2("Marketing — $200,000 (Ramped Over 18 Months)"),
  body("Ad spend is paced with church growth, not front-loaded. This is the primary vehicle for investor capital recovery."),
  spacer(),
  tbl(["Phase", "Monthly Ad Spend", "Budget", "Expected CPL", "New Churches/Mo"], [
    ["Months 1–3", "$5,000/mo", "$15,000", "~$67", "~15/mo"],
    ["Months 4–6", "$10,000/mo", "$30,000", "~$77", "~20/mo"],
    ["Months 7–12", "$15,000/mo", "$90,000", "~$81", "~20/mo"],
    ["Months 13–18", "$20,000/mo", "$120,000 est.", "~$83", "~25/mo"],
    ["TOTAL", "", "~$200,000", "", ""],
  ]),
  spacer(),
  body("Additional marketing channels:"),
  bullet("Ministry conferences (3 events — $15,000 total)"),
  bullet("Faith-based podcast sponsorships (6 months — $12,000 total)"),
  bullet("Pastor-to-pastor referral program (1 free month per successful referral)"),
  spacer(),

  h2("Capital Recovery Math — Realistic"),
  tbl(["Input", "Value"], [
    ["Marketing spend over 18 months", "$200,000"],
    ["Average CAC (customer acquisition cost)", "$500–$750"],
    ["Churches acquired from ads", "~300–350 over 18 months"],
    ["Blended ARPU (subscription + txn fee)", "~$313/church/month"],
    ["Monthly revenue at 200 churches (M12)", "~$62,800"],
    ["Monthly revenue at 450 churches (M18)", "~$93,801"],
    ["$300K ARR milestone", "~Month 10–11"],
    ["LTV:CAC ratio", "5–11× across all phases"],
  ]),
  spacer(),

  h2("Primary Growth Driver: All-In Plan ($89/mo) + 1% Transaction Fee"),
  body("The $29 Basic plan gets churches in the door. The $89 All-In plan — combining giving, banking, AND payroll — is the revenue engine and the retention mechanism."),
  spacer(),
  body("Upgrade path:"),
  bullet("Enter with Basic ($29) — lowest friction in the church software market"),
  bullet("Earn on 1% transaction fees — the real money is not the subscription"),
  bullet("Upgrade to All-In ($89 + $12/emp) — add payroll processing to maximize stickiness"),
  bullet("Lock in with banking: once payroll is tied to Unit Banking, churn drops to near zero"),
  spacer(),
  bold("Example: A church on the All-In plan with $50,000/month in giving and 7 employees:"),
  bullet("All-In subscription: $89/month"),
  bullet("Employee fee (4 extra × $12): $48/month"),
  bullet("Transaction fee (1% on $50,000): $500/month"),
  bold("Total platform revenue from this one church: $637/month = $7,644/year"),
  spacer(),

  h2("Debit Card Interchange — Unit Banking"),
  body("The Exchange uses Unit Banking as the primary embedded banking provider. When church staff use their Exchange debit cards at merchants, the merchant pays an interchange fee to the card network, and Unit Banking shares a portion with The Exchange."),
  spacer(),
  bullet("Average debit card interchange rate: 1.1–1.5% per transaction"),
  bullet("The Exchange earns its share of interchange on every swipe — at zero cost to the church"),
  spacer(),
  tbl(["Active Cards", "Avg Monthly Spend/Card", "Rate", "Monthly Revenue"], [
    ["300 cards (100 churches × 3 cards)", "$1,500", "1.2%", "$5,400"],
    ["900 cards (300 churches × 3 cards)", "$1,500", "1.2%", "$16,200"],
    ["3,000 cards (1,000 churches × 3 cards)", "$1,500", "1.2%", "$54,000"],
  ]),
  spacer(),
  bold("At 1,000 churches with active banking: $54,000/month = $648,000/year in passive interchange revenue alone."),
  body("This revenue is entirely passive — it requires no additional sales effort. Every time a pastor buys coffee for a counseling meeting or a church admin orders supplies, The Exchange earns money."),
  spacer(),

  h2("Investment Thesis"),
  quote('"The Exchange is the first platform to combine the full stack of church operations, giving, banking, debit cards, and community into a single faith-aligned ecosystem at a price churches can afford — positioned to become the financial infrastructure for the global Church."'),
  spacer(),
  bullet("Massive, underserved market: $700B+ global Christian giving"),
  bullet("Production-ready platform with 20 live feature modules"),
  bullet("15 identified revenue streams with clear path to $5M+ ARR at 1,000 churches"),
  bullet("$29 Basic plan as primary growth driver — low CAC, 1% transaction fee is the real revenue"),
  bullet("$500K seed fully allocated: $180K team + $70K product + $250K targeted marketing"),
  bullet("Debit card interchange (Unit Banking): $648K/year passive revenue at scale"),
  bullet("Advisor Network ($150/month): acts as revenue engine and 100-person sales force"),
  bullet("AI credit model captures pay-as-you-go revenue from heavy users"),
  bullet("Mission-aligned brand with theological depth and global scalability"),
  bullet("Network effects + banking lock-in create compounding defensibility over time"),
  spacer(),
  divider(),
  spacer(),
  new Paragraph({
    children: [new TextRun({ text: "Strategic Advisor", size: 22, bold: true, font: "Calibri", color: "1f2937" })],
    spacing: { before: 80, after: 80 },
  }),
  bold("Shawn Fair — Founder & Business + Financial Strategist"),
  body("Fair Stewardship Group | Faith-Based Financial Strategy | Investment Education | Stewardship Consulting"),
  body("Phone: (586) 248-1966 | shawn@fairstewardshipgroup.com"),
  spacer(),
  new Paragraph({
    children: [new TextRun({ text: '"I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you." — Psalm 32:8', size: 20, italics: true, font: "Calibri", color: "6b7280" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
  }),
  spacer(),
  new Paragraph({
    children: [new TextRun({ text: "Confidential — For Investor Review Only", size: 20, italics: true, font: "Calibri", color: "9ca3af" })],
    alignment: AlignmentType.CENTER,
  }),
];

// ─── Build Document ───────────────────────────────────────────────────────────
const doc = new Document({
  creator: "The Exchange App",
  title: "The Exchange App — Investor Business Plan",
  description: "Comprehensive investor business plan for The Exchange faith-based platform",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
      heading1: {
        run: { font: "Calibri", size: 40, bold: true, color: "059669" },
        paragraph: {
          spacing: { before: 480, after: 200 },
          border: { bottom: { color: "10b981", size: 6, space: 4, style: BorderStyle.SINGLE } },
        },
      },
      heading2: {
        run: { font: "Calibri", size: 28, bold: true, color: "1f2937" },
        paragraph: { spacing: { before: 320, after: 120 } },
      },
      heading3: {
        run: { font: "Calibri", size: 24, bold: true, color: "059669" },
        paragraph: { spacing: { before: 240, after: 80 } },
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
            left: convertInchesToTwip(1),
          },
        },
      },
      children: [
        ...titlePage,
        ...execSummary,
        ...theProblem,
        ...pricingPlans,
        ...bankingCard,
        ...aiCredits,
        ...growthStrategy,
        ...allRevenue,
        ...features,
        ...market,
        ...defensibility,
        ...domainBrand,
        ...legal,
        ...roadmapMetrics,
        ...investorQA,
        ...investmentAsk,
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUTPUT_PATH, buffer);
console.log(`✅ DOCX written to: ${OUTPUT_PATH}`);
console.log(`   File size: ${(buffer.length / 1024).toFixed(1)} KB`);
