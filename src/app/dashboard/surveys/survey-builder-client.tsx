"use client";

import { useState } from "react";
import {
  Plus, Trash2, Loader2, AlignLeft, Circle, ToggleLeft, Type,
  Image as ImageIcon, Video as VideoIcon, Check, ChevronRight,
  Palette, Sliders,
} from "lucide-react";

export type QuestionType = "short_answer" | "paragraph" | "multiple_choice" | "yes_no";

export type QuestionRow = {
  id?: string;
  text: string;
  type: QuestionType;
  options?: string[];
  page?: number;
};

export type SurveyTheme = {
  accent_color?: string;
  video_url?: string;
  font_style?: "sans" | "serif";
  button_shape?: "rounded" | "pill";
  form_style?: "card" | "minimal" | "bold";
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: QuestionType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "short_answer",    label: "Short text",      icon: <Type className="h-5 w-5" />,       desc: "One line answer" },
  { value: "multiple_choice", label: "Multiple choice", icon: <Circle className="h-5 w-5" />,      desc: "Pick one option" },
  { value: "yes_no",          label: "Yes / No",        icon: <ToggleLeft className="h-5 w-5" />,  desc: "Quick thumbs" },
  { value: "paragraph",       label: "Long text",       icon: <AlignLeft className="h-5 w-5" />,   desc: "Multi-line answer" },
];

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80",
  "https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=900&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80",
  "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=900&q=80",
];

const ACCENT_COLORS = [
  { value: "#8b5cf6", name: "Violet" },
  { value: "#10b981", name: "Emerald" },
  { value: "#3b82f6", name: "Blue" },
  { value: "#f59e0b", name: "Amber" },
  { value: "#ef4444", name: "Red" },
  { value: "#ec4899", name: "Pink" },
  { value: "#06b6d4", name: "Cyan" },
  { value: "#84cc16", name: "Lime" },
];

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/);
  return m?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  initialTitle?: string;
  initialDescription?: string;
  initialQuestions?: QuestionRow[];
  initialCoverUrl?: string | null;
  initialTheme?: SurveyTheme;
  onSave: (data: {
    title: string;
    description: string;
    questions: QuestionRow[];
    cover_image_url: string | null;
    theme: SurveyTheme;
  }) => Promise<void>;
  saving: boolean;
  saveLabel?: string;
  error?: string | null;
};

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-dashboard-text-muted/60 mb-3">
    {children}
  </p>
);

// ── Main component ────────────────────────────────────────────────────────────

