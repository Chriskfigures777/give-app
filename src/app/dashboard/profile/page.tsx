import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { env } from "@/env";
import { InlinePageEditor } from "@/components/inline-page-editor";

const DEFAULT_FORM_ID = "__default__";

export default async function ProfilePage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!profile?.organization_id && !profile?.preferred_organization_id && profile?.role !== "platform_admin") {
    redirect("/dashboard");
  }

  const targetOrgId = orgId!;
  const [orgRes, formRes, teamRes, embedCardsRes, campaignsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, logo_url, profile_image_url, page_hero_video_url, page_hero_image_url, page_summary, page_mission, page_goals, page_story, page_story_image_url, page_about_image_side, page_story_image_side")
      .eq("id", targetOrgId)
      .single(),
    supabase
      .from("form_customizations")
      .select("donation_section_layout, org_page_embed_card_id, form_display_mode, form_media_side, header_image_url, header_text, subheader_text, design_sets, button_color, button_text_color")
      .eq("organization_id", targetOrgId)
      .single(),
    supabase
      .from("organization_team_members")
      .select("id, name, role, bio, image_url")
      .eq("organization_id", targetOrgId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("org_embed_cards")
      .select("id, name, style, page_section, campaign_id, design_set, button_color, button_text_color, primary_color, goal_description")
      .eq("organization_id", targetOrgId)
      .eq("is_enabled", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("donation_campaigns")
      .select("id, name, goal_amount_cents, current_amount_cents")
      .eq("organization_id", targetOrgId)
      .eq("is_active", true),
  ]);

  const { data, error } = orgRes;
  if (error || !data) {
    redirect("/dashboard");
  }

  const orgProfile = data as {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    profile_image_url: string | null;
    page_hero_video_url: string | null;
    page_hero_image_url: string | null;
    page_summary: string | null;
    page_mission: string | null;
    page_goals: string | null;
    page_story: string | null;
    page_story_image_url: string | null;
    page_about_image_side: "left" | "right" | null;
    page_story_image_side: "left" | "right" | null;
  };
  const formCustom = formRes.data as {
    donation_section_layout?: "text_left" | "text_right" | null;
    org_page_embed_card_id?: string | null;
    form_display_mode?: "full" | "compressed" | "full_width" | null;
    form_media_side?: "left" | "right" | null;
    header_image_url?: string | null;
    header_text?: string | null;
    subheader_text?: string | null;
    design_sets?: Array<{ media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null }> | null;
    button_color?: string | null;
    button_text_color?: string | null;
  } | null;
  const teamMembers = (teamRes.data ?? []) as { id: string; name: string; role: string | null; bio: string | null; image_url: string | null }[];
  const allEmbedCards = (embedCardsRes.data ?? []) as {
    id: string;
    name: string;
    style: "full" | "compressed" | "goal" | "goal_compact" | "minimal";
    page_section?: string | null;
    campaign_id?: string | null;
    design_set?: { media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null } | null;
    button_color?: string | null;
    button_text_color?: string | null;
    primary_color?: string | null;
    goal_description?: string | null;
  }[];
  const donationCards = allEmbedCards;
  const campaigns = (campaignsRes.data ?? []) as { id: string; name: string; goal_amount_cents?: number | null; current_amount_cents?: number | null }[];
  const baseUrl = env.app.domain().replace(/\/$/, "");

  const defaultDesignSet = formCustom?.design_sets?.[0];
  const cardsForSelector = formCustom
    ? [
        {
          id: DEFAULT_FORM_ID,
          name: "Main donation form",
          style: "full" as const,
          campaign_id: null,
          design_set: defaultDesignSet
            ? {
                media_type: (defaultDesignSet.media_type ?? "image") as "image" | "video",
                media_url: defaultDesignSet.media_url ?? null,
                title: defaultDesignSet.title ?? formCustom.header_text ?? null,
                subtitle: defaultDesignSet.subtitle ?? formCustom.subheader_text ?? null,
              }
            : null,
          button_color: formCustom.button_color ?? null,
          button_text_color: formCustom.button_text_color ?? null,
          primary_color: null,
          goal_description: null,
        },
        ...donationCards,
      ]
    : donationCards;

  return (
    <InlinePageEditor
      profile={orgProfile}
      baseUrl={baseUrl}
      donationSectionLayout={formCustom?.donation_section_layout ?? "text_left"}
      orgPageEmbedCardId={formCustom?.org_page_embed_card_id ?? null}
      formDisplayMode={formCustom?.form_display_mode ?? "full_width"}
      formMediaSide={formCustom?.form_media_side ?? "left"}
      donationCards={cardsForSelector}
      campaigns={campaigns}
      hasDefaultForm={!!formCustom}
      teamMembers={teamMembers}
    />
  );
}
