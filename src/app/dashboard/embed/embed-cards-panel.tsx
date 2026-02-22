"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Copy,
  CopyPlus,
  Trash2,
  Check,
  Layout,
  ChevronRight,
  ChevronLeft,
  X,
  Eye,
  Globe,
  Save,
  Loader2,
  Image as ImageIcon,
  Video,
  Palette,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PexelsMediaPicker } from "@/components/pexels-media-picker";
import { isPexelsUrl } from "@/lib/pexels";
import { SPLITS_ENABLED } from "@/lib/feature-flags";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMBED_FORM_THEMES, type EmbedFormThemeId } from "@/lib/embed-form-themes";
import { CompressedDonationCard } from "@/components/compressed-donation-card";
import { GoalDonationCard } from "@/components/goal-donation-card";
import { GoalCompactDonationCard } from "@/components/goal-compact-donation-card";
import { MinimalDonationCard } from "@/components/minimal-donation-card";
import { SplitPercentageChart } from "@/components/split-percentage-chart";
import { PreviewIframe } from "@/components/preview-iframe";

import type { DesignSet } from "@/lib/stock-media";

type EmbedCard = {
  id: string;
  name: string;
  style: "full" | "compressed" | "goal" | "goal_compact" | "minimal";
  campaign_id: string | null;
  design_set: { media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null } | null;
  button_color: string | null;
  button_text_color: string | null;
  button_border_radius?: string | null;
  primary_color: string | null;
  is_enabled: boolean;
  page_section: string;
  sort_order: number;
  goal_description?: string | null;
  splits?: { percentage: number; accountId: string }[] | null;
};

type Campaign = { id: string; name: string; goal_amount_cents?: number | null; current_amount_cents?: number | null };

const STYLE_LABELS: Record<string, string> = {
  full: "Full form",
  compressed: "Compressed",
  goal: "Goal card",
  goal_compact: "Goal compact",
  minimal: "Minimal",
};

const PAGE_SECTION_LABELS: Record<string, string> = {
  donation: "Donation",
  hero: "Hero",
  about: "About",
  team: "Team",
  story: "Story",
};

const CREATE_NEW_VALUE = "__create__";
const DEFAULT_FORM_ID = "__default__";

