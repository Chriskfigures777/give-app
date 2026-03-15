"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send, Loader2, Users, AlertCircle, Mail,
  Eye, EyeOff, Info, MousePointerClick, Sparkles, Terminal,
  Palette, ChevronDown, Check, Type, Image, AlignLeft,
  AlignCenter, AlignRight, Bold, Italic, Upload, X, Sliders,
  PenLine, LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BROADCAST_TEMPLATES,
  FONT_FAMILIES,
  buildBroadcastHtml,
  getTemplate,
  type TemplateId,
  type FontFamily,
  type DesignOverrides,
  type LogoPosition,
  type LayoutWidth,
} from "@/lib/email/broadcast-templates";

// ─── Types ───────────────────────────────────────────────────────────────────

type BroadcastLog = {
  id: string;
  subject: string;
  recipient_count: number;
  sent_at: string;
};

type Props = { recipientCount: number; recentLogs?: BroadcastLog[]; orgName?: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  "#3b82f6", "#6366f1", "#7c3aed", "#a21caf", "#db2777",
  "#f43f5e", "#f97316", "#d97706", "#16a34a", "#0d9488",
  "#0284c7", "#0f172a", "#334155", "#64748b", "#ffffff",
];

type DesignTab = "theme" | "typography" | "logo" | "layout" | "signature";

