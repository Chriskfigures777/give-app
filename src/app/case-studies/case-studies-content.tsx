"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChurchIcon,
  AlertTriangle,
  ArrowRight,
  Users,
  DollarSign,
  Handshake,
  ArrowUpRight,
  BarChart3,
  PieChartIcon,
  Heart,
  Shield,
  ChevronRight,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   CASE STUDY DATA — ALL HYPOTHETICAL / FICTIONAL
   ──────────────────────────────────────────────────────────── */

const CHART_COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

/* Chart tooltip style — light mode */
const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "8px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
};
const TOOLTIP_LABEL_STYLE = { color: "#64748b", fontSize: 11, marginBottom: 4 };

/* Case Study 1: Grace Community Church */
const graceMonthlyDonations = [
  { month: "Jan", before: 12400, after: 12400 },
  { month: "Feb", before: 11800, after: 13200 },
  { month: "Mar", before: 13100, after: 15800 },
  { month: "Apr", before: 12200, after: 17400 },
  { month: "May", before: 11900, after: 19100 },
  { month: "Jun", before: 12800, after: 21600 },
  { month: "Jul", before: 11400, after: 22800 },
  { month: "Aug", before: 12100, after: 24500 },
  { month: "Sep", before: 13200, after: 26200 },
  { month: "Oct", before: 12600, after: 28100 },
  { month: "Nov", before: 14100, after: 31400 },
  { month: "Dec", before: 16800, after: 38200 },
];

const graceGivingChannels = [
  { name: "Online (Give)", value: 62 },
  { name: "In-Person", value: 24 },
  { name: "Recurring", value: 14 },
];

/* Case Study 2: New Hope Fellowship */
const newHopeMissionaryData = [
  { month: "Jan", manual: 3, automated: 0 },
  { month: "Feb", manual: 3, automated: 0 },
  { month: "Mar", manual: 0, automated: 8 },
  { month: "Apr", manual: 0, automated: 8 },
  { month: "May", manual: 0, automated: 10 },
  { month: "Jun", manual: 0, automated: 12 },
  { month: "Jul", manual: 0, automated: 12 },
  { month: "Aug", manual: 0, automated: 14 },
  { month: "Sep", manual: 0, automated: 14 },
  { month: "Oct", manual: 0, automated: 16 },
  { month: "Nov", manual: 0, automated: 16 },
  { month: "Dec", manual: 0, automated: 18 },
];

const newHopeSplitAllocation = [
  { name: "General Fund", value: 55 },
  { name: "Missionaries", value: 25 },
  { name: "Building Fund", value: 12 },
  { name: "Youth Ministry", value: 8 },
];

/* Case Study 3: Crossroads City Network */
const crossroadsPartnerGrowth = [
  { month: "Jan", partners: 2, donations: 4200 },
  { month: "Feb", partners: 3, donations: 6800 },
  { month: "Mar", partners: 5, donations: 11200 },
  { month: "Apr", partners: 7, donations: 15600 },
  { month: "May", partners: 9, donations: 19800 },
  { month: "Jun", partners: 12, donations: 26400 },
  { month: "Jul", partners: 14, donations: 31200 },
  { month: "Aug", partners: 16, donations: 35800 },
  { month: "Sep", partners: 18, donations: 41200 },
  { month: "Oct", partners: 21, donations: 48600 },
  { month: "Nov", partners: 24, donations: 55200 },
  { month: "Dec", partners: 28, donations: 64800 },
];

const crossroadsImpact = [
  { name: "Food Banks", value: 35 },
  { name: "Shelters", value: 25 },
  { name: "Youth Programs", value: 20 },
  { name: "Medical Aid", value: 12 },
  { name: "Education", value: 8 },
];

