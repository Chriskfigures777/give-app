"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Bold, Italic, List, ListOrdered, Quote,
  Minus, Undo2, Redo2, Sparkles, Loader2, X, ChevronDown,
  Check, Trash2, Mic, MicOff, BookOpen, FileText, Image as ImageIcon,
  Video, LayoutTemplate,
} from "lucide-react";
import type { SurveyQuestion } from "@/app/api/ai/generate-survey-questions/route";
import { BiblePanel } from "@/app/dashboard/notes/bible-panel";
import { PexelsMediaPicker } from "@/components/pexels-media-picker";

type Props = {
  noteId: string | null;
  initialTitle: string;
  initialContent: string;
  initialCoverUrl?: string | null;
  initialCoverType?: "image" | "video" | null;
  creditsRemaining: number;
  creditsCap: number;
};

export function NoteEditorClient({
  noteId,
  initialTitle,
  initialContent,
  initialCoverUrl,
  initialCoverType,
  creditsRemaining,
  creditsCap,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [localCreditsRemaining, setLocalCreditsRemaining] = useState(creditsRemaining);
  const [questionCount, setQuestionCount] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("ai_question_count") ?? "5", 10) || 5; } catch { return 5; }
  });
  const [savedNoteId, setSavedNoteId] = useState<string | null>(noteId);
  const [deleting, setDeleting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [bibleOpen, setBibleOpen] = useState(false);
  const [pexelsOpen, setPexelsOpen] = useState(false);
  const [surveyConfigOpen, setSurveyConfigOpen] = useState(false);
  const surveyConfigRef = useRef<HTMLDivElement>(null);
  const [questionTypes, setQuestionTypes] = useState<{
    multiple_choice: boolean;
    yes_no: boolean;
    short_answer: boolean;
    long_answer: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("ai_question_types");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    // Default: short answer + long answer primary, yes/no + multiple choice included
    return { multiple_choice: true, yes_no: true, short_answer: true, long_answer: true };
  });

  // Cover state — null means no cover (text-only header)
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl ?? null);
  const [coverType, setCoverType] = useState<"image" | "video" | null>(initialCoverType ?? null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      try { recognitionRef.current?.abort?.(); } catch { /* ignore */ }
      try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (surveyConfigRef.current && !surveyConfigRef.current.contains(e.target as Node)) {
        setSurveyConfigOpen(false);
      }
    }
    if (surveyConfigOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [surveyConfigOpen]);


  const FONTS: { label: string; value: string }[] = [
    { label: "Barlow", value: "var(--font-barlow), sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Courier New", value: "'Courier New', monospace" },
  ];

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Placeholder.configure({ placeholder: "Paste or type your notes here…" }),
      CharacterCount,
    ],
    content: initialContent || "",
    editorProps: { attributes: { class: "tiptap-doc-content" } },
  });

  const editorRef = useRef(editor);
  useEffect(() => { editorRef.current = editor; }, [editor]);
  const wordCount = editor?.storage.characterCount.words() ?? 0;

  const saveNote = useCallback(async (overrideCover?: { url: string | null; type: "image" | "video" | null }): Promise<string | null> => {
    if (!editor) return null;
    setSaving(true);
    setSaveStatus("idle");
    const effectiveCoverUrl = overrideCover !== undefined ? overrideCover.url : coverUrl;
    const effectiveCoverType = overrideCover !== undefined ? overrideCover.type : coverType;
    try {
      const html = editor.getHTML();
      const body: Record<string, unknown> = {
        title: title.trim() || "Untitled",
        content: html,
      };
      if (effectiveCoverUrl) {
        body.cover_url = effectiveCoverUrl;
        body.cover_type = effectiveCoverType;
      } else if (overrideCover !== undefined) {
        body.cover_url = null;
        body.cover_type = null;
      }
      if (savedNoteId) {
        const res = await fetch(`/api/pastor-notes/${savedNoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to save");
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
        return savedNoteId;
      } else {
        const res = await fetch("/api/pastor-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create");
        const data = await res.json();
        const newId = (data as { id: string }).id;
        setSavedNoteId(newId);
        router.replace(`/dashboard/notes/${newId}`);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
        return newId;
      }
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return null;
    } finally {
      setSaving(false);
    }
  }, [editor, title, savedNoteId, router, coverUrl, coverType]);

  const handlePexelsSelect = useCallback((url: string, type: "image" | "video") => {
    setCoverUrl(url);
    setCoverType(type);
    setPexelsOpen(false);
    // Auto-save the new cover
    saveNote({ url, type });
  }, [saveNote]);

  const handleRemoveCover = useCallback(() => {
    setCoverUrl(null);
    setCoverType(null);
    saveNote({ url: null, type: null });
  }, [saveNote]);

  const handleGenerate = async () => {
    if (!editor) return;
    setGenError(null);
    setGenerating(true);
    setSurveyConfigOpen(false);
    try {
      const id = await saveNote();
      if (!id) throw new Error("Save failed — cannot generate");
      const plainText = editor.getText();

      // Build enabled question types list
      const enabledTypes = Object.entries(questionTypes)
        .filter(([, enabled]) => enabled)
        .map(([type]) => type);
      if (enabledTypes.length === 0) throw new Error("Select at least one question type.");

      // Step 1: Generate questions from AI
      const genRes = await fetch("/api/ai/generate-survey-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: plainText,
          count: questionCount,
          noteId: id,
          noteTitle: title.trim() || "Untitled",
          questionTypes: enabledTypes,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) {
        if (genRes.status === 402) throw new Error("No AI credits left. Buy more credits in Plan & Billing.");
        throw new Error((genData as { error?: string }).error ?? "Failed to generate");
      }
      const questions = (genData as { questions?: SurveyQuestion[] }).questions ?? [];
      if (questions.length === 0) throw new Error("AI returned no questions — please try again.");
      setLocalCreditsRemaining((c) => Math.max(0, c - 1));

      // Step 2: Immediately create the survey with those questions
      const surveyRes = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled survey",
          description: null,
          questions: questions.map((q, i) => ({
            id: q.id ?? `q-${i}`,
            text: q.text,
            type: q.type,
            options: q.options,
          })),
        }),
      });
      const surveyData = await surveyRes.json();
      if (!surveyRes.ok) throw new Error((surveyData as { error?: string }).error ?? "Failed to create survey");

      // Step 3: Navigate straight to the new survey
      router.push(`/dashboard/surveys/${(surveyData as { id: string }).id}`);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!savedNoteId || !confirm("Delete this note? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/pastor-notes/${savedNoteId}`, { method: "DELETE" });
      router.push("/dashboard/notes");
    } catch { setDeleting(false); }
  };

  const toggleDictation = useCallback(() => {
    const SR =
      (typeof window !== "undefined" && (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition) ||
      (typeof window !== "undefined" && (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition);

    if (!SR) {
      alert("Voice dictation is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListeningRef.current) {
      isListeningRef.current = false;
      try {
        recognitionRef.current?.abort?.();
      } catch {
        /* ignore */
      }
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
      setIsListening(false);
      setInterimText("");
      return;
    }

    if (!editor) return;
    editor.chain().focus().run();

    const onResult = (event: Event) => {
      const e = event as SpeechRecognitionEvent;
      const results = e.results;
      let interim = "";
      // Copy transcript strings immediately; results list is "live" and can change after the event.
      for (let i = e.resultIndex; i < results.length; i++) {
        const result = results[i];
        const first = result?.item?.(0) ?? (result as unknown as { [idx: number]: { transcript?: string } })?.[0];
        const transcript = (first?.transcript ?? "") as string;
        if (!transcript) continue;
        if (result.isFinal) {
          lastInterim = "";
          const t = transcript.trim();
          if (t) {
            const ed = editorRef.current;
            if (ed) {
              const toInsert = t + (t.endsWith(" ") ? "" : " ");
              ed.chain().focus().insertContent(toInsert).run();
            }
          }
        } else {
          interim += transcript;
          lastInterim = interim;
        }
      }
      setInterimText(interim);
    };

    let lastInterim = "";
    const onEnd = () => {
      if (lastInterim.trim()) {
        const ed = editorRef.current;
        if (ed) {
          const toInsert = lastInterim.trim() + (lastInterim.endsWith(" ") ? "" : " ");
          ed.chain().focus().insertContent(toInsert).run();
        }
      }
      lastInterim = "";
      setInterimText("");
      if (!isListeningRef.current) {
        setIsListening(false);
        return;
      }
      try {
        recognitionRef.current?.start?.();
      } catch {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    const onError = (event: Event) => {
      const e = event as SpeechRecognitionErrorEvent;
      if (e.error === "not-allowed") {
        isListeningRef.current = false;
        setIsListening(false);
        setInterimText("");
        alert("Microphone access was denied. Allow the microphone for this site and try again.");
      } else if (e.error === "network" || e.error === "service-not-allowed") {
        isListeningRef.current = false;
        setIsListening(false);
        setInterimText("");
        alert("Speech recognition needs an internet connection. Check your connection and try again.");
      }
    };

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-US";

    recognition.addEventListener("result", onResult);
    recognition.addEventListener("end", onEnd);
    recognition.addEventListener("error", onError);

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
      recognition.removeEventListener("result", onResult);
      recognition.removeEventListener("end", onEnd);
      recognition.removeEventListener("error", onError);
      alert("Could not start voice recognition. Try again or use Chrome/Edge.");
    }
  }, [editor]);

  // Toolbar icon button
  const TB = ({
    onClick, active, disabled, title: t, children,
  }: { onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={t}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
        active
          ? "bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/10"
          : "text-dashboard-text-muted hover:bg-white/8 hover:text-dashboard-text",
        disabled ? "cursor-not-allowed opacity-25" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );

  const Sep = () => <div className="mx-1 h-4 w-px bg-dashboard-border/60" />;

  return (
    <div className="-mx-6 -mt-6 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Top nav bar ── */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-2.5"
        style={{
          background: "hsl(var(--dashboard-card)/0.97)",
          backdropFilter: "blur(12px)",
          borderColor: "hsl(var(--dashboard-border))",
        }}
      >
        <Link
          href="/dashboard/notes"
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-dashboard-text-muted hover:bg-white/6 hover:text-dashboard-text transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Notes</span>
        </Link>

        <div className="h-4 w-px bg-dashboard-border/60" />

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none"
        />

        {/* Word count */}
        <span className="hidden md:flex items-center gap-1.5 shrink-0 rounded-lg border border-dashboard-border/50 bg-white/4 px-2.5 py-1 text-xs text-dashboard-text-muted">
          <FileText className="h-3 w-3" />
          {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
        </span>

        {/* Credits */}
        <span className="hidden lg:flex items-center gap-1.5 shrink-0 rounded-lg border border-dashboard-border/50 bg-white/4 px-2.5 py-1 text-xs text-dashboard-text-muted">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span className="font-semibold text-dashboard-text">{localCreditsRemaining}</span>/{creditsCap}
        </span>

        {/* Save status */}
        {saveStatus === "saved" && (
          <span className="hidden sm:flex shrink-0 items-center gap-1 text-xs text-emerald-400 font-medium">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="shrink-0 text-xs text-rose-400 font-medium">Save failed</span>
        )}

        {/* Delete */}
        {savedNoteId && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete note"
            className="shrink-0 rounded-lg p-1.5 text-dashboard-text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        {/* Save */}
        <button
          onClick={() => saveNote()}
          disabled={saving}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-dashboard-border/60 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-dashboard-text transition-all"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>

        {/* Generate — config button + popover */}
        <div ref={surveyConfigRef} className="shrink-0 relative">
          <button
            onClick={() => setSurveyConfigOpen((o) => !o)}
            disabled={saving || generating || localCreditsRemaining < 1}
            title={localCreditsRemaining < 1 ? "No AI credits remaining — buy more in Plan & Billing" : "Configure and create AI survey from this note"}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm shadow-emerald-500/20"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{generating ? "Creating survey…" : localCreditsRemaining < 1 ? "No credits" : "Create AI Survey"}</span>
            {!generating && localCreditsRemaining >= 1 && (
              <ChevronDown className={`h-3 w-3 transition-transform ${surveyConfigOpen ? "rotate-180" : ""}`} />
            )}
          </button>

          {/* Config dropdown */}
          {surveyConfigOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-2xl shadow-black/30 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-dashboard-border bg-emerald-500/8">
                <p className="text-xs font-bold text-dashboard-text uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> AI Survey Settings
                </p>
              </div>

              <div className="p-4 space-y-4">
                {/* Question count */}
                <div>
                  <p className="text-xs font-semibold text-dashboard-text-muted mb-2">Number of questions</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[3, 5, 6, 8, 10, 12, 15].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setQuestionCount(n);
                          try { localStorage.setItem("ai_question_count", String(n)); } catch { /* ignore */ }
                        }}
                        className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                          questionCount === n
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white/6 text-dashboard-text-muted hover:bg-white/12 hover:text-dashboard-text"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question types */}
                <div>
                  <p className="text-xs font-semibold text-dashboard-text-muted mb-2">Question types to include</p>
                  <div className="space-y-2">
                    {[
                      { key: "multiple_choice", label: "Multiple Choice", desc: "Pick one option" },
                      { key: "yes_no",          label: "Yes / No",        desc: "Quick thumbs up/down" },
                      { key: "short_answer",    label: "Short Answer",    desc: "One-line response" },
                      { key: "long_answer",     label: "Long Answer",     desc: "Paragraph response" },
                    ].map(({ key, label, desc }) => {
                      const enabled = questionTypes[key as keyof typeof questionTypes];
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            const updated = { ...questionTypes, [key]: !enabled };
                            setQuestionTypes(updated);
                            try { localStorage.setItem("ai_question_types", JSON.stringify(updated)); } catch { /* ignore */ }
                          }}
                          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all border ${
                            enabled
                              ? "bg-emerald-500/10 border-emerald-500/30 text-dashboard-text"
                              : "bg-white/3 border-dashboard-border/50 text-dashboard-text-muted hover:bg-white/6"
                          }`}
                        >
                          <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                            enabled ? "bg-emerald-600 border-emerald-500" : "border-dashboard-border/60"
                          }`}>
                            {enabled && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold leading-tight">{label}</p>
                            <p className="text-[10px] text-dashboard-text-muted leading-tight">{desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={saving || generating || !Object.values(questionTypes).some(Boolean)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-bold text-white transition-all shadow-sm shadow-emerald-500/20"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate {questionCount} Questions & Create Survey
                </button>
                <p className="text-center text-[10px] text-dashboard-text-muted">Uses 1 AI credit · {localCreditsRemaining} remaining</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Formatting toolbar ── */}
      {editor && (
        <div
          className="sticky top-[49px] z-10 flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5"
          style={{
            background: "hsl(var(--dashboard-card)/0.95)",
            backdropFilter: "blur(8px)",
            borderColor: "hsl(var(--dashboard-border)/0.6)",
          }}
        >
          {/* Font picker */}
          <select
            value={editor.getAttributes("textStyle").fontFamily ?? FONTS[0].value}
            onChange={(e) => {
              if (e.target.value === FONTS[0].value) {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(e.target.value).run();
              }
            }}
            className="h-8 rounded-lg bg-transparent px-2 text-xs text-dashboard-text-muted hover:bg-white/8 hover:text-dashboard-text focus:outline-none cursor-pointer border border-dashboard-border/40 transition-colors"
            style={{ fontFamily: editor.getAttributes("textStyle").fontFamily ?? FONTS[0].value }}
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value, background: "hsl(var(--dashboard-card))", color: "hsl(var(--dashboard-text))" }}>
                {f.label}
              </option>
            ))}
          </select>

          <Sep />
          <TB onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </TB>
          <TB onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </TB>
          <Sep />
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <span className="text-[11px] font-black">H1</span>
          </TB>
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <span className="text-[11px] font-black">H2</span>
          </TB>
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
            <span className="text-[11px] font-black">H3</span>
          </TB>
          <Sep />
          <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold className="h-4 w-4" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic className="h-4 w-4" />
          </TB>
          <Sep />
          <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List className="h-4 w-4" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
            <ListOrdered className="h-4 w-4" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <Quote className="h-4 w-4" />
          </TB>
          <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="h-4 w-4" />
          </TB>

          {/* Right-side actions */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Bible button */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setBibleOpen((o) => !o); }}
              title="Open Bible"
              className={[
                "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all",
                bibleOpen
                  ? "bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/10"
                  : "text-dashboard-text-muted hover:bg-white/8 hover:text-dashboard-text border border-dashboard-border/40",
              ].join(" ")}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bible</span>
            </button>

            {/* Dictation button - use onClick so browser gets a clear user gesture (required for SpeechRecognition.start()) */}
            <button
              type="button"
              onClick={() => toggleDictation()}
              title={isListening ? "Stop dictation" : "Start voice dictation"}
              className={[
                "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all",
                isListening
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                  : "text-dashboard-text-muted hover:bg-white/8 hover:text-dashboard-text border border-dashboard-border/40",
              ].join(" ")}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isListening ? "Stop" : "Dictate"}</span>
            </button>

            {interimText && (
              <span className="hidden md:inline max-w-[160px] truncate text-xs italic text-dashboard-text-muted/70 border border-dashboard-border/30 rounded-lg px-2 py-1">
                {interimText}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Document canvas (two columns when Bible open: notes left, Bible right) ── */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`overflow-y-auto ${bibleOpen ? "flex-1 min-w-0" : "flex-1"}`}
          style={{ background: "hsl(var(--dashboard-sidebar))" }}
        >
          <div className="mx-auto py-6 px-4" style={{ maxWidth: 860 }}>

            {/* ── Cover hero — only shown when a cover is set ── */}
            {coverUrl ? (
              <div
                className="relative rounded-2xl overflow-hidden mb-0 group/cover"
                style={{ height: 220 }}
              >
                {/* Video cover */}
                {coverType === "video" ? (
                  <video
                    ref={videoRef}
                    src={coverUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)" }}
                />

                {/* Title over image — inline editable */}
                <div className="absolute bottom-0 left-0 right-0 px-8 py-6">
                  <div className="flex items-end gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Note title"
                        className="block w-full bg-transparent text-2xl font-black text-white leading-tight placeholder:text-white/50 focus:outline-none drop-shadow-lg"
                      />
                    </div>
                    {/* Cover controls — shown on hover */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setPexelsOpen(true)}
                        title="Change cover"
                        className="flex items-center gap-1.5 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:text-white transition-all"
                      >
                        {coverType === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                        <span className="hidden sm:inline">Change</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        title="Remove cover"
                        className="flex items-center gap-1 rounded-lg bg-black/50 hover:bg-rose-500/30 backdrop-blur-sm border border-white/10 px-2 py-1.5 text-xs text-white/60 hover:text-rose-300 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Text-only header (no cover) ── */
              <div
                className="rounded-2xl mb-0 px-8 py-6 flex items-center justify-between gap-4"
                style={{
                  background: "hsl(var(--dashboard-card))",
                  border: "1px solid hsl(var(--dashboard-border))",
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note title"
                      className="block w-full bg-transparent text-xl font-black text-dashboard-text leading-tight placeholder:text-dashboard-text-muted/50 focus:outline-none"
                    />
                  </div>
                </div>
                {/* Add cover button */}
                <button
                  type="button"
                  onClick={() => setPexelsOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg border border-dashed border-dashboard-border/60 hover:border-emerald-500/40 bg-white/3 hover:bg-emerald-500/5 px-3 py-2 text-xs text-dashboard-text-muted hover:text-emerald-400 transition-all"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add cover</span>
                </button>
              </div>
            )}

            {/* ── Paper page ── */}
            <div
              className="rounded-b-2xl overflow-hidden"
              style={{
                background: "hsl(var(--dashboard-card))",
                border: "1px solid hsl(var(--dashboard-paper-border, var(--dashboard-border)))",
                borderTop: "none",
                minHeight: "calc(100vh - 380px)",
              }}
            >
              <EditorContent editor={editor} className="tiptap-doc" />
            </div>

            {/* Error banner (shown if survey creation fails) */}
            {genError && (
              <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 flex items-start gap-3">
                <p className="text-sm text-rose-400 flex-1">
                  {genError}
                  {genError.includes("credits") && (
                    <Link href="/dashboard/billing" className="ml-2 underline text-rose-300 hover:text-rose-200">
                      Go to Billing →
                    </Link>
                  )}
                </p>
                <button onClick={() => setGenError(null)} className="text-rose-400 hover:text-rose-300 shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Bottom breathing room */}
            <div className="h-16" />
          </div>
        </div>

        {/* ── Bible panel (side-by-side when open so pastor can view Bible and type notes) ── */}
        {bibleOpen && (
          <div className="flex-shrink-0 overflow-hidden border-l border-dashboard-border">
            <BiblePanel
              embedded
              onClose={() => setBibleOpen(false)}
              onInsert={(text) => {
              if (!editor) return;
              const escape = (s: string) =>
                s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
              const parts = text.split(/\n\n+/);
              const cited = parts.length > 1
                ? `<blockquote><p>${escape(parts[0].trim())}</p><p class="text-sm opacity-80">${escape(parts.slice(1).join(" ").trim())}</p></blockquote>`
                : `<blockquote><p>${escape(text.trim())}</p></blockquote>`;
              editor.chain().focus().insertContent(cited).run();
            }}
            />
          </div>
        )}
      </div>

      {/* ── Pexels picker modal ── */}
      {pexelsOpen && (
        <PexelsMediaPicker
          mode="both"
          onSelect={handlePexelsSelect}
          onClose={() => setPexelsOpen(false)}
        />
      )}
    </div>
  );
}
