import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getRemainingCredits } from "@/lib/ai-credits";
import { Plus, BookOpen, Sparkles } from "lucide-react";
import { NotesGalleryClient, type NoteCard } from "./notes-gallery-client";

export default async function NotesPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const [{ data: notesData }, credits] = await Promise.all([
    supabase
      .from("pastor_notes")
      .select("id, title, content, created_at, updated_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    getRemainingCredits(orgId),
  ]);

  const notes = (notesData ?? []) as NoteCard[];

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
              Ministry &amp; sermon notes. Add a cover image or video, cite Scripture, then turn your notes into AI survey questions.
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
              Create a note to paste your sermon or ministry content, add a cover image or video, cite verses with the Bible panel, then generate survey questions with AI.
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
          <NotesGalleryClient notes={notes} />
        )}
      </div>
    </div>
  );
}
