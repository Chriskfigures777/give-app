"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SurveyBuilder, type QuestionRow } from "../../survey-builder-client";

type Props = {
  surveyId: string;
  initialTitle: string;
  initialDescription: string;
  initialQuestions: QuestionRow[];
};

export function SurveyEditClient({
  surveyId,
  initialTitle,
  initialDescription,
  initialQuestions,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: { title: string; description: string; questions: QuestionRow[] }) => {
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
      onSave={handleSave}
      saving={saving}
      saveLabel="Save changes"
      error={error}
    />
  );
}
