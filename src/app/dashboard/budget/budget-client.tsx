"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Receipt,
  TableProperties,
  Building2,
  User,
  Loader2,
  Download,
  FolderOpen,
  Calendar,
  LayoutDashboard,
  FileSpreadsheet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BudgetAnalytics } from "./budget-analytics";
import { exportBudgetToExcel } from "./budget-export";
import type { BudgetSheet, IncomeRow, FixedExpRow, VarExpRow, TransactionRow } from "./budget-types";
import { MONTH_NAMES, parseNum, fmtCurrency } from "./budget-types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function uid() { return crypto.randomUUID(); }

function currentYear() { return new Date().getFullYear(); }

function dbToIncomeRow(r: Record<string, unknown>): IncomeRow {
  return { id: r.id as string, sort_order: (r.sort_order as number) ?? 0, category: (r.category as string) ?? "", budgeted: r.budgeted != null ? String(r.budgeted) : "", actual: r.actual != null ? String(r.actual) : "" };
}
function dbToFixedRow(r: Record<string, unknown>): FixedExpRow {
  return { id: r.id as string, sort_order: (r.sort_order as number) ?? 0, item: (r.item as string) ?? "", budgetAmt: r.budget_amt != null ? String(r.budget_amt) : "", paidToDate: r.paid_to_date != null ? String(r.paid_to_date) : "", dueDate: (r.due_date as string) ?? "—" };
}
function dbToVarRow(r: Record<string, unknown>): VarExpRow {
  return { id: r.id as string, sort_order: (r.sort_order as number) ?? 0, item: (r.item as string) ?? "", budgetAmt: r.budget_amt != null ? String(r.budget_amt) : "", paidToDate: r.paid_to_date != null ? String(r.paid_to_date) : "", dueDate: (r.due_date as string) ?? "—" };
}
function dbToTransaction(r: Record<string, unknown>): TransactionRow {
  return { id: r.id as string, sort_order: (r.sort_order as number) ?? 0, date: r.txn_date != null ? String(r.txn_date) : "", description: (r.description as string) ?? "", category: (r.category as string) ?? "", amount: r.amount != null ? String(r.amount) : "" };
}

function defaultIncomeRows(): IncomeRow[] {
  return [
    { id: uid(), sort_order: 0, category: "Primary Income", budgeted: "", actual: "" },
    { id: uid(), sort_order: 1, category: "Secondary / Gig Income", budgeted: "", actual: "" },
    { id: uid(), sort_order: 2, category: "Money in Account", budgeted: "", actual: "" },
    { id: uid(), sort_order: 3, category: "Emergency Fund", budgeted: "0", actual: "" },
  ];
}
function defaultFixedRows(): FixedExpRow[] {
  return [
    { id: uid(), sort_order: 0, item: "Rent / Mortgage", budgetAmt: "", paidToDate: "", dueDate: "1st" },
    { id: uid(), sort_order: 1, item: "Car Insurance", budgetAmt: "", paidToDate: "", dueDate: "15th" },
    { id: uid(), sort_order: 2, item: "Phone Bill", budgetAmt: "", paidToDate: "", dueDate: "—" },
    { id: uid(), sort_order: 3, item: "Tithe / Giving", budgetAmt: "", paidToDate: "", dueDate: "1st" },
    { id: uid(), sort_order: 4, item: "Internet", budgetAmt: "", paidToDate: "", dueDate: "—" },
    { id: uid(), sort_order: 5, item: "Credit Card", budgetAmt: "", paidToDate: "", dueDate: "—" },
  ];
}
function defaultVarRows(): VarExpRow[] {
  return [
    { id: uid(), sort_order: 0, item: "Gas", budgetAmt: "", paidToDate: "", dueDate: "—" },
    { id: uid(), sort_order: 1, item: "Groceries", budgetAmt: "", paidToDate: "", dueDate: "—" },
    { id: uid(), sort_order: 2, item: "Utilities", budgetAmt: "", paidToDate: "", dueDate: "15th" },
    { id: uid(), sort_order: 3, item: "Fun / Personal", budgetAmt: "", paidToDate: "", dueDate: "—" },
  ];
}

function createMonthSheet(year: number, month: number, type: "personal" | "church"): BudgetSheet {
  return {
    id: uid(), name: `${MONTH_NAMES[month - 1]} ${year}`, budget_type: type,
    year, month, income: defaultIncomeRows(), fixedExpenses: defaultFixedRows(),
    variableExpenses: defaultVarRows(), transactions: [],
  };
}

// ─── Cell / Table primitives ──────────────────────────────────────────────────

