"use client";

import { useState } from "react";
import {
  Plus, Trash2, Loader2, AlignLeft, Circle, ToggleLeft, Type,
  Image as ImageIcon, Video as VideoIcon, X,
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
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: QuestionType; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: "short_answer",    label: "Short answer", icon: <Type className="h-3.5 w-3.5" />,       hint: "One line of text" },
  { value: "multiple_choice", label: "Pick one",     icon: <Circle className="h-3.5 w-3.5" />,      hint: "Select one option" },
  { value: "yes_no",          label: "Yes / No",     icon: <ToggleLeft className="h-3.5 w-3.5" />,  hint: "Quick yes/no" },
  { value: "paragraph",       label: "Paragraph",    icon: <AlignLeft className="h-3.5 w-3.5" />,   hint: "Long text" },
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

// ── Types ─────────────────────────────────────────────────────────────────────

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

  // Cover / media state
  const [coverUrl, setCoverUrl] = useState<string>(initialCoverUrl ?? COVER_IMAGES[0]);
  const [accentColor, setAccentColor] = useState(initialTheme.accent_color ?? "#8b5cf6");
  const [videoUrl, setVideoUrl] = useState(initialTheme.video_url ?? "");

  // Panel state
  const [mediaPanel, setMediaPanel] = useState<"closed" | "image" | "video">("closed");
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [videoInput, setVideoInput] = useState(initialTheme.video_url ?? "");

  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;
  const vimeoId = videoUrl ? getVimeoId(videoUrl) : null;
  const hasVideo = !!(ytId || vimeoId);

  // ── Question helpers ──────────────────────────────────────────────────────

  const addQuestion = () => {
    const next: QuestionRow = { text: "", type: "short_answer" };
    const newIdx = questions.length;
    setQuestions((prev) => [...prev, next]);
    setActiveQ(newIdx);
  };

  const removeQuestion = (i: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
    setActiveQ(questions.length > 1 ? Math.max(0, i - 1) : null);
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
      next[qIdx] = {
        ...next[qIdx],
        options: (next[qIdx].options ?? []).filter((_, i) => i !== optIdx),
      };
      return next;
    });
  };

  const activeQuestion = activeQ !== null ? questions[activeQ] : null;

  const handleSave = () => {
    onSave({
      title,
      description,
      questions,
      cover_image_url: hasVideo ? null : coverUrl,
      theme: { accent_color: accentColor, video_url: videoUrl || undefined },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-dashboard-border shadow-xl" style={{ background: "hsl(var(--dashboard-card))" }}>

      {/* ─────────── COVER HERO ─────────── */}
      <div className="relative" style={{ height: 240 }}>
        {hasVideo ? (
          <div className="absolute inset-0 bg-black">
            {ytId && (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=0&modestbranding=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Survey cover video"
              />
            )}
            {vimeoId && (
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Survey cover video"
              />
            )}
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.08) 100%)" }}
        />

        {/* Accent strip at very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: accentColor }} />

        {/* Title + description overlaid on cover */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Survey title…"
            className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-white/35 focus:outline-none"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description for respondents (optional)"
            className="mt-1 w-full bg-transparent text-sm text-white/65 placeholder:text-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* ─────────── TOOLBAR ─────────── */}
      <div
        className="flex items-center gap-1 px-3 py-2 border-b border-dashboard-border/50"
        style={{ background: "rgba(0,0,0,0.25)" }}
      >
        {/* Image button */}
        <button
          type="button"
          onClick={() => { setMediaPanel(mediaPanel === "image" ? "closed" : "image"); setColorPanelOpen(false); }}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            mediaPanel === "image" ? "bg-white/12 text-white" : "text-dashboard-text-muted hover:text-dashboard-text hover:bg-white/6",
          ].join(" ")}
        >
          <ImageIcon className="h-3.5 w-3.5" /> Cover image
        </button>

        {/* Video button */}
        <button
          type="button"
          onClick={() => { setMediaPanel(mediaPanel === "video" ? "closed" : "video"); setColorPanelOpen(false); }}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            mediaPanel === "video" ? "bg-white/12 text-white" : "text-dashboard-text-muted hover:text-dashboard-text hover:bg-white/6",
          ].join(" ")}
        >
          <VideoIcon className="h-3.5 w-3.5" />
          {hasVideo ? "Change video" : "Add video"}
          {hasVideo && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
        </button>

        {/* Color button */}
        <button
          type="button"
          onClick={() => { setColorPanelOpen(!colorPanelOpen); setMediaPanel("closed"); }}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-dashboard-text-muted hover:text-dashboard-text hover:bg-white/6 transition-all"
        >
          <span className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0" style={{ background: accentColor }} />
          Accent
        </button>

        <div className="flex-1" />

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || questions.length === 0}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all disabled:opacity-40 hover:opacity-90"
          style={{ background: accentColor }}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saveLabel}
        </button>
      </div>

      {/* ─────────── MEDIA PANEL: Image ─────────── */}
      {mediaPanel === "image" && (
        <div
          className="border-b border-dashboard-border/50 p-4 space-y-3"
          style={{ background: "rgba(0,0,0,0.18)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
            Choose a cover image
          </p>
          <div className="grid grid-cols-6 gap-2">
            {COVER_IMAGES.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setCoverUrl(img); setVideoUrl(""); setVideoInput(""); setMediaPanel("closed"); }}
                className={[
                  "relative h-14 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                  coverUrl === img && !hasVideo
                    ? "border-white scale-105 shadow-lg"
                    : "border-transparent hover:border-white/30",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="Or paste a custom image URL…"
              className="flex-1 rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-1.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:outline-none focus:border-dashboard-border"
            />
            <button
              type="button"
              onClick={() => {
                if (customUrlInput.trim()) {
                  setCoverUrl(customUrlInput.trim());
                  setVideoUrl("");
                  setVideoInput("");
                  setCustomUrlInput("");
                  setMediaPanel("closed");
                }
              }}
              disabled={!customUrlInput.trim()}
              className="rounded-lg bg-white/8 px-3 py-1.5 text-sm font-medium text-dashboard-text disabled:opacity-40 hover:bg-white/14 transition-colors"
            >
              Use
            </button>
          </div>
        </div>
      )}

      {/* ─────────── MEDIA PANEL: Video ─────────── */}
      {mediaPanel === "video" && (
        <div
          className="border-b border-dashboard-border/50 p-4 space-y-3"
          style={{ background: "rgba(0,0,0,0.18)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
            Embed a video
          </p>
          <p className="text-xs text-dashboard-text-muted">
            Paste a YouTube or Vimeo link. It appears at the top of your survey for respondents too.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=… or Vimeo URL"
              className="flex-1 rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-1.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/40 focus:outline-none focus:border-dashboard-border"
            />
            <button
              type="button"
              onClick={() => { setVideoUrl(videoInput.trim()); setMediaPanel("closed"); }}
              disabled={!videoInput.trim()}
              className="rounded-lg bg-white/8 px-3 py-1.5 text-sm font-medium text-dashboard-text disabled:opacity-40 hover:bg-white/14 transition-colors"
            >
              Set
            </button>
            {hasVideo && (
              <button
                type="button"
                onClick={() => { setVideoUrl(""); setVideoInput(""); setMediaPanel("closed"); }}
                className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          {videoInput && !getYouTubeId(videoInput) && !getVimeoId(videoInput) && videoInput.trim() && (
            <p className="text-xs text-amber-400">Could not detect a valid YouTube or Vimeo URL.</p>
          )}
          {(getYouTubeId(videoInput) || getVimeoId(videoInput)) && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Video detected — it will show above your survey for respondents.
            </p>
          )}
        </div>
      )}

      {/* ─────────── COLOR PANEL ─────────── */}
      {colorPanelOpen && (
        <div
          className="flex items-center gap-3 border-b border-dashboard-border/50 px-4 py-3"
          style={{ background: "rgba(0,0,0,0.18)" }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
            Accent color
          </span>
          <div className="flex items-center gap-2.5">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                onClick={() => { setAccentColor(c.value); setColorPanelOpen(false); }}
                className="h-6 w-6 rounded-full border-2 transition-all hover:scale-125"
                style={{
                  background: c.value,
                  borderColor: accentColor === c.value ? "white" : "transparent",
                  boxShadow: accentColor === c.value ? `0 0 0 3px ${c.value}40` : undefined,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─────────── TWO-PANEL BUILDER ─────────── */}
      <div className="flex flex-col sm:flex-row" style={{ minHeight: 440 }}>

        {/* Left: question list */}
        <div
          className="w-full sm:w-56 shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-dashboard-border/50"
          style={{ background: "rgba(0,0,0,0.14)" }}
        >
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
              Questions
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {questions.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-dashboard-text-muted/50">
                No questions yet
              </p>
            )}
            {questions.map((q, i) => {
              const typeMeta = TYPE_OPTIONS.find((t) => t.value === q.type);
              const isActive = activeQ === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveQ(i)}
                  className="group w-full flex items-start gap-2 px-3 py-2.5 text-left transition-all border-l-2"
                  style={
                    isActive
                      ? { borderLeftColor: accentColor, background: `${accentColor}10` }
                      : { borderLeftColor: "transparent" }
                  }
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold tabular-nums transition-colors"
                    style={
                      isActive
                        ? { background: `${accentColor}25`, color: accentColor }
                        : { background: "rgba(255,255,255,0.06)", color: "#8891a5" }
                    }
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium leading-tight line-clamp-2 transition-colors"
                      style={{ color: isActive ? "#eef0f6" : "#8891a5" }}
                    >
                      {q.text || <span className="opacity-40 italic">Untitled</span>}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] opacity-40" style={{ color: "#8891a5" }}>
                      {typeMeta?.icon}
                      {typeMeta?.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add question */}
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center justify-center gap-1.5 border-t border-dashboard-border/50 py-3 text-xs font-medium text-dashboard-text-muted hover:text-dashboard-text hover:bg-white/4 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
        </div>

        {/* Right: active question editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeQ === null || !activeQuestion ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-2xl p-5" style={{ background: `${accentColor}12` }}>
                <ImageIcon className="h-9 w-9" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-dashboard-text">Start adding questions</p>
                <p className="mt-1 text-xs text-dashboard-text-muted max-w-xs">
                  Click &ldquo;Add question&rdquo; on the left to build your survey. Each question gets its own editor here.
                </p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: accentColor }}
              >
                <Plus className="h-4 w-4" /> Add first question
              </button>
            </div>
          ) : (
            <div className="space-y-6 max-w-xl">

              {/* Header row */}
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: `${accentColor}15`, color: accentColor }}
                >
                  Question {(activeQ ?? 0) + 1} of {questions.length}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(activeQ!)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-dashboard-text-muted/50 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>

              {/* Question text */}
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
                  Question text
                </label>
                <textarea
                  value={activeQuestion.text}
                  onChange={(e) => updateQuestion(activeQ!, { text: e.target.value })}
                  placeholder="Type your question here…"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-dashboard-border bg-dashboard-card-hover px-4 py-3 text-base font-medium text-dashboard-text placeholder:text-dashboard-text-muted/35 focus:outline-none transition-colors"
                  onFocus={(e) => { e.target.style.borderColor = `${accentColor}50`; }}
                  onBlur={(e) => { e.target.style.borderColor = ""; }}
                />
              </div>

              {/* Answer type */}
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
                  Answer type
                </label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((t) => {
                    const sel = activeQuestion.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() =>
                          updateQuestion(activeQ!, {
                            type: t.value,
                            options:
                              t.value === "multiple_choice"
                                ? activeQuestion.options?.length
                                  ? activeQuestion.options
                                  : ["", ""]
                                : undefined,
                          })
                        }
                        className={[
                          "flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                          sel
                            ? "border-transparent text-white shadow-sm"
                            : "border-dashboard-border bg-dashboard-card-hover text-dashboard-text-muted hover:text-dashboard-text",
                        ].join(" ")}
                        style={sel ? { background: accentColor } : {}}
                      >
                        {t.icon} {t.label}
                        {sel && <span className="ml-1 text-white/60 text-xs">·</span>}
                        {sel && <span className="text-white/70 text-xs">{t.hint}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Answer preview */}
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
                  Preview
                </label>

                {activeQuestion.type === "multiple_choice" && (
                  <div className="space-y-2.5">
                    {(activeQuestion.options ?? []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 shrink-0 rounded-full border-2"
                          style={{ borderColor: `${accentColor}60` }}
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => setOption(activeQ!, oi, e.target.value)}
                          placeholder={`Choice ${oi + 1}`}
                          className="flex-1 border-b border-dashboard-border/40 bg-transparent pb-1 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/35 focus:outline-none transition-colors"
                          onFocus={(e) => { e.target.style.borderColor = `${accentColor}50`; }}
                          onBlur={(e) => { e.target.style.borderColor = ""; }}
                        />
                        {(activeQuestion.options ?? []).length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(activeQ!, oi)}
                            className="shrink-0 text-dashboard-text-muted/35 hover:text-rose-400 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(activeQ!)}
                      className="mt-1 flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                      style={{ color: accentColor }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add another choice
                    </button>
                  </div>
                )}

                {activeQuestion.type === "yes_no" && (
                  <div className="flex gap-3">
                    <div
                      className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium text-dashboard-text"
                      style={{ borderColor: `${accentColor}35`, background: `${accentColor}0a` }}
                    >
                      <span>👍</span> Yes
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card-hover px-5 py-2.5 text-sm font-medium text-dashboard-text-muted">
                      <span>👎</span> No
                    </div>
                  </div>
                )}

                {activeQuestion.type === "short_answer" && (
                  <div
                    className="h-10 rounded-xl border border-dashed px-4 flex items-center"
                    style={{ borderColor: `${accentColor}25` }}
                  >
                    <span className="text-sm text-dashboard-text-muted/35">Short answer text…</span>
                  </div>
                )}

                {activeQuestion.type === "paragraph" && (
                  <div
                    className="h-24 rounded-xl border border-dashed px-4 py-3 flex items-start"
                    style={{ borderColor: `${accentColor}25` }}
                  >
                    <span className="text-sm text-dashboard-text-muted/35">Long answer text…</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────── BOTTOM BAR (errors / hints) ─────────── */}
      {(error || questions.length === 0) && (
        <div
          className="border-t border-dashboard-border/50 px-6 py-3 flex items-center gap-3"
          style={{ background: "rgba(0,0,0,0.12)" }}
        >
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {questions.length === 0 && !error && (
            <p className="text-sm text-dashboard-text-muted">Add at least one question to save this survey.</p>
          )}
        </div>
      )}
    </div>
  );
}
