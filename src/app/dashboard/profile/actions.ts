"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

const DEFAULT_FORM_ID = "__default__";

export type SaveProfileInput = {
  orgSlug?: string;
  profile_image_url?: string | null;
  logo_url?: string | null;
  page_hero_video_url?: string | null;
  page_hero_image_url?: string | null;
  page_summary?: string | null;
  page_mission?: string | null;
  page_goals?: string | null;
  page_story?: string | null;
  page_story_image_url?: string | null;
  page_about_image_side?: "left" | "right";
  page_story_image_side?: "left" | "right";
  donation_section_layout?: "text_left" | "text_right";
  org_page_embed_card_id?: string | null;
  form_display_mode?: "full" | "compressed" | "full_width";
  form_media_side?: "left" | "right";
};

export async function savePublicPage(input: SaveProfileInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId) {
      return { ok: false, error: "Organization required" };
    }

    const orgFields = [
      "profile_image_url",
      "logo_url",
      "page_hero_video_url",
      "page_hero_image_url",
      "page_summary",
      "page_mission",
      "page_goals",
      "page_story",
      "page_story_image_url",
      "page_about_image_side",
      "page_story_image_side",
    ];
    const hasOrgUpdates = orgFields.some((k) => input[k as keyof SaveProfileInput] !== undefined);

    if (hasOrgUpdates) {
      const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const key of orgFields) {
        const val = input[key as keyof SaveProfileInput];
        if (val !== undefined) {
          if (key === "page_about_image_side" || key === "page_story_image_side") {
            updatePayload[key] = val === "right" ? "right" : "left";
          } else {
            updatePayload[key] = val === "" ? null : val;
          }
        }
      }

      const { error } = await supabase
        .from("organizations")
        .update(updatePayload)
        .eq("id", orgId);

      if (error) {
        console.error("savePublicPage org error:", error);
        return { ok: false, error: error.message };
      }
    }

    const formFields = ["donation_section_layout", "org_page_embed_card_id", "form_display_mode", "form_media_side"];
    const hasFormUpdates = formFields.some((k) => input[k as keyof SaveProfileInput] !== undefined);

    if (hasFormUpdates) {
      const update: Record<string, unknown> = {};
      if (input.donation_section_layout !== undefined) update.donation_section_layout = input.donation_section_layout;
      if (input.org_page_embed_card_id !== undefined) {
        update.org_page_embed_card_id = input.org_page_embed_card_id === DEFAULT_FORM_ID ? null : input.org_page_embed_card_id;
      }
      if (input.form_display_mode !== undefined) update.form_display_mode = input.form_display_mode;
      if (input.form_media_side !== undefined) update.form_media_side = input.form_media_side;

      const { data: existing } = await supabase
        .from("form_customizations")
        .select("id")
        .eq("organization_id", orgId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("form_customizations")
          .update(update)
          .eq("organization_id", orgId);

        if (error) {
          console.error("savePublicPage form error:", error);
          return { ok: false, error: error.message };
        }
      } else {
        const { error } = await supabase.from("form_customizations").insert({
          organization_id: orgId,
          ...update,
        });

        if (error) {
          console.error("savePublicPage form insert error:", error);
          return { ok: false, error: error.message };
        }
      }
    }

    revalidatePath("/dashboard/profile");
    if (input.orgSlug) {
      revalidatePath(`/org/${input.orgSlug}`, "page");
      revalidatePath("/org", "layout");
    }
    return { ok: true };
  } catch (e) {
    console.error("savePublicPage error:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save",
    };
  }
}
