import { requirePlatformAdmin } from "@/lib/auth";
import { SurveyResultsClient } from "./survey-results-client";

export default async function SurveyResultsPage() {
  const { supabase } = await requirePlatformAdmin();

  const { data: responses } = await supabase
    .from("church_market_survey_responses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 p-2 sm:p-4 max-w-[1400px] mx-auto">
      <div className="dashboard-fade-in">
        <h1 className="text-xl font-bold tracking-tight text-dashboard-text">
          Church Market Survey Results
        </h1>
        <p className="text-sm text-dashboard-text-muted mt-0.5">
          {responses?.length ?? 0} response{(responses?.length ?? 0) !== 1 ? "s" : ""} collected
        </p>
      </div>

      <SurveyResultsClient responses={(responses as SurveyResponse[]) ?? []} />
    </div>
  );
}

export type SurveyResponse = {
  id: string;
  created_at: string;
  weekly_attendance: string | null;
  org_type: string | null;
  annual_budget: string | null;
  finance_staff_count: string | null;
  biggest_challenges: string[] | null;
  missionaries_supported: string | null;
  distribution_method: string | null;
  admin_hours_per_month: string | null;
  software_type: string | null;
  top_features: string[] | null;
  networking_importance: string | null;
  has_website: string | null;
  tech_type_needed: string | null;
  software_vs_streaming: string | null;
  wish_tech_improved: string[] | null;
  spend_to_solve_problem: string | null;
  better_ways_to_give: string[] | null;
  easier_giving_ideas: string | null;
  paperwork_method: string | null;
  member_communication: string[] | null;
  ai_form_interest: string | null;
  team_growth_tracking: string | null;
  congregation_engagement: string[] | null;
  automation_needs: string[] | null;
  campaign_tools_interest: string | null;
  event_posting_needs: string | null;
  teaching_packets_interest: string | null;
  ai_sermon_content: string | null;
  ai_member_curation: string | null;
  pastor_approval_workflow: string | null;
  member_development_tools: string[] | null;
  communication_automation: string[] | null;
  website_tool_needs: string[] | null;
  currently_live_stream: string | null;
  live_stream_platform: string | null;
  live_stream_giving_interest: string | null;
  live_stream_ai_features: string[] | null;
  live_stream_challenges: string[] | null;
  want_charts_dashboard: string | null;
  auto_giving_interest: string | null;
  auto_giving_features: string[] | null;
  auto_transfer_fee_comfort: string | null;
  monthly_price_range: string | null;
  percent_fee_preference: string | null;
  switch_triggers: string[] | null;
  respondent_name: string | null;
  phone_number: string | null;
  contact_email: string | null;
  church_name: string | null;
  allow_follow_up: boolean | null;
};
