"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp, User, Calendar, Building2, Mail, Phone, Search } from "lucide-react";
import { getLabel } from "@/components/survey/survey-label-map";
import type { SurveyResponse } from "../survey-results/page";

const ease = [0.22, 1, 0.36, 1] as const;

const QUESTION_LABELS: Record<string, string> = {
  weekly_attendance: "What is your church's approximate weekly attendance?",
  org_type: "What type of organization are you?",
  annual_budget: "What is your church's annual operating budget?",
  finance_staff_count: "How many staff members handle finances and giving?",
  biggest_challenges: "What is your biggest challenge with online giving today?",
  missionaries_supported: "How many missionaries or partner organizations do you support?",
  distribution_method: "How do you distribute funds to missionaries/partners?",
  admin_hours_per_month: "How many hours per month on donation/finance admin?",
  software_type: "What type of software would best solve your giving needs?",
  top_features: "Which features matter most to you?",
  networking_importance: "How important is connecting with other churches (networking)?",
  has_website: "Do you have a church website today?",
  tech_type_needed: "What type of tech do you need for giving?",
  software_vs_streaming: "Software-based or streaming/live-based?",
  wish_tech_improved: "What tech do you wish was more available for churches?",
  spend_to_solve_problem: "How much would you spend to solve your biggest giving problem?",
  better_ways_to_give: "What are better ways you would like to handle giving?",
  easier_giving_ideas: "What would make giving easier for your congregation?",
  paperwork_method: "How does your church manage paperwork?",
  member_communication: "How do you communicate with members?",
  ai_form_interest: "Interest in AI that auto-builds forms from live stream?",
  team_growth_tracking: "How do you track team spiritual growth?",
  congregation_engagement: "How do you know how your congregation is doing?",
  automation_needs: "What automation do you need?",
  campaign_tools_interest: "Interest in campaign tools?",
  event_posting_needs: "Need for event posting?",
  teaching_packets_interest: "Interest in teaching packets?",
  ai_sermon_content: "Interest in AI sermon content generation?",
  ai_member_curation: "Interest in AI member content curation?",
  pastor_approval_workflow: "Pastor approval workflow preference?",
  member_development_tools: "Member development tools needed?",
  communication_automation: "Communication automation needed?",
  website_tool_needs: "Website & online tool needs?",
  currently_live_stream: "Do you currently live stream?",
  live_stream_platform: "Which live stream platform?",
  live_stream_giving_interest: "Interest in live stream giving?",
  live_stream_ai_features: "Live stream AI features wanted?",
  live_stream_challenges: "Live streaming challenges?",
  want_charts_dashboard: "Want real-time charts dashboard?",
  auto_giving_interest: "Interest in automated giving?",
  auto_giving_features: "Auto giving features wanted?",
  auto_transfer_fee_comfort: "Comfort with auto-transfer fees?",
  monthly_price_range: "What would you pay per month?",
  percent_fee_preference: "Prefer percentage fee on donations?",
  switch_triggers: "What would make you switch giving solutions?",
  respondent_name: "Respondent name",
  church_name: "Church name",
  contact_email: "Contact email",
  phone_number: "Phone number",
  allow_follow_up: "Allow follow-up?",
};

const DISPLAY_FIELDS = Object.keys(QUESTION_LABELS).filter(
  (k) => !["id", "created_at", "respondent_name", "church_name", "contact_email", "phone_number"].includes(k)
);

function formatValue(
  field: string,
  val: string | string[] | boolean | null
): string {
  if (val == null) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) {
    if (val.length === 0) return "—";
    return val
      .map((v) => getLabel(field, v) || v)
      .filter(Boolean)
      .join(", ");
  }
  return getLabel(field, val) || String(val);
}

function ResponseCard({ r, index }: { r: SurveyResponse; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const date = r.created_at
    ? new Date(r.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const answeredCount = DISPLAY_FIELDS.filter((field) => {
    const val = (r as Record<string, unknown>)[field];
    return val != null && val !== "" && !(Array.isArray(val) && val.length === 0);
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/50"
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20">
          <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
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
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              {answeredCount} answers
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {r.contact_email && (
            <span className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 sm:flex dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <Mail className="h-3 w-3" /> {r.contact_email}
            </span>
          )}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700">
              {/* Contact info row */}
              <div className="mb-4 flex flex-wrap gap-3">
                {r.contact_email && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                    <Mail className="h-3.5 w-3.5" /> {r.contact_email}
                  </span>
                )}
                {r.phone_number && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                    <Phone className="h-3.5 w-3.5" /> {r.phone_number}
                  </span>
                )}
                {r.allow_follow_up && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Opted in for follow-up
                  </span>
                )}
              </div>

              {/* Q&A list */}
              <dl className="space-y-3">
                {DISPLAY_FIELDS.map((field, qi) => {
                  const val = (r as Record<string, unknown>)[field];
                  if (val == null || val === "" || (Array.isArray(val) && val.length === 0))
                    return null;
                  const question = QUESTION_LABELS[field] ?? field;
                  const display = formatValue(field, val as string | string[] | boolean | null);
                  return (
                    <motion.div
                      key={field}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: qi * 0.02, duration: 0.3, ease }}
                      className="rounded-lg bg-slate-50/80 px-4 py-3 dark:bg-slate-700/40"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {question}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {display}
                      </dd>
                    </motion.div>
                  );
                })}
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type Props = {
  responses: SurveyResponse[];
};

export function SurveyResponsesTab({ responses }: Props) {
  const [filter, setFilter] = useState("");

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

  const filtered = filter.trim()
    ? responses.filter((r) => {
        const q = filter.toLowerCase();
        return (
          r.church_name?.toLowerCase().includes(q) ||
          r.respondent_name?.toLowerCase().includes(q) ||
          r.contact_email?.toLowerCase().includes(q)
        );
      })
    : responses;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{responses.length}</span> response{responses.length !== 1 ? "s" : ""} — what people are actually saying
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or org..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </motion.div>

      <div className="space-y-4">
        {filtered.map((r, i) => (
          <ResponseCard key={r.id} r={r} index={i} />
        ))}
        {filtered.length === 0 && filter.trim() && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            No responses matching &ldquo;{filter}&rdquo;
          </motion.p>
        )}
      </div>
    </div>
  );
}
