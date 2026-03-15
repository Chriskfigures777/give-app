"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, ChevronRight, ChevronLeft, Send, Loader2 } from "lucide-react";

type Question = { id?: string; text: string; type: string; options?: string[] };

export type SurveyFormTheme = {
  accent_color?: string;
  video_url?: string;
  font_style?: "sans" | "serif";
  button_shape?: "rounded" | "pill";
  form_style?: "card" | "minimal" | "bold";
};

type Props = {
  surveyId: string;
  title: string;
  description: string | null;
  pages: Question[][];
  coverImageUrl: string | null;
  accentColor?: string;
  videoUrl?: string;
  fontStyle?: "sans" | "serif";
  buttonShape?: "rounded" | "pill";
  formStyle?: "card" | "minimal" | "bold";
  previewMode?: boolean;
  prefillName?: string | null;
  prefillEmail?: string | null;
  orgLogoUrl?: string | null;
  orgName?: string | null;
};

function interpolate(text: string, name: string, email: string): string {
  const firstName = name.split(" ")[0] ?? name;
  return text
    .replace(/\{\{name\}\}/gi, name)
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{email\}\}/gi, email);
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/);
  return m?.[1] ?? null;
}
function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
}

function hexToRgb(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "16,185,129";
  return `${r},${g},${b}`;
}

