"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Copy, Check, Pencil, Mail, ChevronDown,
  ClipboardList, Users, BarChart3, LinkIcon, ChevronRight, Video, Eye, X, UserCheck,
} from "lucide-react";
import { SurveyResponseForm } from "@/app/survey/org/[surveyId]/survey-response-form";

type SurveyTheme = {
  accent_color?: string;
  video_url?: string;
  font_style?: "sans" | "serif";
  button_shape?: "rounded" | "pill";
  form_style?: "card" | "minimal" | "bold";
};

type Survey = {
  id: string;
  title: string;
  description: string | null;
  questions: unknown[];
  status: string;
  cover_image_url: string | null;
  theme: SurveyTheme | null;
  respondent_category: string | null;
  updated_at: string;
};
type ResponseRow = {
  id: string;
  respondent_email: string | null;
  respondent_name: string | null;
  answers: Record<string, string>;
  created_at: string;
};
type ContactRow = { id: string; email: string | null; name: string | null };
type Props = {
  surveyId: string;
  survey: Survey;
  responses: ResponseRow[];
  surveyLink: string;
  contactCount: number;
  membersCount: number;
  contacts: ContactRow[];
};

const DEFAULT_COVER = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80";

const STATUS = {
  draft:     { label: "Draft",     cls: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20",      dot: "#94a3b8" },
  published: { label: "Published", cls: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20", dot: "#34d399" },
  closed:    { label: "Closed",    cls: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/20",          dot: "#71717a" },
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/);
  return m?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
}

type SendToOption = "all" | "members" | "contacts" | "selected";

export function SurveyDetailClient({ surveyId, survey, responses, surveyLink, contactCount, membersCount, contacts }: Props) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(survey.status);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "questions" | "responses">("overview");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendDropdownOpen, setSendDropdownOpen] = useState(false);
  const [sendTo, setSendTo] = useState<SendToOption>("all");
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [respondentCategory, setRespondentCategory] = useState<string | null>(survey.respondent_category ?? null);
  const [savingCategory, setSavingCategory] = useState(false);

  const cfg = STATUS[status as keyof typeof STATUS] ?? STATUS.draft;
  const questions = Array.isArray(survey.questions) ? (survey.questions as Array<Record<string, unknown>>) : [];
  const theme = survey.theme ?? {};
  const accentColor = theme.accent_color ?? "#8b5cf6";
  const videoUrl = theme.video_url ?? "";
  const fontStyle = theme.font_style ?? "sans";
  const buttonShape = theme.button_shape ?? "rounded";
  const formStyle = theme.form_style ?? "card";
  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;
  const vimeoId = videoUrl ? getVimeoId(videoUrl) : null;
  const hasVideo = !!(ytId || vimeoId);
  const coverImg = survey.cover_image_url ?? DEFAULT_COVER;

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

  const sendLinkToContacts = async (option: SendToOption, contactIds?: string[]) => {
    setSendError(null);
    setSendResult(null);
    setSendDropdownOpen(false);
    setRecipientPickerOpen(false);
    setSending(true);
    try {
      const body: { sendTo: SendToOption; contactIds?: string[] } = { sendTo: option };
      if (option === "selected" && contactIds?.length) body.contactIds = contactIds;
      const res = await fetch(`/api/surveys/${surveyId}/send-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to send");
      setSendResult({ sent: (data as { sent: number }).sent, total: (data as { total: number }).total });
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const saveRespondentCategory = async (value: string | null) => {
    setSavingCategory(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respondent_category: value }),
      });
      if (res.ok) setRespondentCategory(value);
    } finally {
      setSavingCategory(false);
    }
  };

  const canSend = contactCount > 0;
  const sendToLabel =
    sendTo === "members"
      ? `Send to members (${membersCount})`
      : sendTo === "selected"
        ? `Send to selected (${selectedContactIds.size})`
        : sendTo === "contacts"
          ? "Send to contacts"
          : `Send to all (${contactCount})`;

  const TABS = [
    { id: "overview"  as const, label: "Overview",                         icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: "questions" as const, label: `Questions (${questions.length})`,  icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { id: "responses" as const, label: `Responses (${responses.length})`,  icon: <Users className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-0">

      {/* ── Cover hero ── */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 220 }}>
        {hasVideo ? (
          <div className="absolute inset-0 bg-black">
            {ytId && (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=0&modestbranding=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Survey video"
              />
            )}
            {vimeoId && (
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Survey video"
              />
            )}
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={coverImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)" }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: accentColor }} />

        {/* Video badge */}
        {hasVideo && (
          <div className="absolute top-4 right-4">
            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              <Video className="h-3.5 w-3.5" /> Video
            </span>
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-5">
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${cfg.cls}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight truncate">
            {survey.title || "Untitled survey"}
          </h1>
          {survey.description && (
            <p className="mt-1 text-sm text-white/65 line-clamp-1">{survey.description}</p>
          )}
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap gap-2">
          {status === "draft" && (
            <Button
              onClick={() => setSurveyStatus("published")}
              size="sm"
              className="h-9 text-white"
              style={{ background: accentColor }}
            >
              Publish survey
            </Button>
          )}
          {status === "published" && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setSurveyStatus("closed")} className="h-9">
                Close survey
              </Button>
              {canSend && (
                <div className="relative">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSendDropdownOpen((o) => !o)}
                    disabled={sending}
                    className="h-9 gap-1.5 border border-dashboard-border bg-dashboard-card hover:bg-dashboard-card-hover text-dashboard-text"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {sending ? "Sending…" : sendToLabel}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                  {sendDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSendDropdownOpen(false)} aria-hidden />
                      <div
                        className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-dashboard-border bg-dashboard-card py-1 shadow-lg"
                        style={{ background: "hsl(var(--dashboard-card))" }}
                      >
                        <button
                          type="button"
                          onClick={() => { setSendTo("all"); sendLinkToContacts("all"); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-dashboard-text hover:bg-dashboard-card-hover"
                        >
                          Send to all ({contactCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSendTo("members"); sendLinkToContacts("members"); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-dashboard-text hover:bg-dashboard-card-hover"
                        >
                          Send to members ({membersCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSendTo("contacts"); sendLinkToContacts("contacts"); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-dashboard-text hover:bg-dashboard-card-hover"
                        >
                          Send to contacts ({contactCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSendDropdownOpen(false); setRecipientPickerOpen(true); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-dashboard-text hover:bg-dashboard-card-hover flex items-center gap-2"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Send to selected…
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashboard-border bg-dashboard-card hover:bg-dashboard-card-hover px-3 py-2 text-sm font-medium text-dashboard-text-muted hover:text-dashboard-text transition-all h-9"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <Link href={`/dashboard/surveys/${surveyId}/edit`}>
            <Button variant="secondary" size="sm" className="gap-1.5 h-9">
              <Pencil className="h-3.5 w-3.5" /> Edit survey
            </Button>
          </Link>
        </div>
      </div>

      {/* Recipient picker modal (Send to selected) */}
      {recipientPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setRecipientPickerOpen(false)}
        >
          <div
            className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-xl max-h-[80vh] w-full max-w-md flex flex-col"
            style={{ background: "hsl(var(--dashboard-card))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-dashboard-border px-5 py-4">
              <h3 className="text-sm font-semibold text-dashboard-text">Send survey to selected people</h3>
              <button type="button" onClick={() => setRecipientPickerOpen(false)} className="rounded-lg p-1.5 text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {contacts.length === 0 ? (
                <p className="text-sm text-dashboard-text-muted">No contacts with email.</p>
              ) : (
                contacts.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-dashboard-border bg-dashboard-card-hover/50 px-3 py-2 cursor-pointer hover:bg-dashboard-card-hover"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContactIds.has(c.id)}
                      onChange={() => {
                        setSelectedContactIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          return next;
                        });
                      }}
                      className="rounded border-dashboard-border text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-dashboard-text truncate">{c.name || c.email || c.id}</span>
                    {c.email && <span className="text-xs text-dashboard-text-muted truncate ml-auto">{c.email}</span>}
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-dashboard-border px-5 py-4">
              <Button variant="secondary" size="sm" onClick={() => setRecipientPickerOpen(false)} className="h-9">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => sendLinkToContacts("selected", Array.from(selectedContactIds))}
                disabled={sending || selectedContactIds.size === 0}
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {sending ? "Sending…" : `Send to ${selectedContactIds.size} selected`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send feedback */}
      {sendError && <p className="mt-2 px-1 text-sm text-rose-400">{sendError}</p>}
      {sendResult && (
        <p className="mt-2 px-1 text-sm text-emerald-400">
          Survey link sent to {sendResult.sent} of {sendResult.total} contacts.
        </p>
      )}

      {/* ── Tabs ── */}
      <div className="mt-5 flex border-b border-dashboard-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.id
                ? "text-dashboard-text border-b-2"
                : "border-transparent text-dashboard-text-muted hover:text-dashboard-text",
            ].join(" ")}
            style={tab === t.id ? { borderBottomColor: accentColor } : {}}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {tab === "overview" && (
        <div className="dashboard-fade-in mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
              <p className="text-xs text-dashboard-text-muted mb-1">Questions</p>
              <p className="text-2xl font-bold text-dashboard-text">{questions.length}</p>
            </div>
            <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
              <p className="text-xs text-dashboard-text-muted mb-1">Responses</p>
              <p className="text-2xl font-bold" style={{ color: accentColor }}>{responses.length}</p>
            </div>
            {contactCount > 0 && (
              <>
                <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
                  <p className="text-xs text-dashboard-text-muted mb-1">Contacts</p>
                  <p className="text-2xl font-bold text-dashboard-text">{contactCount}</p>
                </div>
                <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
                  <p className="text-xs text-dashboard-text-muted mb-1">Members</p>
                  <p className="text-2xl font-bold text-dashboard-text">{membersCount}</p>
                </div>
              </>
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
                Share this link with your people or use &ldquo;Send to…&rdquo; to email members or contacts. When someone fills this survey on your website, they are added to People automatically.
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
              {/* Respondent category: when someone fills on public page, add to People as… */}
              <div className="mt-5 pt-5 border-t border-dashboard-border">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted mb-2">
                  When someone fills this survey on your website, add them to People as
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["none", "member", "contact"] as const).map((value) => {
                    const v = value === "none" ? null : value;
                    const label = value === "none" ? "Just survey (no category)" : value === "member" ? "Member" : "Contact";
                    const isActive = respondentCategory === v;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setRespondentCategory(v); saveRespondentCategory(v); }}
                        disabled={savingCategory}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                            : "border-dashboard-border bg-dashboard-card-hover text-dashboard-text-muted hover:text-dashboard-text"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick question preview */}
          {questions.length > 0 && (
            <div className="rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
              <div className="border-b border-dashboard-border px-5 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dashboard-text">Questions preview</h3>
                <button
                  onClick={() => setTab("questions")}
                  className="flex items-center gap-1 text-xs hover:underline"
                  style={{ color: accentColor }}
                >
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
        <div className="dashboard-fade-in mt-5 rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
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
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: `${accentColor}20`, color: accentColor }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-dashboard-text">{String(row.text ?? "")}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-dashboard-card-hover px-2 py-0.5 text-[10px] text-dashboard-text-muted">
                            {isMultiple ? "Multiple choice" : String(row.type ?? "Short answer").replace(/_/g, " ")}
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

      {/* ── Preview panel ── */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}
        >
          <div
            className="goal-panel-enter relative flex h-full w-full max-w-lg flex-col overflow-hidden"
            style={{ background: "#f9fafb" }}
          >
            {/* Preview header */}
            <div
              className="flex items-center justify-between border-b px-5 py-4 shrink-0"
              style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${accentColor}20` }}
                >
                  <Eye className="h-4 w-4" style={{ color: accentColor }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Survey Preview</h2>
                  <p className="text-xs text-gray-500">Respondent view</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview body — matches published survey's bg-gray-50 */}
            <div className="flex-1 overflow-y-auto">
              <SurveyResponseForm
                surveyId={surveyId}
                title={survey.title}
                description={survey.description}
                pages={(() => {
                  const qs = questions as Array<{ id?: string; text: string; type: string; options?: string[]; page?: number }>;
                  const hasPageAssignments = qs.some((q) => typeof q.page === "number");
                  if (hasPageAssignments) {
                    const byPage = new Map<number, typeof qs>();
                    for (const q of qs) {
                      const p = typeof q.page === "number" ? q.page : 0;
                      if (!byPage.has(p)) byPage.set(p, []);
                      byPage.get(p)!.push(q);
                    }
                    return Array.from(byPage.entries()).sort((a, b) => a[0] - b[0]).map(([, pg]) => pg);
                  }
                  const out: typeof qs[] = [];
                  for (let i = 0; i < qs.length; i += 4) out.push(qs.slice(i, i + 4));
                  return out.length ? out : [[]];
                })()}
                coverImageUrl={survey.cover_image_url}
                accentColor={accentColor}
                videoUrl={videoUrl}
                fontStyle={fontStyle}
                buttonShape={buttonShape}
                formStyle={formStyle}
                previewMode
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Responses ── */}
      {tab === "responses" && (
        <div className="dashboard-fade-in mt-5 rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
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
