import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { BroadcastClient } from "../broadcast-client";
import { Mail, Users, ArrowLeft } from "lucide-react";

export default async function NewBroadcastPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const { count } = await supabase
    .from("organization_contacts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .not("email", "is", null)
    .is("unsubscribed_at", null);

  const recipientCount = count ?? 0;

  return (
    <div className="space-y-6 p-3 sm:p-5">
      {/* Header */}
      <div className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2.5 shrink-0">
            <Mail className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Link
                href="/dashboard/broadcast"
                className="text-xs text-dashboard-text-muted hover:text-dashboard-text transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Broadcasts
              </Link>
              <span className="text-xs text-dashboard-text-muted">/</span>
              <span className="text-xs text-dashboard-text-muted">New</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">New Broadcast</h1>
            <p className="mt-0.5 text-sm text-dashboard-text-muted max-w-lg">
              Write and send a one-time email to your entire subscriber list.
            </p>
          </div>
        </div>

        {/* Live subscriber pill */}
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 shadow-sm">
          <Users className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold tabular-nums text-dashboard-text">{recipientCount.toLocaleString()}</span>
          <span className="text-xs text-dashboard-text-muted">subscriber{recipientCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="dashboard-fade-in-delay-1">
        <BroadcastClient recipientCount={recipientCount} />
      </div>
    </div>
  );
}
