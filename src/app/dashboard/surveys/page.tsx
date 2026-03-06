import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Plus, ClipboardList, CheckCircle2, Circle, XCircle } from "lucide-react";

type SurveyRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  questions: unknown[];
  created_at: string;
  updated_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: "Draft",     color: "bg-slate-500/15 text-slate-400 ring-slate-500/20",   icon: <Circle className="h-3 w-3" /> },
  published: { label: "Published", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  closed:    { label: "Closed",    color: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",      icon: <XCircle className="h-3 w-3" /> },
};

export default async function SurveysPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const { data: surveysData } = await supabase
    .from("organization_surveys")
    .select("id, title, description, status, questions, created_at, updated_at")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });

  const surveys = (surveysData ?? []) as SurveyRow[];
  const published = surveys.filter((s) => s.status === "published").length;
  const drafts = surveys.filter((s) => s.status === "draft").length;

  return (
    <div className="space-y-6 p-3 sm:p-5">
      {/* Header */}
      <div className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Surveys</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Gather feedback from your people. Build from scratch or generate questions from notes.
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

      {/* Stats row */}
      {surveys.length > 0 && (
        <div className="dashboard-fade-in-delay-1 grid grid-cols-3 gap-3">
          {[
            { label: "Total surveys", value: surveys.length, color: "text-dashboard-text" },
            { label: "Published", value: published, color: "text-emerald-400" },
            { label: "Drafts", value: drafts, color: "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-dashboard-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Survey cards */}
      {surveys.length > 0 ? (
        <div className="dashboard-fade-in-delay-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((s) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.draft;
            const qCount = Array.isArray(s.questions) ? s.questions.length : 0;
            const updated = new Date(s.updated_at);
            const diffDays = Math.floor((Date.now() - updated.getTime()) / 86400000);
            const relDate =
              diffDays === 0 ? "Today"
              : diffDays === 1 ? "Yesterday"
              : diffDays < 7 ? `${diffDays}d ago`
              : updated.toLocaleDateString(undefined, { month: "short", day: "numeric" });

            return (
              <Link
                key={s.id}
                href={`/dashboard/surveys/${s.id}`}
                className="group flex flex-col rounded-2xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm transition-all hover:border-violet-500/30 hover:shadow-md"
              >
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <div className="rounded-lg bg-violet-500/10 p-1.5">
                    <ClipboardList className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${cfg.color}`}>
                    {cfg.icon}{cfg.label}
                  </span>
                </div>
                <h3 className="font-semibold text-dashboard-text transition-colors group-hover:text-violet-400 line-clamp-2">
                  {s.title || "Untitled survey"}
                </h3>
                {s.description && (
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-dashboard-text-muted line-clamp-2">
                    {s.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-dashboard-border pt-3">
                  <span className="text-xs text-dashboard-text-muted">
                    {qCount} question{qCount !== 1 ? "s" : ""} · {relDate}
                  </span>
                  <span className="text-xs font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                    View →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-fade-in-delay-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card/50 py-16 text-center">
          <div className="mb-4 rounded-2xl bg-violet-500/10 p-4">
            <ClipboardList className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-dashboard-text">No surveys yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-dashboard-text-muted">
            Create a survey from scratch, or generate questions from a ministry note and build a survey from those.
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
