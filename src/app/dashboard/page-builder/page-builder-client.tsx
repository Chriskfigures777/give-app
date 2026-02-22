"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, GripVertical, Upload } from "lucide-react";
import { PexelsMediaPicker } from "@/components/pexels-media-picker";
import { FormTemplateBox } from "@/components/form-template-box";
import { CompressedDonationCard } from "@/components/compressed-donation-card";
import { GoalDonationCard } from "@/components/goal-donation-card";
import { GoalCompactDonationCard } from "@/components/goal-compact-donation-card";
import { MinimalDonationCard } from "@/components/minimal-donation-card";
import type { BlockConfig } from "@/app/api/public-page-blocks/route";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import type { DesignSet } from "@/lib/stock-media";
import { savePublicPage } from "@/app/dashboard/profile/actions";

const DEFAULT_FORM_ID = "__default__";

type DonationCard = {
  id: string;
  name: string;
  style: "full" | "compressed" | "goal" | "goal_compact" | "minimal";
  campaign_id?: string | null;
  design_set?: { media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null } | null;
  button_color?: string | null;
  button_text_color?: string | null;
  primary_color?: string | null;
  goal_description?: string | null;
};

type Campaign = { id: string; name: string; goal_amount_cents?: number | null; current_amount_cents?: number | null };

type PublicPageBlock = {
  id: string;
  organization_id: string;
  block_type: "video" | "image" | "donation_form";
  sort_order: number;
  config: BlockConfig;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  organizationId: string;
  organizationName: string;
  slug: string;
  baseUrl: string;
  campaigns: Campaign[];
  donationCards: DonationCard[];
  orgPageEmbedCardId: string | null;
};

function renderCardThumbnail(
  card: DonationCard,
  organizationName: string,
  slug: string,
  baseUrl: string,
  campaigns: Campaign[],
  compact: boolean
) {
  const ds = compact ? "max-w-[80px] scale-90" : "max-w-[140px]";
  const campaign = card.campaign_id ? campaigns.find((c) => c.id === card.campaign_id) : null;
  const designSet = card.design_set;

  if (card.id === DEFAULT_FORM_ID || card.style === "compressed" || card.style === "full") {
    return (
      <div className={`${ds} mx-auto`}>
        <CompressedDonationCard
          organizationName={organizationName}
          slug={slug}
          headerImageUrl={designSet?.media_url ?? undefined}
          headerText={designSet?.title ?? "Make a Donation"}
          subheaderText={designSet?.subtitle ?? `Support ${organizationName}`}
          designSets={designSet ? [designSet as DesignSet] : null}
          buttonColor={card.button_color ?? undefined}
          buttonTextColor={card.button_text_color ?? undefined}
          basePath={baseUrl}
        />
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
          designSet={designSet as DesignSet | undefined}
          goalDescription={card.goal_description ?? undefined}
          buttonColor={card.button_color ?? undefined}
          buttonTextColor={card.button_text_color ?? undefined}
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
          designSet={designSet as DesignSet | undefined}
          buttonColor={card.button_color ?? undefined}
          buttonTextColor={card.button_text_color ?? undefined}
          basePath={baseUrl}
        />
      </div>
    );
  }
  return (
    <div className={`${ds} rounded-lg border border-slate-200 bg-slate-50 overflow-hidden p-2`}>
      <div className="h-8 bg-slate-200 rounded" />
      <div className="h-2 bg-slate-200 rounded w-3/4 mt-2" />
      <div className="h-2 bg-emerald-200 rounded w-1/2 mt-1" />
    </div>
  );
}

