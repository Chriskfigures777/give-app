import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { SurveyResponseForm } from "./survey-response-form";

export default async function OrgSurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ surveyId: string }>;
  searchParams: Promise<{ name?: string; email?: string }>;
}) {
  const { surveyId } = await params;
  const sp = await searchParams;
  const prefillName = sp.name?.trim() ?? null;
  const prefillEmail = sp.email?.trim() ?? null;

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

  const accentColor = (survey.theme?.accent_color as string | undefined) ?? "#8b5cf6";
  const videoUrl = (survey.theme?.video_url as string | undefined) ?? "";
  const fontStyle = (survey.theme?.font_style as "sans" | "serif" | undefined) ?? "sans";
  const buttonShape = (survey.theme?.button_shape as "rounded" | "pill" | undefined) ?? "rounded";
  const formStyle = (survey.theme?.form_style as "card" | "minimal" | "bold" | undefined) ?? "card";
  const coverImageUrl = survey.cover_image_url;

  return (
    <div className="relative min-h-screen">

      {/* ── Full-screen background ── */}
      {coverImageUrl ? (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${coverImageUrl})`,
              filter: "blur(22px) brightness(0.22) saturate(1.3)",
              transform: "scale(1.08)",
            }}
            aria-hidden="true"
          />
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </>
      ) : (
        <div className="fixed inset-0 bg-[#0b0e16]" aria-hidden="true" />
      )}

      {/* ── Page content ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-10 sm:py-16">

        {/* Accent glow pill */}
        <div
          className="mb-8 h-1 w-16 rounded-full"
          style={{ background: accentColor, boxShadow: `0 0 20px ${accentColor}90` }}
        />

        {/* Form */}
        <div className="w-full max-w-lg">
          <SurveyResponseForm
            surveyId={survey.id}
            title={survey.title}
            description={survey.description}
            pages={pages}
            coverImageUrl={coverImageUrl}
            accentColor={accentColor}
            videoUrl={videoUrl}
            fontStyle={fontStyle}
            buttonShape={buttonShape}
            formStyle={formStyle}
            prefillName={prefillName}
            prefillEmail={prefillEmail}
          />
        </div>

        <p className="mt-10 text-xs text-white/20">Powered by Give</p>
      </div>
    </div>
  );
}
