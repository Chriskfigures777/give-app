"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  User,
  Calendar,
  Building2,
  Mail,
  Phone,
  Search,
  Download,
  CheckCircle2,
} from "lucide-react";
import { getLabel } from "@/components/survey/survey-label-map";
import type { SurveyResponse } from "../survey-results/page";

const ease = [0.22, 1, 0.36, 1] as const;

/* ─── Question labels (full text for display + CSV) ─── */
const QUESTION_LABELS: Record<string, string> = {
  weekly_attendance: "Weekly attendance",
  org_type: "Organization type",
  annual_budget: "Annual operating budget",
  finance_staff_count: "Finance staff count",
  biggest_challenges: "Biggest giving challenges",
  missionaries_supported: "Missionaries / partners supported",
  distribution_method: "Fund distribution method",
  admin_hours_per_month: "Admin hours / month on finances",
  software_type: "Software type needed",
  top_features: "Top features wanted",
  networking_importance: "Networking importance",
  has_website: "Has church website",
  tech_type_needed: "Tech type needed for giving",
  software_vs_streaming: "Software vs streaming preference",
  wish_tech_improved: "Tech they wish was improved",
  spend_to_solve_problem: "Willingness to spend",
  better_ways_to_give: "Better giving methods wanted",
  easier_giving_ideas: "Ideas to make giving easier",
  paperwork_method: "Paperwork management method",
  member_communication: "Member communication channels",
  ai_form_interest: "AI form-building interest",
  team_growth_tracking: "Team spiritual growth tracking",
  congregation_engagement: "Congregation engagement methods",
  automation_needs: "Communication automation needs",
  campaign_tools_interest: "Campaign tools interest",
  event_posting_needs: "Event posting needs",
  teaching_packets_interest: "Teaching packets interest",
  ai_sermon_content: "AI sermon content generation interest",
  ai_member_curation: "AI member curation interest",
  pastor_approval_workflow: "Pastor approval workflow preference",
  member_development_tools: "Member development tools needed",
  website_tool_needs: "Website & online tool needs",
  currently_live_stream: "Currently live streaming",
  live_stream_platform: "Live stream platform used",
  live_stream_giving_interest: "Live stream giving interest",
  live_stream_ai_features: "Live stream AI features wanted",
  live_stream_challenges: "Live streaming challenges",
  want_charts_dashboard: "Wants real-time charts dashboard",
  auto_giving_interest: "Automated giving interest",
  auto_giving_features: "Auto giving features wanted",
  auto_transfer_fee_comfort: "Auto transfer fee comfort",
  monthly_price_range: "Monthly price willing to pay",
  percent_fee_preference: "Percentage fee preference",
  switch_triggers: "What would make them switch platforms",
};

/* ─── Answer sections for grouped display ─── */
const ANSWER_SECTIONS = [
  {
    title: "Church Profile",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50/60 dark:bg-emerald-500/10",
    border: "border-emerald-100 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
    fields: ["org_type", "weekly_attendance", "annual_budget", "finance_staff_count"],
  },
  {
    title: "Money & Giving",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50/60 dark:bg-amber-500/10",
    border: "border-amber-100 dark:border-amber-500/20",
    dot: "bg-amber-500",
    fields: [
      "biggest_challenges", "missionaries_supported", "distribution_method",
      "admin_hours_per_month", "better_ways_to_give", "easier_giving_ideas",
      "monthly_price_range", "percent_fee_preference", "spend_to_solve_problem", "switch_triggers",
    ],
  },
  {
    title: "Technology & Website",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50/60 dark:bg-blue-500/10",
    border: "border-blue-100 dark:border-blue-500/20",
    dot: "bg-blue-500",
    fields: [
      "software_type", "top_features", "has_website", "tech_type_needed",
      "software_vs_streaming", "wish_tech_improved", "website_tool_needs",
      "paperwork_method", "member_communication", "networking_importance",
    ],
  },
  {
    title: "Live Streaming",
    color: "text-cyan-700 dark:text-cyan-400",
    bg: "bg-cyan-50/60 dark:bg-cyan-500/10",
    border: "border-cyan-100 dark:border-cyan-500/20",
    dot: "bg-cyan-500",
    fields: [
      "currently_live_stream", "live_stream_platform", "live_stream_giving_interest",
      "live_stream_ai_features", "live_stream_challenges", "want_charts_dashboard",
    ],
  },
  {
    title: "Automation & AI",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50/60 dark:bg-purple-500/10",
    border: "border-purple-100 dark:border-purple-500/20",
    dot: "bg-purple-500",
    fields: [
      "auto_giving_interest", "auto_giving_features", "auto_transfer_fee_comfort",
      "automation_needs", "campaign_tools_interest", "event_posting_needs",
      "ai_form_interest", "ai_sermon_content", "teaching_packets_interest",
      "ai_member_curation", "pastor_approval_workflow", "member_development_tools",
      "team_growth_tracking", "congregation_engagement",
    ],
  },
];

