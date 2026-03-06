import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { BroadcastClient } from "./broadcast-client";
import { Mail } from "lucide-react";

export default async function BroadcastPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const [{ count }, { data: logsData }] = await Promise.all([
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
      .limit(10),
  ]);

  const recipientCount = count ?? 0;
  const logs = (logsData ?? []) as Array<{
    id: string;
    subject: string;
    recipient_count: number;
    sent_at: string;
  }>;

  return (
    <div className="space-y-5 p-3 sm:p-5">
      {/* Header */}
      <div className="dashboard-fade-in flex items-start gap-3">
        <div className="rounded-xl bg-blue-500/10 p-2.5">
          <Mail className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Send message</h1>
          <p className="mt-0.5 text-sm text-dashboard-text-muted">
            Email your contact list. All messages are sent via the platform with an unsubscribe link.
          </p>
        </div>
      </div>

      <div className="dashboard-fade-in-delay-1">
        <BroadcastClient recipientCount={recipientCount} recentLogs={logs} />
      </div>
    </div>
  );
}
