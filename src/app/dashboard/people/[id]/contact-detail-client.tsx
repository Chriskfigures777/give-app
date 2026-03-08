"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, MessageSquare, Tag, ClipboardList,
  Activity, StickyNote, Send, X, Loader2, Plus, Pencil,
  Trash2, Check, Clock, CheckCircle2, XCircle, Heart,
  UserCircle, FileText, TrendingUp, UserPlus, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------- Types ----------

type Contact = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  source: string;
  sources_breakdown: Record<string, number>;
  first_seen_at: string;
  last_seen_at: string;
};

type CrmTag = { id: string; name: string; color: string };

type ContactTag = {
  assignmentId: string;
  assignedAt: string;
  id: string;
  name: string;
  color: string;
};

type Note = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_user_id: string | null;
};

type Message = {
  id: string;
  channel: "email" | "sms";
  subject: string | null;
  body: string;
  status: string;
  sent_at: string;
};

type ActivityEvent = {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
};

type SurveyAssignment = {
  id: string;
  assigned_at: string;
  sent_at: string | null;
  responded_at: string | null;
  channel: string;
  organization_surveys: { id: string; title: string; status: string } | null;
};

type Survey = { id: string; title: string; status: string };

// ---------- Helpers ----------

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-violet-500/20 text-violet-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-orange-500/20 text-orange-400",
  "bg-rose-500/20 text-rose-400",
  "bg-teal-500/20 text-teal-400",
];
function avatarColor(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
function initials(name: string | null, email: string | null) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function fmtDatetime(d: string) {
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getSourceBadges(source: string, breakdown: Record<string, number>) {
  const badges: { label: string; color: string; icon: React.ReactNode }[] = [];
  if ((breakdown.donation ?? 0) > 0) badges.push({ label: "Giver", color: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20", icon: <Heart className="h-3 w-3" /> });
  if ((breakdown.member ?? 0) > 0) badges.push({ label: "Member", color: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20", icon: <UserCircle className="h-3 w-3" /> });
  if ((breakdown.get_started ?? 0) > 0) badges.push({ label: "Get started", color: "bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/20", icon: <TrendingUp className="h-3 w-3" /> });
  if ((breakdown.form ?? 0) > 0 && badges.length === 0) badges.push({ label: "Form", color: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20", icon: <FileText className="h-3 w-3" /> });
  if ((breakdown.survey ?? 0) > 0) badges.push({ label: "Survey", color: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20", icon: <ClipboardList className="h-3 w-3" /> });
  if (source === "manual" || (breakdown.manual ?? 0) > 0) badges.push({ label: "Manual", color: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20", icon: <UserPlus className="h-3 w-3" /> });
  if (badges.length === 0) badges.push({ label: source, color: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20", icon: <Users className="h-3 w-3" /> });
  return badges;
}

function activityIcon(type: string) {
  switch (type) {
    case "message_sent": return <Mail className="h-3.5 w-3.5 text-blue-400" />;
    case "broadcast_received": return <Send className="h-3.5 w-3.5 text-violet-400" />;
    case "note_added": case "note_edited": return <StickyNote className="h-3.5 w-3.5 text-yellow-400" />;
    case "note_deleted": return <Trash2 className="h-3.5 w-3.5 text-rose-400" />;
    case "tag_added": return <Tag className="h-3.5 w-3.5 text-emerald-400" />;
    case "tag_removed": return <X className="h-3.5 w-3.5 text-slate-400" />;
    case "survey_sent": return <ClipboardList className="h-3.5 w-3.5 text-orange-400" />;
    case "survey_responded": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "contact_created": return <UserPlus className="h-3.5 w-3.5 text-teal-400" />;
    default: return <Activity className="h-3.5 w-3.5 text-dashboard-text-muted" />;
  }
}
function activityLabel(type: string, data: Record<string, unknown>) {
  switch (type) {
    case "message_sent": return `${data.channel === "sms" ? "SMS" : "Email"} sent${data.subject ? `: "${data.subject}"` : ""}`;
    case "broadcast_received": return `Received broadcast${data.channel === "sms" ? " (SMS)" : " (email)"}`;
    case "note_added": return "Note added";
    case "note_edited": return "Note edited";
    case "note_deleted": return "Note deleted";
    case "tag_added": return `Tag added: ${data.tagName ?? ""}`;
    case "tag_removed": return `Tag removed: ${data.tagName ?? ""}`;
    case "survey_sent": return `Survey sent: "${data.surveyTitle ?? ""}"`;
    case "survey_responded": return "Survey completed";
    case "contact_created": return "Contact created";
    default: return type.replace(/_/g, " ");
  }
}

// ---------- Sub-panels ----------

function NotesPanel({ contactId }: { contactId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/contacts/${contactId}/notes`);
    const data = await res.json() as { notes?: Note[] };
    setNotes(data.notes ?? []);
    setLoading(false);
  }, [contactId]);

  useEffect(() => { void load(); }, [load]);

  async function addNote() {
    if (!draft.trim()) return;
    setSaving(true);
    await fetch(`/api/crm/contacts/${contactId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    setDraft("");
    setSaving(false);
    void load();
  }

  async function saveEdit(id: string) {
    await fetch(`/api/crm/contacts/${contactId}/notes?noteId=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setEditId(null);
    void load();
  }

  async function deleteNote(id: string) {
    await fetch(`/api/crm/contacts/${contactId}/notes?noteId=${id}`, { method: "DELETE" });
    void load();
  }

  if (loading) return <p className="p-5 text-sm text-dashboard-text-muted">Loading…</p>;

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this contact…"
          rows={3}
          className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
        />
        <Button
          onClick={addNote}
          disabled={saving || !draft.trim()}
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Save note
        </Button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-center text-dashboard-text-muted py-6">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-dashboard-border bg-dashboard-card-hover/40 p-3">
              {editId === n.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full rounded border border-dashboard-border bg-dashboard-card px-2 py-1.5 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(n.id)} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Check className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-dashboard-text whitespace-pre-wrap">{n.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-dashboard-text-muted">
                      {fmtDatetime(n.updated_at !== n.created_at ? n.updated_at : n.created_at)}
                      {n.updated_at !== n.created_at && " (edited)"}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setEditId(n.id); setEditContent(n.content); }}
                        className="text-dashboard-text-muted hover:text-dashboard-text transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteNote(n.id)}
                        className="text-dashboard-text-muted hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesPanel({ contact }: { contact: Contact }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/contacts/${contact.id}/messages`);
    const data = await res.json() as { messages?: Message[] };
    setMessages(data.messages ?? []);
    setLoading(false);
  }, [contact.id]);

  useEffect(() => { void load(); }, [load]);

  async function handleSend() {
    if (!body.trim()) { setError("Message is required."); return; }
    if (channel === "email" && !subject.trim()) { setError("Subject is required for email."); return; }
    setError(null);
    setSending(true);
    const res = await fetch(`/api/crm/contacts/${contact.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, subject, body }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    setSending(false);
    if (!data.ok && data.error) { setError(data.error); return; }
    setSubject("");
    setBody("");
    void load();
  }

  const canEmail = Boolean(contact.email);
  const canSms = Boolean(contact.phone);

  return (
    <div className="space-y-5">
      {/* Compose */}
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-dashboard-text">Send message</h3>
        {!canEmail && !canSms && (
          <p className="text-sm text-dashboard-text-muted">This contact has no email or phone number.</p>
        )}
        {(canEmail || canSms) && (
          <>
            <div className="flex gap-2">
              {canEmail && (
                <button
                  onClick={() => setChannel("email")}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${channel === "email" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text"}`}
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
              )}
              {canSms && (
                <button
                  onClick={() => setChannel("sms")}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${channel === "sms" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text"}`}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> SMS
                </button>
              )}
            </div>
            {channel === "email" && (
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            )}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={channel === "sms" ? "Write your SMS…" : "Write your message…"}
              rows={4}
              className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button
              onClick={handleSend}
              disabled={sending}
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? "Sending…" : `Send ${channel === "sms" ? "SMS" : "email"}`}
            </Button>
          </>
        )}
      </div>

      {/* Message history */}
      <div>
        <h3 className="text-sm font-semibold text-dashboard-text mb-3">Message history</h3>
        {loading ? (
          <p className="text-sm text-dashboard-text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-center text-dashboard-text-muted py-6">No messages sent yet.</p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-dashboard-border bg-dashboard-card-hover/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {m.channel === "email"
                      ? <Mail className="h-4 w-4 shrink-0 text-blue-400" />
                      : <MessageSquare className="h-4 w-4 shrink-0 text-emerald-400" />}
                    <div className="min-w-0">
                      {m.subject && <p className="text-sm font-medium text-dashboard-text truncate">{m.subject}</p>}
                      <p className={`text-sm text-dashboard-text-muted ${m.subject ? "line-clamp-2" : ""}`}>{m.body}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      m.status === "sent" || m.status === "delivered"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {m.status === "sent" || m.status === "delivered"
                        ? <CheckCircle2 className="h-2.5 w-2.5" />
                        : <XCircle className="h-2.5 w-2.5" />}
                      {m.status}
                    </span>
                    <span className="text-xs text-dashboard-text-muted">{fmtDatetime(m.sent_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SurveysPanel({ contact, surveys }: { contact: Contact; surveys: Survey[] }) {
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [selSurvey, setSelSurvey] = useState("");
  const [selChannel, setSelChannel] = useState<"email" | "sms">("email");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/contacts/${contact.id}/surveys`);
    const data = await res.json() as { assignments?: SurveyAssignment[] };
    setAssignments(data.assignments ?? []);
    setLoading(false);
  }, [contact.id]);

  useEffect(() => { void load(); }, [load]);

  async function handleAssign() {
    if (!selSurvey) { setError("Select a survey."); return; }
    setError(null);
    setAssigning(true);
    const res = await fetch(`/api/crm/contacts/${contact.id}/surveys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surveyId: selSurvey, channel: selChannel }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    setAssigning(false);
    if (!data.ok) { setError(data.error ?? "Failed to send"); return; }
    setShowAssign(false);
    void load();
  }

  const publishedSurveys = surveys.filter((s) => s.status === "published");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dashboard-text">Survey assignments</h3>
        {publishedSurveys.length > 0 && (
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setShowAssign(!showAssign)}>
            <Plus className="h-3.5 w-3.5" /> Assign survey
          </Button>
        )}
      </div>

      {/* Assign form */}
      {showAssign && (
        <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-dashboard-text-muted uppercase tracking-wider">Survey</label>
            <select
              value={selSurvey}
              onChange={(e) => setSelSurvey(e.target.value)}
              className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="">Select a published survey…</option>
              {publishedSurveys.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {contact.email && (
              <button
                onClick={() => setSelChannel("email")}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${selChannel === "email" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-dashboard-border text-dashboard-text-muted"}`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
            )}
            {contact.phone && (
              <button
                onClick={() => setSelChannel("sms")}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${selChannel === "sms" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-dashboard-border text-dashboard-text-muted"}`}
              >
                <MessageSquare className="h-3.5 w-3.5" /> SMS
              </button>
            )}
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAssign} disabled={assigning} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send survey
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-dashboard-text-muted">Loading…</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-center text-dashboard-text-muted py-6">No surveys assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div key={a.id} className="rounded-lg border border-dashboard-border bg-dashboard-card-hover/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/dashboard/surveys/${a.organization_surveys?.id}`}
                    className="text-sm font-medium text-dashboard-text hover:underline"
                  >
                    {a.organization_surveys?.title ?? "Survey"}
                  </Link>
                  <p className="text-xs text-dashboard-text-muted mt-0.5">
                    Sent {fmtDate(a.sent_at ?? a.assigned_at)} via {a.channel}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                  a.responded_at
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-yellow-500/15 text-yellow-400"
                }`}>
                  {a.responded_at
                    ? <><CheckCircle2 className="h-2.5 w-2.5" /> Responded</>
                    : <><Clock className="h-2.5 w-2.5" /> Pending</>}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityPanel({ contactId }: { contactId: string }) {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/crm/contacts/${contactId}/activity`)
      .then((r) => r.json())
      .then((d: { activity?: ActivityEvent[] }) => {
        setActivity(d.activity ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [contactId]);

  if (loading) return <p className="text-sm text-dashboard-text-muted p-4">Loading…</p>;
  if (activity.length === 0) return <p className="text-sm text-center text-dashboard-text-muted py-8">No activity recorded yet.</p>;

  return (
    <div className="relative pl-5">
      {/* Vertical line */}
      <div className="absolute left-2 top-0 bottom-0 w-px bg-dashboard-border" />
      <div className="space-y-4">
        {activity.map((e) => (
          <div key={e.id} className="relative flex items-start gap-3">
            <div className="absolute -left-5 flex h-5 w-5 items-center justify-center rounded-full bg-dashboard-card border border-dashboard-border">
              {activityIcon(e.event_type)}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm text-dashboard-text">{activityLabel(e.event_type, e.event_data)}</p>
              <p className="text-xs text-dashboard-text-muted mt-0.5">{fmtDatetime(e.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Tags Section ----------

function TagsSection({
  contactId,
  allTags,
  initialContactTags,
}: {
  contactId: string;
  allTags: CrmTag[];
  initialContactTags: ContactTag[];
}) {
  const [contactTags, setContactTags] = useState<ContactTag[]>(initialContactTags);
  const [adding, setAdding] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const assignedIds = new Set(contactTags.map((t) => t.id));
  const unassigned = allTags.filter((t) => !assignedIds.has(t.id));

  async function assignTag(tagId: string) {
    setAdding(true);
    const res = await fetch(`/api/crm/contacts/${contactId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    const data = await res.json() as { assignment?: { id: string; assigned_at: string } };
    setAdding(false);
    setShowPicker(false);
    // Refresh
    const tag = allTags.find((t) => t.id === tagId);
    if (tag && data.assignment) {
      setContactTags((prev) => [
        ...prev,
        { assignmentId: data.assignment!.id, assignedAt: data.assignment!.assigned_at, ...tag },
      ]);
    }
  }

  async function removeTag(tagId: string) {
    await fetch(`/api/crm/contacts/${contactId}/tags?tagId=${tagId}`, { method: "DELETE" });
    setContactTags((prev) => prev.filter((t) => t.id !== tagId));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {contactTags.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
          {t.name}
          <button
            onClick={() => removeTag(t.id)}
            className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {/* Add tag button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          disabled={adding || unassigned.length === 0}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-dashboard-border px-2.5 py-1 text-xs text-dashboard-text-muted hover:border-emerald-500/50 hover:text-emerald-400 transition-colors disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          {unassigned.length === 0 ? "All tags assigned" : "Add tag"}
        </button>
        {showPicker && unassigned.length > 0 && (
          <div className="absolute top-full left-0 mt-1 z-10 w-48 rounded-xl border border-dashboard-border bg-dashboard-card shadow-xl p-1">
            {unassigned.map((t) => (
              <button
                key={t.id}
                onClick={() => assignTag(t.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-dashboard-card-hover transition-colors"
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-dashboard-text">{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main Component ----------

type Tab = "overview" | "messages" | "surveys" | "activity";

export function ContactDetailClient({
  contact,
  allTags,
  initialContactTags,
  surveys,
}: {
  contact: Contact;
  allTags: CrmTag[];
  initialContactTags: ContactTag[];
  surveys: Survey[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const aColor = avatarColor(contact.id);
  const init = initials(contact.name, contact.email);
  const sourceBadges = getSourceBadges(contact.source, contact.sources_breakdown ?? {});

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <UserCircle className="h-3.5 w-3.5" /> },
    { id: "messages", label: "Messages", icon: <Mail className="h-3.5 w-3.5" /> },
    { id: "surveys", label: "Surveys", icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-5 p-3 sm:p-5">
      {/* Back nav */}
      <Link
        href="/dashboard/people"
        className="inline-flex items-center gap-1.5 text-sm text-dashboard-text-muted hover:text-dashboard-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to People
      </Link>

      {/* Profile card */}
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${aColor}`}>
            {init}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
              {contact.name?.trim() || contact.email || "Contact"}
            </h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-sm text-dashboard-text-muted hover:text-dashboard-text transition-colors">
                  <Mail className="h-3.5 w-3.5" /> {contact.email}
                </a>
              )}
              {contact.phone?.trim() && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-sm text-dashboard-text-muted hover:text-dashboard-text transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" /> {contact.phone}
                </a>
              )}
            </div>

            {/* Source badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sourceBadges.map((b) => (
                <span key={b.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.color}`}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>

            {/* Meta */}
            <p className="mt-2 text-xs text-dashboard-text-muted">
              First seen {fmtDate(contact.first_seen_at)} · Last activity {fmtDate(contact.last_seen_at)}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-5 pt-4 border-t border-dashboard-border">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-3.5 w-3.5 text-dashboard-text-muted" />
            <span className="text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Tags</span>
          </div>
          <TagsSection
            contactId={contact.id}
            allTags={allTags}
            initialContactTags={initialContactTags}
          />
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-xl border border-dashboard-border bg-dashboard-card p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
              tab === t.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-dashboard-text-muted hover:text-dashboard-text",
            ].join(" ")}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Notes */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <StickyNote className="h-4 w-4 text-yellow-400" />
                <h2 className="text-sm font-semibold text-dashboard-text">Notes</h2>
              </div>
              <NotesPanel contactId={contact.id} />
            </div>
          </div>
        )}

        {tab === "messages" && <MessagesPanel contact={contact} />}
        {tab === "surveys" && <SurveysPanel contact={contact} surveys={surveys} />}
        {tab === "activity" && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Activity className="h-4 w-4 text-dashboard-text-muted" />
              <h2 className="text-sm font-semibold text-dashboard-text">Activity timeline</h2>
            </div>
            <ActivityPanel contactId={contact.id} />
          </div>
        )}
      </div>
    </div>
  );
}
