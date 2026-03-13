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
      className={["w-full min-w-0 bg-transparent text-[13px] leading-tight outline-none px-2 py-1", "focus:bg-[rgba(52,211,153,0.07)] focus:ring-1 focus:ring-[#34d399]/40 rounded", "placeholder:text-dashboard-text-muted/30 transition-colors duration-100", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left", muted ? "text-dashboard-text-muted" : "text-dashboard-text"].join(" ")} />
  );
}
function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" | "center" }) {
  return <th className={["px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted border-b border-dashboard-border whitespace-nowrap", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"].join(" ")}>{children}</th>;
}

// ─── Accordion Section ────────────────────────────────────────────────────────

function AccordionSection({ title, icon, accentColor = "#34d399", defaultOpen = true, badge, children }: { title: string; icon: React.ReactNode; accentColor?: string; defaultOpen?: boolean; badge?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-dashboard-card-hover transition-colors duration-150">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ background: `${accentColor}22` }}>
            <span style={{ color: accentColor }} className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          </div>
          <span className="text-sm font-semibold text-dashboard-text">{title}</span>
          {badge && <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `${accentColor}20`, color: accentColor }}>{badge}</span>}
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="text-dashboard-text-muted flex-shrink-0">
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
    <AccordionSection title="Income" icon={<TrendingUp />} accentColor="#34d399" badge={fmtCurrency(tb)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[400px]">
          <colgroup><col style={{ width: "46%" }} /><col style={{ width: "22%" }} /><col style={{ width: "22%" }} /><col style={{ width: "10%" }} /></colgroup>
          <thead><tr className="bg-[rgba(52,211,153,0.05)]"><Th>Category</Th><Th align="right">Budgeted</Th><Th align="right">Actual</Th><Th /></tr></thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={["group border-b border-dashboard-border/60 transition-colors", idx % 2 === 0 ? "" : "bg-[rgba(255,255,255,0.015)]", "hover:bg-[rgba(52,211,153,0.04)]"].join(" ")}>
                <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.category} onChange={(v) => onRowChange(row.id, "category", v)} placeholder="Income source" /></td>
                <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.budgeted} onChange={(v) => onRowChange(row.id, "budgeted", v)} placeholder="0.00" align="right" /></td>
                <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.actual} onChange={(v) => onRowChange(row.id, "actual", v)} placeholder="0.00" align="right" /></td>
                <td className="px-2 py-0"><button type="button" onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-dashboard-text-muted hover:text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[rgba(52,211,153,0.07)] border-t-2 border-[#34d399]/30">
              <td className="px-2 py-2 text-[12px] font-bold text-dashboard-text">TOTAL INCOME</td>
              <td className="px-2 py-1 text-[13px] font-bold text-right text-[#34d399] tabular-nums">{fmtCurrency(tb)}</td>
              <td className="px-2 py-1 text-[13px] font-bold text-right text-[#34d399] tabular-nums">{fmtCurrency(ta)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-dashboard-border/40"><button type="button" onClick={onAddRow} className="flex items-center gap-1.5 text-xs text-dashboard-text-muted hover:text-[#34d399] transition-colors"><Plus className="h-3.5 w-3.5" />Add income row</button></div>
    </AccordionSection>
  );
}

function ExpenseSection({ title, rows, accentColor, onRowChange, onAddRow, onDeleteRow, addLabel }: { title: string; rows: (FixedExpRow | VarExpRow)[]; accentColor: string; onRowChange: (id: string, f: string, v: string) => void; onAddRow: () => void; onDeleteRow: (id: string) => void; addLabel: string }) {
  const tb = rows.reduce((a, r) => a + parseNum((r as FixedExpRow).budgetAmt), 0);
  const tp = rows.reduce((a, r) => a + parseNum((r as FixedExpRow).paidToDate), 0);
  return (
    <AccordionSection title={title} icon={title.includes("Fixed") ? <Receipt /> : <TrendingDown />} accentColor={accentColor} badge={fmtCurrency(tb)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[520px]">
          <colgroup><col style={{ width: "36%" }} /><col style={{ width: "18%" }} /><col style={{ width: "18%" }} /><col style={{ width: "18%" }} /><col style={{ width: "8%" }} /><col style={{ width: "2%" }} /></colgroup>
          <thead><tr style={{ background: `${accentColor}0d` }}><Th>Item</Th><Th align="right">Budget Amt</Th><Th align="right">Paid to Date</Th><Th align="right">Remaining</Th><Th align="center">Due</Th><Th /></tr></thead>
          <tbody>
            {rows.map((row, idx) => {
              const r = row as FixedExpRow;
              const rem = parseNum(r.budgetAmt) - parseNum(r.paidToDate);
              return (
                <tr key={r.id} className={["group border-b border-dashboard-border/60 transition-colors", idx % 2 === 0 ? "" : "bg-[rgba(255,255,255,0.015)]"].join(" ")} style={{ background: undefined }}>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={r.item} onChange={(v) => onRowChange(r.id, "item", v)} placeholder="Expense" /></td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={r.budgetAmt} onChange={(v) => onRowChange(r.id, "budgetAmt", v)} placeholder="0.00" align="right" /></td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={r.paidToDate} onChange={(v) => onRowChange(r.id, "paidToDate", v)} placeholder="0.00" align="right" /></td>
                  <td className="px-2 py-1 border-r border-dashboard-border/40 text-[13px] text-right tabular-nums" style={{ color: rem < 0 ? "#f87171" : rem === 0 ? "#8892a4" : "#eef0f6" }}>{fmtCurrency(rem)}</td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={r.dueDate} onChange={(v) => onRowChange(r.id, "dueDate", v)} placeholder="—" align="center" muted /></td>
                  <td className="px-2 py-0"><button type="button" onClick={() => onDeleteRow(r.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-dashboard-text-muted hover:text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2" style={{ background: `${accentColor}12`, borderColor: `${accentColor}50` }}>
              <td className="px-2 py-2 text-[12px] font-bold text-dashboard-text">TOTAL</td>
              <td className="px-2 py-1 text-[13px] font-bold text-right tabular-nums" style={{ color: accentColor }}>{fmtCurrency(tb)}</td>
              <td className="px-2 py-1 text-[13px] font-bold text-right tabular-nums" style={{ color: accentColor }}>{fmtCurrency(tp)}</td>
              <td className="px-2 py-1 text-[13px] font-bold text-right tabular-nums" style={{ color: tb - tp < 0 ? "#f87171" : accentColor }}>{fmtCurrency(tb - tp)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-dashboard-border/40"><button type="button" onClick={onAddRow} className="flex items-center gap-1.5 text-xs text-dashboard-text-muted transition-colors" style={{ color: undefined }} onMouseEnter={(e) => (e.currentTarget.style.color = accentColor)} onMouseLeave={(e) => (e.currentTarget.style.color = "")}><Plus className="h-3.5 w-3.5" />{addLabel}</button></div>
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
    <tr className={["border-b border-dashboard-border/40", bold ? "bg-[rgba(52,211,153,0.07)]" : ""].join(" ")}>
      <td className={["px-3 py-1.5 text-[12px]", bold ? "font-bold text-dashboard-text" : "text-dashboard-text-muted"].join(" ")}>{label}</td>
      <td className={["px-3 py-1.5 text-[12px] text-right tabular-nums", bold ? "font-bold text-[#34d399]" : "text-dashboard-text"].join(" ")}>{fmtCurrency(b)}</td>
      <td className={["px-3 py-1.5 text-[12px] text-right tabular-nums", bold ? (a < 0 ? "font-bold text-red-400" : "font-bold text-[#34d399]") : (a < 0 ? "text-red-400" : "text-dashboard-text")].join(" ")}>{fmtCurrency(a)}</td>
    </tr>
  );

  return (
    <AccordionSection title="Summary" icon={<BarChart3 />} accentColor="#34d399">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[320px]">
          <thead><tr className="bg-[rgba(52,211,153,0.05)]"><Th>Description</Th><Th align="right">Budgeted</Th><Th align="right">Actual</Th></tr></thead>
          <tbody>
            <SRow label="Total Income" b={ti} a={tai} />
            <SRow label="Fixed Expenses" b={tf} a={taf} />
            <SRow label="Variable Expenses" b={tv} a={tav} />
            <SRow label="Net Cash Flow" b={bcf} a={acf} bold />
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-dashboard-border/40">
        {[
          { label: "Budgeted Income", val: ti, color: "#34d399" },
          { label: "Total Expenses", val: tf + tv, color: "#f97316" },
          { label: "Net Cash Flow", val: bcf, color: bcf >= 0 ? "#34d399" : "#f87171" },
          { label: "Actual Cash Flow", val: acf, color: acf >= 0 ? "#34d399" : "#f87171" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-3 border border-dashboard-border/60 bg-dashboard-card-hover">
            <p className="text-[10px] uppercase tracking-wider text-dashboard-text-muted mb-1">{s.label}</p>
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
    <AccordionSection title="Transaction Log" icon={<TableProperties />} accentColor="#60a5fa" defaultOpen={false} badge={`${rows.length} entries`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <colgroup><col style={{ width: "14%" }} /><col style={{ width: "36%" }} /><col style={{ width: "24%" }} /><col style={{ width: "18%" }} /><col style={{ width: "8%" }} /></colgroup>
          <thead><tr className="bg-[rgba(96,165,250,0.05)]"><Th>Date</Th><Th>Description</Th><Th>Category</Th><Th align="right">Amount</Th><Th /></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-dashboard-text-muted">No transactions yet. Click &quot;Add transaction&quot; below.</td></tr>}
            {rows.map((row, idx) => {
              const amt = parseNum(row.amount);
              return (
                <tr key={row.id} className={["group border-b border-dashboard-border/60 transition-colors", idx % 2 === 0 ? "" : "bg-[rgba(255,255,255,0.015)]", "hover:bg-[rgba(96,165,250,0.04)]"].join(" ")}>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.date} onChange={(v) => onRowChange(row.id, "date", v)} placeholder="YYYY-MM-DD" muted /></td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.description} onChange={(v) => onRowChange(row.id, "description", v)} placeholder="Description" /></td>
                  <td className="px-0 py-0 border-r border-dashboard-border/40"><CellInput value={row.category} onChange={(v) => onRowChange(row.id, "category", v)} placeholder="Category" muted /></td>
                  <td className="px-2 py-1 border-r border-dashboard-border/40 text-[13px] text-right tabular-nums" style={{ color: amt > 0 ? "#34d399" : amt < 0 ? "#f87171" : "#eef0f6" }}>{row.amount !== "" ? fmtCurrency(amt) : <span className="text-dashboard-text-muted/40">0.00</span>}</td>
                  <td className="px-2 py-0"><button type="button" onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-dashboard-text-muted hover:text-red-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot><tr className="bg-[rgba(96,165,250,0.07)] border-t-2 border-[#60a5fa]/30">
              <td colSpan={3} className="px-2 py-2 text-[12px] font-bold text-dashboard-text">TOTALS</td>
              <td className="px-2 py-2 text-[12px] font-bold text-right tabular-nums"><span className="text-[#34d399]">{fmtCurrency(income)}</span><span className="text-dashboard-text-muted mx-1">/</span><span className="text-red-400">{fmtCurrency(expenses)}</span></td>
              <td />
            </tr></tfoot>
          )}
        </table>
      </div>
      <div className="px-3 py-2 border-t border-dashboard-border/40"><button type="button" onClick={onAddRow} className="flex items-center gap-1.5 text-xs text-dashboard-text-muted hover:text-[#60a5fa] transition-colors"><Plus className="h-3.5 w-3.5" />Add transaction</button></div>
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
      <div className="flex items-center justify-center h-64 text-dashboard-text-muted">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm">Loading budget…</span>
      </div>
    );
  }

  const yearSheets = sheetsForYear(selectedYear);
  const hasYear = yearSheets.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {budgetType === "church" && orgId
            ? <Building2 className="h-7 w-7 text-[#34d399] mt-0.5 flex-shrink-0" />
            : <User className="h-7 w-7 text-[#34d399] mt-0.5 flex-shrink-0" />}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
              {budgetType === "church" && orgId ? `${orgName ?? "Church / Org"} Budget` : "Personal Budget"}
            </h1>
            <p className="mt-0.5 text-sm text-dashboard-text-muted">
              {budgetType === "church" && orgId
                ? `Shared org budget — organized by year and month. Free for all.`
                : `Your personal budget — organized by year and month. Free for everyone.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {saving && <span className="flex items-center gap-1 text-xs text-dashboard-text-muted"><Loader2 className="h-3 w-3 animate-spin" />Saving…</span>}
          {!saving && allSheets.length > 0 && <span className="text-xs text-[#34d399]/70 hidden sm:block">● Saved</span>}

          {/* Export */}
          {hasYear && (
            <button type="button" onClick={handleExport} disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-1.5 text-xs font-medium text-dashboard-text-muted hover:text-[#34d399] hover:border-[#34d399]/40 transition-colors disabled:opacity-50">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export Excel
            </button>
          )}

          {/* Budget type toggle */}
          {orgId && (
            <div className="flex items-center gap-1 rounded-lg border border-dashboard-border bg-dashboard-card p-1">
              <button type="button" onClick={() => setBudgetType("personal")} className={["flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", budgetType === "personal" ? "bg-[rgba(52,211,153,0.15)] text-[#34d399]" : "text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                <User className="h-3.5 w-3.5" /> Personal
              </button>
              <button type="button" onClick={() => setBudgetType("church")} className={["flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", budgetType === "church" ? "bg-[rgba(52,211,153,0.15)] text-[#34d399]" : "text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                <Building2 className="h-3.5 w-3.5" /> {orgName ?? "Church / Org"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Year Folders Sidebar ─────────────────────────────────────── */}
      <div className="flex gap-5">

        {/* Left: year list */}
        <div className="w-44 flex-shrink-0 space-y-1.5">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted mb-2">Year Folders</p>

          {years.map((yr) => {
            const isOpen = yr === selectedYear;
            const mSheets = sheetsForYear(yr);
            return (
              <div key={yr}>
                <button
                  type="button"
                  onClick={() => { setSelectedYear(yr); if (!isOpen) setSelectedMonth(new Date().getMonth() + 1); }}
                  className={["w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors", isOpen ? "bg-[rgba(52,211,153,0.12)] text-[#34d399]" : "text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text"].join(" ")}
                >
                  <FolderOpen className="h-4 w-4 flex-shrink-0" />
                  <span>{yr}</span>
                  <span className="ml-auto text-[10px] tabular-nums opacity-60">{mSheets.length}/12</span>
                </button>

                {/* Month list under active year */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key="months" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: "hidden" }}>
                      <div className="ml-3 mt-1 space-y-0.5 border-l border-dashboard-border/60 pl-3">
                        {MONTH_NAMES.map((mn, mi) => {
                          const m = mi + 1;
                          const exists = mSheets.some((s) => s.month === m);
                          const isActive = selectedMonth === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => { if (exists) { setSelectedMonth(m); setView("spreadsheet"); } }}
                              className={["w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-xs transition-colors", isActive ? "bg-[rgba(52,211,153,0.12)] text-[#34d399] font-medium" : exists ? "text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card-hover" : "text-dashboard-text-muted/40 cursor-default"].join(" ")}
                            >
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              {mn.slice(0, 3)}
                              {!exists && <span className="ml-auto text-[9px] opacity-40">—</span>}
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
          <div className="pt-2">
            <NewYearButton existing={years} onAdd={createYear} />
          </div>
        </div>

        {/* Right: main content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* View toggle + year title */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-dashboard-text">{selectedYear}</h2>
              {activeSheet && view === "spreadsheet" && (
                <>
                  <span className="text-dashboard-text-muted">/</span>
                  <span className="text-sm text-dashboard-text-muted">{MONTH_NAMES[(selectedMonth ?? 1) - 1]}</span>
                </>
              )}
            </div>

            {hasYear && (
              <div className="flex items-center gap-1 rounded-lg border border-dashboard-border bg-dashboard-card p-1">
                <button type="button" onClick={() => setView("spreadsheet")} className={["flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "spreadsheet" ? "bg-[rgba(52,211,153,0.15)] text-[#34d399]" : "text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Spreadsheet
                </button>
                <button type="button" onClick={() => setView("analytics")} className={["flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "analytics" ? "bg-[rgba(52,211,153,0.15)] text-[#34d399]" : "text-dashboard-text-muted hover:text-dashboard-text"].join(" ")}>
                  <LayoutDashboard className="h-3.5 w-3.5" /> Analytics
                </button>
              </div>
            )}
          </div>

          {/* ── No year yet ─────────────────────────────────────────── */}
          {!hasYear && (
            <div className="rounded-xl border border-dashed border-dashboard-border bg-dashboard-card/50 px-8 py-14 text-center">
              <FolderOpen className="h-10 w-10 mx-auto text-dashboard-text-muted/50 mb-4" />
              <p className="text-sm font-semibold text-dashboard-text mb-1">No budget for {selectedYear} yet</p>
              <p className="text-sm text-dashboard-text-muted mb-5">Create a {selectedYear} budget to automatically generate all 12 monthly sheets.</p>
              <button type="button" onClick={() => createYear(selectedYear)} className="inline-flex items-center gap-2 rounded-lg bg-[rgba(52,211,153,0.15)] border border-[#34d399]/30 px-5 py-2.5 text-sm font-semibold text-[#34d399] hover:bg-[rgba(52,211,153,0.22)] transition-colors">
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
                <div className="rounded-xl border border-dashboard-border bg-dashboard-card/50 px-8 py-10 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-dashboard-text-muted/50 mb-3" />
                  <p className="text-sm text-dashboard-text-muted">Select a month from the left panel to view its budget.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <IncomeSection rows={activeSheet.income} onRowChange={onIncomeRowChange} onAddRow={onAddIncomeRow} onDeleteRow={onDeleteIncomeRow} />
                  <ExpenseSection title="Fixed Expenses" rows={activeSheet.fixedExpenses} accentColor="#f97316" onRowChange={onFixedRowChange} onAddRow={onAddFixedRow} onDeleteRow={onDeleteFixedRow} addLabel="Add fixed expense" />
                  <ExpenseSection title="Variable Expenses" rows={activeSheet.variableExpenses} accentColor="#a78bfa" onRowChange={onVarRowChange} onAddRow={onAddVarRow} onDeleteRow={onDeleteVarRow} addLabel="Add variable expense" />
                  <SummarySection sheet={activeSheet} />
                  <TransactionSection rows={activeSheet.transactions} onRowChange={onTxRowChange} onAddRow={onAddTxRow} onDeleteRow={onDeleteTxRow} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-dashboard-text-muted text-center">
        <DollarSign className="inline h-3 w-3" /> Click any cell to edit · Changes save automatically · <span className="text-[#34d399]/70">Free for all users</span>
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
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-dashboard-border text-xs text-dashboard-text-muted hover:text-dashboard-text hover:border-dashboard-text-muted transition-colors">
        <Plus className="h-3.5 w-3.5" /> Add Year
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-50 rounded-lg border border-dashboard-border bg-dashboard-card shadow-lg py-1 w-full min-w-[120px]">
            {options.map((y) => (
              <button key={y} type="button" onClick={() => { onAdd(y); setOpen(false); }} className="w-full px-3 py-1.5 text-left text-xs text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text transition-colors">
                {y} {y === thisYear ? "(this year)" : y > thisYear ? "(upcoming)" : "(past)"}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
