"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Settings2,
  Type,
  Layout,
  Palette,
  Share2,
  Eye,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import { DonationForm } from "@/app/give/[slug]/donation-form";
import { FormCardMedia } from "@/components/form-card-media";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import {
  FORM_FONT_OPTIONS,
  getFontFamily,
  getHeaderFontWeight,
  getGoogleFontUrl,
} from "@/lib/form-fonts";
import type { DesignSet } from "@/lib/stock-media";
import {
  MAX_DESIGN_SETS,
  STOCK_IMAGE_OPTIONS,
  STOCK_VIDEO_OPTIONS,
  PEXELS_VIDEO_SEARCH_URL,
} from "@/lib/stock-media";
import { isPexelsUrl } from "@/lib/pexels";

const PRESET_AMOUNTS = [10, 12, 25, 50, 100, 250, 500, 1000];

type Campaign = { id: string; name: string; suggested_amounts: unknown; minimum_amount_cents: number | null; allow_recurring: boolean | null };
type EndowmentFund = { id: string; name: string };

function defaultDesignSet(overrides?: Partial<DesignSet>): DesignSet {
  return {
    media_type: "image",
    media_url: null,
    title: null,
    subtitle: null,
    ...overrides,
  };
}

type Props = {
  organizationId: string;
  organizationName: string;
  slug: string;
  baseUrl: string;
  campaigns: Campaign[];
  endowmentFunds: EndowmentFund[];
  suggestedAmounts: number[];
  minimumAmountCents: number;
  showEndowmentSelection: boolean;
  allowCustomAmount: boolean;
  initialHeaderText: string;
  initialSubheaderText: string;
  initialThankYouMessage?: string | null;
  initialButtonColor: string | null;
  initialButtonTextColor: string | null;
  headerImageUrl?: string | null;
  primaryColor?: string | null;
  initialBorderRadius?: string | null;
  initialFontFamily?: string | null;
  /** Up to 3 design sets (cards). When null/empty, single header is used. */
  initialDesignSets?: DesignSet[] | null;
};

