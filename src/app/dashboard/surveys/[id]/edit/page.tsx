import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { SurveyEditClient } from "./survey-edit-client";
import type { QuestionRow } from "../../survey-builder-client";

export default async function SurveyEditPage({
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
    .select("id, title, description, questions, status")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !survey) notFound();

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/surveys/${id}`} className="text-sm text-dashboard-text-muted hover:text-dashboard-text">
          ← Back to survey
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Edit survey</h1>
      <SurveyEditClient
        surveyId={id}
        initialTitle={(survey as { title: string }).title ?? ""}
        initialDescription={(survey as { description: string | null }).description ?? ""}
        initialQuestions={
          Array.isArray((survey as { questions: unknown }).questions)
            ? (survey as { questions: Array<{ id?: string; text: string; type: string; options?: string[]; page?: number }> }).questions.map((q) => ({
                id: q.id,
                text: q.text,
                type: (["short_answer", "multiple_choice", "yes_no", "paragraph"].includes(q.type)
                  ? q.type
                  : "short_answer") as QuestionRow["type"],
                options: q.options,
                page: q.page,
              }))
            : []
        }
      />
    </div>
  );
}
