"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Copy, Check, Pencil, Mail, CheckCircle2, Circle, XCircle,
  ClipboardList, Users, BarChart3, LinkIcon, ChevronRight,
} from "lucide-react";

type Survey = {
  id: string;
  title: string;
  description: string | null;
  questions: unknown[];
  status: string;
  cover_image_url: string | null;
  theme: unknown;
  updated_at: string;
};
type ResponseRow = {
  id: string;
  respondent_email: string | null;
  respondent_name: string | null;
  answers: Record<string, string>;
  created_at: string;
};
type Props = {
  surveyId: string;
  survey: Survey;
  responses: ResponseRow[];
  surveyLink: string;
  contactCount: number;
};

const STATUS = {
  draft:     { label: "Draft",     cls: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20",     icon: <Circle className="h-3 w-3" /> },
  published: { label: "Published", cls: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  closed:    { label: "Closed",    cls: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/20",         icon: <XCircle className="h-3 w-3" /> },
};

export function SurveyDetailClient({ surveyId, survey, responses, surveyLink, contactCount }: Props) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(survey.status);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "questions" | "responses">("overview");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const cfg = STATUS[status as keyof typeof STATUS] ?? STATUS.draft;
  const questions = Array.isArray(survey.questions) ? (survey.questions as Array<Record<string, unknown>>) : [];

  const copyLink = () => {
    if (surveyLink) {
      navigator.clipboard.writeText(surveyLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const setSurveyStatus = async (newStatus: string) => {
    const res = await fetch(`/api/surveys/${surveyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setStatus(newStatus);
  };

  const sendLinkToContacts = async () => {
    setSendError(null);
    setSendResult(null);
    setSending(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/send-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to send");
      setSendResult({ sent: (data as { sent: number }).sent, total: (data as { total: number }).total });
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const TABS = [
    { id: "overview" as const, label: "Overview", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: "questions" as const, label: `Questions (${questions.length})`, icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { id: "responses" as const, label: `Responses (${responses.length})`, icon: <Users className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-5 p-3 sm:p-5">
      {/* ── Header ── */}
      <div className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.cls}`}>
              {cfg.icon}{cfg.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text truncate">
            {survey.title || "Untitled survey"}
          </h1>
          {survey.description && (
            <p className="mt-1 text-sm text-dashboard-text-muted">{survey.description}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/dashboard/surveys/${surveyId}/edit`}>
            <Button variant="secondary" size="sm" className="gap-1.5 h-9">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </Link>
          {status === "draft" && (
            <Button
              onClick={() => setSurveyStatus("published")}
              size="sm"
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Publish survey
            </Button>
          )}
          {status === "published" && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setSurveyStatus("closed")} className="h-9">
                Close survey
              </Button>
              {contactCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={sendLinkToContacts}
                  disabled={sending}
                  className="h-9 gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {sending ? "Sending…" : "Send to contacts"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Send feedback */}
      {sendError && <p className="text-sm text-rose-400">{sendError}</p>}
      {sendResult && (
        <p className="text-sm text-emerald-400">
          Survey link sent to {sendResult.sent} of {sendResult.total} contacts.
        </p>
      )}

      {/* ── Tabs ── */}
      <div className="dashboard-fade-in-delay-1 flex border-b border-dashboard-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.id
                ? "border-violet-500 text-dashboard-text"
                : "border-transparent text-dashboard-text-muted hover:text-dashboard-text",
            ].join(" ")}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {tab === "overview" && (
        <div className="dashboard-fade-in space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
              <p className="text-xs text-dashboard-text-muted mb-1">Questions</p>
              <p className="text-2xl font-bold text-dashboard-text">{questions.length}</p>
            </div>
            <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
              <p className="text-xs text-dashboard-text-muted mb-1">Responses</p>
              <p className="text-2xl font-bold text-emerald-400">{responses.length}</p>
            </div>
            {contactCount > 0 && (
              <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
                <p className="text-xs text-dashboard-text-muted mb-1">Contacts</p>
                <p className="text-2xl font-bold text-dashboard-text">{contactCount}</p>
              </div>
            )}
          </div>

          {/* Survey link */}
          {status === "published" && surveyLink && (
            <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-4 w-4 text-dashboard-text-muted" />
                <h3 className="text-sm font-semibold text-dashboard-text">Survey link</h3>
              </div>
              <p className="text-xs text-dashboard-text-muted mb-3">
                Share this link with your people or click "Send to contacts" to email them.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-dashboard-card-hover px-3 py-2 text-xs font-mono text-dashboard-text">
                  {surveyLink}
                </code>
                <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          {/* Quick question preview */}
          {questions.length > 0 && (
            <div className="rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
              <div className="border-b border-dashboard-border px-5 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dashboard-text">Questions preview</h3>
                <button onClick={() => setTab("questions")} className="flex items-center gap-1 text-xs text-violet-400 hover:underline">
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <ul className="divide-y divide-dashboard-border">
                {questions.slice(0, 3).map((q, i) => (
                  <li key={i} className="px-5 py-3 text-sm text-dashboard-text">
                    <span className="mr-2 text-dashboard-text-muted tabular-nums">{i + 1}.</span>
                    {String(q.text ?? "")}
                  </li>
                ))}
                {questions.length > 3 && (
                  <li className="px-5 py-2.5 text-xs text-dashboard-text-muted">
                    +{questions.length - 3} more questions
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Questions ── */}
      {tab === "questions" && (
        <div className="dashboard-fade-in rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
          {questions.length === 0 ? (
            <p className="p-8 text-center text-sm text-dashboard-text-muted">No questions yet. Edit the survey to add some.</p>
          ) : (
            <ul className="divide-y divide-dashboard-border">
              {questions.map((q, i) => {
                const row = q as Record<string, unknown>;
                const isMultiple = row.type === "multiple_choice";
                const page = typeof row.page === "number" ? row.page + 1 : null;
                return (
                  <li key={i} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-400">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-dashboard-text">{String(row.text ?? "")}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-dashboard-card-hover px-2 py-0.5 text-[10px] text-dashboard-text-muted">
                            {isMultiple ? "Multiple choice" : "Short answer"}
                          </span>
                          {page !== null && (
                            <span className="rounded-full bg-dashboard-card-hover px-2 py-0.5 text-[10px] text-dashboard-text-muted">
                              Page {page}
                            </span>
                          )}
                        </div>
                        {isMultiple && Array.isArray(row.options) && (row.options as string[]).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(row.options as string[]).map((opt) => (
                              <span key={opt} className="rounded-full border border-dashboard-border px-2.5 py-0.5 text-xs text-dashboard-text-muted">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Tab: Responses ── */}
      {tab === "responses" && (
        <div className="dashboard-fade-in rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-8 w-8 text-dashboard-text-muted mb-3" />
              <p className="text-sm font-medium text-dashboard-text">No responses yet</p>
              <p className="mt-1 text-xs text-dashboard-text-muted">
                {status === "published"
                  ? "Share the survey link or send it to your contacts."
                  : "Publish the survey to start collecting responses."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashboard-border bg-dashboard-card-hover/40">
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Respondent</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Date</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => (
                    <>
                      <tr
                        key={r.id}
                        onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                        className="cursor-pointer border-t border-dashboard-border transition-colors hover:bg-dashboard-card-hover/50"
                      >
                        <td className="p-3 font-medium text-dashboard-text">
                          {r.respondent_name ?? r.respondent_email ?? "Anonymous"}
                          {r.respondent_email && r.respondent_name && (
                            <p className="text-xs font-normal text-dashboard-text-muted">{r.respondent_email}</p>
                          )}
                        </td>
                        <td className="p-3 text-dashboard-text-muted">
                          {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-dashboard-card-hover px-2 py-0.5 text-xs text-dashboard-text-muted">
                            {Object.keys(r.answers ?? {}).length} answered
                          </span>
                        </td>
                      </tr>
                      {expandedRow === r.id && Object.keys(r.answers ?? {}).length > 0 && (
                        <tr key={`${r.id}-expanded`} className="border-t border-dashboard-border bg-dashboard-card-hover/20">
                          <td colSpan={3} className="p-4">
                            <div className="space-y-2">
                              {questions.map((q, qi) => {
                                const qRow = q as Record<string, unknown>;
                                const qId = String(qRow.id ?? `q-${qi}`);
                                const answer = r.answers?.[qId];
                                if (!answer) return null;
                                return (
                                  <div key={qId}>
                                    <p className="text-xs font-medium text-dashboard-text-muted">{String(qRow.text ?? "")}</p>
                                    <p className="text-sm text-dashboard-text">{answer}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
