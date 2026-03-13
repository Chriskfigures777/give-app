"use server";

import ExcelJS from "exceljs";
import type { BudgetSheet } from "./budget-types";
import { MONTH_NAMES, parseNum } from "./budget-types";

// ─── Column layout (1-based, matches reference spreadsheet) ───────────────────
//  A   B        C       D  E     F          G          H            I        J
//  1   2        3       4  5     6          7          8            9        10
// Inc  Inc-Bg  Inc-Act  —  —    Fx-Item    Fx-Budg   Fx-Paid    Fx-Due     —
//
//  K          L          M          N          O     P   Q          R
//  11         12         13         14         15    16  17         18
// Vr-Item   Vr-Budg   Vr-Paid    Vr-Rem     Vr-Due  —  Sum-Desc  Sum-Amt

const C = {
  INC_LBL: 1,
  INC_BDG: 2,
  INC_ACT: 3,
  FX_LBL:  6,
  FX_BDG:  7,
  FX_PAD:  8,
  FX_DUE:  9,
  VR_LBL:  11,
  VR_BDG:  12,
  VR_PAD:  13,
  VR_REM:  14,
  VR_DUE:  15,
  SUM_LBL: 17,
  SUM_AMT: 18,
} as const;

const TOTAL_COLS = 18;

// ─── Color palette (ARGB) ────────────────────────────────────────────────────
const COLORS = {
  incHeader:    "FF0F4C2A",  // dark forest green
  incSubHeader: "FF1A7A50",  // medium green
  incTotal:     "FFD6EDD8",  // light green tint

  fxHeader:    "FF5C2400",   // dark burnt orange
  fxSubHeader: "FFA04000",   // orange
  fxTotal:     "FFFFE8D6",   // light orange tint

  vrHeader:    "FF2D0F5C",   // dark indigo
  vrSubHeader: "FF5B3A9E",   // medium purple
  vrTotal:     "FFE8E0FF",   // light purple tint

  sumHeader:    "FF0A2E4A",  // dark navy
  sumSubHeader: "FF1A5E8A",  // medium blue
  sumTotal:     "FFD6EAF8",  // light blue tint

  txHeader:    "FF1A2440",   // dark midnight
  txSubHeader: "FF2E4070",   // dark blue
  txTotal:     "FFD9E8FF",   // light blue

  titleBg:     "FF0D1F2D",   // very dark header
  white:       "FFFFFFFF",
  black:       "FF000000",
  rowEven:     "FFF7F9FC",
  rowOdd:      "FFFFFFFF",
  negRed:      "FFCC2222",
};

// ─── Style helpers ────────────────────────────────────────────────────────────

