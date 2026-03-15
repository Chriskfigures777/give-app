/**
 * The Exchange App — Investor Financial Model v4
 * Generates "Exchange App - Investor Model v4.xlsx"
 *
 * Key corrections vs v3:
 *  - Removes the unrealistic $600K Year 1 transaction-fee projection
 *  - Replaces it with a realistic church-count × avg-giving ramp
 *  - $500K investment stewarded over 18–24 months, not burned in 12
 *  - Adds $89/mo All-In Plan (giving + payroll + per-employee fee)
 *  - Adds Cost Per Lead / Cost Per Conversion sheet
 *  - Founder salaries locked: Christopher $3K, Shawn $3K, Nathan $3K
 *  - $300K ARR milestone = capital replacement event (~Month 9–11)
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'Exchange App - Investor Model v4.xlsx');

// ─────────────────────────────────────────────
// BRAND COLORS
// ─────────────────────────────────────────────
const GREEN       = '059669';
const DARK_GREEN  = '047857';
const LIGHT_GREEN = 'D1FAE5';
const GOLD        = 'F59E0B';
const LIGHT_GOLD  = 'FEF3C7';
const BLUE        = '3B82F6';
const LIGHT_BLUE  = 'DBEAFE';
const GRAY_LIGHT  = 'F3F4F6';
const GRAY_MID    = 'E5E7EB';
const WHITE       = 'FFFFFF';
const BLACK       = '111827';
const RED         = 'DC2626';

// ─────────────────────────────────────────────
// HELPER: style helpers
// ─────────────────────────────────────────────
const fill   = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const font   = (bold = false, size = 11, color = BLACK, name = 'Calibri') =>
  ({ name, size, bold, color: { argb: color } });
const border = () => ({
  top:    { style: 'thin', color: { argb: GRAY_MID } },
  left:   { style: 'thin', color: { argb: GRAY_MID } },
  bottom: { style: 'thin', color: { argb: GRAY_MID } },
  right:  { style: 'thin', color: { argb: GRAY_MID } },
});
const align  = (h = 'left', v = 'middle', wrap = false) =>
  ({ horizontal: h, vertical: v, wrapText: wrap });
const money  = '"$"#,##0';
const moneyK = '"$"#,##0.0';
const pct    = '0.0%';
const num    = '#,##0';

function styleHeader(ws, row, cols, bgColor = GREEN, fgColor = WHITE, size = 11) {
  for (let c = 1; c <= cols; c++) {
    const cell = ws.getRow(row).getCell(c);
    cell.fill  = fill(bgColor);
    cell.font  = font(true, size, fgColor);
    cell.border = border();
    cell.alignment = align('center');
  }
}

function styleRow(ws, row, cols, bgColor = WHITE, bold = false, fgColor = BLACK) {
  for (let c = 1; c <= cols; c++) {
    const cell = ws.getRow(row).getCell(c);
    cell.fill   = fill(bgColor);
    cell.font   = font(bold, 11, fgColor);
    cell.border = border();
  }
}

function setVal(ws, r, c, val, fmt) {
  const cell = ws.getRow(r).getCell(c);
  cell.value = val;
  if (fmt) cell.numFmt = fmt;
}

function addSectionTitle(ws, row, text, cols, bg = DARK_GREEN) {
  const cell = ws.getRow(row).getCell(1);
  ws.mergeCells(row, 1, row, cols);
  cell.value = text;
  cell.fill  = fill(bg);
  cell.font  = font(true, 13, WHITE);
  cell.alignment = align('left', 'middle');
  cell.border = border();
}

// ─────────────────────────────────────────────
// CORE DATA
// ─────────────────────────────────────────────

// Pricing tiers
const BASIC_PRICE   = 29;   // $29/mo
const PRO_PRICE     = 49;   // $49/mo
const ALLIN_PRICE   = 89;   // $89/mo — ALL incoming giving + payroll + 1% txn fee
const ADVISOR_PRICE = 150;  // $150/mo (Phase 4)
const EMP_FEE       = 12;   // $12/employee beyond the 3 included in All-In
const AVG_EMP_OVERAGE = 4;  // avg additional employees above included 3
const TXN_FEE_PCT   = 0.01; // 1% on all giving processed
const AVG_GIVING    = 12500; // avg monthly giving per church (conservative)

// Church growth: monthly paying-church counts (Year 1, 12 months)
const Y1_CHURCHES = [0, 15, 30, 50, 70, 90, 110, 130, 150, 165, 180, 200];

// Plan mix (% of paying churches on each plan)
const PCT_BASIC   = 0.40;
const PCT_PRO     = 0.35;
const PCT_ALLIN   = 0.25;  // All-In plan (was "Pro+Payroll" in v3)

// Year 2 and Year 3 church counts (end-of-year)
const Y2_END = 450;
const Y3_END = 900;

// Founder salaries
const FOUNDERS = [
  { name: 'Christopher', title: 'CEO / Chief Product Officer',             monthly: 3000 },
  { name: 'Shawn',       title: 'CFO / Business & Financial Strategist',   monthly: 3000 },
  { name: 'Nathan',      title: 'CTO / Backend Developer & Security Lead', monthly: 3000 },
];

// ─────────────────────────────────────────────
// REVENUE CALC HELPERS
// ─────────────────────────────────────────────
function mrrAt(churches) {
  const basic      = Math.round(churches * PCT_BASIC)   * BASIC_PRICE;
  const pro        = Math.round(churches * PCT_PRO)     * PRO_PRICE;
  const allIn      = Math.round(churches * PCT_ALLIN)   * ALLIN_PRICE;
  const empFees    = Math.round(churches * PCT_ALLIN)   * AVG_EMP_OVERAGE * EMP_FEE;
  const txnFees    = churches * AVG_GIVING * TXN_FEE_PCT;
  const subs       = basic + pro + allIn;
  const totalMRR   = subs + empFees + txnFees;
  return { basic, pro, allIn, empFees, txnFees, subs, totalMRR };
}

// Fixed monthly operating costs (exclusive of ads, which ramp)
const FIXED_MONTHLY = {
  founderSalaries:  9000,   // $3K × 3 founders
  techStack:        1106,   // from v3 Tech Stack sheet
  legalAdmin:       1000,
  miscBuffer:        500,
};
const FIXED_TOTAL = Object.values(FIXED_MONTHLY).reduce((a, b) => a + b, 0); // $11,606

// Ad spend ramp by phase
function adSpendAt(month) {
  if (month <= 3)  return 5000;
  if (month <= 6)  return 10000;
  if (month <= 12) return 15000;
  if (month <= 18) return 20000;
  return 25000;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function buildWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'The Exchange App';
  wb.created  = new Date();
  wb.modified = new Date();

  buildDashboard(wb);
  buildTeamCapacity(wb);
  buildPricingPlans(wb);
  buildYearOnePnL(wb);
  buildThreeYearPnL(wb);
  buildInvestmentStewardship(wb);
  buildCostPerLead(wb);
  buildTechStack(wb);
  buildLaunchRoadmap(wb);

  await wb.xlsx.writeFile(OUTPUT_PATH);
  console.log(`✅  Saved: ${OUTPUT_PATH}`);
}

// ─────────────────────────────────────────────
// SHEET 1: DASHBOARD
// ─────────────────────────────────────────────
function buildDashboard(wb) {
  const ws = wb.addWorksheet('Dashboard', { properties: { tabColor: { argb: GREEN } } });
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  ws.columns = [
    { width: 32 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 },
  ];

  // Title block
  ws.mergeCells('A1:F1');
  ws.getCell('A1').value = 'THE EXCHANGE APP — INVESTOR MODEL v4';
  ws.getCell('A1').fill  = fill(GREEN);
  ws.getCell('A1').font  = font(true, 18, WHITE);
  ws.getCell('A1').alignment = align('center', 'middle');
  ws.getRow(1).height = 38;

  ws.mergeCells('A2:F2');
  ws.getCell('A2').value = 'Digital Infrastructure for the Global Church Economy  |  Revised: Conservative Projections | $500K Investment Stewarded Over 18–24 Months';
  ws.getCell('A2').fill  = fill(DARK_GREEN);
  ws.getCell('A2').font  = font(false, 10, WHITE);
  ws.getCell('A2').alignment = align('center', 'middle');
  ws.getRow(2).height = 20;

  ws.getRow(3).height = 8;

  // ── Section: Pricing Plans ──
  let r = 4;
  addSectionTitle(ws, r, '  PRICING PLANS', 6); r++;

  const phHdrs = ['Plan', 'Monthly Price', 'Includes', 'Per-Employee Fee', '1% Transaction Fee', 'AI Credits/Mo'];
  styleHeader(ws, r, 6, GREEN, WHITE, 10);
  ['A','B','C','D','E','F'].forEach((col, i) => {
    ws.getCell(`${col}${r}`).value = phHdrs[i];
  });
  r++;

  const plans = [
    ['Basic',              '$29/mo',  'Giving, CRM, Surveys, Notes, Goals, Events, 50 AI credits',     '—',          'Yes (1%)', '50'],
    ['Pro',                '$49/mo',  'Basic + Website Builder, Banking, Broadcast, Campaigns',         '—',          'Yes (1%)', '200'],
    ['All-In (Payroll)',   '$89/mo',  'Pro + All Incoming Giving + Payroll (3 emp included)',            '$12/emp',    'Yes (1%)', '200'],
    ['Advisor Network',   '$150/mo', 'All-In + Multi-Org Dashboard, Priority Support, Debit Card',     '—',          'Yes (1%)', '500'],
  ];
  const planBgs = [GRAY_LIGHT, WHITE, LIGHT_GOLD, LIGHT_BLUE];
  plans.forEach((row, i) => {
    styleRow(ws, r, 6, planBgs[i], i === 2);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      cell.alignment = align('left', 'middle', true);
    });
    if (i === 2) {
      ws.getRow(r).getCell(1).font = font(true, 11, DARK_GREEN);
    }
    ws.getRow(r).height = 32;
    r++;
  });

  r++;  // spacer

  // ── Section: 3-Year Snapshot ──
  addSectionTitle(ws, r, '  3-YEAR INVESTOR SNAPSHOT (Conservative)', 6); r++;
  styleHeader(ws, r, 6, GREEN, WHITE, 10);
  const snapHdrs = ['Metric', 'Year 1 (200 churches)', 'Year 2 (450 churches)', 'Year 3 (900 churches)', 'Notes', ''];
  snapHdrs.forEach((h, i) => { ws.getRow(r).getCell(i + 1).value = h; });
  r++;

  const y1m = mrrAt(Y1_CHURCHES[11]);  // 200 churches
  const y2m = mrrAt(Y2_END);
  const y3m = mrrAt(Y3_END);

  const snapRows = [
    ['Churches (End of Year)',           200,           450,           900,       'Conservative growth ramp'],
    ['Avg Monthly Giving / Church',   12500,         14000,         16000,       'Realistic avg congregation size'],
    ['Subscription MRR',        y1m.subs,    y2m.subs,    y3m.subs,    '$29 / $49 / $89 blended'],
    ['Employee Fee MRR',      y1m.empFees, y2m.empFees, y3m.empFees, '$12/emp × avg 4 extra (All-In churches)'],
    ['1% Transaction Fee MRR', y1m.txnFees, y2m.txnFees, y3m.txnFees,'1% of avg giving × church count'],
    ['TOTAL MRR',          y1m.totalMRR, y2m.totalMRR, y3m.totalMRR,'Full platform monthly revenue'],
    ['TOTAL ARR',     y1m.totalMRR * 12, y2m.totalMRR * 12, y3m.totalMRR * 12, 'Annualized run-rate'],
    ['Monthly Operating Costs',       17500,         21000,         32000,       'Salaries + tech + legal + ads'],
    ['Monthly Net Income',  y1m.totalMRR - 17500, y2m.totalMRR - 21000, y3m.totalMRR - 32000, 'After all costs'],
    ['$300K ARR Milestone',          'Month 9–11',  'Achieved',    'Achieved',   'Capital replacement event'],
  ];

  const mFmtCols  = new Set([2, 3, 4]);
  const boldRows  = new Set([5, 6, 8]);

  snapRows.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg, boldRows.has(idx));
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (mFmtCols.has(ci + 1) && typeof val === 'number') {
        cell.numFmt = money;
        cell.alignment = align('right', 'middle');
      } else {
        cell.alignment = align('left', 'middle');
      }
    });
    if (boldRows.has(idx)) {
      for (let c = 1; c <= 6; c++) {
        ws.getRow(r).getCell(c).font = font(true, 11, DARK_GREEN);
      }
    }
    r++;
  });

  r++;  // spacer

  // ── Section: Seed Investment Allocation ──
  addSectionTitle(ws, r, '  $500,000 SEED INVESTMENT — STEWARDSHIP ALLOCATION (18 Months)', 6); r++;
  styleHeader(ws, r, 6, GREEN, WHITE, 10);
  ['Category', 'Monthly', 'Months', 'Subtotal', '% of Seed', 'Notes'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const fundRows = [
    ['Christopher — CEO',            3000, 18,  54000, 0.108, 'Founder salary'],
    ['Shawn — CFO/Strategist',       3000, 18,  54000, 0.108, 'Founder salary'],
    ['Nathan — CTO/Dev',             3000, 18,  54000, 0.108, 'Founder salary'],
    ['Product Dev (one-time)',        null, null, 49000, 0.098, 'Mobile app, QA, security audit'],
    ['Facebook + YouTube Ads',       null, null, 200000, 0.400, 'Ramps $5K→$25K/mo over 18 months'],
    ['Ministry Conferences (3)',      null, null,  15000, 0.030, 'Phase 3 in-person events'],
    ['Podcast Sponsorships',          null, null,  12000, 0.024, 'Faith-based podcast network'],
    ['Legal / Compliance',            null, null,  18000, 0.036, '$1,000/mo × 18 months'],
    ['Tech Stack & Misc Buffer',      null, null,  44000, 0.088, '$1,106/mo × 18 + contingency'],
    ['TOTAL ALLOCATED',               null, null, 500000, 1.000, ''],
  ];

  fundRows.forEach((row, idx) => {
    const isTotalRow = idx === fundRows.length - 1;
    const bg = isTotalRow ? LIGHT_GREEN : (idx % 2 === 0 ? GRAY_LIGHT : WHITE);
    styleRow(ws, r, 6, bg, isTotalRow);
    [row[0], row[1], row[2], row[3], row[4], row[5]].forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci === 1 && val != null) { cell.numFmt = money; cell.alignment = align('right'); }
      if (ci === 3 && val != null) { cell.numFmt = money; cell.alignment = align('right'); }
      if (ci === 4 && val != null) { cell.numFmt = pct;   cell.alignment = align('right'); }
      else                          { cell.alignment = align('left'); }
    });
    if (isTotalRow) {
      for (let c = 1; c <= 6; c++) ws.getRow(r).getCell(c).font = font(true, 11, DARK_GREEN);
    }
    r++;
  });

  ws.getRow(r + 1).height = 8;
}

// ─────────────────────────────────────────────
// SHEET 2: TEAM & CAPACITY
// ─────────────────────────────────────────────
function buildTeamCapacity(wb) {
  const ws = wb.addWorksheet('Team & Capacity', { properties: { tabColor: { argb: DARK_GREEN } } });
  ws.columns = [
    { width: 30 }, { width: 28 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 24 },
  ];

  let r = 1;
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = 'TEAM & CAPACITY MODEL';
  ws.getCell(`A${r}`).fill  = fill(GREEN);
  ws.getCell(`A${r}`).font  = font(true, 16, WHITE);
  ws.getCell(`A${r}`).alignment = align('center');
  ws.getRow(r).height = 34; r++;

  r++; // spacer
  addSectionTitle(ws, r, '  FOUNDING TEAM — COMPENSATION', 6); r++;
  styleHeader(ws, r, 6);
  ['Name', 'Role', 'Monthly Salary', 'Annual Cost', 'Seed Coverage', 'Primary Focus'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  FOUNDERS.forEach((f, idx) => {
    styleRow(ws, r, 6, idx % 2 === 0 ? GRAY_LIGHT : WHITE);
    const coverage = `${Math.round(f.monthly * 18 / 1000)}K (18 mo)`;
    [f.name, f.title, f.monthly, f.monthly * 12, coverage,
     idx === 0 ? 'Product, Marketing, Launch Strategy'
   : idx === 1 ? 'Sales, Church Sign-Up Calls, Client Relations'
   :             'Backend Dev, API Integrations, Security'
    ].forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci === 2) { cell.numFmt = money; cell.alignment = align('right'); }
      if (ci === 3) { cell.numFmt = money; cell.alignment = align('right'); }
      else cell.alignment = align('left');
    });
    r++;
  });

  // Total row
  styleRow(ws, r, 6, LIGHT_GREEN, true);
  ['TOTAL FOUNDER PAYROLL', '', 9000, 108000, '$162K (18 mo)', 'Seed-funded through Month 18'].forEach((val, ci) => {
    const cell = ws.getRow(r).getCell(ci + 1);
    cell.value = val;
    cell.font  = font(true, 11, DARK_GREEN);
    if (ci === 2) { cell.numFmt = money; cell.alignment = align('right'); }
    if (ci === 3) { cell.numFmt = money; cell.alignment = align('right'); }
    else cell.alignment = align('left');
  });
  r += 2;

  // ── Capacity allocation ──
  addSectionTitle(ws, r, '  CAPACITY ALLOCATION (%)', 6); r++;
  styleHeader(ws, r, 6);
  ['Person', 'Product Dev', 'Sales / BD', 'Client Onboarding', 'Marketing', 'Ops / Admin'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const capacityData = [
    ['Christopher', 0.55, 0.05, 0.15, 0.20, 0.05],
    ['Shawn',       0.00, 0.70, 0.15, 0.05, 0.10],
    ['Nathan',      0.45, 0.00, 0.20, 0.00, 0.35],
  ];
  capacityData.forEach((row, idx) => {
    styleRow(ws, r, 6, idx % 2 === 0 ? GRAY_LIGHT : WHITE);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci > 0) { cell.numFmt = '0%'; cell.alignment = align('center'); }
      else cell.alignment = align('left');
    });
    r++;
  });
  r++;

  // ── Hiring triggers ──
  addSectionTitle(ws, r, '  HIRING ROADMAP (Revenue-Funded, Not Seed-Funded)', 6); r++;
  styleHeader(ws, r, 6);
  ['Trigger', 'Role', 'Est. Monthly Cost', 'Funding Source', 'Priority', 'Notes'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const hiringData = [
    ['100–150 paying churches', 'Onboarding Specialist',    4000,  'From revenue',   'HIGH',   'Reduces founder onboarding load'],
    ['200–300 churches',        'Marketing Manager/Agency', 8000,  'From revenue',   'MED',    'Could be Mike King or equiv.'],
    ['300–500 churches',        'Customer Success Rep',     4000,  'From revenue',   'MED',    'Retention + upsell focus'],
    ['Phase 3 launch',          'Security Audit (1×)',      15000, 'One-time buffer','HIGH',   'Before banking feature launch'],
    ['500+ churches',           'Additional Backend Dev',   7000,  'From revenue',   'LOW',    'When Nathan at capacity'],
  ];
  hiringData.forEach((row, idx) => {
    styleRow(ws, r, 6, idx % 2 === 0 ? GRAY_LIGHT : WHITE);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci === 2) { cell.numFmt = money; cell.alignment = align('right'); }
      else cell.alignment = align('left', 'middle', true);
    });
    ws.getRow(r).height = 28;
    r++;
  });
}

// ─────────────────────────────────────────────
// SHEET 3: PRICING PLANS (DETAILED)
// ─────────────────────────────────────────────
function buildPricingPlans(wb) {
  const ws = wb.addWorksheet('Pricing Plans', { properties: { tabColor: { argb: GOLD } } });
  ws.columns = [{ width: 28 }, { width: 14 }, { width: 14 }, { width: 20 }, { width: 14 }, { width: 30 }];

  let r = 1;
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = 'PRICING PLANS — DETAILED BREAKDOWN';
  ws.getCell(`A${r}`).fill  = fill(GOLD);
  ws.getCell(`A${r}`).font  = font(true, 16, WHITE);
  ws.getCell(`A${r}`).alignment = align('center');
  ws.getRow(r).height = 34; r += 2;

  // ── Revenue at church counts ──
  addSectionTitle(ws, r, '  REVENUE EXAMPLES: WHAT X CHURCHES ON EACH PLAN EARNS', 6, DARK_GREEN); r++;
  styleHeader(ws, r, 6);
  ['Plan', 'Price', '50 Churches', '100 Churches', '200 Churches', 'Annual at 200'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const planCalcs = [
    { plan: 'Basic',          price: BASIC_PRICE,   desc: '$29/mo' },
    { plan: 'Pro',            price: PRO_PRICE,     desc: '$49/mo' },
    { plan: 'All-In (Payroll+Giving)', price: ALLIN_PRICE, desc: '$89/mo' },
    { plan: 'All-In + Emp Fee ($12×4 avg)', price: ALLIN_PRICE + EMP_FEE * AVG_EMP_OVERAGE, desc: '$137/mo blended' },
    { plan: 'Advisor Network', price: ADVISOR_PRICE, desc: '$150/mo' },
    { plan: '1% Transaction Fee (avg $12.5K giving)', price: AVG_GIVING * TXN_FEE_PCT, desc: '$125/church/mo' },
  ];

  planCalcs.forEach((p, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg);
    [p.plan, p.desc, p.price * 50, p.price * 100, p.price * 200, p.price * 200 * 12].forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci >= 2) { cell.numFmt = money; cell.alignment = align('right'); }
      else cell.alignment = align('left');
    });
    r++;
  });

  r++;
  // ── All-In Plan detail ──
  addSectionTitle(ws, r, '  ALL-IN PLAN ($89/mo) — WHAT\'S INCLUDED', 6, DARK_GREEN); r++;
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value =
    'The $89/mo All-In Plan is the most powerful offering: it includes the full Pro plan (website, banking, CRM, broadcast), ' +
    'ALL incoming church giving processed through the platform (1% transaction fee applies), AND a built-in payroll system. ' +
    'The first 3 employees are included. Each additional employee beyond 3 is $12/month. ' +
    'This is the stickiest plan — once a church runs payroll tied to their banking account, switching cost is extremely high.';
  ws.getCell(`A${r}`).alignment = align('left', 'middle', true);
  ws.getCell(`A${r}`).fill  = fill(LIGHT_GOLD);
  ws.getCell(`A${r}`).font  = font(false, 11, BLACK);
  ws.getRow(r).height = 64;
  r += 2;

  styleHeader(ws, r, 6, GOLD, WHITE);
  ['Feature', 'Basic $29', 'Pro $49', 'All-In $89', 'Advisor $150', 'Notes'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const featureMatrix = [
    ['Online Giving (1% fee)',      '✅', '✅', '✅', '✅', '1% of all donations processed'],
    ['CRM + Member Management',     '✅', '✅', '✅', '✅', 'Full contact & engagement tracking'],
    ['Surveys + Notes + Goals',     '✅', '✅', '✅', '✅', 'Church ops tools'],
    ['Events + Calendar',           '✅', '✅', '✅', '✅', 'Event management'],
    ['50 AI Credits/mo',            '✅', '—',  '—',  '—',  'Basic AI usage'],
    ['200 AI Credits/mo',           '—',  '✅', '✅', '—',  'Pro AI usage'],
    ['500 AI Credits/mo',           '—',  '—',  '—',  '✅', 'Advisor AI usage'],
    ['Website Builder + Domain',    '—',  '✅', '✅', '✅', 'Custom church website'],
    ['Broadcast + Campaigns',       '—',  '✅', '✅', '✅', 'SMS + email broadcasts'],
    ['Embedded Banking (Unit)',     '—',  '✅', '✅', '✅', 'FDIC-insured accounts'],
    ['Debit Card Issuance',         '—',  '—',  '✅', '✅', 'Church debit cards'],
    ['Payroll Processing (3 emp)', '—',  '—',  '✅', '✅', '$89/mo includes 3 staff'],
    ['Add\'l Employee Fee',         '—',  '—',  '$12/emp', '$12/emp', 'Per employee beyond 3 included'],
    ['Multi-Org Dashboard',         '—',  '—',  '—',  '✅', 'Advisor sees all orgs'],
    ['Priority Support',            '—',  '—',  '—',  '✅', 'Dedicated support lane'],
    ['Advisor Profile + Network',   '—',  '—',  '—',  '✅', 'Faith financial advisor directory'],
  ];

  featureMatrix.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (val === '✅') { cell.font = font(true, 11, DARK_GREEN); cell.alignment = align('center'); }
      else if (val === '—') { cell.font = font(false, 11, 'AAAAAA'); cell.alignment = align('center'); }
      else cell.alignment = align('left', 'middle', true);
    });
    ws.getRow(r).height = 22;
    r++;
  });
}

// ─────────────────────────────────────────────
// SHEET 4: MONTHLY P&L — YEAR 1
// ─────────────────────────────────────────────
function buildYearOnePnL(wb) {
  const ws = wb.addWorksheet('Monthly P&L — Year 1', { properties: { tabColor: { argb: BLUE } } });
  ws.columns = [
    { width: 26 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 16 },
  ];

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','FY Total'];

  let r = 1;
  ws.mergeCells(`A${r}:N${r}`);
  ws.getCell(`A${r}`).value = 'MONTHLY P&L — YEAR 1 (Conservative)';
  ws.getCell(`A${r}`).fill  = fill(BLUE);
  ws.getCell(`A${r}`).font  = font(true, 16, WHITE);
  ws.getCell(`A${r}`).alignment = align('center');
  ws.getRow(r).height = 34; r += 2;

  // Header row
  styleHeader(ws, r, 14, BLUE, WHITE);
  ws.getRow(r).getCell(1).value = 'Line Item';
  months.forEach((m, i) => { ws.getRow(r).getCell(i + 2).value = m; });
  r++;

  // Church count row
  styleRow(ws, r, 14, LIGHT_BLUE, true);
  ws.getRow(r).getCell(1).value = '# Paying Churches';
  let yrTotalChurches = 0;
  Y1_CHURCHES.forEach((c, i) => {
    ws.getRow(r).getCell(i + 2).value = c;
    ws.getRow(r).getCell(i + 2).alignment = align('center');
    yrTotalChurches += c;
  });
  ws.getRow(r).getCell(14).value = '(avg ' + Math.round(yrTotalChurches / 12) + ')';
  ws.getRow(r).getCell(14).alignment = align('center');
  r++;

  // ── REVENUE rows ──
  const revenueLines = [
    {
      label: 'Basic Plan ($29/mo)',
      calc: (c) => Math.round(c * PCT_BASIC) * BASIC_PRICE,
    },
    {
      label: 'Pro Plan ($49/mo)',
      calc: (c) => Math.round(c * PCT_PRO) * PRO_PRICE,
    },
    {
      label: 'All-In Plan ($89/mo)',
      calc: (c) => Math.round(c * PCT_ALLIN) * ALLIN_PRICE,
    },
    {
      label: 'Employee Fee Add-On ($12/emp)',
      calc: (c) => Math.round(c * PCT_ALLIN) * AVG_EMP_OVERAGE * EMP_FEE,
    },
    {
      label: '1% Transaction Fee on Giving',
      calc: (c) => Math.round(c * AVG_GIVING * TXN_FEE_PCT),
    },
  ];

  addSectionTitle(ws, r, '  REVENUE', 14); r++;

  let revenueByMonth = Array(12).fill(0);
  revenueLines.forEach((line, lineIdx) => {
    const bg = lineIdx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 14, bg);
    ws.getRow(r).getCell(1).value = line.label;
    let total = 0;
    Y1_CHURCHES.forEach((c, i) => {
      const val = line.calc(c);
      ws.getRow(r).getCell(i + 2).value = val;
      ws.getRow(r).getCell(i + 2).numFmt = money;
      ws.getRow(r).getCell(i + 2).alignment = align('right');
      total += val;
      revenueByMonth[i] += val;
    });
    ws.getRow(r).getCell(14).value = total;
    ws.getRow(r).getCell(14).numFmt = money;
    ws.getRow(r).getCell(14).alignment = align('right');
    r++;
  });

  // Total Revenue
  styleRow(ws, r, 14, LIGHT_GREEN, true);
  ws.getRow(r).getCell(1).value = 'TOTAL REVENUE';
  ws.getRow(r).getCell(1).font  = font(true, 11, DARK_GREEN);
  let totalRevFY = 0;
  revenueByMonth.forEach((val, i) => {
    ws.getRow(r).getCell(i + 2).value = val;
    ws.getRow(r).getCell(i + 2).numFmt = money;
    ws.getRow(r).getCell(i + 2).font  = font(true, 11, DARK_GREEN);
    ws.getRow(r).getCell(i + 2).alignment = align('right');
    totalRevFY += val;
  });
  ws.getRow(r).getCell(14).value = totalRevFY;
  ws.getRow(r).getCell(14).numFmt = money;
  ws.getRow(r).getCell(14).font = font(true, 11, DARK_GREEN);
  ws.getRow(r).getCell(14).alignment = align('right');
  r++;

  // ── COSTS rows ──
  addSectionTitle(ws, r, '  OPERATING COSTS', 14); r++;

  const costLines = [
    { label: 'Founder Salaries (3×$3K)',  calc: () => 9000 },
    { label: 'Tech Stack',                calc: () => 1106 },
    { label: 'Legal + Admin',             calc: () => 1000 },
    { label: 'Misc / Contingency',        calc: () => 500  },
    { label: 'Facebook + YouTube Ads',    calc: (_, mo) => adSpendAt(mo) },
  ];

  let costByMonth = Array(12).fill(0);
  costLines.forEach((line, lineIdx) => {
    const bg = lineIdx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 14, bg);
    ws.getRow(r).getCell(1).value = line.label;
    let total = 0;
    Y1_CHURCHES.forEach((c, i) => {
      const val = line.calc(c, i + 1);
      ws.getRow(r).getCell(i + 2).value = val;
      ws.getRow(r).getCell(i + 2).numFmt = money;
      ws.getRow(r).getCell(i + 2).alignment = align('right');
      total += val;
      costByMonth[i] += val;
    });
    ws.getRow(r).getCell(14).value = total;
    ws.getRow(r).getCell(14).numFmt = money;
    ws.getRow(r).getCell(14).alignment = align('right');
    r++;
  });

  // Total Costs
  styleRow(ws, r, 14, LIGHT_BLUE, true);
  ws.getRow(r).getCell(1).value = 'TOTAL OPERATING COSTS';
  ws.getRow(r).getCell(1).font  = font(true, 11, BLUE);
  let totalCostFY = 0;
  costByMonth.forEach((val, i) => {
    ws.getRow(r).getCell(i + 2).value = val;
    ws.getRow(r).getCell(i + 2).numFmt = money;
    ws.getRow(r).getCell(i + 2).font  = font(true, 11, BLUE);
    ws.getRow(r).getCell(i + 2).alignment = align('right');
    totalCostFY += val;
  });
  ws.getRow(r).getCell(14).value = totalCostFY;
  ws.getRow(r).getCell(14).numFmt = money;
  ws.getRow(r).getCell(14).font = font(true, 11, BLUE);
  ws.getRow(r).getCell(14).alignment = align('right');
  r += 2;

  // ── NET INCOME ──
  styleRow(ws, r, 14, LIGHT_GREEN, true);
  ws.getRow(r).getCell(1).value = 'NET INCOME (LOSS)';
  ws.getRow(r).getCell(1).font  = font(true, 12, DARK_GREEN);
  let totalNetFY = 0;
  revenueByMonth.forEach((rev, i) => {
    const net = rev - costByMonth[i];
    ws.getRow(r).getCell(i + 2).value = net;
    ws.getRow(r).getCell(i + 2).numFmt = money;
    ws.getRow(r).getCell(i + 2).font  = font(true, 12, net >= 0 ? DARK_GREEN : RED);
    ws.getRow(r).getCell(i + 2).alignment = align('right');
    totalNetFY += net;
  });
  ws.getRow(r).getCell(14).value = totalNetFY;
  ws.getRow(r).getCell(14).numFmt = money;
  ws.getRow(r).getCell(14).font  = font(true, 12, totalNetFY >= 0 ? DARK_GREEN : RED);
  ws.getRow(r).getCell(14).alignment = align('right');
  r += 2;

  // ── Cumulative Cash ──
  styleRow(ws, r, 14, LIGHT_GOLD, true);
  ws.getRow(r).getCell(1).value = 'Cumulative Cash (from $500K seed)';
  ws.getRow(r).getCell(1).font  = font(true, 11, BLACK);
  let cash = 500000;
  revenueByMonth.forEach((rev, i) => {
    cash += (rev - costByMonth[i]);
    ws.getRow(r).getCell(i + 2).value = cash;
    ws.getRow(r).getCell(i + 2).numFmt = money;
    ws.getRow(r).getCell(i + 2).font  = font(true, 11, cash >= 400000 ? DARK_GREEN : cash >= 300000 ? BLACK : RED);
    ws.getRow(r).getCell(i + 2).alignment = align('right');
  });
  ws.getRow(r).getCell(14).value = '(end balance)';
  r += 2;

  // ── Break-even annotation ──
  ws.mergeCells(`A${r}:N${r}`);
  ws.getCell(`A${r}`).value =
    '📌  BREAK-EVEN NOTE: Monthly revenue first covers all operating costs around Month 9–10 ' +
    '(~150 churches). The $300K Annual Run-Rate milestone is reached around Month 10–11. ' +
    'The investment is never fully burned — remaining capital (~$200K+) transitions from survival ' +
    'budget to growth reserve.';
  ws.getCell(`A${r}`).alignment = align('left', 'middle', true);
  ws.getCell(`A${r}`).fill = fill(LIGHT_GREEN);
  ws.getCell(`A${r}`).font = font(false, 10, DARK_GREEN);
  ws.getRow(r).height = 52;
}

// ─────────────────────────────────────────────
// SHEET 5: 3-YEAR P&L
// ─────────────────────────────────────────────
function buildThreeYearPnL(wb) {
  const ws = wb.addWorksheet('3-Year P&L', { properties: { tabColor: { argb: DARK_GREEN } } });
  ws.columns = [
    { width: 36 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 },
  ];

  let r = 1;
  ws.mergeCells(`A${r}:E${r}`);
  ws.getCell(`A${r}`).value = '3-YEAR P&L SUMMARY (Realistic Projections)';
  ws.getCell(`A${r}`).fill  = fill(GREEN);
  ws.getCell(`A${r}`).font  = font(true, 16, WHITE);
  ws.getCell(`A${r}`).alignment = align('center');
  ws.getRow(r).height = 34; r += 2;

  styleHeader(ws, r, 5);
  ['Revenue Stream', 'Year 1 (200 ch.)', 'Year 2 (450 ch.)', 'Year 3 (900 ch.)', '3-Yr Total'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  // Revenue
  addSectionTitle(ws, r, '  REVENUE', 5); r++;

  // Average church count per year (using midpoint of ramp)
  const y1avg = Math.round(Y1_CHURCHES.reduce((a, b) => a + b, 0) / 12); // ~93
  const y2avg = Math.round((Y1_CHURCHES[11] + Y2_END) / 2);              // ~325
  const y3avg = Math.round((Y2_END + Y3_END) / 2);                       // ~675

  const revLines = [
    ['Basic Plan ($29/mo)', y1avg, y2avg, y3avg, (c) => Math.round(c * PCT_BASIC) * BASIC_PRICE * 12],
    ['Pro Plan ($49/mo)', y1avg, y2avg, y3avg, (c) => Math.round(c * PCT_PRO) * PRO_PRICE * 12],
    ['All-In Plan ($89/mo)', y1avg, y2avg, y3avg, (c) => Math.round(c * PCT_ALLIN) * ALLIN_PRICE * 12],
    ['Employee Fee ($12/emp×4 avg)', y1avg, y2avg, y3avg, (c) => Math.round(c * PCT_ALLIN) * AVG_EMP_OVERAGE * EMP_FEE * 12],
    ['1% Transaction Fee (avg giving)', y1avg, y2avg, y3avg, (c) => Math.round(c * AVG_GIVING * TXN_FEE_PCT * 12)],
    ['AI Credit Top-Ups', null, null, null, () => 0, [10800, 54000, 120000]],
    ['Website Hosting ($9.99/mo)', null, null, null, () => 0, [6000, 20000, 50000]],
    ['Banking Interchange (~1.2%)', null, null, null, () => 0, [0, 30000, 90000]],
    ['Advisor Network ($150/mo)', null, null, null, () => 0, [0, 0, 54000]],
  ];

  let totals = [0, 0, 0];
  revLines.forEach((line, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 5, bg);
    ws.getRow(r).getCell(1).value = line[0];
    const vals = line[6]
      ? line[6]
      : [line[4](y1avg), line[4](y2avg), line[4](y3avg)];
    vals.forEach(/** @param {number} v @param {number} vi */ (v, vi) => {
      ws.getRow(r).getCell(vi + 2).value = v;
      ws.getRow(r).getCell(vi + 2).numFmt = money;
      ws.getRow(r).getCell(vi + 2).alignment = align('right');
      totals[vi] += v;
    });
    const rowTotal = vals.reduce((a, b) => a + b, 0);
    ws.getRow(r).getCell(5).value = rowTotal;
    ws.getRow(r).getCell(5).numFmt = money;
    ws.getRow(r).getCell(5).alignment = align('right');
    r++;
  });

  // Total Revenue row
  styleRow(ws, r, 5, LIGHT_GREEN, true);
  ws.getRow(r).getCell(1).value = 'TOTAL REVENUE';
  ws.getRow(r).getCell(1).font  = font(true, 12, DARK_GREEN);
  let grandTotal = 0;
  totals.forEach((v, i) => {
    ws.getRow(r).getCell(i + 2).value = v;
    ws.getRow(r).getCell(i + 2).numFmt = money;
    ws.getRow(r).getCell(i + 2).font  = font(true, 12, DARK_GREEN);
    ws.getRow(r).getCell(i + 2).alignment = align('right');
    grandTotal += v;
  });
  ws.getRow(r).getCell(5).value = grandTotal;
  ws.getRow(r).getCell(5).numFmt = money;
  ws.getRow(r).getCell(5).font  = font(true, 12, DARK_GREEN);
  ws.getRow(r).getCell(5).alignment = align('right');
  r += 2;

  // Costs
  addSectionTitle(ws, r, '  OPERATING COSTS', 5); r++;
  styleHeader(ws, r, 5);
  ['Cost Line', 'Year 1', 'Year 2', 'Year 3', '3-Yr Total'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const costLines3 = [
    ['Founder Salaries (3×$3K/mo)',   108000, 108000, 108000],
    ['Facebook + YouTube Ads',         130000, 200000, 250000],
    ['Tech Stack (cloud, APIs, tools)',  13272,  18000,  28000],
    ['Legal + Admin',                   12000,  15000,  18000],
    ['Ministry Conferences',                 0,  15000,  20000],
    ['Product Dev (one-time)',           49000,      0,      0],
    ['Hired Roles (revenue-funded)',         0,  60000, 120000],
    ['Misc + Contingency',               6000,  10000,  15000],
  ];

  let ctotals = [0, 0, 0];
  costLines3.forEach((line, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 5, bg);
    ws.getRow(r).getCell(1).value = line[0];
    [line[1], line[2], line[3]].forEach((v, vi) => {
      ws.getRow(r).getCell(vi + 2).value = v;
      ws.getRow(r).getCell(vi + 2).numFmt = money;
      ws.getRow(r).getCell(vi + 2).alignment = align('right');
      ctotals[vi] += v;
    });
    ws.getRow(r).getCell(5).value = line[1] + line[2] + line[3];
    ws.getRow(r).getCell(5).numFmt = money;
    ws.getRow(r).getCell(5).alignment = align('right');
    r++;
  });

  styleRow(ws, r, 5, LIGHT_BLUE, true);
  ws.getRow(r).getCell(1).value = 'TOTAL COSTS';
  ws.getRow(r).getCell(1).font  = font(true, 12, BLUE);
  let ctotal3 = 0;
  ctotals.forEach((v, i) => {
    ws.getRow(r).getCell(i + 2).value = v;
    ws.getRow(r).getCell(i + 2).numFmt = money;
    ws.getRow(r).getCell(i + 2).font  = font(true, 12, BLUE);
    ws.getRow(r).getCell(i + 2).alignment = align('right');
    ctotal3 += v;
  });
  ws.getRow(r).getCell(5).value = ctotal3;
  ws.getRow(r).getCell(5).numFmt = money;
  ws.getRow(r).getCell(5).font  = font(true, 12, BLUE);
  ws.getRow(r).getCell(5).alignment = align('right');
  r += 2;

  // Net Income
  styleRow(ws, r, 5, LIGHT_GREEN, true);
  ws.getRow(r).getCell(1).value = 'NET INCOME';
  ws.getRow(r).getCell(1).font  = font(true, 13, DARK_GREEN);
  totals.forEach((rev, i) => {
    const net = rev - ctotals[i];
    ws.getRow(r).getCell(i + 2).value = net;
    ws.getRow(r).getCell(i + 2).numFmt = money;
    ws.getRow(r).getCell(i + 2).font  = font(true, 13, net >= 0 ? DARK_GREEN : RED);
    ws.getRow(r).getCell(i + 2).alignment = align('right');
  });
  ws.getRow(r).getCell(5).value = grandTotal - ctotal3;
  ws.getRow(r).getCell(5).numFmt = money;
  ws.getRow(r).getCell(5).font  = font(true, 13, DARK_GREEN);
  ws.getRow(r).getCell(5).alignment = align('right');
  r += 2;

  // Margin rows
  const marginData = [
    ['Gross Margin %', totals.map((rev, i) => (rev - ctotals[i]) / rev)],
    ['Break-Even Month', ['Month 9–10', 'Sustained', 'Sustained']],
    ['End-of-Year ARR', [mrrAt(200).totalMRR * 12, mrrAt(450).totalMRR * 12, mrrAt(900).totalMRR * 12]],
  ];
  marginData.forEach(([label, vals], idx) => {
    styleRow(ws, r, 5, idx % 2 === 0 ? GRAY_LIGHT : WHITE);
    ws.getRow(r).getCell(1).value = label;
    vals.forEach((v, vi) => {
      const cell = ws.getRow(r).getCell(vi + 2);
      cell.value = v;
      if (label.includes('%')) { cell.numFmt = pct; cell.alignment = align('right'); }
      else if (label.includes('ARR')) { cell.numFmt = money; cell.alignment = align('right'); }
      else cell.alignment = align('center');
    });
    r++;
  });
}

