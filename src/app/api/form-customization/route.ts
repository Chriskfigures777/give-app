import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/supabase";

/** PATCH: update form_customizations for the authenticated user's organization. */
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("role, organization_id, preferred_organization_id")
      .eq("id", user.id)
      .single();

    type Profile = { role: string; organization_id: string | null; preferred_organization_id: string | null };
    const profile = profileRow as Profile | null;
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const isPlatformAdmin = profile?.role === "platform_admin";

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const targetOrgId = body.organizationId as string | undefined;
    const organizationId = isPlatformAdmin ? targetOrgId : orgId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization required" },
        { status: 400 }
      );
    }

    if (!isPlatformAdmin && organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    type DesignSetPayload = { media_type: "image" | "video"; media_url: string | null; title: string | null; subtitle: string | null };
    const {
      suggested_amounts,
      allow_custom_amount,
      header_text,
      subheader_text,
      header_image_url,
      button_border_radius,
      primary_color,
      button_color,
      button_text_color,
      background_color,
      text_color,
      show_endowment_selection,
      font_family,
      design_sets,
      thank_you_message,
      thank_you_video_url,
      thank_you_cta_url,
      thank_you_cta_text,
      form_display_mode,
      form_media_side,
      embed_form_theme,
      org_page_embed_card_id,
      org_page_donate_link_slug,
      donation_section_layout,
      splits,
      split_mode,
    } = body as {
      suggested_amounts?: number[];
      allow_custom_amount?: boolean;
      header_text?: string;
      subheader_text?: string;
      header_image_url?: string | null;
      button_border_radius?: string | null;
      primary_color?: string;
      button_color?: string;
      button_text_color?: string;
      background_color?: string;
      text_color?: string;
      show_endowment_selection?: boolean;
      font_family?: string;
      design_sets?: DesignSetPayload[] | null;
      thank_you_message?: string | null;
      thank_you_video_url?: string | null;
      thank_you_cta_url?: string | null;
      thank_you_cta_text?: string | null;
      form_display_mode?: "full" | "compressed" | "full_width";
      form_media_side?: "left" | "right";
      embed_form_theme?: "default" | "grace" | "dark-elegant" | "bold-contemporary";
      org_page_embed_card_id?: string | null;
      org_page_donate_link_slug?: string | null;
      donation_section_layout?: "text_left" | "text_right";
      splits?: { percentage: number; accountId?: string; splitBankAccountId?: string }[];
      split_mode?: "stripe_connect" | "bank_accounts";
    };

    const update: Record<string, unknown> = {};
    if (suggested_amounts !== undefined) update.suggested_amounts = suggested_amounts;
    if (allow_custom_amount !== undefined) update.allow_custom_amount = allow_custom_amount;
    if (header_text !== undefined) update.header_text = header_text;
    if (subheader_text !== undefined) update.subheader_text = subheader_text;
    if (header_image_url !== undefined) update.header_image_url = header_image_url || null;
    if (button_border_radius !== undefined) update.button_border_radius = button_border_radius || null;
    if (primary_color !== undefined) update.primary_color = primary_color;
    if (button_color !== undefined) update.button_color = button_color;
    if (button_text_color !== undefined) update.button_text_color = button_text_color;
    if (background_color !== undefined) update.background_color = background_color;
    if (text_color !== undefined) update.text_color = text_color;
    if (show_endowment_selection !== undefined) update.show_endowment_selection = show_endowment_selection;
    if (font_family !== undefined) update.font_family = font_family;
    if (design_sets !== undefined) {
      if (Array.isArray(design_sets)) {
        update.design_sets = design_sets;
      } else if (typeof design_sets === "string") {
        try {
          const parsed = JSON.parse(design_sets);
          update.design_sets = Array.isArray(parsed) ? parsed : null;
        } catch {
          update.design_sets = null;
        }
      } else {
        update.design_sets = null;
      }
    }
    if (thank_you_message !== undefined) update.thank_you_message = thank_you_message ?? null;
    if (thank_you_video_url !== undefined) update.thank_you_video_url = thank_you_video_url ?? null;
    if (thank_you_cta_url !== undefined) update.thank_you_cta_url = thank_you_cta_url ?? null;
    if (thank_you_cta_text !== undefined) update.thank_you_cta_text = thank_you_cta_text ?? null;
    if (form_display_mode !== undefined) update.form_display_mode = form_display_mode;
    if (form_media_side !== undefined) update.form_media_side = form_media_side;
    if (embed_form_theme !== undefined) update.embed_form_theme = embed_form_theme ?? "default";
    if (org_page_embed_card_id !== undefined) update.org_page_embed_card_id = org_page_embed_card_id ?? null;
    if (org_page_donate_link_slug !== undefined) update.org_page_donate_link_slug = org_page_donate_link_slug ?? null;
    if (donation_section_layout !== undefined) update.donation_section_layout = donation_section_layout;
    if (splits !== undefined) {
      const { SPLITS_ENABLED } = await import("@/lib/feature-flags");
      if (!SPLITS_ENABLED) {
        update.splits = [];
      } else {
        const filtered = Array.isArray(splits)
          ? splits.filter((s) => typeof s?.accountId === "string")
          : [];
        const valid =
          Array.isArray(filtered) &&
          filtered.every(
            (s) => typeof s?.percentage === "number" && typeof s?.accountId === "string"
          );

        if (valid && filtered.length > 0) {
          const { getOrgPlan, getEffectiveSplitRecipientLimit } = await import("@/lib/plan");
          const { plan: orgPlan, planStatus: orgPlanStatus } = await getOrgPlan(organizationId, supabase);
          const recipientLimit = getEffectiveSplitRecipientLimit(orgPlan, orgPlanStatus);
          const uniqueRecipients = new Set(filtered.map((s) => s.accountId));
          if (uniqueRecipients.size > recipientLimit) {
            return NextResponse.json(
              {
                error: `Your ${orgPlan === "free" ? "Free" : orgPlan === "growth" ? "Growth" : "Pro"} plan allows ${recipientLimit} split recipient${recipientLimit === 1 ? "" : "s"}. Upgrade for more.`,
                code: "SPLIT_RECIPIENT_LIMIT",
              },
              { status: 403 }
            );
          }
        }

        update.splits = valid ? filtered : [];
      }
    }
    if (split_mode !== undefined) {
      update.split_mode = "stripe_connect";
    }

    const { data: existing } = await supabase
      .from("form_customizations")
      .select("id")
      .eq("organization_id", organizationId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("form_customizations")
        // @ts-ignore - Supabase client infers update payload as never in some setups
        .update(update)
        .eq("organization_id", organizationId);
      if (error) {
        console.error("form-customization update", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    } else {
      // @ts-ignore - Supabase client infers insert payload as never in some setups
      const { error } = await supabase.from("form_customizations").insert({
        organization_id: organizationId,
        ...update,
      });
      if (error) {
        console.error("form-customization insert", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("form-customization", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
