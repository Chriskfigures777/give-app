"use server";

import ExcelJS from "exceljs";
import type { BudgetSheet } from "./budget-types";
import { MONTH_NAMES, parseNum } from "./budget-types";

function fmtNum(val: string): number | string {
  const n = parseNum(val);
  return n === 0 && val === "" ? "" : n;
}

function headerRow(ws: ExcelJS.Worksheet, cols: string[], fillColor: string) {
  const row = ws.addRow(cols);
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF000000" } },
    };
  });
  row.height = 20;
}

function totalRow(ws: ExcelJS.Worksheet, values: (string | number)[], fillColor: string) {
  const row = ws.addRow(values);
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
    cell.font = { bold: true, size: 10 };
    cell.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
    };
  });
}

function sectionTitle(ws: ExcelJS.Worksheet, title: string, colSpan: number, fillColor: string) {
  const row = ws.addRow([title]);
  const cell = row.getCell(1);
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
  cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  cell.alignment = { vertical: "middle" };
  row.height = 22;
  ws.mergeCells(row.number, 1, row.number, colSpan);
}

function emptyRow(ws: ExcelJS.Worksheet) {
  ws.addRow([]);
}

function styleDataCell(cell: ExcelJS.Cell, idx: number) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: idx % 2 === 0 ? "FFF5F5F5" : "FFFFFFFF" },
  };
  cell.font = { size: 10 };
  cell.border = {
    bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
    right: { style: "thin", color: { argb: "FFE0E0E0" } },
  };
}

function addSheetToWorkbook(
  wb: ExcelJS.Workbook,
  sheet: BudgetSheet,
  sheetLabel: string
) {
  const ws = wb.addWorksheet(sheetLabel);

  ws.columns = [
    { width: 32 }, // label
    { width: 14 }, // col2
    { width: 14 }, // col3
    { width: 14 }, // col4
    { width: 12 }, // col5
  ];

  // ── INCOME ──────────────────────────────────────────────────────────────
  sectionTitle(ws, "INCOME", 3, "FF1A7A50");
  headerRow(ws, ["Category", "Budgeted", "Actual"], "FF219653");
  sheet.income.forEach((r, i) => {
    const row = ws.addRow([r.category, fmtNum(r.budgeted), fmtNum(r.actual)]);
    row.eachCell((cell) => styleDataCell(cell, i));
  });
  const totalIncomeBudgeted = sheet.income.reduce((a, r) => a + parseNum(r.budgeted), 0);
  const totalIncomeActual   = sheet.income.reduce((a, r) => a + parseNum(r.actual), 0);
  totalRow(ws, ["TOTAL INCOME", totalIncomeBudgeted, totalIncomeActual], "FFCFF7E4");

  emptyRow(ws);

  // ── FIXED EXPENSES ───────────────────────────────────────────────────────
  sectionTitle(ws, "FIXED EXPENSES", 5, "FF7B3000");
  headerRow(ws, ["Item", "Budget Amt", "Paid to Date", "Remaining", "Due Date"], "FFD35400");
  sheet.fixedExpenses.forEach((r, i) => {
    const remaining = parseNum(r.budgetAmt) - parseNum(r.paidToDate);
    const row = ws.addRow([r.item, fmtNum(r.budgetAmt), fmtNum(r.paidToDate), remaining || "", r.dueDate]);
    row.eachCell((cell) => styleDataCell(cell, i));
  });
  const totalFixedBudget  = sheet.fixedExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0);
  const totalFixedPaid    = sheet.fixedExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0);
  totalRow(ws, ["TOTAL FIXED EXPENSES", totalFixedBudget, totalFixedPaid, totalFixedBudget - totalFixedPaid, ""], "FFFFE0CC");

  emptyRow(ws);

  // ── VARIABLE EXPENSES ────────────────────────────────────────────────────
  sectionTitle(ws, "VARIABLE EXPENSES", 5, "FF4B0082");
  headerRow(ws, ["Item", "Budget Amt", "Paid to Date", "Remaining", "Due Date"], "FF7B68EE");
  sheet.variableExpenses.forEach((r, i) => {
    const remaining = parseNum(r.budgetAmt) - parseNum(r.paidToDate);
    const row = ws.addRow([r.item, fmtNum(r.budgetAmt), fmtNum(r.paidToDate), remaining || "", r.dueDate]);
    row.eachCell((cell) => styleDataCell(cell, i));
  });
  const totalVarBudget = sheet.variableExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0);
  const totalVarPaid   = sheet.variableExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0);
  totalRow(ws, ["TOTAL VARIABLE EXPENSES", totalVarBudget, totalVarPaid, totalVarBudget - totalVarPaid, ""], "FFE8E0FF");

  emptyRow(ws);

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  sectionTitle(ws, "SUMMARY", 3, "FF0B3954");
  headerRow(ws, ["Description", "Budgeted", "Actual"], "FF1A6E9E");
  const summaryRows = [
    ["Total Income",           totalIncomeBudgeted, totalIncomeActual],
    ["Total Fixed Expenses",   totalFixedBudget,    totalFixedPaid],
    ["Total Variable Expenses",totalVarBudget,      totalVarPaid],
    ["Net Cash Flow",
      totalIncomeBudgeted - totalFixedBudget - totalVarBudget,
      totalIncomeActual   - totalFixedPaid   - totalVarPaid],
  ];
  summaryRows.forEach((sr, i) => {
    const row = ws.addRow(sr);
    row.eachCell((cell) => styleDataCell(cell, i));
    if (i === 3) { // Net cash flow — bold
      row.eachCell((cell) => { cell.font = { bold: true, size: 10 }; });
    }
  });

  emptyRow(ws);

  // ── TRANSACTIONS ─────────────────────────────────────────────────────────
  if (sheet.transactions.length > 0) {
    sectionTitle(ws, "TRANSACTION LOG", 4, "FF003366");
    headerRow(ws, ["Date", "Description", "Category", "Amount"], "FF1A5276");
    sheet.transactions.forEach((r, i) => {
      const row = ws.addRow([r.date, r.description, r.category, fmtNum(r.amount)]);
      row.eachCell((cell) => styleDataCell(cell, i));
    });
    const totalAmt = sheet.transactions.reduce((a, r) => a + parseNum(r.amount), 0);
    totalRow(ws, ["TOTAL TRANSACTIONS", "", "", totalAmt], "FFD6EAF8");
  }
}