// ─────────────────────────────────────────────
// SHEET 6: INVESTMENT STEWARDSHIP
// ─────────────────────────────────────────────
function buildInvestmentStewardship(wb) {
  const ws = wb.addWorksheet('Investment Stewardship', { properties: { tabColor: { argb: GOLD } } });
  ws.columns = [
    { width: 30 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 28 },
  ];

  let r = 1;
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = '$500,000 INVESTMENT — 18-MONTH STEWARDSHIP PLAN';
  ws.getCell(`A${r}`).fill  = fill(GOLD);
  ws.getCell(`A${r}`).font  = font(true, 16, WHITE);
  ws.getCell(`A${r}`).alignment = align('center');
  ws.getRow(r).height = 34; r += 2;

  // ── Narrative ──
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value =
    'STEWARDSHIP PRINCIPLE: The $500K is not a 12-month burn rate. It is a 24-month stewardship fund. ' +
    'Ad spend ramps with church growth, not all upfront. By the time Annual Recurring Revenue reaches $300K ' +
    '(Month 9–11 at ~150 churches), the platform self-funds all monthly costs. The remaining investment capital ' +
    'shifts from survival to growth — funding conferences, podcast sponsorships, and the Phase 3 banking launch.';
  ws.getCell(`A${r}`).alignment = align('left', 'middle', true);
  ws.getCell(`A${r}`).fill = fill(LIGHT_GOLD);
  ws.getCell(`A${r}`).font = font(false, 11, BLACK);
  ws.getRow(r).height = 70;
  r += 2;

  styleHeader(ws, r, 6, GOLD, WHITE);
  ['Period', 'Founder Salaries', 'Ad Spend', 'Tech/Legal/Misc', 'Monthly Draw', 'Notes'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const stewardshipPeriods = [
    ['Months 1–3',   9000,  5000,  7500, 21500, 'Product dev spend + low ads while launching'],
    ['Months 4–6',   9000, 10000,  2500, 21500, 'Ads ramping; first paying churches coming in'],
    ['Months 7–9',   9000, 15000,  2500, 26500, 'Revenue offsetting ~$10K+/mo of costs'],
    ['Months 10–12', 9000, 15000,  2500, 26500, '$300K ARR hit — investment draw-down ends'],
    ['Months 13–15', 9000, 18000,  2500, 29500, 'Revenue fully covers ops; ads funded by income'],
    ['Months 16–18', 9000, 20000,  2500, 31500, 'Scale toward 450+ churches; remaining seed = buffer'],
  ];

  let cumulative = 0;
  stewardshipPeriods.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg);
    const [period, salaries, ads, tech, monthly, notes] = row;
    cumulative += Number(monthly) * 3;
    [period, salaries, ads, tech, monthly, notes].forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci >= 1 && ci <= 4 && typeof val === 'number') {
        cell.numFmt = money;
        cell.alignment = align('right');
      } else cell.alignment = align('left', 'middle', true);
    });
    ws.getRow(r).height = 26;
    r++;
  });

  // Totals
  styleRow(ws, r, 6, LIGHT_GREEN, true);
  ['TOTAL INVESTMENT ALLOCATED', 162000, 126000, 45000, null, 'Remaining ~$167K = Growth Reserve'].forEach((val, ci) => {
    const cell = ws.getRow(r).getCell(ci + 1);
    cell.value = val;
    cell.font  = font(true, 11, DARK_GREEN);
    if (typeof val === 'number') { cell.numFmt = money; cell.alignment = align('right'); }
    else cell.alignment = align('left');
  });
  r += 2;

  // ── Milestone table ──
  addSectionTitle(ws, r, '  CAPITAL REPLACEMENT MILESTONES', 6); r++;
  styleHeader(ws, r, 6, GREEN, WHITE);
  ['Milestone', 'Target Month', 'Churches Needed', 'Est. MRR', 'Investment Status', 'Action'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const milestones = [
    ['First paying church',        'Month 2',   15,  mrrAt(15).totalMRR,   'Burning: ~$21.5K/mo draw',    'Validate product-market fit'],
    ['Break-even (costs covered)', 'Month 9–10', 150, mrrAt(150).totalMRR,  'Burning: but revenue offsets', 'Scale ads with confidence'],
    ['$300K ARR (capital replaced)', 'Month 10–11', 165, mrrAt(165).totalMRR, 'Draw-down STOPS',            'Investment now = growth fund'],
    ['Year 1 complete',            'Month 12',  200, mrrAt(200).totalMRR,  'Remaining seed: ~$207K',       'Launch Phase 2 (payroll)'],
    ['Year 2 complete',            'Month 24',  450, mrrAt(450).totalMRR,  'Fully self-funded',            'Launch Phase 3 (banking)'],
  ];

  milestones.forEach((row, idx) => {
    const bg = idx === 2 ? LIGHT_GREEN : (idx % 2 === 0 ? GRAY_LIGHT : WHITE);
    const bold = idx === 2;
    styleRow(ws, r, 6, bg, bold);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci === 3 && typeof val === 'number') { cell.numFmt = money; cell.alignment = align('right'); }
      else { cell.alignment = align('left', 'middle', true); }
      if (bold) cell.font = font(true, 11, DARK_GREEN);
    });
    ws.getRow(r).height = 30;
    r++;
  });
}

