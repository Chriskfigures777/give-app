/**
 * Shared data fetching for Website form and Custom forms pages.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { FORM_TEMPLATE_PRESET } from "@/lib/form-template-preset";

const DEFAULT_AMOUNTS = [10, 12, 25, 50, 100, 250, 500, 1000];

export type Campaign = {
  id: string;
  name: string;
  suggested_amounts: unknown;
  minimum_amount_cents: number | null;
  allow_recurring: boolean | null;
  allow_anonymous: boolean | null;
  goal_amount_cents?: number | null;
  current_amount_cents?: number | null;
  goal_deadline?: string | null;
};

export type DesignSet = {
  media_type: "image" | "video";
  media_url: string | null;
  title: string | null;
  subtitle: string | null;
};

export type FormCustom = {
  suggested_amounts?: number[] | null;
  allow_custom_amount?: boolean | null;
  show_endowment_selection?: boolean | null;
  header_text?: string | null;
  subheader_text?: string | null;
  thank_you_message?: string | null;
  thank_you_video_url?: string | null;
  thank_you_cta_url?: string | null;
  thank_you_cta_text?: string | null;
  primary_color?: string | null;
  button_color?: string | null;
  button_text_color?: string | null;
  button_border_radius?: string | null;
  header_image_url?: string | null;
  font_family?: string | null;
  design_sets?: DesignSet[] | null;
  form_display_mode?: "full" | "compressed" | "full_width" | null;
  form_media_side?: "left" | "right" | null;
  embed_form_theme?: "default" | "grace" | "dark-elegant" | "bold-contemporary" | null;
  org_page_embed_card_id?: string | null;
  website_embed_card_id?: string | null;
  org_page_donate_link_slug?: string | null;
  splits?: { percentage: number; accountId: string }[] | null;
};

export type FormsPageData = {
  org: { id: string; name: string; slug: string };
  formCustom: FormCustom | null;
  effectiveForm: FormCustom;
  campaigns: Campaign[];
  endowmentFunds: { id: string; name: string }[];
  donationLinks: { id: string; name: string; slug: string }[];
  peerOrgs: { id: string; name: string; slug: string; stripe_connect_account_id: string }[];
  suggestedAmounts: number[];
  minCents: number;
  designSet: DesignSet | null;
};

export async function fetchFormsPageData(
  orgId: string,
  supabase: SupabaseClient
): Promise<FormsPageData | null> {
  const orgQuery = supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId)
    .single();

  const formQuery = supabase
    .from("form_customizations")
    .select("*, splits")
    .eq("organization_id", orgId)
    .single();

  const { data: connAsA } = await supabase
    .from("peer_connections")
    .select("side_b_id, side_b_type")
    .eq("side_a_id", orgId)
    .eq("side_a_type", "organization");
  const { data: connAsB } = await supabase
    .from("peer_connections")
    .select("side_a_id, side_a_type")
    .eq("side_b_id", orgId)
    .eq("side_b_type", "organization");
  const peerOrgIds = new Set<string>();
  for (const c of (connAsA ?? []) as { side_b_id: string; side_b_type: string }[]) {
    if (c.side_b_type === "organization") peerOrgIds.add(c.side_b_id);
  }
  for (const c of (connAsB ?? []) as { side_a_id: string; side_a_type: string }[]) {
    if (c.side_a_type === "organization") peerOrgIds.add(c.side_a_id);
  }
  const { data: peerOrgs } = peerOrgIds.size > 0
    ? await supabase
        .from("organizations")
        .select("id, name, slug, stripe_connect_account_id")
        .in("id", Array.from(peerOrgIds))
        .not("stripe_connect_account_id", "is", null)
        .order("name")
    : { data: [] };

  const campaignsQuery = supabase
    .from("donation_campaigns")
    .select("id, name, suggested_amounts, minimum_amount_cents, allow_recurring, allow_anonymous, goal_amount_cents, current_amount_cents, goal_deadline")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const endowmentQuery = supabase
    .from("endowment_funds")
    .select("id, name")
    .limit(20);

  const donationLinksQuery = supabase
    .from("donation_links")
    .select("id, name, slug")
    .eq("organization_id", orgId);

  const [{ data: orgRow }, { data: formCustomRow }, { data: campaignsData }, { data: endowmentFunds }, { data: donationLinks }] = await Promise.all([
    orgQuery,
    formQuery,
    campaignsQuery,
    endowmentQuery,
    donationLinksQuery,
  ]);

  if (!orgRow) return null;

  const org = orgRow as { id: string; name: string; slug: string };
  const formCustom = formCustomRow as FormCustom | null;
  const campaigns = (campaignsData ?? []) as Campaign[];
  const minCents = campaigns[0]?.minimum_amount_cents ?? 100;

  const template = {
    ...FORM_TEMPLATE_PRESET,
    subheader_text: `Support ${org.name}`,
    design_sets: FORM_TEMPLATE_PRESET.design_sets?.map((s) => ({
      ...s,
      subtitle: `Support ${org.name}`,
    })) ?? null,
  };
  const effectiveForm = (formCustom ?? template) as FormCustom;
  const suggestedAmounts = (effectiveForm.suggested_amounts as number[] | null) ?? DEFAULT_AMOUNTS;

  const designSet = (effectiveForm.design_sets as DesignSet[] | undefined)?.[0] ?? (effectiveForm.header_image_url || effectiveForm.header_text || effectiveForm.subheader_text
    ? {
        media_type: "image" as const,
        media_url: effectiveForm.header_image_url ?? null,
        title: effectiveForm.header_text ?? null,
        subtitle: effectiveForm.subheader_text ?? null,
      }
    : null);

  return {
    org,
    formCustom,
    effectiveForm,
    campaigns,
    endowmentFunds: endowmentFunds ?? [],
    donationLinks: donationLinks ?? [],
    peerOrgs: peerOrgs ?? [],
    suggestedAmounts,
    minCents,
    designSet,
  };
}
