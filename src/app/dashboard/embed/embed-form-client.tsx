"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
  Link2,
  Maximize2,
  Monitor,
  Minus,
  ChevronDown,
  Plus,
  Trash2,
  Sparkles,
  Save,
  Loader2,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Paintbrush,
  X,
} from "lucide-react";
import { DonationForm } from "@/app/give/[slug]/donation-form";
import { FormCardMedia } from "@/components/form-card-media";
import { CompressedDonationCard } from "@/components/compressed-donation-card";
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
import { PexelsMediaPicker } from "@/components/pexels-media-picker";
import { SPLITS_ENABLED } from "@/lib/feature-flags";
import { SplitPercentageChart } from "@/components/split-percentage-chart";

import {
  EMBED_FORM_THEMES,
  GRACE_THEME_CSS,
  GRACE_THEME_FONT_URL,
  DARK_ELEGANT_THEME_CSS,
  DARK_ELEGANT_FONT_URL,
  BOLD_CONTEMPORARY_THEME_CSS,
  BOLD_CONTEMPORARY_FONT_URL,
  type EmbedFormThemeId,
} from "@/lib/embed-form-themes";

import { GIVING_FORM_TEMPLATES, type GivingFormTemplate } from "@/lib/form-template-preset";

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
  initialThankYouVideoUrl?: string | null;
  initialThankYouCtaUrl?: string | null;
  initialThankYouCtaText?: string | null;
  initialButtonColor: string | null;
  initialButtonTextColor: string | null;
  headerImageUrl?: string | null;
  primaryColor?: string | null;
  initialBorderRadius?: string | null;
  initialFontFamily?: string | null;
  initialDesignSets?: DesignSet[] | null;
  initialFormDisplayMode?: "full" | "compressed" | "full_width";
  initialFormMediaSide?: "left" | "right";
  initialSplits?: { percentage: number; accountId: string }[];
  connectedPeers?: { id: string; name: string; slug: string; stripe_connect_account_id: string }[];
  initialEmbedFormTheme?: EmbedFormThemeId | null;
  splitRecipientLimit?: number;
  currentPlan?: "free" | "growth" | "pro";
};

/* -- Section header for collapsible panels -- */
function SectionHeader({
  icon,
  label,
  isOpen,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
        {icon}
      </span>
      <span className="flex-1 text-[13px] font-semibold tracking-wide text-dashboard-text">{label}</span>
      <ChevronDown
        className={`h-4 w-4 text-dashboard-text-muted/60 transition-transform duration-300 ease-out ${isOpen ? "" : "-rotate-90"}`}
      />
    </button>
  );
}

