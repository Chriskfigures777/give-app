import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DonationForm } from "../donation-form";
import { GiveSignInPrompt } from "../give-sign-in-prompt";
import { FormCardMedia } from "@/components/form-card-media";
import { CompressedDonationCard } from "@/components/compressed-donation-card";
import { GoalDonationCard } from "@/components/goal-donation-card";
import { GoalCompactDonationCard } from "@/components/goal-compact-donation-card";
import { MinimalDonationCard } from "@/components/minimal-donation-card";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import { getGoogleFontUrl, getFontFamily, getHeaderFontWeight } from "@/lib/form-fonts";
import { env } from "@/env";
import type { DesignSet } from "@/lib/stock-media";
import { isDirectMediaUrl } from "@/lib/stock-media";
import {
  GRACE_THEME_CSS,
  GRACE_THEME_FONT_URL,
  DARK_ELEGANT_THEME_CSS,
  DARK_ELEGANT_FONT_URL,
  BOLD_CONTEMPORARY_THEME_CSS,
  BOLD_CONTEMPORARY_FONT_URL,
  SEAMLESS_BASE_CSS,
  getSeamlessTheme,
  getSeamlessThemeFontUrl,
  buildSeamlessThemeCSS,
} from "@/lib/embed-form-themes";
import { EmbedResizeObserver } from "./embed-resize-observer";

const DEFAULT_SUGGESTED_AMOUNTS = [10, 12, 25, 50, 100, 250, 500, 1000];

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ frequency?: string; compact?: string; fullscreen?: string; card?: string; seamless?: string; theme?: string; mode?: string }>;
};

type EmbedCardRow = {
  id: string;
  organization_id: string;
  name: string;
  style: "full" | "compressed" | "goal" | "goal_compact" | "minimal";
  campaign_id: string | null;
  design_set: { media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null } | null;
  button_color: string | null;
  button_text_color: string | null;
  primary_color: string | null;
  is_enabled: boolean;
  goal_description?: string | null;
};

/**
 * Embeddable donation form: the whole card (image + form) with minimal chrome for iframe embedding.
 * Supports ?card=[card_id] for customizable embed cards, ?compact=1 for backward compatibility.
 */
