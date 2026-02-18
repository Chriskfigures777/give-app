import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { MessageSquare, MessageCircle, ArrowUpRight } from "lucide-react";

export default async function MessagesPage() {
  const { supabase, profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) {
    redirect("/dashboard?org=required");
  }

  const { data: connections } = await supabase
    .from("peer_connections")
    .select("id, side_a_id, side_a_type, side_b_id, side_b_type")
    .order("created_at", { ascending: false })
    .limit(100);

  type ConnRow = {
    id: string;
    side_a_id: string;
    side_a_type: string;
    side_b_id: string;
    side_b_type: string;
  };
  const connList = (connections ?? []) as ConnRow[];
  const myConnections = connList.filter(
    (c) =>
      orgId &&
      ((c.side_a_type === "organization" && c.side_a_id === orgId) ||
        (c.side_b_type === "organization" && c.side_b_id === orgId))
  );

  const threads: { id: string; otherName: string }[] = [];
  if (myConnections.length > 0) {
    const connIds = myConnections.map((c) => c.id);
    const { data: threadRows } = await supabase
      .from("chat_threads")
      .select("id, connection_id")
      .in("connection_id", connIds);
    const threadByConn: Record<string, string> = {};
    for (const row of threadRows ?? []) {
      const r = row as { id: string; connection_id: string };
      threadByConn[r.connection_id] = r.id;
    }
    const otherIds = new Set<string>();
    for (const conn of myConnections) {
      const tid = threadByConn[conn.id];
      if (!tid) continue;
      const otherId =
        conn.side_a_id !== orgId ? conn.side_a_id : conn.side_b_id;
      otherIds.add(otherId);
    }
    const { data: orgRows } =
      otherIds.size > 0
        ? await supabase
            .from("organizations")
            .select("id, name")
            .in("id", Array.from(otherIds))
        : { data: [] };
    const namesById: Record<string, string> = {};
    for (const row of orgRows ?? []) {
      const r = row as { id: string; name: string };
      namesById[r.id] = r.name ?? "Organization";
    }
    for (const conn of myConnections) {
      const tid = threadByConn[conn.id];
      if (!tid) continue;
      const otherId =
        conn.side_a_id !== orgId ? conn.side_a_id : conn.side_b_id;
      threads.push({
        id: tid,
        otherName: namesById[otherId] ?? "Organization",
      });
    }
  }

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto overflow-x-hidden">
      <div className="grid grid-cols-1 gap-6 px-4 py-6">
        <header className="dashboard-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-600/20">
              <MessageCircle className="h-4.5 w-4.5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
              Messages
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-dashboard-text-muted ml-12">
            Open a conversation to message or request funds from your
            connections.
          </p>
        </header>

        <section className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm dashboard-fade-in dashboard-fade-in-delay-1">
          <div className="px-5 py-4 border-b border-dashboard-border">
            <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wider">
              Conversations
            </h2>
          </div>

          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center mb-4">
                <MessageCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-dashboard-text mb-1">
                No conversations yet
              </p>
              <p className="text-[13px] text-dashboard-text-muted mb-4 max-w-[280px] leading-relaxed">
                Connect with other organizations to start messaging and
                collaborating.
              </p>
              <Link
                href="/dashboard/connections"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/30 transition-all"
              >
                Find connections
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {threads.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/dashboard/messages?thread=${t.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[hsl(var(--dashboard-card-hover))]/50 transition-all duration-200 group dashboard-fade-in"
                  style={{
                    animationDelay: `${(i + 2) * 60}ms`,
                  }}
                >
                  <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-500/20 dark:to-teal-500/20 ring-1 ring-black/[0.04] dark:ring-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {t.otherName
                        .split(/\s+/)
                        .map((s: string) => s[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-dashboard-text group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate">
                      {t.otherName}
                    </p>
                    <p className="text-xs text-dashboard-text-muted mt-0.5">
                      Click to open conversation
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