// ─────────────────────────────────────────────
// SHEET 7: COST PER LEAD & CONVERSION
// ─────────────────────────────────────────────
function buildCostPerLead(wb) {
  const ws = wb.addWorksheet('Cost Per Lead & Conversion', { properties: { tabColor: { argb: BLUE } } });
  ws.columns = [
    { width: 30 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 28 },
  ];

  let r = 1;
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = 'COST PER LEAD & COST PER CONVERSION';
  ws.getCell(`A${r}`).fill  = fill(BLUE);
  ws.getCell(`A${r}`).font  = font(true, 16, WHITE);
  ws.getCell(`A${r}`).alignment = align('center');
  ws.getRow(r).height = 34; r += 2;

  // Assumptions block
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = 'ASSUMPTIONS: Ads run on Facebook + YouTube targeting pastors, church administrators, and ministry leaders. ' +
    'Funnel: Ad Impression → Landing Page → Free Trial / Demo Request → Paid Conversion. ' +
    'A "lead" = a church that books a demo OR starts a 14-day free trial. ' +
    'A "conversion" = a church that becomes a paying subscriber after their trial.';
  ws.getCell(`A${r}`).alignment = align('left', 'middle', true);
  ws.getCell(`A${r}`).fill = fill(LIGHT_BLUE);
  ws.getCell(`A${r}`).font = font(false, 11, BLACK);
  ws.getRow(r).height = 64;
  r += 2;

  // ── Phase table ──
  addSectionTitle(ws, r, '  COST PER LEAD BY PHASE', 6); r++;
  styleHeader(ws, r, 6, BLUE, WHITE);
  ['Phase', 'Ad Spend/Mo', 'Leads/Mo (est.)', 'Cost Per Lead', 'Notes', ''].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const leadPhases = [
    ['Phase 1 — M1–3',  5000,  75, Math.round(5000 / 75),   'New platform; brand awareness phase', ''],
    ['Phase 1 — M4–6', 10000, 130, Math.round(10000 / 130), 'Optimized creative + retargeting', ''],
    ['Phase 2 — M7–12',15000, 185, Math.round(15000 / 185), 'Referral layer added; CPL drops', ''],
    ['Phase 3 — M13–18',20000,240, Math.round(20000 / 240), 'Word-of-mouth compounding', ''],
  ];

  leadPhases.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci === 1) { cell.numFmt = money; cell.alignment = align('right'); }
      else if (ci === 3) { cell.numFmt = money; cell.alignment = align('right'); }
      else cell.alignment = align('left');
    });
    r++;
  });

  r++;
  // ── Cost per conversion ──
  addSectionTitle(ws, r, '  COST PER CONVERSION (FREE TRIAL + PAID)', 6); r++;
  styleHeader(ws, r, 6, BLUE, WHITE);
  ['Phase', 'Leads/Mo', 'Trial Rate', 'Trials/Mo', 'Trial→Paid Rate', 'New Paid Churches/Mo'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const convPhases = [
    ['Phase 1 — M1–3',  75, 0.60, 45, 0.33, 15],
    ['Phase 1 — M4–6', 130, 0.60, 78, 0.26, 20],
    ['Phase 2 — M7–12',185, 0.65, 120, 0.17, 20],
    ['Phase 3 — M13–18',240, 0.70, 168, 0.12, 20],
  ];

  convPhases.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci === 2 || ci === 4) { cell.numFmt = pct; cell.alignment = align('right'); }
      else cell.alignment = align(ci === 0 ? 'left' : 'center');
    });
    r++;
  });

  r++;
  // ── CAC table ──
  addSectionTitle(ws, r, '  CUSTOMER ACQUISITION COST (CAC) vs LTV', 6); r++;
  styleHeader(ws, r, 6, GREEN, WHITE);
  ['Phase', 'Ad Spend/Mo', 'New Churches/Mo', 'CAC', 'Avg 3-Yr LTV', 'LTV:CAC Ratio'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const cacData = [
    ['Phase 1 (M1–3)',   5000,  15, 333,  3500, '10.5×'],
    ['Phase 1 (M4–6)',  10000,  20, 500,  3500,  '7.0×'],
    ['Phase 2 (M7–12)', 15000,  20, 750,  4500,  '6.0×'],
    ['Phase 3 (M13–18)',20000,  20, 1000, 5500,  '5.5×'],
    ['Year 2 steady',   20000,  40,  500, 5500, '11.0×'],
  ];

  cacData.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci === 1 || ci === 3 || ci === 4) { cell.numFmt = money; cell.alignment = align('right'); }
      else if (ci === 5) { cell.alignment = align('center'); cell.font = font(true, 11, DARK_GREEN); }
      else cell.alignment = align(ci === 0 ? 'left' : 'center');
    });
    r++;
  });

  r++;
  // ── Referral program ──
  addSectionTitle(ws, r, '  REFERRAL PROGRAM (Church-to-Church)', 6); r++;
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value =
    'Every paying church gets a unique referral link. When they refer another church that pays for a full month, ' +
    'the referring church receives 1 free month ($29–$89 value). This reduces effective CAC by ~15–25% in Year 2. ' +
    'Expected referral contribution: 10–15 additional paying churches per month by Month 12.';
  ws.getCell(`A${r}`).alignment = align('left', 'middle', true);
  ws.getCell(`A${r}`).fill = fill(LIGHT_GREEN);
  ws.getCell(`A${r}`).font = font(false, 11, DARK_GREEN);
  ws.getRow(r).height = 56;
}