/* ─── CSV Export ─── */
function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

const CSV_FIELDS: (keyof SurveyResponse)[] = [
  "created_at", "church_name", "respondent_name", "contact_email", "phone_number", "allow_follow_up",
  "org_type", "weekly_attendance", "annual_budget", "finance_staff_count",
  "biggest_challenges", "missionaries_supported", "distribution_method", "admin_hours_per_month",
  "better_ways_to_give", "easier_giving_ideas", "monthly_price_range", "percent_fee_preference",
  "spend_to_solve_problem", "switch_triggers",
  "software_type", "top_features", "has_website", "tech_type_needed", "software_vs_streaming",
  "wish_tech_improved", "website_tool_needs", "paperwork_method", "member_communication", "networking_importance",
  "currently_live_stream", "live_stream_platform", "live_stream_giving_interest",
  "live_stream_ai_features", "live_stream_challenges", "want_charts_dashboard",
  "auto_giving_interest", "auto_giving_features", "auto_transfer_fee_comfort",
  "automation_needs", "campaign_tools_interest", "event_posting_needs",
  "ai_form_interest", "ai_sermon_content", "teaching_packets_interest",
  "ai_member_curation", "pastor_approval_workflow", "member_development_tools",
  "team_growth_tracking", "congregation_engagement",
];

const CSV_HEADER_LABELS: Record<string, string> = {
  created_at: "Date Submitted",
  church_name: "Church / Org Name",
  respondent_name: "Respondent Name",
  contact_email: "Email",
  phone_number: "Phone",
  allow_follow_up: "Follow-up Opted In",
  ...QUESTION_LABELS,
};

export function exportResponsesToCSV(responses: SurveyResponse[], filename = "survey-responses") {
  const headers = CSV_FIELDS.map((f) => CSV_HEADER_LABELS[f as string] ?? String(f));
  const rows = responses.map((r) =>
    CSV_FIELDS.map((f) => {
      const val = r[f];
      if (val == null) return "";
      if (typeof val === "boolean") return val ? "Yes" : "No";
      if (f === "created_at") return new Date(val as string).toLocaleDateString();
      if (Array.isArray(val)) {
        return (val as string[]).map((v) => getLabel(f as string, v) || v).join("; ");
      }
      return getLabel(f as string, val as string) || String(val);
    })
  );

  const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
  // BOM prefix so Excel opens UTF-8 correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Helpers ─── */
function formatValue(field: string, val: string | string[] | boolean | null): string {
  if (val == null) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) {
    if (val.length === 0) return "—";
    return val.map((v) => getLabel(field, v) || v).filter(Boolean).join(", ");
  }
  return getLabel(field, val) || String(val);
}

const ALL_ANSWER_FIELDS = ANSWER_SECTIONS.flatMap((s) => s.fields);

