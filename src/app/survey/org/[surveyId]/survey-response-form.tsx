"use client";

import { useState } from "react";
import Image from "next/image";

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
  fontStyle = "sans",
  buttonShape = "rounded",
  formStyle = "card",
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
  const totalPages = pages.length;

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

  const btnRadius = buttonShape === "pill" ? "9999px" : "12px";
  const fontFamily = fontStyle === "serif" ? "Georgia, 'Times New Roman', serif" : "inherit";

  // Card style: how the outer wrapper looks
  const cardStyles: Record<string, React.CSSProperties> = {
    card: {
      background: "hsl(var(--dashboard-card))",
      border: "1px solid hsl(var(--dashboard-border))",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
    },
    minimal: {
      background: "transparent",
      border: "none",
    },
    bold: {
      background: "hsl(var(--dashboard-card))",
      border: `2px solid ${accentColor}40`,
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: `0 8px 48px ${accentColor}18`,
    },
  };

  if (done) {
    return (
      <div style={{ ...cardStyles[formStyle], padding: "3rem 2rem", textAlign: "center", fontFamily }}>
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center text-2xl"
          style={{ background: `${accentColor}18`, borderRadius: buttonShape === "pill" ? 9999 : 16, border: `2px solid ${accentColor}30` }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "hsl(var(--dashboard-text))", marginBottom: 8 }}>
          Thank you!
        </h2>
        <p style={{ fontSize: 15, color: "hsl(var(--dashboard-text-muted))" }}>
          Your response has been recorded.
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyles[formStyle], fontFamily }}>

      {/* ── Cover media (first page only) ── */}
      {pageIndex === 0 && (hasVideo || coverImageUrl) && (
        <div className="relative w-full overflow-hidden" style={{ height: 260 }}>
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
            <>
              <Image src={coverImageUrl} alt="" fill className="object-cover" />
              {/* gradient overlay for legibility */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)" }}
              />
            </>
          ) : null}
          {/* Accent strip */}
          <div className="absolute bottom-0 inset-x-0 h-1" style={{ background: accentColor }} />
        </div>
      )}

      {/* ── Progress bar (multi-page) ── */}
      {totalPages > 1 && (
        <div className="px-7 pt-5" style={{ background: formStyle === "minimal" ? "transparent" : undefined }}>
          <div className="flex items-center gap-1.5">
            {pages.map((_, p) => (
              <div
                key={p}
                className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{ background: p <= pageIndex ? accentColor : `${accentColor}22` }}
              />
            ))}
          </div>
          <p style={{ fontSize: 11, color: "hsl(var(--dashboard-text-muted))", marginTop: 6 }}>
            Page {pageIndex + 1} of {totalPages}
          </p>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ padding: formStyle === "minimal" ? "2rem 0" : "2rem 1.75rem 1.75rem" }}>

        {/* Header (first page) */}
        {pageIndex === 0 && (
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              color: "hsl(var(--dashboard-text))",
              lineHeight: 1.2,
              marginBottom: description ? 10 : 0,
              fontFamily,
            }}>
              {title}
            </h1>
            {description && (
              <p style={{ fontSize: 15, color: "hsl(var(--dashboard-text-muted))", lineHeight: 1.6 }}>
                {description}
              </p>
            )}
            {/* Email / name (not in preview mode) */}
            {!previewMode && (
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "hsl(var(--dashboard-text-muted))", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${accentColor}20`; }}
                    onBlur={(e) => { e.target.style.borderColor = "hsl(var(--dashboard-border))"; e.target.style.boxShadow = "none"; }}
                    style={{
                      width: "100%",
                      background: "hsl(var(--dashboard-card-hover, var(--dashboard-card)))",
                      border: "1.5px solid hsl(var(--dashboard-border))",
                      borderRadius: btnRadius === "9999px" ? 12 : btnRadius,
                      padding: "10px 14px",
                      fontSize: 14,
                      color: "hsl(var(--dashboard-text))",
                      outline: "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "hsl(var(--dashboard-text-muted))", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${accentColor}20`; }}
                    onBlur={(e) => { e.target.style.borderColor = "hsl(var(--dashboard-border))"; e.target.style.boxShadow = "none"; }}
                    style={{
                      width: "100%",
                      background: "hsl(var(--dashboard-card-hover, var(--dashboard-card)))",
                      border: "1.5px solid hsl(var(--dashboard-border))",
                      borderRadius: btnRadius === "9999px" ? 12 : btnRadius,
                      padding: "10px 14px",
                      fontSize: 14,
                      color: "hsl(var(--dashboard-text))",
                      outline: "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions */}
        {currentPage.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {currentPage.map((q, i) => {
              const qId = (q.id ?? `q-${i}`) as string;
              const isYesNo =
                q.type === "yes_no" ||
                (q.type === "multiple_choice" &&
                  q.options?.length === 2 &&
                  q.options[0] === "Yes" &&
                  q.options[1] === "No");

              const globalIdx = pageIndex === 0 ? i : pageIndex * 4 + i;

              return (
                <div key={qId}>
                  {/* Question label with number */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                    <span
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 26,
                        height: 26,
                        borderRadius: buttonShape === "pill" ? 9999 : 8,
                        background: `${accentColor}20`,
                        color: accentColor,
                        fontSize: 11,
                        fontWeight: 700,
                        marginTop: 2,
                      }}
                    >
                      {globalIdx + 1}
                    </span>
                    <label
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "hsl(var(--dashboard-text))",
                        lineHeight: 1.4,
                        fontFamily,
                      }}
                    >
                      {q.text}
                    </label>
                  </div>

                  {/* Answer area */}
                  {isYesNo ? (
                    <div style={{ display: "flex", gap: 12, paddingLeft: 36 }}>
                      {["Yes", "No"].map((opt) => {
                        const sel = answers[qId] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswer(qId, opt)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              border: `2px solid ${sel ? accentColor : "hsl(var(--dashboard-border))"}`,
                              borderRadius: btnRadius,
                              padding: "10px 22px",
                              fontSize: 15,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              background: sel ? `${accentColor}18` : "hsl(var(--dashboard-card-hover, var(--dashboard-card)))",
                              color: sel ? accentColor : "hsl(var(--dashboard-text))",
                              boxShadow: sel ? `0 0 0 3px ${accentColor}15` : "none",
                              fontFamily,
                            }}
                          >
                            <span style={{ fontSize: 18 }}>{opt === "Yes" ? "👍" : "👎"}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : q.type === "multiple_choice" && q.options?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 36 }}>
                      {q.options.map((opt) => {
                        const sel = answers[qId] === opt;
                        return (
                          <label
                            key={opt}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              cursor: "pointer",
                              border: `2px solid ${sel ? accentColor : "hsl(var(--dashboard-border))"}`,
                              borderRadius: btnRadius,
                              padding: "11px 16px",
                              transition: "all 0.15s",
                              background: sel ? `${accentColor}12` : "hsl(var(--dashboard-card-hover, var(--dashboard-card)))",
                              boxShadow: sel ? `0 0 0 3px ${accentColor}15` : "none",
                            }}
                          >
                            {/* Custom radio */}
                            <span
                              style={{
                                flexShrink: 0,
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: `2px solid ${sel ? accentColor : "hsl(var(--dashboard-border))"}`,
                                background: sel ? accentColor : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                              }}
                            >
                              {sel && (
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
                              )}
                            </span>
                            <input
                              type="radio"
                              name={qId}
                              value={opt}
                              checked={sel}
                              onChange={() => setAnswer(qId, opt)}
                              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 500, color: "hsl(var(--dashboard-text))", fontFamily }}>
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : q.type === "paragraph" ? (
                    <textarea
                      value={answers[qId] ?? ""}
                      onChange={(e) => setAnswer(qId, e.target.value)}
                      rows={4}
                      onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${accentColor}20`; }}
                      onBlur={(e) => { e.target.style.borderColor = "hsl(var(--dashboard-border))"; e.target.style.boxShadow = "none"; }}
                      placeholder="Your answer…"
                      style={{
                        width: "100%",
                        marginLeft: 36,
                        maxWidth: "calc(100% - 36px)",
                        background: "hsl(var(--dashboard-card-hover, var(--dashboard-card)))",
                        border: "1.5px solid hsl(var(--dashboard-border))",
                        borderRadius: btnRadius === "9999px" ? 12 : btnRadius,
                        padding: "12px 14px",
                        fontSize: 14,
                        color: "hsl(var(--dashboard-text))",
                        outline: "none",
                        resize: "none",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        boxSizing: "border-box",
                        fontFamily,
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[qId] ?? ""}
                      onChange={(e) => setAnswer(qId, e.target.value)}
                      onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${accentColor}20`; }}
                      onBlur={(e) => { e.target.style.borderColor = "hsl(var(--dashboard-border))"; e.target.style.boxShadow = "none"; }}
                      placeholder="Your answer…"
                      style={{
                        width: "100%",
                        marginLeft: 36,
                        maxWidth: "calc(100% - 36px)",
                        background: "hsl(var(--dashboard-card-hover, var(--dashboard-card)))",
                        border: "1.5px solid hsl(var(--dashboard-border))",
                        borderRadius: btnRadius === "9999px" ? 12 : btnRadius,
                        padding: "10px 14px",
                        fontSize: 14,
                        color: "hsl(var(--dashboard-text))",
                        outline: "none",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        boxSizing: "border-box",
                        fontFamily,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ marginTop: 16, fontSize: 13, color: "#f87171", background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "10px 14px" }}>
            {error}
          </p>
        )}

        {/* Navigation */}
        <div style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button
            type="button"
            onClick={back}
            disabled={isFirstPage}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: isFirstPage ? "transparent" : "hsl(var(--dashboard-text-muted))",
              background: "none",
              border: "none",
              cursor: isFirstPage ? "default" : "pointer",
              padding: 0,
              fontFamily,
            }}
          >
            ← Back
          </button>

          {/* Dot indicators (compact) */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 6 }}>
              {pages.map((_, p) => (
                <span
                  key={p}
                  style={{
                    display: "block",
                    width: p === pageIndex ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: p === pageIndex ? accentColor : `${accentColor}30`,
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={next}
            disabled={submitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: accentColor,
              color: "white",
              border: "none",
              borderRadius: btnRadius,
              padding: "11px 24px",
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
              transition: "opacity 0.15s, transform 0.1s",
              boxShadow: `0 4px 16px ${accentColor}40`,
              fontFamily,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            {submitting ? (
              "Submitting…"
            ) : previewMode ? (
              isLastPage ? "Preview done ✓" : "Next →"
            ) : (
              isLastPage ? "Submit response" : "Next →"
            )}
          </button>
        </div>

        {previewMode && (
          <p style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "hsl(var(--dashboard-text-muted))", opacity: 0.6 }}>
            Preview mode — responses are not saved
          </p>
        )}
      </div>
    </div>
  );
}