const DESIGN_TABS: { id: DesignTab; label: string; icon: React.ReactNode }[] = [
  { id: "theme",      label: "Colors",     icon: <Palette className="h-3.5 w-3.5" /> },
  { id: "typography", label: "Typography", icon: <Type className="h-3.5 w-3.5" /> },
  { id: "logo",       label: "Logo",       icon: <Image className="h-3.5 w-3.5" /> },
  { id: "layout",     label: "Layout",     icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
  { id: "signature",  label: "Signature",  icon: <PenLine className="h-3.5 w-3.5" /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-dashboard-text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-8 w-8 rounded-lg border-2 border-white/20 shadow-sm transition-transform hover:scale-105 shrink-0"
          style={{ backgroundColor: value }}
          title={value}
        />
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <div className="flex flex-wrap gap-1">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              title={c}
              className="h-4 w-4 rounded-full border border-white/10 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                boxShadow: value === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted/60">
      {children}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BroadcastClient({ recipientCount, recentLogs = [], orgName = "Your Organization" }: Props) {
  const router = useRouter();

  // Content
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [body, setBody] = useState("");

  // Design
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>("clean-white");
  const [design, setDesign] = useState<DesignOverrides>({});
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [designTab, setDesignTab] = useState<DesignTab>("theme");

  // Logo upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // UI
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  const subjectLen = subject.trim().length;
  const canSend = subjectLen > 0 && body.trim().length > 0 && recipientCount > 0;
  const activeTemplate = getTemplate(selectedTemplateId);

  // Helpers to update a single design key
  const setD = <K extends keyof DesignOverrides>(key: K, val: DesignOverrides[K]) =>
    setDesign((prev) => ({ ...prev, [key]: val }));
  const toggleD = <K extends keyof DesignOverrides>(key: K, a: DesignOverrides[K], b: DesignOverrides[K]) =>
    setDesign((prev) => ({ ...prev, [key]: prev[key] === a ? b : a }));

  // Live preview HTML
  const previewHtml = useMemo(() => {
    return buildBroadcastHtml({
      template: activeTemplate,
      orgName,
      subject: subject || "Your email subject",
      previewText: previewText || undefined,
      body: body || "Your message will appear here.\n\nThis is a second paragraph showing how your email will look with the current design settings.",
      unsubscribeUrl: "#",
      design,
    });
  }, [activeTemplate, orgName, subject, previewText, body, design]);

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/email-logo", { method: "POST", body: formData });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      setD("logoUrl", data.url);
      setD("showLogoInHeader", false);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setError(null);
    setDevMode(false);
    setSending(true);
    try {
      const html = buildBroadcastHtml({
        template: activeTemplate,
        orgName,
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        body: body.trim(),
        unsubscribeUrl: "{{unsubscribe_url}}",
        design,
      });

      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim(), html }),
      });
      const data = await res.json() as { error?: string; id?: string; dev?: boolean; sent?: number; total?: number };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");

      if (data.dev) {
        setDevMode(true);
        if (data.id) setTimeout(() => router.push(`/dashboard/broadcast/${data.id}`), 1800);
        return;
      }

      router.push(data.id ? `/dashboard/broadcast/${data.id}` : "/dashboard/broadcast");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  // Effective resolved values for the mini-preview swatch
  const eff = {
    bg:         design.bodyBgColor   ?? activeTemplate.bg,
    cardBg:     design.cardBgColor   ?? activeTemplate.cardBg,
    headerBg:   design.headerBgColor ?? activeTemplate.headerBg,
    headerTxt:  design.headerTextColor ?? activeTemplate.headerTextColor,
    accent:     design.accentColor   ?? activeTemplate.accent,
    muted:      design.footerTextColor ?? activeTemplate.mutedColor,
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* ── Left: Compose + Design ─────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Error / dev banners */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}
        {devMode && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3.5">
            <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-400">Dev mode — email logged to terminal</p>
              <p className="mt-0.5 text-xs text-amber-400/70">
                Add <code className="font-mono">RESEND_API_KEY</code> to{" "}
                <code className="font-mono">.env.local</code> to send real emails.
              </p>
            </div>
          </div>
        )}

        {/* ══ DESIGN PANEL ══ */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          {/* Panel toggle header */}
          <button
            type="button"
            onClick={() => setShowDesignPanel((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-3.5 hover:bg-dashboard-card-hover/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15">
                <Sliders className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-dashboard-text">Design &amp; Template</span>
                <span className="rounded-full bg-dashboard-card-hover px-2 py-0.5 text-xs text-dashboard-text-muted border border-dashboard-border">
                  {activeTemplate.name}
                </span>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-dashboard-text-muted transition-transform ${showDesignPanel ? "rotate-180" : ""}`} />
          </button>

          {showDesignPanel && (
            <div className="border-t border-dashboard-border">

              {/* ── Template style picker ── */}
              <div className="px-5 pt-4 pb-2">
                <SectionLabel>Email style</SectionLabel>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {BROADCAST_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        setDesign((prev) => ({
                          ...prev,
                          accentColor: undefined,
                          headerBgColor: undefined,
                          headerTextColor: undefined,
                          bodyBgColor: undefined,
                          cardBgColor: undefined,
                        }));
                      }}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                        selectedTemplateId === tmpl.id
                          ? "border-blue-500/50 bg-blue-500/8 ring-1 ring-blue-500/30"
                          : "border-dashboard-border hover:border-dashboard-border-light hover:bg-dashboard-card-hover/30"
                      }`}
                    >
                      {/* Color swatch thumbnail */}
                      <div className="w-full rounded-lg overflow-hidden" style={{ backgroundColor: tmpl.bg, border: `1px solid ${tmpl.mutedColor}33` }}>
                        <div className="w-full py-1.5" style={{ backgroundColor: tmpl.headerBg }}>
                          <div className="h-1 w-8 rounded-full mx-auto" style={{ backgroundColor: tmpl.headerTextColor, opacity: 0.8 }} />
                        </div>
                        <div className="px-1.5 py-2 space-y-1" style={{ backgroundColor: tmpl.cardBg }}>
                          <div className="h-1 rounded-full w-full" style={{ backgroundColor: tmpl.textColor, opacity: 0.25 }} />
                          <div className="h-1 rounded-full w-3/4" style={{ backgroundColor: tmpl.textColor, opacity: 0.15 }} />
                        </div>
                      </div>
                      <p className="text-[10px] font-medium text-dashboard-text leading-tight">{tmpl.name}</p>
                      {selectedTemplateId === tmpl.id && (
                        <div className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Tab strip ── */}
              <div className="flex gap-0.5 border-y border-dashboard-border bg-dashboard-card-hover/20 px-5 py-2">
                {DESIGN_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDesignTab(tab.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      designTab === tab.id
                        ? "bg-dashboard-card text-dashboard-text border border-dashboard-border shadow-sm"
                        : "text-dashboard-text-muted hover:text-dashboard-text"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Tab content ── */}
              <div className="px-5 py-4 space-y-5">

                {/* COLORS TAB */}
                {designTab === "theme" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ColorSwatch
                        label="Header background"
                        value={eff.headerBg}
                        onChange={(v) => setD("headerBgColor", v)}
                      />
                      <ColorSwatch
                        label="Header text"
                        value={eff.headerTxt}
                        onChange={(v) => setD("headerTextColor", v)}
                      />
                      <ColorSwatch
                        label="Email background"
                        value={eff.bg}
                        onChange={(v) => setD("bodyBgColor", v)}
                      />
                      <ColorSwatch
                        label="Card / content background"
                        value={eff.cardBg}
                        onChange={(v) => setD("cardBgColor", v)}
                      />
                      <ColorSwatch
                        label="Body text color"
                        value={design.bodyTextColor ?? activeTemplate.textColor}
                        onChange={(v) => setD("bodyTextColor", v)}
                      />
                      <ColorSwatch
                        label="Accent / link color"
                        value={eff.accent}
                        onChange={(v) => setD("accentColor", v)}
                      />
                      <ColorSwatch
                        label="Footer text color"
                        value={eff.muted}
                        onChange={(v) => setD("footerTextColor", v)}
                      />
                    </div>
                  </div>
                )}

                {/* TYPOGRAPHY TAB */}
                {designTab === "typography" && (
                  <div className="space-y-5">
                    <div>
                      <SectionLabel>Font family</SectionLabel>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {FONT_FAMILIES.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setD("fontFamily", f.id as FontFamily)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all ${
                              (design.fontFamily ?? activeTemplate.defaultFont) === f.id
                                ? "border-blue-500/50 bg-blue-500/8 ring-1 ring-blue-500/30"
                                : "border-dashboard-border hover:border-dashboard-border-light hover:bg-dashboard-card-hover/30"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-dashboard-text truncate">{f.label}</p>
                              <p className="text-[11px] text-dashboard-text-muted mt-0.5" style={{ fontFamily: f.stack }}>
                                The quick brown fox
                              </p>
                            </div>
                            {(design.fontFamily ?? activeTemplate.defaultFont) === f.id && (
                              <Check className="ml-auto h-3.5 w-3.5 text-blue-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <SectionLabel>Body font size</SectionLabel>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={12}
                            max={22}
                            step={1}
                            value={design.bodyFontSize ?? 16}
                            onChange={(e) => setD("bodyFontSize", Number(e.target.value))}
                            className="flex-1 accent-blue-500"
                          />
                          <span className="w-10 shrink-0 rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 py-1 text-center text-xs font-semibold text-dashboard-text">
                            {design.bodyFontSize ?? 16}px
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-dashboard-text-muted">
                          <span>12px</span><span>22px</span>
                        </div>
                      </div>

                      <div>
                        <SectionLabel>Line height</SectionLabel>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={1.2}
                            max={2.2}
                            step={0.1}
                            value={design.bodyLineHeight ?? 1.7}
                            onChange={(e) => setD("bodyLineHeight", Number(e.target.value))}
                            className="flex-1 accent-blue-500"
                          />
                          <span className="w-10 shrink-0 rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 py-1 text-center text-xs font-semibold text-dashboard-text">
                            {(design.bodyLineHeight ?? 1.7).toFixed(1)}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-dashboard-text-muted">
                          <span>Tight</span><span>Loose</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <SectionLabel>Text style</SectionLabel>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleD("bodyFontWeight", "bold", "normal")}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                            design.bodyFontWeight === "bold"
                              ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                              : "border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text"
                          }`}
                        >
                          <Bold className="h-3.5 w-3.5" /> Bold
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleD("bodyFontStyle", "italic", "normal")}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                            design.bodyFontStyle === "italic"
                              ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                              : "border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text"
                          }`}
                        >
                          <Italic className="h-3.5 w-3.5" /> Italic
                        </button>
                      </div>
                    </div>

                    <div>
                      <SectionLabel>Header text</SectionLabel>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={design.headerText ?? ""}
                          onChange={(e) => setD("headerText", e.target.value)}
                          placeholder={orgName}
                          maxLength={60}
                          className="rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none focus:border-blue-500/50"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={14}
                            max={36}
                            step={1}
                            value={design.headerFontSize ?? 22}
                            onChange={(e) => setD("headerFontSize", Number(e.target.value))}
                            className="flex-1 accent-blue-500"
                          />
                          <span className="w-12 shrink-0 rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 py-1 text-center text-xs font-semibold text-dashboard-text">
                            {design.headerFontSize ?? 22}px
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* LOGO TAB */}
                {designTab === "logo" && (
                  <div className="space-y-4">
                    {/* Upload area */}
                    <div>
                      <SectionLabel>Organization logo</SectionLabel>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="sr-only"
                      />

                      {design.logoUrl ? (
                        <div className="relative flex items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-card-hover/20 p-3">
                          <img
                            src={design.logoUrl}
                            alt="Logo preview"
                            className="h-12 max-w-[160px] rounded-lg object-contain border border-dashboard-border bg-white/5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-dashboard-text truncate">Logo uploaded</p>
                            <button
                              type="button"
                              onClick={() => setLogoInputRef()}
                              className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              Change logo
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDesign((prev) => ({ ...prev, logoUrl: undefined }))}
                            className="rounded-lg p-1.5 text-dashboard-text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={logoUploading}
                          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-dashboard-border bg-dashboard-card-hover/10 py-6 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5 disabled:opacity-50"
                        >
                          {logoUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                          ) : (
                            <Upload className="h-6 w-6 text-dashboard-text-muted" />
                          )}
                          <div className="text-center">
                            <p className="text-sm font-medium text-dashboard-text">
                              {logoUploading ? "Uploading…" : "Upload your logo"}
                            </p>
                            <p className="text-xs text-dashboard-text-muted">PNG, JPG, WebP, or SVG · Max 3MB</p>
                          </div>
                        </button>
                      )}

                      {logoError && (
                        <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {logoError}
                        </p>
                      )}
                    </div>

                    {design.logoUrl && (
                      <>
                        {/* Logo placement */}
                        <div>
                          <SectionLabel>Logo placement</SectionLabel>
                          <div className="flex gap-2">
                            {[
                              { id: "header", label: "In header bar", icon: null },
                              { id: "above", label: "Above body", icon: null },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setD("showLogoInHeader", opt.id === "header")}
                                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                  (design.showLogoInHeader ?? false) === (opt.id === "header")
                                    ? "border-blue-500/50 bg-blue-500/8 text-blue-400"
                                    : "border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Logo alignment (only when above body) */}
                        {!(design.showLogoInHeader ?? false) && (
                          <div>
                            <SectionLabel>Logo alignment</SectionLabel>
                            <div className="flex gap-2">
                              {(["left", "center", "right"] as LogoPosition[]).map((pos) => {
                                const Icon = pos === "left" ? AlignLeft : pos === "center" ? AlignCenter : AlignRight;
                                return (
                                  <button
                                    key={pos}
                                    type="button"
                                    onClick={() => setD("logoPosition", pos)}
                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all ${
                                      (design.logoPosition ?? "center") === pos
                                        ? "border-blue-500/50 bg-blue-500/8 text-blue-400"
                                        : "border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text"
                                    }`}
                                  >
                                    <Icon className="h-3.5 w-3.5" /> {pos}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Logo size */}
                        <div>
                          <SectionLabel>Logo height</SectionLabel>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={30}
                              max={120}
                              step={5}
                              value={design.logoHeight ?? 60}
                              onChange={(e) => setD("logoHeight", Number(e.target.value))}
                              className="flex-1 accent-blue-500"
                            />
                            <span className="w-12 shrink-0 rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 py-1 text-center text-xs font-semibold text-dashboard-text">
                              {design.logoHeight ?? 60}px
                            </span>
                          </div>
                        </div>

                        {/* Logo alt text */}
                        <div>
                          <SectionLabel>Alt text (accessibility)</SectionLabel>
                          <input
                            type="text"
                            value={design.logoAltText ?? ""}
                            onChange={(e) => setD("logoAltText", e.target.value)}
                            placeholder={orgName}
                            className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* LAYOUT TAB */}
                {designTab === "layout" && (
                  <div className="space-y-5">
                    <div>
                      <SectionLabel>Email width</SectionLabel>
                      <div className="flex gap-2">
                        {(["narrow", "standard", "wide"] as LayoutWidth[]).map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setD("layoutWidth", w)}
                            className={`flex-1 rounded-lg border px-3 py-2.5 text-center text-xs font-medium capitalize transition-all ${
                              (design.layoutWidth ?? "standard") === w
                                ? "border-blue-500/50 bg-blue-500/8 text-blue-400"
                                : "border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text"
                            }`}
                          >
                            <p>{w}</p>
                            <p className="mt-0.5 text-[10px] opacity-60">
                              {w === "narrow" ? "480px" : w === "standard" ? "600px" : "680px"}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <SectionLabel>Card corner radius</SectionLabel>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={24}
                          step={2}
                          value={design.borderRadius ?? 12}
                          onChange={(e) => setD("borderRadius", Number(e.target.value))}
                          className="flex-1 accent-blue-500"
                        />
                        <span className="w-12 shrink-0 rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 py-1 text-center text-xs font-semibold text-dashboard-text">
                          {design.borderRadius ?? 12}px
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-dashboard-text-muted">
                        <span>Square</span><span>Rounded</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <SectionLabel>Options</SectionLabel>
                      {[
                        { key: "showHeader" as keyof DesignOverrides, def: true, label: "Show header bar" },
                        { key: "showDivider" as keyof DesignOverrides, def: true, label: "Show divider line above footer" },
                      ].map(({ key, def, label }) => {
                        const on = (design[key] as boolean | undefined) ?? def;
                        return (
                          <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={on}
                              onClick={() => setD(key, !on as DesignOverrides[typeof key])}
                              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${on ? "bg-blue-600" : "bg-dashboard-border"}`}
                            >
                              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                            <span className="text-xs font-medium text-dashboard-text">{label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div>
                      <SectionLabel>Footer text</SectionLabel>
                      <input
                        type="text"
                        value={design.footerText ?? ""}
                        onChange={(e) => setD("footerText", e.target.value)}
                        placeholder={`${orgName} · Sent with Exchange`}
                        maxLength={100}
                        className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                )}

                {/* SIGNATURE TAB */}
                {designTab === "signature" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={design.showSignature ?? false}
                        onClick={() => setD("showSignature", !(design.showSignature ?? false))}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${design.showSignature ? "bg-blue-600" : "bg-dashboard-border"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${design.showSignature ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                      <span className="text-sm font-medium text-dashboard-text">Include email signature</span>
                    </div>

                    {design.showSignature && (
                      <div className="space-y-3 rounded-xl border border-dashboard-border bg-dashboard-card-hover/20 p-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-dashboard-text-muted">Name</label>
                          <input
                            type="text"
                            value={design.signatureName ?? ""}
                            onChange={(e) => setD("signatureName", e.target.value)}
                            placeholder="Pastor John Smith"
                            maxLength={80}
                            className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-dashboard-text-muted">Title / Role</label>
                          <input
                            type="text"
                            value={design.signatureTitle ?? ""}
                            onChange={(e) => setD("signatureTitle", e.target.value)}
                            placeholder="Senior Pastor, Zion Church"
                            maxLength={100}
                            className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-dashboard-text-muted">Phone (optional)</label>
                          <input
                            type="text"
                            value={design.signaturePhone ?? ""}
                            onChange={(e) => setD("signaturePhone", e.target.value)}
                            placeholder="(555) 123-4567"
                            maxLength={30}
                            className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>

                        {/* Live signature preview */}
                        {(design.signatureName || design.signatureTitle) && (
                          <div className="rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2.5 mt-1">
                            <p className="text-[10px] uppercase tracking-wider font-medium text-dashboard-text-muted mb-1.5">Preview</p>
                            {design.signatureName && <p className="text-sm font-bold text-dashboard-text">{design.signatureName}</p>}
                            {design.signatureTitle && <p className="text-xs text-dashboard-text-muted">{design.signatureTitle}</p>}
                            {design.signaturePhone && <p className="text-xs text-dashboard-text-muted">{design.signaturePhone}</p>}
                          </div>
                        )}
                      </div>
                    )}

                    {!design.showSignature && (
                      <p className="text-xs text-dashboard-text-muted leading-relaxed rounded-xl border border-dashed border-dashboard-border p-3">
                        Add a personal signature — your name, title, and phone — that appears at the bottom of every email you send.
                      </p>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* ══ COMPOSE CARD ══ */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-dashboard-border px-5 py-3.5 bg-dashboard-card-hover/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-dashboard-text">Compose email</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-dashboard-border px-3 py-1.5 text-xs font-medium text-dashboard-text-muted transition-colors hover:border-dashboard-border-light hover:text-dashboard-text"
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "Edit" : "Preview email"}
            </button>
          </div>

          {showPreview ? (
            <div className="p-5">
              <div className="mx-auto max-w-xl overflow-hidden rounded-xl border border-dashboard-border shadow-sm">
                <iframe
                  srcDoc={previewHtml}
                  title="Email preview"
                  className="w-full"
                  style={{ height: 580, border: "none", display: "block" }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <div className="divide-y divide-dashboard-border">
              {/* To */}
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="w-20 shrink-0 text-xs font-medium text-dashboard-text-muted">To</span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-dashboard-border bg-dashboard-card-hover/60 px-3 py-1">
                    <Users className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-medium text-dashboard-text">
                      {recipientCount} subscriber{recipientCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {recipientCount === 0 && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <Info className="h-3 w-3" /> No subscribers yet
                    </span>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="w-20 shrink-0 text-xs font-medium text-dashboard-text-muted">Subject</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Write a compelling subject line…"
                  maxLength={150}
                  className="min-w-0 flex-1 bg-transparent text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none"
                />
                {subjectLen > 0 && (
                  <span className={`shrink-0 text-xs tabular-nums ${subjectLen > 60 ? "text-amber-400" : "text-dashboard-text-muted"}`}>
                    {subjectLen}/60
                  </span>
                )}
              </div>

              {/* Preview text */}
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="w-20 shrink-0 text-xs font-medium text-dashboard-text-muted">Preview</span>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Short teaser shown in inbox (optional)"
                  maxLength={200}
                  className="min-w-0 flex-1 bg-transparent text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none"
                />
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={"Write your message here…\n\nKeep it personal and relevant. Tell your community what's happening and why it matters.\n\nBlank lines create new paragraphs in the email."}
                  rows={13}
                  className="w-full resize-none bg-transparent text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-dashboard-border bg-dashboard-card-hover/20 px-5 py-3">
            <p className="text-xs text-dashboard-text-muted flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
              Unsubscribe link added automatically.
            </p>
            <Button
              onClick={handleSend}
              disabled={sending || !canSend}
              className="shrink-0 gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : `Send to ${recipientCount.toLocaleString()}`}
            </Button>
          </div>
        </div>

        {/* Writing tips */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-dashboard-text">Tips for better open rates</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { icon: "✉️", tip: "Keep subject lines under 50 characters for best visibility on mobile." },
              { icon: "⏰", tip: "Tuesday–Thursday mornings tend to have the highest open rates." },
              { icon: "💬", tip: "Use a personal preview text — it's the first thing readers see after the subject." },
            ].map((t) => (
              <div key={t.tip} className="flex items-start gap-2 rounded-xl bg-dashboard-card-hover/40 px-3 py-2.5">
                <span className="text-sm shrink-0">{t.icon}</span>
                <p className="text-xs text-dashboard-text-muted leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right sidebar ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Live mini email preview */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          <div className="border-b border-dashboard-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dashboard-text">Live preview</h3>
            <p className="text-xs text-dashboard-text-muted">{activeTemplate.name}</p>
          </div>
          <div className="p-3">
            <div className="w-full rounded-xl overflow-hidden" style={{ backgroundColor: eff.bg, border: `1px solid ${eff.muted}33` }}>
              {(design.showHeader ?? true) && (
                <div className="w-full px-4 py-3 text-center" style={{ backgroundColor: eff.headerBg }}>
                  {design.logoUrl && (design.showLogoInHeader ?? false) ? (
                    <img src={design.logoUrl} alt="Logo" className="h-8 max-w-[100px] mx-auto object-contain" />
                  ) : (
                    <p className="text-xs font-bold truncate" style={{ color: eff.headerTxt }}>
                      {design.headerText || orgName}
                    </p>
                  )}
                </div>
              )}
              {design.logoUrl && !(design.showLogoInHeader ?? false) && (
                <div className={`px-3 pt-2 ${design.logoPosition === "left" ? "text-left" : design.logoPosition === "right" ? "text-right" : "text-center"}`} style={{ backgroundColor: eff.cardBg }}>
                  <img src={design.logoUrl} alt="Logo" className="inline-block h-6 max-w-[80px] object-contain" />
                </div>
              )}
              <div className="px-4 py-4 space-y-2" style={{ backgroundColor: eff.cardBg }}>
                <div className="h-2 rounded w-full" style={{ backgroundColor: design.bodyTextColor ?? activeTemplate.textColor, opacity: 0.2 }} />
                <div className="h-2 rounded w-5/6" style={{ backgroundColor: design.bodyTextColor ?? activeTemplate.textColor, opacity: 0.15 }} />
                <div className="h-2 rounded w-4/6" style={{ backgroundColor: design.bodyTextColor ?? activeTemplate.textColor, opacity: 0.15 }} />
              </div>
              <div className="px-4 pt-2 pb-3 text-center" style={{ backgroundColor: eff.cardBg, borderTop: `1px solid ${eff.muted}33` }}>
                <div className="h-1.5 rounded w-3/5 mx-auto" style={{ backgroundColor: eff.muted, opacity: 0.4 }} />
                <div className="h-1.5 rounded w-2/5 mx-auto mt-1.5" style={{ backgroundColor: eff.accent, opacity: 0.6 }} />
              </div>
            </div>
          </div>
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: eff.headerBg }} />
            <div className="h-3 w-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: eff.accent }} />
            <div className="h-3 w-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: eff.cardBg }} />
            <p className="ml-auto text-xs text-dashboard-text-muted">
              {FONT_FAMILIES.find((f) => f.id === (design.fontFamily ?? activeTemplate.defaultFont))?.label.split(" ")[0]}
            </p>
          </div>
        </div>

        {/* Audience card */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          <div className="border-b border-dashboard-border px-5 py-3">
            <h3 className="text-sm font-semibold text-dashboard-text">Your audience</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 shrink-0">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-dashboard-text">{recipientCount.toLocaleString()}</p>
                <p className="text-xs text-dashboard-text-muted">active subscriber{recipientCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {recipientCount === 0 ? (
              <div className="rounded-xl border border-dashed border-dashboard-border bg-dashboard-card-hover/30 p-3 space-y-1.5">
                <p className="text-xs font-medium text-dashboard-text">Grow your list</p>
                {["Accept donations on your page", "Share a contact form", "Send out a survey"].map((item) => (
                  <p key={item} className="flex items-start gap-1.5 text-xs text-dashboard-text-muted">
                    <span className="mt-0.5 shrink-0 text-blue-400">›</span> {item}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-dashboard-text-muted">
                  <span>Deliverable</span>
                  <span className="font-medium text-emerald-400">{recipientCount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-dashboard-border overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-blue-400">About broadcasts</span>
          </div>
          <p className="text-xs text-dashboard-text-muted leading-relaxed">
            Each broadcast gets its own campaign page with delivery stats once sent. Contacts who unsubscribe are removed automatically.
          </p>
        </div>
      </div>
    </div>
  );

  // Helper for logo change button
  function setLogoInputRef() {
    logoInputRef.current?.click();
  }
}
