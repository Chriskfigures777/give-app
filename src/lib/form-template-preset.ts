/**
 * Default form customization preset (template).
 * Used when an organization has no form_customizations row.
 * Based on CBFiguresHouse template — modern, clean design.
 */

import type { DesignSet } from "./stock-media";

export type FormTemplatePreset = {
  suggested_amounts: number[];
  allow_custom_amount: boolean;
  show_endowment_selection: boolean;
  header_text: string;
  subheader_text: string;
  thank_you_message: string | null;
  thank_you_video_url: string | null;
  thank_you_cta_url: string | null;
  thank_you_cta_text: string | null;
  primary_color: string | null;
  button_color: string | null;
  button_text_color: string | null;
  button_border_radius: string | null;
  header_image_url: string | null;
  font_family: string | null;
  design_sets: DesignSet[] | null;
  form_display_mode: "full" | "compressed" | "full_width";
  form_media_side: "left" | "right";
};

/** CBFiguresHouse-style template: clean, modern donation form defaults */
export const FORM_TEMPLATE_PRESET: FormTemplatePreset = {
  suggested_amounts: [10, 25, 50, 100, 250, 500],
  allow_custom_amount: true,
  show_endowment_selection: false,
  header_text: "Make a Donation",
  subheader_text: "Support our mission",
  thank_you_message: "Thank you for your generosity!",
  thank_you_video_url: null,
  thank_you_cta_url: null,
  thank_you_cta_text: null,
  primary_color: "#059669",
  button_color: "#059669",
  button_text_color: "#ffffff",
  button_border_radius: "12px",
  header_image_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
  font_family: "barlow",
  design_sets: [
    {
      media_type: "image",
      media_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
      title: "Make a Donation",
      subtitle: "Support our mission",
    },
  ],
  form_display_mode: "compressed",
  form_media_side: "left",
};
