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
    <div className="w-full min-w-0 max-w-6xl mx-auto overflow-x-hidden">
      <div className="grid grid-cols-1 gap-6 px-4 py-6">
        <header className="dashboard-fade-in min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Notes</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Ministry and sermon notes. Paste or type, cite Scripture with the Bible panel, then generate survey questions with AI.
          </p>
        </header>

        <section className="dashboard-fade-in rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-dashboard-text">Your notes</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg border border-dashboard-border bg-dashboard-card-hover/50 px-3 py-2">
                <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-sm text-dashboard-text-muted">
                  <span className="font-semibold text-dashboard-text">{credits.remaining}</span>/{credits.cap} AI credits
                </span>
              </div>
              <Link
                href="/dashboard/notes/new"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
              >
                <Plus className="h-4 w-4" />
                New note
              </Link>
            </div>
          </div>

          {notes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => {
                const preview = stripHtml(note.content).slice(0, 140);
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
                    className="group flex flex-col rounded-xl border-2 border-dashboard-border bg-dashboard-card-hover/20 p-4 transition-all hover:border-emerald-500/40 hover:bg-dashboard-card-hover/30"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="rounded-lg bg-emerald-500/10 p-2">
                        <BookOpen className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-dashboard-text-muted">
                        <Clock className="h-3.5 w-3.5" />
                        {relDate}
                      </div>
                    </div>
                    <h3 className="font-semibold text-dashboard-text transition-colors group-hover:text-emerald-500 dark:group-hover:text-emerald-400 line-clamp-1">
                      {note.title || "Untitled"}
                    </h3>
                    {preview && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-dashboard-text-muted line-clamp-3">
                        {preview}{note.content.length > 140 ? "…" : ""}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-dashboard-border pt-3">
                      <span className="text-xs text-dashboard-text-muted">{words.toLocaleString()} words</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                        Open →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-dashboard-border bg-dashboard-card-hover/20 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-emerald-500/10 p-5">
                <BookOpen className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-dashboard-text">No notes yet</h3>
              <p className="mt-2 max-w-sm text-sm text-dashboard-text-muted">
                Create a note to paste your sermon or ministry content, cite verses with the Bible panel, then generate survey questions with AI.
              </p>
              <Link
                href="/dashboard/notes/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
                Create first note
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