/* -- Fullscreen Preview Modal -- */
function FullscreenPreviewModal({
  isOpen,
  onClose,
  wideMode,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  wideMode?: boolean;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full ${wideMode ? "max-w-[960px]" : "max-w-[520px]"} max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl shadow-black/20`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-slate-700 transition-all duration-200 backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );
}

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
  initialThankYouVideoUrl,
  initialThankYouCtaUrl,
  initialThankYouCtaText,
  initialButtonColor,
  initialButtonTextColor,
  headerImageUrl,
  primaryColor,
  initialBorderRadius,
  initialFontFamily,
  initialDesignSets,
  initialFormDisplayMode = "full",
  initialFormMediaSide = "left",
  initialSplits = [],
  connectedPeers = [],
  initialEmbedFormTheme = "default",
  splitRecipientLimit = Infinity,
  currentPlan = "free",
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

  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>(serverSuggestedAmounts);
  const [allowCustomAmount, setAllowCustomAmount] = useState(serverAllowCustomAmount);
  const [headerText, setHeaderText] = useState(initialHeaderText);
  const [subheaderText, setSubheaderText] = useState(initialSubheaderText);
  const [thankYouMessage, setThankYouMessage] = useState(initialThankYouMessage ?? "Thank you for your donation!");
  const [thankYouVideoUrl, setThankYouVideoUrl] = useState(initialThankYouVideoUrl ?? "");
  const [thankYouCtaUrl, setThankYouCtaUrl] = useState(initialThankYouCtaUrl ?? "");
  const [thankYouCtaText, setThankYouCtaText] = useState(initialThankYouCtaText ?? "");
  const [buttonColor, setButtonColor] = useState(initialButtonColor ?? "");
  const [buttonTextColor, setButtonTextColor] = useState(initialButtonTextColor ?? "");
  const [headerImageUrlInput, setHeaderImageUrlInput] = useState(headerImageUrl ?? "");
  const [fontFamilyKey, setFontFamilyKey] = useState(initialFontFamily ?? "");
  const [designSets, setDesignSets] = useState<DesignSet[]>(initialSets);
  const [numSets, setNumSets] = useState(() => Math.min(initialSets.length, MAX_DESIGN_SETS));
  const [formDisplayMode, setFormDisplayMode] = useState<"full" | "compressed" | "full_width">(initialFormDisplayMode);
  const [formMediaSide, setFormMediaSide] = useState<"left" | "right">(initialFormMediaSide);
  const [embedFormTheme, setEmbedFormTheme] = useState<EmbedFormThemeId>(initialEmbedFormTheme ?? "default");
  const [splits, setSplits] = useState<{ percentage: number; accountId: string }[]>(initialSplits);
  const parseRadiusPx = (s: string | null | undefined): number => {
    if (!s?.trim()) return 8;
    const m = s.trim().match(/^(\d+)px$/i);
    return m ? Math.min(24, Math.max(0, parseInt(m[1], 10))) : 8;
  };
  const [radiusPx, setRadiusPx] = useState(() => parseRadiusPx(initialBorderRadius));
  const [pexelsPicker, setPexelsPicker] = useState<{ index: number; mode: "photos" | "videos" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingIndex, setResolvingIndex] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["content", "appearance"]));
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setDesignSets((prev) => {
      const next = [...prev];
      while (next.length < numSets) next.push(defaultDesignSet());
      return next.slice(0, numSets);
    });
  }, [numSets]);

  useEffect(() => {
    setSuggestedAmounts(serverSuggestedAmounts);
    setAllowCustomAmount(serverAllowCustomAmount);
    setHeaderText(initialHeaderText);
    setSubheaderText(initialSubheaderText);
    setThankYouMessage(initialThankYouMessage ?? "Thank you for your donation!");
    setThankYouVideoUrl(initialThankYouVideoUrl ?? "");
    setThankYouCtaUrl(initialThankYouCtaUrl ?? "");
    setThankYouCtaText(initialThankYouCtaText ?? "");
    setButtonColor(initialButtonColor ?? "");
    setButtonTextColor(initialButtonTextColor ?? "");
    setHeaderImageUrlInput(headerImageUrl ?? "");
    setRadiusPx(parseRadiusPx(initialBorderRadius));
    setFontFamilyKey(initialFontFamily ?? "");
    setDesignSets(initialSets);
    setNumSets(Math.min(initialSets.length || 1, MAX_DESIGN_SETS));
    setFormDisplayMode(initialFormDisplayMode);
    setFormMediaSide(initialFormMediaSide);
    setEmbedFormTheme(initialEmbedFormTheme ?? "default");
    setSplits(initialSplits);
  }, [
    serverSuggestedAmounts, serverAllowCustomAmount, initialHeaderText, initialSubheaderText,
    initialThankYouMessage, initialThankYouVideoUrl, initialThankYouCtaUrl, initialThankYouCtaText,
    initialButtonColor, initialButtonTextColor, headerImageUrl, initialBorderRadius,
    initialFontFamily, initialSets, initialFormDisplayMode, initialFormMediaSide,
    initialEmbedFormTheme, initialSplits,
  ]);

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
    return () => { link?.remove(); };
  }, [fontFamilyKey]);

  const giveLink = `${baseUrl}/give/${slug}`;
  const embedUrl = `${baseUrl}/give/${slug}/embed`;
  const embedUrlFullScreen = `${baseUrl}/give/${slug}/embed?fullscreen=1`;
  const embedUrlCompact = `${baseUrl}/give/${slug}/embed?compact=1`;
  const iframeCodeFullScreen = `<iframe src="${embedUrlFullScreen}" style="width: 100%; height: 100vh; min-height: 500px; border: none;" title="Donate to ${slug}"></iframe>`;
  const iframeCodeRegular = `<iframe src="${embedUrl}" style="width: 100%; height: 80vh; min-height: 500px; border: none;" title="Donate to ${slug}"></iframe>`;
  const iframeCodeCompact = `<iframe src="${embedUrlCompact}" style="width: 100%; height: 100%; min-height: 320px; border: none;" title="Donate to ${slug}"></iframe>`;

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
      updateSet(index, { media_url: mediaUrl, media_type: mediaType });
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
    const setsPayload = designSets.length > 0
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
          thank_you_video_url: thankYouVideoUrl.trim() || null,
          thank_you_cta_url: thankYouCtaUrl.trim() || null,
          thank_you_cta_text: thankYouCtaText.trim() || null,
          header_image_url:
            firstSet?.media_type === "image" && firstSet?.media_url
              ? firstSet.media_url
              : headerImageUrlInput.trim() || null,
          button_border_radius: `${radiusPx}px`,
          button_color: buttonColor || undefined,
          button_text_color: buttonTextColor || undefined,
          font_family: fontFamilyKey.trim() || undefined,
          design_sets: setsPayload,
          form_display_mode: formDisplayMode,
          form_media_side: formDisplayMode === "full_width" ? formMediaSide : undefined,
          embed_form_theme: embedFormTheme,
          splits: SPLITS_ENABLED && splits.length > 0 ? splits : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      toast.success("Settings saved successfully");
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
  const [copiedFullScreen, setCopiedFullScreen] = useState(false);
  const [copiedRegular, setCopiedRegular] = useState(false);
  const [copiedCompact, setCopiedCompact] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(giveLink);
    toast.success("Link copied to clipboard");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };
  const handleCopyEmbed = async (code: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(code);
    toast.success("Embed code copied to clipboard");
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const allowAnonymous = campaigns.some((c) => (c as { allow_anonymous?: boolean | null }).allow_anonymous !== false) || campaigns.length === 0;

  /* -- Render the form preview content (reused in both inline + modal) -- */
  function renderFormPreview() {
    const themeMediaUrl = designSets[0]?.media_url ?? (headerImageUrlInput.trim() || headerImageUrl || DEFAULT_HEADER_IMAGE_URL);
    const themeTitle = designSets[0]?.title ?? (headerText || "Make a Donation");
    const themeSubtitle = designSets[0]?.subtitle ?? (subheaderText || `Support ${organizationName}`);
    const themeHasVideo = designSets[0]?.media_type === "video" && designSets[0]?.media_url;

    if (embedFormTheme === "grace") {
      return (
        <div className="embed-theme-grace rounded-2xl overflow-hidden" style={{ backgroundColor: "#FAF7F2", containerType: "inline-size" }}>
          <link rel="stylesheet" href={GRACE_THEME_FONT_URL} />
          <style dangerouslySetInnerHTML={{ __html: GRACE_THEME_CSS }} />
          <div className="give-split w-full">
            <div className="gs-img">
              {themeHasVideo ? (
                <video src={designSets[0].media_url!} autoPlay muted loop playsInline className="w-full h-full object-cover block min-h-[200px]" aria-hidden />
              ) : (
                <img src={themeMediaUrl} alt="Community impact" className="w-full h-full object-cover block min-h-[200px]" />
              )}
            </div>
            <div className="gs-form">
              <span className="sec-eye" style={{ color: "var(--gold)" }}>Give Online</span>
              <h3>{themeTitle}</h3>
              <p className="gs-form-desc">{themeSubtitle}</p>
              <DonationForm organizationId={organizationId} organizationName={organizationName} campaigns={campaigns} endowmentFunds={endowmentFunds} suggestedAmounts={suggestedAmounts} minimumAmountCents={minimumAmountCents} showEndowmentSelection={showEndowmentSelection} allowCustomAmount={allowCustomAmount} allowAnonymous={allowAnonymous} buttonColor={buttonColor || undefined} buttonTextColor={buttonTextColor || undefined} borderRadius={formRadius || undefined} slug={slug} noCard fullWidth />
              <p className="gs-form-secure">All transactions are secure and encrypted</p>
            </div>
          </div>
        </div>
      );
    }

    if (embedFormTheme === "dark-elegant") {
      return (
        <div className="embed-theme-dark-elegant rounded-2xl overflow-hidden" style={{ backgroundColor: "#171717", containerType: "inline-size" }}>
          <link rel="stylesheet" href={DARK_ELEGANT_FONT_URL} />
          <style dangerouslySetInnerHTML={{ __html: DARK_ELEGANT_THEME_CSS }} />
          <div className="give-split w-full">
            <div className="gs-img">
              {themeHasVideo ? (
                <video src={designSets[0].media_url!} autoPlay muted loop playsInline className="w-full h-full object-cover block min-h-[200px]" aria-hidden />
              ) : (
                <img src={themeMediaUrl} alt="Community worship" className="w-full h-full object-cover block min-h-[200px]" />
              )}
              <div className="gs-img-overlay" />
            </div>
            <div className="gs-form">
              <span className="sec-eye">Generosity</span>
              <h3>{themeTitle}</h3>
              <p className="gs-form-desc">{themeSubtitle}</p>
              <DonationForm organizationId={organizationId} organizationName={organizationName} campaigns={campaigns} endowmentFunds={endowmentFunds} suggestedAmounts={suggestedAmounts} minimumAmountCents={minimumAmountCents} showEndowmentSelection={showEndowmentSelection} allowCustomAmount={allowCustomAmount} allowAnonymous={allowAnonymous} buttonColor={buttonColor || undefined} buttonTextColor={buttonTextColor || undefined} borderRadius={formRadius || undefined} slug={slug} noCard fullWidth />
              <p className="gs-form-secure">Secure &amp; encrypted</p>
            </div>
          </div>
        </div>
      );
    }

    if (embedFormTheme === "bold-contemporary") {
      return (
        <div className="embed-theme-bold rounded-2xl overflow-hidden" style={{ backgroundColor: "#F8F9FA", containerType: "inline-size" }}>
          <link rel="stylesheet" href={BOLD_CONTEMPORARY_FONT_URL} />
          <style dangerouslySetInnerHTML={{ __html: BOLD_CONTEMPORARY_THEME_CSS }} />
          <div className="give-split w-full">
            <div className="gs-img">
              {themeHasVideo ? (
                <video src={designSets[0].media_url!} autoPlay muted loop playsInline className="w-full h-full object-cover block min-h-[200px]" aria-hidden />
              ) : (
                <img src={themeMediaUrl} alt="Community impact" className="w-full h-full object-cover block min-h-[200px]" />
              )}
            </div>
            <div className="gs-form-light">
              <span className="sec-eye">Make a Difference</span>
              <h3>{themeTitle}</h3>
              <p className="gs-form-desc">{themeSubtitle}</p>
              <DonationForm organizationId={organizationId} organizationName={organizationName} campaigns={campaigns} endowmentFunds={endowmentFunds} suggestedAmounts={suggestedAmounts} minimumAmountCents={minimumAmountCents} showEndowmentSelection={showEndowmentSelection} allowCustomAmount={allowCustomAmount} allowAnonymous={allowAnonymous} buttonColor={buttonColor || undefined} buttonTextColor={buttonTextColor || undefined} borderRadius={formRadius || undefined} slug={slug} noCard fullWidth />
              <p className="gs-form-secure">Secure, encrypted giving powered by Stripe</p>
            </div>
          </div>
        </div>
      );
    }

    if (formDisplayMode === "compressed") {
      return (
        <div className="p-8">
          <CompressedDonationCard organizationName={organizationName} slug={slug} headerImageUrl={headerImageUrlInput.trim() || headerImageUrl || undefined} headerText={designSets[0]?.title ?? headerText} subheaderText={designSets[0]?.subtitle ?? subheaderText} designSets={designSets} buttonColor={buttonColor || undefined} buttonTextColor={buttonTextColor || undefined} borderRadius={formRadius} basePath={baseUrl} />
        </div>
      );
    }

    if (formDisplayMode === "full_width") {
      return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${formMediaSide === "right" ? "sm:[grid-auto-flow:dense]" : ""}`} style={{ fontFamily: previewFontFamily }}>
          <div className={`relative min-h-[220px] sm:min-h-[280px] ${formMediaSide === "right" ? "sm:col-start-2" : ""}`}>
            {designSets.length > 0 ? (
              <FormCardMedia set={designSets[0]} fallbackImageUrl={headerImageUrl || DEFAULT_HEADER_IMAGE_URL} className="absolute inset-0 h-full min-h-[220px]" fontFamily={previewFontFamily} titleFontWeight={previewHeaderFontWeight ?? 700} />
            ) : (
              <div className="absolute inset-0">
                <img src={headerImageUrlInput.trim() || headerImageUrl || DEFAULT_HEADER_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              </div>
            )}
          </div>
          <div className={`flex flex-col justify-center px-5 py-6 ${formMediaSide === "right" ? "sm:col-start-1 sm:row-start-1" : ""}`}>
            <div className="min-w-0">
              <DonationForm organizationId={organizationId} organizationName={organizationName} campaigns={campaigns} endowmentFunds={endowmentFunds} suggestedAmounts={suggestedAmounts} minimumAmountCents={minimumAmountCents} showEndowmentSelection={showEndowmentSelection} allowCustomAmount={allowCustomAmount} allowAnonymous={allowAnonymous} buttonColor={buttonColor || undefined} buttonTextColor={buttonTextColor || undefined} borderRadius={formRadius || undefined} slug={slug} noCard />
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {designSets.length > 0 ? (
          designSets.map((set, i) => (
            <FormCardMedia key={i} set={set} fallbackImageUrl={headerImageUrl || DEFAULT_HEADER_IMAGE_URL} className="h-56" fontFamily={previewFontFamily} titleFontWeight={previewHeaderFontWeight ?? 700} />
          ))
        ) : (
          <div className="relative w-full h-56 overflow-hidden">
            <img src={headerImageUrlInput.trim() || headerImageUrl || DEFAULT_HEADER_IMAGE_URL} alt="" className="absolute inset-0 w-full h-full object-cover block" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" aria-hidden />
            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
              <h3 className="text-2xl font-bold leading-tight mb-1" style={{ fontFamily: previewFontFamily, fontWeight: previewHeaderFontWeight ?? 700, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                {headerText || "Make a Donation"}
              </h3>
              <p className="text-sm opacity-95" style={{ fontFamily: previewFontFamily, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                {subheaderText || `Support ${organizationName}`}
              </p>
            </div>
          </div>
        )}
        <div className="p-6 space-y-0">
          <DonationForm organizationId={organizationId} organizationName={organizationName} campaigns={campaigns} endowmentFunds={endowmentFunds} suggestedAmounts={suggestedAmounts} minimumAmountCents={minimumAmountCents} showEndowmentSelection={showEndowmentSelection} allowCustomAmount={allowCustomAmount} allowAnonymous={allowAnonymous} buttonColor={buttonColor || undefined} buttonTextColor={buttonTextColor || undefined} borderRadius={formRadius || undefined} slug={slug} noCard />
        </div>
      </>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {pexelsPicker && (
        <PexelsMediaPicker
          mode={pexelsPicker.mode}
          onSelect={(url) => {
            updateSet(pexelsPicker.index, { media_url: url });
            setPexelsPicker(null);
          }}
          onClose={() => setPexelsPicker(null)}
        />
      )}

      {/* Fullscreen preview modal */}
      <FullscreenPreviewModal
        isOpen={fullscreenPreview}
        onClose={() => setFullscreenPreview(false)}
        wideMode={formDisplayMode === "full_width" || embedFormTheme !== "default"}
      >
        <div
          className="w-full mx-auto overflow-hidden rounded-3xl bg-white"
          style={
            embedFormTheme !== "default"
              ? { fontFamily: "'Inter', sans-serif" }
              : formDisplayMode === "compressed"
                ? { color: "var(--stripe-dark)", fontFamily: previewFontFamily }
                : {
                    background: "#fff",
                    color: "var(--stripe-dark)",
                    fontFamily: previewFontFamily,
                  }
          }
        >
          {renderFormPreview()}
        </div>
      </FullscreenPreviewModal>

      <div className="flex flex-col lg:flex-row min-w-0 min-h-0 lg:min-h-[calc(100vh-180px)]">
        {/* -- LEFT: Property panel -- */}
        <div className="relative z-10 w-full lg:w-[420px] xl:w-[440px] lg:shrink-0 lg:border-r lg:border-dashboard-border/30 min-w-0 bg-white dark:bg-dashboard-card">
          {/* Panel header with save */}
          <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-dashboard-border/30 px-6 py-5" style={{ background: "var(--dashboard-glass)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-dashboard-text">Form Editor</h2>
                <p className="text-xs text-dashboard-text-muted mt-0.5">Live preview updates as you edit</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="shrink-0 inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-95 active:scale-[0.98] bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/25"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving" : saved ? "Saved" : "Save"}
            </button>
          </div>

          <div className="overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-240px)] editor-panel customization-panel min-w-0">
            {/* -- Form Templates Section -- */}
            <div className="border-b border-dashboard-border/30">
              <SectionHeader
                icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
                label="Form Templates"
                isOpen={openSections.has("templates")}
                onClick={() => toggleSection("templates")}
              />
              {openSections.has("templates") && (
                <div className="section-content px-6 pb-6 space-y-3">
                  <p className="panel-field-hint">Apply a pre-designed form style matching website templates</p>
                  <div className="grid grid-cols-2 gap-2.5 min-w-0">
                    {GIVING_FORM_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSuggestedAmounts(tpl.suggested_amounts);
                          setAllowCustomAmount(tpl.allow_custom_amount);
                          setHeaderText(tpl.header_text);
                          setSubheaderText(tpl.subheader_text);
                          setThankYouMessage(tpl.thank_you_message ?? "Thank you for your donation!");
                          setButtonColor(tpl.button_color ?? "");
                          setButtonTextColor(tpl.button_text_color ?? "");
                          setRadiusPx(parseRadiusPx(tpl.button_border_radius));
                          setFontFamilyKey(tpl.font_family ?? "");
                          setEmbedFormTheme(tpl.embed_form_theme);
                          setFormDisplayMode(tpl.form_display_mode);
                          setFormMediaSide(tpl.form_media_side);
                          if (tpl.design_sets?.length) {
                            setDesignSets(tpl.design_sets.map((s) => ({ ...s })));
                            setNumSets(tpl.design_sets.length);
                          }
                          toast.success(`Applied "${tpl.name}" template`);
                        }}
                        className="flex flex-col items-start gap-1 p-3.5 rounded-2xl text-left transition-all border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:hover:border-emerald-700/50"
                      >
                        <span className="text-[12px] font-semibold text-dashboard-text">{tpl.name}</span>
                        <span className="text-[10px] text-dashboard-text-muted leading-relaxed">{tpl.description}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600" style={{ background: tpl.button_color ?? "#059669" }} />
                          <span className="text-[9px] text-dashboard-text-muted">{tpl.embed_form_theme === "default" ? "Default" : tpl.embed_form_theme}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* -- Content Section -- */}
            <div className="border-b border-dashboard-border/30">
              <SectionHeader
                icon={<Type className="h-4 w-4 text-emerald-600" />}
                label="Content"
                isOpen={openSections.has("content")}
                onClick={() => toggleSection("content")}
              />
              {openSections.has("content") && (
                <div className="section-content px-6 pb-6 space-y-5">
                  {/* Amounts */}
                  <div className="panel-row">
                    <label className="panel-field-label">Donation amounts</label>
                    <p className="panel-field-hint">Quick-select buttons on your donation form</p>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {PRESET_AMOUNTS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => toggleAmount(n)}
                          className={`inline-flex items-center justify-center min-w-[3rem] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 select-none ${
                            suggestedAmounts.includes(n)
                              ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          ${n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom amount toggle */}
                  <div className="panel-row flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/30">
                    <div>
                      <span className="panel-field-label mb-0">Custom amount</span>
                      <p className="panel-field-hint">Let givers enter any amount</p>
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

                  {/* Text fields */}
                  <div className="panel-row space-y-4">
                    <div>
                      <label className="panel-field-label">Header</label>
                      <input
                        type="text"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        placeholder="Make a Donation"
                        className="panel-input mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="panel-field-label">Subheader</label>
                      <input
                        type="text"
                        value={subheaderText}
                        onChange={(e) => setSubheaderText(e.target.value)}
                        placeholder="Support our mission"
                        className="panel-input mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Thank you */}
                  <div className="panel-row space-y-4">
                    <div>
                      <label className="panel-field-label flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-dashboard-text-muted" />
                        Thank-you message
                      </label>
                      <textarea
                        value={thankYouMessage}
                        onChange={(e) => setThankYouMessage(e.target.value)}
                        placeholder="Thank you for your donation!"
                        rows={2}
                        className="panel-input mt-1.5 w-full resize-none"
                      />
                    </div>
                    <div>
                      <label className="panel-field-label">Thank-you video</label>
                      <input
                        type="url"
                        value={thankYouVideoUrl}
                        onChange={(e) => setThankYouVideoUrl(e.target.value)}
                        placeholder="https://... (MP4 or WebM)"
                        className="panel-input mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="panel-field-label">Thank-you button</label>
                      <div className="grid grid-cols-2 gap-2.5 mt-1.5">
                        <input
                          type="url"
                          value={thankYouCtaUrl}
                          onChange={(e) => setThankYouCtaUrl(e.target.value)}
                          placeholder="URL"
                          className="panel-input"
                        />
                        <input
                          type="text"
                          value={thankYouCtaText}
                          onChange={(e) => setThankYouCtaText(e.target.value)}
                          placeholder="Button text"
                          className="panel-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Header image */}
                  <div className="panel-row">
                    <label className="panel-field-label flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-dashboard-text-muted" />
                      Header image
                    </label>
                    <input
                      type="url"
                      value={headerImageUrlInput}
                      onChange={(e) => setHeaderImageUrlInput(e.target.value)}
                      placeholder="https://... (Unsplash or Pexels)"
                      className="panel-input mt-1.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* -- Design Sets Section -- */}
            <div className="border-b border-dashboard-border/30">
              <SectionHeader
                icon={<Layout className="h-4 w-4 text-emerald-600" />}
                label="Design Sets"
                isOpen={openSections.has("design-sets")}
                onClick={() => toggleSection("design-sets")}
              />
              {openSections.has("design-sets") && (
                <div className="section-content px-6 pb-6 space-y-4">
                  <p className="panel-field-hint">1-3 cards with image/video, title, and subtitle</p>

                  {/* Number selector */}
                  <div className="flex items-center gap-3">
                    <span className="panel-field-label text-[12px] mb-0">Cards:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNumSets(n)}
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                            numSets === n
                              ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Design set cards */}
                  {designSets.slice(0, numSets).map((set, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/30">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-600/40 shadow-sm">
                          {index + 1}
                        </span>
                        <span className="text-[12px] font-semibold text-dashboard-text">Set {index + 1}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {/* Media type */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateSet(index, { media_type: "image" })}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all ${
                              set.media_type === "image"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50"
                                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <ImageIcon className="h-3 w-3" />
                            Image
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSet(index, { media_type: "video" })}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all ${
                              set.media_type === "video"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50"
                                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <Video className="h-3 w-3" />
                            Video
                          </button>
                        </div>

                        {/* Media source */}
                        {set.media_type === "image" ? (
                          <div className="space-y-2">
                            <select
                              value={STOCK_IMAGE_OPTIONS.find((o) => o.value === set.media_url)?.value ?? ""}
                              onChange={(e) => updateSet(index, { media_url: e.target.value || null })}
                              className="panel-input text-xs"
                            >
                              {STOCK_IMAGE_OPTIONS.map((o) => (
                                <option key={o.value || "none"} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={set.media_url ?? ""}
                                onChange={(e) => updateSet(index, { media_url: e.target.value || null })}
                                placeholder="Paste image URL"
                                className="panel-input flex-1 min-w-0 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setPexelsPicker({ index, mode: "photos" })}
                                className="shrink-0 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100 transition-colors dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-300"
                              >
                                Pexels
                              </button>
                              {isPexelsUrl(set.media_url ?? "") && (
                                <button
                                  type="button"
                                  onClick={() => resolvePexelsUrl(index, set.media_url ?? "", "image")}
                                  disabled={resolvingIndex === index}
                                  className="shrink-0 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[11px] font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors dark:border-slate-600 dark:bg-slate-800"
                                >
                                  {resolvingIndex === index ? "..." : "Resolve"}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <select
                              value={STOCK_VIDEO_OPTIONS.find((o) => o.value === set.media_url)?.value ?? ""}
                              onChange={(e) => updateSet(index, { media_url: e.target.value || null })}
                              className="panel-input text-xs"
                            >
                              {STOCK_VIDEO_OPTIONS.map((o) => (
                                <option key={o.value || "none"} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={set.media_url ?? ""}
                                onChange={(e) => updateSet(index, { media_url: e.target.value || null })}
                                placeholder="Paste video URL"
                                className="panel-input flex-1 min-w-0 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setPexelsPicker({ index, mode: "videos" })}
                                className="shrink-0 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100 transition-colors dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-300"
                              >
                                Pexels
                              </button>
                              {isPexelsUrl(set.media_url ?? "") && (
                                <button
                                  type="button"
                                  onClick={() => resolvePexelsUrl(index, set.media_url ?? "", "video")}
                                  disabled={resolvingIndex === index}
                                  className="shrink-0 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[11px] font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors dark:border-slate-600 dark:bg-slate-800"
                                >
                                  {resolvingIndex === index ? "..." : "Resolve"}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Title & subtitle */}
                        <input
                          type="text"
                          value={set.title ?? ""}
                          onChange={(e) => updateSet(index, { title: e.target.value || null })}
                          placeholder="Title"
                          className="panel-input text-xs"
                        />
                        <input
                          type="text"
                          value={set.subtitle ?? ""}
                          onChange={(e) => updateSet(index, { subtitle: e.target.value || null })}
                          placeholder="Subtitle"
                          className="panel-input text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* -- Appearance Section -- */}
            <div className="border-b border-dashboard-border/30">
              <SectionHeader
                icon={<Paintbrush className="h-4 w-4 text-emerald-600" />}
                label="Appearance"
                isOpen={openSections.has("appearance")}
                onClick={() => toggleSection("appearance")}
              />
              {openSections.has("appearance") && (
                <div className="section-content px-6 pb-6 space-y-6">
                  {/* Display mode */}
                  <div className="panel-row">
                    <label className="panel-field-label">Display mode</label>
                    <p className="panel-field-hint mb-3">How your form appears on your give page</p>
                    <div className="grid grid-cols-3 gap-3 min-w-0">
                      {/* Compressed */}
                      <button
                        type="button"
                        onClick={() => setFormDisplayMode("compressed")}
                        className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${
                          formDisplayMode === "compressed"
                            ? "border-2 border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10 dark:bg-emerald-900/20"
                            : "border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800"
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                          <Minus className={`h-5 w-5 ${formDisplayMode === "compressed" ? "text-emerald-600" : "text-slate-400"}`} />
                        </div>
                        <span className={`text-[12px] font-semibold ${formDisplayMode === "compressed" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`}>
                          Compressed
                        </span>
                        {formDisplayMode === "compressed" && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>

                      {/* Regular */}
                      <button
                        type="button"
                        onClick={() => setFormDisplayMode("full")}
                        className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${
                          formDisplayMode === "full"
                            ? "border-2 border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10 dark:bg-emerald-900/20"
                            : "border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800"
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                          <Monitor className={`h-5 w-5 ${formDisplayMode === "full" ? "text-emerald-600" : "text-slate-400"}`} />
                        </div>
                        <span className={`text-[12px] font-semibold ${formDisplayMode === "full" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`}>
                          Regular
                        </span>
                        {formDisplayMode === "full" && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>

                      {/* Full width */}
                      <button
                        type="button"
                        onClick={() => setFormDisplayMode("full_width")}
                        className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer ${
                          formDisplayMode === "full_width"
                            ? "border-2 border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10 dark:bg-emerald-900/20"
                            : "border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800"
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                          <Maximize2 className={`h-5 w-5 ${formDisplayMode === "full_width" ? "text-emerald-600" : "text-slate-400"}`} />
                        </div>
                        <span className={`text-[12px] font-semibold ${formDisplayMode === "full_width" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`}>
                          Full width
                        </span>
                        {formDisplayMode === "full_width" && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>
                    </div>
                    {formDisplayMode === "full_width" && (
                      <div className="mt-4 flex gap-2">
                        {(["left", "right"] as const).map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() => setFormMediaSide(side)}
                            className={`inline-flex items-center px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all ${
                              formMediaSide === side
                                ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            Image {side}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form theme */}
                  <div className="panel-row">
                    <label className="panel-field-label">Form theme</label>
                    <p className="panel-field-hint mb-3">Applies a complete visual style to your donation form</p>
                    <div className="grid grid-cols-2 gap-2.5 min-w-0">
                      {EMBED_FORM_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setEmbedFormTheme(theme.id)}
                          className={`flex flex-col items-start gap-1 p-3.5 rounded-2xl text-left transition-all ${
                            embedFormTheme === theme.id
                              ? "border-2 border-emerald-500 bg-emerald-50 shadow-sm dark:bg-emerald-900/30"
                              : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                          }`}
                        >
                          <span className={`text-[12px] font-semibold ${
                            embedFormTheme === theme.id
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-dashboard-text"
                          }`}>
                            {theme.name}
                          </span>
                          <span className="text-[10px] text-dashboard-text-muted leading-relaxed">
                            {theme.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Splits – interactive donut chart + controls */}
                  {SPLITS_ENABLED && (
                    <div className="panel-row">
                      <label className="panel-field-label">Payment splits</label>
                      <p className="panel-field-hint mb-3">
                        Split donations to connected peers.{" "}
                        <Link href="/dashboard/connections" className="text-emerald-600 hover:underline dark:text-emerald-400">Connect first</Link>
                      </p>
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
                  )}

                  {/* Border radius */}
                  <div className="panel-row p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/30">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="panel-field-label mb-0">Border radius</label>
                      <span className="text-[11px] font-mono font-semibold tabular-nums text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-lg">{radiusPx}px</span>
                    </div>
                    <input
                      type="range" min={0} max={24} step={1}
                      value={radiusPx}
                      onChange={(e) => setRadiusPx(Number(e.target.value))}
                      className="mt-1 w-full"
                      aria-label="Border radius in pixels"
                    />
                  </div>

                  {/* Font */}
                  <div className="panel-row">
                    <label className="panel-field-label">Font family</label>
                    <select
                      value={fontFamilyKey}
                      onChange={(e) => setFontFamilyKey(e.target.value)}
                      className="panel-input mt-1.5 text-xs"
                    >
                      {FORM_FONT_OPTIONS.map((opt) => (
                        <option key={opt.value || "system"} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Colors */}
                  <div className="panel-row">
                    <label className="panel-field-label mb-3">Colors</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/30">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">Button</span>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="color"
                            value={buttonColor && /^#[0-9A-Fa-f]{6}$/.test(buttonColor) ? buttonColor : "#635bff"}
                            onChange={(e) => setButtonColor(e.target.value)}
                            className="h-9 w-9 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0"
                          />
                          <input
                            type="text"
                            value={buttonColor}
                            onChange={(e) => setButtonColor(e.target.value)}
                            placeholder="#635bff"
                            className="panel-input flex-1 min-w-0 py-2 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/30">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">Text</span>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="color"
                            value={buttonTextColor && /^#[0-9A-Fa-f]{6}$/.test(buttonTextColor) ? buttonTextColor : "#ffffff"}
                            onChange={(e) => setButtonTextColor(e.target.value)}
                            className="h-9 w-9 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0"
                          />
                          <input
                            type="text"
                            value={buttonTextColor}
                            onChange={(e) => setButtonTextColor(e.target.value)}
                            placeholder="#ffffff"
                            className="panel-input flex-1 min-w-0 py-2 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* -- Share & Embed Section -- */}
            <div className="border-b border-dashboard-border/30">
              <SectionHeader
                icon={<Share2 className="h-4 w-4 text-emerald-600" />}
                label="Share & Embed"
                isOpen={openSections.has("share-embed")}
                onClick={() => toggleSection("share-embed")}
              />
              {openSections.has("share-embed") && (
                <div className="section-content px-6 pb-6 space-y-5">
                  {/* Share link */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-slate-700/30">
                      <Link2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[12px] font-semibold text-dashboard-text">Share link</span>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span className="flex-1 min-w-0 text-[11px] text-slate-500 dark:text-slate-400 font-mono break-all">{giveLink}</span>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedLink ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Embed codes */}
                  <div className="space-y-3">
                    <p className="text-[12px] font-semibold text-dashboard-text">Embed codes</p>
                    <div className="grid grid-cols-3 gap-3 min-w-0">
                      {[
                        { label: "Full-width", icon: Maximize2, code: iframeCodeFullScreen, copied: copiedFullScreen, setCopied: setCopiedFullScreen },
                        { label: "Regular", icon: Monitor, code: iframeCodeRegular, copied: copiedRegular, setCopied: setCopiedRegular },
                        { label: "Compact", icon: Minus, code: iframeCodeCompact, copied: copiedCompact, setCopied: setCopiedCompact },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => handleCopyEmbed(opt.code, opt.setCopied)}
                            className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 p-4 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-sm dark:hover:border-emerald-700/50 dark:hover:bg-emerald-900/10"
                          >
                            <Icon className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            <span className="text-[11px] font-semibold text-dashboard-text">{opt.label}</span>
                            <span className="text-[10px] text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              {opt.copied ? "Copied!" : "Click to copy"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* QR code */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-slate-700/30">
                      <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[12px] font-semibold text-dashboard-text">QR Code</span>
                    </div>
                    <div className="p-4 flex items-center gap-4">
                      <a
                        href={`/api/qr?slug=${encodeURIComponent(slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/40 bg-white p-2.5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                          <img
                            src={`/api/qr?slug=${encodeURIComponent(slug)}`}
                            alt="QR code"
                            className="h-20 w-20 rounded-xl object-contain"
                          />
                        </div>
                      </a>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400 flex-1 min-w-0">
                        <p className="font-semibold text-dashboard-text">Scan to donate</p>
                        <p className="mt-1 leading-relaxed">Click to open full size. Right-click to save.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mx-5 mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3">
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>
            </div>
          )}
        </div>

        {/* -- RIGHT: Live preview -- */}
        <div className="relative z-0 w-full min-w-0 min-h-0 flex-1 lg:min-w-[420px] overflow-x-hidden overflow-y-auto" data-dashboard-preview>
          {/* Subtle background pattern */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(160deg, hsl(220 20% 97%) 0%, hsl(210 25% 95%) 50%, hsl(220 15% 93%) 100%)",
          }}>
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }} />
          </div>

          <div className="relative z-10 p-8 lg:p-12">
            <div className="sticky top-12 max-w-full">
              {/* Preview header */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                    <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Live Preview</p>
                    <p className="text-xs text-slate-500">Updates in real-time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFullscreenPreview(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/90 border border-slate-200/60 shadow-sm dark:bg-slate-800 dark:border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all duration-200"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Full preview
                  </button>
                  <a
                    href={giveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/90 border border-slate-200/60 shadow-sm dark:bg-slate-800 dark:border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all duration-200"
                  >
                    Open page
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              </div>

              {/* Device frame */}
              <div
                className="device-frame mx-auto w-full"
                style={{
                  maxWidth:
                    formDisplayMode === "full_width" || embedFormTheme !== "default"
                      ? "820px"
                      : "520px",
                }}
              >
                <div className="device-notch" />
                <div
                  className="w-full mx-auto overflow-hidden rounded-xl bg-white"
                  style={
                    embedFormTheme !== "default"
                      ? { fontFamily: "'Inter', sans-serif" }
                      : formDisplayMode === "compressed"
                        ? { color: "var(--stripe-dark)", fontFamily: previewFontFamily }
                        : {
                            border: "1px solid #e2e8f0",
                            borderRadius: formRadius,
                            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                            background: "#fff",
                            color: "var(--stripe-dark)",
                            fontFamily: previewFontFamily,
                          }
                  }
                >
                  {renderFormPreview()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