// ─────────────────────────────────────────────
// SHEET 8: TECH STACK COSTS
// ─────────────────────────────────────────────
function buildTechStack(wb) {
  const ws = wb.addWorksheet('Tech Stack', { properties: { tabColor: { argb: GRAY_MID.replace('E5E7EB', '6B7280') } } });
  ws.columns = [
    { width: 28 }, { width: 26 }, { width: 16 }, { width: 16 }, { width: 22 }, { width: 24 },
  ];

  let r = 1;
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = 'TECH STACK — MONTHLY COST BREAKDOWN';
  ws.getCell(`A${r}`).fill  = fill(GREEN);
  ws.getCell(`A${r}`).font  = font(true, 16, WHITE);
  ws.getCell(`A${r}`).alignment = align('center');
  ws.getRow(r).height = 34; r += 2;

  styleHeader(ws, r, 6);
  ['Service', 'Provider', 'Monthly Cost', 'Annual Cost', 'Category', 'Notes'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const techItems = [
    // Category, Service, Provider, Monthly, Notes
    ['AWS (EC2/S3/CloudFront)', 'Amazon Web Services', 80, 'Core Infrastructure', 'Compute + storage + CDN'],
    ['Supabase',               'Supabase',             25, 'Core Infrastructure', 'Database + Auth (Pro plan)'],
    ['Vercel',                 'Vercel',                0, 'Core Infrastructure', 'Free tier (Next.js hosting)'],
    ['Anthropic Claude API',  'Anthropic',           450, 'AI & Development',   'AI credits engine (~$0.005/credit)'],
    ['Cursor AI (dev)',        'Cursor',               10, 'AI & Development',   'Dev tool subscription'],
    ['Resend (email)',         'Resend',               20, 'Communications',     'Transactional email'],
    ['Brevo (marketing email)','Brevo',                25, 'Communications',     'Newsletter + campaigns'],
    ['Twilio SMS',             'Twilio',              140, 'Communications',     '~$0.007/SMS, ~20K msgs/mo'],
    ['GrapesJS (website builder)','Open Source',       0, 'Website Builder',    'Free, self-hosted'],
    ['AWS S3 (website assets)', 'Amazon',              23, 'Website Builder',    'Static file hosting'],
    ['GoDaddy Domains',        'GoDaddy',             30, 'Third-Party',        '~3 domains managed'],
    ['Google Maps API',        'Google',              25, 'Third-Party',        'Location services'],
    ['GitHub',                 'GitHub',               21, 'Team Tools',         'Team plan'],
    ['Sentry',                 'Sentry',               26, 'Team Tools',         'Error monitoring'],
    ['Figma',                  'Figma',                45, 'Team Tools',         'Design (3 seats)'],
    ['Notion',                 'Notion',               16, 'Team Tools',         'Docs + planning'],
    ['Zoom',                   'Zoom',                 60, 'Team Tools',         'Sales calls (Shawn)'],
    ['HelloSign/Dropbox Sign', 'Dropbox',              25, 'Phase 2 (Payroll)',  'e-Signatures for payroll'],
    ['Unit Banking',           'Unit (BaaS)',           0, 'Banking (Phase 2)',  'Revenue-share, no flat fee'],
    ['Stripe',                 'Stripe',                0, 'Payments',           '2.9%+30¢ pass-through'],
    ['Check Payroll API',      'Check',                 0, 'Payroll (Phase 2)', '~$8/employee (pass-through cost)'],
  ];

  let totalMonthly = 0;
  techItems.forEach((item, idx) => {
    const [service, provider, monthly, category, notes] = item;
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg);
    [service, provider, monthly, monthly * 12, category, notes].forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      if (ci === 2) { cell.numFmt = money; cell.alignment = align('right'); }
      if (ci === 3) { cell.numFmt = money; cell.alignment = align('right'); }
      else cell.alignment = align('left', 'middle', true);
    });
    totalMonthly += monthly;
    r++;
  });

  // Total
  styleRow(ws, r, 6, LIGHT_GREEN, true);
  ['TOTAL ACTIVE MONTHLY COST', '', totalMonthly, totalMonthly * 12, 'All active services', 'Payments/banking = revenue-share only'].forEach((val, ci) => {
    const cell = ws.getRow(r).getCell(ci + 1);
    cell.value = val;
    cell.font  = font(true, 11, DARK_GREEN);
    if (ci === 2) { cell.numFmt = money; cell.alignment = align('right'); }
    if (ci === 3) { cell.numFmt = money; cell.alignment = align('right'); }
    else cell.alignment = align('left');
  });
}

