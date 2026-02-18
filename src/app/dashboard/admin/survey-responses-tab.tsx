"use client";

import { getLabel } from "@/components/survey/survey-label-map";
import type { SurveyResponse } from "../survey-results/page";

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
  (k) => !["id", "created_at"].includes(k)
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

function ResponseCard({ r }: { r: SurveyResponse }) {
  const date = r.created_at
    ? new Date(r.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {r.church_name || "Anonymous"}
        </span>
        {r.respondent_name && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            — {r.respondent_name}
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {date}
        </span>
      </div>
      <dl className="space-y-2.5">
        {DISPLAY_FIELDS.map((field) => {
          const val = (r as Record<string, unknown>)[field];
          if (val == null || val === "" || (Array.isArray(val) && val.length === 0))
            return null;
          const question = QUESTION_LABELS[field] ?? field;
          const display = formatValue(field, val as string | string[] | boolean | null);
          return (
            <div key={field} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="min-w-[200px] text-sm font-medium text-slate-600 dark:text-slate-400">
                {question}
              </dt>
              <dd className="text-sm text-slate-900 dark:text-slate-200">
                {display}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

type Props = {
  responses: SurveyResponse[];
};

export function SurveyResponsesTab({ responses }: Props) {
  if (responses.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/30">
        <p className="text-slate-600 dark:text-slate-400">
          No survey responses yet. Share the survey link to collect feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {responses.length} response{responses.length !== 1 ? "s" : ""} — what
        people are actually saying.
      </p>
      <div className="space-y-6">
        {responses.map((r) => (
          <ResponseCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
