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
  accentColor?: string;
  videoUrl?: string;
  previewMode?: boolean;
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/);
  return m?.[1] ?? null;
}
function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
}

export function SurveyResponseForm({
  surveyId,
  title,
  description,
  pages,
  coverImageUrl,
  accentColor = "#10b981",
  videoUrl = "",
  previewMode = false,
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

  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;
  const vimeoId = videoUrl ? getVimeoId(videoUrl) : null;
  const hasVideo = !!(ytId || vimeoId);

  const setAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const next = () => {
    if (previewMode) {
      if (!isLastPage) setPageIndex((i) => i + 1);
      return;
    }
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
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ background: `${accentColor}20` }}
        >
          ✓
        </div>
        <h2 className="text-xl font-bold text-dashboard-text">Thank you!</h2>
        <p className="mt-2 text-dashboard-text-muted">Your response has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
      {/* Cover media */}
      {pageIndex === 0 && (hasVideo || coverImageUrl) && (
        <div className="relative h-44 w-full bg-dashboard-card-hover overflow-hidden">
          {hasVideo ? (
            <div className="absolute inset-0 bg-black">
              {ytId && (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=0&modestbranding=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Survey video"
                />
              )}
              {vimeoId && (
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Survey video"
                />
              )}
            </div>
          ) : coverImageUrl ? (
            <Image src={coverImageUrl} alt="" fill className="object-cover" />
          ) : null}
          {/* Accent strip */}
          <div className="absolute bottom-0 inset-x-0 h-1" style={{ background: accentColor }} />
        </div>
      )}

      <div className="p-6 sm:p-8">
        {pageIndex === 0 && (
          <>
            <h1 className="text-2xl font-bold text-dashboard-text">{title}</h1>
            {description ? (
              <p className="mt-2 text-dashboard-text-muted">{description}</p>
            ) : null}
            {!previewMode && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dashboard-text mb-1">Your email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-dashboard-text focus:outline-none transition-colors"
                    style={{ "--focus-color": accentColor } as React.CSSProperties}
                    onFocus={(e) => { e.target.style.borderColor = `${accentColor}60`; }}
                    onBlur={(e) => { e.target.style.borderColor = ""; }}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dashboard-text mb-1">Your name (optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-dashboard-text focus:outline-none transition-colors"
                    onFocus={(e) => { e.target.style.borderColor = `${accentColor}60`; }}
                    onBlur={(e) => { e.target.style.borderColor = ""; }}
                    placeholder="Name"
                  />
                </div>
              </div>
            )}
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
                    <span
                      className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      {(pageIndex === 0 ? i : (pageIndex * 4 + i)) + 1}
                    </span>
                    {q.text}
                  </label>

                  {isYesNo ? (
                    <div className="flex gap-3">
                      {["Yes", "No"].map((opt) => {
                        const sel = answers[qId] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswer(qId, opt)}
                            className="flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-all"
                            style={sel ? {
                              borderColor: accentColor,
                              background: `${accentColor}18`,
                              color: accentColor,
                              boxShadow: `0 0 0 1px ${accentColor}40`,
                            } : {}}
                          >
                            <span>{opt === "Yes" ? "👍" : "👎"}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : q.type === "multiple_choice" && q.options?.length ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const sel = answers[qId] === opt;
                        return (
                          <label
                            key={opt}
                            className="flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-all"
                            style={sel ? {
                              borderColor: accentColor,
                              background: `${accentColor}12`,
                            } : {}}
                          >
                            <span
                              className="h-4 w-4 shrink-0 rounded-full border-2 transition-colors"
                              style={sel ? {
                                borderColor: accentColor,
                                background: accentColor,
                              } : { borderColor: "hsl(var(--dashboard-border))" }}
                            />
                            <input
                              type="radio"
                              name={qId}
                              value={opt}
                              checked={sel}
                              onChange={() => setAnswer(qId, opt)}
                              className="sr-only"
                            />
                            <span className="text-dashboard-text">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : q.type === "paragraph" ? (
                    <textarea
                      value={answers[qId] ?? ""}
                      onChange={(e) => setAnswer(qId, e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:outline-none resize-none transition-colors"
                      onFocus={(e) => { e.target.style.borderColor = `${accentColor}60`; }}
                      onBlur={(e) => { e.target.style.borderColor = ""; }}
                      placeholder="Your answer…"
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[qId] ?? ""}
                      onChange={(e) => setAnswer(qId, e.target.value)}
                      className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:outline-none transition-colors"
                      onFocus={(e) => { e.target.style.borderColor = `${accentColor}60`; }}
                      onBlur={(e) => { e.target.style.borderColor = ""; }}
                      placeholder="Your answer…"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-rose-400">{error}</p>
        )}

        <div className="mt-8 flex justify-between items-center">
          <button
            type="button"
            onClick={back}
            disabled={isFirstPage}
            className="text-sm text-dashboard-text-muted hover:text-dashboard-text disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>

          {/* Page indicator */}
          {pages.length > 1 && (
            <div className="flex gap-1">
              {pages.map((_, p) => (
                <span
                  key={p}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: p === pageIndex ? 20 : 6,
                    background: p === pageIndex ? accentColor : `${accentColor}30`,
                  }}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={next}
            disabled={submitting}
            className="rounded-xl px-6 py-2.5 font-medium text-white disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: accentColor }}
          >
            {previewMode
              ? (isLastPage ? "Preview complete" : "Next →")
              : (submitting ? "Submitting…" : isLastPage ? "Submit" : "Next →")}
          </button>
        </div>

        {previewMode && (
          <p className="mt-3 text-center text-xs text-dashboard-text-muted/60">Preview mode — responses are not saved</p>
        )}
      </div>
    </div>
  );
}
