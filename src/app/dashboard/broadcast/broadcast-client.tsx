"use client";

import { useState } from "react";
import { Send, Loader2, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type LogRow = { id: string; subject: string; recipient_count: number; sent_at: string };
type Props = { recipientCount: number; recentLogs: LogRow[] };

export function BroadcastClient({ recipientCount, recentLogs }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>(recentLogs);

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && recipientCount > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setError(null);
    setResult(null);
    setSending(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to send");
      const sent = (data as { sent: number }).sent ?? 0;
      const total = (data as { total: number }).total ?? 0;
      setResult({ sent, total });
      setLogs((prev) => [
        { id: Date.now().toString(), subject: subject.trim(), recipient_count: sent, sent_at: new Date().toISOString() },
        ...prev,
      ]);
      setSubject("");
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Left: compose */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          {/* Email-compose header */}
          <div className="border-b border-dashboard-border px-5 py-4 flex items-center gap-3 bg-dashboard-card-hover/30">
            <Send className="h-4 w-4 text-dashboard-text-muted shrink-0" />
            <span className="text-sm font-semibold text-dashboard-text">New message</span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-dashboard-text-muted">
              <Users className="h-3.5 w-3.5" />
              {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="divide-y divide-dashboard-border">
            {/* Subject row */}
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="w-14 shrink-0 text-xs font-medium text-dashboard-text-muted">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject line"
                className="min-w-0 flex-1 bg-transparent text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none"
              />
            </div>

            {/* Body */}
            <div className="flex gap-3 px-5 py-3">
              <span className="w-14 shrink-0 pt-0.5 text-xs font-medium text-dashboard-text-muted">Message</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here…"
                rows={10}
                className="min-w-0 flex-1 resize-y bg-transparent text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 border-t border-dashboard-border bg-dashboard-card-hover/30 px-5 py-3">
            <p className="text-xs text-dashboard-text-muted">
              Sent via the platform. An unsubscribe link is added automatically.
            </p>
            <Button
              onClick={handleSend}
              disabled={sending || !canSend}
              className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : "Send message"}
            </Button>
          </div>
        </div>

        {/* Feedback */}
        {result && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400">
              Sent to {result.sent} of {result.total} recipients.
            </p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}
      </div>

      {/* Right: sidebar info */}
      <div className="space-y-4">
        {/* Recipient summary */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-dashboard-text mb-3">Recipients</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-dashboard-text">{recipientCount}</p>
              <p className="text-xs text-dashboard-text-muted">contacts with email</p>
            </div>
          </div>
          {recipientCount === 0 && (
            <p className="mt-3 text-xs text-dashboard-text-muted">
              Add contacts by collecting donations, form submissions, or survey responses.
            </p>
          )}
        </div>

        {/* Sent history */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
          <div className="border-b border-dashboard-border px-5 py-3">
            <h3 className="text-sm font-semibold text-dashboard-text">Sent history</h3>
          </div>
          {logs.length === 0 ? (
            <p className="p-5 text-center text-xs text-dashboard-text-muted">No messages sent yet.</p>
          ) : (
            <ul className="divide-y divide-dashboard-border">
              {logs.map((log) => (
                <li key={log.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-dashboard-text truncate">{log.subject}</p>
                  <p className="mt-0.5 text-xs text-dashboard-text-muted">
                    {log.recipient_count} sent ·{" "}
                    {new Date(log.sent_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
