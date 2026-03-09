"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SurveyBuilder, type QuestionRow, type SurveyTheme } from "../survey-builder-client";

type Props = { fromNoteId: string | null };

export function SurveysNewClient({ fromNoteId }: Props) {
  const router = useRouter();
  const [initialQuestions, setInitialQuestions] = useState<QuestionRow[]>([]);
  const [loadingFromNote, setLoadingFromNote] = useState(!!fromNoteId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromNoteId) return;

    try {
      const cached = localStorage.getItem(`note_questions_${fromNoteId}`);
      if (cached) {
        const parsed = JSON.parse(cached) as Array<{ text: string; type?: string; options?: string[] }>;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInitialQuestions(
            parsed.map((q) => ({
              text: q.text,
              type: (["short_answer", "multiple_choice", "yes_no", "paragraph"].includes(q.type ?? "")
                ? q.type
                : "short_answer") as QuestionRow["type"],
              options: Array.isArray(q.options) ? q.options : undefined,
            }))
          );
          localStorage.removeItem(`note_questions_${fromNoteId}`);
          setLoadingFromNote(false);
          return;
        }
      }
    } catch { /* localStorage unavailable */ }

    fetch(`/api/ai/generate-survey-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: fromNoteId, count: 6 }),
    })
      .then((r) => r.json())
      .then((d) => {
        if ((d as { questions?: unknown[] }).questions?.length) {
          setInitialQuestions(
            (d as { questions: Array<{ text: string; type?: string; options?: string[] }> }).questions.map((q) => ({
              text: q.text,
              type: (["short_answer", "multiple_choice", "yes_no", "paragraph"].includes(q.type ?? "")
                ? q.type
                : "short_answer") as QuestionRow["type"],
              options: Array.isArray(q.options) ? q.options : undefined,
            }))
          );
        }
      })
      .catch(() => setError("Failed to load questions from note"))
      .finally(() => setLoadingFromNote(false));
  }, [fromNoteId]);

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
        id: q.id ?? `q-${i}`,
        text: q.text.trim() || "Question",
        type: q.type === "yes_no" ? "multiple_choice" : q.type,
        options:
          q.type === "yes_no"
            ? ["Yes", "No"]
            : q.type === "multiple_choice" && q.options?.length
            ? q.options.filter(Boolean)
            : undefined,
        page: Math.floor(i / 4),
      }));
      const res = await fetch("/api/surveys", {
        method: "POST",
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
        throw new Error(d.error ?? "Failed to create survey");
      }
      const result = await res.json();
      router.push(`/dashboard/surveys/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  if (loadingFromNote) {
    return (
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-8 text-center text-dashboard-text-muted">
        Loading questions from note…
      </div>
    );
  }

  return (
    <SurveyBuilder
      initialQuestions={initialQuestions}
      onSave={handleSave}
      saving={saving}
      saveLabel="Publish survey"
      error={error}
    />
  );
}
