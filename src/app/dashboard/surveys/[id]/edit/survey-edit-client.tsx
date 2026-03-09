"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SurveyBuilder, type QuestionRow, type SurveyTheme } from "../../survey-builder-client";

type Props = {
  surveyId: string;
  initialTitle: string;
  initialDescription: string;
  initialQuestions: QuestionRow[];
  initialCoverUrl?: string | null;
  initialTheme?: SurveyTheme;
};

export function SurveyEditClient({
  surveyId,
  initialTitle,
  initialDescription,
  initialQuestions,
  initialCoverUrl,
  initialTheme,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: {
    title: string;
    description: string;
    questions: QuestionRow[];
    cover_image_url: string | null;
    theme: SurveyTheme;
  }) => {
    setError(null);
    setSaving(true);
    try {
      const payload = data.questions.map((q, i) => ({
        id: q.id,
        text: q.text.trim() || "Question",
        type: q.type === "yes_no" ? "multiple_choice" : q.type,
        options:
          q.type === "yes_no"
            ? ["Yes", "No"]
            : q.type === "multiple_choice" && q.options?.length
            ? q.options.filter(Boolean)
            : undefined,
        page: typeof q.page === "number" ? q.page : Math.floor(i / 4),
      }));
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.trim() || "Untitled survey",
          description: data.description.trim() || null,
          questions: payload,
          cover_image_url: data.cover_image_url,
          theme: data.theme,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }
      router.push(`/dashboard/surveys/${surveyId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SurveyBuilder
      initialTitle={initialTitle}
      initialDescription={initialDescription}
      initialQuestions={initialQuestions}
      initialCoverUrl={initialCoverUrl}
      initialTheme={initialTheme}
      onSave={handleSave}
      saving={saving}
      saveLabel="Save changes"
      error={error}
    />
  );
}