export function PageBuilderClient({
  organizationId,
  organizationName,
  slug,
  baseUrl,
  campaigns,
  donationCards,
  orgPageEmbedCardId,
}: Props) {
  const [blocks, setBlocks] = useState<PublicPageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(orgPageEmbedCardId);
  const [savingCard, setSavingCard] = useState(false);
  const hasAttemptedSeed = useRef(false);

  useEffect(() => {
    setSelectedCardId(orgPageEmbedCardId);
  }, [orgPageEmbedCardId]);

  const handleSelectDonationCard = useCallback(
    async (cardId: string) => {
      setSelectedCardId(cardId);
      setSavingCard(true);
      try {
        const result = await savePublicPage({
          orgSlug: slug,
          org_page_embed_card_id: cardId === DEFAULT_FORM_ID ? null : cardId,
        });
        if (!result.ok) throw new Error(result.error);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
        setSelectedCardId(orgPageEmbedCardId);
      } finally {
        setSavingCard(false);
      }
    },
    [slug, orgPageEmbedCardId]
  );

  const fetchBlocks = useCallback(async (): Promise<PublicPageBlock[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public-page-blocks?organizationId=${organizationId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      const list = (Array.isArray(data) ? data : []).filter(
        (b: PublicPageBlock) => b.block_type !== "donation_form"
      );
      setBlocks(list);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch blocks");
      setBlocks([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Auto-seed from org's existing page when empty - user should never see a blank canvas
  useEffect(() => {
    if (!loading && blocks.length === 0 && !error && !hasAttemptedSeed.current) {
      hasAttemptedSeed.current = true;
      const seed = async () => {
        setSeeding(true);
        try {
          const res = await fetch("/api/public-page-blocks/seed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId }),
          });
          if (res.ok) await fetchBlocks();
        } catch {
          // ignore
        } finally {
          setSeeding(false);
        }
      };
      seed();
    }
  }, [loading, blocks.length, error, organizationId, fetchBlocks]);

  const handleCreate = async (blockType: "video" | "image") => {
    setError(null);
    try {
      const res = await fetch("/api/public-page-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          block_type: blockType,
          config: {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      const list = await fetchBlocks();
      setSelectedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const handleUpdate = async (id: string, payload: Partial<PublicPageBlock>) => {
    setError(null);
    try {
      const res = await fetch(`/api/public-page-blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      await fetchBlocks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this block?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/public-page-blocks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      setSelectedId(null);
      const remaining = await fetchBlocks();
      setSelectedId(remaining[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const newOrder = arrayMove(blocks, oldIdx, newIdx);
    setBlocks(newOrder);
    const orderIds = newOrder.map((b) => b.id);
    try {
      const res = await fetch("/api/public-page-blocks/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, order: orderIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to reorder");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reorder");
      await fetchBlocks();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredBlocks = blocks.filter((b) => b.block_type !== "donation_form");
  const previewUrl = `${baseUrl}/org/${slug}`;

  const effectiveCardId = selectedCardId ?? donationCards[0]?.id ?? null;

  return (
    <div className="space-y-4">
      {donationCards.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-2">Donation form for your page</h2>
          <p className="text-sm text-slate-600 mb-4">
            Choose which embedded form appears in the donation section on your public page.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {donationCards.map((card) => (
              <FormTemplateBox
                key={card.id}
                label={card.name}
                thumbnail={renderCardThumbnail(card, organizationName, slug, baseUrl, campaigns, true)}
                previewHover={renderCardThumbnail(card, organizationName, slug, baseUrl, campaigns, false)}
                selected={(effectiveCardId ?? donationCards[0]?.id) === card.id}
                onClick={() => handleSelectDonationCard(card.id)}
              />
            ))}
          </div>
          {savingCard && <p className="mt-2 text-sm text-slate-500">Saving…</p>}
          <a
            href="/dashboard/website-form"
            className="mt-4 inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline font-medium"
          >
            Create or edit embed cards
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Click a block to edit it. Drag to reorder.
        </p>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleCreate("image")}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Image
            </button>
            <button
              type="button"
              onClick={() => handleCreate("video")}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Video
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/30 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Page canvas</span>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
            View published
          </a>
        </div>

        <div className="min-h-[500px] bg-slate-900">
          {filteredBlocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              {seeding ? (
                <p className="text-slate-400">Loading your page…</p>
              ) : (
                <>
                  <p className="text-slate-400 mb-4">No blocks yet.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCreate("image")}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-500 px-6 py-4 text-sm font-medium text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add image block
                </button>
                <button
                  type="button"
                  onClick={() => handleCreate("video")}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-500 px-6 py-4 text-sm font-medium text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Add video block
                </button>
              </div>
                </>
              )}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-slate-700/50">
                  {filteredBlocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      organizationId={organizationId}
                      isSelected={selectedId === block.id}
                      onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
                      onDelete={() => handleDelete(block.id)}
                      onSave={(p) => handleUpdate(block.id, p)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableBlock({
  block,
  organizationId,
  isSelected,
  onSelect,
  onDelete,
  onSave,
}: {
  block: PublicPageBlock;
  organizationId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onSave: (p: Partial<PublicPageBlock>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? "opacity-60" : ""}`}>
      <div
        onClick={onSelect}
        className={`relative min-h-[60vh] cursor-pointer transition-all ${
          isSelected ? "ring-2 ring-emerald-500 ring-inset" : "hover:ring-2 hover:ring-slate-500/50 hover:ring-inset"
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/90 cursor-grab active:cursor-grabbing text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <EditableBlock block={block} organizationId={organizationId} isSelected={isSelected} onSave={onSave} onDelete={onDelete} />
      </div>
    </div>
  );
}

function EditableBlock({
  block,
  organizationId,
  isSelected,
  onSave,
  onDelete,
}: {
  block: PublicPageBlock;
  organizationId: string;
  isSelected: boolean;
  onSave: (p: Partial<PublicPageBlock>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(block.config?.title ?? "");
  const [subtitle, setSubtitle] = useState(block.config?.subtitle ?? "");
  const [pexelsOpen, setPexelsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(block.config?.title ?? "");
    setSubtitle(block.config?.subtitle ?? "");
  }, [block.config?.title, block.config?.subtitle]);

  const mediaUrl = block.config?.media_url?.trim() || null;
  const displayTitle = title.trim() || null;
  const displaySubtitle = subtitle.trim() || null;

  const saveConfig = useCallback(
    (updates: Partial<BlockConfig>) => {
      onSave({
        config: { ...block.config, ...updates },
      });
    },
    [block.config, onSave]
  );

  const handleTitleBlur = () => {
    if (title !== (block.config?.title ?? "")) {
      saveConfig({ title: title.trim() || null });
    }
  };
  const handleSubtitleBlur = () => {
    if (subtitle !== (block.config?.subtitle ?? "")) {
      saveConfig({ subtitle: subtitle.trim() || null });
    }
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("organizationId", organizationId);
        const res = await fetch("/api/upload/page-image", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        saveConfig({ media_url: data.url });
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [organizationId, saveConfig]
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFileUpload(file);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileInputChange}
      />
      {pexelsOpen && (
        <PexelsMediaPicker
          mode={block.block_type === "video" ? "videos" : "photos"}
          onSelect={(url) => {
            saveConfig({ media_url: url });
            setPexelsOpen(false);
          }}
          onClose={() => setPexelsOpen(false)}
        />
      )}

      <div className="relative flex-1 min-h-[60vh] flex flex-col items-center justify-center overflow-hidden">
        {block.block_type === "video" && mediaUrl ? (
          <>
            <video
              src={mediaUrl}
              muted
              loop
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/90" />
          </>
        ) : mediaUrl ? (
          <>
            <img
              src={mediaUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/90" />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center gap-3">
            <p className="text-slate-500">No media yet</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPexelsOpen(true);
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Choose from Pexels
              </button>
              {block.block_type === "image" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={uploading}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-70 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              )}
            </div>
          </div>
        )}

        {(displayTitle || displaySubtitle || isSelected) && (
          <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {isSelected ? (
              <div className="space-y-3 w-full">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Title"
                  className="w-full text-center text-3xl font-bold text-white bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-white/50"
                />
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  onBlur={handleSubtitleBlur}
                  placeholder="Subtitle"
                  className="w-full text-center text-lg text-white/90 bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-white/50"
                />
              </div>
            ) : (
              <>
                {displayTitle && (
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg sm:text-4xl">
                    {displayTitle}
                  </h2>
                )}
                {displaySubtitle && (
                  <p className="mt-4 text-lg text-white/90">{displaySubtitle}</p>
                )}
              </>
            )}
          </div>
        )}

        {isSelected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPexelsOpen(true);
              }}
              className="rounded-lg bg-slate-800/90 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 border border-slate-600"
            >
              {mediaUrl ? "Change media" : "Choose media"}
            </button>
            {block.block_type === "image" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
                className="rounded-lg bg-slate-800/90 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 border border-slate-600 disabled:opacity-70 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload"}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-lg bg-red-900/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 border border-red-700"
            >
              <Trash2 className="h-4 w-4 inline-block" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
