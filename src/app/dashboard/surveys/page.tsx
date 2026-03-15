import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { Plus, ClipboardList } from "lucide-react";
import Link from "next/link";
import { SurveysTreeView } from "./surveys-tree-client";

export type SurveyRow = {
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

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const { data: surveysData } = await supabase
    .from("organization_surveys")
    .select("id, title, description, status, questions, cover_image_url, theme, created_at, updated_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

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

      {/* ── Survey tree or empty state ── */}
      {surveys.length > 0 ? (
        <SurveysTreeView surveys={surveys} />
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
