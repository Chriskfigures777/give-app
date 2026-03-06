"use client";

import { useState } from "react";
import {
  Plus, Trash2, Loader2, AlignLeft, Circle, ToggleLeft, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuestionType = "short_answer" | "paragraph" | "multiple_choice" | "yes_no";

export type QuestionRow = {
  id?: string;
  text: string;
  type: QuestionType;
  options?: string[];
  page?: number;
};

const TYPE_OPTIONS: { value: QuestionType; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: "short_answer", label: "Short answer",    icon: <Type className="h-3.5 w-3.5" />,       hint: "One line of text" },
  { value: "multiple_choice", label: "Pick one",     icon: <Circle className="h-3.5 w-3.5" />,      hint: "Select one option" },
  { value: "yes_no", label: "Yes or No",             icon: <ToggleLeft className="h-3.5 w-3.5" />,  hint: "Quick yes/no" },
  { value: "paragraph", label: "Paragraph",          icon: <AlignLeft className="h-3.5 w-3.5" />,   hint: "Long text answer" },
];

type Props = {
  initialTitle?: string;
  initialDescription?: string;
  initialQuestions?: QuestionRow[];
  onSave: (data: { title: string; description: string; questions: QuestionRow[] }) => Promise<void>;
  saving: boolean;
  saveLabel?: string;
  error?: string | null;
};

export function SurveyBuilder({
  initialTitle = "",
  initialDescription = "",
  initialQuestions = [],
  onSave,
  saving,
  saveLabel = "Publish survey",
  error,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions);
  const [activeQ, setActiveQ] = useState<number | null>(initialQuestions.length > 0 ? 0 : null);

  const addQuestion = () => {
    const next: QuestionRow = { text: "", type: "short_answer" };
    setQuestions((prev) => [...prev, next]);
    setActiveQ(questions.length);
  };

  const removeQuestion = (i: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
    setActiveQ(null);
  };

  const updateQuestion = (i: number, upd: Partial<QuestionRow>) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...upd };
      return next;
    });
  };

  const setOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...(next[qIdx].options ?? [])];
      opts[optIdx] = val;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], options: [...(next[qIdx].options ?? []), ""] };
      return next;
    });
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], options: (next[qIdx].options ?? []).filter((_, i) => i !== optIdx) };
      return next;
    });
  };

  return (
    <div>
      {/* ── Survey title + description ── */}
      <div className="mb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Survey title…"
          className="w-full bg-transparent text-3xl font-bold text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:outline-none"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a short description for respondents (optional)"
          className="mt-3 w-full bg-transparent text-base text-dashboard-text-muted placeholder:text-dashboard-text-muted/40 focus:outline-none"
        />
        <div className="mt-4 h-px bg-dashboard-border/50" />
      </div>

      {/* ── Question cards ── */}
      <div className="space-y-3">
        {questions.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-dashboard-text-muted text-sm">No questions yet — click below to add your first one.</p>
          </div>
        )}

        {questions.map((q, i) => {
          const isActive = activeQ === i;
          const typeMeta = TYPE_OPTIONS.find((t) => t.value === q.type);

          return (
            <div
              key={i}
              onClick={() => setActiveQ(i)}
              className={[
                "group relative rounded-2xl border transition-all cursor-pointer",
                isActive
                  ? "border-emerald-500/30 bg-dashboard-card shadow-lg shadow-black/10 ring-1 ring-emerald-500/10"
                  : "border-dashboard-border bg-dashboard-card hover:border-dashboard-border/80 hover:shadow-sm",
              ].join(" ")}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Number badge */}
                  <div className={[
                    "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                      : "bg-dashboard-card-hover text-dashboard-text-muted",
                  ].join(" ")}>
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  {/* Question content */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(i, { text: e.target.value })}
                      onClick={(e) => { e.stopPropagation(); setActiveQ(i); }}
                      placeholder="Type your question here…"
                      className="w-full bg-transparent text-lg font-semibold text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:outline-none"
                    />

                    {/* Inactive: show type label */}
                    {!isActive && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-dashboard-text-muted">
                        {typeMeta?.icon}
                        {typeMeta?.label}
                      </p>
                    )}

                    {/* Active: type picker + preview */}
                    {isActive && (
                      <>
                        {/* Type pill buttons */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {TYPE_OPTIONS.map((t) => {
                            const sel = q.type === t.value;
                            return (
                              <button
                                key={t.value}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuestion(i, {
                                    type: t.value,
                                    options:
                                      t.value === "multiple_choice"
                                        ? q.options?.length ? q.options : ["", ""]
                                        : undefined,
                                  });
                                }}
                                className={[
                                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                                  sel
                                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                                    : "bg-dashboard-card-hover text-dashboard-text-muted hover:text-dashboard-text",
                                ].join(" ")}
                              >
                                {t.icon}
                                {t.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Pick one — options */}
                        {q.type === "multiple_choice" && (
                          <div className="mt-5 space-y-2.5">
                            {(q.options ?? []).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-3">
                                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-dashboard-border" />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => setOption(i, oi, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder={`Choice ${oi + 1}`}
                                  className="flex-1 border-b border-dashboard-border/40 bg-transparent pb-1 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:border-emerald-500/40 focus:outline-none transition-colors"
                                />
                                {(q.options ?? []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeOption(i, oi); }}
                                    className="shrink-0 text-dashboard-text-muted/40 hover:text-rose-400 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); addOption(i); }}
                              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add another choice
                            </button>
                          </div>
                        )}

                        {/* Yes or No — preview */}
                        {q.type === "yes_no" && (
                          <div className="mt-5 flex gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card-hover px-5 py-2.5 text-sm font-medium text-dashboard-text-muted">
                              <span>👍</span> Yes
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card-hover px-5 py-2.5 text-sm font-medium text-dashboard-text-muted">
                              <span>👎</span> No
                            </div>
                          </div>
                        )}

                        {/* Short answer — preview */}
                        {q.type === "short_answer" && (
                          <div className="mt-5 h-10 rounded-lg border border-dashed border-dashboard-border/40 px-4 flex items-center">
                            <span className="text-sm text-dashboard-text-muted/40">Short answer text…</span>
                          </div>
                        )}

                        {/* Paragraph — preview */}
                        {q.type === "paragraph" && (
                          <div className="mt-5 h-20 rounded-lg border border-dashed border-dashboard-border/40 px-4 py-3 flex items-start">
                            <span className="text-sm text-dashboard-text-muted/40">Long answer text…</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Delete question */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeQuestion(i); }}
                    className="shrink-0 rounded-lg p-1.5 text-dashboard-text-muted/30 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                    title="Remove question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add question */}
        <button
          type="button"
          onClick={addQuestion}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-dashboard-border/50 py-5 text-sm font-medium text-dashboard-text-muted hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 transition-all"
        >
          <Plus className="h-4 w-4" /> Add a question
        </button>
      </div>

      {/* Save + error */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button
          onClick={() => onSave({ title, description, questions })}
          disabled={saving || questions.length === 0}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11 text-base"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveLabel}
        </Button>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {questions.length === 0 && (
          <p className="text-sm text-dashboard-text-muted">Add at least one question to continue.</p>
        )}
      </div>
    </div>
  );
}