function applyFill(cell: ExcelJS.Cell, argb: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function applyBorder(cell: ExcelJS.Cell, style: ExcelJS.BorderStyle = "thin", color = "FFD0D8E0") {
  cell.border = {
    top:    { style, color: { argb: color } },
    bottom: { style, color: { argb: color } },
    left:   { style, color: { argb: color } },
    right:  { style, color: { argb: color } },
  };
}

function styleSectionHeader(cell: ExcelJS.Cell, bgArgb: string) {
  applyFill(cell, bgArgb);
  cell.font = { bold: true, size: 11, color: { argb: COLORS.white } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
  cell.border = { bottom: { style: "medium", color: { argb: COLORS.black } } };
}

function styleColHeader(cell: ExcelJS.Cell, bgArgb: string) {
  applyFill(cell, bgArgb);
  cell.font = { bold: true, size: 9, color: { argb: COLORS.white } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
  cell.border = { bottom: { style: "thin", color: { argb: COLORS.black } } };
}

function styleDataCell(cell: ExcelJS.Cell, rowEven: boolean) {
  applyFill(cell, rowEven ? COLORS.rowEven : COLORS.rowOdd);
  cell.font = { size: 10 };
  applyBorder(cell, "hair");
}

function styleTotalCell(cell: ExcelJS.Cell, bgArgb: string) {
  applyFill(cell, bgArgb);
  cell.font = { bold: true, size: 10 };
  cell.border = {
    top:    { style: "medium", color: { argb: COLORS.black } },
    bottom: { style: "thin",   color: { argb: "FFB0BEC5" } },
  };
}

// ─── Number formatting ────────────────────────────────────────────────────────

const USD_FMT = '#,##0.00_);[Red](#,##0.00)';

function asNum(val: string): number | string {
  const n = parseNum(val);
  return n === 0 && val.trim() === "" ? "" : n;
}

// ─── Per-month worksheet ──────────────────────────────────────────────────────

function buildMonthSheet(wb: ExcelJS.Workbook, sheet: BudgetSheet, tabLabel: string) {
  const ws = wb.addWorksheet(tabLabel);

  // Column widths
  ws.columns = [
    { width: 28 }, // A income label
    { width: 13 }, // B budgeted
    { width: 13 }, // C actual
    { width: 2.5 }, // D gap
    { width: 2.5 }, // E gap
    { width: 28 }, // F fixed label
    { width: 13 }, // G budget amt
    { width: 13 }, // H paid to date
    { width: 10 }, // I due date
    { width: 2.5 }, // J gap
    { width: 26 }, // K variable label
    { width: 13 }, // L budget amt
    { width: 13 }, // M paid to date
    { width: 13 }, // N remaining
    { width: 8  }, // O due
    { width: 2.5 }, // P gap
    { width: 30 }, // Q summary label
    { width: 14 }, // R summary amount
  ];

  // ── Row 1: Title ─────────────────────────────────────────────────────────
  const titleRow = ws.addRow([tabLabel.toUpperCase() + " — MONTHLY BUDGET"]);
  ws.mergeCells(1, 1, 1, TOTAL_COLS);
  const titleCell = titleRow.getCell(1);
  applyFill(titleCell, COLORS.titleBg);
  titleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleRow.height = 28;

  // ── Row 2: Subtitle ──────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const subRow = ws.addRow([`Exported: ${today}`]);
  ws.mergeCells(2, 1, 2, TOTAL_COLS);
  const subCell = subRow.getCell(1);
  applyFill(subCell, "FF1A2440");
  subCell.font = { size: 9, italic: true, color: { argb: "FFAABBD0" } };
  subCell.alignment = { vertical: "middle", horizontal: "left" };
  subRow.height = 16;

  // ── Row 3: blank ─────────────────────────────────────────────────────────
  ws.addRow([]);
  ws.getRow(3).height = 6;

  // ── Row 4: Section headers ───────────────────────────────────────────────
  const secHdrRow = ws.getRow(4);
  secHdrRow.height = 22;

  const secCells: [number, number, string, string][] = [
    [C.INC_LBL, C.INC_ACT, "INCOME",            COLORS.incHeader],
    [C.FX_LBL,  C.FX_DUE,  "FIXED EXPENSES",    COLORS.fxHeader],
    [C.VR_LBL,  C.VR_DUE,  "VARIABLE EXPENSES", COLORS.vrHeader],
    [C.SUM_LBL, C.SUM_AMT, "SUMMARY",           COLORS.sumHeader],
  ];
  for (const [c1, c2, label, color] of secCells) {
    ws.mergeCells(4, c1, 4, c2);
    styleSectionHeader(secHdrRow.getCell(c1), color);
    secHdrRow.getCell(c1).value = label;
    for (let c = c1 + 1; c <= c2; c++) applyFill(secHdrRow.getCell(c), color);
  }

  // ── Row 5: Column headers ────────────────────────────────────────────────
  const colHdrRow = ws.getRow(5);
  colHdrRow.height = 18;

  const colHeaders: [number, string, string][] = [
    [C.INC_LBL, "Category",     COLORS.incSubHeader],
    [C.INC_BDG, "Budgeted",     COLORS.incSubHeader],
    [C.INC_ACT, "Actual",       COLORS.incSubHeader],
    [C.FX_LBL,  "Item",         COLORS.fxSubHeader],
    [C.FX_BDG,  "Budget Amt",   COLORS.fxSubHeader],
    [C.FX_PAD,  "Paid to Date", COLORS.fxSubHeader],
    [C.FX_DUE,  "Due Date",     COLORS.fxSubHeader],
    [C.VR_LBL,  "Item",         COLORS.vrSubHeader],
    [C.VR_BDG,  "Budget Amt",   COLORS.vrSubHeader],
    [C.VR_PAD,  "Paid to Date", COLORS.vrSubHeader],
    [C.VR_REM,  "Remaining",    COLORS.vrSubHeader],
    [C.VR_DUE,  "Due",          COLORS.vrSubHeader],
    [C.SUM_LBL, "Description",  COLORS.sumSubHeader],
    [C.SUM_AMT, "Amount",       COLORS.sumSubHeader],
  ];
  for (const [col, label, color] of colHeaders) {
    const cell = colHdrRow.getCell(col);
    styleColHeader(cell, color);
    cell.value = label;
  }

  // ── Build section data arrays ─────────────────────────────────────────────

  const incomeTotal = {
    budgeted: sheet.income.reduce((a, r) => a + parseNum(r.budgeted), 0),
    actual:   sheet.income.reduce((a, r) => a + parseNum(r.actual), 0),
  };
  const fixedTotal = {
    budget: sheet.fixedExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0),
    paid:   sheet.fixedExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0),
  };
  const varTotal = {
    budget: sheet.variableExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0),
    paid:   sheet.variableExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0),
  };
  const totalExpBudget  = fixedTotal.budget + varTotal.budget;
  const totalExpPaid    = fixedTotal.paid   + varTotal.paid;
  const netBudgeted     = incomeTotal.budgeted - totalExpBudget;
  const netActual       = incomeTotal.actual   - totalExpPaid;

  // Summary rows
  const summaryRows = [
    ["Total Budgeted Income",      incomeTotal.budgeted],
    ["Total Fixed Expenses",       fixedTotal.budget],
    ["Total Variable Expenses",    varTotal.budget],
    ["Net Budgeted Cash Flow",     netBudgeted],
    ["─────────────────────", ""],
    ["Total Actual Income",        incomeTotal.actual],
    ["Total Fixed Paid",           fixedTotal.paid],
    ["Total Variable Paid",        varTotal.paid],
    ["Net Actual Cash Flow",       netActual],
    ["─────────────────────", ""],
    ["Variance (Actual vs Budget)", netActual - netBudgeted],
  ] as [string, number | string][];

  // Determine how many data rows each section needs (+1 for total row)
  const incRows = sheet.income.length;
  const fxRows  = sheet.fixedExpenses.length;
  const vrRows  = sheet.variableExpenses.length;
  const smRows  = summaryRows.length;
  const maxRows = Math.max(incRows + 1, fxRows + 1, vrRows + 1, smRows);

  // ── Data rows (starting at row 6) ───────────────────────────────────────
  const DATA_START = 6;

  for (let di = 0; di < maxRows; di++) {
    const wsRow = ws.getRow(DATA_START + di);
    wsRow.height = 17;
    const even = di % 2 === 0;

    // ── Income ───────────────────────────────────────────────────────────
    const isIncTotal = di === incRows;
    const isIncData  = di < incRows;

    if (isIncData) {
      const r = sheet.income[di];
      const cells: [number, string | number][] = [
        [C.INC_LBL, r.category],
        [C.INC_BDG, asNum(r.budgeted)],
        [C.INC_ACT, asNum(r.actual)],
      ];
      for (const [col, val] of cells) {
        const cell = wsRow.getCell(col);
        cell.value = val as ExcelJS.CellValue;
        styleDataCell(cell, even);
        if (col !== C.INC_LBL) {
          cell.numFmt = USD_FMT;
          cell.alignment = { horizontal: "right" };
        }
      }
    } else if (isIncTotal) {
      const cells: [number, string | number][] = [
        [C.INC_LBL, "TOTAL INCOME"],
        [C.INC_BDG, incomeTotal.budgeted],
        [C.INC_ACT, incomeTotal.actual],
      ];
      for (const [col, val] of cells) {
        const cell = wsRow.getCell(col);
        cell.value = val as ExcelJS.CellValue;
        styleTotalCell(cell, COLORS.incTotal);
        if (col !== C.INC_LBL) {
          cell.numFmt = USD_FMT;
          cell.alignment = { horizontal: "right" };
        }
      }
    }

    // ── Fixed Expenses ────────────────────────────────────────────────────
    const isFxTotal = di === fxRows;
    const isFxData  = di < fxRows;

    if (isFxData) {
      const r = sheet.fixedExpenses[di];
      const rem = parseNum(r.budgetAmt) - parseNum(r.paidToDate);
      const cells: [number, string | number][] = [
        [C.FX_LBL, r.item],
        [C.FX_BDG, asNum(r.budgetAmt)],
        [C.FX_PAD, asNum(r.paidToDate)],
        [C.FX_DUE, r.dueDate || "—"],
      ];
      for (const [col, val] of cells) {
        const cell = wsRow.getCell(col);
        cell.value = val as ExcelJS.CellValue;
        styleDataCell(cell, even);
        if (col === C.FX_BDG || col === C.FX_PAD) {
          cell.numFmt = USD_FMT;
          cell.alignment = { horizontal: "right" };
        }
        if (col === C.FX_DUE) cell.alignment = { horizontal: "center" };
      }
      // Remaining (calculated) — show in-line
      const remCell = wsRow.getCell(C.FX_PAD + 1); // col I+1 = J, but we skip that. Let's use a note area
      // Actually Fixed section doesn't have a "Remaining" column — only Variable does
      // so we just skip remaining for Fixed
      void rem; // suppress unused warning
    } else if (isFxTotal) {
      const cells: [number, string | number][] = [
        [C.FX_LBL, "TOTAL FIXED EXPENSES"],
        [C.FX_BDG, fixedTotal.budget],
        [C.FX_PAD, fixedTotal.paid],
        [C.FX_DUE, ""],
      ];
      for (const [col, val] of cells) {
        const cell = wsRow.getCell(col);
        cell.value = val as ExcelJS.CellValue;
        styleTotalCell(cell, COLORS.fxTotal);
        if (col === C.FX_BDG || col === C.FX_PAD) {
          cell.numFmt = USD_FMT;
          cell.alignment = { horizontal: "right" };
        }
      }
    }

    // ── Variable Expenses ─────────────────────────────────────────────────
    const isVrTotal = di === vrRows;
    const isVrData  = di < vrRows;

    if (isVrData) {
      const r = sheet.variableExpenses[di];
      const rem = parseNum(r.budgetAmt) - parseNum(r.paidToDate);
      const cells: [number, string | number][] = [
        [C.VR_LBL, r.item],
        [C.VR_BDG, asNum(r.budgetAmt)],
        [C.VR_PAD, asNum(r.paidToDate)],
        [C.VR_REM, rem === 0 && r.budgetAmt === "" ? "" : rem],
        [C.VR_DUE, r.dueDate || "—"],
      ];
      for (const [col, val] of cells) {
        const cell = wsRow.getCell(col);
        cell.value = val as ExcelJS.CellValue;
        styleDataCell(cell, even);
        if (col === C.VR_BDG || col === C.VR_PAD || col === C.VR_REM) {
          cell.numFmt = USD_FMT;
          cell.alignment = { horizontal: "right" };
          if (col === C.VR_REM && rem < 0) {
            cell.font = { bold: true, size: 10, color: { argb: COLORS.negRed } };
          }
        }
        if (col === C.VR_DUE) cell.alignment = { horizontal: "center" };
      }
    } else if (isVrTotal) {
      const rem = varTotal.budget - varTotal.paid;
      const cells: [number, string | number][] = [
        [C.VR_LBL, "TOTAL VARIABLE EXPENSES"],
        [C.VR_BDG, varTotal.budget],
        [C.VR_PAD, varTotal.paid],
        [C.VR_REM, rem],
        [C.VR_DUE, ""],
      ];
      for (const [col, val] of cells) {
        const cell = wsRow.getCell(col);
        cell.value = val as ExcelJS.CellValue;
        styleTotalCell(cell, COLORS.vrTotal);
        if (col === C.VR_BDG || col === C.VR_PAD || col === C.VR_REM) {
          cell.numFmt = USD_FMT;
          cell.alignment = { horizontal: "right" };
        }
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────
    if (di < smRows) {
      const [smLabel, smVal] = summaryRows[di];
      const isSumTotal = smLabel.startsWith("Net") || smLabel.startsWith("Variance");
      const isSumSep   = smLabel.startsWith("───");

      const lblCell = wsRow.getCell(C.SUM_LBL);
      const amtCell = wsRow.getCell(C.SUM_AMT);

      if (isSumSep) {
        lblCell.value = "";
        applyFill(lblCell, "FFF0F4F8");
        ws.mergeCells(DATA_START + di, C.SUM_LBL, DATA_START + di, C.SUM_AMT);
        wsRow.height = 6;
      } else if (isSumTotal) {
        lblCell.value = smLabel as ExcelJS.CellValue;
        amtCell.value = smVal as ExcelJS.CellValue;
        const numVal = typeof smVal === "number" ? smVal : 0;
        styleTotalCell(lblCell, COLORS.sumTotal);
        styleTotalCell(amtCell, COLORS.sumTotal);
        amtCell.numFmt = USD_FMT;
        amtCell.alignment = { horizontal: "right" };
        if (numVal < 0) amtCell.font = { bold: true, size: 10, color: { argb: COLORS.negRed } };
      } else {
        lblCell.value = smLabel as ExcelJS.CellValue;
        amtCell.value = smVal as ExcelJS.CellValue;
        styleDataCell(lblCell, even);
        styleDataCell(amtCell, even);
        amtCell.numFmt = USD_FMT;
        amtCell.alignment = { horizontal: "right" };
      }
    }
  }

  // ── Freeze panes at row 6, keep headers visible ──────────────────────────
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5, topLeftCell: "A6" }];

  // ── Tab color per section ─────────────────────────────────────────────────
  ws.properties.tabColor = { argb: "FF1A7A50" };

  // ── Transaction Log (if any) — as a second mini-section below ────────────
  if (sheet.transactions.length > 0) {
    const txStartRow = DATA_START + maxRows + 2;

    // Section header
    const txHdr = ws.getRow(txStartRow);
    ws.mergeCells(txStartRow, 1, txStartRow, 4);
    txHdr.getCell(1).value = "TRANSACTION LOG";
    styleSectionHeader(txHdr.getCell(1), COLORS.txHeader);
    txHdr.height = 20;

    // Column headers
    const txColRow = ws.getRow(txStartRow + 1);
    txColRow.height = 16;
    for (const [col, label] of [[1, "Date"], [2, "Description"], [3, "Category"], [4, "Amount"]] as [number, string][]) {
      const cell = txColRow.getCell(col);
      styleColHeader(cell, COLORS.txSubHeader);
      cell.value = label;
    }

    // Data
    sheet.transactions.forEach((r, i) => {
      const txRow = ws.getRow(txStartRow + 2 + i);
      txRow.height = 15;
      const even2 = i % 2 === 0;
      const amt = parseNum(r.amount);
      for (const [col, val] of [[1, r.date], [2, r.description], [3, r.category]] as [number, string][]) {
        const cell = txRow.getCell(col);
        cell.value = val;
        styleDataCell(cell, even2);
      }
      const amtCell = txRow.getCell(4);
      amtCell.value = asNum(r.amount) as ExcelJS.CellValue;
      styleDataCell(amtCell, even2);
      amtCell.numFmt = USD_FMT;
      amtCell.alignment = { horizontal: "right" };
      if (amt < 0) amtCell.font = { size: 10, color: { argb: COLORS.negRed } };
      if (amt > 0) amtCell.font = { size: 10, color: { argb: "FF1A7A50" } };
    });

    // Total
    const txTotalAmt = sheet.transactions.reduce((a, r) => a + parseNum(r.amount), 0);
    const txTotRow = ws.getRow(txStartRow + 2 + sheet.transactions.length);
    txTotRow.getCell(1).value = "NET TOTAL";
    txTotRow.getCell(4).value = txTotalAmt;
    for (let c = 1; c <= 4; c++) styleTotalCell(txTotRow.getCell(c), COLORS.txTotal);
    txTotRow.getCell(4).numFmt = USD_FMT;
    txTotRow.getCell(4).alignment = { horizontal: "right" };
  }

  // ── Print settings ───────────────────────────────────────────────────────
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:5",
    margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
  };
  ws.headerFooter = {
    oddHeader: `&L&B${tabLabel} Budget&R&P of &N`,
    oddFooter:  "&LExchange App&RExported: " + today,
  };
}

