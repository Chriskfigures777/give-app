import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { BroadcastClient } from "./broadcast-client";
import { Mail, Users } from "lucide-react";

export default async function BroadcastPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const [{ count }, { data: logsData }, { data: orgData }] = await Promise.all([
    supabase
      .from("organization_contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .not("email", "is", null)
      .is("unsubscribed_at", null),
    supabase
      .from("broadcast_log")
      .select("id, subject, recipient_count, sent_at")
      .eq("organization_id", orgId)
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single(),
  ]);

  const recipientCount = count ?? 0;
  const orgName = (orgData as { name?: string } | null)?.name ?? "Your Organization";
  const logs = (logsData ?? []) as Array<{
    id: string;
    subject: string;
    recipient_count: number;
    sent_at: string;
  }>;

  return (
    <div className="space-y-6 p-3 sm:p-5">
      {/* Header */}
      <div className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2.5 shrink-0">
            <Mail className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Email Campaigns</h1>
            <p className="mt-0.5 text-sm text-dashboard-text-muted max-w-lg">
              Write and send emails to your entire subscriber list. Every message includes a legal unsubscribe link.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Live subscriber pill */}
          <div className="flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 shadow-sm">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold tabular-nums text-dashboard-text">{recipientCount.toLocaleString()}</span>
            <span className="text-xs text-dashboard-text-muted">subscriber{recipientCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-fade-in-delay-1">
        <BroadcastClient recipientCount={recipientCount} recentLogs={logs} orgName={orgName} />
      </div>
    </div>
  );
}
