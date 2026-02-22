"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { savePublicPage } from "@/app/dashboard/profile/actions";
import Image from "next/image";
import { Pencil, Image as ImageIcon, Video, ArrowLeftRight, Upload, Save, Eye } from "lucide-react";
import { PexelsMediaPicker } from "./pexels-media-picker";
import { FormTemplateBox } from "./form-template-box";
import { CompressedDonationCard } from "./compressed-donation-card";
import { GoalDonationCard } from "./goal-donation-card";
import { GoalCompactDonationCard } from "./goal-compact-donation-card";
import { MinimalDonationCard } from "./minimal-donation-card";
import type { DesignSet } from "@/lib/stock-media";
import { TeamEditorClient } from "@/app/dashboard/profile/team-editor-client";
import { OrgTeamSection } from "@/app/org/[slug]/org-team-section";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=85";

const DEFAULT_ABOUT_IMAGE = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=85";

type Profile = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  profile_image_url?: string | null;
  page_hero_video_url: string | null;
  page_hero_image_url: string | null;
  page_summary: string | null;
  page_mission: string | null;
  page_goals: string | null;
  page_story: string | null;
  page_story_image_url: string | null;
  page_about_image_side?: "left" | "right" | null;
  page_story_image_side?: "left" | "right" | null;
};

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image_url: string | null;
};

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

type Props = {
  profile: Profile;
  baseUrl: string;
  donationSectionLayout?: "text_left" | "text_right";
  orgPageEmbedCardId?: string | null;
  formDisplayMode?: "full" | "compressed" | "full_width";
  formMediaSide?: "left" | "right";
  donationCards?: DonationCard[];
  campaigns?: Campaign[];
  hasDefaultForm?: boolean;
  teamMembers?: TeamMember[];
};

const DEFAULT_FORM_ID = "__default__";

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
          designSet={designSet ? (designSet as DesignSet) : undefined}
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
          designSet={designSet ? (designSet as DesignSet) : undefined}
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

type PageEditorData = {
  name: string;
  profile_image_url: string;
  logo_url: string;
  page_hero_video_url: string;
  page_hero_image_url: string;
  page_summary: string;
  page_mission: string;
  page_goals: string;
  page_story: string;
  page_story_image_url: string;
  page_about_image_side: "left" | "right";
  page_story_image_side: "left" | "right";
  donation_section_layout: "text_left" | "text_right";
  org_page_embed_card_id: string | null;
  form_display_mode: "full" | "compressed" | "full_width";
  form_media_side: "left" | "right";
};

