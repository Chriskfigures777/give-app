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
    .select("id, title, description, questions, status, cover_image_url, theme")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !survey) notFound();

  const s = survey as {
    title: string;
    description: string | null;
    questions: Array<{ id?: string; text: string; type: string; options?: string[]; page?: number }>;
    cover_image_url: string | null;
    theme: { accent_color?: string; video_url?: string } | null;
  };

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/surveys/${id}`} className="text-sm text-dashboard-text-muted hover:text-dashboard-text">
          ← Back to survey
        </Link>
      </div>
      <SurveyEditClient
        surveyId={id}
        initialTitle={s.title ?? ""}
        initialDescription={s.description ?? ""}
        initialQuestions={
          Array.isArray(s.questions)
            ? s.questions.map((q) => ({
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
        initialCoverUrl={s.cover_image_url}
        initialTheme={s.theme ?? {}}
      />
    </div>
  );
}
