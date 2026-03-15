"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Link2, QrCode, Copy, CheckCircle2, Users,
  Calendar, Mail, Phone, MapPin,
  Heart, Sparkles, ExternalLink, UserCircle, Palette,
  Plus, X, Save, Loader2,
  Church, Settings,
} from "lucide-react";
import type { Submission, ConnectCardSettings, MinistryOption } from "./page";

type Props = {
  orgSlug: string;
  orgId: string;
  orgName: string;
  baseUrl: string;
  initialSubmissions: Submission[];
  initialSettings: ConnectCardSettings | null;
};

const DEFAULT_MINISTRY_OPTIONS: MinistryOption[] = [
  { value: "worship", label: "Worship", icon: "\uD83C\uDFB5" },
  { value: "youth", label: "Youth", icon: "\uD83C\uDF1F" },
  { value: "kids", label: "Kids", icon: "\uD83E\uDDD2" },
  { value: "hospitality", label: "Hospitality", icon: "\u2615" },
  { value: "outreach", label: "Outreach", icon: "\uD83C\uDF0D" },
  { value: "prayer", label: "Prayer", icon: "\uD83D\uDE4F" },
  { value: "small_groups", label: "Small Groups", icon: "\uD83D\uDC65" },
  { value: "media_tech", label: "Media & Tech", icon: "\uD83C\uDFAC" },
  { value: "volunteers", label: "Volunteers", icon: "\uD83E\uDD1D" },
  { value: "missions", label: "Missions", icon: "\u2708\uFE0F" },
];

const TOGGLEABLE_FIELDS = [
  { key: "birthday", label: "Birthday" },
  { key: "phone", label: "Phone number" },
  { key: "address", label: "Address (street, city, state, zip)" },
  { key: "visit_type", label: "Visitor type" },
  { key: "marital_status", label: "Marital status" },
  { key: "children", label: "Number of children" },
  { key: "how_heard", label: "How did you hear about us?" },
  { key: "prayer", label: "Prayer request / note" },
];

const ACCENT_COLORS = [
  "#10b981", "#8b5cf6", "#3b82f6", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
];

const VISIT_LABEL: Record<string, string> = {
  first_time: "First-time visitor",
  regular: "Regular attender",
  new_member: "New member",
  online: "Online viewer",
};

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #065f46 0%, #064e3b 50%, #022c22 100%)",
  "linear-gradient(135deg, #4c1d95 0%, #3b0764 50%, #1e1b4b 100%)",
  "linear-gradient(135deg, #1e3a5f 0%, #172554 50%, #0c1445 100%)",
  "linear-gradient(135deg, #78350f 0%, #713f12 50%, #422006 100%)",
  "linear-gradient(135deg, #7f1d1d 0%, #6d1a1a 50%, #450a0a 100%)",
  "linear-gradient(135deg, #134e4a 0%, #115e59 50%, #042f2e 100%)",
];

const CARD_ACCENT = [
  "#10b981", "#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444", "#14b8a6",
];

function relDate(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: diff > 365 ? "numeric" : undefined });
}

function initials(name: string | null, email: string | null): string {
  if (name?.trim()) {
    const p = name.trim().split(" ");
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase();
  }
  return (email ?? "??").slice(0, 2).toUpperCase();
}