export function SurveyResponseForm({
  surveyId,
  title,
  description,
  pages,
  coverImageUrl,
  accentColor = "#10b981",
  videoUrl = "",
  fontStyle = "sans",
  buttonShape = "rounded",
  formStyle: _formStyle = "card",
  previewMode = false,
  prefillName = null,
  prefillEmail = null,
  orgLogoUrl = null,
  orgName = null,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [name, setName] = useState(prefillName ?? "");
  const isPrefilled = !!(prefillName || prefillEmail);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPage = pages[pageIndex] ?? [];
  const isLastPage = pageIndex === pages.length - 1;
  const isFirstPage = pageIndex === 0;
  const totalPages = pages.length;
  const pc = accentColor;
  const pcRgb = hexToRgb(pc);

  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;
  const vimeoId = videoUrl ? getVimeoId(videoUrl) : null;
  const hasVideo = !!(ytId || vimeoId);

  const fontFamily = fontStyle === "serif" ? "Georgia, 'Times New Roman', serif" : "inherit";

  const setAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const next = () => {
    if (previewMode) {
      if (!isLastPage) setPageIndex((i) => i + 1);
      return;
    }
    if (isLastPage) submit();
    else setPageIndex((i) => i + 1);
  };

  const back = () => {
    if (!isFirstPage) setPageIndex((i) => i - 1);
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
      <div className={`${previewMode ? "" : "min-h-screen"} flex flex-col items-center justify-center bg-gray-50 px-4 py-8`}>
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-gray-100" style={{ fontFamily }}>
          <div className="mb-6 flex justify-center">
            <div className="rounded-full p-5" style={{ backgroundColor: `rgba(${pcRgb},0.1)` }}>
              <CheckCircle2 className="h-12 w-12" style={{ color: pc }} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily }}>Thank you!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your response has been recorded.{name ? ` Thanks, ${name.split(" ")[0]}!` : ""}
          </p>
          <div className="mt-6 h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: `rgba(${pcRgb},0.3)` }} />
        </div>
        {!previewMode && <p className="mt-6 text-xs text-gray-400">Powered by Exchange</p>}
      </div>
    );
  }

  return (
    <div className={`${previewMode ? "" : "min-h-screen"} flex flex-col bg-gray-50`} style={{ fontFamily }}>

      {/* ── Colored header strip ── */}
      <div className="relative px-4 pt-8 pb-12 text-center" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}>
        {/* Video or cover image in header */}
        {pageIndex === 0 && hasVideo && (
          <div className="mx-auto mb-4 max-w-lg overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: "16/9" }}>
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
        )}
        {pageIndex === 0 && !hasVideo && coverImageUrl && (
          <div className="mx-auto mb-4 max-w-lg overflow-hidden rounded-xl shadow-lg relative" style={{ height: 180 }}>
            <Image src={coverImageUrl} alt="" fill className="object-cover" />
          </div>
        )}
        {orgLogoUrl && (
          <img src={orgLogoUrl} alt={orgName ?? ""} className="mx-auto mb-3 h-14 w-14 rounded-2xl object-cover shadow-lg ring-2 ring-white/20" />
        )}
        <h1 className="text-xl font-bold text-white" style={{ fontFamily }}>{title}</h1>
        {description && pageIndex === 0 && (
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/80">{description}</p>
        )}
      </div>

      {/* ── Card (overlaps header) ── */}
      <div className="flex-1 px-4 pb-8 -mt-6">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">

            {/* ── Progress bar ── */}
            {totalPages > 1 && (
              <div className="border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-1.5">
                  {pages.map((_, p) => (
                    <div
                      key={p}
                      className="h-1.5 flex-1 rounded-full transition-all duration-500"
                      style={{ background: p <= pageIndex ? pc : "#e5e7eb" }}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Page {pageIndex + 1} of {totalPages}
                </p>
              </div>
            )}

            {/* ── Form content ── */}
            <div className="p-6">

              {/* Identity inputs (first page, not prefilled) */}
              {pageIndex === 0 && !previewMode && (
                isPrefilled ? (
                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: pc }}
                    >
                      {(prefillName ?? prefillEmail ?? "?")[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900" style={{ fontFamily }}>
                        {prefillName ? `Responding as ${prefillName}` : "Responding anonymously"}
                      </p>
                      {prefillEmail && <p className="text-xs text-gray-500">{prefillEmail}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="form-label">Name (optional)</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Email (optional)</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="form-input" />
                    </div>
                  </div>
                )
              )}

              {/* Questions */}
              <div className="space-y-6">
                {currentPage.map((q, i) => {
                  const qId = (q.id ?? `q-${i}`) as string;
                  const isYesNo =
                    q.type === "yes_no" ||
                    (q.type === "multiple_choice" && q.options?.length === 2 && q.options[0] === "Yes" && q.options[1] === "No");
                  const globalIdx = pageIndex === 0 ? i : pageIndex * 4 + i;

                  return (
                    <div key={qId}>
                      <div className="flex items-start gap-3 mb-3">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold mt-0.5"
                          style={{ backgroundColor: `rgba(${pcRgb},0.1)`, color: pc }}
                        >
                          {globalIdx + 1}
                        </span>
                        <label className="text-sm font-semibold text-gray-900 leading-snug" style={{ fontFamily }}>
                          {interpolate(q.text, name, email)}
                        </label>
                      </div>

                      <div className="pl-9">
                        {isYesNo ? (
                          <div className="flex gap-3">
                            {["Yes", "No"].map((opt) => {
                              const sel = answers[qId] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setAnswer(qId, opt)}
                                  className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all ${
                                    sel ? "" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                                  style={sel ? { borderColor: pc, backgroundColor: `rgba(${pcRgb},0.08)`, color: pc } : undefined}
                                >
                                  <span className="text-base">{opt === "Yes" ? "\uD83D\uDC4D" : "\uD83D\uDC4E"}</span>
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
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setAnswer(qId, opt)}
                                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all ${
                                    sel ? "" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                                  style={sel ? { borderColor: pc, backgroundColor: `rgba(${pcRgb},0.08)`, color: pc } : undefined}
                                >
                                  <span
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                                    style={{
                                      borderColor: sel ? pc : "#d1d5db",
                                      backgroundColor: sel ? pc : "transparent",
                                    }}
                                  >
                                    {sel && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                  </span>
                                  <span style={{ fontFamily }}>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : q.type === "paragraph" ? (
                          <textarea
                            value={answers[qId] ?? ""}
                            onChange={(e) => setAnswer(qId, e.target.value)}
                            rows={4}
                            placeholder="Your answer\u2026"
                            className="form-input resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={answers[qId] ?? ""}
                            onChange={(e) => setAnswer(qId, e.target.value)}
                            placeholder="Your answer\u2026"
                            className="form-input"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* ── Navigation ── */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                {!isFirstPage && (
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                )}

                <button
                  type="button"
                  onClick={next}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: pc }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting&hellip;
                    </>
                  ) : previewMode ? (
                    isLastPage ? (
                      <>Preview done <CheckCircle2 className="h-4 w-4" /></>
                    ) : (
                      <>Continue <ChevronRight className="h-4 w-4" /></>
                    )
                  ) : isLastPage ? (
                    <>
                      <Send className="h-4 w-4" />
                      Submit
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                {totalPages > 1 ? `Page ${pageIndex + 1} of ${totalPages}` : ""}
              </p>
            </div>
          </div>

          {previewMode && (
            <p className="mt-3 text-center text-xs text-gray-400">Preview mode — responses are not saved</p>
          )}
          {!previewMode && <p className="mt-6 text-center text-xs text-gray-400">Powered by Exchange</p>}
        </div>
      </div>
    </div>
  );
}
