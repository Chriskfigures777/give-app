import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Contact, ClipboardList } from "lucide-react";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const { data: contact, error } = await supabase
    .from("organization_contacts")
    .select("id, email, name, phone, source, sources_breakdown, first_seen_at, last_seen_at, created_at")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !contact) notFound();

  const { data: responsesData } = await supabase
    .from("organization_survey_responses")
    .select(`
      id,
      survey_id,
      created_at,
      organization_surveys(title)
    `)
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  const responses = (responsesData ?? []) as Array<{
    id: string;
    survey_id: string;
    created_at: string;
    organization_surveys: { title: string } | null;
  }>;

  function sourceLabel(source: string, breakdown: Record<string, unknown>): string {
    const b = breakdown ?? {};
    if ((b.member as number) > 0) return "Member";
    if ((b.get_started as number) > 0) return "Get started";
    if (source === "donation") return "Gave";
    if (source === "form") return "Form";
    if (source === "survey") return "Survey";
    return source;
  }

  const c = contact as {
    id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    source: string;
    sources_breakdown: Record<string, unknown>;
    first_seen_at: string;
    last_seen_at: string;
    created_at: string;
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/people" className="text-sm text-dashboard-text-muted hover:text-dashboard-text">
          ← Back to People
        </Link>
      </div>

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-violet-500/10 dark:bg-violet-500/20 p-3">
            <Contact className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
              {c.name?.trim() || c.email || "Contact"}
            </h1>
            {c.email && (
              <p className="mt-1 text-dashboard-text-muted">{c.email}</p>
            )}
            {c.phone?.trim() && (
              <p className="mt-0.5 text-dashboard-text-muted">{c.phone}</p>
            )}
            <p className="mt-2">
              <span className="inline-flex items-center rounded-full bg-dashboard-card-hover px-2.5 py-0.5 text-xs font-medium text-dashboard-text">
                {sourceLabel(c.source, c.sources_breakdown ?? {})}
              </span>
            </p>
            <p className="mt-2 text-xs text-dashboard-text-muted">
              First seen {new Date(c.first_seen_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              {" · "}
              Last activity {new Date(c.last_seen_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
        <div className="border-b border-dashboard-border px-5 py-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-dashboard-text-muted" />
          <h2 className="text-base font-bold text-dashboard-text">Survey responses</h2>
        </div>
        {responses.length > 0 ? (
          <ul className="divide-y divide-dashboard-border">
            {responses.map((r) => (
              <li key={r.id} className="px-5 py-3">
                <Link
                  href={`/dashboard/surveys/${r.survey_id}`}
                  className="font-medium text-dashboard-text hover:underline"
                >
                  {r.organization_surveys?.title ?? "Survey"}
                </Link>
                <p className="text-sm text-dashboard-text-muted mt-0.5">
                  Responded {new Date(r.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-center text-dashboard-text-muted text-sm">
            No survey responses yet.
          </p>
        )}
      </div>
    </div>
  );
}
