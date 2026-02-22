"use client";

/**
 * Theme form editor — the form that appears in website builder templates.
 * Edit content only. Colors and fonts adapt to the website theme automatically.
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Type, Image as ImageIcon, Video, MessageSquare, Save, Loader2, Check, Zap, Copy, Layout, Minimize2, Maximize2 } from "lucide-react";
import { SPLITS_ENABLED } from "@/lib/feature-flags";
import { SplitPercentageChart } from "@/components/split-percentage-chart";
import { PexelsMediaPicker } from "@/components/pexels-media-picker";
import { isPexelsUrl } from "@/lib/pexels";
import type { DesignSet } from "@/lib/stock-media";
import { PreviewIframe } from "@/components/preview-iframe";

const PRESET_AMOUNTS = [10, 12, 25, 50, 100, 250, 500, 1000];
const SEAMLESS_THEME_IDS_ARR = [
  "church-grace",
  "modern-minimal",
  "warm-heritage",
  "bold-contemporary",
  "dark-elegant",
  "vibrant-community",
] as const;

type Campaign = { id: string; name: string; suggested_amounts: unknown; minimum_amount_cents: number | null; allow_recurring: boolean | null };
type EndowmentFund = { id: string; name: string };

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
  initialThankYouVideoUrl?: string | null;
  initialThankYouCtaUrl?: string | null;
  initialThankYouCtaText?: string | null;
  headerImageUrl?: string | null;
  initialDesignSet?: DesignSet | null;
  initialSplits?: { percentage: number; accountId: string }[];
  initialFormDisplayMode?: "full" | "compressed" | "full_width";
  connectedPeers?: { id: string; name: string; slug: string; stripe_connect_account_id: string }[];
  splitRecipientLimit?: number;
  currentPlan?: "free" | "growth" | "pro";
};

export function ThemeFormEditor({
  organizationId,
  organizationName,
  slug,
  baseUrl,
  campaigns,
  endowmentFunds,
  suggestedAmounts: serverAmounts,
  minimumAmountCents,
  showEndowmentSelection,
  allowCustomAmount: serverAllowCustom,
  initialHeaderText,
  initialSubheaderText,
  initialThankYouMessage,
  initialThankYouVideoUrl,
  initialThankYouCtaUrl,
  initialThankYouCtaText,
  headerImageUrl,
  initialDesignSet,
  initialSplits = [],
  initialFormDisplayMode = "full_width",
  connectedPeers = [],
  splitRecipientLimit = Infinity,
  currentPlan = "free",
}: Props) {
  const router = useRouter();
  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>(serverAmounts);
  const [allowCustomAmount, setAllowCustomAmount] = useState(serverAllowCustom);
  const [headerText, setHeaderText] = useState(initialHeaderText);
  const [subheaderText, setSubheaderText] = useState(initialSubheaderText);
  const [thankYouMessage, setThankYouMessage] = useState(initialThankYouMessage ?? "Thank you for your donation!");
  const [thankYouVideoUrl, setThankYouVideoUrl] = useState(initialThankYouVideoUrl ?? "");
  const [thankYouCtaUrl, setThankYouCtaUrl] = useState(initialThankYouCtaUrl ?? "");
  const [thankYouCtaText, setThankYouCtaText] = useState(initialThankYouCtaText ?? "");
  const [mediaType, setMediaType] = useState<"image" | "video">(initialDesignSet?.media_type ?? "image");
  const [mediaUrl, setMediaUrl] = useState(initialDesignSet?.media_url ?? headerImageUrl ?? "");
  const [splits, setSplits] = useState<{ percentage: number; accountId: string }[]>(initialSplits);
  const [formDisplayMode, setFormDisplayMode] = useState<"full" | "compressed" | "full_width">(initialFormDisplayMode);
  const [previewTheme, setPreviewTheme] = useState<string>("church-grace");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pexelsPicker, setPexelsPicker] = useState<"photos" | "videos" | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    setSuggestedAmounts(serverAmounts);
    setAllowCustomAmount(serverAllowCustom);
    setHeaderText(initialHeaderText);
    setSubheaderText(initialSubheaderText);
    setThankYouMessage(initialThankYouMessage ?? "Thank you for your donation!");
    setThankYouVideoUrl(initialThankYouVideoUrl ?? "");
    setThankYouCtaUrl(initialThankYouCtaUrl ?? "");
    setThankYouCtaText(initialThankYouCtaText ?? "");
    setMediaType(initialDesignSet?.media_type ?? "image");
    setMediaUrl(initialDesignSet?.media_url ?? headerImageUrl ?? "");
    setSplits(initialSplits);
    setFormDisplayMode(initialFormDisplayMode);
  }, [serverAmounts, serverAllowCustom, initialHeaderText, initialSubheaderText, initialThankYouMessage, initialThankYouVideoUrl, initialThankYouCtaUrl, initialThankYouCtaText, headerImageUrl, initialDesignSet, initialSplits, initialFormDisplayMode]);

  const allowAnonymous = campaigns.some((c) => (c as { allow_anonymous?: boolean | null }).allow_anonymous !== false) || campaigns.length === 0;

  function toggleAmount(n: number) {
    setSuggestedAmounts((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n).sort((a, b) => a - b) : [...prev, n].sort((a, b) => a - b)
    );
  }

  async function resolvePexelsUrl(): Promise<string | null> {
    const url = mediaUrl?.trim();
    if (!url || !isPexelsUrl(url)) return url || null;
    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch("/api/pexels-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type: mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to resolve");
      return data.mediaUrl ?? null;
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Failed to resolve Pexels URL");
      return null;
    } finally {
      setResolving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setResolveError(null);
    let finalMediaUrl = mediaUrl?.trim() || null;
    if (finalMediaUrl && isPexelsUrl(finalMediaUrl)) {
      const resolved = await resolvePexelsUrl();
      if (resolved) finalMediaUrl = resolved;
      else {
        setSaving(false);
        return;
      }
    }
    const designSet: DesignSet = {
      media_type: mediaType,
      media_url: finalMediaUrl,
      title: headerText || null,
      subtitle: subheaderText || null,
    };
    try {
      const res = await fetch("/api/form-customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          suggested_amounts: suggestedAmounts,
          allow_custom_amount: allowCustomAmount,
          header_text: headerText || undefined,
          subheader_text: subheaderText || undefined,
          thank_you_message: thankYouMessage.trim() || undefined,
          thank_you_video_url: thankYouVideoUrl.trim() || null,
          thank_you_cta_url: thankYouCtaUrl.trim() || null,
          thank_you_cta_text: thankYouCtaText.trim() || null,
          header_image_url: mediaType === "image" && finalMediaUrl ? finalMediaUrl : null,
          design_sets: [designSet],
          form_display_mode: formDisplayMode,
          embed_form_theme: "default",
          splits: SPLITS_ENABLED && splits.length > 0 ? splits : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      toast.success("Saved");
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-w-0 min-h-0 gap-8">
      {/* Left: Editor */}
      <div className="w-full lg:w-[400px] shrink-0 space-y-6">
        {/* Hero callout */}
        <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-800/50">
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-dashboard-text">Website form</p>
              <p className="mt-1 text-[13px] text-dashboard-text-muted leading-relaxed">
                One form for your website templates. Edit the basics below — name, image or video, amounts, splits. It loads dynamically on your site and matches your theme automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-dashboard-text">Content</h3>
            <p className="text-xs text-dashboard-text-muted mt-0.5">Text, image, and amounts</p>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1.5">Header</label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="Make a Donation"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-dashboard-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1.5">Subheader</label>
              <input
                type="text"
                value={subheaderText}
                onChange={(e) => setSubheaderText(e.target.value)}
                placeholder="Support our mission"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-dashboard-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1.5">Amounts</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleAmount(n)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                      suggestedAmounts.includes(n)
                        ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "border border-slate-200 dark:border-slate-600 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    ${n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm font-medium text-dashboard-text">Allow custom amount</span>
              <button
                type="button"
                role="switch"
                onClick={() => setAllowCustomAmount((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  allowCustomAmount ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    allowCustomAmount ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1.5">Image or video</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setMediaType("image")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${
                    mediaType === "image" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Image
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("video")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${
                    mediaType === "video" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <Video className="h-3.5 w-3.5" /> Video
                </button>
                <button
                  type="button"
                  onClick={() => setPexelsPicker(mediaType === "image" ? "photos" : "videos")}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Pexels
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => { setMediaUrl(e.target.value); setResolveError(null); }}
                  placeholder="https://..."
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-dashboard-text text-sm"
                />
                {isPexelsUrl(mediaUrl ?? "") && (
                  <button
                    type="button"
                    onClick={async () => {
                      const resolved = await resolvePexelsUrl();
                      if (resolved) setMediaUrl(resolved);
                    }}
                    disabled={resolving}
                    className="shrink-0 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    {resolving ? "..." : "Resolve"}
                  </button>
                )}
              </div>
              {resolveError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{resolveError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1.5">Thank you message</label>
              <textarea
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-dashboard-text text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Splits — website form has its own splits */}
        {SPLITS_ENABLED && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-dashboard-text">Payment splits</h3>
              <p className="text-xs text-dashboard-text-muted mt-0.5">Split donations from this form to connected peers</p>
            </div>
            <div className="p-5">
              <SplitPercentageChart
                splits={splits}
                onSplitsChange={setSplits}
                connectedPeers={connectedPeers}
                organizationName={organizationName}
                compact
                maxRecipients={splitRecipientLimit}
                currentPlan={currentPlan}
              />
            </div>
          </div>
        )}

        {/* Display mode */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-dashboard-text">Display mode</h3>
            <p className="text-xs text-dashboard-text-muted mt-0.5">How the form appears when embedded</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormDisplayMode("full_width")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  formDisplayMode === "full_width"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                }`}
              >
                <Maximize2 className={`h-5 w-5 ${formDisplayMode === "full_width" ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="text-xs font-semibold text-dashboard-text">Full width</span>
              </button>
              <button
                type="button"
                onClick={() => setFormDisplayMode("full")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  formDisplayMode === "full"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                }`}
              >
                <Layout className={`h-5 w-5 ${formDisplayMode === "full" ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="text-xs font-semibold text-dashboard-text">Regular</span>
              </button>
              <button
                type="button"
                onClick={() => setFormDisplayMode("compressed")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  formDisplayMode === "compressed"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                }`}
              >
                <Minimize2 className={`h-5 w-5 ${formDisplayMode === "compressed" ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="text-xs font-semibold text-dashboard-text">Compact</span>
              </button>
            </div>
          </div>
        </div>

        {/* Embed code */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-dashboard-text">Embed code</h3>
            <p className="text-xs text-dashboard-text-muted mt-0.5">Copy the iframe code to embed this form on your website</p>
          </div>
          <div className="p-5">
            <div className="flex gap-2">
              <code className="flex-1 block p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-dashboard-text break-all">
                {`<iframe src="${baseUrl.replace(/\/$/, "")}/give/${slug}/embed" width="100%" height="600" frameborder="0" title="Donate to ${slug}"></iframe>`}
              </code>
              <button
                type="button"
                onClick={async () => {
                  const code = `<iframe src="${baseUrl.replace(/\/$/, "")}/give/${slug}/embed" width="100%" height="600" frameborder="0" title="Donate to ${slug}"></iframe>`;
                  await navigator.clipboard.writeText(code);
                  toast.success("Embed code copied to clipboard");
                }}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-dashboard-text hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>

      {/* Right: Live preview */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dashboard-text mb-2">Theme</label>
            <select
              value={previewTheme}
              onChange={(e) => setPreviewTheme(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-dashboard-text text-sm"
            >
              {SEAMLESS_THEME_IDS_ARR.map((id) => (
                <option key={id} value={id}>
                  {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dashboard-text mb-2">Live preview</label>
            <p className="text-xs text-dashboard-text-muted mb-2">
              Shows saved form. Save to update preview.
            </p>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg bg-white min-h-[420px]">
              <PreviewIframe
                src={`${baseUrl.replace(/\/$/, "")}/give/${slug}/embed?seamless=1&theme=${previewTheme}&mode=${formDisplayMode}`}
                title="Form preview"
                className="w-full border-0"
                minHeight={420}
              />
            </div>
          </div>
        </div>
      </div>

      {pexelsPicker && (
        <PexelsMediaPicker
          mode={pexelsPicker}
          onSelect={(url) => {
            setMediaUrl(url);
            setMediaType(pexelsPicker === "photos" ? "image" : "video");
            setPexelsPicker(null);
          }}
          onClose={() => setPexelsPicker(null)}
        />
      )}
    </div>
  );
}
