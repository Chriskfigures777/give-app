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
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/surveys"
          className="text-sm text-dashboard-text-muted hover:text-dashboard-text"
        >
          ← Back to surveys
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">New survey</h1>
        {fromNote ? (
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Loading questions generated from your note. You can edit them below before creating the survey.
          </p>
        ) : (
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Build your survey from scratch by adding questions, or <Link href="/dashboard/notes" className="text-emerald-600 hover:underline">create a note</Link> and use “Save and generate questions” to get AI suggestions first.
          </p>
        )}
      </div>
      <SurveysNewClient fromNoteId={fromNote} />
    </div>
  );
}
