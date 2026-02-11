/**
 * Google Fonts and form typography.
 * Keys are stored in form_customizations.font_family; we map to CSS font-family and load URL when needed.
 */
export const FORM_FONT_OPTIONS = [
  { value: "", label: "System default" },
  { value: "Barlow", label: "Barlow" },
  { value: "Barlow Black", label: "Barlow Black" },
  { value: "Poppins", label: "Poppins" },
  { value: "Inter", label: "Inter" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Roboto", label: "Roboto" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Nunito", label: "Nunito" },
] as const;

export type FormFontKey = (typeof FORM_FONT_OPTIONS)[number]["value"];

/** CSS font-family string for the given key (for body and form). */
export function getFontFamily(key: string | null | undefined): string {
  if (!key?.trim()) return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const k = key.trim();
  if (k === "Barlow Black") return "'Barlow', sans-serif";
  return `'${k}', sans-serif`;
}

/** Font weight for the overlay header when key is "Barlow Black" (900). */
export function getHeaderFontWeight(key: string | null | undefined): number | undefined {
  if (key?.trim() === "Barlow Black") return 900;
  return undefined;
}

/** Google Fonts CSS URL for the given key; empty string if system or not found. */
export function getGoogleFontUrl(key: string | null | undefined): string {
  if (!key?.trim()) return "";
  const k = key.trim();
  switch (k) {
    case "Barlow":
      return "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap";
    case "Barlow Black":
      return "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;900&display=swap";
    case "Poppins":
      return "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
    case "Inter":
      return "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    case "Open Sans":
      return "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap";
    case "Lato":
      return "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap";
    case "Roboto":
      return "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap";
    case "Montserrat":
      return "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap";
    case "Nunito":
      return "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap";
    default:
      return "";
  }
}