// ─────────────────────────────────────────────
// SHEET 9: LAUNCH ROADMAP
// ─────────────────────────────────────────────
function buildLaunchRoadmap(wb) {
  const ws = wb.addWorksheet('Launch Roadmap', { properties: { tabColor: { argb: DARK_GREEN } } });
  ws.columns = [
    { width: 22 }, { width: 30 }, { width: 24 }, { width: 18 }, { width: 20 }, { width: 30 },
  ];

  let r = 1;
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = 'LAUNCH ROADMAP — STEP-BY-STEP STRATEGIC PLAN';
  ws.getCell(`A${r}`).fill  = fill(GREEN);
  ws.getCell(`A${r}`).font  = font(true, 16, WHITE);
  ws.getCell(`A${r}`).alignment = align('center');
  ws.getRow(r).height = 34; r += 2;

  const phases = [
    {
      phase: 'PHASE 1 (M1–6)',
      subtitle: 'Website Builder + Giving + CRM + Surveys',
      bg: LIGHT_GREEN,
      headerBg: DARK_GREEN,
      rows: [
        ['Month 1', 'Launch prep + onboarding flow', '0 churches', '$29 + $49 plans', 'Ad spend $5K/mo', 'Build referral mechanism + demo video'],
        ['Month 2', 'Go live with Facebook + YouTube ads', '15 churches', 'Basic + Pro plans', 'Cost per lead ~$67', 'First testimonials; refine onboarding'],
        ['Month 3', 'Optimize ad creative based on CTR', '30 churches', 'Basic + Pro plans', 'Referral program live', 'Shawn doing weekly sign-up calls'],
        ['Month 4', 'Scale to $10K/mo ads; add retargeting', '50 churches', 'Basic + Pro + All-In', 'CAC ~$500', 'All-In plan introduced (payroll + giving)'],
        ['Month 5', 'Conference outreach begins', '70 churches', 'All plan tiers live', 'Cost per lead ~$77', 'Customer success check-ins start'],
        ['Month 6', 'Review Phase 1 metrics', '90 churches', 'All plan tiers live', 'Near break-even MRR', 'Hit 90 churches = $14.7K MRR'],
      ],
    },
    {
      phase: 'PHASE 2 (M7–12)',
      subtitle: 'Add Payroll Deep Integration + Scale to 200',
      bg: LIGHT_BLUE,
      headerBg: BLUE,
      rows: [
        ['Month 7',  'Payroll push — upsell existing Basic/Pro churches', '110 churches', 'All-In upsell push', 'Ads at $15K/mo', 'Onboarding Specialist hired (~100+ churches)'],
        ['Month 8',  'Ministry conference #1 attendance', '130 churches', 'Conference leads', 'CAC ~$750', 'Check API fully live for payroll processing'],
        ['Month 9',  'Break-even month — revenue covers all costs', '150 churches', 'Break-even milestone', '$300K ARR target', 'Investment draw-down reduces significantly'],
        ['Month 10', 'Referral program compounding', '165 churches', 'Referral traffic +15%', '$300K ARR ACHIEVED', 'Capital replacement event — investment preserved'],
        ['Month 11', 'Marketing manager onboarded', '180 churches', 'Marketing scale', 'Review Year 1 KPIs', 'Mike King or equiv. at $5–8K/mo'],
        ['Month 12', 'Year 1 close + investor update', '200 churches', 'Year 1 complete', 'Seed: ~$207K remaining', 'Plan Phase 3 (banking) launch for M13'],
      ],
    },
    {
      phase: 'PHASE 3 (M13–18)',
      subtitle: 'Unit Banking + FDIC Accounts + Debit Cards',
      bg: LIGHT_GOLD,
      headerBg: GOLD,
      rows: [
        ['Month 13', 'Unit Banking soft launch to existing churches', '220 churches', 'Banking revenue begins', 'Interchange ~1.2%', 'All churches invited to open FDIC account'],
        ['Month 14', 'Debit card issuance to church staff', '250 churches', 'Debit card program live', 'Passive interchange rev', 'Security audit completed before this launch'],
        ['Month 15', 'Ministry conference #2 + banking as lead magnet', '290 churches', 'Banking upsell', 'CPL dropping from referrals', 'Banking is differentiator vs competitors'],
        ['Month 16', 'Full payroll + banking integration (Check + Unit)', '330 churches', 'Stickiest cohort growing', 'Churn <5% expected', 'Payroll tied to bank = max switching cost'],
        ['Month 17', 'Scale ads to $20K/mo; test podcast sponsorships', '380 churches', 'Podcast sponsorships', 'CAC falling further', 'Faith-based podcast network (3–5 shows)'],
        ['Month 18', 'Year 1.5 review — prepare Series A narrative', '450 churches', 'All-In + Banking push', '$700K+ ARR target', 'Series A materials based on proven metrics'],
      ],
    },
    {
      phase: 'PHASE 4 (M19+)',
      subtitle: 'Advisor Network + Multi-Church Dashboard',
      bg: GRAY_LIGHT,
      headerBg: BLACK,
      rows: [
        ['Month 19', 'Advisor Network launch ($150/mo)', '500 churches', 'New revenue tier', 'Advisor outreach direct', 'Target faith-based financial advisors + missionaries'],
        ['Month 21', 'Multi-org dashboard live', '580 churches', 'Advisors managing 5+ orgs', 'High LTV cohort', 'Advisor avg LTV: $5,400/yr'],
        ['Month 24', 'Year 2 complete + Series A close', '900 churches (goal)', 'All 4 revenue tiers', 'Fully self-funded', 'Series A to scale to 3,000 churches'],
      ],
    },
  ];

  phases.forEach((phase) => {
    // Phase header
    ws.mergeCells(`A${r}:F${r}`);
    ws.getCell(`A${r}`).value = `${phase.phase} — ${phase.subtitle}`;
    ws.getCell(`A${r}`).fill  = fill(phase.headerBg);
    ws.getCell(`A${r}`).font  = font(true, 13, phase.headerBg === BLACK ? WHITE : WHITE);
    ws.getCell(`A${r}`).alignment = align('left', 'middle');
    ws.getRow(r).height = 28;
    r++;

    // Column headers
    styleHeader(ws, r, 6, phase.headerBg === BLACK ? '374151' : phase.headerBg, WHITE, 10);
    ['Timeline', 'Key Action', 'Church Target', 'Revenue Focus', 'Marketing KPI', 'Notes'].forEach((h, i) => {
      ws.getRow(r).getCell(i + 1).value = h;
    });
    r++;

    phase.rows.forEach((row, idx) => {
      const bg = idx % 2 === 0 ? phase.bg : WHITE;
      styleRow(ws, r, 6, bg);
      row.forEach((val, ci) => {
        const cell = ws.getRow(r).getCell(ci + 1);
        cell.value = val;
        cell.alignment = align('left', 'middle', true);
      });
      ws.getRow(r).height = 30;
      r++;
    });
    r++;  // spacer
  });

  // ── KPIs to track ──
  addSectionTitle(ws, r, '  KEY METRICS TO TRACK MONTHLY', 6); r++;
  styleHeader(ws, r, 6, GREEN, WHITE);
  ['Metric', 'Phase 1 Target', 'Phase 2 Target', 'Phase 3 Target', 'How to Measure', 'Owner'].forEach((h, i) => {
    ws.getRow(r).getCell(i + 1).value = h;
  });
  r++;

  const kpis = [
    ['Paying Churches',           '90 by M6',      '200 by M12',    '450 by M18',   'Supabase dashboard',   'Christopher'],
    ['Monthly Recurring Revenue', '$14.7K by M6',  '$32.8K by M12', '$73K by M18',  'Stripe dashboard',     'Christopher'],
    ['Cost Per Lead (CPL)',        '<$80',          '<$85',          '<$90',         'Facebook Ads Manager', 'Shawn'],
    ['Customer Acq. Cost (CAC)',  '<$500',         '<$800',         '<$1,000',      'CAC = Spend ÷ New Ch.','Shawn'],
    ['Trial-to-Paid Rate',        '>33%',          '>30%',          '>35%',         'Internal funnel data', 'Shawn'],
    ['Monthly Churn Rate',        '<5%',           '<4%',           '<3%',          'Cancellations / MoS',  'Christopher'],
    ['LTV:CAC Ratio',             '>7×',           '>6×',           '>5.5×',        'LTV / CAC calc',       'Shawn'],
    ['Cumulative Investment Used','<$130K by M6',  '<$295K by M12', '<$385K by M18','Finance tracker',      'Shawn'],
    ['ARR Run Rate',              '>$177K by M6',  '>$300K by M10', '>$700K by M18','MRR × 12',             'Christopher'],
  ];

  kpis.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? GRAY_LIGHT : WHITE;
    styleRow(ws, r, 6, bg);
    row.forEach((val, ci) => {
      const cell = ws.getRow(r).getCell(ci + 1);
      cell.value = val;
      cell.alignment = align('left', 'middle', true);
    });
    ws.getRow(r).height = 26;
    r++;
  });
}

// ─────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────
buildWorkbook().catch((err) => {
  console.error('❌ Error generating workbook:', err);
  process.exit(1);
});