/* ─── Response Card ─── */
function ResponseCard({ r, index }: { r: SurveyResponse; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const date = r.created_at
    ? new Date(r.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const answeredCount = ALL_ANSWER_FIELDS.filter((field) => {
    const val = (r as Record<string, unknown>)[field];
    return val != null && val !== "" && !(Array.isArray(val) && val.length === 0);
  }).length;

  const completionPct = Math.round((answeredCount / ALL_ANSWER_FIELDS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.25), ease }}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60"
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20">
          <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            {r.church_name || "Anonymous Organization"}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {r.respondent_name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {r.respondent_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {date}
            </span>
            {r.contact_email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {r.contact_email}
              </span>
            )}
          </div>
        </div>

        {/* Right side badges + completion */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            {r.allow_follow_up && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                Follow-up ✓
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {completionPct}% complete
            </span>
          </div>
          {/* Mini completion bar */}
          <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-slate-700">
              {/* Contact info row */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                {r.contact_email && (
                  <a
                    href={`mailto:${r.contact_email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                  >
                    <Mail className="h-3.5 w-3.5" /> {r.contact_email}
                  </a>
                )}
                {r.phone_number && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                    <Phone className="h-3.5 w-3.5" /> {r.phone_number}
                  </span>
                )}
                {!r.contact_email && !r.phone_number && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">No contact info provided</span>
                )}
              </div>

              {/* Grouped answer sections */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {ANSWER_SECTIONS.map((section) => {
                  const answeredFields = section.fields.filter((field) => {
                    const val = (r as Record<string, unknown>)[field];
                    return val != null && val !== "" && !(Array.isArray(val) && val.length === 0);
                  });
                  if (answeredFields.length === 0) return null;
                  return (
                    <div key={section.title} className="px-5 py-4">
                      {/* Section heading */}
                      <h4 className={`mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${section.color}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${section.dot}`} />
                        {section.title}
                        <span className="ml-1 font-semibold normal-case tracking-normal opacity-60">
                          ({answeredFields.length} answered)
                        </span>
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {answeredFields.map((field) => {
                          const val = (r as Record<string, unknown>)[field];
                          const label = QUESTION_LABELS[field] ?? field;
                          const display = formatValue(field, val as string | string[] | boolean | null);
                          const isLong = typeof display === "string" && display.length > 80;
                          return (
                            <div
                              key={field}
                              className={`rounded-xl border ${section.border} ${section.bg} px-4 py-3 ${isLong ? "sm:col-span-2" : ""}`}
                            >
                              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {label}
                              </dt>
                              <dd className="mt-1 text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">
                                {display}
                              </dd>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main tab component ─── */
type Props = { responses: SurveyResponse[] };

export function SurveyResponsesTab({ responses }: Props) {
  const [filter, setFilter] = useState("");
  const [followUpOnly, setFollowUpOnly] = useState(false);

  if (responses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/30"
      >
        <p className="text-slate-600 dark:text-slate-400">
          No survey responses yet. Share the survey link to collect feedback.
        </p>
      </motion.div>
    );
  }

  const followUpCount = responses.filter((r) => r.allow_follow_up).length;
  const withEmailCount = responses.filter((r) => r.contact_email?.trim()).length;

  const filtered = responses.filter((r) => {
    if (followUpOnly && !r.allow_follow_up) return false;
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      r.church_name?.toLowerCase().includes(q) ||
      r.respondent_name?.toLowerCase().includes(q) ||
      r.contact_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* ─── Summary stats ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          {
            label: "Total Responses",
            value: responses.length,
            color: "text-slate-900 dark:text-slate-100",
            bg: "bg-white dark:bg-slate-800/60",
          },
          {
            label: "Follow-up Opted In",
            value: followUpCount,
            color: "text-emerald-700 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
          },
          {
            label: "Have Email",
            value: withEmailCount,
            color: "text-blue-700 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-500/10",
          },
          {
            label: "Showing Now",
            value: filtered.length,
            color: "text-violet-700 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-slate-200 dark:border-slate-700 ${stat.bg} px-4 py-3`}
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-extrabold tabular-nums ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* ─── Toolbar: search + filters + export ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, org, or email…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Follow-up filter toggle */}
        <button
          onClick={() => setFollowUpOnly(!followUpOnly)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            followUpOnly
              ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Follow-ups only
          {followUpOnly && <span className="ml-0.5 font-bold">({followUpCount})</span>}
        </button>

        {/* Export CSV */}
        <button
          onClick={() => exportResponsesToCSV(filtered)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
          {filtered.length < responses.length && (
            <span className="ml-0.5 opacity-70">({filtered.length})</span>
          )}
        </button>
      </motion.div>

      {/* ─── Response cards ─── */}
      <div className="space-y-3">
        {filtered.map((r, i) => (
          <ResponseCard key={r.id} r={r} index={i} />
        ))}

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-slate-200 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/30"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filter.trim() || followUpOnly
                ? "No responses match your current filters."
                : "No responses yet."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
