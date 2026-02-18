import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { env } from "@/env";
import { PageBuilderClient } from "./page-builder-client";

const DEFAULT_FORM_ID = "__default__";

export default async function PageBuilderPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!profile?.organization_id && !profile?.preferred_organization_id && profile?.role !== "platform_admin") {
    redirect("/dashboard");
  }

  const targetOrgId = orgId!;
  const [orgRes, formRes, embedCardsRes, campaignsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("id", targetOrgId)
      .single(),
    supabase
      .from("form_customizations")
      .select("org_page_embed_card_id, header_image_url, header_text, subheader_text, design_sets, button_color, button_text_color")
      .eq("organization_id", targetOrgId)
      .single(),
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

  const { data: orgRow } = orgRes;
  if (!orgRow) redirect("/dashboard");

  const org = orgRow as { id: string; name: string; slug: string };
  const formCustom = formRes.data as {
    org_page_embed_card_id?: string | null;
    header_image_url?: string | null;
    header_text?: string | null;
    subheader_text?: string | null;
    design_sets?: Array<{ media_type?: string; media_url?: string | null; title?: string | null; subtitle?: string | null }> | null;
    button_color?: string | null;
    button_text_color?: string | null;
  } | null;
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
  const campaigns = (campaignsRes.data ?? []) as {
    id: string;
    name: string;
    goal_amount_cents?: number | null;
    current_amount_cents?: number | null;
  }[];
  const baseUrl = env.app.domain().replace(/\/$/, "");

  const defaultDesignSet = formCustom?.design_sets?.[0];
  const donationCards = formCustom
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
        ...allEmbedCards,
      ]
    : allEmbedCards;

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-white p-8 shadow-sm">
        <div className="absolute right-0 top-0 h-32 w-48 bg-gradient-to-bl from-emerald-100/60 to-transparent" aria-hidden />
        <h1 className="relative text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Page builder
        </h1>
        <p className="relative mt-2 max-w-2xl text-slate-600">
          Edit your public page. Your existing page loads automatically—drag blocks to reorder, click to edit. No building from scratch.
        </p>
      </div>

      <PageBuilderClient
        organizationId={org.id}
        organizationName={org.name}
        slug={org.slug}
        baseUrl={baseUrl}
        campaigns={campaigns}
        donationCards={donationCards}
        orgPageEmbedCardId={formCustom?.org_page_embed_card_id ?? null}
      />
    </div>
  );
}
