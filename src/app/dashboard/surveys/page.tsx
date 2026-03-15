import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Plus, ClipboardList, Video } from "lucide-react";

type SurveyRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  questions: unknown[];
  cover_image_url: string | null;
  theme: { accent_color?: string; video_url?: string } | null;
  created_at: string;
  updated_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: "Draft",     color: "bg-slate-500/15 text-slate-400 ring-slate-500/20",    dot: "#94a3b8" },
  published: { label: "Published", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", dot: "#34d399" },
  closed:    { label: "Closed",    color: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",       dot: "#71717a" },
};

function relDate(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const { data: surveysData } = await supabase
    .from("organization_surveys")
    .select("id, title, description, status, questions, cover_image_url, theme, created_at, updated_at")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });

  const surveys = (surveysData ?? []) as SurveyRow[];
  const published = surveys.filter((s) => s.status === "published").length;
  const drafts = surveys.filter((s) => s.status === "draft").length;

  return (
    <div className="space-y-6 p-3 sm:p-5">

      {/* ── Header ── */}
      <div className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Surveys</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Gather feedback from your people with simple surveys.
          </p>
        </div>
        <Link
          href="/dashboard/surveys/new"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New survey
        </Link>
      </div>

      {/* ── Stats row ── */}
      {surveys.length > 0 && (
        <div className="dashboard-fade-in-delay-1 grid grid-cols-3 gap-3">
          {[
            { label: "Total surveys", value: surveys.length, color: "text-dashboard-text" },
            { label: "Published",     value: published,      color: "text-emerald-400" },
            { label: "Drafts",        value: drafts,         color: "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-dashboard-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Survey list ── */}
      {surveys.length > 0 ? (
        <div className="dashboard-fade-in-delay-2 space-y-3">
          {surveys.map((s) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.draft;
            const qCount = Array.isArray(s.questions) ? s.questions.length : 0;
            const accentColor = s.theme?.accent_color ?? "#8b5cf6";
            const hasVideo = !!(s.theme?.video_url);

            return (
              <Link
                key={s.id}
                href={`/dashboard/surveys/${s.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm transition-all hover:bg-dashboard-card-hover hover:shadow-md"
              >
                {/* Color accent circle */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  {(s.title || "U")[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dashboard-text truncate">
                    {s.title || "Untitled survey"}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-dashboard-text-muted">
                      {qCount} question{qCount !== 1 ? "s" : ""}
                    </span>
                    {s.description && (
                      <span className="text-xs text-dashboard-text-muted truncate max-w-[200px]">
                        {s.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${cfg.color}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                  {hasVideo && (
                    <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/20">
                      <Video className="h-3 w-3" /> Video
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-dashboard-text-muted">
                    {relDate(s.updated_at)}
                  </span>
                  <span className="text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: accentColor }}>
                    Open &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-fade-in-delay-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card/50 py-16 text-center">
          <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4">
            <ClipboardList className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-dashboard-text">No surveys yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-dashboard-text-muted">
            Create a survey from scratch, or generate questions from a ministry note.
          </p>
          <Link
            href="/dashboard/surveys/new"
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Create first survey
          </Link>
        </div>
      )}
    </div>
  );
}