function cardIndex(id: string) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function ConnectCardClient({ orgSlug, orgId, orgName, baseUrl, initialSubmissions, initialSettings }: Props) {
  const [submissions] = useState<Submission[]>(initialSubmissions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [origin, setOrigin] = useState(baseUrl);

  const [primaryColor, setPrimaryColor] = useState(initialSettings?.primary_color ?? "#10b981");
  const [accentColor, setAccentColor] = useState(initialSettings?.accent_color ?? "#065f46");
  const [welcomeHeadline, setWelcomeHeadline] = useState(initialSettings?.welcome_headline ?? "");
  const [welcomeSubtext, setWelcomeSubtext] = useState(initialSettings?.welcome_subtext ?? "");
  const [bgImageUrl, setBgImageUrl] = useState(initialSettings?.bg_image_url ?? "");
  const [hiddenFields, setHiddenFields] = useState<string[]>(initialSettings?.hidden_fields ?? []);
  const [ministryOptions, setMinistryOptions] = useState<MinistryOption[]>(
    initialSettings?.ministry_options ?? DEFAULT_MINISTRY_OPTIONS,
  );
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [newMinLabel, setNewMinLabel] = useState("");
  const [newMinIcon, setNewMinIcon] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const shareUrl = `${origin}/connect/${orgId}/${orgSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleField = (key: string) => {
    setHiddenFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  const removeMinistry = (value: string) => {
    setMinistryOptions((prev) => prev.filter((m) => m.value !== value));
  };

  const addMinistry = () => {
    const label = newMinLabel.trim();
    if (!label) return;
    const value = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (ministryOptions.some((m) => m.value === value)) return;
    setMinistryOptions((prev) => [...prev, { value, label, icon: newMinIcon.trim() || "\u2728" }]);
    setNewMinLabel("");
    setNewMinIcon("");
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveOk(false);
    setSaveErr(null);
    try {
      const settings: ConnectCardSettings = {
        primary_color: primaryColor,
        accent_color: accentColor,
        welcome_headline: welcomeHeadline || undefined,
        welcome_subtext: welcomeSubtext || undefined,
        bg_image_url: bgImageUrl || undefined,
        hidden_fields: hiddenFields.length > 0 ? hiddenFields : undefined,
        ministry_options: ministryOptions,
      };
      const res = await fetch("/api/organization-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connect_card_settings: settings }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Save failed");
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [primaryColor, accentColor, welcomeHeadline, welcomeSubtext, bgImageUrl, hiddenFields, ministryOptions]);

  const thisWeek = submissions.filter((s) => (Date.now() - new Date(s.created_at).getTime()) < 7 * 86400000).length;
  const thisMonth = submissions.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const expandedSub = expanded ? submissions.find((s) => s.id === expanded) ?? null : null;

  return (
    <div className="space-y-6 p-3 sm:p-5">

      {/* ── Header ── */}
      <div className="dashboard-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Connect Card</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Share your digital connect card and view submissions.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm font-medium text-dashboard-text transition-colors hover:bg-dashboard-card-hover"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-dashboard-text-muted" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button
            onClick={() => setShowQr(true)}
            className="flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm font-medium text-dashboard-text transition-colors hover:bg-dashboard-card-hover"
          >
            <QrCode className="h-4 w-4 text-dashboard-text-muted" />
            <span className="hidden sm:inline">QR Code</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm font-medium text-dashboard-text transition-colors hover:bg-dashboard-card-hover"
          >
            <Settings className="h-4 w-4 text-dashboard-text-muted" />
            <span className="hidden sm:inline">Customize</span>
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </a>
        </div>
      </div>

      {/* ── Stats row (only when submissions exist) ── */}
      {submissions.length > 0 && (
        <div className="dashboard-fade-in-delay-1 grid grid-cols-3 gap-3">
          {[
            { label: "Total submissions", value: submissions.length, color: "text-dashboard-text" },
            { label: "This month", value: thisMonth, color: "text-emerald-400" },
            { label: "This week", value: thisWeek, color: "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-dashboard-border bg-dashboard-card p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-dashboard-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Submissions gallery ── */}
      {submissions.length > 0 ? (
        <div className="dashboard-fade-in-delay-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {submissions.map((sub) => {
              const fields = sub.fields ?? {};
              const visitRaw = fields["Visitor type"];
              const visitLabel = visitRaw ? (VISIT_LABEL[visitRaw] ?? visitRaw) : null;
              const ministries = fields["Ministry interests"];
              const idx = cardIndex(sub.id);
              const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
              const accent = CARD_ACCENT[idx % CARD_ACCENT.length];
              const isOpen = expanded === sub.id;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : sub.id)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden border text-left cursor-pointer focus:outline-none"
                  style={{ borderColor: isOpen ? `${accent}50` : "rgba(255,255,255,0.07)" }}
                >
                  <div className="relative h-44 overflow-hidden" style={{ background: gradient }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold bg-white/10 text-white/90 backdrop-blur-sm">
                        {initials(sub.visitor_name, sub.visitor_email)}
                      </div>
                    </div>
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.05) 100%)" }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: accent }} />

                    {visitLabel && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#34d399" }} />
                          {visitLabel}
                        </span>
                      </div>
                    )}

                    {ministries && (
                      <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                          <Sparkles className="h-3 w-3" /> {ministries.split(",").length} interest{ministries.split(",").length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex flex-col flex-1 p-4 gap-2"
                    style={{ background: "hsl(var(--dashboard-card))" }}
                  >
                    <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: "#eef0f6" }}>
                      {sub.visitor_name ?? sub.visitor_email ?? "Unknown"}
                    </h3>
                    {sub.visitor_email && sub.visitor_name && (
                      <p className="text-xs text-dashboard-text-muted line-clamp-1 leading-relaxed">{sub.visitor_email}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="text-xs text-dashboard-text-muted">
                        {relDate(sub.created_at)}
                      </span>
                      <span className="text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: accent }}>
                        Details &rarr;
                      </span>
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 1.5px ${accent}50` }}
                  />
                </button>
              );
            })}
          </div>

          {/* Expanded detail panel */}
          {expandedSub && (
            <div className="mt-4 rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold bg-white/10 text-white/80">
                    {initials(expandedSub.visitor_name, expandedSub.visitor_email)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-dashboard-text">
                      {expandedSub.visitor_name ?? expandedSub.visitor_email ?? "Unknown"}
                    </h3>
                    <p className="text-xs text-dashboard-text-muted">
                      Submitted {new Date(expandedSub.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setExpanded(null)} className="rounded-lg p-1.5 text-dashboard-text-muted hover:text-dashboard-text transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SubmissionDetails sub={expandedSub} />
              <div className="mt-4 flex gap-2 flex-wrap">
                {expandedSub.visitor_email && (
                  <a href={`mailto:${expandedSub.visitor_email}`} className="flex items-center gap-1.5 rounded-xl border border-dashboard-border px-3 py-1.5 text-xs font-medium text-dashboard-text transition-colors hover:bg-dashboard-card-hover">
                    <Mail className="h-3.5 w-3.5 text-emerald-400" /> Email
                  </a>
                )}
                {expandedSub.visitor_email && (
                  <a href="/dashboard/people" className="flex items-center gap-1.5 rounded-xl border border-dashboard-border px-3 py-1.5 text-xs font-medium text-dashboard-text transition-colors hover:bg-dashboard-card-hover">
                    <UserCircle className="h-3.5 w-3.5 text-sky-400" /> View in People
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="dashboard-fade-in-delay-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card/50 py-16 text-center">
          <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4">
            <Users className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-dashboard-text">No submissions yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-dashboard-text-muted">
            Share your Connect Card link or QR code to start collecting responses.
          </p>
          <button
            onClick={handleCopy}
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Copy className="h-4 w-4" />
            Copy share link
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          QR Code Modal
         ══════════════════════════════════════════════════════════════════════════ */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQr(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-dashboard-text">QR Code</h2>
              <button type="button" onClick={() => setShowQr(false)} className="rounded-lg p-1.5 text-dashboard-text-muted hover:text-dashboard-text transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/qr/connect-card?id=${orgId}`} alt="Connect Card QR" width={200} height={200} className="h-48 w-48" />
              </div>
              <p className="text-xs text-dashboard-text-muted text-center">
                Scan to open the Connect Card for <strong>{orgName}</strong>
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-bg px-3 py-2 w-full">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-dashboard-text-muted" />
                <span className="flex-1 truncate text-xs text-dashboard-text-muted font-mono">{shareUrl}</span>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleCopy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm font-medium text-dashboard-text transition-colors hover:bg-dashboard-card-hover"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <a
                  href={`/api/qr/connect-card?id=${orgId}`}
                  download={`connect-card-${orgSlug}.png`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Download PNG
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          Customize Modal
         ══════════════════════════════════════════════════════════════════════════ */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-dashboard-border bg-dashboard-card shadow-2xl mx-4">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-2">
                  <Palette className="h-4 w-4 text-violet-400" />
                </div>
                <h2 className="text-base font-semibold text-dashboard-text">Customize Connect Card</h2>
              </div>
              <button type="button" onClick={() => setShowSettings(false)} className="rounded-lg p-1.5 text-dashboard-text-muted hover:text-dashboard-text transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body (scrollable) */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden">
                <div className="px-6 py-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Church className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{orgName}</h3>
                  {(welcomeHeadline || "Welcome! We\u2019re glad you\u2019re here.") && (
                    <p className="mt-1 text-xs text-white/80">{welcomeHeadline || "Welcome! We\u2019re glad you\u2019re here."}</p>
                  )}
                </div>
                <div className="bg-white px-6 py-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <div className="h-2.5 w-20 rounded bg-gray-200" />
                    <div className="h-8 rounded-lg border border-gray-200 bg-gray-50" />
                    <div className="h-2.5 w-24 rounded bg-gray-200" />
                    <div className="h-8 rounded-lg border border-gray-200 bg-gray-50" />
                  </div>
                  <div className="mt-3 h-9 rounded-lg" style={{ backgroundColor: primaryColor, opacity: 0.9 }} />
                </div>
              </div>

              {/* Primary color */}
              <div>
                <label className="block text-sm font-semibold text-dashboard-text mb-2">Primary color</label>
                <p className="text-xs text-dashboard-text-muted mb-3">Pick a preset or use the color wheel to choose any color.</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      className="h-8 w-8 rounded-lg border-2 transition-all hover:scale-110"
                      style={{
                        background: c,
                        borderColor: primaryColor === c ? "white" : "transparent",
                        boxShadow: primaryColor === c ? `0 0 0 2px ${c}60` : "none",
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-8 rounded-lg border border-dashboard-border bg-transparent cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-dashboard-text-muted">{primaryColor}</span>
                </div>
              </div>

              {/* Accent color */}
              <div>
                <label className="block text-sm font-semibold text-dashboard-text mb-2">Accent color</label>
                <p className="text-xs text-dashboard-text-muted mb-3">Used for secondary highlights and accents.</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      className="h-8 w-8 rounded-lg border-2 transition-all hover:scale-110"
                      style={{
                        background: c,
                        borderColor: accentColor === c ? "white" : "transparent",
                        boxShadow: accentColor === c ? `0 0 0 2px ${c}60` : "none",
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-8 w-8 rounded-lg border border-dashboard-border bg-transparent cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-dashboard-text-muted">{accentColor}</span>
                </div>
              </div>

              {/* Welcome text */}
              <div>
                <label className="block text-sm font-semibold text-dashboard-text mb-2">Welcome text</label>
                <input
                  type="text"
                  placeholder="Welcome! We're glad you're here."
                  value={welcomeHeadline}
                  onChange={(e) => setWelcomeHeadline(e.target.value)}
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-bg px-4 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 outline-none focus:border-emerald-500/60 mb-2"
                />
                <input
                  type="text"
                  placeholder="Subtext (optional)"
                  value={welcomeSubtext}
                  onChange={(e) => setWelcomeSubtext(e.target.value)}
                  className="w-full rounded-xl border border-dashboard-border bg-dashboard-bg px-4 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Form fields */}
              <div>
                <label className="block text-sm font-semibold text-dashboard-text mb-2">Form fields</label>
                <p className="text-xs text-dashboard-text-muted mb-3">Name and email are always required. Toggle optional fields.</p>
                <div className="space-y-1.5">
                  {TOGGLEABLE_FIELDS.map((field) => {
                    const hidden = hiddenFields.includes(field.key);
                    return (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => toggleField(field.key)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all text-left ${
                          hidden
                            ? "border-dashboard-border bg-dashboard-bg/30 text-dashboard-text-muted"
                            : "border-emerald-500/40 bg-emerald-500/10 text-dashboard-text"
                        }`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs ${
                          hidden
                            ? "bg-dashboard-border/30 text-dashboard-text-muted"
                            : "bg-emerald-500 text-white"
                        }`}>
                          {hidden ? "" : "✓"}
                        </span>
                        <span className={hidden ? "line-through opacity-50" : ""}>{field.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ministry interests */}
              <div>
                <label className="block text-sm font-semibold text-dashboard-text mb-2">Ministry interests</label>
                <div className="space-y-1.5 mb-3">
                  {ministryOptions.map((m) => (
                    <div
                      key={m.value}
                      className="flex items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-bg/30 px-4 py-2.5"
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="flex-1 text-sm font-medium text-dashboard-text">{m.label}</span>
                      <button type="button" onClick={() => removeMinistry(m.value)} className="rounded-lg p-1 text-dashboard-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Emoji"
                    value={newMinIcon}
                    onChange={(e) => setNewMinIcon(e.target.value)}
                    className="w-14 rounded-lg border border-dashboard-border bg-dashboard-bg px-2 py-1.5 text-center text-sm text-dashboard-text outline-none focus:border-emerald-500/60"
                    maxLength={4}
                  />
                  <input
                    type="text"
                    placeholder="Ministry name"
                    value={newMinLabel}
                    onChange={(e) => setNewMinLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addMinistry(); }}
                    className="flex-1 rounded-lg border border-dashboard-border bg-dashboard-bg px-3 py-1.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 outline-none focus:border-emerald-500/60"
                  />
                  <button
                    type="button"
                    onClick={addMinistry}
                    disabled={!newMinLabel.trim()}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 border-t border-dashboard-border px-6 py-4 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-xl border border-dashboard-border px-5 py-2.5 text-sm font-medium text-dashboard-text transition-colors hover:bg-dashboard-card-hover"
              >
                Cancel
              </button>
              {saveOk && <span className="text-sm text-emerald-400">Saved!</span>}
              {saveErr && <span className="text-sm text-rose-400">{saveErr}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function SubmissionDetails({ sub }: { sub: Submission }) {
  const fields = sub.fields ?? {};
  const visitRaw = fields["Visitor type"];
  const visitLabel = visitRaw ? (VISIT_LABEL[visitRaw] ?? visitRaw) : null;
  const ministries = fields["Ministry interests"];
  const hasAddress = fields["Street address"] || fields["City"] || fields["State"];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldGroup title="Contact" icon={<UserCircle className="h-4 w-4 text-emerald-400" />}>
        {sub.visitor_name && <FieldRow label="Name" value={sub.visitor_name} />}
        {sub.visitor_email && <FieldRow label="Email" value={sub.visitor_email} />}
        {sub.visitor_phone && <FieldRow label="Phone" value={sub.visitor_phone} />}
        {fields["Birthday"] && <FieldRow label="Birthday" value={fields["Birthday"]} />}
      </FieldGroup>
      {hasAddress && (
        <FieldGroup title="Address" icon={<MapPin className="h-4 w-4 text-sky-400" />}>
          {fields["Street address"] && <FieldRow label="Street" value={fields["Street address"]} />}
          {fields["City"] && <FieldRow label="City" value={fields["City"]} />}
          {fields["State"] && <FieldRow label="State" value={fields["State"]} />}
          {fields["ZIP"] && <FieldRow label="ZIP" value={fields["ZIP"]} />}
        </FieldGroup>
      )}
      <FieldGroup title="About" icon={<Heart className="h-4 w-4 text-rose-400" />}>
        {visitLabel && <FieldRow label="Visitor type" value={visitLabel} />}
        {fields["Marital status"] && <FieldRow label="Marital status" value={fields["Marital status"]} />}
        {fields["Number of children"] && <FieldRow label="Children" value={fields["Number of children"]} />}
        {fields["How did you hear?"] && <FieldRow label="How heard" value={fields["How did you hear?"]} />}
      </FieldGroup>
      {(ministries || fields["Prayer request / note"]) && (
        <FieldGroup title="Connect" icon={<Sparkles className="h-4 w-4 text-violet-400" />}>
          {ministries && (
            <div className="mt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">Ministry interests</p>
              <div className="flex flex-wrap gap-1.5">
                {ministries.split(",").map((m) => (
                  <span key={m} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-400 ring-1 ring-violet-500/20">{m.trim()}</span>
                ))}
              </div>
            </div>
          )}
          {fields["Prayer request / note"] && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1">Prayer / Note</p>
              <p className="text-xs text-dashboard-text leading-relaxed whitespace-pre-wrap">{fields["Prayer request / note"]}</p>
            </div>
          )}
        </FieldGroup>
      )}
    </div>
  );
}

function FieldGroup({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-bg/50 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] font-medium text-dashboard-text-muted w-20 shrink-0 pt-px">{label}</span>
      <span className="text-xs text-dashboard-text break-all">{value}</span>
    </div>
  );
}
