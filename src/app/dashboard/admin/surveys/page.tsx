import { createClient } from "@/lib/supabase/server";
import { SurveyResponsesTab } from "../survey-responses-tab";
import type { SurveyResponse } from "../../survey-results/page";

export default async function AdminSurveysPage() {
  const supabase = await createClient();
  const { data: surveyResponses } = await supabase
    .from("church_market_survey_responses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-dashboard-text">What people are saying</h2>
      <p className="mt-1 text-sm text-dashboard-text-muted">
        Full survey responses with each question and answer.
      </p>
      <div className="mt-6">
        <SurveyResponsesTab responses={(surveyResponses as SurveyResponse[]) ?? []} />
      </div>
    </section>
  );
}