export async function exportBudgetToExcel(
  sheets: BudgetSheet[],
  year: number,
  label: string
): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Exchange App";
  wb.created = new Date();
  wb.title = `${label} Budget ${year}`;

  // ── Annual summary sheet ─────────────────────────────────────────────────
  const summaryWs = wb.addWorksheet("Annual Summary");
  summaryWs.columns = [
    { width: 20 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 14 },
  ];

  // Title
  const titleRow = summaryWs.addRow([`${label} Budget — ${year} Annual Summary`]);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  summaryWs.mergeCells(1, 1, 1, 13);
  summaryWs.addRow([]);

  // Header
  const hRow = summaryWs.addRow(["Category", ...MONTH_NAMES, "ANNUAL TOTAL"]);
  hRow.eachCell((cell, ci) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A7A50" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
    cell.alignment = { horizontal: ci === 1 ? "left" : "center" };
  });
  hRow.height = 20;

  const addAnnualRow = (rowLabel: string, getValue: (s: BudgetSheet) => number, fillColor?: string) => {
    const vals = MONTH_NAMES.map((_, i) => {
      const s = sheets.find((sh) => sh.month === i + 1);
      return s ? getValue(s) : "";
    });
    const total = (vals as number[]).reduce((a, v) => a + (typeof v === "number" ? v : 0), 0);
    const row = summaryWs.addRow([rowLabel, ...vals, total]);
    row.eachCell((cell, ci) => {
      cell.font = { size: 9 };
      if (fillColor) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
        cell.font = { bold: true, size: 9 };
      }
      if (ci > 1) cell.alignment = { horizontal: "right" };
    });
  };

  addAnnualRow("Income (Budgeted)",   (s) => s.income.reduce((a, r) => a + parseNum(r.budgeted), 0));
  addAnnualRow("Income (Actual)",     (s) => s.income.reduce((a, r) => a + parseNum(r.actual), 0),   "FFE8F8EF");
  summaryWs.addRow([]);
  addAnnualRow("Fixed Exp. (Budget)", (s) => s.fixedExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0));
  addAnnualRow("Fixed Exp. (Paid)",   (s) => s.fixedExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0), "FFFFE0CC");
  summaryWs.addRow([]);
  addAnnualRow("Variable Exp. (Budget)", (s) => s.variableExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0));
  addAnnualRow("Variable Exp. (Paid)",   (s) => s.variableExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0), "FFE8E0FF");
  summaryWs.addRow([]);
  addAnnualRow(
    "Net Cash Flow",
    (s) => {
      const inc = s.income.reduce((a, r) => a + parseNum(r.actual || r.budgeted), 0);
      const exp = [...s.fixedExpenses, ...s.variableExpenses].reduce((a, r) => a + parseNum(r.paidToDate || r.budgetAmt), 0);
      return inc - exp;
    },
    "FFCFF7E4"
  );

  // ── One tab per month ────────────────────────────────────────────────────
  const sortedSheets = [...sheets].sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
  for (const sheet of sortedSheets) {
    const monthLabel = sheet.month != null ? MONTH_NAMES[sheet.month - 1] : sheet.name;
    addSheetToWorkbook(wb, sheet, monthLabel.slice(0, 31));
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