function CellInput({ value, onChange, placeholder = "", align = "left", muted = false }: { value: string; onChange: (v: string) => void; placeholder?: string; align?: "left" | "right" | "center"; muted?: boolean }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={["w-full min-w-0 bg-transparent text-[13px] leading-tight outline-none px-2 py-1.5", "focus:bg-dashboard-card-hover rounded", "placeholder:text-dashboard-text-muted/25 transition-colors duration-100", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left", muted ? "text-dashboard-text-muted" : "text-dashboard-text"].join(" ")} />
  );
}
function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" | "center" }) {
  return <th className={["px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted/70 border-b border-dashboard-border whitespace-nowrap bg-dashboard-card-hover", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"].join(" ")}>{children}</th>;
}

// ─── Accordion Section ────────────────────────────────────────────────────────

function AccordionSection({ title, icon, valueColor, defaultOpen = true, badge, children }: { title: string; icon: React.ReactNode; valueColor?: string; defaultOpen?: boolean; badge?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-dashboard-card-hover transition-colors duration-150">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-dashboard-card-hover flex-shrink-0 text-dashboard-text-muted [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </div>
          <span className="text-sm font-semibold text-dashboard-text">{title}</span>
          {badge && (
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums" style={{ color: valueColor ?? "#8892a4", background: valueColor ? `${valueColor}18` : "rgba(136,146,164,0.12)" }}>
              {badge}
            </span>
          )}
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="text-dashboard-text-muted/50 flex-shrink-0">
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: "hidden" }}>
            <div className="border-t border-dashboard-border">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Spreadsheet Sections ─────────────────────────────────────────────────────

function IncomeSection({ rows, onRowChange, onAddRow, onDeleteRow }: { rows: IncomeRow[]; onRowChange: (id: string, f: keyof IncomeRow, v: string) => void; onAddRow: () => void; onDeleteRow: (id: string) => void }) {
  const tb = rows.reduce((a, r) => a + parseNum(r.budgeted), 0);
  const ta = rows.reduce((a, r) => a + parseNum(r.actual), 0);
  return (
    <AccordionSection title="Income" icon={<TrendingUp />} valueColor="#34d399" badge={fmtCurrency(tb)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[400px]">
          <colgroup><col style={{ width: "46%" }} /><col style={{ width: "22%" }} /><col style={{ width: "22%" }} /><col style={{ width: "10%" }} /></colgroup>
          <thead><tr><Th>Category</Th><Th align="right">Budgeted</Th><Th align="right">Actual</Th><Th /></tr></thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={["group border-b border-dashboard-border/50 transition-colors hover:bg-dashboard-card-hover", idx % 2 !== 0 ? "bg-[rgba(255,255,255,0.018)]" : ""].join(" ")}>
                <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.category} onChange={(v) => onRowChange(row.id, "category", v)} placeholder="Income source" /></td>
                <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.budgeted} onChange={(v) => onRowChange(row.id, "budgeted", v)} placeholder="0.00" align="right" /></td>
                <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.actual} onChange={(v) => onRowChange(row.id, "actual", v)} placeholder="0.00" align="right" /></td>
                <td className="px-2 py-0"><button type="button" onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-dashboard-text-muted/60 hover:text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-dashboard-card-hover border-t border-dashboard-border">
              <td className="px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dashboard-text-muted">Total Income</td>
              <td className="px-2 py-2 text-[13px] font-bold text-right text-[#34d399] tabular-nums">{fmtCurrency(tb)}</td>
              <td className="px-2 py-2 text-[13px] font-bold text-right text-[#34d399] tabular-nums">{fmtCurrency(ta)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-dashboard-border/40">
        <button type="button" onClick={onAddRow} className="flex items-center gap-1.5 text-xs text-dashboard-text-muted hover:text-dashboard-text transition-colors">
          <Plus className="h-3.5 w-3.5" />Add income row
        </button>
      </div>
    </AccordionSection>
  );
}

function ExpenseSection({ title, rows, onRowChange, onAddRow, onDeleteRow, addLabel }: { title: string; rows: (FixedExpRow | VarExpRow)[]; onRowChange: (id: string, f: string, v: string) => void; onAddRow: () => void; onDeleteRow: (id: string) => void; addLabel: string }) {
  const tb = rows.reduce((a, r) => a + parseNum((r as FixedExpRow).budgetAmt), 0);
  const tp = rows.reduce((a, r) => a + parseNum((r as FixedExpRow).paidToDate), 0);
  const rem = tb - tp;
  return (
    <AccordionSection title={title} icon={title.includes("Fixed") ? <Receipt /> : <TrendingDown />} badge={fmtCurrency(tb)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[520px]">
          <colgroup><col style={{ width: "36%" }} /><col style={{ width: "18%" }} /><col style={{ width: "18%" }} /><col style={{ width: "18%" }} /><col style={{ width: "8%" }} /><col style={{ width: "2%" }} /></colgroup>
          <thead><tr><Th>Item</Th><Th align="right">Budget Amt</Th><Th align="right">Paid to Date</Th><Th align="right">Remaining</Th><Th align="center">Due</Th><Th /></tr></thead>
          <tbody>
            {rows.map((row, idx) => {
              const r = row as FixedExpRow;
              const rowRem = parseNum(r.budgetAmt) - parseNum(r.paidToDate);
              return (
                <tr key={r.id} className={["group border-b border-dashboard-border/50 transition-colors hover:bg-dashboard-card-hover", idx % 2 !== 0 ? "bg-[rgba(255,255,255,0.018)]" : ""].join(" ")}>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={r.item} onChange={(v) => onRowChange(r.id, "item", v)} placeholder="Expense" /></td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={r.budgetAmt} onChange={(v) => onRowChange(r.id, "budgetAmt", v)} placeholder="0.00" align="right" /></td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={r.paidToDate} onChange={(v) => onRowChange(r.id, "paidToDate", v)} placeholder="0.00" align="right" /></td>
                  <td className={["px-2 py-1.5 border-r border-dashboard-border/40 text-[13px] text-right tabular-nums", rowRem < 0 ? "text-red-400" : rowRem === 0 ? "text-dashboard-text-muted" : "text-dashboard-text"].join(" ")}>{fmtCurrency(rowRem)}</td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={r.dueDate} onChange={(v) => onRowChange(r.id, "dueDate", v)} placeholder="—" align="center" muted /></td>
                  <td className="px-2 py-0"><button type="button" onClick={() => onDeleteRow(r.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-dashboard-text-muted/60 hover:text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-dashboard-card-hover border-t border-dashboard-border">
              <td className="px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dashboard-text-muted">Total</td>
              <td className="px-2 py-2 text-[13px] font-bold text-right text-dashboard-text tabular-nums">{fmtCurrency(tb)}</td>
              <td className="px-2 py-2 text-[13px] font-bold text-right text-dashboard-text tabular-nums">{fmtCurrency(tp)}</td>
              <td className={["px-2 py-2 text-[13px] font-bold text-right tabular-nums", rem < 0 ? "text-red-400" : "text-dashboard-text"].join(" ")}>{fmtCurrency(rem)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-dashboard-border/40">
        <button type="button" onClick={onAddRow} className="flex items-center gap-1.5 text-xs text-dashboard-text-muted hover:text-dashboard-text transition-colors">
          <Plus className="h-3.5 w-3.5" />{addLabel}
        </button>
      </div>
    </AccordionSection>
  );
}

function SummarySection({ sheet }: { sheet: BudgetSheet }) {
  const ti = sheet.income.reduce((a, r) => a + parseNum(r.budgeted), 0);
  const tai = sheet.income.reduce((a, r) => a + parseNum(r.actual), 0);
  const tf = sheet.fixedExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0);
  const taf = sheet.fixedExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0);
  const tv = sheet.variableExpenses.reduce((a, r) => a + parseNum(r.budgetAmt), 0);
  const tav = sheet.variableExpenses.reduce((a, r) => a + parseNum(r.paidToDate), 0);
  const bcf = ti - tf - tv;
  const acf = tai - taf - tav;

  const SRow = ({ label, b, a, bold }: { label: string; b: number; a: number; bold?: boolean }) => (
    <tr className={["border-b border-dashboard-border/40", bold ? "bg-dashboard-card-hover" : ""].join(" ")}>
      <td className={["px-3 py-2 text-[12px]", bold ? "font-semibold text-dashboard-text" : "text-dashboard-text-muted"].join(" ")}>{label}</td>
      <td className={["px-3 py-2 text-[13px] text-right tabular-nums", bold ? (b < 0 ? "font-bold text-red-400" : "font-bold text-[#34d399]") : "text-dashboard-text"].join(" ")}>{fmtCurrency(b)}</td>
      <td className={["px-3 py-2 text-[13px] text-right tabular-nums", bold ? (a < 0 ? "font-bold text-red-400" : "font-bold text-[#34d399]") : (a < 0 ? "text-red-400" : "text-dashboard-text")].join(" ")}>{fmtCurrency(a)}</td>
    </tr>
  );

  return (
    <AccordionSection title="Summary" icon={<BarChart3 />} valueColor="#34d399">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[320px]">
          <thead><tr><Th>Description</Th><Th align="right">Budgeted</Th><Th align="right">Actual</Th></tr></thead>
          <tbody>
            <SRow label="Total Income" b={ti} a={tai} />
            <SRow label="Fixed Expenses" b={tf} a={taf} />
            <SRow label="Variable Expenses" b={tv} a={tav} />
            <SRow label="Net Cash Flow" b={bcf} a={acf} bold />
          </tbody>
        </table>
      </div>
      <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-dashboard-border/40">
        {[
          { label: "Budgeted Income", val: ti, color: "#34d399" },
          { label: "Total Expenses", val: tf + tv, color: ti > 0 && (tf + tv) > ti ? "#f87171" : "#eef0f6" },
          { label: "Net Cash Flow", val: bcf, color: bcf >= 0 ? "#34d399" : "#f87171" },
          { label: "Actual Cash Flow", val: acf, color: acf >= 0 ? "#34d399" : "#f87171" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 border border-dashboard-border bg-dashboard-card-hover">
            <p className="text-[10px] uppercase tracking-wider text-dashboard-text-muted/70 mb-1.5">{s.label}</p>
            <p className="text-base font-bold tabular-nums" style={{ color: s.color }}>{fmtCurrency(s.val)}</p>
          </div>
        ))}
      </div>
    </AccordionSection>
  );
}

function TransactionSection({ rows, onRowChange, onAddRow, onDeleteRow }: { rows: TransactionRow[]; onRowChange: (id: string, f: keyof TransactionRow, v: string) => void; onAddRow: () => void; onDeleteRow: (id: string) => void }) {
  const income = rows.filter((r) => parseNum(r.amount) > 0).reduce((a, r) => a + parseNum(r.amount), 0);
  const expenses = rows.filter((r) => parseNum(r.amount) < 0).reduce((a, r) => a + parseNum(r.amount), 0);
  return (
    <AccordionSection title="Transaction Log" icon={<TableProperties />} defaultOpen={false} badge={rows.length > 0 ? `${rows.length} entries` : undefined}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <colgroup><col style={{ width: "14%" }} /><col style={{ width: "36%" }} /><col style={{ width: "24%" }} /><col style={{ width: "18%" }} /><col style={{ width: "8%" }} /></colgroup>
          <thead><tr><Th>Date</Th><Th>Description</Th><Th>Category</Th><Th align="right">Amount</Th><Th /></tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-dashboard-text-muted">No transactions yet — click &quot;Add transaction&quot; below.</td></tr>
            )}
            {rows.map((row, idx) => {
              const amt = parseNum(row.amount);
              return (
                <tr key={row.id} className={["group border-b border-dashboard-border/50 transition-colors hover:bg-dashboard-card-hover", idx % 2 !== 0 ? "bg-[rgba(255,255,255,0.018)]" : ""].join(" ")}>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.date} onChange={(v) => onRowChange(row.id, "date", v)} placeholder="YYYY-MM-DD" muted /></td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.description} onChange={(v) => onRowChange(row.id, "description", v)} placeholder="Description" /></td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.category} onChange={(v) => onRowChange(row.id, "category", v)} placeholder="Category" muted /></td>
                  <td className={["px-2 py-1.5 border-r border-dashboard-border/40 text-[13px] text-right tabular-nums", amt > 0 ? "text-[#34d399]" : amt < 0 ? "text-red-400" : "text-dashboard-text"].join(" ")}>
                    {row.amount !== "" ? fmtCurrency(amt) : <span className="text-dashboard-text-muted/30">0.00</span>}
                  </td>
                  <td className="px-2 py-0"><button type="button" onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-dashboard-text-muted/60 hover:text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-dashboard-card-hover border-t border-dashboard-border">
                <td colSpan={3} className="px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dashboard-text-muted">Totals</td>
                <td className="px-2 py-2 text-[13px] font-bold text-right tabular-nums">
                  <span className="text-[#34d399]">{fmtCurrency(income)}</span>
                  <span className="text-dashboard-text-muted/50 mx-1.5">/</span>
                  <span className="text-red-400">{fmtCurrency(expenses)}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-dashboard-border/40">
        <button type="button" onClick={onAddRow} className="flex items-center gap-1.5 text-xs text-dashboard-text-muted hover:text-dashboard-text transition-colors">
          <Plus className="h-3.5 w-3.5" />Add transaction
        </button>
      </div>
    </AccordionSection>
  );
}

// ─── Main BudgetClient ────────────────────────────────────────────────────────

export function BudgetClient({ userId, orgId, orgName }: { userId: string; orgId: string | null; orgName: string | null }) {
  const supabase = createClient();
  const [budgetType, setBudgetType] = useState<"personal" | "church">("personal");
  const [allSheets, setAllSheets] = useState<BudgetSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Navigation state
  const [selectedYear, setSelectedYear] = useState<number>(currentYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [view, setView] = useState<"spreadsheet" | "analytics">("spreadsheet");

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived data ────────────────────────────────────────────────────────────

  const years = [...new Set(allSheets.map((s) => s.year).filter((y): y is number => y != null))].sort((a, b) => b - a);
  const sheetsForYear = (y: number) => allSheets.filter((s) => s.year === y);
  const activeSheet = allSheets.find((s) => s.year === selectedYear && s.month === selectedMonth) ?? null;
  const prevYearSheets = sheetsForYear(selectedYear - 1).length > 0 ? sheetsForYear(selectedYear - 1) : undefined;

  // ── Load from Supabase ──────────────────────────────────────────────────────

  const loadSheets = useCallback(async (type: "personal" | "church") => {
    setLoading(true);
    try {
      let q = supabase
        .from("budget_sheets")
        .select(`id,name,budget_type,year,month,sort_order,budget_income_rows(id,sort_order,category,budgeted,actual),budget_fixed_expense_rows(id,sort_order,item,budget_amt,paid_to_date,due_date),budget_variable_expense_rows(id,sort_order,item,budget_amt,paid_to_date,due_date),budget_transactions(id,sort_order,txn_date,description,category,amount)`)
        .eq("budget_type", type)
        .order("year", { ascending: false })
        .order("month", { ascending: true });

      if (type === "personal") q = q.eq("user_id", userId);
      else if (orgId) q = q.eq("organization_id", orgId);

      const { data, error } = await q;
      if (error) throw error;

      const mapped: BudgetSheet[] = (data ?? []).map((s) => ({
        id: s.id, name: s.name, budget_type: s.budget_type as "personal" | "church",
        year: s.year as number | null, month: s.month as number | null,
        income: ((s.budget_income_rows ?? []) as Record<string, unknown>[]).sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0)).map(dbToIncomeRow),
        fixedExpenses: ((s.budget_fixed_expense_rows ?? []) as Record<string, unknown>[]).sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0)).map(dbToFixedRow),
        variableExpenses: ((s.budget_variable_expense_rows ?? []) as Record<string, unknown>[]).sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0)).map(dbToVarRow),
        transactions: ((s.budget_transactions ?? []) as Record<string, unknown>[]).sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0)).map(dbToTransaction),
      }));

      setAllSheets(mapped);
    } catch (err) {
      console.error("Failed to load budget sheets:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadSheets(budgetType); }, [budgetType, loadSheets]);

  // ── Create a full year (12 months) ─────────────────────────────────────────

  async function createYear(year: number) {
    const existing = allSheets.filter((s) => s.year === year && s.month != null).map((s) => s.month);
    const toCreate = MONTH_NAMES.map((_, i) => i + 1).filter((m) => !existing.includes(m));
    if (toCreate.length === 0) { setSelectedYear(year); return; }

    const newSheets: BudgetSheet[] = toCreate.map((m) => createMonthSheet(year, m, budgetType));

    // Insert all 12 sheets in one go
    const { data: inserted, error: sheetErr } = await supabase
      .from("budget_sheets")
      .insert(newSheets.map((s, i) => ({ id: s.id, user_id: userId, organization_id: budgetType === "church" ? orgId : null, budget_type: budgetType, name: s.name, year: s.year, month: s.month, sort_order: existing.length + i })))
      .select("id, month");
    if (sheetErr || !inserted) { console.error(sheetErr); return; }

    // Insert default rows for each sheet
    const incomeInserts = newSheets.flatMap((s) => s.income.map((r, i) => ({ id: r.id, sheet_id: s.id, sort_order: i, category: r.category, budgeted: parseNum(r.budgeted) || null, actual: null })));
    const fixedInserts  = newSheets.flatMap((s) => s.fixedExpenses.map((r, i) => ({ id: r.id, sheet_id: s.id, sort_order: i, item: r.item, budget_amt: parseNum(r.budgetAmt) || null, paid_to_date: null, due_date: r.dueDate })));
    const varInserts    = newSheets.flatMap((s) => s.variableExpenses.map((r, i) => ({ id: r.id, sheet_id: s.id, sort_order: i, item: r.item, budget_amt: parseNum(r.budgetAmt) || null, paid_to_date: null, due_date: r.dueDate })));

    await Promise.all([
      supabase.from("budget_income_rows").insert(incomeInserts),
      supabase.from("budget_fixed_expense_rows").insert(fixedInserts),
      supabase.from("budget_variable_expense_rows").insert(varInserts),
    ]);

    setAllSheets((prev) => [...prev, ...newSheets]);
    setSelectedYear(year);
    setSelectedMonth(existing.length === 0 ? new Date().getMonth() + 1 : toCreate[0]);
  }

  // ── Debounced save ──────────────────────────────────────────────────────────

  function scheduleFullSave(sheet: BudgetSheet) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistSheet(sheet), 800);
  }

  async function persistSheet(sheet: BudgetSheet) {
    setSaving(true);
    try {
      await supabase.from("budget_sheets").update({ name: sheet.name }).eq("id", sheet.id);
      await Promise.all([
        supabase.from("budget_income_rows").upsert(sheet.income.map((r, i) => ({ id: r.id, sheet_id: sheet.id, sort_order: i, category: r.category, budgeted: parseNum(r.budgeted) || null, actual: parseNum(r.actual) || null })), { onConflict: "id" }),
        supabase.from("budget_fixed_expense_rows").upsert(sheet.fixedExpenses.map((r, i) => ({ id: r.id, sheet_id: sheet.id, sort_order: i, item: r.item, budget_amt: parseNum(r.budgetAmt) || null, paid_to_date: parseNum(r.paidToDate) || null, due_date: r.dueDate })), { onConflict: "id" }),
        supabase.from("budget_variable_expense_rows").upsert(sheet.variableExpenses.map((r, i) => ({ id: r.id, sheet_id: sheet.id, sort_order: i, item: r.item, budget_amt: parseNum(r.budgetAmt) || null, paid_to_date: parseNum(r.paidToDate) || null, due_date: r.dueDate })), { onConflict: "id" }),
        supabase.from("budget_transactions").upsert(sheet.transactions.map((r, i) => ({ id: r.id, sheet_id: sheet.id, sort_order: i, txn_date: r.date || null, description: r.description, category: r.category, amount: parseNum(r.amount) || null })), { onConflict: "id" }),
      ]);
    } finally {
      setSaving(false);
    }
  }

  function updateActiveSheet(updater: (s: BudgetSheet) => BudgetSheet) {
    setAllSheets((prev) => {
      const next = prev.map((s) => (s.year === selectedYear && s.month === selectedMonth ? updater(s) : s));
      const updated = next.find((s) => s.year === selectedYear && s.month === selectedMonth);
      if (updated) scheduleFullSave(updated);
      return next;
    });
  }

  async function deleteDbRow(table: string, id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from(table).delete().eq("id", id);
  }

  // ── Row mutations ───────────────────────────────────────────────────────────

  const onIncomeRowChange = (id: string, f: keyof IncomeRow, v: string) => updateActiveSheet((s) => ({ ...s, income: s.income.map((r) => r.id === id ? { ...r, [f]: v } : r) }));
  const onAddIncomeRow    = () => updateActiveSheet((s) => ({ ...s, income: [...s.income, { id: uid(), sort_order: s.income.length, category: "", budgeted: "", actual: "" }] }));
  const onDeleteIncomeRow = (id: string) => { deleteDbRow("budget_income_rows", id); updateActiveSheet((s) => ({ ...s, income: s.income.filter((r) => r.id !== id) })); };

  const onFixedRowChange  = (id: string, f: string, v: string) => updateActiveSheet((s) => ({ ...s, fixedExpenses: s.fixedExpenses.map((r) => r.id === id ? { ...r, [f]: v } : r) }));
  const onAddFixedRow     = () => updateActiveSheet((s) => ({ ...s, fixedExpenses: [...s.fixedExpenses, { id: uid(), sort_order: s.fixedExpenses.length, item: "", budgetAmt: "", paidToDate: "", dueDate: "—" }] }));
  const onDeleteFixedRow  = (id: string) => { deleteDbRow("budget_fixed_expense_rows", id); updateActiveSheet((s) => ({ ...s, fixedExpenses: s.fixedExpenses.filter((r) => r.id !== id) })); };

  const onVarRowChange    = (id: string, f: string, v: string) => updateActiveSheet((s) => ({ ...s, variableExpenses: s.variableExpenses.map((r) => r.id === id ? { ...r, [f]: v } : r) }));
  const onAddVarRow       = () => updateActiveSheet((s) => ({ ...s, variableExpenses: [...s.variableExpenses, { id: uid(), sort_order: s.variableExpenses.length, item: "", budgetAmt: "", paidToDate: "", dueDate: "—" }] }));
  const onDeleteVarRow    = (id: string) => { deleteDbRow("budget_variable_expense_rows", id); updateActiveSheet((s) => ({ ...s, variableExpenses: s.variableExpenses.filter((r) => r.id !== id) })); };

  const onTxRowChange     = (id: string, f: keyof TransactionRow, v: string) => updateActiveSheet((s) => ({ ...s, transactions: s.transactions.map((r) => r.id === id ? { ...r, [f]: v } : r) }));
  const onAddTxRow        = () => { const today = new Date().toISOString().slice(0, 10); updateActiveSheet((s) => ({ ...s, transactions: [...s.transactions, { id: uid(), sort_order: s.transactions.length, date: today, description: "", category: "", amount: "" }] })); };
  const onDeleteTxRow     = (id: string) => { deleteDbRow("budget_transactions", id); updateActiveSheet((s) => ({ ...s, transactions: s.transactions.filter((r) => r.id !== id) })); };

  // ── Excel export ────────────────────────────────────────────────────────────

  async function handleExport() {
    const ySheets = sheetsForYear(selectedYear);
    if (ySheets.length === 0) return;
    setExporting(true);
    try {
      const bytes = await exportBudgetToExcel(
        ySheets,
        selectedYear,
        budgetType === "church" ? (orgName ?? "Church") : "Personal"
      );
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${budgetType === "church" ? (orgName ?? "Church") : "Personal"}_Budget_${selectedYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-dashboard-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading budget…</span>
      </div>
    );
  }

  const yearSheets = sheetsForYear(selectedYear);
  const hasYear = yearSheets.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dashboard-card border border-dashboard-border flex-shrink-0">
            {budgetType === "church" && orgId
              ? <Building2 className="h-5 w-5 text-dashboard-text-muted" />
              : <User className="h-5 w-5 text-dashboard-text-muted" />}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-dashboard-text">
              {budgetType === "church" && orgId ? `${orgName ?? "Church / Org"} Budget` : "Personal Budget"}
            </h1>
            <p className="mt-0.5 text-sm text-dashboard-text-muted">
              Organized by year &amp; month · free for all users
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {saving && <span className="flex items-center gap-1 text-xs text-dashboard-text-muted"><Loader2 className="h-3 w-3 animate-spin" />Saving…</span>}
          {!saving && allSheets.length > 0 && <span className="text-xs text-[#34d399]/60 hidden sm:block">● Saved</span>}

          {/* Export */}
          {hasYear && (
            <button type="button" onClick={handleExport} disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm font-medium text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text transition-colors disabled:opacity-50">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export Excel
            </button>
          )}

          {/* Budget type toggle */}
          {orgId && (
            <div className="flex items-center gap-1 rounded-xl border border-dashboard-border bg-dashboard-card p-1">
              <button type="button" onClick={() => setBudgetType("personal")} className={["flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", budgetType === "personal" ? "bg-dashboard-card-hover text-dashboard-text" : "text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                <User className="h-3.5 w-3.5" /> Personal
              </button>
              <button type="button" onClick={() => setBudgetType("church")} className={["flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", budgetType === "church" ? "bg-dashboard-card-hover text-dashboard-text" : "text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                <Building2 className="h-3.5 w-3.5" /> {orgName ?? "Church / Org"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Year Folders Sidebar ─────────────────────────────────────── */}
      <div className="flex gap-5">

        {/* Left: year list */}
        <div className="w-44 flex-shrink-0 space-y-1">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted/60 mb-2.5">Year Folders</p>

          {years.map((yr) => {
            const isOpen = yr === selectedYear;
            const mSheets = sheetsForYear(yr);
            return (
              <div key={yr}>
                <button
                  type="button"
                  onClick={() => { setSelectedYear(yr); if (!isOpen) setSelectedMonth(new Date().getMonth() + 1); }}
                  className={["w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm font-medium transition-colors", isOpen ? "bg-dashboard-card border border-dashboard-border text-dashboard-text" : "text-dashboard-text-muted hover:bg-dashboard-card hover:text-dashboard-text"].join(" ")}
                >
                  <FolderOpen className="h-4 w-4 flex-shrink-0" />
                  <span>{yr}</span>
                  <span className="ml-auto text-[10px] tabular-nums text-dashboard-text-muted/50">{mSheets.length}/12</span>
                </button>

                {/* Month list under active year */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key="months" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: "hidden" }}>
                      <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l border-dashboard-border pl-3">
                        {MONTH_NAMES.map((mn, mi) => {
                          const m = mi + 1;
                          const exists = mSheets.some((s) => s.month === m);
                          const isActive = selectedMonth === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => { if (exists) { setSelectedMonth(m); setView("spreadsheet"); } }}
                              className={["w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-left text-xs transition-colors", isActive ? "bg-dashboard-card-hover text-dashboard-text font-medium" : exists ? "text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card" : "text-dashboard-text-muted/30 cursor-default"].join(" ")}
                            >
                              <Calendar className="h-3 w-3 flex-shrink-0 opacity-60" />
                              {mn.slice(0, 3)}
                              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#34d399] flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Add new year */}
          <div className="pt-1">
            <NewYearButton existing={years} onAdd={createYear} />
          </div>
        </div>

        {/* Right: main content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* View toggle + breadcrumb */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-dashboard-text-muted">
              <span className="font-semibold text-dashboard-text">{selectedYear}</span>
              {activeSheet && view === "spreadsheet" && (
                <>
                  <span>/</span>
                  <span>{MONTH_NAMES[(selectedMonth ?? 1) - 1]}</span>
                </>
              )}
            </div>

            {hasYear && (
              <div className="flex items-center gap-1 rounded-xl border border-dashboard-border bg-dashboard-card p-1">
                <button type="button" onClick={() => setView("spreadsheet")} className={["flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", view === "spreadsheet" ? "bg-dashboard-card-hover text-dashboard-text" : "text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Spreadsheet
                </button>
                <button type="button" onClick={() => setView("analytics")} className={["flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", view === "analytics" ? "bg-dashboard-card-hover text-dashboard-text" : "text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                  <LayoutDashboard className="h-3.5 w-3.5" /> Analytics
                </button>
              </div>
            )}
          </div>

          {/* ── No year yet ─────────────────────────────────────────── */}
          {!hasYear && (
            <div className="rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card px-8 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dashboard-card-hover border border-dashboard-border mx-auto mb-4">
                <FolderOpen className="h-6 w-6 text-dashboard-text-muted" />
              </div>
              <p className="text-sm font-semibold text-dashboard-text mb-1">No budget for {selectedYear} yet</p>
              <p className="text-sm text-dashboard-text-muted mb-6">Create a {selectedYear} budget to automatically generate all 12 monthly sheets.</p>
              <button type="button" onClick={() => createYear(selectedYear)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm">
                <Plus className="h-4 w-4" /> Create {selectedYear} Budget
              </button>
            </div>
          )}

          {/* ── Analytics view ───────────────────────────────────────── */}
          {hasYear && view === "analytics" && (
            <BudgetAnalytics year={selectedYear} sheets={yearSheets} prevYearSheets={prevYearSheets} />
          )}

          {/* ── Spreadsheet view ─────────────────────────────────────── */}
          {hasYear && view === "spreadsheet" && (
            <>
              {!activeSheet ? (
                <div className="rounded-2xl border border-dashboard-border bg-dashboard-card px-8 py-10 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-dashboard-text-muted/40 mb-3" />
                  <p className="text-sm text-dashboard-text-muted">Select a month from the left panel to view its budget.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <IncomeSection rows={activeSheet.income} onRowChange={onIncomeRowChange} onAddRow={onAddIncomeRow} onDeleteRow={onDeleteIncomeRow} />
                  <ExpenseSection title="Fixed Expenses" rows={activeSheet.fixedExpenses} onRowChange={onFixedRowChange} onAddRow={onAddFixedRow} onDeleteRow={onDeleteFixedRow} addLabel="Add fixed expense" />
                  <ExpenseSection title="Variable Expenses" rows={activeSheet.variableExpenses} onRowChange={onVarRowChange} onAddRow={onAddVarRow} onDeleteRow={onDeleteVarRow} addLabel="Add variable expense" />
                  <SummarySection sheet={activeSheet} />
                  <TransactionSection rows={activeSheet.transactions} onRowChange={onTxRowChange} onAddRow={onAddTxRow} onDeleteRow={onDeleteTxRow} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-dashboard-text-muted/50 text-center">
        Click any cell to edit · Changes save automatically
      </p>
    </div>
  );
}

// ─── New Year Button ──────────────────────────────────────────────────────────

function NewYearButton({ existing, onAdd }: { existing: number[]; onAdd: (y: number) => void }) {
  const [open, setOpen] = useState(false);
  const thisYear = currentYear();
  const options = Array.from({ length: 8 }, (_, i) => thisYear - 3 + i).filter((y) => !existing.includes(y));

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-dashboard-border text-xs text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card transition-colors">
        <Plus className="h-3.5 w-3.5" /> Add Year
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-50 rounded-xl border border-dashboard-border bg-dashboard-card shadow-xl py-1 w-full min-w-[130px]">
            {options.map((y) => (
              <button key={y} type="button" onClick={() => { onAdd(y); setOpen(false); }} className="w-full px-3 py-1.5 text-left text-xs text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text transition-colors">
                {y} {y === thisYear ? <span className="opacity-50">(current)</span> : y > thisYear ? <span className="opacity-50">(future)</span> : <span className="opacity-50">(past)</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
