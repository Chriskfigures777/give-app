/**
 * The Exchange App — Marketing Conversion Calculator v2
 * Full impression funnel: Budget → CPM → CTR → Landing% → Leads → Trials → Paid
 *
 * Yellow cells = type here. Green cells = auto-calculated.
 * Run: node scripts/generate-conversion-calculator.mjs
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'Exchange App - Marketing Conversion Calculator.xlsx');

const GREEN        = '059669';
const DARK_GREEN   = '047857';
const LIGHT_GREEN  = 'D1FAE5';
const GOLD         = 'F59E0B';
const LIGHT_GOLD   = 'FEF3C7';
const BLUE         = '1D4ED8';
const LIGHT_BLUE   = 'DBEAFE';
const TEAL         = '0F766E';
const LIGHT_TEAL   = 'CCFBF1';
const PURPLE       = '6D28D9';
const LIGHT_PURPLE = 'EDE9FE';
const ORANGE       = 'C2410C';
const LIGHT_ORANGE = 'FFEDD5';
const INPUT_BG     = 'FEFCE8';
const CALC_BG      = 'ECFDF5';
const GRAY_LIGHT   = 'F9FAFB';
const GRAY_MID     = 'E5E7EB';
const WHITE        = 'FFFFFF';
const BLACK        = '111827';
const RED          = 'DC2626';
const LIGHT_RED    = 'FEE2E2';

const fill  = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const font  = (bold = false, size = 11, color = BLACK, name = 'Calibri') =>
  ({ name, size, bold, color: { argb: color } });
const bdr   = (c = GRAY_MID) => ({
  top:    { style: 'thin', color: { argb: c } },
  left:   { style: 'thin', color: { argb: c } },
  bottom: { style: 'thin', color: { argb: c } },
  right:  { style: 'thin', color: { argb: c } },
});
const goldBdr = () => ({
  top:    { style: 'medium', color: { argb: GOLD } },
  left:   { style: 'medium', color: { argb: GOLD } },
  bottom: { style: 'medium', color: { argb: GOLD } },
  right:  { style: 'medium', color: { argb: GOLD } },
});
const align = (h = 'left', v = 'middle', wrap = false) =>
  ({ horizontal: h, vertical: v, wrapText: wrap });

const FMT_MONEY  = '"$"#,##0';
const FMT_MONEY2 = '"$"#,##0.00';
const FMT_PCT    = '0.00%';
const FMT_PCT1   = '0.0%';
const FMT_NUM    = '#,##0';
const FMT_X      = '#,##0.0"x"';
const FMT_MO     = '#,##0.0" mo"';

function titleRow(ws, r, text, cols, bg, size) {
  ws.mergeCells(r, 1, r, cols);
  const c = ws.getCell('A' + r);
  c.value = text;
  c.fill  = fill(bg);
  c.font  = font(true, size, WHITE);
  c.alignment = align('center', 'middle');
  ws.getRow(r).height = size + 18;
}

function secHdr(ws, r, text, cols, bg) {
  ws.mergeCells(r, 1, r, cols);
  const c = ws.getCell('A' + r);
  c.value = text;
  c.fill  = fill(bg);
  c.font  = font(true, 11, WHITE);
  c.alignment = align('left', 'middle');
  c.border = bdr();
  ws.getRow(r).height = 22;
}

function colHdr(ws, r, labels, bg) {
  labels.forEach((text, i) => {
    const c = ws.getRow(r).getCell(i + 1);
    c.value = text;
    c.fill  = fill(bg);
    c.font  = font(true, 10, WHITE);
    c.border = bdr();
    c.alignment = align('center', 'middle', true);
  });
  ws.getRow(r).height = 24;
}

function sp(ws, r, cols) {
  cols = cols || 6;
  if (cols > 1) ws.mergeCells(r, 1, r, cols);
  ws.getCell('A' + r).fill = fill(WHITE);
  ws.getRow(r).height = 6;
}

function inputRow(ws, r, label, value, fmt, benchmark, units) {
  benchmark = benchmark || '';
  units = units || '';
  ws.getRow(r).height = 23;

  const la = ws.getRow(r).getCell(1);
  la.value = label;
  la.font  = font(false, 11, BLACK);
  la.fill  = fill(GRAY_LIGHT);
  la.border = bdr();
  la.alignment = align('left', 'middle');

  const inp = ws.getRow(r).getCell(2);
  inp.value = value;
  inp.font  = font(true, 12, BLACK);
  inp.fill  = fill(INPUT_BG);
  inp.border = goldBdr();
  inp.alignment = align('right', 'middle');
  if (fmt) inp.numFmt = fmt;

  const un = ws.getRow(r).getCell(3);
  un.value = units;
  un.font  = font(false, 10, '6B7280');
  un.fill  = fill(GRAY_LIGHT);
  un.border = bdr();
  un.alignment = align('left', 'middle');

  const bm = ws.getRow(r).getCell(4);
  bm.value = benchmark;
  bm.font  = font(false, 10, DARK_GREEN);
  bm.fill  = fill(LIGHT_GREEN);
  bm.border = bdr();
  bm.alignment = align('left', 'middle', true);

  ws.getRow(r).getCell(5).fill = fill(GRAY_LIGHT);
  ws.getRow(r).getCell(5).border = bdr();
  ws.getRow(r).getCell(6).fill = fill(GRAY_LIGHT);
  ws.getRow(r).getCell(6).border = bdr();
}

function calcRow(ws, r, label, formula, fmt, note, bg, fColor) {
  bg     = bg     || CALC_BG;
  fColor = fColor || DARK_GREEN;
  note   = note   || '';
  ws.getRow(r).height = 23;

  const la = ws.getRow(r).getCell(1);
  la.value = label;
  la.font  = font(false, 11, BLACK);
  la.fill  = fill(bg);
  la.border = bdr();
  la.alignment = align('left', 'middle');

  const val = ws.getRow(r).getCell(2);
  val.value = { formula: formula };
  val.font  = font(true, 12, fColor);
  val.fill  = fill(bg);
  val.border = bdr();
  val.alignment = align('right', 'middle');
  if (fmt) val.numFmt = fmt;

  ws.getRow(r).getCell(3).fill   = fill(bg);
  ws.getRow(r).getCell(3).border = bdr();

  const no = ws.getRow(r).getCell(4);
  no.value = note;
  no.font  = font(false, 10, '6B7280');
  no.fill  = fill(bg);
  no.border = bdr();
  no.alignment = align('left', 'middle', true);

  ws.getRow(r).getCell(5).fill   = fill(bg);
  ws.getRow(r).getCell(5).border = bdr();
  ws.getRow(r).getCell(6).fill   = fill(bg);
  ws.getRow(r).getCell(6).border = bdr();
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATOR ROW MAP (Projection sheet references these)
//   B7  = Monthly Ad Spend
//   B11 = CPM
//   B12 = CTR %
//   B13 = Landing Page -> Lead %  (THE "4%")
//   B14 = Lead -> Trial Rate %
//   B15 = Trial -> Paid Rate %
//   B16 = Monthly Churn Rate %
//   B17 = Current Churches
//   B21 = Basic Mix %
//   B22 = Pro Mix %
//   B23 = All-In Mix %
//   B28 = Avg Giving/Church
//   B29 = Transaction Fee %
//   B30 = Avg Extra Employees
//   B35 = Impressions (calc)
//   B36 = Clicks (calc)
//   B37 = Leads (calc)
//   B38 = Trial Starts (calc)
//   B39 = New Paid (calc)
//   B40 = Churn Count (calc)
//   B41 = Net New (calc)
//   B42 = Total Churches (calc)
//   B48 = ARPU (calc)  <- Projection uses this
// ─────────────────────────────────────────────────────────────────────────────
function buildCalculator(wb) {
  const ws = wb.addWorksheet('Calculator', {
    properties: { tabColor: { argb: GREEN } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }],
  });

  ws.columns = [
    { width: 38 }, { width: 20 }, { width: 14 }, { width: 34 }, { width: 16 }, { width: 16 },
  ];

  let r = 1;

  titleRow(ws, r, 'THE EXCHANGE APP - MARKETING CONVERSION CALCULATOR', 6, GREEN, 15); r++;

  ws.mergeCells('A' + r + ':F' + r);
  ws.getCell('A' + r).value =
    'Edit the YELLOW cells - every green cell updates automatically  |  ' +
    'Set the % at each funnel stage and watch leads, revenue, and ROI calculate live';
  ws.getCell('A' + r).fill  = fill(DARK_GREEN);
  ws.getCell('A' + r).font  = font(false, 10, WHITE);
  ws.getCell('A' + r).alignment = align('center', 'middle');
  ws.getRow(r).height = 17; r++;

  ws.mergeCells('A' + r + ':F' + r);
  ws.getCell('A' + r).value =
    'Based on Exchange App Investor Model v4  |  Plans: Basic $29 / Pro $49 / All-In $89  |  ' +
    'v4 break-even: Month 9-10 at 150 churches  |  $500K seed capital';
  ws.getCell('A' + r).fill  = fill(LIGHT_GREEN);
  ws.getCell('A' + r).font  = font(false, 10, DARK_GREEN);
  ws.getCell('A' + r).alignment = align('center', 'middle');
  ws.getRow(r).height = 17; r++;

  sp(ws, r); r++;

  // SECTION 1: AD SPEND (B7)
  secHdr(ws, r, '  STEP 1 - AD SPEND', 6, DARK_GREEN); r++;
  colHdr(ws, r, ['INPUT', 'YOUR VALUE', 'UNITS', 'v4 BENCHMARK / GUIDANCE', '', ''], DARK_GREEN); r++;

  inputRow(ws, r, 'Monthly Ad Spend', 5000, FMT_MONEY,
    'v4 ramp: $5K (M1-3) | $10K (M4-6) | $15K (M7-12) | $20K (M13-18)', '$ / month'); r++;

  sp(ws, r); r++;

  // SECTION 2: FUNNEL RATES (B11-B17)
  secHdr(ws, r, '  STEP 2 - AD FUNNEL  (set the conversion % at each stage)', 6, BLUE); r++;
  colHdr(ws, r, ['FUNNEL STAGE %', 'YOUR VALUE', 'UNITS', 'v4 BENCHMARK / GUIDANCE', '', ''], BLUE); r++;

  inputRow(ws, r, 'CPM - Cost Per 1,000 Ad Impressions', 35, FMT_MONEY,
    'Facebook targeting pastors/church admins: $25-$50 CPM is typical', '$ per 1K impressions'); r++;

  inputRow(ws, r, 'Ad Click-Through Rate (CTR) %', 0.015, FMT_PCT,
    'Faith-based B2B Facebook CTR: 1-2%  |  Better creative = higher CTR', '% of impressions'); r++;

  // B13 - THE KEY INPUT the user asked about
  {
    inputRow(ws, r, 'Landing Page  ->  Lead Signup Rate %', 0.04, FMT_PCT,
      '4% is realistic for cold B2B traffic  |  Every +1% here directly lowers your CPL', '% of page clicks');
    ws.getRow(r).getCell(1).font = font(true, 11, BLUE);
    ws.getRow(r).getCell(1).fill = fill(LIGHT_BLUE);
    ws.getRow(r).getCell(1).value = 'Landing Page  ->  Lead Signup Rate %   <-- CHANGE THIS';
  }
  r++;

  inputRow(ws, r, 'Lead  ->  Free Trial Start Rate %', 0.60, FMT_PCT,
    'v4: 60-70%  |  Of people who sign up, % who start a paid trial', '% of leads'); r++;

  inputRow(ws, r, 'Trial  ->  Paid Conversion Rate %', 0.33, FMT_PCT,
    'v4: 25-33%  |  Improve with onboarding calls and in-app nudges', '% of trials'); r++;

  inputRow(ws, r, 'Monthly Churn Rate %', 0.05, FMT_PCT,
    'Target: <5%  |  v4: 5% early stage, improves to <3% by Year 2', '% per month'); r++;

  inputRow(ws, r, 'Current Paying Churches (starting base)', 0, FMT_NUM,
    'Enter your current church count  |  0 = projecting from scratch', 'churches'); r++;

  sp(ws, r); r++;

  // SECTION 3: PLAN MIX (B21-B23)
  secHdr(ws, r, '  STEP 3 - PLAN MIX  (three rows must total 100%)', 6, TEAL); r++;
  colHdr(ws, r, ['PLAN', 'MIX %', 'PRICE', 'v4 DEFAULT + NOTES', '', ''], TEAL); r++;

  inputRow(ws, r, 'Basic Plan ($29/mo)', 0.40, FMT_PCT1,
    'v4 default 40%  |  Giving, CRM, Surveys, Goals, Events', '$29/mo'); r++;

  inputRow(ws, r, 'Pro Plan ($49/mo)', 0.35, FMT_PCT1,
    'v4 default 35%  |  + Website Builder, Banking, Broadcast', '$49/mo'); r++;

  inputRow(ws, r, 'All-In Plan ($89/mo)', 0.25, FMT_PCT1,
    'v4 default 25%  |  + Payroll (3 employees included)', '$89/mo'); r++;

  // Mix total validation row (B24)
  const MIX_TOTAL_ROW = r;
  {
    ws.getRow(r).height = 22;
    const la = ws.getRow(r).getCell(1);
    la.value = 'Plan Mix Total  (must equal 100%)';
    la.font  = font(true, 11, BLACK);
    la.fill  = fill(GRAY_LIGHT);
    la.border = bdr();
    la.alignment = align('left', 'middle');

    const val = ws.getRow(r).getCell(2);
    val.value  = { formula: 'B21+B22+B23' };
    val.numFmt = FMT_PCT1;
    val.font   = font(true, 12, DARK_GREEN);
    val.fill   = fill(CALC_BG);
    val.border = bdr();
    val.alignment = align('right', 'middle');

    const note = ws.getRow(r).getCell(4);
    note.value = 'Green = 100% correct   Red = adjust until it shows 100%';
    note.fill  = fill(LIGHT_GREEN);
    note.font  = font(false, 10, DARK_GREEN);
    note.border = bdr();
    note.alignment = align('left', 'middle');

    ws.getRow(r).getCell(3).fill   = fill(GRAY_LIGHT);
    ws.getRow(r).getCell(3).border = bdr();
    ws.getRow(r).getCell(5).fill   = fill(GRAY_LIGHT);
    ws.getRow(r).getCell(5).border = bdr();
    ws.getRow(r).getCell(6).fill   = fill(GRAY_LIGHT);
    ws.getRow(r).getCell(6).border = bdr();
  }
  r++;

  sp(ws, r); r++;

  // SECTION 4: REVENUE INPUTS (B28-B30)
  secHdr(ws, r, '  STEP 4 - REVENUE INPUTS', 6, ORANGE); r++;
  colHdr(ws, r, ['INPUT', 'YOUR VALUE', 'UNITS', 'v4 DEFAULT + NOTES', '', ''], ORANGE); r++;

  inputRow(ws, r, 'Avg Monthly Giving Per Church', 12500, FMT_MONEY,
    'v4 conservative: $12,500/mo  |  Platform earns 1% transaction fee on this', '$ / mo'); r++;

  inputRow(ws, r, 'Transaction Fee Rate', 0.01, FMT_PCT,
    'v4: 1% of all giving processed through the platform', '% of giving'); r++;

  inputRow(ws, r, 'Avg Extra Employees (All-In churches)', 4, FMT_NUM,
    'v4: avg 4 employees above 3 included  |  $12 per extra employee / mo', 'employees'); r++;

  sp(ws, r); r++;
  sp(ws, r); r++;

  // SECTION 5: FUNNEL OUTPUTS (B35-B44)
  secHdr(ws, r, '  YOUR MONTHLY FUNNEL RESULTS  (auto-calculated)', 6, GREEN); r++;
  colHdr(ws, r, ['RESULT', 'VALUE', '', 'HOW IT IS CALCULATED', '', ''], GREEN); r++;

  calcRow(ws, r, 'Monthly Ad Impressions',
    'IFERROR(ROUND(B7/B11*1000,0),0)',
    FMT_NUM, 'Ad Spend / CPM x 1,000', LIGHT_BLUE, BLUE); r++;

  calcRow(ws, r, 'Monthly Ad Clicks',
    'ROUND(B35*B12,0)',
    FMT_NUM, 'Impressions x Click-Through Rate %', LIGHT_BLUE, BLUE); r++;

  calcRow(ws, r, 'Leads Per Month  (people who sign up)',
    'ROUND(B36*B13,0)',
    FMT_NUM, 'Clicks x Landing Page -> Lead Signup Rate %', LIGHT_TEAL, TEAL);
  ws.getRow(r).getCell(2).font = font(true, 14, TEAL); r++;

  calcRow(ws, r, 'Trial Starts Per Month',
    'ROUND(B37*B14,0)',
    FMT_NUM, 'Leads x Lead -> Trial Start Rate %'); r++;

  calcRow(ws, r, 'New Paid Churches This Month',
    'ROUND(B38*B15,0)',
    FMT_NUM, 'Trial Starts x Trial -> Paid Rate %', LIGHT_GREEN, DARK_GREEN);
  ws.getRow(r).getCell(2).font = font(true, 14, DARK_GREEN); r++;

  calcRow(ws, r, 'Churches Churned This Month',
    'ROUND(B17*B16,0)',
    FMT_NUM, 'Current Base x Monthly Churn Rate', LIGHT_RED, RED); r++;

  calcRow(ws, r, 'Net New Churches',
    'B39-B40',
    FMT_NUM, 'New Paid minus Churned'); r++;

  calcRow(ws, r, 'Total Churches After This Month',
    'B17+B41',
    FMT_NUM, 'Current Base + Net New', LIGHT_GREEN, DARK_GREEN);
  ws.getRow(r).getCell(2).font = font(true, 15, DARK_GREEN); r++;

  calcRow(ws, r, 'Your Implied CPL (Cost Per Lead)',
    'IFERROR(B7/B37,"no leads")',
    FMT_MONEY, 'Ad Spend / Leads  |  v4 target: <$90', LIGHT_GOLD, GOLD); r++;

  calcRow(ws, r, 'Months to Reach 150 Churches (break-even)',
    'IFERROR(CEILING((150-B17)/MAX(B41,1),1),"Already there!")',
    '#,##0" months"', 'At current net new rate  |  v4 break-even milestone'); r++;

  sp(ws, r); r++;

  // SECTION 6: REVENUE (B48)
  secHdr(ws, r, '  REVENUE RESULTS', 6, GOLD); r++;
  colHdr(ws, r, ['RESULT', 'VALUE', '', 'HOW IT IS CALCULATED', '', ''], GOLD); r++;

  calcRow(ws, r, 'Avg Revenue Per Church / Month (ARPU)',
    '(B21*29)+(B22*49)+(B23*89)+(B23*B30*12)+(B28*B29)',
    FMT_MONEY2,
    'Blended plan + $12/extra emp (All-In only) + 1% txn fee on giving',
    LIGHT_GOLD, DARK_GREEN); r++;

  calcRow(ws, r, 'New MRR Added This Month',
    'B39*B48',
    FMT_MONEY, 'New Paid Churches x ARPU', LIGHT_GOLD, DARK_GREEN); r++;

  calcRow(ws, r, 'Total MRR (End of This Month)',
    'B42*B48',
    FMT_MONEY, 'Total Churches x ARPU', LIGHT_GOLD, DARK_GREEN);
  ws.getRow(r).getCell(2).font = font(true, 14, DARK_GREEN); r++;

  calcRow(ws, r, 'Annual Run Rate (ARR)',
    'B50*12',
    FMT_MONEY, 'Total MRR x 12', LIGHT_GOLD, DARK_GREEN);
  ws.getRow(r).getCell(2).font = font(true, 15, DARK_GREEN); r++;

  sp(ws, r); r++;

  // SECTION 7: UNIT ECONOMICS
  secHdr(ws, r, '  UNIT ECONOMICS', 6, PURPLE); r++;
  colHdr(ws, r, ['RESULT', 'VALUE', '', 'HOW IT IS CALCULATED', '', ''], PURPLE); r++;

  calcRow(ws, r, 'Customer Acquisition Cost (CAC)',
    'IFERROR(B7/B39,"no paid yet")',
    FMT_MONEY, 'Ad Spend / New Paid Churches  |  v4 target: <$500', LIGHT_PURPLE, PURPLE); r++;

  calcRow(ws, r, 'Lifetime Value (LTV)',
    'IFERROR(B48/B16,"check churn")',
    FMT_MONEY, 'ARPU / Monthly Churn Rate', LIGHT_PURPLE, PURPLE); r++;

  calcRow(ws, r, 'LTV to CAC Ratio',
    'IFERROR(B56/B55,"check inputs")',
    FMT_X, 'LTV / CAC  |  investors look for >7x', LIGHT_PURPLE, PURPLE);
  ws.getRow(r).getCell(2).font = font(true, 15, PURPLE); r++;

  calcRow(ws, r, 'CAC Payback Period',
    'IFERROR(B55/B48,"check inputs")',
    FMT_MO, 'CAC / ARPU  |  months until a church pays back its acquisition cost', LIGHT_PURPLE, PURPLE); r++;

  calcRow(ws, r, 'Break-Even Church Count',
    'IFERROR(CEILING((11606+B7)/B48,1),"check inputs")',
    FMT_NUM, 'Fixed costs $11,606 + Ad Spend / ARPU', LIGHT_PURPLE, PURPLE); r++;

  sp(ws, r); r++;

  // SECTION 8: FUNNEL VISUAL
  secHdr(ws, r, '  CONVERSION FUNNEL VISUAL  (bars fill automatically)', 6, DARK_GREEN); r++;
  colHdr(ws, r,
    ['FUNNEL STAGE', 'COUNT / AMOUNT', '% REMAINING', 'VISUAL BAR', '', ''],
    DARK_GREEN); r++;

  const FUNNEL_START = r;
  const stages = [
    { label: '1  Ad Budget',                          valF: 'B7',  pctF: null,           bg: LIGHT_BLUE,   fc: BLUE       },
    { label: '2  Impressions  (Budget / CPM x 1K)',   valF: 'B35', pctF: null,           bg: LIGHT_BLUE,   fc: BLUE       },
    { label: '3  Ad Clicks  (Impressions x CTR %)',   valF: 'B36', pctF: 'B36/B35',      bg: LIGHT_TEAL,   fc: TEAL       },
    { label: '4  Leads  (Clicks x Landing Page %)',   valF: 'B37', pctF: 'B37/B36',      bg: LIGHT_GREEN,  fc: DARK_GREEN },
    { label: '5  Trial Starts  (Leads x Trial %)',    valF: 'B38', pctF: 'B38/B37',      bg: LIGHT_GREEN,  fc: DARK_GREEN },
    { label: '6  New Paid  (Trials x Paid Rate %)',   valF: 'B39', pctF: 'B39/B38',      bg: LIGHT_GOLD,   fc: GOLD       },
    { label: '7  Net New  (Paid minus Churned)',       valF: 'B41', pctF: 'IFERROR(B41/B39,0)', bg: LIGHT_GOLD, fc: GOLD },
  ];

  stages.forEach(function(s, idx) {
    const row = ws.getRow(r);
    row.height = 24;

    row.getCell(1).value = s.label;
    row.getCell(1).fill  = fill(s.bg);
    row.getCell(1).font  = font(idx === 0, 11, BLACK);
    row.getCell(1).border = bdr();
    row.getCell(1).alignment = align('left', 'middle');

    row.getCell(2).value  = { formula: s.valF };
    row.getCell(2).numFmt = idx === 0 ? FMT_MONEY : FMT_NUM;
    row.getCell(2).fill   = fill(s.bg);
    row.getCell(2).font   = font(true, 11, s.fc);
    row.getCell(2).border = bdr();
    row.getCell(2).alignment = align('right', 'middle');

    if (s.pctF) {
      row.getCell(3).value  = { formula: 'IFERROR(' + s.pctF + ',0)' };
      row.getCell(3).numFmt = FMT_PCT1;
    } else {
      row.getCell(3).value = '100%';
    }
    row.getCell(3).fill   = fill(s.bg);
    row.getCell(3).font   = font(false, 10, BLACK);
    row.getCell(3).border = bdr();
    row.getCell(3).alignment = align('center', 'middle');

    row.getCell(4).value  = s.pctF ? { formula: 'IFERROR(' + s.pctF + ',0)' } : 1;
    row.getCell(4).numFmt = FMT_PCT1;
    row.getCell(4).fill   = fill(WHITE);
    row.getCell(4).border = bdr();
    row.getCell(4).alignment = align('left', 'middle');

    row.getCell(5).fill = fill(s.bg); row.getCell(5).border = bdr();
    row.getCell(6).fill = fill(s.bg); row.getCell(6).border = bdr();
    r++;
  });

  ws.addConditionalFormatting({
    ref: 'D' + FUNNEL_START + ':D' + (r - 1),
    rules: [{ type: 'dataBar', cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 1 }], color: { argb: 'FF' + GREEN }, priority: 1 }],
  });

  sp(ws, r); r++;

  // SECTION 9: PLAN REVENUE MIX
  secHdr(ws, r, '  PLAN REVENUE MIX  (per 100 churches - updates with plan mix inputs)', 6, GOLD); r++;
  colHdr(ws, r, ['PLAN / REVENUE SOURCE', 'MIX %', 'PRICE/MO', 'MRR FROM 100 CHURCHES', '% OF TOTAL', 'VISUAL BAR'], GOLD); r++;

  const PLAN_START = r;
  const plans = [
    { label: 'Basic Plan ($29/mo)',          mixRef: 'B21', price: 29,   extra: '0',           bg: GRAY_LIGHT   },
    { label: 'Pro Plan ($49/mo)',            mixRef: 'B22', price: 49,   extra: '0',           bg: WHITE        },
    { label: 'All-In Plan ($89/mo)',         mixRef: 'B23', price: 89,   extra: 'B23*B30*12*100', bg: LIGHT_GOLD },
    { label: 'Transaction Fees (1% giving)', mixRef: null,  price: null, extra: 'B28*B29*100', bg: LIGHT_BLUE   },
  ];

  plans.forEach(function(p) {
    const row = ws.getRow(r);
    row.height = 23;
    const TOTAL_REF = 'D' + (PLAN_START + plans.length);

    row.getCell(1).value = p.label;
    row.getCell(1).fill  = fill(p.bg);
    row.getCell(1).font  = font(false, 11, BLACK);
    row.getCell(1).border = bdr();
    row.getCell(1).alignment = align('left', 'middle');

    if (p.mixRef) {
      row.getCell(2).value  = { formula: p.mixRef };
      row.getCell(2).numFmt = FMT_PCT1;
    } else {
      row.getCell(2).value = 'all churches';
      row.getCell(2).font  = font(false, 10, '6B7280');
    }
    row.getCell(2).fill   = fill(p.bg);
    row.getCell(2).border = bdr();
    row.getCell(2).alignment = align('center', 'middle');

    if (p.price) {
      row.getCell(3).value  = p.price;
      row.getCell(3).numFmt = FMT_MONEY;
    } else {
      row.getCell(3).value = '1% of giving';
    }
    row.getCell(3).fill   = fill(p.bg);
    row.getCell(3).border = bdr();
    row.getCell(3).alignment = align('right', 'middle');

    const revF = p.mixRef ? (p.mixRef + '*' + p.price + '*100+' + p.extra) : p.extra;
    row.getCell(4).value  = { formula: revF };
    row.getCell(4).numFmt = FMT_MONEY;
    row.getCell(4).fill   = fill(p.bg);
    row.getCell(4).font   = font(true, 11, DARK_GREEN);
    row.getCell(4).border = bdr();
    row.getCell(4).alignment = align('right', 'middle');

    row.getCell(5).value  = { formula: 'IFERROR(D' + r + '/' + TOTAL_REF + ',0)' };
    row.getCell(5).numFmt = FMT_PCT1;
    row.getCell(5).fill   = fill(p.bg);
    row.getCell(5).border = bdr();
    row.getCell(5).alignment = align('center', 'middle');

    row.getCell(6).value  = { formula: 'IFERROR(D' + r + '/' + TOTAL_REF + ',0)' };
    row.getCell(6).numFmt = FMT_PCT1;
    row.getCell(6).fill   = fill(WHITE);
    row.getCell(6).border = bdr();

    r++;
  });

  // Total row
  const PLAN_LAST = r - 1;
  {
    const row = ws.getRow(r);
    row.height = 23;
    row.getCell(1).value = 'TOTAL  (per 100 churches / month)';
    row.getCell(1).font  = font(true, 11, DARK_GREEN);
    row.getCell(1).fill  = fill(LIGHT_GREEN);
    row.getCell(1).border = bdr();
    row.getCell(1).alignment = align('left', 'middle');

    row.getCell(4).value  = { formula: 'SUM(D' + PLAN_START + ':D' + PLAN_LAST + ')' };
    row.getCell(4).numFmt = FMT_MONEY;
    row.getCell(4).font   = font(true, 14, DARK_GREEN);
    row.getCell(4).fill   = fill(LIGHT_GREEN);
    row.getCell(4).border = bdr();
    row.getCell(4).alignment = align('right', 'middle');

    [2, 3, 5, 6].forEach(function(ci) {
      row.getCell(ci).fill   = fill(LIGHT_GREEN);
      row.getCell(ci).border = bdr();
    });
  }
  const PLAN_TOTAL_ROW = r; r++;

  ws.addConditionalFormatting({
    ref: 'F' + PLAN_START + ':F' + (PLAN_TOTAL_ROW - 1),
    rules: [{ type: 'dataBar', cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 1 }], color: { argb: 'FF' + GOLD }, priority: 2 }],
  });

  // Plan mix total: green=100%, red!=100%
  ws.addConditionalFormatting({
    ref: 'B' + MIX_TOTAL_ROW,
    rules: [
      { type: 'cellIs', operator: 'equal',    formulae: [1], priority: 5, style: { fill: fill(LIGHT_GREEN), font: font(true, 12, DARK_GREEN) } },
      { type: 'cellIs', operator: 'notEqual', formulae: [1], priority: 6, style: { fill: fill(LIGHT_RED),   font: font(true, 12, RED)        } },
    ],
  });

  // LTV:CAC green>=7x, red<3x
  ws.addConditionalFormatting({
    ref: 'B57',
    rules: [
      { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: [7], priority: 7, style: { fill: fill(LIGHT_GREEN), font: font(true, 15, DARK_GREEN) } },
      { type: 'cellIs', operator: 'lessThan',           formulae: [3], priority: 8, style: { fill: fill(LIGHT_RED),   font: font(true, 15, RED)        } },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET 2: 18-MONTH PROJECTION
// ─────────────────────────────────────────────────────────────────────────────
function buildProjection(wb) {
  const ws = wb.addWorksheet('18-Month Projection', {
    properties: { tabColor: { argb: BLUE } },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 5 }],
  });

  ws.columns = [
    { width: 12 }, { width: 13 }, { width: 14 }, { width: 11 }, { width: 11 },
    { width: 13 }, { width: 13 }, { width: 11 }, { width: 11 }, { width: 15 },
    { width: 14 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 18 },
  ];

  let r = 1;

  titleRow(ws, r, '18-MONTH PROJECTION - THE EXCHANGE APP', 15, BLUE, 15); r++;

  ws.mergeCells('A' + r + ':O' + r);
  ws.getCell('A' + r).value =
    'All conversion rates auto-update from Calculator inputs  |  ' +
    'Ad spend follows v4 ramp  |  Fixed costs: $11,606/mo  |  Starting capital: $500,000  |  ' +
    'Funnel: Impressions -> Clicks -> Leads -> Trials -> Paid';
  ws.getCell('A' + r).fill  = fill(LIGHT_BLUE);
  ws.getCell('A' + r).font  = font(false, 10, BLUE);
  ws.getCell('A' + r).alignment = align('center', 'middle');
  ws.getRow(r).height = 17; r++;

  r++;

  colHdr(ws, r, [
    'Month', 'Ad Spend', 'Impressions', 'Clicks', 'Leads',
    'Trial Starts', 'New Paid', 'Churned', 'Net New', 'Total Churches',
    'ARPU', 'Total MRR', 'Fixed Costs', 'Net P&L', 'Cumul. Cash ($500K)',
  ], BLUE); r++;

  const DATA_START = r;

  for (let mo = 1; mo <= 18; mo++) {
    const rn   = r;
    const prev = mo === 1 ? '0' : 'J' + (rn - 1);
    const adSpend = mo <= 3 ? 5000 : mo <= 6 ? 10000 : mo <= 12 ? 15000 : 20000;
    const isBreak = mo === 10;
    const bg  = isBreak ? LIGHT_GREEN : (mo % 2 === 0 ? GRAY_LIGHT : WHITE);
    const row = ws.getRow(r);
    row.height = 22;

    for (let ci = 1; ci <= 15; ci++) {
      row.getCell(ci).fill   = fill(bg);
      row.getCell(ci).border = bdr();
      row.getCell(ci).alignment = align('right', 'middle');
    }

    row.getCell(1).value = 'Month ' + mo;
    row.getCell(1).font  = font(true, 11, isBreak ? DARK_GREEN : BLACK);
    row.getCell(1).alignment = align('center', 'middle');

    row.getCell(2).value  = adSpend;
    row.getCell(2).numFmt = FMT_MONEY;
    row.getCell(2).font   = font(false, 11, BLACK);

    row.getCell(3).value  = { formula: 'IFERROR(ROUND(B' + rn + '/Calculator!B11*1000,0),0)' };
    row.getCell(3).numFmt = FMT_NUM;

    row.getCell(4).value  = { formula: 'ROUND(C' + rn + '*Calculator!B12,0)' };
    row.getCell(4).numFmt = FMT_NUM;

    row.getCell(5).value  = { formula: 'ROUND(D' + rn + '*Calculator!B13,0)' };
    row.getCell(5).numFmt = FMT_NUM;
    row.getCell(5).font   = font(true, 11, TEAL);

    row.getCell(6).value  = { formula: 'ROUND(E' + rn + '*Calculator!B14,0)' };
    row.getCell(6).numFmt = FMT_NUM;

    row.getCell(7).value  = { formula: 'ROUND(F' + rn + '*Calculator!B15,0)' };
    row.getCell(7).numFmt = FMT_NUM;
    row.getCell(7).font   = font(true, 11, DARK_GREEN);

    row.getCell(8).value  = { formula: 'ROUND(' + prev + '*Calculator!B16,0)' };
    row.getCell(8).numFmt = FMT_NUM;
    row.getCell(8).font   = font(false, 11, RED);

    row.getCell(9).value  = { formula: 'G' + rn + '-H' + rn };
    row.getCell(9).numFmt = FMT_NUM;

    row.getCell(10).value  = { formula: prev + '+I' + rn };
    row.getCell(10).numFmt = FMT_NUM;
    row.getCell(10).font   = font(true, 12, DARK_GREEN);

    row.getCell(11).value  = { formula: 'Calculator!B48' };
    row.getCell(11).numFmt = FMT_MONEY2;

    row.getCell(12).value  = { formula: 'J' + rn + '*K' + rn };
    row.getCell(12).numFmt = FMT_MONEY;
    row.getCell(12).font   = font(true, 11, DARK_GREEN);

    row.getCell(13).value  = { formula: '11606+B' + rn };
    row.getCell(13).numFmt = FMT_MONEY;

    row.getCell(14).value  = { formula: 'L' + rn + '-M' + rn };
    row.getCell(14).numFmt = FMT_MONEY;

    const prevCash = mo === 1 ? '500000' : 'O' + (rn - 1);
    row.getCell(15).value  = { formula: prevCash + '+N' + rn };
    row.getCell(15).numFmt = FMT_MONEY;
    row.getCell(15).font   = font(true, 11, BLACK);

    r++;
  }

  ws.addConditionalFormatting({
    ref: 'N' + DATA_START + ':N' + (r - 1),
    rules: [
      { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: [0], priority: 1, style: { font: font(true, 11, DARK_GREEN) } },
      { type: 'cellIs', operator: 'lessThan',           formulae: [0], priority: 2, style: { font: font(true, 11, RED)        } },
    ],
  });
  ws.addConditionalFormatting({
    ref: 'J' + DATA_START + ':J' + (r - 1),
    rules: [{ type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF' + GREEN }, priority: 3 }],
  });
  ws.addConditionalFormatting({
    ref: 'L' + DATA_START + ':L' + (r - 1),
    rules: [{ type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF' + GOLD }, priority: 4 }],
  });
  ws.addConditionalFormatting({
    ref: 'O' + DATA_START + ':O' + (r - 1),
    rules: [{ type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF' + BLUE }, priority: 5 }],
  });

  r++;
  ws.mergeCells('A' + r + ':O' + r);
  ws.getCell('A' + r).value =
    'Month 10 highlighted green = break-even milestone (~150 churches / $300K ARR). ' +
    'Change any % on the Calculator sheet and all 18 months recalculate instantly. ' +
    'Try: change Landing Page % from 4% to 2% to see how CPL and church growth change.';
  ws.getCell('A' + r).fill = fill(LIGHT_GREEN);
  ws.getCell('A' + r).font = font(false, 10, DARK_GREEN);
  ws.getCell('A' + r).alignment = align('left', 'middle', true);
  ws.getRow(r).height = 46;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET 3: CHART DATA
// ─────────────────────────────────────────────────────────────────────────────
function buildChartData(wb) {
  const ws = wb.addWorksheet('Chart Data (Pie)', { properties: { tabColor: { argb: GOLD } } });
  ws.columns = [{ width: 34 }, { width: 24 }, { width: 14 }, { width: 36 }];

  let r = 1;
  titleRow(ws, r, 'PLAN REVENUE MIX - PIE CHART DATA', 4, GOLD, 13); r++;

  ws.mergeCells('A' + r + ':D' + r);
  ws.getCell('A' + r).value =
    'Select A' + (r + 2) + ':B' + (r + 6) +
    '  then  Insert -> Chart -> Pie  |  Values auto-update from Calculator inputs';
  ws.getCell('A' + r).fill  = fill(LIGHT_GOLD);
  ws.getCell('A' + r).font  = font(false, 10, BLACK);
  ws.getCell('A' + r).alignment = align('center', 'middle');
  ws.getRow(r).height = 18; r++;

  r++;

  colHdr(ws, r, ['Revenue Source', 'Monthly Revenue (actual church count)', '% of Total', 'Notes'], GOLD); r++;

  const PIE_START = r;
  const pieDefs = [
    { label: 'Basic Plan ($29/mo)',     formula: 'Calculator!B21*29*Calculator!B42',                    note: 'Basic % x $29 x total church count' },
    { label: 'Pro Plan ($49/mo)',       formula: 'Calculator!B22*49*Calculator!B42',                    note: 'Pro % x $49 x total church count'   },
    { label: 'All-In Plan ($89/mo)',    formula: 'Calculator!B23*89*Calculator!B42',                    note: 'All-In % x $89 x total church count' },
    { label: 'Employee Fees ($12/emp)', formula: 'Calculator!B23*Calculator!B30*12*Calculator!B42',     note: 'All-In churches x extra employees x $12/mo' },
    { label: 'Transaction Fees (1%)',   formula: 'Calculator!B28*Calculator!B29*Calculator!B42',        note: '1% of avg giving x total church count' },
  ];
  const bgs2 = [LIGHT_GREEN, LIGHT_BLUE, LIGHT_GOLD, LIGHT_PURPLE, LIGHT_ORANGE];

  pieDefs.forEach(function(p, idx) {
    const row = ws.getRow(r);
    row.height = 26;
    const PIE_END = PIE_START + pieDefs.length - 1;

    row.getCell(1).value = p.label;
    row.getCell(1).fill  = fill(bgs2[idx]);
    row.getCell(1).font  = font(true, 11, BLACK);
    row.getCell(1).border = bdr();
    row.getCell(1).alignment = align('left', 'middle');

    row.getCell(2).value  = { formula: p.formula };
    row.getCell(2).numFmt = FMT_MONEY;
    row.getCell(2).fill   = fill(bgs2[idx]);
    row.getCell(2).font   = font(true, 12, DARK_GREEN);
    row.getCell(2).border = bdr();
    row.getCell(2).alignment = align('right', 'middle');

    row.getCell(3).value  = { formula: 'IFERROR(B' + r + '/SUM(B' + PIE_START + ':B' + PIE_END + '),0)' };
    row.getCell(3).numFmt = FMT_PCT1;
    row.getCell(3).fill   = fill(bgs2[idx]);
    row.getCell(3).border = bdr();
    row.getCell(3).alignment = align('center', 'middle');

    row.getCell(4).value = p.note;
    row.getCell(4).fill  = fill(GRAY_LIGHT);
    row.getCell(4).font  = font(false, 10, '6B7280');
    row.getCell(4).border = bdr();
    row.getCell(4).alignment = align('left', 'middle', true);
    r++;
  });

  const PIE_END_FINAL = r - 1;
  const row = ws.getRow(r);
  row.height = 28;
  row.getCell(1).value = 'TOTAL MRR';
  row.getCell(1).font  = font(true, 12, DARK_GREEN);
  row.getCell(1).fill  = fill(LIGHT_GREEN);
  row.getCell(1).border = bdr();
  row.getCell(1).alignment = align('left', 'middle');

  row.getCell(2).value  = { formula: 'SUM(B' + PIE_START + ':B' + PIE_END_FINAL + ')' };
  row.getCell(2).numFmt = FMT_MONEY;
  row.getCell(2).font   = font(true, 14, DARK_GREEN);
  row.getCell(2).fill   = fill(LIGHT_GREEN);
  row.getCell(2).border = bdr();
  row.getCell(2).alignment = align('right', 'middle');

  row.getCell(3).fill  = fill(LIGHT_GREEN);
  row.getCell(3).border = bdr();
  row.getCell(4).fill  = fill(LIGHT_GREEN);
  row.getCell(4).border = bdr();
  r += 2;

  ws.mergeCells('A' + r + ':D' + (r + 4));
  ws.getCell('A' + r).value =
    'HOW TO INSERT THE PIE CHART:\n\n' +
    '1. Select cells A' + PIE_START + ':B' + PIE_END_FINAL + '  (the 5 revenue rows)\n' +
    '2. Click  Insert  then  Chart  (or Insert then Pie Chart)\n' +
    '3. Choose Pie or Donut - chart auto-updates when you change Calculator inputs\n\n' +
    'Tip: right-click chart  ->  Select Data  ->  confirm the range is correct';
  ws.getCell('A' + r).fill  = fill(LIGHT_BLUE);
  ws.getCell('A' + r).font  = font(false, 11, BLUE);
  ws.getCell('A' + r).alignment = align('left', 'top', true);
  for (let i = r; i <= r + 4; i++) ws.getRow(i).height = 20;
}

// MAIN
async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'The Exchange App';
  wb.created  = new Date();
  wb.modified = new Date();

  buildCalculator(wb);
  buildProjection(wb);
  buildChartData(wb);

  await wb.xlsx.writeFile(OUTPUT_PATH);
  console.log('Saved: ' + OUTPUT_PATH);
}

main().catch(function(err) {
  console.error('Error:', err);
  process.exit(1);
});
