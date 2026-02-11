import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { env } from "@/env";
import { EmbedFormClient } from "../embed/embed-form-client";

const DEFAULT_AMOUNTS = [10, 12, 25, 50, 100, 250, 500, 1000];

type Campaign = { id: string; name: string; suggested_amounts: unknown; minimum_amount_cents: number | null; allow_recurring: boolean | null; allow_anonymous: boolean | null };
type DesignSet = { media_type: "image" | "video"; media_url: string | null; title: string | null; subtitle: string | null };
type FormCustom = {
  suggested_amounts?: number[] | null;
  allow_custom_amount?: boolean | null;
  show_endowment_selection?: boolean | null;
  header_text?: string | null;
  subheader_text?: string | null;
  thank_you_message?: string | null;
  primary_color?: string | null;
  button_color?: string | null;
  button_text_color?: string | null;
  button_border_radius?: string | null;
  header_image_url?: string | null;
  font_family?: string | null;
  design_sets?: DesignSet[] | null;
};

export default async function CustomizationPage() {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!isPlatformAdmin && !orgId) redirect("/dashboard");

  const orgQuery = supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId!)
    .single();

  const formQuery = supabase
    .from("form_customizations")
    .select("*")
    .eq("organization_id", orgId!)
    .single();

  const campaignsQuery = supabase
    .from("donation_campaigns")
    .select("id, name, suggested_amounts, minimum_amount_cents, allow_recurring, allow_anonymous")
    .eq("organization_id", orgId!)
    .eq("is_active", true);

  const endowmentQuery = supabase
    .from("endowment_funds")
    .select("id, name")
    .limit(20);

  const [{ data: orgRow }, { data: formCustomRow }, { data: campaignsData }, { data: endowmentFunds }] = await Promise.all([
    orgQuery,
    formQuery,
    campaignsQuery,
    endowmentQuery,
  ]);

  if (!orgRow) redirect("/dashboard");
  const org = orgRow as { id: string; name: string; slug: string };
  const formCustom = formCustomRow as FormCustom | null;
  const campaigns = (campaignsData ?? []) as Campaign[];
  const minCents = campaigns[0]?.minimum_amount_cents ?? 100;
  const suggestedAmounts = (formCustom?.suggested_amounts as number[] | null) ?? DEFAULT_AMOUNTS;
  const baseUrl = env.app.domain().replace(/\/$/, "");

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-white p-8 shadow-sm">
        <div className="absolute right-0 top-0 h-32 w-48 bg-gradient-to-bl from-emerald-100/60 to-transparent" aria-hidden />
        <h1 className="relative text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Form customization
        </h1>
        <p className="relative mt-2 max-w-2xl text-slate-600">
          Your Stripe donation form is below. Customize it, then embed it on your website (Webflow, WordPress, or any site).
        </p>
      </div>

      <EmbedFormClient
        organizationId={org.id}
        organizationName={org.name}
        slug={org.slug}
        baseUrl={baseUrl}
        campaigns={campaigns}
        endowmentFunds={endowmentFunds ?? []}
        suggestedAmounts={suggestedAmounts}
        minimumAmountCents={minCents}
        showEndowmentSelection={formCustom?.show_endowment_selection ?? false}
        allowCustomAmount={formCustom?.allow_custom_amount ?? true}
        initialHeaderText={formCustom?.header_text ?? "Make a Donation"}
        initialSubheaderText={formCustom?.subheader_text ?? `Support ${org.name}`}
        initialThankYouMessage={formCustom?.thank_you_message ?? null}
        initialButtonColor={formCustom?.button_color ?? null}
        initialButtonTextColor={formCustom?.button_text_color ?? null}
        headerImageUrl={formCustom?.header_image_url ?? null}
        primaryColor={formCustom?.primary_color ?? null}
        initialBorderRadius={formCustom?.button_border_radius ?? null}
        initialFontFamily={formCustom?.font_family ?? null}
        initialDesignSets={(formCustom?.design_sets as DesignSet[] | undefined) ?? null}
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Embed on Webflow & WordPress</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use the iframe code from the section above in your site builder.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>
            <strong>Webflow:</strong> Add an Embed element, paste the iframe code into the Embed code field, then resize the block (e.g. 100% width, 600px height).
          </li>
          <li>
            <strong>WordPress:</strong> Add a Custom HTML block and paste the iframe code, or use a plugin like “Insert HTML Snippet” or “Embed Code”.
          </li>
        </ul>
      </section>
    </div>
  );
}