// ─── Annual Summary sheet ─────────────────────────────────────────────────────

function buildAnnualSummary(wb: ExcelJS.Workbook, sheets: BudgetSheet[], year: number, label: string) {
  const ws = wb.addWorksheet("Annual Summary");

  ws.columns = [
    { width: 28 },
    ...Array.from({ length: 12 }, () => ({ width: 13 })),
    { width: 14 }, // Annual Total
  ];

  // Title
  const titleRow = ws.addRow([`${label} Budget — ${year} Annual Summary`]);
  ws.mergeCells(1, 1, 1, 14);
  applyFill(titleRow.getCell(1), COLORS.titleBg);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.white } };
  titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  titleRow.height = 26;
  ws.addRow([]);

  // Month header row
  const hRow = ws.addRow(["", ...MONTH_NAMES, "ANNUAL TOTAL"]);
  hRow.height = 20;
  hRow.eachCell((cell, ci) => {
    applyFill(cell, COLORS.incHeader);
    cell.font = { bold: true, size: 9, color: { argb: COLORS.white } };
    cell.alignment = { horizontal: ci === 1 ? "left" : "center" };
    cell.border = { bottom: { style: "medium", color: { argb: COLORS.black } } };
  });

  const addARow = (rowLabel: string, fn: (s: BudgetSheet) => number, fillArgb?: string, negative?: boolean) => {
    const vals = MONTH_NAMES.map((_, i) => {
      const s = sheets.find((sh) => sh.month === i + 1);
      return s ? fn(s) : (null as unknown as number);
    });
    const annualTotal = vals.reduce((a, v) => a + (v ?? 0), 0);
    const row = ws.addRow([rowLabel, ...vals, annualTotal]);
    row.eachCell((cell, ci) => {
      if (fillArgb) {
        applyFill(cell, fillArgb);
        cell.font = { bold: true, size: 9 };
        cell.border = { top: { style: "medium", color: { argb: COLORS.black } }, bottom: { style: "thin", color: { argb: "FFB0BEC5" } } };
      } else {
        cell.font = { size: 9 };
        applyBorder(cell, "hair");
      }
      if (ci > 1) {
        cell.numFmt = USD_FMT;
        cell.alignment = { horizontal: "right" };
        if (negative && typeof cell.value === "number" && cell.value < 0) {
          cell.font = { ...(cell.font as ExcelJS.Font), color: { argb: COLORS.negRed } };
        }
      }
    });
  };

  // Income block
  addARow("Income (Budgeted)", (s) => s.income.reduce((a, r) => a + parseNum(r.budgeted), 0));
  addARow("Income (Actual)",   (s) => s.income.reduce((a, r) => a + parseNum(r.actual), 0),   COLORS.incTotal);
  ws.addRow([]);

  // Fixed block
  addARow("Fixed Exp. (Budget)", (s) => s.fixedExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0));
  addARow("Fixed Exp. (Paid)",   (s) => s.fixedExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0), COLORS.fxTotal);
  ws.addRow([]);

  // Variable block
  addARow("Variable Exp. (Budget)", (s) => s.variableExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0));
  addARow("Variable Exp. (Paid)",   (s) => s.variableExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0), COLORS.vrTotal);
  ws.addRow([]);

  // Net Cash Flow
  addARow(
    "Net Cash Flow (Actual)",
    (s) => {
      const inc = s.income.reduce((a, r) => a + parseNum(r.actual || r.budgeted), 0);
      const exp = [...s.fixedExpenses, ...s.variableExpenses].reduce((a, r) => a + parseNum(r.paidToDate || r.budgetAmt), 0);
      return inc - exp;
    },
    COLORS.incTotal,
    true,
  );

  ws.views = [{ state: "frozen", xSplit: 1, ySplit: 3, topLeftCell: "B4" }];
  ws.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 };
  ws.properties.tabColor = { argb: "FF0A2E4A" };
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportBudgetToExcel(
  sheets: BudgetSheet[],
  year: number,
  label: string
): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator   = "Exchange App";
  wb.created   = new Date();
  wb.modified  = new Date();
  wb.title     = `${label} Budget ${year}`;
  wb.subject   = "Monthly Budget";
  wb.keywords  = "budget,finance,exchange";

  // Annual summary tab first
  buildAnnualSummary(wb, sheets, year, label);

  // One tab per month in calendar order
  const sorted = [...sheets].sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
  for (const sheet of sorted) {
    const monthName  = sheet.month != null ? MONTH_NAMES[sheet.month - 1] : sheet.name;
    const tabLabel   = `${monthName} ${year}`;
    buildMonthSheet(wb, sheet, tabLabel.slice(0, 31));
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
