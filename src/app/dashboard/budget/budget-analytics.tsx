"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import type { BudgetSheet } from "./budget-types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseNum(val: string): number {
  const n = parseFloat((val ?? "").replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmt(val: number) {
  if (val === 0) return "$0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtFull(val: number) {
  if (val === 0) return "$0.00";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CATEGORY_COLORS = [
  "#60a5fa", "#34d399", "#8892a4", "#a78bfa", "#38bdf8",
  "#6ee7b7", "#93c5fd", "#c4b5fd", "#67e8f9", "#86efac",
];

// ─── types ────────────────────────────────────────────────────────────────────

type MonthlyDataPoint = {
  month: string;
  income: number;
  fixed: number;
  variable: number;
  cashFlow: number;
};

type CategoryDataPoint = {
  name: string;
  value: number;
};

// ─── sub-components ───────────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: "#181c26",
  border: "1px solid #1e2330",
  borderRadius: 10,
  color: "#eef0f6",
  fontSize: 12,
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
};

function StatCard({ label, value, sub, color = "#eef0f6" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-dashboard-text-muted/70 mb-2">{label}</p>
      <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-dashboard-text-muted mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main Analytics Component ─────────────────────────────────────────────────

export function BudgetAnalytics({
  year,
  sheets,
  prevYearSheets,
}: {
  year: number;
  sheets: BudgetSheet[];        // all 12 monthly sheets for this year
  prevYearSheets?: BudgetSheet[]; // prior year monthly sheets for YoY
}) {
  // ── Build monthly data series ─────────────────────────────────────────────

  const monthlyData: MonthlyDataPoint[] = MONTHS_SHORT.map((m, i) => {
    const sheet = sheets.find((s) => s.month === i + 1);
    if (!sheet) return { month: m, income: 0, fixed: 0, variable: 0, cashFlow: 0 };

    const income   = sheet.income.reduce((acc, r) => acc + parseNum(r.actual || r.budgeted), 0);
    const fixed    = sheet.fixedExpenses.reduce((acc, r) => acc + parseNum(r.paidToDate || r.budgetAmt), 0);
    const variable = sheet.variableExpenses.reduce((acc, r) => acc + parseNum(r.paidToDate || r.budgetAmt), 0);
    return { month: m, income, fixed, variable, cashFlow: income - fixed - variable };
  });

  const prevMonthlyData: MonthlyDataPoint[] = prevYearSheets
    ? MONTHS_SHORT.map((m, i) => {
        const sheet = prevYearSheets.find((s) => s.month === i + 1);
        if (!sheet) return { month: m, income: 0, fixed: 0, variable: 0, cashFlow: 0 };
        const income   = sheet.income.reduce((acc, r) => acc + parseNum(r.actual || r.budgeted), 0);
        const fixed    = sheet.fixedExpenses.reduce((acc, r) => acc + parseNum(r.paidToDate || r.budgetAmt), 0);
        const variable = sheet.variableExpenses.reduce((acc, r) => acc + parseNum(r.paidToDate || r.budgetAmt), 0);
        return { month: m, income, fixed, variable, cashFlow: income - fixed - variable };
      })
    : [];

  // ── Aggregate category spending ───────────────────────────────────────────

  const categoryMap: Record<string, number> = {};
  for (const sheet of sheets) {
    for (const row of sheet.fixedExpenses) {
      const key = row.item || "Other Fixed";
      const val = parseNum(row.paidToDate || row.budgetAmt);
      if (val > 0) categoryMap[key] = (categoryMap[key] ?? 0) + val;
    }
    for (const row of sheet.variableExpenses) {
      const key = row.item || "Other Variable";
      const val = parseNum(row.paidToDate || row.budgetAmt);
      if (val > 0) categoryMap[key] = (categoryMap[key] ?? 0) + val;
    }
  }
  const categoryData: CategoryDataPoint[] = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // ── Year totals ───────────────────────────────────────────────────────────

  const totalIncome   = monthlyData.reduce((acc, d) => acc + d.income, 0);
  const totalFixed    = monthlyData.reduce((acc, d) => acc + d.fixed, 0);
  const totalVariable = monthlyData.reduce((acc, d) => acc + d.variable, 0);
  const totalExpenses = totalFixed + totalVariable;
  const netCashFlow   = totalIncome - totalExpenses;
  const avgMonthlyIncome = totalIncome / 12;

  const prevTotalIncome = prevMonthlyData.reduce((acc, d) => acc + d.income, 0);
  const prevNetCashFlow = prevMonthlyData.reduce((acc, d) => acc + d.cashFlow, 0);

  const yoyIncomePct = prevTotalIncome > 0
    ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100
    : null;
  const yoyCashFlowPct = prevNetCashFlow !== 0
    ? ((netCashFlow - prevNetCashFlow) / Math.abs(prevNetCashFlow)) * 100
    : null;

  // ── YoY cash-flow series ──────────────────────────────────────────────────

  const yoyData = prevYearSheets
    ? MONTHS_SHORT.map((m, i) => ({
        month: m,
        [year]: monthlyData[i].cashFlow,
        [year - 1]: prevMonthlyData[i]?.cashFlow ?? 0,
      }))
    : [];

  return (
    <div className="space-y-5">
      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label={`${year} Total Income`}
          value={fmtFull(totalIncome)}
          sub={yoyIncomePct != null ? `${yoyIncomePct >= 0 ? "+" : ""}${yoyIncomePct.toFixed(1)}% vs ${year - 1}` : undefined}
          color="#34d399"
        />
        <StatCard
          label="Total Expenses"
          value={fmtFull(totalExpenses)}
          sub={`Fixed: ${fmtFull(totalFixed)}`}
          color="#eef0f6"
        />
        <StatCard
          label="Net Cash Flow"
          value={fmtFull(netCashFlow)}
          sub={yoyCashFlowPct != null ? `${yoyCashFlowPct >= 0 ? "+" : ""}${yoyCashFlowPct.toFixed(1)}% vs ${year - 1}` : undefined}
          color={netCashFlow >= 0 ? "#34d399" : "#f87171"}
        />
        <StatCard
          label="Avg Monthly Income"
          value={fmtFull(avgMonthlyIncome)}
          sub={`${sheets.length} month${sheets.length !== 1 ? "s" : ""} tracked`}
          color="#eef0f6"
        />
      </div>

      {/* ── Monthly Income vs Expenses Bar Chart ───────────────────── */}
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5">
        <h3 className="text-sm font-semibold text-dashboard-text mb-1">Monthly Income vs Expenses</h3>
        <p className="text-xs text-dashboard-text-muted mb-4">{year} — all 12 months</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8892a4" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#8892a4" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [fmtFull(v), name]}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8892a4" }} />
            <Bar dataKey="income" name="Income" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="fixed" name="Fixed Exp." fill="#60a5fa" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="variable" name="Variable Exp." fill="#8892a4" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Top Spending Categories ──────────────────────────────── */}
        {categoryData.length > 0 && (
          <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5">
            <h3 className="text-sm font-semibold text-dashboard-text mb-1">Top Spending Categories</h3>
            <p className="text-xs text-dashboard-text-muted mb-4">By amount spent across all months</p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtFull(v), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {categoryData.slice(0, 7).map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-[11px] text-dashboard-text-muted truncate flex-1">{cat.name}</span>
                    <span className="text-[11px] font-semibold text-dashboard-text tabular-nums flex-shrink-0">
                      {fmtFull(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Net Cash Flow Trend ──────────────────────────────────── */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5">
          <h3 className="text-sm font-semibold text-dashboard-text mb-1">
            Net Cash Flow
            {prevYearSheets && <span className="text-dashboard-text-muted font-normal"> — {year} vs {year - 1}</span>}
          </h3>
          <p className="text-xs text-dashboard-text-muted mb-4">Month-by-month surplus or deficit</p>
          <ResponsiveContainer width="100%" height={160}>
            {prevYearSheets && yoyData.length > 0 ? (
              <LineChart data={yoyData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8892a4" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#8892a4" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtFull(v), ""]} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8892a4" }} />
                <Line type="monotone" dataKey={year} stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={year - 1} stroke="#60a5fa" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            ) : (
              <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8892a4" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#8892a4" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtFull(v), "Cash Flow"]} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                <Line
                  type="monotone"
                  dataKey="cashFlow"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={`dot-${payload.month}`}
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={payload.cashFlow >= 0 ? "#34d399" : "#f87171"}
                        stroke="none"
                      />
                    );
                  }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