/** Render an abstract visual thumbnail for the card grid (not the real component). */
function renderCardGridThumb(card: EmbedCard) {
  const accent = card.button_color || "#10b981";
  const accentText = card.button_text_color || "#ffffff";

  const styleAbstractions: Record<string, React.ReactNode> = {
    compressed: (
      <div className="w-full rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-600/40 bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700" />
        <div className="p-3 space-y-2">
          <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full w-3/4" />
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full w-1/2" />
          <div className="h-7 rounded-lg mt-2" style={{ background: accent, opacity: 0.9 }}>
            <div className="h-full flex items-center justify-center">
              <span className="text-[9px] font-bold" style={{ color: accentText }}>Donate</span>
            </div>
          </div>
        </div>
      </div>
    ),
    full: (
      <div className="w-full rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-600/40 bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-20 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700" />
        <div className="p-3 space-y-2">
          <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full w-3/4" />
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full w-1/2" />
          <div className="grid grid-cols-3 gap-1 mt-1">
            <div className="h-5 rounded bg-slate-100 dark:bg-slate-700" />
            <div className="h-5 rounded" style={{ background: accent, opacity: 0.3 }} />
            <div className="h-5 rounded bg-slate-100 dark:bg-slate-700" />
          </div>
          <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded w-full" />
          <div className="h-7 rounded-lg" style={{ background: accent, opacity: 0.9 }}>
            <div className="h-full flex items-center justify-center">
              <span className="text-[9px] font-bold" style={{ color: accentText }}>Donate</span>
            </div>
          </div>
        </div>
      </div>
    ),
    goal: (
      <div className="w-full rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-600/40 bg-white dark:bg-slate-800 shadow-sm">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full w-1/3" />
            <div className="h-2 rounded-full w-1/4" style={{ background: accent, opacity: 0.4 }} />
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full w-2/3" />
          <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full w-2/5" style={{ background: accent }} />
          </div>
          <div className="h-7 rounded-lg mt-1" style={{ background: accent, opacity: 0.9 }}>
            <div className="h-full flex items-center justify-center">
              <span className="text-[9px] font-bold" style={{ color: accentText }}>Donate</span>
            </div>
          </div>
        </div>
      </div>
    ),
    goal_compact: (
      <div className="w-full rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-600/40 bg-white dark:bg-slate-800 shadow-sm">
        <div className="p-3 space-y-2">
          <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full w-2/3" />
          <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full w-3/5" style={{ background: accent }} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 rounded-full w-1/4" style={{ background: accent, opacity: 0.4 }} />
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full w-1/4" />
          </div>
          <div className="h-7 rounded-lg" style={{ background: accent, opacity: 0.9 }}>
            <div className="h-full flex items-center justify-center">
              <span className="text-[9px] font-bold" style={{ color: accentText }}>Donate</span>
            </div>
          </div>
        </div>
      </div>
    ),
    minimal: (
      <div className="w-full rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-600/40 bg-white dark:bg-slate-800 shadow-sm">
        <div className="p-3 space-y-2">
          <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full w-1/2" />
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full w-1/3" />
          <div className="h-7 rounded-lg mt-1" style={{ background: accent, opacity: 0.9 }}>
            <div className="h-full flex items-center justify-center">
              <span className="text-[9px] font-bold" style={{ color: accentText }}>Donate</span>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="w-full max-w-[180px] mx-auto">
      {styleAbstractions[card.style] ?? styleAbstractions.compressed}
    </div>
  );
}

/** Render the real card component for the fullscreen preview modal. */
function renderCardFullPreview(
  card: EmbedCard,
  organizationName: string,
  slug: string,
  baseUrl: string,
  campaigns: Campaign[],
) {
  const ds = "w-full max-w-[320px]";
  const campaign = card.campaign_id ? campaigns.find((c) => c.id === card.campaign_id) : null;
  const designSet = card.design_set as DesignSet | null | undefined;

  if (card.style === "compressed") {
    return (
      <div className={`${ds} mx-auto`}>
        <CompressedDonationCard
          organizationName={organizationName}
          slug={slug}
          headerImageUrl={designSet?.media_url ?? undefined}
          headerText={designSet?.title ?? "Make a Donation"}
          subheaderText={designSet?.subtitle ?? `Support ${organizationName}`}
          designSets={designSet ? [designSet] : null}
          buttonColor={card.button_color ?? undefined}
          buttonTextColor={card.button_text_color ?? undefined}
          borderRadius={card.button_border_radius ?? undefined}
          basePath={baseUrl}
        />
      </div>
    );
  }
  if (card.style === "full" || card.id === DEFAULT_FORM_ID) {
    return (
      <div className="w-full max-w-[480px] mx-auto overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-1/2 min-h-[140px] md:min-h-[200px] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 shrink-0">
            {designSet?.media_url ? (
              designSet.media_type === "video" ? (
                <video src={designSet.media_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" aria-hidden />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={designSet.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )
            ) : null}
          </div>
          <div className="flex flex-col justify-center p-5 md:p-6 flex-1 min-w-0">
            <h3 className="text-base font-bold text-dashboard-text">{designSet?.title ?? "Make a Donation"}</h3>
            <p className="text-sm text-dashboard-text-muted mt-1">{designSet?.subtitle ?? `Support ${organizationName}`}</p>
            <div className="mt-4 space-y-2">
              <div className="h-9 rounded-lg bg-slate-100 dark:bg-slate-700" />
              <div className="h-9 rounded-lg bg-slate-100 dark:bg-slate-700 w-3/4" />
            </div>
            <div
              className="mt-4 h-10 rounded-lg flex items-center justify-center font-semibold text-sm"
              style={{
                background: card.button_color ?? "#059669",
                color: card.button_text_color ?? "#ffffff",
                borderRadius: card.button_border_radius ?? "8px",
              }}
            >
              Donate
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (card.style === "goal" && campaign) {
    const goalCents = campaign.goal_amount_cents ?? 10000;
    const currentCents = campaign.current_amount_cents ?? 0;
    return (
      <div className={`${ds} mx-auto`}>
        <GoalDonationCard
          organizationName={organizationName}
          slug={slug}
          designSet={designSet ?? undefined}
          goalDescription={card.goal_description ?? undefined}
          buttonColor={card.button_color ?? undefined}
          buttonTextColor={card.button_text_color ?? undefined}
          borderRadius={card.button_border_radius ?? undefined}
          primaryColor={card.primary_color ?? undefined}
          goalAmountCents={goalCents}
          currentAmountCents={currentCents}
          campaignId={card.campaign_id ?? undefined}
          basePath={baseUrl}
        />
      </div>
    );
  }
  if (card.style === "goal_compact" && campaign) {
    const goalCents = campaign.goal_amount_cents ?? 10000;
    const currentCents = campaign.current_amount_cents ?? 0;
    return (
      <div className={`${ds} mx-auto`}>
        <GoalCompactDonationCard
          organizationName={organizationName}
          slug={slug}
          goalDescription={card.goal_description ?? undefined}
          buttonColor={card.button_color ?? undefined}
          buttonTextColor={card.button_text_color ?? undefined}
          borderRadius={card.button_border_radius ?? undefined}
          primaryColor={card.primary_color ?? undefined}
          goalAmountCents={goalCents}
          currentAmountCents={currentCents}
          campaignId={card.campaign_id ?? undefined}
          basePath={baseUrl}
        />
      </div>
    );
  }
  if (card.style === "minimal") {
    return (
      <div className={`${ds} mx-auto`}>
        <MinimalDonationCard
          organizationName={organizationName}
          slug={slug}
          designSet={designSet ?? undefined}
          buttonColor={card.button_color ?? undefined}
          buttonTextColor={card.button_text_color ?? undefined}
          borderRadius={card.button_border_radius ?? undefined}
          basePath={baseUrl}
        />
      </div>
    );
  }
  return (
    <div className={`${ds} rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden`}>
      <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600" />
      <div className="p-4">
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full" />
        <div className="h-3 bg-emerald-500/20 rounded w-full mt-2" />
      </div>
    </div>
  );
}

/* -- Fullscreen Card Preview Modal -- */
function CardPreviewModal({
  isOpen,
  onClose,
  card,
  organizationName,
  slug,
  baseUrl,
  campaigns,
}: {
  isOpen: boolean;
  onClose: () => void;
  card: EmbedCard | null;
  organizationName: string;
  slug: string;
  baseUrl: string;
  campaigns: Campaign[];
}) {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-[90vw] max-w-[480px] max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl shadow-black/20 p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Full Preview</p>
          <h3 className="text-lg font-bold text-slate-900">{card.name}</h3>
          <p className="text-sm text-slate-500 mt-1">{STYLE_LABELS[card.style] ?? card.style}</p>
        </div>
        <div className="flex items-center justify-center">
          {renderCardFullPreview(card, organizationName, slug, baseUrl, campaigns)}
        </div>
      </div>
    </div>
  );
}

type Props = {
  organizationId: string;
  organizationName: string;
  slug: string;
  baseUrl: string;
  campaigns: Campaign[];
  orgPageEmbedCardId?: string | null;
  websiteEmbedCardId?: string | null;
  /** When true, hide the Website button (website form is the Theme form) */
  hideWebsiteButton?: boolean;
  hasDefaultForm?: boolean;
  defaultFormDisplayMode?: "full" | "compressed" | "full_width";
  defaultFormDesignSet?: DesignSet | null;
  defaultFormButtonColor?: string | null;
  defaultFormButtonTextColor?: string | null;
  defaultFormBorderRadius?: string | null;
  defaultEmbedFormTheme?: EmbedFormThemeId | null;
  connectedPeers?: { id: string; name: string; slug: string; stripe_connect_account_id: string }[];
  splitRecipientLimit?: number;
  currentPlan?: "free" | "growth" | "pro";
};

export function EmbedCardsPanel({
  organizationId,
  organizationName,
  slug,
  baseUrl,
  campaigns,
  orgPageEmbedCardId = null,
  websiteEmbedCardId = null,
  hideWebsiteButton = false,
  hasDefaultForm = false,
  defaultFormDisplayMode = "full",
  defaultFormDesignSet = null,
  defaultFormButtonColor = null,
  defaultFormButtonTextColor = null,
  defaultFormBorderRadius = null,
  defaultEmbedFormTheme = "default",
  connectedPeers = [],
  splitRecipientLimit = Infinity,
  currentPlan = "free",
}: Props) {
  const [cards, setCards] = useState<EmbedCard[]>([]);
  const [deletedCards, setDeletedCards] = useState<EmbedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pageCardId, setPageCardId] = useState<string | null>(orgPageEmbedCardId ?? null);
  const [websiteCardId, setWebsiteCardId] = useState<string | null>(websiteEmbedCardId ?? null);
  const [previewCard, setPreviewCard] = useState<EmbedCard | null>(null);
  const [activeTab, setActiveTab] = useState<"forms" | "edit">("forms");
  const router = useRouter();

  const handleThemeSelect = async (theme: EmbedFormThemeId) => {
    try {
      const res = await fetch("/api/form-customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, embed_form_theme: theme }),
      });
      if (!res.ok) throw new Error("Failed to save theme");
      toast.success("Theme saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save theme");
    }
  };

  useEffect(() => {
    setPageCardId(orgPageEmbedCardId ?? null);
  }, [orgPageEmbedCardId]);
  useEffect(() => {
    setWebsiteCardId(websiteEmbedCardId ?? null);
  }, [websiteEmbedCardId]);

  const fetchCards = useCallback(async (): Promise<EmbedCard[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/embed-cards?organizationId=${organizationId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      const list = Array.isArray(data) ? data : [];
      setCards(list);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch cards");
      setCards([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchDeletedCards = useCallback(async () => {
    try {
      const res = await fetch(`/api/embed-cards?organizationId=${organizationId}&deletedOnly=true`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDeletedCards(data);
      }
    } catch {
      // ignore
    }
  }, [organizationId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    fetchDeletedCards();
  }, [fetchDeletedCards]);

  useEffect(() => {
    const count = (hasDefaultForm ? 1 : 0) + cards.length;
    if (!loading && count > 0 && selectedCardId == null) {
      setSelectedCardId(hasDefaultForm ? DEFAULT_FORM_ID : cards[0].id);
    }
  }, [loading, cards, selectedCardId, hasDefaultForm]);

  /** When hideWebsiteButton (Custom forms page), auto-open editor for first form */
  useEffect(() => {
    if (hideWebsiteButton && !loading && cards.length > 0 && editingId == null && !creating) {
      setEditingId(cards[0].id);
      setSelectedCardId(cards[0].id);
    }
  }, [hideWebsiteButton, loading, cards, editingId, creating]);

  const modalOpen = creating;
  const closeModal = () => {
    setCreating(false);
  };
  const closeEditor = () => {
    setEditingId(null);
    setActiveTab("forms");
  };

  const handleCreate = async (payload: Partial<EmbedCard>) => {
    setError(null);
    try {
      const res = await fetch("/api/embed-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      await fetchCards();
      closeModal();
      setSelectedCardId(data.id);
      setExpandedId(data.id);
      if (hideWebsiteButton) setEditingId(data.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const handleUpdate = async (id: string, payload: Partial<EmbedCard>) => {
    setError(null);
    try {
      const res = await fetch(`/api/embed-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      await fetchCards();
      toast.success("Form saved");
      if (!hideWebsiteButton) {
        setEditingId(null);
        setActiveTab("forms");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string, cardName?: string) => {
    const name = cardName ?? "this card";
    if (!confirm(`Delete "${name}"? You can restore it later from the list below.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/embed-cards/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setExpandedId(null);
      setEditingId(null);
      const remaining = await fetchCards();
      if (selectedCardId === id) {
        setSelectedCardId(remaining[0]?.id ?? null);
      }
      await fetchDeletedCards();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleDuplicate = async (card: EmbedCard) => {
    await handleCreate({
      name: `${card.name} (copy)`,
      style: card.style,
      campaign_id: card.campaign_id,
      design_set: card.design_set,
      button_color: card.button_color,
      button_text_color: card.button_text_color,
      primary_color: card.primary_color,
      goal_description: card.goal_description,
      is_enabled: false,
      page_section: card.page_section,
      sort_order: (cards.length + 1) * 10,
      splits: (card.splits as { percentage: number; accountId: string }[] | undefined) ?? undefined,
    });
  };

  const handleSetPageCard = async (cardId: string | null) => {
    setError(null);
    try {
      const res = await fetch("/api/form-customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, org_page_embed_card_id: cardId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setPageCardId(cardId);
      toast.success("Org page form updated");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set page card");
    }
  };

  const handleSetWebsiteCard = async (cardId: string | null) => {
    setError(null);
    try {
      const res = await fetch("/api/form-customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, website_embed_card_id: cardId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setWebsiteCardId(cardId);
      toast.success("Website form updated");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set website form");
    }
  };

  const handleRestore = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/embed-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      if (!res.ok) throw new Error("Failed to restore");
      await fetchCards();
      await fetchDeletedCards();
      setSelectedCardId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restore");
    }
  };

  const handleCopyIframe = async (id: string) => {
    const base = `${baseUrl.replace(/\/$/, "")}/give/${slug}/embed`;
    const url = id === DEFAULT_FORM_ID ? base : `${base}?card=${id}`;
    const code = `<iframe src="${url}" width="100%" height="600" frameborder="0" title="Donate to ${slug}"></iframe>`;
    await navigator.clipboard.writeText(code);
    toast.success("Embed code copied to clipboard");
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const campaignsWithGoals = campaigns.filter((c) => c.goal_amount_cents != null && c.goal_amount_cents > 0);

  const defaultCard: EmbedCard | null = hasDefaultForm
    ? {
        id: DEFAULT_FORM_ID,
        name: "Main donation form",
        style: defaultFormDisplayMode === "compressed" ? "compressed" : "full",
        campaign_id: null,
        design_set: defaultFormDesignSet,
        button_color: defaultFormButtonColor,
        button_text_color: defaultFormButtonTextColor,
        button_border_radius: defaultFormBorderRadius,
        primary_color: null,
        is_enabled: true,
        page_section: "donation",
        sort_order: -1,
      }
    : null;

  const displayCards = defaultCard ? [defaultCard, ...cards] : cards;
  const selectedCard = selectedCardId ? displayCards.find((c) => c.id === selectedCardId) : null;
  const editingCard = editingId ? cards.find((c) => c.id === editingId) : null;

  return (
    <section className="dashboard-fade-in min-w-0 overflow-hidden">
      {/* Section header */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-dashboard-text">Custom forms</h2>
          <p className="text-sm text-dashboard-text-muted mt-1.5 max-w-lg leading-relaxed">
            {hideWebsiteButton
              ? "Create as many forms as you need. Each form has its own design, embed code, and payment splits. Share different forms with different partners — configure splits per form for each use case."
              : "Build donation forms for your org page and website. Use the buttons below to assign which form appears where."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={creating}
          className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
        >
          <Plus className="h-4 w-4" />
          Add form
        </button>
      </div>

      {/* When hideWebsiteButton (Custom forms page): form selector + editor as main content. Else: tabs. */}
      {hideWebsiteButton ? (
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {cards.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="form-selector" className="text-sm font-medium text-dashboard-text-muted">Editing:</label>
              <select
                id="form-selector"
                value={editingId ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) {
                    setEditingId(id);
                    setSelectedCardId(id);
                  }
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-dashboard-text"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setActiveTab("forms")}
              className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                activeTab === "forms"
                  ? "bg-white dark:bg-slate-700 text-dashboard-text shadow-sm"
                  : "text-dashboard-text-muted hover:text-dashboard-text"
              }`}
            >
              My forms
            </button>
            <button
              type="button"
              onClick={() => {
                if (editingId) setActiveTab("edit");
                else if (cards.length > 0) {
                  setEditingId(cards[0].id);
                  setSelectedCardId(cards[0].id);
                  setActiveTab("edit");
                }
              }}
              className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                activeTab === "edit"
                  ? "bg-white dark:bg-slate-700 text-dashboard-text shadow-sm"
                  : "text-dashboard-text-muted hover:text-dashboard-text"
              }`}
            >
              Edit form
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200/60 px-5 py-3 dark:bg-red-900/20 dark:border-red-800/30">
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        </div>
      )}

      {/* Editor content: when hideWebsiteButton always show editor; else only when Edit form tab */}
      {(hideWebsiteButton || activeTab === "edit") && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          {editingCard ? (
            hideWebsiteButton ? (
              <CustomFormEditor
                card={editingCard}
                organizationName={organizationName}
                slug={slug}
                baseUrl={baseUrl}
                campaigns={campaigns}
                campaignsWithGoals={campaignsWithGoals}
                connectedPeers={connectedPeers}
                splitRecipientLimit={splitRecipientLimit}
                currentPlan={currentPlan}
                onSave={(p) => handleUpdate(editingCard.id, p)}
                onCancel={closeEditor}
                onCopyEmbed={() => handleCopyIframe(editingCard.id)}
              />
            ) : (
              <CardEditor
                card={editingCard}
                campaigns={campaigns}
                campaignsWithGoals={campaignsWithGoals}
                connectedPeers={connectedPeers}
                onSave={(p) => handleUpdate(editingCard.id, p)}
                onCancel={closeEditor}
              />
            )
          ) : hideWebsiteButton && !loading && cards.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-dashboard-text-muted mb-4">Create your first custom form to get started.</p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Create form
              </button>
            </div>
          ) : !hideWebsiteButton ? (
            <div className="p-12 text-center">
              <p className="text-dashboard-text-muted mb-4">Select a form from My forms to edit it, or create a new one.</p>
              <button
                type="button"
                onClick={() => setActiveTab("forms")}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Go to My forms
              </button>
            </div>
          ) : hideWebsiteButton && cards.length > 0 ? (
            <div className="p-12 text-center">
              <p className="text-dashboard-text-muted mb-4">Select a form from the dropdown above to edit it.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* My forms tab content — only when not hideWebsiteButton (embed page has tabs) */}
      {!hideWebsiteButton && activeTab === "forms" && (
        <>
      {/* Empty state */}
      {!loading && displayCards.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-900/30 mx-auto mb-5">
            <Layout className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-dashboard-text mb-2">No custom forms yet</p>
          <p className="text-sm text-dashboard-text-muted mb-6 max-w-md mx-auto">Create forms with different designs and splits for different partners. Each form gets its own embed code — share with whoever needs it.</p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            Create your first custom form
          </button>
        </div>
      )}

      {/* Card grid */}
      {displayCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayCards.map((card) => (
            <div key={card.id} className="flex flex-col">
              {/* Card preview box */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedCardId(card.id);
                  setExpandedId(card.id === DEFAULT_FORM_ID ? null : card.id);
                  if (card.id !== DEFAULT_FORM_ID) {
                    setEditingId(card.id);
                    setActiveTab("edit");
                  } else {
                    setEditingId(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedCardId(card.id);
                    setExpandedId(card.id === DEFAULT_FORM_ID ? null : card.id);
                    if (card.id !== DEFAULT_FORM_ID) {
                      setEditingId(card.id);
                      setActiveTab("edit");
                    } else setEditingId(null);
                  }
                }}
                className={`group relative w-full rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80 ${
                  selectedCardId === card.id
                    ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                }`}
                style={{ boxShadow: selectedCardId === card.id ? undefined : "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                {/* Selection check */}
                {selectedCardId === card.id && (
                  <div className="absolute top-2.5 left-2.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
                {/* Expand button on hover */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewCard(card); }}
                  className="absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all duration-200"
                  title="Full preview"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                {/* Card content */}
                <div className="p-5 flex items-center justify-center">
                  {renderCardGridThumb(card)}
                </div>
                {/* Label footer */}
                <div className="px-4 py-3 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700/50">
                  <Layout className={`h-3.5 w-3.5 shrink-0 ${selectedCardId === card.id ? "text-emerald-600" : "text-slate-400"}`} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-semibold truncate ${selectedCardId === card.id ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>
                      {card.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {STYLE_LABELS[card.style] ?? card.style}
                    </span>
                  </div>
                </div>
              </div>
              {/* Card actions */}
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCopyIframe(card.id); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  {copiedId === card.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedId === card.id ? "Copied" : "Copy embed"}
                </button>
                {card.id !== DEFAULT_FORM_ID && (
                  <>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(card.id); setActiveTab("edit"); }} className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDuplicate(card); }} className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" title="Duplicate"><CopyPlus className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(card.id, card.name); }} className="p-2 rounded-xl border border-red-200 dark:border-red-800/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    {(card.page_section ?? "donation") === "donation" && (
                      pageCardId === card.id ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleSetPageCard(null); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium transition-colors"><Check className="h-3 w-3" /> Org page</button>
                      ) : (
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleSetPageCard(card.id); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">Org page</button>
                      )
                    )}
                    {!hideWebsiteButton && (
                      <>
                        {/* Website form: Main form (DEFAULT_FORM_ID) is used when websiteCardId is null */}
                        {((card.id === DEFAULT_FORM_ID && websiteCardId == null) || websiteCardId === card.id) ? (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleSetWebsiteCard(null); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium transition-colors" title={card.id === DEFAULT_FORM_ID ? "Main form is used on website" : "Click to use main form on website instead"}><Globe className="h-3 w-3" /> Website</button>
                        ) : (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleSetWebsiteCard(card.id === DEFAULT_FORM_ID ? null : card.id); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors" title="Use this form on your website"><Globe className="h-3 w-3" /> Website</button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add form placeholder */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setCreating(true)}
              disabled={creating}
              className="min-h-[160px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:border-emerald-400/60 hover:bg-emerald-50/30 dark:hover:border-emerald-600/40 dark:hover:bg-emerald-900/10 flex flex-col items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <Plus className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Add form</span>
            </button>
          </div>
        </div>
      )}

      {/* Recently deleted */}
      {deletedCards.length > 0 && (
        <div className="mt-10 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-6">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Recently deleted</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">Restore a card you accidentally removed.</p>
          <ul className="space-y-2">
            {deletedCards.map((card) => (
              <li key={card.id} className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900 px-4 py-3">
                <span className="text-sm font-medium text-dashboard-text">{card.name}</span>
                <button
                  type="button"
                  onClick={() => handleRestore(card.id)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
        </>
      )}

      {/* Fullscreen card preview modal */}
      <CardPreviewModal
        isOpen={!!previewCard}
        onClose={() => setPreviewCard(null)}
        card={previewCard}
        organizationName={organizationName}
        slug={slug}
        baseUrl={baseUrl}
        campaigns={campaigns}
      />

      {/* Modal for Add form only */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Add embed card</DialogTitle>
          {creating && (
            <CardEditor
              organizationId={organizationId}
              currentTheme={defaultEmbedFormTheme ?? "default"}
              onThemeSelect={handleThemeSelect}
              campaigns={campaigns}
              campaignsWithGoals={campaignsWithGoals}
              connectedPeers={connectedPeers}
              onSave={(p) => handleCreate(p)}
              onCancel={closeModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** Full panel editor for custom forms — like ThemeFormEditor, not Typeform wizard. */
function CustomFormEditor({
  card,
  organizationName,
  slug,
  baseUrl,
  campaigns,
  campaignsWithGoals,
  connectedPeers = [],
  splitRecipientLimit = Infinity,
  currentPlan = "free",
  onSave,
  onCancel,
  onCopyEmbed,
}: {
  card: EmbedCard;
  organizationName: string;
  slug: string;
  baseUrl: string;
  campaigns: Campaign[];
  campaignsWithGoals: Campaign[];
  connectedPeers?: { id: string; name: string; slug: string; stripe_connect_account_id: string }[];
  splitRecipientLimit?: number;
  currentPlan?: "free" | "growth" | "pro";
  onSave: (payload: Partial<EmbedCard>) => void;
  onCancel: () => void;
  onCopyEmbed?: () => void;
}) {
  const [name, setName] = useState(card.name);
  const [style, setStyle] = useState<EmbedCard["style"]>(card.style);
  const [campaignId, setCampaignId] = useState(card.campaign_id ?? "");
  const [goalDescription, setGoalDescription] = useState(card.goal_description ?? "");
  const defaultDesignSet = { media_type: "image" as const, media_url: null as string | null, title: null as string | null, subtitle: null as string | null };
  const initialDesignSet = card.design_set && typeof card.design_set === "object" && (card.design_set.media_type || card.design_set.media_url)
    ? { media_type: (card.design_set.media_type === "video" ? "video" : "image") as "image" | "video", media_url: card.design_set.media_url ?? null, title: card.design_set.title ?? null, subtitle: card.design_set.subtitle ?? null }
    : defaultDesignSet;
  const [designSet, setDesignSet] = useState(initialDesignSet);
  const [buttonColor, setButtonColor] = useState(card.button_color ?? "#059669");
  const [buttonTextColor, setButtonTextColor] = useState(card.button_text_color ?? "#ffffff");
  const [primaryColor, setPrimaryColor] = useState(card.primary_color ?? "#059669");
  const [buttonBorderRadius, setButtonBorderRadius] = useState(card.button_border_radius ?? "8px");
  const [isEnabled, setIsEnabled] = useState(card.is_enabled);
  const [pageSection, setPageSection] = useState(card.page_section);
  const [splits, setSplits] = useState<{ percentage: number; accountId: string }[]>(
    (card.splits as { percentage: number; accountId: string }[] | undefined) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [pexelsPicker, setPexelsPicker] = useState<"photos" | "videos" | null>(null);
  const [previewDisplayMode, setPreviewDisplayMode] = useState<"full_width" | "full" | "compressed">("full_width");
  const [previewTheme, setPreviewTheme] = useState("church-grace");

  useEffect(() => {
    setName(card.name);
    setStyle(card.style);
    setCampaignId(card.campaign_id ?? "");
    setGoalDescription(card.goal_description ?? "");
    if (card.design_set && typeof card.design_set === "object") {
      setDesignSet({ media_type: (card.design_set.media_type === "video" ? "video" : "image") as "image" | "video", media_url: card.design_set.media_url ?? null, title: card.design_set.title ?? null, subtitle: card.design_set.subtitle ?? null });
    }
    setButtonColor(card.button_color ?? "#059669");
    setButtonTextColor(card.button_text_color ?? "#ffffff");
    setPrimaryColor(card.primary_color ?? "#059669");
    setButtonBorderRadius(card.button_border_radius ?? "8px");
    setIsEnabled(card.is_enabled);
    setPageSection(card.page_section);
    setSplits((card.splits as { percentage: number; accountId: string }[] | undefined) ?? []);
  }, [card.id, card.name, card.style, card.campaign_id, card.goal_description, card.design_set, card.button_color, card.button_text_color, card.primary_color, card.button_border_radius, card.is_enabled, card.page_section, card.splits]);

  async function resolvePexelsUrl(): Promise<string | null> {
    const url = designSet.media_url?.trim();
    if (!url || !isPexelsUrl(url)) return url || null;
    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch("/api/pexels-resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, type: designSet.media_type }) });
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
    setResolveError(null);
    let mediaUrl = designSet.media_url?.trim() || null;
    if (mediaUrl && isPexelsUrl(mediaUrl)) {
      const resolved = await resolvePexelsUrl();
      if (resolved) mediaUrl = resolved;
      else { setSaving(false); return; }
    }
    try {
      await onSave({
        name: name.trim() || "Untitled card",
        style,
        campaign_id: ["goal", "goal_compact"].includes(style) && campaignId ? campaignId : null,
        goal_description: ["goal", "goal_compact"].includes(style) && goalDescription.trim() ? goalDescription.trim() : null,
        design_set: { media_type: designSet.media_type === "video" ? "video" : "image", media_url: mediaUrl, title: designSet.title?.trim() || null, subtitle: designSet.subtitle?.trim() || null },
        button_color: buttonColor.trim() || null,
        button_text_color: buttonTextColor.trim() || null,
        button_border_radius: buttonBorderRadius.trim() || null,
        primary_color: primaryColor.trim() || null,
        is_enabled: isEnabled,
        page_section: pageSection,
        splits: SPLITS_ENABLED && splits.length > 0 ? splits : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const previewCard: EmbedCard = {
    ...card,
    name,
    style,
    campaign_id: campaignId || null,
    goal_description: goalDescription || null,
    design_set: { ...designSet, media_url: designSet.media_url || null },
    button_color: buttonColor || null,
    button_text_color: buttonTextColor || null,
    button_border_radius: buttonBorderRadius || null,
    primary_color: primaryColor || null,
    is_enabled: isEnabled,
    page_section: pageSection,
    splits,
  };
  const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-dashboard-text text-sm";
  const labelClass = "block text-sm font-medium text-dashboard-text mb-1.5";

  return (
    <div className="flex flex-col lg:flex-row min-w-0 min-h-0 gap-8">
      {/* Left: Editor panels */}
      <div className="w-full lg:w-[400px] shrink-0 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)]">
        {/* Basics */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-dashboard-text">Basics</h3>
            <p className="text-xs text-dashboard-text-muted mt-0.5">Name and form style</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClass}>Form name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Building Fund" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value as EmbedCard["style"])} className={inputClass}>
                <option value="full">Full form</option>
                <option value="compressed">Compressed</option>
                <option value="goal">Goal card</option>
                <option value="goal_compact">Goal compact</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            {["goal", "goal_compact"].includes(style) && (
              <>
                <div>
                  <label className={labelClass}>Campaign</label>
                  <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={inputClass}>
                    <option value="">Select campaign</option>
                    {campaignsWithGoals.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Goal description</label>
                  <textarea value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="Describe what this campaign is about..." rows={2} className={inputClass} />
                </div>
                <p className="text-xs text-dashboard-text-muted"><Link href="/dashboard/goals" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Manage campaigns</Link></p>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-dashboard-text">Content</h3>
            <p className="text-xs text-dashboard-text-muted mt-0.5">Header, media, and copy</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClass}>Header (title)</label>
              <input type="text" value={designSet.title ?? ""} onChange={(e) => setDesignSet((s) => ({ ...s, title: e.target.value || null }))} placeholder="Make a Donation" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Subheader</label>
              <input type="text" value={designSet.subtitle ?? ""} onChange={(e) => setDesignSet((s) => ({ ...s, subtitle: e.target.value || null }))} placeholder="Support our mission" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Image or video</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setDesignSet((s) => ({ ...s, media_type: "image" }))} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${designSet.media_type === "image" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"}`}><ImageIcon className="h-3.5 w-3.5" /> Image</button>
                <button type="button" onClick={() => setDesignSet((s) => ({ ...s, media_type: "video" }))} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${designSet.media_type === "video" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"}`}><Video className="h-3.5 w-3.5" /> Video</button>
                <button type="button" onClick={() => setPexelsPicker(designSet.media_type === "video" ? "videos" : "photos")} className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">Pexels</button>
              </div>
              <div className="flex gap-2">
                <input type="url" value={designSet.media_url ?? ""} onChange={(e) => { setDesignSet((s) => ({ ...s, media_url: e.target.value || null })); setResolveError(null); }} placeholder="https://..." className={`flex-1 min-w-0 ${inputClass}`} />
                {designSet.media_url && isPexelsUrl(designSet.media_url) && (
                  <button type="button" onClick={async () => { const r = await resolvePexelsUrl(); if (r) setDesignSet((s) => ({ ...s, media_url: r })); }} disabled={resolving} className="shrink-0 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium disabled:opacity-50">Resolve</button>
                )}
              </div>
              {resolveError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{resolveError}</p>}
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-dashboard-text">Colors & shape</h3>
            <p className="text-xs text-dashboard-text-muted mt-0.5">Button, accent, and border radius</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClass}>Button border radius</label>
              <div className="flex gap-2 items-center">
                <input type="text" value={buttonBorderRadius} onChange={(e) => setButtonBorderRadius(e.target.value)} placeholder="8px" className={`flex-1 font-mono text-sm ${inputClass}`} />
                <span className="text-xs text-dashboard-text-muted shrink-0">e.g. 8px, 12px, 1rem</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Button</label>
                <div className="flex gap-2">
                  <input type="color" value={buttonColor.startsWith("#") ? buttonColor : "#059669"} onChange={(e) => setButtonColor(e.target.value)} className="h-10 w-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-600 shrink-0" />
                  <input type="text" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} placeholder="#059669" className={`flex-1 font-mono text-sm ${inputClass}`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Button text</label>
                <div className="flex gap-2">
                  <input type="color" value={buttonTextColor.startsWith("#") ? buttonTextColor : "#ffffff"} onChange={(e) => setButtonTextColor(e.target.value)} className="h-10 w-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-600 shrink-0" />
                  <input type="text" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} placeholder="#ffffff" className={`flex-1 font-mono text-sm ${inputClass}`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Primary accent</label>
                <div className="flex gap-2">
                  <input type="color" value={primaryColor.startsWith("#") ? primaryColor : "#059669"} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-600 shrink-0" />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#059669" className={`flex-1 font-mono text-sm ${inputClass}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Splits */}
        {SPLITS_ENABLED && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-dashboard-text">Payment splits</h3>
              <p className="text-xs text-dashboard-text-muted mt-0.5">Split donations to connected peers</p>
            </div>
            <div className="p-5">
              <SplitPercentageChart splits={splits} onSplitsChange={setSplits} connectedPeers={connectedPeers} organizationName={organizationName} compact maxRecipients={splitRecipientLimit} currentPlan={currentPlan} />
            </div>
          </div>
        )}

        {/* Display options */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-dashboard-text">Display</h3>
            <p className="text-xs text-dashboard-text-muted mt-0.5">Where and when to show</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClass}>Page section</label>
              <select value={pageSection} onChange={(e) => setPageSection(e.target.value)} className={inputClass}>
                <option value="donation">Donation</option>
                <option value="hero">Hero</option>
                <option value="about">About</option>
                <option value="team">Team</option>
                <option value="story">Story</option>
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="h-4 w-4 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm font-medium text-dashboard-text">Show on org page</span>
            </label>
          </div>
        </div>

        {/* Embed code */}
        {onCopyEmbed && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-dashboard-text">Embed code</h3>
              <p className="text-xs text-dashboard-text-muted mt-0.5">Copy the iframe code to embed this form on your website</p>
            </div>
            <div className="p-5">
              <div className="flex gap-2">
                <code className="flex-1 block p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-dashboard-text break-all">
                  {`<iframe src="${baseUrl.replace(/\/$/, "")}/give/${slug}/embed?card=${card.id}" width="100%" height="600" frameborder="0" title="Donate to ${slug}"></iframe>`}
                </code>
                <button type="button" onClick={onCopyEmbed} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-dashboard-text hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 text-dashboard-text hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
            Cancel
          </button>
        </div>
      </div>

      {/* Right: Live preview */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-2">Display mode</label>
                <div className="flex gap-2">
                {(["full_width", "full", "compressed"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPreviewDisplayMode(mode)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      previewDisplayMode === mode
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-dashboard-text-muted hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {mode === "full_width" ? "Full width" : mode === "full" ? "Regular" : "Compact"}
                  </button>
                ))}
                </div>
              </div>
              {previewDisplayMode === "compressed" && (
                <div>
                  <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5">Theme (compact)</label>
                  <select value={previewTheme} onChange={(e) => setPreviewTheme(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-dashboard-text text-sm">
                    <option value="church-grace">Church Grace</option>
                    <option value="modern-minimal">Modern Minimal</option>
                    <option value="warm-heritage">Warm Heritage</option>
                    <option value="bold-contemporary">Bold Contemporary</option>
                    <option value="dark-elegant">Dark Elegant</option>
                    <option value="vibrant-community">Vibrant Community</option>
                  </select>
                </div>
              )}
            </div>
            <div className="p-2 bg-slate-50/50 dark:bg-slate-800/30 min-h-[420px] overflow-hidden rounded-xl">
              <PreviewIframe
                src={`${baseUrl.replace(/\/$/, "")}/give/${slug}/embed?card=${card.id}${previewDisplayMode === "compressed" ? `&seamless=1&theme=${previewTheme}&mode=compressed` : ""}${previewDisplayMode === "full_width" ? "&fullscreen=1" : ""}`}
                title="Form preview"
                className="w-full rounded-xl border-0"
                minHeight={420}
              />
            </div>
            <p className="px-5 py-2 text-xs text-dashboard-text-muted">Live preview — save to update.</p>
          </div>
        </div>
      </div>

      {pexelsPicker && (
        <PexelsMediaPicker mode={pexelsPicker} onSelect={(url, type) => { setDesignSet((s) => ({ ...s, media_url: url, media_type: type })); setPexelsPicker(null); }} onClose={() => setPexelsPicker(null)} />
      )}
    </div>
  );
}

type CardEditorProps = {
  card?: EmbedCard;
  organizationId?: string;
  currentTheme?: EmbedFormThemeId;
  onThemeSelect?: (theme: EmbedFormThemeId) => Promise<void>;
  campaigns: Campaign[];
  campaignsWithGoals: Campaign[];
  connectedPeers?: { id: string; name: string; slug: string; stripe_connect_account_id: string }[];
  onSave: (payload: Partial<EmbedCard>) => void;
  onCancel: () => void;
};

function CardEditor({
  card,
  organizationId,
  currentTheme = "default",
  onThemeSelect,
  campaigns,
  campaignsWithGoals,
  connectedPeers = [],
  onSave,
  onCancel,
}: CardEditorProps) {
  const [name, setName] = useState(card?.name ?? "");
  const [style, setStyle] = useState<EmbedCard["style"]>(card?.style ?? "full");
  const [campaignId, setCampaignId] = useState(card?.campaign_id ?? "");
  const [goalDescription, setGoalDescription] = useState(card?.goal_description ?? "");
  const defaultDesignSet = {
    media_type: "image" as const,
    media_url: null as string | null,
    title: null as string | null,
    subtitle: null as string | null,
  };
  const initialDesignSet = card?.design_set && typeof card.design_set === "object" && (card.design_set.media_type || card.design_set.media_url)
    ? {
        media_type: (card.design_set.media_type === "video" ? "video" : "image") as "image" | "video",
        media_url: card.design_set.media_url ?? null,
        title: card.design_set.title ?? null,
        subtitle: card.design_set.subtitle ?? null,
      }
    : defaultDesignSet;
  const [designSet, setDesignSet] = useState(initialDesignSet);
  useEffect(() => {
    if (card?.design_set && typeof card.design_set === "object") {
      setDesignSet({
        media_type: (card.design_set.media_type === "video" ? "video" : "image") as "image" | "video",
        media_url: card.design_set.media_url ?? null,
        title: card.design_set.title ?? null,
        subtitle: card.design_set.subtitle ?? null,
      });
    } else if (card) {
      setDesignSet({ media_type: "image", media_url: null, title: null, subtitle: null });
    }
  }, [card?.id, card?.design_set]);
  const [buttonColor, setButtonColor] = useState(card?.button_color ?? "#059669");
  const [buttonTextColor, setButtonTextColor] = useState(card?.button_text_color ?? "#ffffff");
  const [primaryColor, setPrimaryColor] = useState(card?.primary_color ?? "#059669");
  const [isEnabled, setIsEnabled] = useState(card?.is_enabled ?? true);
  const [pageSection, setPageSection] = useState(card?.page_section ?? "donation");
  const [sortOrder, setSortOrder] = useState(card?.sort_order ?? 0);
  const [splits, setSplits] = useState<{ percentage: number; accountId: string }[]>(
    (card?.splits as { percentage: number; accountId: string }[] | undefined) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [pexelsPicker, setPexelsPicker] = useState<"photos" | "videos" | null>(null);
  const [newCampaigns, setNewCampaigns] = useState<Campaign[]>([]);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignGoal, setNewCampaignGoal] = useState("");

  const effectiveCampaignsWithGoals = [...campaignsWithGoals, ...newCampaigns];

  const hasThemeStep = !card && onThemeSelect;
  const hasGoalStep = ["goal", "goal_compact"].includes(style);
  const baseSteps = hasGoalStep ? (SPLITS_ENABLED ? 11 : 10) : (SPLITS_ENABLED ? 10 : 9);
  const totalSteps = hasThemeStep ? baseSteps + 1 : baseSteps;
  const splitsStepIndex = hasGoalStep ? (hasThemeStep ? 9 : 8) : (hasThemeStep ? 8 : 7);
  const stepOffset = hasThemeStep ? 1 : 0;
  const [step, setStep] = useState(0);

  const addSplit = () => setSplits((s) => [...s, { percentage: 0, accountId: "" }]);
  const updateSplit = (idx: number, field: "percentage" | "accountId", value: number | string) => {
    setSplits((s) => {
      const next = [...s];
      next[idx] = { ...next[idx]!, [field]: value };
      return next;
    });
  };
  const removeSplit = (idx: number) => setSplits((s) => s.filter((_, i) => i !== idx));

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/donation-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCampaignName.trim(),
          goal_amount_cents: newCampaignGoal ? Math.round(parseFloat(newCampaignGoal) * 100) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      const created: Campaign = {
        id: data.id,
        name: data.name,
        goal_amount_cents: data.goal_amount_cents ?? null,
        current_amount_cents: data.current_amount_cents ?? 0,
      };
      setNewCampaigns((prev) => [...prev, created]);
      setCampaignId(data.id);
      setNewCampaignName("");
      setNewCampaignGoal("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setCreatingCampaign(false);
    }
  };

  async function resolvePexelsUrl(): Promise<string | null> {
    const url = designSet.media_url?.trim();
    if (!url || !isPexelsUrl(url)) return url || null;
    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch("/api/pexels-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type: designSet.media_type }),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResolveError(null);
    try {
      let mediaUrl = typeof designSet?.media_url === "string" ? designSet.media_url.trim() || null : null;
      if (mediaUrl && isPexelsUrl(mediaUrl)) {
        const resolved = await resolvePexelsUrl();
        if (resolved) mediaUrl = resolved;
        else {
          setSaving(false);
          return;
        }
      }
      await onSave({
        name: name.trim() || "Untitled card",
        style,
        campaign_id: ["goal", "goal_compact"].includes(style) && campaignId ? campaignId : null,
        goal_description: ["goal", "goal_compact"].includes(style) && goalDescription.trim() ? goalDescription.trim() : null,
        design_set: {
          media_type: designSet?.media_type === "video" ? "video" : "image",
          media_url: mediaUrl,
          title: typeof designSet?.title === "string" ? designSet.title.trim() || null : null,
          subtitle: typeof designSet?.subtitle === "string" ? designSet.subtitle.trim() || null : null,
        },
        button_color: buttonColor.trim() || null,
        button_text_color: buttonTextColor.trim() || null,
        primary_color: primaryColor.trim() || null,
        is_enabled: isEnabled,
        page_section: pageSection,
        sort_order: sortOrder,
        splits: SPLITS_ENABLED && splits.length > 0 ? splits : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = totalSteps > 0 ? ((step + 1) / totalSteps) * 100 : 0;
  const isLastStep = step === totalSteps - 1;
  const isThemeStep = hasThemeStep && step === 0;
  const canNext = step < totalSteps - 1 && !isThemeStep;

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 transition-all duration-200";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-200";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-[400px]" aria-labelledby="card-editor-title">
      <h2 id="card-editor-title" className="sr-only">{card ? "Edit card" : "Create new card"}</h2>
      {pexelsPicker && (
        <PexelsMediaPicker
          mode={pexelsPicker}
          onSelect={(url, type) => {
            setDesignSet((s) => ({ ...s, media_url: url, media_type: type }));
            setPexelsPicker(null);
          }}
          onClose={() => setPexelsPicker(null)}
        />
      )}

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 rounded-t-xl">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {hasThemeStep && step === 0 && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Select a theme</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Choose a style for your embedded form.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EMBED_FORM_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={themeSaving}
                    onClick={async () => {
                      setThemeSaving(true);
                      try {
                        await onThemeSelect?.(t.id);
                        setStep(1);
                      } finally {
                        setThemeSaving(false);
                      }
                    }}
                    className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:border-emerald-400/60 disabled:opacity-60 disabled:cursor-not-allowed ${
                      currentTheme === t.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600"
                        : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{t.description}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {step === (hasThemeStep ? 1 : 0) && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Name this card</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">e.g. Building Fund, General Donation</p>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Building Fund" className={inputClass} autoFocus />
            </motion.div>
          )}
          {step === (hasThemeStep ? 2 : 1) && (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Choose a style</h3>
              <select value={style} onChange={(e) => setStyle(e.target.value as EmbedCard["style"])} className={inputClass}>
                <option value="full">Full form</option>
                <option value="compressed">Compressed</option>
                <option value="goal">Goal card</option>
                <option value="goal_compact">Goal compact</option>
                <option value="minimal">Minimal</option>
              </select>
            </motion.div>
          )}
          {step === (hasGoalStep ? 3 : 2) + stepOffset && hasGoalStep && (
            <motion.div
              key="campaign"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Link to a campaign</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Required for goal cards.</p>
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={inputClass}>
                <option value="">Select campaign</option>
                {effectiveCampaignsWithGoals.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {effectiveCampaignsWithGoals.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30 space-y-3">
                  <input type="text" value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} placeholder="Campaign name" className={inputClass} />
                  <input type="number" min={0} value={newCampaignGoal} onChange={(e) => setNewCampaignGoal(e.target.value)} placeholder="Goal amount in USD (optional)" className={inputClass} />
                  <button type="button" onClick={handleCreateCampaign} disabled={creatingCampaign || !newCampaignName.trim()} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    {creatingCampaign ? "Creating..." : "Create campaign"}
                  </button>
                </div>
              )}
              <div>
                <label className={labelClass}>Goal description</label>
                <textarea value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="Describe what this campaign is about..." rows={3} className={inputClass} />
              </div>
              <p className="text-sm text-slate-500"><Link href="/dashboard/goals" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Manage campaigns in Goals</Link></p>
            </motion.div>
          )}
          {step === (hasGoalStep ? 3 : 2) + stepOffset && (
            <motion.div
              key="mediaType"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Image or video?</h3>
              <select value={designSet.media_type ?? "image"} onChange={(e) => setDesignSet((s) => ({ ...s, media_type: e.target.value as "image" | "video" }))} className={inputClass}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </motion.div>
          )}
          {step === (hasGoalStep ? 4 : 3) + stepOffset && (
            <motion.div key="title" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add a title</h3>
              <input type="text" value={designSet.title ?? ""} onChange={(e) => setDesignSet((s) => ({ ...s, title: e.target.value || null }))} placeholder="Make a Donation" className={inputClass} />
            </motion.div>
          )}
          {step === (hasGoalStep ? 5 : 4) + stepOffset && (
            <motion.div key="subtitle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add a subtitle</h3>
              <input type="text" value={designSet.subtitle ?? ""} onChange={(e) => setDesignSet((s) => ({ ...s, subtitle: e.target.value || null }))} placeholder="Support our mission" className={inputClass} />
            </motion.div>
          )}
          {step === (hasGoalStep ? 6 : 5) + stepOffset && (
            <motion.div
              key="mediaUrl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add media</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Paste a direct URL or search Pexels for free stock media.</p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="url"
                  value={designSet.media_url ?? ""}
                  onChange={(e) => { setDesignSet((s) => ({ ...s, media_url: e.target.value || null })); setResolveError(null); }}
                  placeholder="https://..."
                  className={`flex-1 min-w-[200px] ${inputClass}`}
                />
                <button type="button" onClick={() => setPexelsPicker(designSet.media_type === "video" ? "videos" : "photos")} className="shrink-0 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-700">
                  Search Pexels
                </button>
                {designSet.media_url && isPexelsUrl(designSet.media_url) && (
                  <button
                    type="button"
                    onClick={async () => {
                      const resolved = await resolvePexelsUrl();
                      if (resolved) setDesignSet((s) => ({ ...s, media_url: resolved }));
                    }}
                    disabled={resolving}
                    className="shrink-0 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800"
                  >
                    {resolving ? "Resolving..." : "Resolve URL"}
                  </button>
                )}
              </div>
              {resolveError && <p className="text-sm text-red-600">{resolveError}</p>}
            </motion.div>
          )}
          {step === (hasGoalStep ? 7 : 6) + stepOffset && (
            <motion.div
              key="colors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Customize colors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30">
                  <label className={labelClass}>Button</label>
                  <div className="flex gap-2.5">
                    <input type="color" value={buttonColor.startsWith("#") ? buttonColor : "#059669"} onChange={(e) => setButtonColor(e.target.value)} className="h-11 w-11 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-600" />
                    <input type="text" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} placeholder="#059669" className={`flex-1 font-mono text-sm ${inputClass}`} />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30">
                  <label className={labelClass}>Text</label>
                  <div className="flex gap-2.5">
                    <input type="color" value={buttonTextColor.startsWith("#") ? buttonTextColor : "#ffffff"} onChange={(e) => setButtonTextColor(e.target.value)} className="h-11 w-11 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-600" />
                    <input type="text" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} placeholder="#ffffff" className={`flex-1 font-mono text-sm ${inputClass}`} />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30">
                  <label className={labelClass}>Primary</label>
                  <div className="flex gap-2.5">
                    <input type="color" value={primaryColor.startsWith("#") ? primaryColor : "#059669"} onChange={(e) => setPrimaryColor(e.target.value)} className="h-11 w-11 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-600" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#059669" className={`flex-1 font-mono text-sm ${inputClass}`} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {SPLITS_ENABLED && step === splitsStepIndex && (
            <motion.div
              key="splits"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payment splits (optional)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">This form gets its own splits. Configure different splits for different forms.</p>
              {connectedPeers.length === 0 && <p className="text-amber-600 text-sm">No connected peers with Stripe Connect yet.</p>}
              <button type="button" onClick={addSplit} disabled={connectedPeers.length === 0} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Add split
              </button>
              {splits.map((s, i) => (
                <div key={i} className="flex gap-2.5">
                  <select value={s.accountId} onChange={(e) => updateSplit(i, "accountId", e.target.value)} className={`flex-1 ${inputClass}`}>
                    <option value="">Select peer</option>
                    {connectedPeers.map((o) => (
                      <option key={o.id} value={o.stripe_connect_account_id}>{o.name}</option>
                    ))}
                  </select>
                  <input type="number" min={1} max={100} value={s.percentage || ""} onChange={(e) => updateSplit(i, "percentage", parseInt(e.target.value, 10) || 0)} placeholder="%" className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-base font-medium dark:border-slate-600 dark:bg-slate-800" />
                  <button type="button" onClick={() => removeSplit(i)} className="p-2.5 text-red-500 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {splits.length > 0 && <p className="text-sm text-slate-600 dark:text-slate-300">Total: {splits.reduce((sum, e) => sum + (e.percentage ?? 0), 0)}%</p>}
            </motion.div>
          )}
          {step === (hasGoalStep ? (SPLITS_ENABLED ? 9 : 8) : (SPLITS_ENABLED ? 8 : 7)) + stepOffset && (
            <motion.div
              key="pageSection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Where to show this card</h3>
              <select value={pageSection} onChange={(e) => setPageSection(e.target.value)} className={inputClass}>
                <option value="donation">Donation (main section)</option>
                <option value="hero">Hero (below hero)</option>
                <option value="about">About (below about)</option>
                <option value="team">Team (below team)</option>
                <option value="story">Story (below story)</option>
              </select>
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30">
                <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="h-4 w-4 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Show on org page</span>
              </label>
            </motion.div>
          )}
          {step === (hasGoalStep ? (SPLITS_ENABLED ? 10 : 9) : (SPLITS_ENABLED ? 9 : 8)) + stepOffset && (
            <motion.div
              key="save"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-900/30 mx-auto">
                <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">All set!</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Review your card and hit save.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="shrink-0 flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">{step + 1} of {totalSteps}</span>
          {canNext && (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition-all duration-200">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {isLastStep && (
            <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all duration-200">
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
