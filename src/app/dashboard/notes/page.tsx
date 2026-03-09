import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getRemainingCredits } from "@/lib/ai-credits";
import { Plus, BookOpen, Sparkles, Clock, FileText } from "lucide-react";

type NoteRow = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

// Extract first image URL from HTML content
function extractFirstImage(html: string): string | null {
  const match = html.match(/src="([^"]+)"/);
  return match ? match[1] : null;
}

// Curated cover images for notes (deterministic by index)
const NOTE_COVER_IMAGES = [
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",  // open Bible/book
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",  // sunrise mountain
  "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80",  // forest light
  "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&q=80",  // ocean horizon
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80",  // sunrise over valley
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",  // mountain lake
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",  // river through forest
  "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80",  // coffee & notebook
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",  // writing desk
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",  // light through window
  "https://images.unsplash.com/photo-1548407260-da850faa41e3?w=800&q=80",  // church interior
  "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80",  // cross silhouette
];

// Gradient accents for note cards
const NOTE_GRADIENTS = [
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #3b82f6, #6366f1)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #84cc16, #10b981)",
];

function getNoteAccentColor(id: string): string {
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#84cc16", "#ef4444"];
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

export default async function NotesPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const [{ data: notesData }, credits] = await Promise.all([
    supabase
      .from("pastor_notes")
      .select("id, title, content, created_at, updated_at")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false }),
    getRemainingCredits(orgId),
  ]);

  const notes = (notesData ?? []) as NoteRow[];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto overflow-x-hidden">
      <div className="px-4 py-6 space-y-6">

        {/* Header */}
        <header className="dashboard-fade-in flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-dashboard-text">Notes</h1>
              {notes.length > 0 && (
                <span className="rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold px-2.5 py-0.5">
                  {notes.length}
                </span>
              )}
            </div>
            <p className="text-sm text-dashboard-text-muted">
              Ministry &amp; sermon notes. Cite Scripture with the Bible panel, then generate survey questions with AI.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* AI credits badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-dashboard-text-muted">
                <span className="font-bold text-dashboard-text">{credits.remaining}</span>/{credits.cap} AI
              </span>
            </div>
            <Link
              href="/dashboard/notes/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[.98]"
            >
              <Plus className="h-4 w-4" />
              New Note
            </Link>
          </div>
        </header>

        {notes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center dashboard-fade-in-delay-1">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <BookOpen className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="text-base font-semibold text-dashboard-text mb-1">No notes yet</p>
            <p className="text-sm text-dashboard-text-muted mb-6 max-w-sm">
              Create a note to paste your sermon or ministry content, cite verses with the Bible panel, then generate survey questions with AI.
            </p>
            <Link
              href="/dashboard/notes/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <Plus className="h-4 w-4" />
              Create first note
            </Link>
          </div>
        ) : (
          /* Gallery grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 dashboard-fade-in-delay-1">
            {notes.map((note, idx) => {
              const preview = stripHtml(note.content).slice(0, 120);
              const words = countWords(note.content);
              const updated = new Date(note.updated_at);
              const diffDays = Math.floor((Date.now() - updated.getTime()) / 86400000);
              const relDate =
                diffDays === 0 ? "Today"
                : diffDays === 1 ? "Yesterday"
                : diffDays < 7 ? `${diffDays}d ago`
                : updated.toLocaleDateString(undefined, { month: "short", day: "numeric" });

              const coverImg = extractFirstImage(note.content) ?? NOTE_COVER_IMAGES[idx % NOTE_COVER_IMAGES.length];
              const accentColor = getNoteAccentColor(note.id);
              const gradient = NOTE_GRADIENTS[idx % NOTE_GRADIENTS.length];

              return (
                <Link
                  key={note.id}
                  href={`/dashboard/notes/${note.id}`}
                  className="goal-card goal-card-enter group relative flex flex-col rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  style={{ border: "1.5px solid rgba(255,255,255,0.07)" }}
                >
                  {/* Cover image */}
                  <div className="relative h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImg}
                      alt=""
                      className="goal-card-img w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.05) 100%)" }}
                    />
                    {/* Word count top-left */}
                    <div className="absolute top-3 left-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
                        style={{ background: accentColor + "25", color: accentColor, border: `1px solid ${accentColor}40` }}
                      >
                        <FileText className="h-2.5 w-2.5" />
                        {words.toLocaleString()} words
                      </span>
                    </div>
                    {/* Date top-right */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-black/40 text-white/80 backdrop-blur-sm">
                        <Clock className="h-2.5 w-2.5" />
                        {relDate}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="flex flex-col flex-1 p-4 gap-2"
                    style={{ background: "hsl(var(--dashboard-card))" }}
                  >
                    <h3 className="text-sm font-bold text-dashboard-text leading-snug line-clamp-1 group-hover:text-white transition-colors">
                      {note.title || "Untitled"}
                    </h3>
                    {preview && (
                      <p className="text-xs text-dashboard-text-muted leading-relaxed line-clamp-3 flex-1">
                        {preview}{note.content.length > 120 ? "…" : ""}
                      </p>
                    )}
                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                      <div
                        className="h-1 flex-1 rounded-full mr-3 overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, (words / 500) * 100)}%`,
                            background: gradient,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                        style={{ color: accentColor }}
                      >
                        Open →
                      </span>
                    </div>
                  </div>

                  {/* Hover accent ring */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 1.5px ${accentColor}50` }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
