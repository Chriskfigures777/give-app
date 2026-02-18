import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { OrgHero } from "./org-hero";
import { OrgPageBlocks } from "./org-page-blocks";
import { OrgAboutSection } from "./org-about-section";
import { OrgTeamSection } from "./org-team-section";
import { OrgStorySection } from "./org-story-section";
import { OrgDonationCta } from "./org-donation-cta";
import { SiteFooter } from "@/components/site-footer";

const DEFAULT_FORM_ID = "__default__";

export const dynamic = "force-dynamic";

type DesignSet = {
  media_type?: string;
  media_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
};

type FormCustom = {
  org_page_donate_link_slug?: string | null;
  org_page_embed_card_id?: string | null;
  header_image_url?: string | null;
  header_text?: string | null;
  subheader_text?: string | null;
  design_sets?: DesignSet[] | null;
  form_display_mode?: "full" | "compressed" | "full_width" | null;
  form_media_side?: "left" | "right" | null;
  button_color?: string | null;
  button_text_color?: string | null;
  button_border_radius?: string | null;
  font_family?: string | null;
  donation_section_layout?: "text_left" | "text_right" | null;
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OrgPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: orgRow } = await supabase
    .from("organizations")
    .select(`
      id, name, slug, description,
      page_hero_video_url, page_hero_image_url, page_summary, page_mission, page_goals,
      page_story, page_story_image_url, page_donation_goal_cents, logo_url, profile_image_url,
      stripe_connect_account_id, page_about_image_side, page_story_image_side,
      city, state, website_url
    `)
    .eq("slug", slug)
    .single();

  const org = orgRow as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    page_hero_video_url: string | null;
    page_hero_image_url: string | null;
    page_summary: string | null;
    page_mission: string | null;
    page_goals: string | null;
    page_story: string | null;
    page_story_image_url: string | null;
    page_donation_goal_cents: number | null;
    logo_url: string | null;
    profile_image_url: string | null;
    stripe_connect_account_id: string | null;
    page_about_image_side?: string | null;
    page_story_image_side?: string | null;
    city: string | null;
    state: string | null;
    website_url: string | null;
  } | null;

  if (!org?.stripe_connect_account_id) notFound();

  const [
    { data: formCustomRow },
    { data: teamMembersData },
    { data: pageBlocksData },
    { data: campaignsData },
    { data: donorCountData },
  ] = await Promise.all([
    supabase
      .from("form_customizations")
      .select(
        "org_page_donate_link_slug, org_page_embed_card_id, header_image_url, header_text, subheader_text, design_sets, form_display_mode, form_media_side, button_color, button_text_color, button_border_radius, font_family, donation_section_layout"
      )
      .eq("organization_id", org.id)
      .single(),
    supabase
      .from("organization_team_members")
      .select("id, name, role, bio, image_url")
      .eq("organization_id", org.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("public_page_blocks")
      .select("id, block_type, sort_order, config, is_enabled")
      .eq("organization_id", org.id)
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("donation_campaigns")
      .select("id")
      .eq("organization_id", org.id)
      .eq("is_active", true),
    supabase.rpc("get_unique_donor_count", {
      p_organization_id: org.id,
    }),
  ]);

  const formCustom = formCustomRow as FormCustom | null;
  const selectedCardId = formCustom?.org_page_embed_card_id ?? null;
  const embedUrl =
    selectedCardId && selectedCardId !== DEFAULT_FORM_ID
      ? `/give/${slug}/embed?fullscreen=1&card=${encodeURIComponent(selectedCardId)}`
      : `/give/${slug}/embed?fullscreen=1`;

  const embedModalUrl =
    selectedCardId && selectedCardId !== DEFAULT_FORM_ID
      ? `/give/${slug}/embed?card=${encodeURIComponent(selectedCardId)}`
      : `/give/${slug}/embed`;

  const tagline = org.page_summary ?? org.description;
  const profileImageUrl = org.profile_image_url ?? org.logo_url;
  const supportersCount = Number(donorCountData ?? 0);
  const pageBlocks = (pageBlocksData ?? []) as Array<{
    id: string;
    block_type: "video" | "image";
    sort_order: number;
    config: { media_url?: string | null; title?: string | null; subtitle?: string | null };
    is_enabled: boolean;
  }>;

  /* ── Resolve images from form customization design_sets as fallback ── */
  const designSets = (formCustom?.design_sets ?? []) as DesignSet[];
  const firstDesignSet = designSets[0] ?? null;

  /**
   * Check if a URL looks like a direct media file (image or video),
   * not a web page URL. Pexels page URLs like
   * "https://www.pexels.com/video/..." are NOT direct media files.
   */
  const isDirectMediaUrl = (url: string | null | undefined): url is string => {
    if (!url) return false;
    try {
      const u = new URL(url);
      const path = u.pathname.toLowerCase();
      const hasFileExt = /\.(jpe?g|png|gif|webp|svg|mp4|webm|mov|avif)(\?|$)/i.test(path);
      const isPexelsFile = u.hostname.includes("images.pexels.com") || u.hostname.includes("videos.pexels.com");
      const isUnsplash = u.hostname.includes("unsplash.com");
      const isSupabaseStorage = u.hostname.includes("supabase");
      if (hasFileExt || isPexelsFile || isUnsplash || isSupabaseStorage) return true;
      // Reject regular web pages (e.g. www.pexels.com/video/...)
      if (u.hostname === "www.pexels.com" || u.hostname === "pexels.com") return false;
      return hasFileExt;
    } catch {
      return false;
    }
  };

  const formHeaderImage = isDirectMediaUrl(formCustom?.header_image_url)
    ? formCustom!.header_image_url
    : null;

  const firstDesignSetImage = designSets.find(
    (s) => s.media_type === "image" && isDirectMediaUrl(s.media_url)
  )?.media_url ?? null;

  const firstDesignSetVideo = designSets.find(
    (s) => s.media_type === "video" && isDirectMediaUrl(s.media_url)
  )?.media_url ?? null;

  /* Best hero image: org profile > design set image > form header > profile image > logo */
  const heroImageUrl =
    org.page_hero_image_url ??
    firstDesignSetImage ??
    formHeaderImage ??
    org.profile_image_url ??
    org.logo_url;

  /* Best hero video: org profile > design set video */
  const heroVideoUrl =
    org.page_hero_video_url ??
    firstDesignSetVideo;

  /* About section image: org hero image > story image > form header > profile image > logo */
  const aboutImageUrl =
    org.page_hero_image_url ??
    org.page_story_image_url ??
    formHeaderImage ??
    firstDesignSetImage ??
    org.profile_image_url ??
    org.logo_url;

  /* Story section image: dedicated story image > design set image > form header > profile image */
  const storyImageUrl =
    org.page_story_image_url ??
    firstDesignSetImage ??
    formHeaderImage ??
    org.profile_image_url;

  return (
    <div className="org-page min-h-screen bg-white">
      {/* Hero Section */}
      <OrgHero
        name={org.name}
        tagline={tagline}
        heroVideoUrl={heroVideoUrl}
        heroImageUrl={heroImageUrl}
        profileImageUrl={profileImageUrl}
        city={org.city}
        state={org.state}
        supportersCount={supportersCount}
        slug={slug}
        organizationId={org.id}
        embedModalUrl={embedModalUrl}
        websiteUrl={org.website_url}
      />

      {/* Media Blocks */}
      <OrgPageBlocks blocks={pageBlocks} />

      {/* About Section */}
      <OrgAboutSection
        summary={org.page_summary}
        mission={org.page_mission}
        goals={org.page_goals}
        imageUrl={aboutImageUrl}
        imageSide={(org.page_about_image_side as "left" | "right") ?? "left"}
        organizationName={org.name}
      />

      {/* Story Section */}
      <OrgStorySection
        story={org.page_story}
        imageUrl={storyImageUrl}
        imageSide={(org.page_story_image_side as "left" | "right") ?? "left"}
        organizationName={org.name}
      />

      {/* Team Section */}
      <OrgTeamSection
        members={teamMembersData ?? []}
        organizationName={org.name}
      />

      {/* Donation CTA + Embedded Form */}
      <OrgDonationCta
        organizationName={org.name}
        embedUrl={embedUrl}
        slug={slug}
      />

      <SiteFooter />
    </div>
  );
}
