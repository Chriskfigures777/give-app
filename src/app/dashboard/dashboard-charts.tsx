"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(cents / 100);
}

type DonationTrend = { date: string; total: number };
type OrgDistribution = { org: string; total: number };

export function DonationTrendsChart({ data }: { data: DonationTrend[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <p className="text-sm text-dashboard-text-muted">No donation data in range</p>
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 65% / 0.15)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
            tickFormatter={(v) => `$${v}`}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v: number) => [formatCurrency(Math.round(v * 100)), "Total"]}
            labelFormatter={(l) => `${l}`}
            contentStyle={{
              backgroundColor: "hsl(217 33% 17%)",
              border: "1px solid hsl(217 33% 25%)",
              borderRadius: "12px",
              padding: "8px 12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            labelStyle={{ color: "hsl(215 20% 65%)", fontSize: 11, marginBottom: 4 }}
            itemStyle={{ color: "#10b981", fontSize: 13, fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Total donations"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#donationGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrgDistributionChart({ data }: { data: OrgDistribution[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
        </div>
        <p className="text-sm text-dashboard-text-muted">No data</p>
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height={256}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="org"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={3}
            cornerRadius={4}
            label={({ org, percent }) => `${org} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatCurrency(Math.round(v * 100))}
            contentStyle={{
              backgroundColor: "hsl(217 33% 17%)",
              border: "1px solid hsl(217 33% 25%)",
              borderRadius: "12px",
              padding: "8px 12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          />
          <Legend
            wrapperStyle={{ color: "hsl(215 20% 65%)", fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
