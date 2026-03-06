import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getRemainingCredits } from "@/lib/ai-credits";
import { Plus, BookOpen, Sparkles, Clock } from "lucide-react";

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
    <div className="space-y-6 p-3 sm:p-5">
      {/* Header */}
      <div className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Notes</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Ministry and sermon notes. Paste or type, then generate survey questions with AI.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-dashboard-border bg-dashboard-card px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-dashboard-text-muted">
              <span className="font-semibold text-dashboard-text">{credits.remaining}</span>/{credits.cap} AI credits
            </span>
          </div>
          <Link
            href="/dashboard/notes/new"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New note
          </Link>
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="dashboard-fade-in-delay-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const preview = stripHtml(note.content).slice(0, 130);
            const words = countWords(note.content);
            const updated = new Date(note.updated_at);
            const diffDays = Math.floor((Date.now() - updated.getTime()) / 86400000);
            const relDate =
              diffDays === 0 ? "Today"
              : diffDays === 1 ? "Yesterday"
              : diffDays < 7 ? `${diffDays}d ago`
              : updated.toLocaleDateString(undefined, { month: "short", day: "numeric" });

            return (
              <Link
                key={note.id}
                href={`/dashboard/notes/${note.id}`}
                className="group flex flex-col rounded-2xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-md"
              >
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <div className="rounded-lg bg-emerald-500/10 p-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-dashboard-text-muted">
                    <Clock className="h-3 w-3" />
                    {relDate}
                  </div>
                </div>
                <h3 className="font-semibold text-dashboard-text transition-colors group-hover:text-emerald-400 line-clamp-1">
                  {note.title || "Untitled"}
                </h3>
                {preview && (
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-dashboard-text-muted line-clamp-3">
                    {preview}{note.content.length > 130 ? "…" : ""}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-dashboard-border pt-3">
                  <span className="text-xs text-dashboard-text-muted">{words.toLocaleString()} words</span>
                  <span className="text-xs font-medium text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Open →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-fade-in-delay-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card/50 py-16 text-center">
          <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4">
            <BookOpen className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-dashboard-text">No notes yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-dashboard-text-muted">
            Create a note to paste your sermon or ministry content, then generate survey questions from it with AI.
          </p>
          <Link
            href="/dashboard/notes/new"
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Create first note
          </Link>
        </div>
      )}
    </div>
  );
}