export function EmbedFormClient({
  organizationId,
  organizationName,
  slug,
  baseUrl,
  campaigns,
  endowmentFunds,
  suggestedAmounts: serverSuggestedAmounts,
  minimumAmountCents,
  showEndowmentSelection,
  allowCustomAmount: serverAllowCustomAmount,
  initialHeaderText,
  initialSubheaderText,
  initialThankYouMessage,
  initialButtonColor,
  initialButtonTextColor,
  headerImageUrl,
  primaryColor,
  initialBorderRadius,
  initialFontFamily,
  initialDesignSets,
}: Props) {
  const router = useRouter();
  const initialSets = useMemo(() => {
    if (initialDesignSets?.length) {
      return initialDesignSets.slice(0, MAX_DESIGN_SETS).map((s) => ({
        media_type: s.media_type ?? "image",
        media_url: s.media_url ?? null,
        title: s.title ?? null,
        subtitle: s.subtitle ?? null,
      }));
    }
    return [
      defaultDesignSet({
        media_type: "image",
        media_url: headerImageUrl ?? null,
        title: initialHeaderText || null,
        subtitle: initialSubheaderText || null,
      }),
    ];
  }, [initialDesignSets, headerImageUrl, initialHeaderText, initialSubheaderText]);

  const [suggestedAmounts, setSuggestedAmounts] =
    useState<number[]>(serverSuggestedAmounts);
  const [allowCustomAmount, setAllowCustomAmount] =
    useState(serverAllowCustomAmount);
  const [headerText, setHeaderText] = useState(initialHeaderText);
  const [subheaderText, setSubheaderText] = useState(initialSubheaderText);
  const [thankYouMessage, setThankYouMessage] = useState(initialThankYouMessage ?? "Thank you for your donation!");
  const [buttonColor, setButtonColor] = useState(initialButtonColor ?? "");
  const [buttonTextColor, setButtonTextColor] = useState(
    initialButtonTextColor ?? ""
  );
  const [headerImageUrlInput, setHeaderImageUrlInput] = useState(
    headerImageUrl ?? ""
  );
  const [fontFamilyKey, setFontFamilyKey] = useState(initialFontFamily ?? "");
  const [designSets, setDesignSets] = useState<DesignSet[]>(initialSets);
  const [numSets, setNumSets] = useState(() => Math.min(initialSets.length, MAX_DESIGN_SETS));
  // Parse initial radius (e.g. "12px" -> 12) for slider; default 8
  const parseRadiusPx = (s: string | null | undefined): number => {
    if (!s?.trim()) return 8;
    const m = s.trim().match(/^(\d+)px$/i);
    return m ? Math.min(24, Math.max(0, parseInt(m[1], 10))) : 8;
  };
  const [radiusPx, setRadiusPx] = useState(() =>
    parseRadiusPx(initialBorderRadius)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingIndex, setResolvingIndex] = useState<number | null>(null);

  // Sync designSets when numSets changes: pad or trim to numSets
  useEffect(() => {
    setDesignSets((prev) => {
      const next = [...prev];
      while (next.length < numSets) {
        next.push(defaultDesignSet());
      }
      return next.slice(0, numSets);
    });
  }, [numSets]);

  // Sync local state when server props change (e.g. after save + refresh)
  useEffect(() => {
    setSuggestedAmounts(serverSuggestedAmounts);
    setAllowCustomAmount(serverAllowCustomAmount);
    setHeaderText(initialHeaderText);
    setSubheaderText(initialSubheaderText);
    setThankYouMessage(initialThankYouMessage ?? "Thank you for your donation!");
    setButtonColor(initialButtonColor ?? "");
    setButtonTextColor(initialButtonTextColor ?? "");
    setHeaderImageUrlInput(headerImageUrl ?? "");
    setRadiusPx(parseRadiusPx(initialBorderRadius));
    setFontFamilyKey(initialFontFamily ?? "");
    setDesignSets(initialSets);
    setNumSets(Math.min(initialSets.length || 1, MAX_DESIGN_SETS));
  }, [
    serverSuggestedAmounts,
    serverAllowCustomAmount,
    initialHeaderText,
    initialSubheaderText,
    initialThankYouMessage,
    initialButtonColor,
    initialButtonTextColor,
    headerImageUrl,
    initialBorderRadius,
    initialFontFamily,
    initialSets,
  ]);

  // Load Google Font in preview when a Google font is selected
  useEffect(() => {
    const url = getGoogleFontUrl(fontFamilyKey);
    if (!url) return;
    const id = "embed-preview-google-font";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = url;
    return () => {
      link?.remove();
    };
  }, [fontFamilyKey]);

  const giveLink = `${baseUrl}/give/${slug}`;
  const embedUrl = `${baseUrl}/give/${slug}/embed`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" title="Donate to ${slug}"></iframe>`;

  function toggleAmount(n: number) {
    setSuggestedAmounts((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n).sort((a, b) => a - b) : [...prev, n].sort((a, b) => a - b)
    );
  }

  function updateSet(index: number, patch: Partial<DesignSet>) {
    setDesignSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  async function resolvePexelsUrl(index: number, url: string, intendedType: "image" | "video") {
    if (!url?.trim() || !isPexelsUrl(url)) return;
    setResolvingIndex(index);
    try {
      const res = await fetch("/api/pexels-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), type: intendedType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to resolve");
      const { mediaUrl, mediaType } = data;
      updateSet(index, {
        media_url: mediaUrl,
        media_type: mediaType, // Auto-switch if URL type differs from selection
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve Pexels URL");
    } finally {
      setResolvingIndex(null);
    }
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    setSaved(false);
    const setsPayload =
      designSets.length > 0
        ? designSets.map((s) => ({
            media_type: s.media_type,
            media_url: s.media_url?.trim() || null,
            title: s.title?.trim() || null,
            subtitle: s.subtitle?.trim() || null,
          }))
        : null;
    const firstSet = designSets[0];
    try {
      const res = await fetch("/api/form-customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          organizationId,
          suggested_amounts: suggestedAmounts,
          allow_custom_amount: allowCustomAmount,
          header_text: firstSet?.title ?? (headerText || undefined),
          subheader_text: firstSet?.subtitle ?? (subheaderText || undefined),
          thank_you_message: thankYouMessage.trim() || undefined,
          header_image_url:
            firstSet?.media_type === "image" && firstSet?.media_url
              ? firstSet.media_url
              : headerImageUrlInput.trim() || null,
          button_border_radius: `${radiusPx}px`,
          button_color: buttonColor || undefined,
          button_text_color: buttonTextColor || undefined,
          font_family: fontFamilyKey.trim() || undefined,
          design_sets: setsPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const formRadius = `${radiusPx}px`;
  const previewFontFamily = getFontFamily(fontFamilyKey);
  const previewHeaderFontWeight = getHeaderFontWeight(fontFamilyKey);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(giveLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };
  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(iframeCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* LEFT: Settings panel */}
      <div className="w-full lg:max-w-[420px] lg:shrink-0 space-y-6 customization-panel">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Form settings</h2>
              <p className="mt-1 text-sm text-slate-500">Changes update the preview. Save to apply to the live form.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="panel-card overflow-hidden p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-emerald-600" />
            <h3 className="panel-section-title mb-0">Content</h3>
          </div>
          <div className="panel-row space-y-2">
            <label className="panel-field-label">Suggested amounts (USD)</label>
            <p className="panel-field-hint">Tap to toggle preset buttons. Givers can enter a custom amount if enabled below.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_AMOUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleAmount(n)}
                  className={`inline-flex items-center justify-center min-w-[2.75rem] px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 select-none ${
                    suggestedAmounts.includes(n)
                      ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm hover:bg-emerald-100"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  ${n}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-row flex items-center justify-between gap-4">
            <div>
              <span className="panel-field-label">Allow custom amount</span>
              <p className="panel-field-hint">Show a field so givers can enter any amount.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowCustomAmount}
              data-state={allowCustomAmount ? "on" : "off"}
              className="toggle-track shrink-0"
              onClick={() => setAllowCustomAmount((v) => !v)}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          <div className="panel-row">
            <label className="panel-field-label">Header text</label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Make a Donation"
              className="panel-input mt-1"
            />
          </div>
          <div className="panel-row">
            <label className="panel-field-label">Subheader text</label>
            <input
              type="text"
              value={subheaderText}
              onChange={(e) => setSubheaderText(e.target.value)}
              placeholder="Support our mission"
              className="panel-input mt-1"
            />
          </div>
          <div className="panel-row">
            <label className="panel-field-label">Thank-you message</label>
            <textarea
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              placeholder="Thank you for your donation!"
              rows={3}
              className="panel-input mt-1 w-full"
            />
            <p className="panel-field-hint">Shown on the confirmation page after a successful donation.</p>
          </div>
          <div className="panel-row">
            <label className="panel-field-label">Header image URL</label>
            <input
              type="url"
              value={headerImageUrlInput}
              onChange={(e) => setHeaderImageUrlInput(e.target.value)}
              placeholder="https://…"
              className="panel-input mt-1"
            />
            <p className="panel-field-hint">Unsplash or Pexels direct link. Leave empty for default.</p>
          </div>
        </div>

        {/* Design sets */}
        <div className="panel-card overflow-hidden p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-emerald-600" />
            <h3 className="panel-section-title mb-0">Design sets</h3>
          </div>
          <p className="panel-field-hint">Use 1–3 cards (sets) per design. Each set can have an image or video, plus title and subtitle.</p>
          <div className="panel-row">
            <label className="panel-field-label">Number of sets</label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumSets(n)}
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border text-sm font-semibold transition-all ${
                    numSets === n
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {designSets.slice(0, numSets).map((set, index) => (
            <div key={index} className="panel-row p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/40">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200/80 text-xs font-bold text-slate-600">
                  {index + 1}
                </span>
                Set {index + 1}
              </h4>
              <div>
                <label className="panel-field-label">Media type</label>
                <select
                  value={set.media_type}
                  onChange={(e) => updateSet(index, { media_type: e.target.value as "image" | "video" })}
                  className="panel-input mt-1 max-w-[180px]"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              {set.media_type === "image" ? (
                <div>
                  <label className="panel-field-label">Image (stock, Pexels, or URL)</label>
                  <select
                    value={STOCK_IMAGE_OPTIONS.find((o) => o.value === set.media_url)?.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSet(index, { media_url: v || null });
                    }}
                    className="panel-input mt-1 max-w-full"
                  >
                    {STOCK_IMAGE_OPTIONS.map((o) => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      value={set.media_url ?? ""}
                      onChange={(e) => updateSet(index, { media_url: e.target.value || null })}
                      placeholder="Or paste Pexels/Unsplash image URL"
                      className="panel-input flex-1 min-w-0"
                    />
                    {isPexelsUrl(set.media_url ?? "") && (
                      <button
                        type="button"
                        onClick={() => resolvePexelsUrl(index, set.media_url ?? "", "image")}
                        disabled={resolvingIndex === index}
                        className="shrink-0 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                      >
                        {resolvingIndex === index ? "Resolving…" : "Resolve"}
                      </button>
                    )}
                  </div>
                  <p className="panel-field-hint mt-1">
                    Paste a direct image URL or a Pexels photo page (e.g. pexels.com/photo/...) and click Resolve.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="panel-field-label">Video (stock, Pexels, or URL)</label>
                  <select
                    value={STOCK_VIDEO_OPTIONS.find((o) => o.value === set.media_url)?.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSet(index, { media_url: v || null });
                    }}
                    className="panel-input mt-1 max-w-full"
                  >
                    {STOCK_VIDEO_OPTIONS.map((o) => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      value={set.media_url ?? ""}
                      onChange={(e) => updateSet(index, { media_url: e.target.value || null })}
                      placeholder="Or paste Pexels video URL"
                      className="panel-input flex-1 min-w-0"
                    />
                    {isPexelsUrl(set.media_url ?? "") && (
                      <button
                        type="button"
                        onClick={() => resolvePexelsUrl(index, set.media_url ?? "", "video")}
                        disabled={resolvingIndex === index}
                        className="shrink-0 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                      >
                        {resolvingIndex === index ? "Resolving…" : "Resolve"}
                      </button>
                    )}
                  </div>
                  <p className="panel-field-hint mt-1">
                    Paste a Pexels video page URL (e.g. pexels.com/video/...) and click Resolve, or{" "}
                    <a href={PEXELS_VIDEO_SEARCH_URL} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      find free videos on Pexels →
                    </a>
                  </p>
                </div>
              )}
              <div>
                <label className="panel-field-label">Title</label>
                <input
                  type="text"
                  value={set.title ?? ""}
                  onChange={(e) => updateSet(index, { title: e.target.value || null })}
                  placeholder="Make a Donation"
                  className="panel-input mt-1"
                />
              </div>
              <div>
                <label className="panel-field-label">Subtitle</label>
                <input
                  type="text"
                  value={set.subtitle ?? ""}
                  onChange={(e) => updateSet(index, { subtitle: e.target.value || null })}
                  placeholder="Support our mission"
                  className="panel-input mt-1"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Appearance */}
        <div className="panel-card overflow-hidden p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-emerald-600" />
            <h3 className="panel-section-title mb-0">Appearance</h3>
          </div>
          <div className="panel-row">
            <div className="flex items-center justify-between gap-3 mb-1">
              <label className="panel-field-label mb-0">Border radius</label>
              <span className="text-sm font-medium tabular-nums text-slate-600 min-w-[3ch]">{radiusPx} px</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              step={1}
              value={radiusPx}
              onChange={(e) => setRadiusPx(Number(e.target.value))}
              className="mt-1"
              aria-label="Border radius in pixels"
            />
            <p className="panel-field-hint">Rounded corners on the form card, inputs, and buttons.</p>
          </div>
          <div className="panel-row">
            <label className="panel-field-label">Font</label>
            <select
              value={fontFamilyKey}
              onChange={(e) => setFontFamilyKey(e.target.value)}
              className="panel-input mt-1 max-w-[220px]"
            >
              {FORM_FONT_OPTIONS.map((opt) => (
                <option key={opt.value || "system"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="panel-field-hint">Header and form text. Barlow Black uses heavy weight for the title.</p>
          </div>
          <div className="panel-row grid grid-cols-[auto_1fr] gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="panel-field-label">Button color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={buttonColor && /^#[0-9A-Fa-f]{6}$/.test(buttonColor) ? buttonColor : "#635bff"}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="h-10 w-10 rounded-xl cursor-pointer border border-slate-200 overflow-hidden"
                />
                <input
                  type="text"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  placeholder="#635bff"
                  className="panel-input w-24 py-2 font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="panel-field-label">Button text color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={buttonTextColor && /^#[0-9A-Fa-f]{6}$/.test(buttonTextColor) ? buttonTextColor : "#ffffff"}
                  onChange={(e) => setButtonTextColor(e.target.value)}
                  className="h-10 w-10 rounded-xl cursor-pointer border border-slate-200 overflow-hidden"
                />
                <input
                  type="text"
                  value={buttonTextColor}
                  onChange={(e) => setButtonTextColor(e.target.value)}
                  placeholder="#fff"
                  className="panel-input w-24 py-2 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 px-5 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-95 active:scale-[0.99] bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md hover:shadow-lg"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save form settings"}
        </button>

        {/* Share */}
        <div className="panel-card overflow-hidden p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-emerald-600" />
            <h3 className="panel-section-title mb-0">Share</h3>
          </div>
          <div className="panel-row">
            <label className="panel-field-label">Give link</label>
            <p className="panel-field-hint">Share so givers can give on your site.</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <code className="flex-1 min-w-0 px-3 py-2.5 text-sm break-all rounded-xl bg-slate-50/80 border border-slate-200 text-slate-800 font-mono">
                {giveLink}
              </code>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className="panel-row">
            <label className="panel-field-label">Embed code</label>
            <p className="panel-field-hint">Add this iframe to your website. Copy and paste into Webflow, WordPress, or any site.</p>
            <pre className="mt-2 p-4 text-xs overflow-x-auto overflow-y-auto max-h-28 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-800 font-mono">
              <code>{iframeCode}</code>
            </pre>
            <button
              type="button"
              onClick={handleCopyEmbed}
              className="mt-2 inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
            >
              {copiedEmbed ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copiedEmbed ? "Copied" : "Copy embed code"}
            </button>
          </div>
          <div className="panel-row">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-600" />
              <label className="panel-field-label mb-0">QR code</label>
            </div>
            <p className="panel-field-hint">Scan to open the donation page (e.g. for in-person giving).</p>
            <div className="mt-2 flex items-center gap-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(giveLink)}`}
                alt="QR code for donation page"
                className="h-[180px] w-[180px] rounded-lg border border-slate-200 object-contain"
              />
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-700">Right-click to save</p>
                <p className="mt-1">Use for bulletins, signage, or event materials.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Live preview */}
      <div className="w-full min-w-0 flex-1">
        <div className="sticky top-6">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Live preview</p>
              <p className="text-xs text-slate-500">Updates as you edit. Matches your give page.</p>
            </div>
          </div>
          <div
            className="w-full max-w-[480px] mx-auto lg:mx-0 overflow-hidden"
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: formRadius,
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              background: "#fff",
              color: "var(--stripe-dark)",
              fontFamily: previewFontFamily,
            }}
          >
            {designSets.length > 0 ? (
              designSets.map((set, i) => (
                <FormCardMedia
                  key={i}
                  set={set}
                  fallbackImageUrl={headerImageUrl || DEFAULT_HEADER_IMAGE_URL}
                  className="h-56"
                  fontFamily={previewFontFamily}
                  titleFontWeight={previewHeaderFontWeight ?? 700}
                />
              ))
            ) : (
              <div className="relative w-full h-56 overflow-hidden">
                <img
                  src={headerImageUrlInput.trim() || headerImageUrl || DEFAULT_HEADER_IMAGE_URL}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover block"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                  <h3
                    className="text-2xl font-bold leading-tight mb-1"
                    style={{
                      fontFamily: previewFontFamily,
                      fontWeight: previewHeaderFontWeight ?? 700,
                      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    }}
                  >
                    {headerText || "Make a Donation"}
                  </h3>
                  <p
                    className="text-sm opacity-95"
                    style={{ fontFamily: previewFontFamily, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
                  >
                    {subheaderText || `Support ${organizationName}`}
                  </p>
                </div>
              </div>
            )}
            <div className="p-6 space-y-0">
              <DonationForm
                organizationId={organizationId}
                organizationName={organizationName}
                campaigns={campaigns}
                endowmentFunds={endowmentFunds}
                suggestedAmounts={suggestedAmounts}
                minimumAmountCents={minimumAmountCents}
                showEndowmentSelection={showEndowmentSelection}
                allowCustomAmount={allowCustomAmount}
                allowAnonymous={campaigns.some((c) => (c as { allow_anonymous?: boolean | null }).allow_anonymous !== false) || campaigns.length === 0}
                buttonColor={buttonColor || undefined}
                buttonTextColor={buttonTextColor || undefined}
                borderRadius={formRadius || undefined}
                slug={slug}
                noCard
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