interface CaseStudy {
  id: string;
  church: string;
  location: string;
  congregation: string;
  tagline: string;
  painPoint: string;
  painPointIcon: typeof ChurchIcon;
  accentColor: string;
  accentGradient: string;
  summary: string;
  challenge: string;
  solution: string;
  results: { label: string; value: string; change: string }[];
  quote: string;
  quotePerson: string;
  quoteRole: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "grace-community",
    church: "Grace Community Church",
    location: "Austin, TX",
    congregation: "450 members",
    tagline: "From government grants to congregation-powered sustainability",
    painPoint: "Government Funding Dependency",
    painPointIcon: DollarSign,
    accentColor: "emerald",
    accentGradient: "from-emerald-500 to-teal-600",
    summary:
      "A mid-sized church that was 60% dependent on government grants transitioned to a diversified, congregation-driven funding model using Give's digital donation platform.",
    challenge:
      "Grace Community Church had been relying heavily on government grants for its community outreach programs—food pantry, after-school tutoring, and elderly care visits. When a key federal grant was unexpectedly reduced by 40%, the church faced the possibility of shutting down two of its three outreach programs. The pastor's team spent 15+ hours per week on grant applications instead of ministry work.",
    solution:
      "By deploying Give's embeddable donation forms on their website and enabling recurring giving, Grace Community made it effortless for members to support specific programs directly. Weekly giving reminders through the platform's automated emails, combined with transparent reporting of how funds were being used, led to a groundswell of congregational support.",
    results: [
      { label: "Total annual giving", value: "$289,400", change: "+127%" },
      { label: "Recurring donors", value: "186", change: "+340%" },
      { label: "Admin hours saved/week", value: "12 hrs", change: "-80%" },
      { label: "Programs sustained", value: "All 3", change: "No cuts" },
    ],
    quote:
      "We went from praying that government checks would clear on time to watching our congregation step up with joy. Give didn't just save our programs—it reminded our church that they owned this mission together.",
    quotePerson: "Pastor David Hernandez",
    quoteRole: "Lead Pastor, Grace Community Church",
  },
  {
    id: "new-hope",
    church: "New Hope Fellowship",
    location: "Nashville, TN",
    congregation: "820 members",
    tagline: "Automating missionary support so no one gets left behind",
    painPoint: "Manual Missionary Payments",
    painPointIcon: Users,
    accentColor: "violet",
    accentGradient: "from-violet-500 to-purple-600",
    summary:
      "A growing church supporting 18 missionaries worldwide eliminated late payments and manual wire transfers by using Give's automated tithe-splitting feature.",
    challenge:
      "New Hope Fellowship supports missionaries in 7 countries. Every month, the finance team manually calculated each missionary's share from tithes and offerings, then processed individual bank transfers. Payments were frequently delayed by 2-3 weeks. One missionary family in Guatemala went an entire month without receiving their support due to a processing error. The finance director was spending 20+ hours monthly on missionary disbursements alone.",
    solution:
      "Give's automated split feature allowed New Hope to configure percentage-based allocations from incoming tithes. When a member gives, the platform automatically routes 25% to the missionary fund, which is then split among individual missionaries based on the church's configured ratios. Real-time dashboards let both the church and missionaries see exactly what's been allocated.",
    results: [
      { label: "Missionaries supported", value: "18", change: "+500%" },
      { label: "Payment processing time", value: "Instant", change: "Was 2-3 weeks" },
      { label: "Finance hours saved/month", value: "20 hrs", change: "-95%" },
      { label: "Late payments", value: "0", change: "Was 4-6/month" },
    ],
    quote:
      "Our missionaries used to call asking where their support was. Now they get notified the moment funds are allocated. It's transformed our relationship with the field—from anxiety to trust.",
    quotePerson: "Sarah Mitchell",
    quoteRole: "Finance Director, New Hope Fellowship",
  },
  {
    id: "crossroads-city",
    church: "Crossroads City Church",
    location: "Denver, CO",
    congregation: "1,200 members",
    tagline: "Building a network of nonprofits that multiplies impact",
    painPoint: "Nonprofit Isolation",
    painPointIcon: Handshake,
    accentColor: "cyan",
    accentGradient: "from-cyan-500 to-blue-600",
    summary:
      "A large urban church connected with 28 local nonprofits through Give's partner network, creating a giving ecosystem that raised over $64,000/month for community causes.",
    challenge:
      "Crossroads City Church sat in a neighborhood with dozens of nonprofits—homeless shelters, food banks, youth programs, medical clinics—but none of them knew each other well enough to collaborate. Each organization was competing for the same small pool of local donors. The church wanted to be a connector but had no infrastructure to facilitate cross-organization giving or track shared impact.",
    solution:
      "Using Give's nonprofit connectivity features, Crossroads embedded partner donation forms on their website and encouraged partner organizations to do the same. When someone donates to the food bank through the church's site, both organizations see the data. Monthly 'Community Impact' reports generated by Give showed the combined effect of all partner donations, which Crossroads shared with the entire congregation.",
    results: [
      { label: "Partner nonprofits", value: "28", change: "+1,300%" },
      { label: "Monthly cross-donations", value: "$64,800", change: "From $0" },
      { label: "Community reach", value: "12,000+", change: "5x increase" },
      { label: "Volunteer sign-ups", value: "340", change: "+280%" },
    ],
    quote:
      "We stopped thinking of ourselves as one church and started thinking of ourselves as a network. Give made it possible for every dollar to ripple across the whole community.",
    quotePerson: "Pastor James Walker",
    quoteRole: "Senior Pastor, Crossroads City Church",
  },
];

