"use client";

import { useState } from "react";
import Image from "next/image";

type Question = { id?: string; text: string; type: string; options?: string[] };
type Props = {
  surveyId: string;
  title: string;
  description: string | null;
  pages: Question[][];
  coverImageUrl: string | null;
};

export function SurveyResponseForm({
  surveyId,
  title,
  description,
  pages,
  coverImageUrl,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPage = pages[pageIndex] ?? [];
  const isLastPage = pageIndex === pages.length - 1;
  const isFirstPage = pageIndex === 0;

  const setAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const next = () => {
    if (isLastPage) {
      submit();
    } else {
      setPageIndex((i) => i + 1);
    }
  };

  const back = () => {
    if (isFirstPage) return;
    setPageIndex((i) => i - 1);
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondent_email: email.trim() || null,
          respondent_name: name.trim() || null,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-dashboard-text">Thank you</h2>
        <p className="mt-2 text-dashboard-text-muted">Your response has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
      {coverImageUrl && pageIndex === 0 && (
        <div className="relative h-40 w-full bg-dashboard-card-hover">
          <Image src={coverImageUrl} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="p-6 sm:p-8">
        {pageIndex === 0 && (
          <>
            <h1 className="text-2xl font-bold text-dashboard-text">{title}</h1>
            {description ? (
              <p className="mt-2 text-dashboard-text-muted">{description}</p>
            ) : null}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-1">Your email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-dashboard-text"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-1">Your name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-dashboard-text"
                  placeholder="Name"
                />
              </div>
            </div>
          </>
        )}

        {currentPage.length > 0 && (
          <div className="mt-6 space-y-6">
            {currentPage.map((q, i) => {
              const qId = (q.id ?? `q-${i}`) as string;
              const isYesNo =
                q.type === "yes_no" ||
                (q.type === "multiple_choice" &&
                  q.options?.length === 2 &&
                  q.options[0] === "Yes" &&
                  q.options[1] === "No");

              return (
                <div key={qId}>
                  <label className="block text-base font-semibold text-dashboard-text mb-3">
                    {q.text}
                  </label>

                  {isYesNo ? (
                    <div className="flex gap-3">
                      {["Yes", "No"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswer(qId, opt)}
                          className={[
                            "flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-all",
                            answers[qId] === opt
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                              : "border-dashboard-border bg-dashboard-card-hover text-dashboard-text hover:border-emerald-500/40",
                          ].join(" ")}
                        >
                          <span>{opt === "Yes" ? "👍" : "👎"}</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : q.type === "multiple_choice" && q.options?.length ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className={[
                            "flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-all",
                            answers[qId] === opt
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-dashboard-border hover:border-dashboard-border/80",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                              answers[qId] === opt
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-dashboard-border",
                            ].join(" ")}
                          />
                          <input
                            type="radio"
                            name={qId}
                            value={opt}
                            checked={answers[qId] === opt}
                            onChange={() => setAnswer(qId, opt)}
                            className="sr-only"
                          />
                          <span className="text-dashboard-text">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : q.type === "paragraph" ? (
                    <textarea
                      value={answers[qId] ?? ""}
                      onChange={(e) => setAnswer(qId, e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:border-emerald-500/40 focus:outline-none resize-none transition-colors"
                      placeholder="Your answer…"
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[qId] ?? ""}
                      onChange={(e) => setAnswer(qId, e.target.value)}
                      className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:border-emerald-500/40 focus:outline-none transition-colors"
                      placeholder="Your answer…"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={back}
            disabled={isFirstPage}
            className="text-dashboard-text-muted hover:text-dashboard-text disabled:opacity-0"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={next}
            disabled={submitting}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting…" : isLastPage ? "Submit" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
