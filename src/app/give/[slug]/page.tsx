import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DonationForm } from "./donation-form";
import { GiveSignInPrompt } from "./give-sign-in-prompt";
import { GivePageQRCode } from "@/components/give-page-qr-code";
import { FormCardMedia } from "@/components/form-card-media";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";
import { getGoogleFontUrl, getFontFamily, getHeaderFontWeight } from "@/lib/form-fonts";
import type { DesignSet } from "@/lib/stock-media";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ frequency?: string; link?: string }> };

export default async function GivePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { frequency: frequencyParam, link: linkParam } = await searchParams;
  const initialFrequency = (typeof frequencyParam === "string" ? frequencyParam : frequencyParam?.[0]) as "monthly" | "yearly" | undefined;
  const linkSlug = typeof linkParam === "string" ? linkParam : linkParam?.[0];
  const supabase = await createClient();

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, slug, stripe_connect_account_id")
    .eq("slug", slug)
    .single();

  const org = orgRow as { id: string; name: string; slug: string; stripe_connect_account_id: string | null } | null;
  if (!org) notFound();

  let donationLinkId: string | null = null;
  if (linkSlug) {
    const { data: linkRow } = await supabase
      .from("donation_links")
      .select("id")
      .eq("organization_id", org.id)
      .eq("slug", linkSlug)
      .single();
    donationLinkId = (linkRow as { id: string } | null)?.id ?? null;
  }

  if (!donationLinkId && !org.stripe_connect_account_id) notFound();

  const [{ data: campaignsData }, { data: formCustomRow }, { data: endowmentFunds }] = await Promise.all([
    supabase
      .from("donation_campaigns")
      .select("id, name, suggested_amounts, minimum_amount_cents, allow_recurring, allow_anonymous, goal_amount_cents, current_amount_cents")
      .eq("organization_id", org.id)
      .eq("is_active", true),
    supabase
      .from("form_customizations")
      .select("*")
      .eq("organization_id", org.id)
      .single(),
    supabase
      .from("endowment_funds")
      .select("id, name")
      .limit(20),
  ]);

  type FormCustom = { suggested_amounts?: number[] | null; show_endowment_selection?: boolean | null; allow_custom_amount?: boolean | null; header_text?: string | null; subheader_text?: string | null; primary_color?: string | null; button_color?: string | null; button_text_color?: string | null; button_border_radius?: string | null; background_color?: string | null; text_color?: string | null; font_family?: string | null; header_image_url?: string | null; design_sets?: DesignSet[] | null };
  const formCustom = formCustomRow as FormCustom | null;
  const designSets = (formCustom?.design_sets as DesignSet[] | undefined)?.filter((s) => s && (s.media_url || s.title || s.subtitle)) ?? [];
  type Campaign = { id: string; name: string; suggested_amounts: unknown; minimum_amount_cents: number | null; allow_recurring: boolean | null; allow_anonymous: boolean | null; goal_amount_cents?: number | null; current_amount_cents?: number | null };
  const campaigns = (campaignsData ?? []) as Campaign[];

  const suggestedAmounts = (formCustom?.suggested_amounts as number[] | null) ?? [10, 12, 25, 50, 100, 250, 500, 1000];
  const minCents = campaigns[0]?.minimum_amount_cents ?? 100;
  const fontFamily = getFontFamily(formCustom?.font_family);
  const headerFontWeight = getHeaderFontWeight(formCustom?.font_family);
  const googleFontUrl = getGoogleFontUrl(formCustom?.font_family);

  return (
    <main
      className="min-h-screen p-5 flex flex-col items-center justify-center"
      style={{
        backgroundColor: formCustom?.background_color ?? "var(--stripe-light-grey)",
        color: formCustom?.text_color ?? "var(--stripe-dark)",
        fontFamily,
      }}
    >
      {googleFontUrl && (
        <link rel="stylesheet" href={googleFontUrl} />
      )}
      <div
        className="w-full max-w-[480px] overflow-hidden"
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: formCustom?.button_border_radius ?? "8px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          background: "#fff",
        }}
      >
        {designSets.length > 0 ? (
          designSets.map((set, i) => (
            <FormCardMedia
              key={i}
              set={set}
              fallbackImageUrl={formCustom?.header_image_url ?? DEFAULT_HEADER_IMAGE_URL}
              className="h-56"
              fontFamily={fontFamily}
              titleFontWeight={headerFontWeight ?? 700}
            />
          ))
        ) : (
          <div className="relative w-full h-56 overflow-hidden">
            <img
              src={formCustom?.header_image_url ?? DEFAULT_HEADER_IMAGE_URL}
              alt=""
              className="absolute inset-0 w-full h-full object-cover block"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
              <h1
                className="text-2xl font-bold leading-tight mb-1"
                style={{
                  fontFamily,
                  fontWeight: headerFontWeight ?? 700,
                  textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)",
                }}
              >
                {formCustom?.header_text ?? "Make a Donation"}
              </h1>
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
          buttonColor={formCustom?.button_color}
          buttonTextColor={formCustom?.button_text_color}
          borderRadius={formCustom?.button_border_radius ?? undefined}
          slug={slug}
          noCard
          initialFrequency={initialFrequency}
          donationLinkId={donationLinkId ?? undefined}
        />
          <GiveSignInPrompt slug={slug} initialFrequency={initialFrequency} organizationName={org.name} />
          <div className="mt-4 flex justify-center">
            <GivePageQRCode slug={slug} organizationName={org.name} />
          </div>
        </div>
      </div>
    </main>
  );
}
