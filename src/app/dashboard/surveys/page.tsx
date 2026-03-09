import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Plus, ClipboardList, CheckCircle2, Circle, XCircle, Video } from "lucide-react";

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

const DEFAULT_COVERS = [
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80",
  "https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: "Draft",     color: "bg-slate-500/15 text-slate-400 ring-slate-500/20",    dot: "#94a3b8" },
  published: { label: "Published", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20", dot: "#34d399" },
  closed:    { label: "Closed",    color: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",       dot: "#71717a" },
};

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
            Gather feedback from your people. Build from scratch or generate questions from notes.
          </p>
        </div>
        <Link
          href="/dashboard/surveys/new"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          New survey
        </Link>
      </div>

      {/* ── Stats row ── */}
      {surveys.length > 0 && (
        <div className="dashboard-fade-in-delay-1 grid grid-cols-3 gap-3">
          {[
            { label: "Total surveys",  value: surveys.length, color: "text-dashboard-text" },
            { label: "Published",      value: published,      color: "text-emerald-400" },
            { label: "Drafts",         value: drafts,         color: "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-dashboard-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Survey gallery ── */}
      {surveys.length > 0 ? (
        <div className="dashboard-fade-in-delay-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((s, idx) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.draft;
            const qCount = Array.isArray(s.questions) ? s.questions.length : 0;
            const accentColor = s.theme?.accent_color ?? "#8b5cf6";
            const hasVideo = !!(s.theme?.video_url);
            const coverImg = s.cover_image_url ?? DEFAULT_COVERS[idx % DEFAULT_COVERS.length];
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
                className="group relative flex flex-col rounded-2xl overflow-hidden border text-left cursor-pointer focus:outline-none"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                {/* Cover image */}
                <div className="relative h-44 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImg}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.05) 100%)" }}
                  />
                  {/* Accent strip */}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: accentColor }} />

                  {/* Status badge top-left */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${cfg.color}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Video badge top-right */}
                  {hasVideo && (
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                        <Video className="h-3 w-3" /> Video
                      </span>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div
                  className="flex flex-col flex-1 p-4 gap-2"
                  style={{ background: "hsl(var(--dashboard-card))" }}
                >
                  <h3
                    className="text-sm font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-white"
                    style={{ color: "#eef0f6" }}
                  >
                    {s.title || "Untitled survey"}
                  </h3>
                  {s.description && (
                    <p className="text-xs text-dashboard-text-muted line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-xs text-dashboard-text-muted">
                      {qCount} question{qCount !== 1 ? "s" : ""} · {relDate}
                    </span>
                    <span className="text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: accentColor }}>
                      Open →
                    </span>
                  </div>
                </div>

                {/* Hover shimmer border */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1.5px ${accentColor}50` }}
                />
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
            Create a survey from scratch, or generate questions from a ministry note.
          </p>
          <Link
            href="/dashboard/surveys/new"
            className="mt-5 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Create first survey
          </Link>
        </div>
      )}
    </div>
  );
}
