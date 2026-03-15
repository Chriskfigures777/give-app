import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import {
  Mail, ArrowLeft, Users, Calendar, CheckCircle2,
  BarChart2, Send, Clock,
} from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function BroadcastDetailPage({ params }: Props) {
  const { id } = await params;
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const { data: broadcast } = await supabase
    .from("broadcast_log")
    .select("id, subject, recipient_count, sent_at, organization_id")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (!broadcast) notFound();

  const sentDate = new Date(broadcast.sent_at);
  const formattedDate = sentDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = sentDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  // Fetch surrounding broadcasts for prev/next navigation
  const { data: allBroadcasts } = await supabase
    .from("broadcast_log")
    .select("id, subject, sent_at")
    .eq("organization_id", orgId)
    .order("sent_at", { ascending: false })
    .limit(100);

  const all = allBroadcasts ?? [];
  const currentIdx = all.findIndex((b) => b.id === id);
  const prevBroadcast = currentIdx < all.length - 1 ? all[currentIdx + 1] : null;
  const nextBroadcast = currentIdx > 0 ? all[currentIdx - 1] : null;

  return (
    <div className="space-y-6 p-3 sm:p-5">
      {/* Breadcrumb + header */}
      <div className="dashboard-fade-in space-y-3">
        <div className="flex items-center gap-2 text-xs text-dashboard-text-muted">
          <Link href="/dashboard/broadcast" className="hover:text-dashboard-text transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Broadcasts
          </Link>
          <span>/</span>
          <span className="text-dashboard-text truncate max-w-xs">{broadcast.subject}</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
                {broadcast.subject}
              </h1>
              <p className="mt-0.5 text-sm text-dashboard-text-muted">
                Sent {formattedDate} at {formattedTime}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/broadcast/new"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            New broadcast
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="dashboard-fade-in-delay-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Delivered",
            value: broadcast.recipient_count.toLocaleString(),
            icon: <Users className="h-4 w-4 text-blue-400" />,
            color: "text-blue-400",
            sub: "subscribers reached",
          },
          {
            label: "Status",
            value: "Sent",
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
            color: "text-emerald-400",
            sub: "delivery complete",
          },
          {
            label: "Date",
            value: sentDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            icon: <Calendar className="h-4 w-4 text-violet-400" />,
            color: "text-violet-400",
            sub: sentDate.getFullYear().toString(),
          },
          {
            label: "Time",
            value: formattedTime,
            icon: <Clock className="h-4 w-4 text-amber-400" />,
            color: "text-amber-400",
            sub: "local time sent",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              {stat.icon}
              <span className="text-xs text-dashboard-text-muted">{stat.label}</span>
            </div>
            <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-dashboard-text-muted mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Campaign ID / metadata */}
      <div className="dashboard-fade-in-delay-2 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        <div className="border-b border-dashboard-border px-5 py-3 flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 text-dashboard-text-muted" />
          <h3 className="text-sm font-semibold text-dashboard-text">Campaign details</h3>
        </div>
        <div className="divide-y divide-dashboard-border">
          {[
            { label: "Campaign ID", value: broadcast.id, mono: true },
            { label: "Subject line", value: broadcast.subject, mono: false },
            { label: "Recipients", value: `${broadcast.recipient_count.toLocaleString()} subscriber${broadcast.recipient_count !== 1 ? "s" : ""}`, mono: false },
            { label: "Sent at", value: `${formattedDate}, ${formattedTime}`, mono: false },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-4 px-5 py-3.5">
              <span className="w-28 shrink-0 text-xs font-medium text-dashboard-text-muted pt-0.5">{row.label}</span>
              <span className={`text-sm text-dashboard-text break-all ${row.mono ? "font-mono text-xs text-dashboard-text-muted" : ""}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next navigation */}
      {(prevBroadcast || nextBroadcast) && (
        <div className="dashboard-fade-in-delay-2 grid gap-3 sm:grid-cols-2">
          {prevBroadcast ? (
            <Link
              href={`/dashboard/broadcast/${prevBroadcast.id}`}
              className="flex items-start gap-3 rounded-xl border border-dashboard-border bg-dashboard-card p-4 hover:bg-dashboard-card-hover/40 transition-colors group"
            >
              <ArrowLeft className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-muted group-hover:text-dashboard-text transition-colors" />
              <div className="min-w-0">
                <p className="text-xs text-dashboard-text-muted">Previous campaign</p>
                <p className="mt-0.5 text-sm font-semibold text-dashboard-text truncate group-hover:text-blue-400 transition-colors">
                  {prevBroadcast.subject}
                </p>
              </div>
            </Link>
          ) : <div />}

          {nextBroadcast ? (
            <Link
              href={`/dashboard/broadcast/${nextBroadcast.id}`}
              className="flex items-start justify-end gap-3 rounded-xl border border-dashboard-border bg-dashboard-card p-4 hover:bg-dashboard-card-hover/40 transition-colors group text-right"
            >
              <div className="min-w-0">
                <p className="text-xs text-dashboard-text-muted">Next campaign</p>
                <p className="mt-0.5 text-sm font-semibold text-dashboard-text truncate group-hover:text-blue-400 transition-colors">
                  {nextBroadcast.subject}
                </p>
              </div>
              <span className="mt-0.5 text-sm font-bold text-dashboard-text-muted group-hover:text-dashboard-text transition-colors shrink-0">→</span>
            </Link>
          ) : <div />}
        </div>
      )}
    </div>
  );
}
