import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { SurveyResponseForm } from "./survey-response-form";

export default async function OrgSurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("organization_surveys")
    .select("id, title, description, questions, cover_image_url, theme")
    .eq("id", surveyId)
    .eq("status", "published")
    .single();

  if (error || !data) notFound();

  const survey = data as {
    id: string;
    title: string;
    description: string | null;
    questions: Array<{ id?: string; text: string; type: string; options?: string[]; page?: number }>;
    cover_image_url: string | null;
    theme: Record<string, unknown>;
  };

  const questions = Array.isArray(survey.questions) ? survey.questions : [];
  const hasPageAssignments = questions.some((q) => typeof q.page === "number");
  const pages: Array<typeof questions> = hasPageAssignments
    ? (() => {
        const byPage = new Map<number, typeof questions>();
        for (const q of questions) {
          const p = typeof q.page === "number" ? q.page : 0;
            if (!byPage.has(p)) byPage.set(p, []);
            byPage.get(p)!.push(q);
          }
        const sorted = Array.from(byPage.entries()).sort((a, b) => a[0] - b[0]);
        return sorted.map(([, qs]) => qs);
      })()
    : (() => {
        const perPage = 4;
        const out: Array<typeof questions> = [];
        for (let i = 0; i < questions.length; i += perPage) {
          out.push(questions.slice(i, i + perPage));
        }
        return out.length ? out : [[]];
      })();
  if (pages.length === 0) pages.push([]);

  return (
    <div className="min-h-screen bg-dashboard-bg p-4 sm:p-6">
      <div className="mx-auto max-w-lg">
        <SurveyResponseForm
          surveyId={survey.id}
          title={survey.title}
          description={survey.description}
          pages={pages}
          coverImageUrl={survey.cover_image_url}
          accentColor={(survey.theme?.accent_color as string | undefined) ?? "#10b981"}
          videoUrl={(survey.theme?.video_url as string | undefined) ?? ""}
        />
      </div>
    </div>
  );
}