export default async function GiveEmbedPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolved = await searchParams;
  const frequencyParam = resolved.frequency;
  const compactParam = resolved.compact;
  const fullscreenParam = resolved.fullscreen;
  const cardParam = resolved.card;
  const seamlessParam = resolved.seamless;
  const themeParam = resolved.theme;
  const modeParam = resolved.mode;
  const initialFrequency = (typeof frequencyParam === "string" ? frequencyParam : frequencyParam?.[0]) as "monthly" | "yearly" | undefined;
  const isCompact = compactParam === "1" || compactParam === "true";
  const isFullscreen = fullscreenParam === "1" || fullscreenParam === "true";
  const isSeamless = seamlessParam === "1" || seamlessParam === "true";
  const seamlessTheme = typeof themeParam === "string" ? themeParam : themeParam?.[0];
  const cardId = typeof cardParam === "string" ? cardParam : cardParam?.[0];
  const supabase = await createClient();

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, slug, stripe_connect_account_id")
    .eq("slug", slug)
    .single();

  const org = orgRow as { id: string; name: string; slug: string; stripe_connect_account_id: string | null } | null;
  if (!org?.stripe_connect_account_id) notFound();

  let embedCard: EmbedCardRow | null = null;
  if (cardId) {
    const { data: cardRow } = await supabase
      .from("org_embed_cards")
      .select("id, organization_id, name, style, campaign_id, design_set, button_color, button_text_color, primary_color, is_enabled, goal_description")
      .eq("id", cardId)
      .eq("organization_id", org.id)
      .eq("is_enabled", true)
      .single();
    embedCard = cardRow as EmbedCardRow | null;
  } else if (!isCompact) {
    const { data: firstFullCard } = await supabase
      .from("org_embed_cards")
      .select("id, organization_id, name, style, campaign_id, design_set, button_color, button_text_color, primary_color, is_enabled, goal_description")
      .eq("organization_id", org.id)
      .eq("is_enabled", true)
      .eq("style", "full")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    embedCard = firstFullCard as EmbedCardRow | null;
  }

  const [{ data: campaignsData }, { data: formCustomRow }] = await Promise.all([
    supabase
      .from("donation_campaigns")
      .select("id, name, suggested_amounts, minimum_amount_cents, allow_recurring, allow_anonymous, goal_amount_cents, current_amount_cents, goal_deadline")
      .eq("organization_id", org.id)
      .eq("is_active", true),
    supabase
      .from("form_customizations")
      .select("*")
      .eq("organization_id", org.id)
      .single(),
  ]);

  const { data: endowmentFunds } = await supabase
    .from("endowment_funds")
    .select("id, name")
    .limit(20);

  type FormCustom = { suggested_amounts?: number[] | null; show_endowment_selection?: boolean | null; allow_custom_amount?: boolean | null; header_text?: string | null; subheader_text?: string | null; primary_color?: string | null; button_color?: string | null; button_text_color?: string | null; button_border_radius?: string | null; background_color?: string | null; text_color?: string | null; font_family?: string | null; header_image_url?: string | null; design_sets?: DesignSet[] | null; form_display_mode?: "full" | "compressed" | null; form_media_side?: "left" | "right" | null; embed_form_theme?: "default" | "grace" | "dark-elegant" | "bold-contemporary" | null };
  const formCustom = formCustomRow as FormCustom | null;
  const designSets = (formCustom?.design_sets as DesignSet[] | undefined)?.filter((s) => s && (s.media_url || s.title || s.subtitle)) ?? [];
  type Campaign = { id: string; name: string; suggested_amounts: unknown; minimum_amount_cents: number | null; allow_recurring: boolean | null; allow_anonymous: boolean | null; goal_amount_cents?: number | null; current_amount_cents?: number | null; goal_deadline?: string | null };
  const campaigns = (campaignsData ?? []) as Campaign[];

  const suggestedAmounts =
    (formCustom?.suggested_amounts as number[] | null) ?? DEFAULT_SUGGESTED_AMOUNTS;
  const minCents = campaigns[0]?.minimum_amount_cents ?? 100;
  const fontFamily = getFontFamily(formCustom?.font_family);
  const headerFontWeight = getHeaderFontWeight(formCustom?.font_family);
  const googleFontUrl = getGoogleFontUrl(formCustom?.font_family);
  const baseUrl = env.app.domain().replace(/\/$/, "");
  const borderRadius = formCustom?.button_border_radius ?? "8px";

  const designSetFromCard = embedCard?.design_set
    ? {
        media_type: (embedCard.design_set.media_type ?? "image") as "image" | "video",
        media_url: embedCard.design_set.media_url ?? null,
        title: embedCard.design_set.title ?? null,
        subtitle: embedCard.design_set.subtitle ?? null,
      }
    : null;

  const cardDesignSets = designSetFromCard ? [designSetFromCard] : designSets;

  /** Fallback to form design_sets when embed card has no valid media_url (e.g. first card has media_url: null). */
  const effectiveMediaSet = ((): DesignSet & { media_url: string } => {
    const cardSet = cardDesignSets[0];
    const formSet = designSets[0];
    if (cardSet?.media_url && isDirectMediaUrl(cardSet.media_url))
      return { ...cardSet, media_url: cardSet.media_url };
    if (formSet?.media_url && isDirectMediaUrl(formSet.media_url))
      return { ...formSet, media_url: formSet.media_url };
    const headerUrl = isDirectMediaUrl(formCustom?.header_image_url)
      ? formCustom!.header_image_url!
      : DEFAULT_HEADER_IMAGE_URL;
    return {
      media_type: "image",
      media_url: headerUrl,
      title: (cardSet?.title ?? formSet?.title) ?? null,
      subtitle: (cardSet?.subtitle ?? formSet?.subtitle) ?? null,
    };
  })();

  const safeFallbackImageUrl = isDirectMediaUrl(formCustom?.header_image_url)
    ? formCustom!.header_image_url!
    : DEFAULT_HEADER_IMAGE_URL;

  const embedFormTheme = (formCustom?.embed_form_theme as "default" | "grace" | "dark-elegant" | "bold-contemporary") ?? "default";
  const useThemedLayout = embedFormTheme !== "default";

  const effectiveStyle = embedCard?.style ?? (isCompact ? "compressed" : "full");

  if (effectiveStyle === "goal" || effectiveStyle === "goal_compact") {
    const campaignId = embedCard?.campaign_id ?? null;
    const campaign = campaignId ? campaigns.find((c) => c.id === campaignId) : null;
    if (!campaign || campaign.goal_amount_cents == null || campaign.goal_amount_cents <= 0) {
      return (
        <main className="min-h-full p-5 flex flex-col items-center justify-center">
          <EmbedResizeObserver />
          <p className="text-slate-600">This campaign card is not configured.</p>
        </main>
      );
    }
    const goalAmountCents = Number(campaign.goal_amount_cents);
    const currentAmountCents = Number(campaign.current_amount_cents ?? 0);

    if (effectiveStyle === "goal") {
      return (
        <main
          className="min-h-full p-5 flex flex-col items-center justify-center"
          style={{
            backgroundColor: formCustom?.background_color ?? "var(--stripe-light-grey)",
            fontFamily,
          }}
        >
          <EmbedResizeObserver />
          <GoalDonationCard
            organizationName={org.name}
            slug={slug}
            designSet={designSetFromCard ?? undefined}
            headerImageUrl={safeFallbackImageUrl}
            title={designSetFromCard?.title ?? formCustom?.header_text}
            subtitle={designSetFromCard?.subtitle ?? formCustom?.subheader_text}
            goalDescription={embedCard?.goal_description}
            buttonColor={embedCard?.button_color ?? formCustom?.button_color}
            buttonTextColor={embedCard?.button_text_color ?? formCustom?.button_text_color}
            primaryColor={embedCard?.primary_color ?? formCustom?.primary_color}
            borderRadius={borderRadius}
            goalAmountCents={goalAmountCents}
            currentAmountCents={currentAmountCents}
            goalDeadline={campaign.goal_deadline}
            campaignId={campaignId}
            basePath={baseUrl}
          />
        </main>
      );
    }

    return (
      <main
        className="min-h-full p-5 flex flex-col items-center justify-center"
        style={{
          backgroundColor: formCustom?.background_color ?? "var(--stripe-light-grey)",
          fontFamily,
        }}
      >
        <EmbedResizeObserver />
        <GoalCompactDonationCard
          organizationName={org.name}
          slug={slug}
          title={designSetFromCard?.title ?? formCustom?.header_text ?? campaign.name}
          goalDescription={embedCard?.goal_description}
          buttonColor={embedCard?.button_color ?? formCustom?.button_color}
          buttonTextColor={embedCard?.button_text_color ?? formCustom?.button_text_color}
          primaryColor={embedCard?.primary_color ?? formCustom?.primary_color}
          borderRadius={borderRadius}
          goalAmountCents={goalAmountCents}
          currentAmountCents={currentAmountCents}
          campaignId={campaignId}
          basePath={baseUrl}
        />
      </main>
    );
  }

  if (effectiveStyle === "minimal") {
    return (
      <main
        className="min-h-full p-5 flex flex-col items-center justify-center"
        style={{
          backgroundColor: formCustom?.background_color ?? "var(--stripe-light-grey)",
          fontFamily,
        }}
      >
        <EmbedResizeObserver />
        <MinimalDonationCard
          organizationName={org.name}
          slug={slug}
          designSet={designSetFromCard ?? undefined}
          headerImageUrl={safeFallbackImageUrl}
          buttonColor={embedCard?.button_color ?? formCustom?.button_color}
          buttonTextColor={embedCard?.button_text_color ?? formCustom?.button_text_color}
          borderRadius={borderRadius}
          basePath={baseUrl}
        />
      </main>
    );
  }

  if (effectiveStyle === "compressed") {
    return (
      <main
        className="min-h-full p-5 flex flex-col items-center justify-center"
        style={{
          backgroundColor: formCustom?.background_color ?? "var(--stripe-light-grey)",
          fontFamily,
        }}
      >
        <EmbedResizeObserver />
        <CompressedDonationCard
          organizationName={org.name}
          slug={slug}
          headerImageUrl={safeFallbackImageUrl}
          headerText={designSetFromCard?.title ?? formCustom?.header_text}
          subheaderText={designSetFromCard?.subtitle ?? formCustom?.subheader_text}
          designSets={cardDesignSets}
          buttonColor={embedCard?.button_color ?? formCustom?.button_color}
          buttonTextColor={embedCard?.button_text_color ?? formCustom?.button_text_color}
          borderRadius={borderRadius}
          basePath={baseUrl}
        />
      </main>
    );
  }

  // Themed embed: give-split layout (image left, form right) for all non-default themes
  const themeMap: Record<string, { wrapperClass: string; bgColor: string; fontUrl: string; css: string; formPanelClass: string; eyebrowText: string; secureText: string }> = {
    grace: {
      wrapperClass: "embed-theme-grace",
      bgColor: "#FAF7F2",
      fontUrl: GRACE_THEME_FONT_URL,
      css: GRACE_THEME_CSS,
      formPanelClass: "gs-form",
      eyebrowText: "Give Online",
      secureText: "All transactions are secure and encrypted",
    },
    "dark-elegant": {
      wrapperClass: "embed-theme-dark-elegant",
      bgColor: "#171717",
      fontUrl: DARK_ELEGANT_FONT_URL,
      css: DARK_ELEGANT_THEME_CSS,
      formPanelClass: "gs-form",
      eyebrowText: "Generosity",
      secureText: "Secure & encrypted",
    },
    "bold-contemporary": {
      wrapperClass: "embed-theme-bold",
      bgColor: "#F8F9FA",
      fontUrl: BOLD_CONTEMPORARY_FONT_URL,
      css: BOLD_CONTEMPORARY_THEME_CSS,
      formPanelClass: "gs-form-light",
      eyebrowText: "Make a Difference",
      secureText: "Secure, encrypted giving powered by Stripe",
    },
  };

  const renderThemedEmbed = () => {
    const headerText = designSetFromCard?.title ?? formCustom?.header_text ?? "Make a Donation";
    const subheaderText = designSetFromCard?.subtitle ?? formCustom?.subheader_text ?? `Support ${org.name}`;
    const mediaUrl = effectiveMediaSet.media_url;
    const hasVideo = effectiveMediaSet.media_type === "video" && effectiveMediaSet.media_url;

    const tc = themeMap[embedFormTheme] ?? themeMap.grace;

    return (
      <main
        className={`${tc.wrapperClass} min-h-full p-5 flex flex-col items-center justify-center`}
        style={{ backgroundColor: tc.bgColor, fontFamily: "'Inter', sans-serif", containerType: "inline-size" } as React.CSSProperties}
      >
        <EmbedResizeObserver />
        <link rel="stylesheet" href={tc.fontUrl} />
        <style dangerouslySetInnerHTML={{ __html: tc.css }} />
        <div className="give-split w-full max-w-[900px]">
          <div className="gs-img">
            {hasVideo ? (
              <video
                src={effectiveMediaSet.media_url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover block min-h-[320px]"
                aria-hidden
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Community impact"
                className="w-full h-full object-cover block min-h-[320px]"
              />
            )}
          </div>
          <div className={tc.formPanelClass}>
            <span className="sec-eye">
              {tc.eyebrowText}
            </span>
            <h3>{headerText}</h3>
            <p className="gs-form-desc">{subheaderText}</p>
            <DonationForm
              organizationId={org.id}
              organizationName={org.name}
              campaigns={campaigns ?? []}
              endowmentFunds={endowmentFunds ?? []}
              suggestedAmounts={suggestedAmounts}
              minimumAmountCents={minCents}
              showEndowmentSelection={formCustom?.show_endowment_selection ?? false}
              allowCustomAmount={formCustom?.allow_custom_amount ?? true}
              allowAnonymous={campaigns.some((c) => c.allow_anonymous !== false) || campaigns.length === 0}
              buttonColor={embedCard?.button_color ?? formCustom?.button_color}
              buttonTextColor={embedCard?.button_text_color ?? formCustom?.button_text_color}
              borderRadius={borderRadius}
              slug={slug}
              noCard
              initialFrequency={initialFrequency}
              fullWidth
              embedCardId={embedCard?.id}
            />
            <p className="gs-form-secure">{tc.secureText}</p>
          </div>
        </div>
        <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} organizationName={org.name} />
      </main>
    );
  };

  /** Fullscreen variant of themed embed: edge-to-edge, image left / form right */
  const renderThemedFullscreen = () => {
    const headerText = designSetFromCard?.title ?? formCustom?.header_text ?? "Make a Donation";
    const subheaderText = designSetFromCard?.subtitle ?? formCustom?.subheader_text ?? `Support ${org.name}`;
    const mediaUrl = effectiveMediaSet.media_url;
    const hasVideo = effectiveMediaSet.media_type === "video" && effectiveMediaSet.media_url;

    const tc = themeMap[embedFormTheme] ?? themeMap.grace;

    const mediaContent = hasVideo ? (
      <video
        src={effectiveMediaSet.media_url}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover block"
        aria-hidden
      />
    ) : (
      <img
        src={mediaUrl}
        alt="Community impact"
        className="absolute inset-0 w-full h-full object-cover block"
      />
    );

    return (
      <main
        data-fullscreen
        className={`${tc.wrapperClass} w-full flex flex-col md:flex-row`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <EmbedResizeObserver />
        <link rel="stylesheet" href={tc.fontUrl} />
        <style dangerouslySetInnerHTML={{ __html: tc.css }} />

        {/* Mobile: top image banner */}
        <div className="relative w-full min-h-[200px] aspect-[16/9] flex-shrink-0 md:hidden gs-img">
          {mediaContent}
        </div>

        {/* Desktop: left panel — image fills the half */}
        <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative gs-img">
          {hasVideo ? (
            <video
              src={effectiveMediaSet.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover block"
              aria-hidden
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Community impact"
              className="absolute inset-0 w-full h-full object-cover block"
            />
          )}
        </div>

        {/* Right panel — form with theme styling */}
        <div
          className={`${tc.formPanelClass} flex flex-col w-full md:w-1/2 lg:w-[45%] min-w-0 flex-1 overflow-visible`}
        >
          <div className="w-full min-w-0 flex flex-col justify-center py-5 px-4 sm:px-6 md:py-8 md:px-8 lg:px-10">
            <span className="sec-eye">
              {tc.eyebrowText}
            </span>
            <h3>{headerText}</h3>
            <p className="gs-form-desc">{subheaderText}</p>
            <DonationForm
              organizationId={org.id}
              organizationName={org.name}
              campaigns={campaigns ?? []}
              endowmentFunds={endowmentFunds ?? []}
              suggestedAmounts={suggestedAmounts}
              minimumAmountCents={minCents}
              showEndowmentSelection={formCustom?.show_endowment_selection ?? false}
              allowCustomAmount={formCustom?.allow_custom_amount ?? true}
              allowAnonymous={campaigns.some((c) => c.allow_anonymous !== false) || campaigns.length === 0}
              buttonColor={embedCard?.button_color ?? formCustom?.button_color}
              buttonTextColor={embedCard?.button_text_color ?? formCustom?.button_text_color}
              borderRadius={borderRadius}
              slug={slug}
              noCard
              initialFrequency={initialFrequency}
              fullWidth
              embedCardId={embedCard?.id}
            />
            <p className="gs-form-secure">{tc.secureText}</p>
          </div>
          <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} organizationName={org.name} />
        </div>
      </main>
    );
  };

  // Seamless mode: for embedding directly in website templates.
  // Respects form_display_mode and embed_form_theme from the form builder.
  if (isSeamless) {
    const theme = seamlessTheme ? getSeamlessTheme(seamlessTheme) : null;
    const themeFontUrl = seamlessTheme ? getSeamlessThemeFontUrl(seamlessTheme) : null;
    const themeCSS = seamlessTheme ? buildSeamlessThemeCSS(seamlessTheme) : SEAMLESS_BASE_CSS;
    const effectiveButtonColor = theme?.accentColor ?? embedCard?.button_color ?? formCustom?.button_color;
    const effectiveButtonTextColor = theme?.buttonTextColor ?? embedCard?.button_text_color ?? formCustom?.button_text_color;
    const effectiveBorderRadius = theme?.borderRadius ?? borderRadius;
    const effectiveFont = theme ? theme.bodyFont : fontFamily;

    // Display mode: URL ?mode= param > form builder setting > themed layout default
    const seamlessDisplayMode: "full" | "compressed" | "full_width" =
      (["full", "compressed", "full_width"].includes(modeParam ?? "") ? modeParam as "full" | "compressed" | "full_width" : undefined)
      ?? formCustom?.form_display_mode
      ?? (useThemedLayout ? "full_width" : "compressed");

    const mediaSide = formCustom?.form_media_side ?? "left";

    // Full-width: give-split layout (image + form side by side) with seamless styling
    if (seamlessDisplayMode === "full_width") {
      const headerText = designSetFromCard?.title ?? formCustom?.header_text ?? "Make a Donation";
      const subheaderText = designSetFromCard?.subtitle ?? formCustom?.subheader_text ?? `Support ${org.name}`;
      const hasVideo = effectiveMediaSet.media_type === "video" && effectiveMediaSet.media_url;
      const isDark = theme?.isDark ?? false;
      const accentColor = theme?.accentColor ?? formCustom?.button_color ?? "#6366F1";
      const formBg = isDark ? (theme?.darkBg ?? "#0F0F0F") : "white";
      const textColor = theme?.textColor ?? (isDark ? "#E5E5E5" : "#333");
      const headingFont = theme?.headingFont ?? "'Inter',sans-serif";
      const accentRgb = theme?.accentRgb ?? "99,102,241";

      const splitCSS = `
        .seamless-give-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,${isDark ? "0.3" : "0.12"});
          max-width: 900px;
          margin: 0 auto;
          background: ${formBg};
          container-type: inline-size;
        }
        .seamless-give-split .sgs-img {
          ${mediaSide === "right" ? "order: 2;" : "order: 1;"}
          overflow: hidden;
        }
        .seamless-give-split .sgs-img img,
        .seamless-give-split .sgs-img video {
          width: 100%; height: 100%; object-fit: cover; display: block; min-height: 380px;
        }
        .seamless-give-split .sgs-form {
          ${mediaSide === "right" ? "order: 1;" : "order: 2;"}
          background: ${formBg};
          padding: 40px 36px;
          display: flex; flex-direction: column; justify-content: center;
        }
        .seamless-give-split .sgs-form .sgs-eyebrow {
          font-size: 11px; letter-spacing: 4px; text-transform: uppercase;
          color: ${accentColor}; font-weight: 700; margin-bottom: 14px;
        }
        .seamless-give-split .sgs-form h3 {
          font-family: ${headingFont}; font-size: 24px; color: ${textColor};
          margin: 0 0 8px 0; line-height: 1.2;
        }
        .seamless-give-split .sgs-form .sgs-desc {
          color: ${isDark ? "rgba(255,255,255,0.55)" : "#6B7280"};
          font-size: 14px; margin-bottom: 24px; line-height: 1.6;
        }
        .seamless-give-split .sgs-secure {
          color: ${isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF"};
          font-size: 11px; margin-top: 10px; text-align: center;
        }
        ${isDark ? `
          .seamless-give-split .sgs-form .give-form-tithely,
          .seamless-give-split .sgs-form [class*="give-form"] {
            background: transparent !important; border: none !important; box-shadow: none !important;
          }
          .seamless-give-split .sgs-form #checkout {
            background: transparent !important; border: none !important; box-shadow: none !important;
          }
          .seamless-give-split .sgs-form .rounded-lg.border,
          .seamless-give-split .sgs-form .p-4.rounded-lg.border,
          .seamless-give-split .sgs-form [class*="rounded-lg"][class*="border"] {
            background: transparent !important; border-color: rgba(255,255,255,0.12) !important;
          }
          .seamless-give-split .sgs-form .border-t,
          .seamless-give-split .sgs-form .border-slate-200 {
            border-color: rgba(255,255,255,0.12) !important;
          }
          .seamless-give-split .sgs-form label,
          .seamless-give-split .sgs-form .text-slate-700,
          .seamless-give-split .sgs-form .text-slate-600,
          .seamless-give-split .sgs-form .font-semibold { color: rgba(255,255,255,0.85) !important; }
          .seamless-give-split .sgs-form .text-slate-500,
          .seamless-give-split .sgs-form .text-slate-400 { color: rgba(255,255,255,0.5) !important; }
          .seamless-give-split .sgs-form .text-slate-900,
          .seamless-give-split .sgs-form h3 { color: white !important; }
          .seamless-give-split .sgs-form .text-3xl,
          .seamless-give-split .sgs-form .tabular-nums { color: rgba(255,255,255,0.7) !important; }
          .seamless-give-split .sgs-form input[type="text"],
          .seamless-give-split .sgs-form input[type="email"],
          .seamless-give-split .sgs-form input[type="number"],
          .seamless-give-split .sgs-form input[type="tel"],
          .seamless-give-split .sgs-form select,
          .seamless-give-split .sgs-form textarea {
            background: rgba(255,255,255,0.08) !important;
            border: 1px solid rgba(255,255,255,0.15) !important; color: white !important;
          }
          .seamless-give-split .sgs-form input::placeholder,
          .seamless-give-split .sgs-form textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
          .seamless-give-split .sgs-form select option { background: ${formBg}; color: white; }
          .seamless-give-split .sgs-form button[type="button"] {
            border: 1px solid rgba(${accentRgb},0.4) !important;
            background: rgba(${accentRgb},0.08) !important; color: white !important;
          }
          .seamless-give-split .sgs-form button[type="button"]:hover,
          .seamless-give-split .sgs-form button[type="button"].ring-2,
          .seamless-give-split .sgs-form button[type="button"][aria-pressed="true"] {
            background: ${accentColor} !important;
            color: ${formBg} !important;
            border-color: ${accentColor} !important;
          }
          .seamless-give-split .sgs-form [class*="py-3"][class*="font-medium"][class*="rounded"],
          .seamless-give-split .sgs-form button[type="submit"] {
            background: ${accentColor} !important;
            color: ${formBg} !important; border: none !important;
            box-shadow: 0 4px 20px rgba(${accentRgb},0.35);
          }
          .seamless-give-split .sgs-form input[type="checkbox"] {
            border-color: rgba(255,255,255,0.3) !important;
            background: rgba(255,255,255,0.08) !important;
          }
          .seamless-give-split .sgs-form svg { color: rgba(255,255,255,0.6); }
        ` : ""}
        @media (max-width: 768px) {
          .seamless-give-split { grid-template-columns: 1fr; }
          .seamless-give-split .sgs-img { order: 1; }
          .seamless-give-split .sgs-form { order: 2; padding: 28px 24px; }
        }
        @container (max-width: 600px) {
          .seamless-give-split { grid-template-columns: 1fr; }
          .seamless-give-split .sgs-img { order: 1; }
          .seamless-give-split .sgs-form { order: 2; padding: 28px 24px; }
        }
      `;

      return (
        <main className={`w-full${theme ? " seamless-theme" : ""}`} style={{ background: "transparent", fontFamily: effectiveFont }}>
          <EmbedResizeObserver />
          <style dangerouslySetInnerHTML={{ __html: themeCSS + splitCSS }} />
          {themeFontUrl && <link rel="stylesheet" href={themeFontUrl} />}
          {!themeFontUrl && googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
          <div className="seamless-give-split">
            <div className="sgs-img">
              {hasVideo ? (
                <video src={effectiveMediaSet.media_url} autoPlay muted loop playsInline aria-hidden />
              ) : (
                <img src={effectiveMediaSet.media_url} alt="Community impact" />
              )}
            </div>
            <div className="sgs-form">
              <span className="sgs-eyebrow">Give Online</span>
              <h3>{headerText}</h3>
              <p className="sgs-desc">{subheaderText}</p>
              <DonationForm
                organizationId={org.id}
                organizationName={org.name}
                campaigns={campaigns ?? []}
                endowmentFunds={endowmentFunds ?? []}
                suggestedAmounts={suggestedAmounts}
                minimumAmountCents={minCents}
                showEndowmentSelection={formCustom?.show_endowment_selection ?? false}
                allowCustomAmount={formCustom?.allow_custom_amount ?? true}
                allowAnonymous={campaigns.some((c) => c.allow_anonymous !== false) || campaigns.length === 0}
                buttonColor={effectiveButtonColor}
                buttonTextColor={effectiveButtonTextColor}
                borderRadius={effectiveBorderRadius}
                slug={slug}
                noCard
                initialFrequency={initialFrequency}
                fullWidth
                embedCardId={embedCard?.id}
              />
              <p className="sgs-secure">All transactions are secure and encrypted</p>
            </div>
          </div>
          <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} organizationName={org.name} />
        </main>
      );
    }

    // Full mode: image/video header above the form
    if (seamlessDisplayMode === "full") {
      const headerText = formCustom?.header_text ?? "Make a Donation";
      const subheaderText = formCustom?.subheader_text ?? `Support ${org.name}`;
      const hasVideo = effectiveMediaSet.media_type === "video" && effectiveMediaSet.media_url;
      const headingFont = theme?.headingFont ?? fontFamily;

      return (
        <main
          className={`w-full${theme ? " seamless-theme" : ""}`}
          style={{
            background: "transparent",
            color: theme?.textColor ?? formCustom?.text_color ?? "inherit",
            fontFamily: effectiveFont,
          }}
        >
          <EmbedResizeObserver />
          <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
          {themeFontUrl && <link rel="stylesheet" href={themeFontUrl} />}
          {!themeFontUrl && googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
          <div className="w-full max-w-[600px] mx-auto overflow-hidden rounded-xl" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <div className="relative w-full h-56 overflow-hidden">
              {hasVideo ? (
                <video
                  src={effectiveMediaSet.media_url}
                  autoPlay muted loop playsInline
                  className="absolute inset-0 w-full h-full object-cover block"
                  aria-hidden
                />
              ) : (
                <img
                  src={effectiveMediaSet.media_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover block"
                />
              )}
              <div
                className="absolute inset-0 flex flex-col justify-end p-5 text-white"
                style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.65))" }}
              >
                <h2
                  className="text-2xl font-bold leading-tight mb-1"
                  style={{ fontFamily: headingFont, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
                >
                  {headerText}
                </h2>
                <p className="text-sm" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                  {subheaderText}
                </p>
              </div>
            </div>
            <div className="p-6">
              <DonationForm
                organizationId={org.id}
                organizationName={org.name}
                campaigns={campaigns ?? []}
                endowmentFunds={endowmentFunds ?? []}
                suggestedAmounts={suggestedAmounts}
                minimumAmountCents={minCents}
                showEndowmentSelection={formCustom?.show_endowment_selection ?? false}
                allowCustomAmount={formCustom?.allow_custom_amount ?? true}
                allowAnonymous={campaigns.some((c) => c.allow_anonymous !== false) || campaigns.length === 0}
                buttonColor={effectiveButtonColor}
                buttonTextColor={effectiveButtonTextColor}
                borderRadius={effectiveBorderRadius}
                slug={slug}
                noCard
                initialFrequency={initialFrequency}
                fullWidth
                embedCardId={embedCard?.id}
              />
              <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} organizationName={org.name} />
            </div>
          </div>
        </main>
      );
    }

    // Compressed (default): bare seamless form with theme colors, no images
    return (
      <main
        className={`w-full${theme ? " seamless-theme" : ""}`}
        style={{
          background: "transparent",
          color: theme?.textColor ?? formCustom?.text_color ?? "inherit",
          fontFamily: effectiveFont,
        }}
      >
        <EmbedResizeObserver />
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
        {themeFontUrl && <link rel="stylesheet" href={themeFontUrl} />}
        {!themeFontUrl && googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
        <DonationForm
          organizationId={org.id}
          organizationName={org.name}
          campaigns={campaigns ?? []}
          endowmentFunds={endowmentFunds ?? []}
          suggestedAmounts={suggestedAmounts}
          minimumAmountCents={minCents}
          showEndowmentSelection={formCustom?.show_endowment_selection ?? false}
          allowCustomAmount={formCustom?.allow_custom_amount ?? true}
          allowAnonymous={campaigns.some((c) => c.allow_anonymous !== false) || campaigns.length === 0}
          buttonColor={effectiveButtonColor}
          buttonTextColor={effectiveButtonTextColor}
          borderRadius={effectiveBorderRadius}
          slug={slug}
          noCard
          initialFrequency={initialFrequency}
          fullWidth
          embedCardId={embedCard?.id}
        />
        <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} organizationName={org.name} />
      </main>
    );
  }

  // Fullscreen: side-by-side layout (image left, form right) on md+, stacked on mobile
  if (isFullscreen) {
    if (useThemedLayout) {
      return renderThemedFullscreen();
    }
    const headerText = formCustom?.header_text ?? "Make a Donation";
    const subheaderText = formCustom?.subheader_text ?? `Support ${org.name}`;

    return (
      <main
        data-fullscreen
        className="w-full flex flex-col md:flex-row"
        style={{
          backgroundColor: formCustom?.background_color ?? "var(--stripe-light-grey)",
          color: formCustom?.text_color ?? "var(--stripe-dark)",
          fontFamily,
        }}
      >
        <EmbedResizeObserver />
        {googleFontUrl && (
          <link rel="stylesheet" href={googleFontUrl} />
        )}

        {/* Left side — image/media panel (hidden on mobile, shown as top banner instead) */}
        {/* Mobile: top banner */}
        <div className="relative w-full min-h-[200px] aspect-[16/9] flex-shrink-0 md:hidden">
          <FormCardMedia
            set={effectiveMediaSet}
            fallbackImageUrl={safeFallbackImageUrl}
            className="absolute inset-0 h-full w-full"
            fontFamily={fontFamily}
            titleFontWeight={headerFontWeight ?? 700}
          />
        </div>

        {/* Desktop: left panel — image stretches to match form height */}
        <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative">
          <FormCardMedia
            set={effectiveMediaSet}
            fallbackImageUrl={safeFallbackImageUrl}
            className="absolute inset-0 h-full w-full"
            fontFamily={fontFamily}
            titleFontWeight={headerFontWeight ?? 700}
          />
        </div>

        {/* Right side — form */}
        <div
          className="flex flex-col w-full md:w-1/2 lg:w-[45%] min-w-0 flex-1 overflow-visible"
          style={{ fontFamily, backgroundColor: "#f8f9fa" }}
        >
          <div className="w-full min-w-0 flex flex-col justify-center py-5 px-4 sm:px-6 md:py-8 md:px-8 lg:px-10">
            <DonationForm
              organizationId={org.id}
              organizationName={org.name}
              campaigns={campaigns ?? []}
              endowmentFunds={endowmentFunds ?? []}
              suggestedAmounts={suggestedAmounts}
              minimumAmountCents={minCents}
              showEndowmentSelection={formCustom?.show_endowment_selection ?? false}
              allowCustomAmount={formCustom?.allow_custom_amount ?? true}
              allowAnonymous={campaigns.some((c) => c.allow_anonymous !== false) || campaigns.length === 0}
              buttonColor={embedCard?.button_color ?? formCustom?.button_color}
              buttonTextColor={embedCard?.button_text_color ?? formCustom?.button_text_color}
              borderRadius={borderRadius}
              slug={slug}
              noCard
              initialFrequency={initialFrequency}
              fullWidth
              embedCardId={embedCard?.id}
            />
            <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} organizationName={org.name} />
          </div>
        </div>
      </main>
    );
  }

  // Default full embed: when using a themed layout, use give-split
  if (useThemedLayout) {
    return renderThemedEmbed();
  }

  return (
    <main
      className="min-h-full flex flex-col items-center justify-center"
      style={{
        backgroundColor: formCustom?.background_color ?? "transparent",
        color: formCustom?.text_color ?? "var(--stripe-dark)",
        fontFamily,
      }}
    >
      <EmbedResizeObserver />
      {googleFontUrl && (
        <link rel="stylesheet" href={googleFontUrl} />
      )}
      <div
        className="w-full max-w-[480px] overflow-hidden"
      >
        {cardDesignSets.length > 0 ? (
          cardDesignSets.map((set, i) => (
            <FormCardMedia
              key={i}
              set={i === 0 ? effectiveMediaSet : set}
              fallbackImageUrl={safeFallbackImageUrl}
              className="h-56"
              fontFamily={fontFamily}
              titleFontWeight={headerFontWeight ?? 700}
            />
          ))
        ) : (
          <div className="relative w-full h-56 overflow-hidden">
            <img
              src={safeFallbackImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover block"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
              <h2
                className="text-2xl font-bold leading-tight mb-1"
                style={{
                  fontFamily,
                  fontWeight: headerFontWeight ?? 700,
                  textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)",
                }}
              >
                {formCustom?.header_text ?? "Make a Donation"}
              </h2>
              <p
                className="text-sm"
                style={{ fontFamily, textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)" }}
              >
                {formCustom?.subheader_text ?? `Support ${org.name}`}
              </p>
            </div>
          </div>
        )}
        <div className="p-6 space-y-0">
          <DonationForm
            organizationId={org.id}
            organizationName={org.name}
            campaigns={campaigns ?? []}
            endowmentFunds={endowmentFunds ?? []}
            suggestedAmounts={suggestedAmounts}
            minimumAmountCents={minCents}
            showEndowmentSelection={formCustom?.show_endowment_selection ?? false}
            allowCustomAmount={formCustom?.allow_custom_amount ?? true}
            allowAnonymous={campaigns.some((c) => c.allow_anonymous !== false) || campaigns.length === 0}
            buttonColor={embedCard?.button_color ?? formCustom?.button_color}
            buttonTextColor={embedCard?.button_text_color ?? formCustom?.button_text_color}
            borderRadius={borderRadius}
            slug={slug}
            noCard
            initialFrequency={initialFrequency}
            embedCardId={embedCard?.id}
          />
          <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} organizationName={org.name} />
        </div>
      </div>
    </main>
  );
}
