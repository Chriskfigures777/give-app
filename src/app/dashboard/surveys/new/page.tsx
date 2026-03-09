import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { SurveysNewClient } from "./surveys-new-client";

export default async function NewSurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ fromNote?: string }>;
}) {
  const { profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const params = await searchParams;
  const fromNote = params.fromNote ?? null;

  return (
    <div className=”space-y-4 p-2 sm:p-4”>
      <div className=”flex items-center gap-4”>
        <Link
          href=”/dashboard/surveys”
          className=”text-sm text-dashboard-text-muted hover:text-dashboard-text”
        >
          ← Back to surveys
        </Link>
        {fromNote && (
          <span className=”text-xs text-dashboard-text-muted”>
            Questions generated from your note — edit them below.
          </span>
        )}
      </div>
      <SurveysNewClient fromNoteId={fromNote} />
    </div>
  );
}