/* ── Chart components (light mode) ── */

function GraceDonationsChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={graceMonthlyDonations} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="graceAfterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="graceBeforeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value: number, name: string) => [
            `$${value.toLocaleString()}`,
            name === "after" ? "With Give" : "Before Give",
          ]}
        />
        <Area type="monotone" dataKey="before" name="before" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" fill="url(#graceBeforeGrad)" dot={false} />
        <Area type="monotone" dataKey="after" name="after" stroke="#10b981" strokeWidth={2.5} fill="url(#graceAfterGrad)" dot={false} activeDot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function GraceChannelsChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={graceGivingChannels} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} cornerRadius={4}>
          {graceGivingChannels.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [`${value}%`]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function NewHopeMissionaryChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={newHopeMissionaryData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value: number, name: string) => [value, name === "automated" ? "Automated" : "Manual"]}
        />
        <Bar dataKey="manual" name="manual" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="automated" name="automated" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function NewHopeSplitChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={newHopeSplitAllocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} cornerRadius={4}>
          {newHopeSplitAllocation.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [`${value}%`]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function CrossroadsGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={crossroadsPartnerGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="crossDonationsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value: number, name: string) => [
            name === "donations" ? `$${value.toLocaleString()}` : value,
            name === "donations" ? "Monthly Donations" : "Partners",
          ]}
        />
        <Area yAxisId="left" type="monotone" dataKey="donations" name="donations" stroke="#06b6d4" strokeWidth={2.5} fill="url(#crossDonationsGrad)" dot={false} activeDot={{ r: 4, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }} />
        <Area yAxisId="right" type="monotone" dataKey="partners" name="partners" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fill="none" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CrossroadsImpactChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={crossroadsImpact} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} cornerRadius={4}>
          {crossroadsImpact.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [`${value}%`]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Case Study Detail Card (Light Mode) ── */
function CaseStudyDetail({ study, index }: { study: CaseStudy; index: number }) {
  const accentMap: Record<string, { bg: string; bgLight: string; text: string; textDark: string; border: string; kpiBg: string; kpiBorder: string }> = {
    emerald: {
      bg: "bg-emerald-50",
      bgLight: "bg-emerald-50/50",
      text: "text-emerald-600",
      textDark: "text-emerald-700",
      border: "border-emerald-200/60",
      kpiBg: "bg-emerald-50",
      kpiBorder: "border-emerald-200/50",
    },
    violet: {
      bg: "bg-violet-50",
      bgLight: "bg-violet-50/50",
      text: "text-violet-600",
      textDark: "text-violet-700",
      border: "border-violet-200/60",
      kpiBg: "bg-violet-50",
      kpiBorder: "border-violet-200/50",
    },
    cyan: {
      bg: "bg-cyan-50",
      bgLight: "bg-cyan-50/50",
      text: "text-cyan-600",
      textDark: "text-cyan-700",
      border: "border-cyan-200/60",
      kpiBg: "bg-cyan-50",
      kpiBorder: "border-cyan-200/50",
    },
  };

  const colors = accentMap[study.accentColor];

  const chartMap: Record<string, { main: React.ReactNode; secondary: React.ReactNode; mainLabel: string; secondaryLabel: string }> = {
    "grace-community": {
      main: <GraceDonationsChart />,
      secondary: <GraceChannelsChart />,
      mainLabel: "Monthly Donation Growth",
      secondaryLabel: "Giving Channels Breakdown",
    },
    "new-hope": {
      main: <NewHopeMissionaryChart />,
      secondary: <NewHopeSplitChart />,
      mainLabel: "Missionaries Supported Over Time",
      secondaryLabel: "Tithe Split Allocation",
    },
    "crossroads-city": {
      main: <CrossroadsGrowthChart />,
      secondary: <CrossroadsImpactChart />,
      mainLabel: "Partner Network & Donation Growth",
      secondaryLabel: "Community Impact Distribution",
    },
  };

  const charts = chartMap[study.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      id={study.id}
    >
      {/* Case study number marker */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8 flex items-center gap-4"
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${study.accentGradient} text-lg font-bold text-white shadow-lg`}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <div>
          <p className={`text-sm font-semibold uppercase tracking-wider ${colors.text}`}>
            Case Study #{index + 1}
          </p>
          <p className="text-xs text-slate-400">{study.painPoint}</p>
        </div>
      </motion.div>

      {/* Main card — white, light, elevated */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.04)]">
        {/* Header */}
        <div className="border-b border-slate-100 p-8 md:p-10">
          <div className="flex flex-wrap items-start gap-6">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${study.accentGradient} shadow-lg`}>
              <study.painPointIcon className="h-7 w-7 text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">{study.church}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{study.location}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{study.congregation}</span>
              </div>
              <p className="mt-3 text-lg text-slate-600">{study.tagline}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6 md:px-10">
          <p className="text-[15px] leading-relaxed text-slate-600">{study.summary}</p>
        </div>

        {/* Challenge & Solution */}
        <div className="grid border-b border-slate-100 md:grid-cols-2">
          <div className="border-b border-slate-100 p-8 md:border-b-0 md:border-r md:p-10">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-red-600">
                The Challenge
              </h4>
            </div>
            <p className="text-[14px] leading-relaxed text-slate-600">{study.challenge}</p>
          </div>
          <div className="p-8 md:p-10">
            <div className="mb-4 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}>
                <Shield className={`h-4 w-4 ${colors.text}`} />
              </div>
              <h4 className={`text-sm font-semibold uppercase tracking-wider ${colors.text}`}>
                The Solution
              </h4>
            </div>
            <p className="text-[14px] leading-relaxed text-slate-600">{study.solution}</p>
          </div>
        </div>

        {/* Results KPIs */}
        <div className="border-b border-slate-100 p-8 md:p-10">
          <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Results
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {study.results.map((result, i) => (
              <motion.div
                key={result.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className={`rounded-2xl border ${colors.kpiBorder} ${colors.kpiBg} p-5 transition-all duration-300 hover:shadow-md`}
              >
                <p className="text-xs font-medium text-slate-500">{result.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{result.value}</p>
                <div className="mt-2 flex items-center gap-1">
                  <ArrowUpRight className={`h-3 w-3 ${colors.text}`} />
                  <span className={`text-xs font-semibold ${colors.text}`}>{result.change}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid border-b border-slate-100 md:grid-cols-5">
          <div className="border-b border-slate-100 p-8 md:col-span-3 md:border-b-0 md:border-r md:p-10">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-500">{charts.mainLabel}</h4>
            </div>
            {charts.main}
          </div>
          <div className="p-8 md:col-span-2 md:p-10">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-500">{charts.secondaryLabel}</h4>
            </div>
            {charts.secondary}
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3">
              {(study.id === "grace-community"
                ? graceGivingChannels
                : study.id === "new-hope"
                  ? newHopeSplitAllocation
                  : crossroadsImpact
              ).map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-[11px] text-slate-500">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className={`p-8 md:p-10 ${colors.bgLight}`}>
          <div className="relative rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm md:p-8">
            <svg className={`absolute -top-3 left-6 h-8 w-8 ${colors.text} opacity-20`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
            </svg>
            <p className="relative z-10 text-[15px] italic leading-relaxed text-slate-600">
              &ldquo;{study.quote}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${study.accentGradient} text-sm font-bold text-white`}>
                {study.quotePerson.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{study.quotePerson}</p>
                <p className="text-xs text-slate-500">{study.quoteRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main content component ── */
export function CaseStudiesContent() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-slate-50/30 to-white">
      {/* Light decorative background shapes */}
      <div className="absolute -left-48 top-[10%] h-[500px] w-[500px] rounded-full bg-emerald-100/30 blur-[100px]" />
      <div className="absolute -right-32 top-[30%] h-[400px] w-[400px] rounded-full bg-cyan-100/20 blur-[100px]" />
      <div className="absolute left-1/4 top-[60%] h-[400px] w-[400px] rounded-full bg-violet-100/20 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-28 pt-32 md:pt-40">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-2">
            <ChurchIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Hypothetical Scenarios
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            What could
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              your church achieve?
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Explore how churches like yours could overcome real challenges and
            transform their giving—powered by Give&apos;s modern donation platform.
          </p>
        </motion.div>

        {/* IMPORTANT DISCLAIMER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Important Disclaimer
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-amber-700/70">
                  The case studies presented on this page are{" "}
                  <strong className="text-amber-800">entirely fictional and hypothetical</strong>.
                  The churches, people, locations, statistics, and results described do not represent
                  real organizations or actual outcomes. These scenarios are presented as{" "}
                  <strong className="text-amber-800">possibility scenarios</strong> to illustrate
                  how the Give platform could potentially be used to address common challenges
                  faced by churches and faith-based nonprofits. Individual results will vary.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick nav tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3"
        >
          {CASE_STUDIES.map((study, i) => {
            const icons = [DollarSign, Users, Handshake];
            const Icon = icons[i];
            return (
              <a
                key={study.id}
                href={`#${study.id}`}
                onClick={() => setActiveTab(study.id)}
                className={`group flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  activeTab === study.id
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm"
                }`}
              >
                <Icon className="h-4 w-4" />
                {study.church}
                <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            );
          })}
        </motion.div>

        {/* Case studies */}
        <div className="mt-20 space-y-28">
          {CASE_STUDIES.map((study, i) => (
            <CaseStudyDetail key={study.id} study={study} index={i} />
          ))}
        </div>

        {/* Bottom CTA — this one section can be dark for contrast */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mt-28"
        >
          <div className="overflow-hidden rounded-3xl bg-slate-950 shadow-2xl">
            <div className="relative p-10 md:p-16 text-center">
              <div className="orb orb-emerald absolute -left-24 -top-24 h-48 w-48" />
              <div className="orb orb-cyan absolute -right-24 -bottom-24 h-48 w-48" />
              <div className="grain-overlay absolute inset-0" />

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20"
                >
                  <Heart className="h-8 w-8 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                  Ready to write your church&apos;s story?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
                  Join churches across the country that are building sustainable,
                  modern giving experiences for their congregations. Signing up
                  and connecting is completely free — no trial, no credit card.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="glow-btn group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl"
                  >
                    Sign up free forever
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/explore"
                    className="glow-btn inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.08] px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.12]"
                  >
                    Explore organizations
                  </Link>
                </div>

                <p className="mt-8 text-xs text-white/30">
                  All case studies on this page are hypothetical scenarios and do not
                  represent real churches or actual results.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
