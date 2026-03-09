import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ClipboardList, ExternalLink, Send } from "lucide-react";
import { SurveyDetailClient } from "./survey-detail-client";

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const { data: survey, error } = await supabase
    .from("organization_surveys")
    .select("id, title, description, questions, status, cover_image_url, theme, created_at, updated_at")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !survey) notFound();

  const [
    { data: responsesData },
    { count: contactCount },
  ] = await Promise.all([
    supabase
      .from("organization_survey_responses")
      .select("id, respondent_email, respondent_name, answers, created_at")
      .eq("survey_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .not("email", "is", null)
      .is("unsubscribed_at", null),
  ]);

  const responses = responsesData ?? [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const surveyLink = appUrl ? `${appUrl.replace(/\/$/, "")}/survey/org/${id}` : "";

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/surveys" className="text-sm text-dashboard-text-muted hover:text-dashboard-text">
          ← Back to surveys
        </Link>
      </div>
      <SurveyDetailClient
        surveyId={id}
        survey={survey as { id: string; title: string; description: string | null; questions: unknown[]; status: string; cover_image_url: string | null; theme: Record<string, unknown> | null; updated_at: string }}
        responses={responses as Array<{ id: string; respondent_email: string | null; respondent_name: string | null; answers: Record<string, string>; created_at: string }>}
        surveyLink={surveyLink}
        contactCount={contactCount ?? 0}
      />
    </div>
  );
}