export function SurveyBuilder({
  initialTitle = "",
  initialDescription = "",
  initialQuestions = [],
  initialCoverUrl = null,
  initialTheme = {},
  onSave,
  saving,
  saveLabel = "Publish survey",
  error,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions);
  const [activeQ, setActiveQ] = useState<number | null>(initialQuestions.length > 0 ? 0 : null);

  // Theme state
  const [coverUrl, setCoverUrl] = useState<string>(initialCoverUrl ?? COVER_IMAGES[0]);
  const [accentColor, setAccentColor] = useState(initialTheme.accent_color ?? "#8b5cf6");
  const [videoUrl, setVideoUrl] = useState(initialTheme.video_url ?? "");
  const [fontStyle, setFontStyle] = useState<"sans" | "serif">(initialTheme.font_style ?? "sans");
  const [buttonShape, setButtonShape] = useState<"rounded" | "pill">(initialTheme.button_shape ?? "rounded");
  const [formStyle, setFormStyle] = useState<"card" | "minimal" | "bold">(initialTheme.form_style ?? "card");

  // Right panel tab
  const [designTab, setDesignTab] = useState<"cover" | "design">("design");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [videoInput, setVideoInput] = useState(initialTheme.video_url ?? "");
  const [hexInput, setHexInput] = useState(initialTheme.accent_color ?? "#8b5cf6");

  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;
  const vimeoId = videoUrl ? getVimeoId(videoUrl) : null;
  const hasVideo = !!(ytId || vimeoId);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const addQuestion = () => {
    const next: QuestionRow = { text: "", type: "short_answer" };
    const newIdx = questions.length;
    setQuestions((p) => [...p, next]);
    setActiveQ(newIdx);
  };

  const removeQuestion = (i: number) => {
    setQuestions((p) => p.filter((_, idx) => idx !== i));
    setActiveQ(questions.length > 1 ? Math.max(0, i - 1) : null);
  };

  const updateQuestion = (i: number, upd: Partial<QuestionRow>) => {
    setQuestions((p) => { const n = [...p]; n[i] = { ...n[i], ...upd }; return n; });
  };

  const setOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((p) => {
      const n = [...p];
      const opts = [...(n[qIdx].options ?? [])];
      opts[optIdx] = val;
      n[qIdx] = { ...n[qIdx], options: opts };
      return n;
    });
  };

  const addOption = (qIdx: number) => {
    setQuestions((p) => {
      const n = [...p];
      n[qIdx] = { ...n[qIdx], options: [...(n[qIdx].options ?? []), ""] };
      return n;
    });
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions((p) => {
      const n = [...p];
      n[qIdx] = { ...n[qIdx], options: (n[qIdx].options ?? []).filter((_, i) => i !== optIdx) };
      return n;
    });
  };

  const applyHex = () => {
    const v = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setAccentColor(v);
    else setHexInput(accentColor);
  };

  const activeQuestion = activeQ !== null ? questions[activeQ] : null;

  const handleSave = () => {
    onSave({
      title,
      description,
      questions,
      cover_image_url: hasVideo ? null : coverUrl,
      theme: { accent_color: accentColor, video_url: videoUrl || undefined, font_style: fontStyle, button_shape: buttonShape, form_style: formStyle },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-dashboard-border"
      style={{ background: "hsl(var(--dashboard-card))", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}
    >
      {/* ══════════ COVER HERO ══════════ */}
      <div className="relative shrink-0" style={{ height: 220 }}>
        {hasVideo ? (
          <div className="absolute inset-0 bg-black">
            {ytId && <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=0&modestbranding=1&rel=0`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Survey cover video" />}
            {vimeoId && <iframe src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Survey cover video" />}
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)" }} />
        <div className="absolute bottom-0 inset-x-0 h-[3px]" style={{ background: accentColor }} />

        {/* Title/desc edit overlaid on cover */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pr-64">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Survey title…"
            className="w-full bg-transparent text-2xl font-extrabold text-white placeholder:text-white/30 focus:outline-none"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for respondents (optional)"
            className="mt-1 w-full bg-transparent text-sm text-white/60 placeholder:text-white/25 focus:outline-none"
          />
        </div>

        {/* Save button — top-right on cover */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {error && <span className="text-xs text-rose-400 bg-rose-500/15 rounded-lg px-2.5 py-1.5">{error}</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || questions.length === 0}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: accentColor, boxShadow: `0 4px 20px ${accentColor}50` }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saveLabel}
          </button>
        </div>
      </div>

      {/* ══════════ THREE-COLUMN LAYOUT ══════════ */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 520 }}>

        {/* ── LEFT: Question list ── */}
        <div
          className="flex flex-col shrink-0 border-r border-dashboard-border/60"
          style={{ width: 220, background: "rgba(0,0,0,0.18)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-xs font-bold text-dashboard-text tracking-tight">
              Questions
              {questions.length > 0 && (
                <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${accentColor}22`, color: accentColor }}>
                  {questions.length}
                </span>
              )}
            </p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-0.5 px-2 pb-2">
            {questions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${accentColor}12` }}>
                  <AlignLeft className="h-5 w-5" style={{ color: accentColor }} />
                </div>
                <p className="text-xs text-dashboard-text-muted">No questions yet</p>
              </div>
            )}
            {questions.map((q, i) => {
              const meta = TYPE_OPTIONS.find((t) => t.value === q.type);
              const isActive = activeQ === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveQ(i)}
                  className="group w-full flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all border"
                  style={isActive
                    ? { borderColor: `${accentColor}30`, background: `${accentColor}12` }
                    : { borderColor: "transparent", background: "transparent" }
                  }
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[9px] font-black tabular-nums"
                    style={isActive
                      ? { background: accentColor, color: "white" }
                      : { background: "rgba(255,255,255,0.10)", color: "#c4cad8" }
                    }
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug line-clamp-2 transition-colors" style={{ color: isActive ? "#eef0f6" : "#c4cad8" }}>
                      {q.text || <span className="italic" style={{ opacity: 0.45 }}>Untitled</span>}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px]" style={{ color: isActive ? accentColor : "#8891a5" }}>
                      {meta?.icon && <span className="[&_svg]:h-3 [&_svg]:w-3">{meta.icon}</span>}
                      {meta?.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={addQuestion}
            className="mx-2 mb-3 flex items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs font-semibold transition-all hover:opacity-80"
            style={{ borderColor: `${accentColor}40`, color: accentColor, background: `${accentColor}08` }}
          >
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
        </div>

        {/* ── CENTER: Question editor ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeQ === null || !activeQuestion ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center py-16">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ background: `${accentColor}14`, border: `1.5px solid ${accentColor}25` }}>
                <AlignLeft className="h-7 w-7" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-base font-bold text-dashboard-text">Start building your survey</p>
                <p className="mt-1.5 text-sm text-dashboard-text-muted max-w-xs leading-relaxed">
                  Add questions on the left. Each question gets its own editor with a live preview.
                </p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: accentColor, boxShadow: `0 4px 20px ${accentColor}40` }}
              >
                <Plus className="h-4 w-4" /> Add first question
              </button>
            </div>
          ) : (
            <div className="space-y-7 max-w-2xl">

              {/* Question header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black text-white"
                    style={{ background: accentColor }}
                  >
                    {(activeQ ?? 0) + 1}
                  </span>
                  <span className="text-sm font-bold text-dashboard-text">
                    Question {(activeQ ?? 0) + 1}
                    <span className="ml-1 text-dashboard-text-muted font-normal">of {questions.length}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(activeQ!)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-dashboard-text-muted/60 hover:bg-rose-500/12 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>

              {/* Question text */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-dashboard-text">
                  Question text
                </label>
                <textarea
                  value={activeQuestion.text}
                  onChange={(e) => updateQuestion(activeQ!, { text: e.target.value })}
                  placeholder="What would you like to ask?"
                  rows={2}
                  className="w-full resize-none rounded-2xl border-2 px-5 py-4 text-base font-semibold text-dashboard-text placeholder:text-dashboard-text-muted/30 focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "hsl(var(--dashboard-border))",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.background = `${accentColor}06`; }}
                  onBlur={(e) => { e.target.style.borderColor = "hsl(var(--dashboard-border))"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
                />
              </div>

              {/* Answer type — 2x2 grid of visual cards */}
              <div>
                <label className="mb-3 flex items-center gap-1.5 text-xs font-bold text-dashboard-text">
                  Answer type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TYPE_OPTIONS.map((t) => {
                    const sel = activeQuestion.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => updateQuestion(activeQ!, {
                          type: t.value,
                          options: t.value === "multiple_choice"
                            ? (activeQuestion.options?.length ? activeQuestion.options : ["", ""])
                            : undefined,
                        })}
                        className="relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all hover:scale-[1.01]"
                        style={sel ? {
                          borderColor: accentColor,
                          background: `${accentColor}12`,
                          boxShadow: `0 0 0 3px ${accentColor}18`,
                        } : {
                          borderColor: "hsl(var(--dashboard-border)/0.7)",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span
                          className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center [&_svg]:h-4.5 [&_svg]:w-4.5"
                          style={sel
                            ? { background: accentColor, color: "white" }
                            : { background: "rgba(255,255,255,0.06)", color: "#8891a5" }
                          }
                        >
                          {t.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold" style={{ color: sel ? "hsl(var(--dashboard-text))" : "#8891a5" }}>{t.label}</p>
                          <p className="text-[11px]" style={{ color: sel ? accentColor : "#8891a5", opacity: sel ? 0.8 : 0.5 }}>{t.desc}</p>
                        </div>
                        {sel && (
                          <span className="absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center" style={{ background: accentColor }}>
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Answer options editor */}
              {activeQuestion.type === "multiple_choice" && (
                <div>
                  <label className="mb-3 flex items-center gap-1.5 text-xs font-bold text-dashboard-text">
                    Answer choices
                  </label>
                  <div className="space-y-2">
                    {(activeQuestion.options ?? []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-3">
                        <span
                          className="shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
                          style={{ borderColor: `${accentColor}50`, color: accentColor }}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => setOption(activeQ!, oi, e.target.value)}
                          placeholder={`Choice ${oi + 1}`}
                          className="flex-1 rounded-xl border border-dashboard-border/60 bg-white/3 px-4 py-2.5 text-sm font-medium text-dashboard-text placeholder:text-dashboard-text-muted/30 focus:outline-none transition-all"
                          onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.background = `${accentColor}06`; }}
                          onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.background = ""; }}
                        />
                        {(activeQuestion.options ?? []).length > 2 && (
                          <button type="button" onClick={() => removeOption(activeQ!, oi)} className="shrink-0 rounded-lg p-1 text-dashboard-text-muted/40 hover:bg-rose-500/12 hover:text-rose-400 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(activeQ!)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:opacity-80"
                      style={{ color: accentColor, background: `${accentColor}10` }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add choice
                    </button>
                  </div>
                </div>
              )}

              {/* Yes/No preview */}
              {activeQuestion.type === "yes_no" && (
                <div>
                  <label className="mb-3 text-xs font-bold text-dashboard-text block">Preview</label>
                  <div className="flex gap-3">
                    {["👍 Yes", "👎 No"].map((label, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-2xl border-2 px-6 py-3 text-sm font-semibold"
                        style={i === 0
                          ? { borderColor: accentColor, background: `${accentColor}12`, color: accentColor }
                          : { borderColor: "hsl(var(--dashboard-border))", background: "transparent", color: "hsl(var(--dashboard-text-muted))" }
                        }
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short answer / paragraph preview */}
              {(activeQuestion.type === "short_answer" || activeQuestion.type === "paragraph") && (
                <div>
                  <label className="mb-3 text-xs font-bold text-dashboard-text block">Preview</label>
                  <div
                    className="rounded-2xl border-2 border-dashed px-5 py-4 flex items-start"
                    style={{ borderColor: `${accentColor}25`, minHeight: activeQuestion.type === "paragraph" ? 96 : 48 }}
                  >
                    <span className="text-sm text-dashboard-text-muted/30 italic">
                      {activeQuestion.type === "paragraph" ? "Respondent's long answer…" : "Respondent's short answer…"}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation hint */}
              {questions.length > 1 && (
                <div className="flex items-center justify-between border-t border-dashboard-border/40 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveQ(Math.max(0, (activeQ ?? 0) - 1))}
                    disabled={activeQ === 0}
                    className="text-xs font-semibold text-dashboard-text-muted hover:text-dashboard-text disabled:opacity-0 transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQ(Math.min(questions.length - 1, (activeQ ?? 0) + 1))}
                    disabled={activeQ === questions.length - 1}
                    className="flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: accentColor }}
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Design panel ── */}
        <div
          className="flex flex-col shrink-0 border-l border-dashboard-border/60 overflow-y-auto"
          style={{ width: 256, background: "rgba(0,0,0,0.14)" }}
        >
          {/* Panel tabs */}
          <div className="flex border-b border-dashboard-border/60 shrink-0">
            {[
              { id: "design" as const, label: "Design", icon: <Palette className="h-3.5 w-3.5" /> },
              { id: "cover" as const, label: "Cover", icon: <ImageIcon className="h-3.5 w-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDesignTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2"
                style={designTab === tab.id
                  ? { borderBottomColor: accentColor, color: "hsl(var(--dashboard-text))" }
                  : { borderBottomColor: "transparent", color: "hsl(var(--dashboard-text-muted))" }
                }
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-6">

            {/* ── DESIGN TAB ── */}
            {designTab === "design" && (
              <>
                {/* Accent color */}
                <div>
                  <SectionLabel>Theme color</SectionLabel>
                  {/* Preview swatch */}
                  <div
                    className="mb-3 h-12 w-full rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ background: accentColor, boxShadow: `0 4px 16px ${accentColor}40` }}
                  >
                    {ACCENT_COLORS.find(c => c.value === accentColor)?.name ?? "Custom"}
                  </div>
                  {/* Swatches */}
                  <div className="grid grid-cols-4 gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.name}
                        onClick={() => { setAccentColor(c.value); setHexInput(c.value); }}
                        className="h-9 rounded-xl border-2 transition-all hover:scale-110 relative"
                        style={{
                          background: c.value,
                          borderColor: accentColor === c.value ? "white" : "transparent",
                          boxShadow: accentColor === c.value ? `0 0 0 3px ${c.value}50, 0 2px 8px ${c.value}40` : "none",
                        }}
                      >
                        {accentColor === c.value && (
                          <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Hex input */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg shrink-0" style={{ background: accentColor }} />
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value)}
                      onBlur={applyHex}
                      onKeyDown={(e) => e.key === "Enter" && applyHex()}
                      placeholder="#8b5cf6"
                      className="flex-1 rounded-lg border border-dashboard-border/60 bg-white/4 px-3 py-1.5 text-xs font-mono text-dashboard-text focus:outline-none transition-colors"
                      style={{ letterSpacing: "0.05em" }}
                    />
                  </div>
                </div>

                {/* Font */}
                <div>
                  <SectionLabel>Font style</SectionLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(["sans", "serif"] as const).map((f) => {
                      const sel = fontStyle === f;
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFontStyle(f)}
                          className="rounded-xl border-2 py-3 text-center transition-all"
                          style={{
                            borderColor: sel ? accentColor : "hsl(var(--dashboard-border)/0.6)",
                            background: sel ? `${accentColor}12` : "rgba(255,255,255,0.02)",
                            fontFamily: f === "serif" ? "Georgia, serif" : "inherit",
                          }}
                        >
                          <p className="text-base font-bold" style={{ color: sel ? accentColor : "hsl(var(--dashboard-text))", fontFamily: f === "serif" ? "Georgia, serif" : "inherit" }}>
                            Aa
                          </p>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: sel ? accentColor : "hsl(var(--dashboard-text-muted))" }}>
                            {f === "sans" ? "Modern" : "Classic"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Button shape */}
                <div>
                  <SectionLabel>Button shape</SectionLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(["rounded", "pill"] as const).map((s) => {
                      const sel = buttonShape === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setButtonShape(s)}
                          className="flex flex-col items-center gap-2 py-3 border-2 transition-all"
                          style={{
                            borderRadius: s === "pill" ? 20 : 12,
                            borderColor: sel ? accentColor : "hsl(var(--dashboard-border)/0.6)",
                            background: sel ? `${accentColor}12` : "rgba(255,255,255,0.02)",
                          }}
                        >
                          {/* Mini button preview */}
                          <div
                            className="h-5 w-14 text-white text-[9px] font-bold flex items-center justify-center"
                            style={{
                              background: sel ? accentColor : "#8891a5",
                              borderRadius: s === "pill" ? 999 : 4,
                            }}
                          >
                            Submit
                          </div>
                          <p className="text-[10px] font-semibold" style={{ color: sel ? accentColor : "hsl(var(--dashboard-text-muted))" }}>
                            {s === "rounded" ? "Rounded" : "Pill"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form style */}
                <div>
                  <SectionLabel>Card style</SectionLabel>
                  <div className="space-y-2">
                    {(["card", "bold", "minimal"] as const).map((s) => {
                      const sel = formStyle === s;
                      const labels: Record<string, string> = { card: "Standard card", bold: "Bold accent", minimal: "No border" };
                      const descs: Record<string, string> = { card: "Clean framed card", bold: "Glowing accent border", minimal: "Content only" };
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormStyle(s)}
                          className="w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all"
                          style={{
                            borderColor: sel ? accentColor : "hsl(var(--dashboard-border)/0.5)",
                            background: sel ? `${accentColor}10` : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <span
                            className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center"
                            style={sel ? { background: accentColor, color: "white" } : { background: "rgba(255,255,255,0.06)", color: "#8891a5" }}
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold" style={{ color: sel ? "hsl(var(--dashboard-text))" : "#8891a5" }}>{labels[s]}</p>
                            <p className="text-[10px]" style={{ color: sel ? accentColor : "#8891a5", opacity: sel ? 0.75 : 0.5 }}>{descs[s]}</p>
                          </div>
                          {sel && <Check className="ml-auto shrink-0 h-3.5 w-3.5" style={{ color: accentColor }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── COVER TAB ── */}
            {designTab === "cover" && (
              <>
                {/* Cover images */}
                <div>
                  <SectionLabel>Cover image</SectionLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {COVER_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setCoverUrl(img); setVideoUrl(""); setVideoInput(""); }}
                        className="relative h-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-105"
                        style={{
                          borderColor: coverUrl === img && !hasVideo ? "white" : "transparent",
                          boxShadow: coverUrl === img && !hasVideo ? "0 0 0 2px rgba(255,255,255,0.2)" : "none",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                        {coverUrl === img && !hasVideo && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Custom URL */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="Custom image URL…"
                      className="flex-1 rounded-lg border border-dashboard-border/60 bg-white/4 px-3 py-1.5 text-xs text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => { if (customUrlInput.trim()) { setCoverUrl(customUrlInput.trim()); setVideoUrl(""); setVideoInput(""); setCustomUrlInput(""); } }}
                      disabled={!customUrlInput.trim()}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all disabled:opacity-30"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      Use
                    </button>
                  </div>
                </div>

                {/* Video */}
                <div>
                  <SectionLabel>
                    Video embed
                    {hasVideo && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  </SectionLabel>
                  <p className="text-[11px] text-dashboard-text-muted/70 mb-2 leading-relaxed">
                    YouTube or Vimeo. Replaces cover image at the top of your survey.
                  </p>
                  <input
                    type="text"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Paste YouTube or Vimeo URL…"
                    className="w-full rounded-xl border border-dashboard-border/60 bg-white/4 px-3 py-2 text-xs text-dashboard-text placeholder:text-dashboard-text-muted/35 focus:outline-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoUrl(videoInput.trim())}
                      disabled={!videoInput.trim()}
                      className="flex-1 rounded-lg py-2 text-xs font-bold transition-all disabled:opacity-30"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      Set video
                    </button>
                    {hasVideo && (
                      <button
                        type="button"
                        onClick={() => { setVideoUrl(""); setVideoInput(""); }}
                        className="rounded-lg px-3 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {videoInput && !getYouTubeId(videoInput) && !getVimeoId(videoInput) && videoInput.trim() && (
                    <p className="mt-2 text-[11px] text-amber-400">Could not detect a valid YouTube or Vimeo URL.</p>
                  )}
                  {(getYouTubeId(videoInput) || getVimeoId(videoInput)) && (
                    <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      Video detected
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ BOTTOM ERROR BAR ══════════ */}
      {questions.length === 0 && !error && (
        <div className="border-t border-dashboard-border/40 px-5 py-3 flex items-center gap-2" style={{ background: "rgba(0,0,0,0.1)" }}>
          <span className="text-xs text-dashboard-text-muted">Add at least one question to save this survey.</span>
        </div>
      )}
    </div>
  );
}