export function InlinePageEditor({
  profile,
  baseUrl,
  donationSectionLayout = "text_left",
  orgPageEmbedCardId = null,
  formDisplayMode = "full_width",
  formMediaSide = "left",
  donationCards = [],
  campaigns = [],
  hasDefaultForm = false,
  teamMembers = [],
}: Props) {
  const effectiveCardId = orgPageEmbedCardId ?? donationCards[0]?.id ?? (hasDefaultForm ? DEFAULT_FORM_ID : null);
  const [data, setData] = useState<PageEditorData>({
    name: profile.name,
    profile_image_url: profile.profile_image_url ?? profile.logo_url ?? "",
    logo_url: profile.logo_url ?? "",
    page_hero_video_url: profile.page_hero_video_url ?? "",
    page_hero_image_url: profile.page_hero_image_url ?? "",
    page_summary: profile.page_summary ?? "",
    page_mission: profile.page_mission ?? "",
    page_goals: profile.page_goals ?? "",
    page_story: profile.page_story ?? "",
    page_story_image_url: profile.page_story_image_url ?? "",
    page_about_image_side: (profile.page_about_image_side ?? "left") as "left" | "right",
    page_story_image_side: (profile.page_story_image_side ?? "left") as "left" | "right",
    donation_section_layout: donationSectionLayout,
    org_page_embed_card_id: effectiveCardId,
    form_display_mode: formDisplayMode,
    form_media_side: formMediaSide,
  });
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pexelsPicker, setPexelsPicker] = useState<{ field: string; mode: "photos" | "videos" } | null>(null);
  const [heroMediaMenuOpen, setHeroMediaMenuOpen] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const uploadFieldRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = useCallback(
    async (updates: Partial<typeof data>) => {
      if (Object.keys(updates).length === 0) return;
      setSaving(true);
      setError(null);
      try {
        const input = {
          orgSlug: profile.slug,
          profile_image_url: updates.profile_image_url ?? data.profile_image_url,
          logo_url: updates.logo_url ?? data.logo_url,
          page_hero_video_url: updates.page_hero_video_url ?? data.page_hero_video_url,
          page_hero_image_url: updates.page_hero_image_url ?? data.page_hero_image_url,
          page_summary: updates.page_summary ?? data.page_summary,
          page_mission: updates.page_mission ?? data.page_mission,
          page_goals: updates.page_goals ?? data.page_goals,
          page_story: updates.page_story ?? data.page_story,
          page_story_image_url: updates.page_story_image_url ?? data.page_story_image_url,
          page_about_image_side: updates.page_about_image_side ?? data.page_about_image_side,
          page_story_image_side: updates.page_story_image_side ?? data.page_story_image_side,
          donation_section_layout: updates.donation_section_layout ?? data.donation_section_layout,
          org_page_embed_card_id: updates.org_page_embed_card_id ?? data.org_page_embed_card_id,
          form_display_mode: "full_width" as const,
          form_media_side: updates.form_media_side ?? data.form_media_side,
        };
        const result = await savePublicPage(input);
        if (!result.ok) {
          throw new Error(result.error ?? "Failed to save");
        }
        setData((prev) => ({ ...prev, ...updates }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [profile.slug, data]
  );

  const saveAll = useCallback(async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const result = await savePublicPage({
        orgSlug: profile.slug,
        profile_image_url: data.profile_image_url || null,
        logo_url: data.logo_url || null,
        page_hero_video_url: data.page_hero_video_url || null,
        page_hero_image_url: data.page_hero_image_url || null,
        page_summary: data.page_summary || null,
        page_mission: data.page_mission || null,
        page_goals: data.page_goals || null,
        page_story: data.page_story || null,
        page_story_image_url: data.page_story_image_url || null,
        page_about_image_side: data.page_about_image_side,
        page_story_image_side: data.page_story_image_side,
        donation_section_layout: data.donation_section_layout,
        org_page_embed_card_id: data.org_page_embed_card_id === DEFAULT_FORM_ID ? null : data.org_page_embed_card_id,
        form_display_mode: "full_width" as const,
        form_media_side: data.form_media_side,
      });
      if (!result.ok) {
        throw new Error(result.error ?? "Failed to save");
      }
      setSaved(true);
      setPreviewKey((k) => k + 1);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [data, profile.slug, router]);

  const handleFileUpload = useCallback(
    async (file: File, field: keyof typeof data) => {
      setUploadingFor(field);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("organizationId", profile.id);
        const res = await fetch("/api/upload/page-image", { method: "POST", body: formData });
        const dataRes = await res.json();
        if (!res.ok) throw new Error(dataRes.error ?? "Upload failed");
        const url = dataRes.url as string;
        setData((prev) => ({ ...prev, [field]: url }));
        await save({ [field]: url });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploadingFor(null);
      }
    },
    [profile.id, save]
  );

  const orgUrl = `${baseUrl.replace(/\/$/, "")}/org/${profile.slug}`;

  const triggerUpload = (field: keyof typeof data) => {
    uploadFieldRef.current = field;
    fileInputRef.current?.click();
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = uploadFieldRef.current as keyof typeof data | null;
    const file = e.target.files?.[0];
    e.target.value = "";
    uploadFieldRef.current = null;
    if (field && file) handleFileUpload(file, field);
  };

  const profileImageUrl = data.profile_image_url || data.logo_url || DEFAULT_ABOUT_IMAGE;

  return (
    <div className="space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileInputChange}
      />
      {pexelsPicker && (
        <PexelsMediaPicker
          mode={pexelsPicker.mode}
          onSelect={(url) => {
            const field = pexelsPicker.field as keyof typeof data;
            setData((prev) => ({ ...prev, [field]: url }));
            save({ [field]: url });
            setPexelsPicker(null);
          }}
          onClose={() => setPexelsPicker(null)}
        />
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Public page</h1>
            <p className="mt-2 text-slate-600">
              {isEditMode
                ? "Edit your page directly below. Click any section to edit inline."
                : "Preview your public page. Click Edit to make changes."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {error && (
              <span className="text-sm text-red-600 font-medium">{error}</span>
            )}
            {isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => void saveAll()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : saved ? "Saved!" : "Save"}
            </button>
            {saved && (
              <a
                href={orgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              >
                View on public page
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <a
              href={orgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-600 hover:underline font-medium"
            >
              View your page
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
            >
              Edit public profile &amp; URL
            </a>
          </div>
        </div>

        {/* Preview mode: iframe - previewKey forces reload after save */}
        {!isEditMode && (
          <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <iframe
              key={previewKey}
              src={`${orgUrl}${orgUrl.includes("?") ? "&" : "?"}v=${previewKey}`}
              title={`Preview: ${profile.name}`}
              className="w-full"
              style={{ height: "min(500px, 60vh)" }}
            />
          </div>
        )}

        {/* Organization profile image - LinkedIn-style circular avatar (edit mode) */}
        {isEditMode && (
        <div className="mt-8 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Organization profile image</h2>
          <p className="mt-1 text-sm text-slate-600">
            This circular image appears on your org page, in search results, and on explore cards.
          </p>
          <div className="mt-4 flex items-center gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
              <Image
                src={profileImageUrl}
                alt="Profile"
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPexelsPicker({ field: "profile_image_url", mode: "photos" })}
                onMouseDown={(e) => e.preventDefault()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Pexels
              </button>
              <button
                type="button"
                onClick={() => triggerUpload("profile_image_url")}
                onMouseDown={(e) => e.preventDefault()}
                disabled={uploadingFor === "profile_image_url"}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-70"
              >
                <Upload className="h-4 w-4" />
                {uploadingFor === "profile_image_url" ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">{error}</div>
      )}

      {isEditMode && (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden">
        <p className="px-6 py-2 bg-slate-100 text-sm font-medium text-slate-600">
          Your page — click any section to edit
        </p>

        {/* Hero section - inline editable */}
        <EditableSection
          label="Hero"
          onBlur={() => {}}
          className="relative min-h-[50vh] overflow-hidden bg-slate-900"
        >
          <button
            type="button"
            onClick={() => setHeroMediaMenuOpen((v) => !v)}
            className="absolute inset-0 z-[5] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
            aria-label="Edit hero image or video"
          >
            <span className="sr-only">Click to edit hero image or video</span>
          </button>
          <div className="absolute inset-0">
            {data.page_hero_video_url ? (
              <>
                <video
                  src={data.page_hero_video_url}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/90" />
              </>
            ) : (
              <>
                <Image
                  src={data.page_hero_image_url || FALLBACK_IMAGE}
                  alt=""
                  fill
                  className="object-cover opacity-80"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/90" />
              </>
            )}
          </div>
          <div className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center px-6 py-20 text-center pointer-events-none">
            <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
              {data.name}
            </h2>
            <InlineTextarea
              value={data.page_summary}
              onChange={(v) => setData((d) => ({ ...d, page_summary: v }))}
              onBlur={(v) => { setData((d) => ({ ...d, page_summary: v })); save({ page_summary: v }); }}
              className="mt-4 max-w-2xl text-lg text-white/90 sm:text-xl text-center bg-transparent border-none focus:ring-2 focus:ring-emerald-500 rounded px-2 pointer-events-auto"
              placeholder="Tagline or summary"
            />
          </div>
          {heroMediaMenuOpen && (
            <>
              <button
                type="button"
                onClick={() => setHeroMediaMenuOpen(false)}
                className="absolute inset-0 z-[15] cursor-default"
                aria-label="Close menu"
              />
              <div
                className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                role="dialog"
                aria-label="Hero media options"
              >
              <button
                type="button"
                onClick={() => {
                  setPexelsPicker({ field: "page_hero_image_url", mode: "photos" });
                  setHeroMediaMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <ImageIcon className="h-4 w-4" />
                Image from Pexels
              </button>
              <button
                type="button"
                onClick={() => {
                  setPexelsPicker({ field: "page_hero_video_url", mode: "videos" });
                  setHeroMediaMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Video className="h-4 w-4" />
                Video from Pexels
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerUpload("page_hero_image_url");
                  setHeroMediaMenuOpen(false);
                }}
                disabled={uploadingFor === "page_hero_image_url"}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-70"
              >
                <Upload className="h-4 w-4" />
                {uploadingFor === "page_hero_image_url" ? "Uploading…" : "Upload image"}
              </button>
              </div>
            </>
          )}
        </EditableSection>

        {/* About section - full layout with image + text */}
        <EditableSection
          label="About"
          onBlur={() => {}}
          className="bg-white py-16 px-6"
          reverseLabel="Reverse layout"
          onReverse={() => {
            const next = data.page_about_image_side === "left" ? "right" : "left";
            setData((d) => ({ ...d, page_about_image_side: next }));
            save({ page_about_image_side: next });
          }}
        >
          <div className="mx-auto max-w-7xl">
            <div className={`grid items-start gap-8 md:grid-cols-2 md:gap-12 ${data.page_about_image_side === "right" ? "md:grid-flow-dense" : ""}`}>
              <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl md:aspect-[3/2] ${data.page_about_image_side === "right" ? "md:col-start-2" : ""}`}>
                <Image
                  src={data.page_hero_image_url || profile.logo_url || DEFAULT_ABOUT_IMAGE}
                  alt="About"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPexelsPicker({ field: "page_hero_image_url", mode: "photos" })}
                    onMouseDown={(e) => e.preventDefault()}
                    className="rounded-lg bg-white/95 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white flex items-center gap-2 shadow-sm"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Pexels
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerUpload("page_hero_image_url")}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={uploadingFor === "page_hero_image_url"}
                    className="rounded-lg bg-white/95 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white flex items-center gap-2 shadow-sm disabled:opacity-70"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingFor === "page_hero_image_url" ? "Uploading…" : "Upload"}
                  </button>
                </div>
              </div>
              <div className={`space-y-6 ${data.page_about_image_side === "right" ? "md:col-start-1 md:row-start-1" : ""}`}>
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">About</span>
                  <InlineTextarea
                    value={data.page_summary}
                    onChange={(v) => setData((d) => ({ ...d, page_summary: v }))}
                    onBlur={(v) => { setData((d) => ({ ...d, page_summary: v })); save({ page_summary: v }); }}
                    className="mt-2 text-lg leading-relaxed text-slate-600 w-full resize-none border-none focus:ring-2 focus:ring-emerald-500 rounded p-2 min-h-[80px]"
                    placeholder="Brief overview of your organization..."
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Our mission</h3>
                  <InlineTextarea
                    value={data.page_mission}
                    onChange={(v) => setData((d) => ({ ...d, page_mission: v }))}
                    onBlur={(v) => { setData((d) => ({ ...d, page_mission: v })); save({ page_mission: v }); }}
                    className="mt-2 text-slate-600 leading-relaxed w-full resize-none border-none focus:ring-2 focus:ring-emerald-500 rounded p-2 min-h-[80px]"
                    placeholder="Our mission is to..."
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">What we&apos;re working toward</h3>
                  <InlineTextarea
                    value={data.page_goals}
                    onChange={(v) => setData((d) => ({ ...d, page_goals: v }))}
                    onBlur={(v) => { setData((d) => ({ ...d, page_goals: v })); save({ page_goals: v }); }}
                    className="mt-2 text-slate-600 leading-relaxed w-full resize-none border-none focus:ring-2 focus:ring-emerald-500 rounded p-2 min-h-[80px]"
                    placeholder="We're raising funds to..."
                  />
                </div>
              </div>
            </div>
          </div>
        </EditableSection>

        {/* Story section - full layout with image + text */}
        <EditableSection
          label="Story"
          onBlur={() => {}}
          className="bg-slate-50 py-16 px-6"
          reverseLabel="Reverse layout"
          onReverse={() => {
            const next = data.page_story_image_side === "left" ? "right" : "left";
            setData((d) => ({ ...d, page_story_image_side: next }));
            save({ page_story_image_side: next });
          }}
        >
          <div className="mx-auto max-w-7xl">
            <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-12 ${data.page_story_image_side === "right" ? "md:grid-flow-dense" : ""}`}>
              <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl md:aspect-[3/2] ${data.page_story_image_side === "right" ? "md:col-start-2" : ""}`}>
                <Image
                  src={data.page_story_image_url || DEFAULT_ABOUT_IMAGE}
                  alt="Our story"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPexelsPicker({ field: "page_story_image_url", mode: "photos" })}
                    onMouseDown={(e) => e.preventDefault()}
                    className="rounded-lg bg-white/95 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white flex items-center gap-2 shadow-sm"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Pexels
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerUpload("page_story_image_url")}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={uploadingFor === "page_story_image_url"}
                    className="rounded-lg bg-white/95 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white flex items-center gap-2 shadow-sm disabled:opacity-70"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingFor === "page_story_image_url" ? "Uploading…" : "Upload"}
                  </button>
                </div>
              </div>
              <div className={data.page_story_image_side === "right" ? "md:col-start-1 md:row-start-1" : ""}>
                <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Our story</span>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Our story</h3>
                <InlineTextarea
                  value={data.page_story}
                  onChange={(v) => setData((d) => ({ ...d, page_story: v }))}
                  onBlur={(v) => { setData((d) => ({ ...d, page_story: v })); save({ page_story: v }); }}
                  className="mt-4 text-lg leading-relaxed text-slate-600 w-full resize-none border-none focus:ring-2 focus:ring-emerald-500 rounded p-2 min-h-[120px]"
                  placeholder="Share your organization's story..."
                />
              </div>
            </div>
          </div>
        </EditableSection>

        {/* Team section - full layout with photos */}
        <EditableSection
          label="Team"
          onBlur={() => {}}
          className="bg-slate-50 py-16 px-6 border-t border-slate-200"
        >
          {teamMembers.length > 0 ? (
            <OrgTeamSection members={teamMembers} organizationName={data.name} />
          ) : (
            <div className="mx-auto max-w-7xl px-6 text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Our team</span>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Meet the team</h2>
              <p className="mt-4 text-slate-500 italic">Content not available. Add team members below to display them here.</p>
            </div>
          )}
        </EditableSection>

        {/* Donation section - full-screen iframe embed */}
        <EditableSection
          label="Donation"
          onBlur={() => {}}
          className="bg-white py-16 px-6 border-t border-slate-200"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 space-y-4">
              {donationCards.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Donation card</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {donationCards.map((card) => (
                      <FormTemplateBox
                        key={card.id}
                        label={card.name}
                        thumbnail={renderCardThumbnail(card, data.name, profile.slug, baseUrl, campaigns, true)}
                        previewHover={renderCardThumbnail(card, data.name, profile.slug, baseUrl, campaigns, false)}
                        selected={(data.org_page_embed_card_id ?? donationCards[0]?.id) === card.id}
                        onClick={() => {
                          setData((d) => ({ ...d, org_page_embed_card_id: card.id }));
                          save({ org_page_embed_card_id: card.id });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <a
                href="/dashboard/website-form"
                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline font-medium"
              >
                Customize form & cards
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={{ minHeight: "400px" }}>
              <iframe
                src={
                  data.org_page_embed_card_id && data.org_page_embed_card_id !== DEFAULT_FORM_ID
                    ? `${baseUrl}/give/${profile.slug}/embed?fullscreen=1&card=${encodeURIComponent(data.org_page_embed_card_id)}`
                    : `${baseUrl}/give/${profile.slug}/embed?fullscreen=1`
                }
                style={{ width: "100%", height: "60vh", minHeight: "400px", border: "none" }}
                title={`Donate to ${data.name}`}
              />
            </div>
          </div>
        </EditableSection>
      </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Edit team members</h2>
        <p className="mt-1 text-sm text-slate-600 mb-4">
          Add and edit team members.
        </p>
        <TeamEditorClient organizationId={profile.id} />
      </div>

      {saving && (
        <p className="text-sm text-slate-500">Saving…</p>
      )}
    </div>
  );
}

function EditableSection({
  label,
  children,
  onBlur,
  className,
  reverseLabel,
  onReverse,
}: {
  label: string;
  children: React.ReactNode;
  onBlur: () => void;
  className: string;
  reverseLabel?: string;
  onReverse?: () => void;
}) {
  return (
    <div className={`relative ${className}`} onBlur={onBlur}>
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-lg bg-emerald-600/90 px-2 py-1 text-xs font-medium text-white">
        <Pencil className="h-3 w-3" />
        {label}
      </div>
      {onReverse && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onReverse();
          }}
          className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-white hover:border-slate-300"
          title={reverseLabel}
        >
          <ArrowLeftRight className="h-4 w-4" />
          {reverseLabel}
        </button>
      )}
      {children}
    </div>
  );
}

function InlineTextarea({
  value,
  onChange,
  onBlur,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: (value: string) => void;
  className: string;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur(e.target.value)}
      className={className}
      placeholder={placeholder}
      rows={4}
    />
  );
}
