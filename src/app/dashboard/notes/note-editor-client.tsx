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
  Minus, Undo2, Redo2, Sparkles, Loader2, X, ChevronRight,
  Check, Trash2, Mic, MicOff, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SurveyQuestion } from "@/app/api/ai/generate-survey-questions/route";
import { BiblePanel } from "@/app/dashboard/notes/bible-panel";

type Props = {
  noteId: string | null;
  initialTitle: string;
  initialContent: string;
  creditsRemaining: number;
  creditsCap: number;
};

export function NoteEditorClient({ noteId, initialTitle, initialContent, creditsRemaining, creditsCap }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<SurveyQuestion[] | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(noteId);
  const [deleting, setDeleting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [bibleOpen, setBibleOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const dictationPosRef = useRef<number>(0);
  // Ref used by speech callback to insert text (avoids stale closure / React batching issues)
  const insertDictationRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      try { recognitionRef.current?.abort?.(); } catch { /* ignore */ }
      try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
      recognitionRef.current = null;
    };
  }, []);

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
      Placeholder.configure({ placeholder: "Paste or type your sermon or ministry notes here…" }),
      CharacterCount,
    ],
    content: initialContent || "",
    editorProps: { attributes: { class: "tiptap-doc-content" } },
  });

  // Keep a ref so dictation callbacks always have the live editor (avoids stale closure)
  const editorRef = useRef(editor);
  useEffect(() => { editorRef.current = editor; }, [editor]);

  const wordCount = editor?.storage.characterCount.words() ?? 0;

  const saveNote = useCallback(async (): Promise<string | null> => {
    if (!editor) return null;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const html = editor.getHTML();
      const body = { title: title.trim() || "Untitled", content: html };
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
  }, [editor, title, savedNoteId, router]);

  const handleGenerate = async () => {
    if (!editor) return;
    setGenError(null);
    setGeneratedQuestions(null);
    setGenerating(true);
    try {
      const id = await saveNote();
      if (!id) throw new Error("Save failed — cannot generate");
      // Send plain text to AI (strips HTML markup, saves tokens, saves to Supabase as HTML)
      const plainText = editor.getText();
      const res = await fetch("/api/ai/generate-survey-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: plainText, count: 6 }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) throw new Error("No AI credits left this month. Upgrade or wait for next month.");
        throw new Error((data as { error?: string }).error ?? "Failed to generate");
      }
      const questions = (data as { questions?: SurveyQuestion[] }).questions ?? [];
      setGeneratedQuestions(questions);
      // Store in localStorage so the survey/new page can read them without calling AI again
      try { localStorage.setItem(`note_questions_${id}`, JSON.stringify(questions)); } catch { /* ignore */ }
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
    const SR = (typeof window !== "undefined" && (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition) ||
      (typeof window !== "undefined" && (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

    if (!SR) {
      alert("Voice dictation is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListeningRef.current) {
      isListeningRef.current = false;
      try { recognitionRef.current?.abort?.(); } catch { /* ignore */ }
      try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
      recognitionRef.current = null;
      setIsListening(false);
      setInterimText("");
      return;
    }

    if (!editor) return;
    editor.chain().focus().run();
    dictationPosRef.current = editor.state.selection.from;

    // Ref that the speech callback will call to insert text. Use queueMicrotask so we run
    // outside the speech API callback and get a fresh editor state. Update position from
    // editor after each insert so it stays correct (ProseMirror positions shift on insert).
    insertDictationRef.current = (text: string) => {
      const t = text.trim();
      if (!t) return;
      const toInsert = t + (t.endsWith(" ") ? "" : " ");
      const pos = dictationPosRef.current;
      queueMicrotask(() => {
        const ed = editorRef.current;
        if (!ed) return;
        // Insert as plain text (no HTML)
        ed.chain().insertContentAt(pos, toInsert, { updateSelection: true }).run();
        // Next chunk should go after this one; use actual selection so position is valid
        dictationPosRef.current = ed.state.selection.to;
      });
    };

    const onResult = (event: Event) => {
      const e = event as SpeechRecognitionEvent;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const alt = result?.length ? result.item?.(0) ?? result[0] : null;
        const transcript = (alt?.transcript ?? (result as unknown as { transcript?: string }).transcript ?? "") as string;
        if (!transcript) continue;
        if (result.isFinal) {
          if (process.env.NODE_ENV === "development") {
            console.log("[Dictation] final:", transcript);
          }
          insertDictationRef.current(transcript);
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
    };

    const onEnd = () => {
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

    const recognition = new (SR as new () => SpeechRecognition)();
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

    // Start on next tick so we're past the click and any permission UI
    const start = () => {
      try {
        recognition.start();
      } catch (err) {
        isListeningRef.current = false;
        setIsListening(false);
        recognition.removeEventListener("result", onResult);
        recognition.removeEventListener("end", onEnd);
        recognition.removeEventListener("error", onError);
        alert("Could not start voice recognition. Try again or use Chrome/Edge.");
      }
    };
    setTimeout(start, 0);
  }, [editor]);

  // Toolbar button
  const TB = ({
    onClick, active, disabled, title: t, children,
  }: { onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={t}
      className={[
        "flex h-9 w-9 items-center justify-center rounded transition-colors",
        active ? "bg-emerald-500/20 text-emerald-400" : "text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text",
        disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
  const Sep = () => <div className="mx-1.5 h-5 w-px bg-dashboard-border" />;

  // Horizontal ruler — tick marks every 12px, labels every inch (96px)
  const HRuler = () => {
    const ticks: { x: number; h: number; label: string | null }[] = [];
    for (let i = 0; i <= 2400; i += 12) {
      const isInch = i % 96 === 0;
      const isHalf = i % 48 === 0 && !isInch;
      ticks.push({ x: i, h: isInch ? 13 : isHalf ? 8 : 4, label: isInch && i > 0 ? String(i / 96) : null });
    }
    return (
      <div
        className="sticky top-0 z-[6] select-none overflow-hidden"
        style={{ height: 24, background: "hsl(var(--dashboard-card))", borderBottom: "1px solid hsl(var(--dashboard-border))", display: "flex" }}
      >
        {/* Corner square where rulers meet */}
        <div style={{ width: 24, flexShrink: 0, borderRight: "1px solid hsl(var(--dashboard-border))" }} />
        <svg width="100%" height="24" xmlns="http://www.w3.org/2000/svg" style={{ flex: 1 }}>
          {ticks.map((t) => (
            <g key={t.x}>
              <line x1={t.x} y1={24} x2={t.x} y2={24 - t.h} stroke="currentColor" strokeWidth={0.75} className="text-dashboard-text-muted" opacity={0.45} />
              {t.label && (
                <text x={t.x + 2} y={10} fill="currentColor" fontSize={8} className="text-dashboard-text-muted" opacity={0.5} fontFamily="ui-monospace, monospace">{t.label}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Vertical ruler — tick marks every 12px, labels every inch (96px)
  const VRuler = () => {
    const ticks: { y: number; h: number; label: string | null }[] = [];
    for (let i = 0; i <= 4000; i += 12) {
      const isInch = i % 96 === 0;
      const isHalf = i % 48 === 0 && !isInch;
      ticks.push({ y: i, h: isInch ? 13 : isHalf ? 8 : 4, label: isInch && i > 0 ? String(i / 96) : null });
    }
    return (
      <div
        className="sticky left-0 z-[5] shrink-0 select-none overflow-hidden self-stretch"
        style={{ width: 24, background: "hsl(var(--dashboard-card))", borderRight: "1px solid hsl(var(--dashboard-border))" }}
      >
        <svg width="24" height="4000" xmlns="http://www.w3.org/2000/svg">
          {ticks.map((t) => (
            <g key={t.y}>
              <line x1={24} y1={t.y} x2={24 - t.h} y2={t.y} stroke="currentColor" strokeWidth={0.75} className="text-dashboard-text-muted" opacity={0.45} />
              {t.label && (
                <text
                  x={12} y={t.y - 2}
                  fill="currentColor" fontSize={8} className="text-dashboard-text-muted" opacity={0.5}
                  fontFamily="ui-monospace, monospace" textAnchor="middle"
                  transform={`rotate(-90, 12, ${t.y - 2})`}
                >{t.label}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="-mx-6 -mt-6 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Header bar ── */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-dashboard-border bg-dashboard-card/95 backdrop-blur px-5 py-3">
        <Link
          href="/dashboard/notes"
          className="flex shrink-0 items-center gap-2 text-base text-dashboard-text-muted hover:text-dashboard-text transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Notes</span>
        </Link>
        <div className="mx-1 h-5 w-px bg-dashboard-border" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none"
        />
        {saveStatus === "saved" && (
          <span className="flex shrink-0 items-center gap-1.5 text-sm text-emerald-400">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        {saveStatus === "error" && <span className="shrink-0 text-sm text-rose-400">Save failed</span>}
        <span className="hidden lg:inline shrink-0 rounded-full bg-dashboard-card-hover px-3 py-1 text-sm text-dashboard-text-muted">
          {creditsRemaining}/{creditsCap} credits
        </span>
        {savedNoteId && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete note"
            className="shrink-0 rounded p-1.5 text-dashboard-text-muted hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
        <Button onClick={saveNote} disabled={saving} variant="secondary" size="sm" className="shrink-0 h-9 gap-2 text-sm px-4">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={saving || generating || creditsRemaining < 1}
          size="sm"
          className="shrink-0 h-9 gap-2 text-sm px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating…" : "Generate questions"}
        </Button>
      </div>

      {/* ── Formatting toolbar ── */}
      {editor && (
        <div className="sticky top-[57px] z-10 flex flex-wrap items-center gap-0.5 border-b border-dashboard-border bg-dashboard-card px-3 py-2">
          {/* Font family picker */}
          <select
            value={editor.getAttributes("textStyle").fontFamily ?? FONTS[0].value}
            onChange={(e) => {
              if (e.target.value === FONTS[0].value) {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(e.target.value).run();
              }
            }}
            className="h-9 rounded bg-transparent px-2 text-sm text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text focus:outline-none cursor-pointer border border-dashboard-border/50"
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
            <Undo2 className="h-5 w-5" />
          </TB>
          <TB onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="h-5 w-5" />
          </TB>
          <Sep />
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <span className="text-sm font-black">H1</span>
          </TB>
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <span className="text-sm font-black">H2</span>
          </TB>
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
            <span className="text-sm font-black">H3</span>
          </TB>
          <Sep />
          <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold className="h-5 w-5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic className="h-5 w-5" />
          </TB>
          <Sep />
          <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List className="h-5 w-5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
            <ListOrdered className="h-5 w-5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <Quote className="h-5 w-5" />
          </TB>
          <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="h-5 w-5" />
          </TB>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setBibleOpen((o) => !o); }}
              title="Open Bible"
              className={[
                "flex h-9 items-center gap-1.5 rounded px-2.5 text-sm font-medium transition-colors",
                bibleOpen
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text",
              ].join(" ")}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Bible</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); toggleDictation(); }}
              title={isListening ? "Stop dictation" : "Start voice dictation"}
              className={[
                "flex h-9 items-center gap-1.5 rounded px-2.5 text-sm font-medium transition-colors",
                isListening
                  ? "bg-rose-500/20 text-rose-400 animate-pulse"
                  : "text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text",
              ].join(" ")}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span className="hidden sm:inline">{isListening ? "Stop" : "Dictate"}</span>
            </button>
            {interimText && (
              <span className="hidden sm:inline max-w-[200px] truncate text-sm italic text-dashboard-text-muted">
                {interimText}
              </span>
            )}
            <span className="text-sm text-dashboard-text-muted">
              {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
            </span>
          </div>
        </div>
      )}

      {/* ── Document canvas — Google Docs / Word style ── */}
      <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ background: "hsl(var(--dashboard-sidebar))" }}>
        <HRuler />
        <div className="flex flex-1">
          <VRuler />
          <div className="flex-1 min-w-0">
        <div className="mx-auto px-6 py-8" style={{ maxWidth: 1000 }}>

          {/* Paper page — border like Google Docs, no shadow (darker border so paper is clearly visible) */}
          <div
            style={{
              background: "hsl(var(--dashboard-card))",
              minHeight: "calc(100vh - 180px)",
              border: "1px solid hsl(var(--dashboard-paper-border, var(--dashboard-border)))",
              borderRadius: 2,
            }}
          >
            <EditorContent editor={editor} className="tiptap-doc" />
          </div>

          {/* Generated questions panel */}
          {(generatedQuestions !== null || genError) && (
            <div className="mt-8 rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-xl ring-1 ring-emerald-500/10">
              <div className="flex items-center justify-between border-b border-dashboard-border bg-emerald-500/5 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-semibold text-dashboard-text">
                    {genError ? "Generation failed" : `${generatedQuestions?.length ?? 0} questions generated`}
                  </h3>
                </div>
                <button
                  onClick={() => { setGeneratedQuestions(null); setGenError(null); }}
                  className="rounded p-1 text-dashboard-text-muted hover:text-dashboard-text transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {genError ? (
                <p className="p-5 text-base text-rose-400">{genError}</p>
              ) : (
                <>
                  <ul className="divide-y divide-dashboard-border">
                    {generatedQuestions?.map((q, i) => (
                      <li key={i} className="px-5 py-4">
                        <p className="text-base font-medium text-dashboard-text">
                          <span className="mr-2 tabular-nums text-dashboard-text-muted">{i + 1}.</span>
                          {q.text}
                        </p>
                        {q.type === "multiple_choice" && q.options?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {q.options.map((opt) => (
                              <span key={opt} className="rounded-full bg-dashboard-card-hover px-3 py-1 text-sm text-dashboard-text-muted">
                                {opt}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-4 border-t border-dashboard-border bg-emerald-500/5 px-5 py-4">
                    <p className="text-sm text-dashboard-text-muted">No extra credit used when creating the survey from these.</p>
                    <Link href={`/dashboard/surveys/new?fromNote=${savedNoteId}`}>
                      <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        Create survey <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
      {/* ── Bible panel ── */}
      {bibleOpen && (
        <BiblePanel
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
      )}
      </div>
    </div>
  );
}
