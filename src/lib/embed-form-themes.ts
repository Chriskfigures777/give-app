/**
 * Embed form themes. Each theme styles the give-split layout
 * (image left, form right) differently. Based on the website builder
 * templates in /templates/.
 */

export type EmbedFormThemeId = "default" | "grace" | "dark-elegant" | "bold-contemporary";

export const EMBED_FORM_THEMES: { id: EmbedFormThemeId; name: string; description: string }[] = [
  { id: "default", name: "Default", description: "Clean, modern form styling" },
  { id: "grace", name: "Grace Community", description: "Dark navy panel, gold accents, Playfair Display" },
  { id: "dark-elegant", name: "Dark Elegant", description: "Dark background, warm gold accents, Cormorant Garamond" },
  { id: "bold-contemporary", name: "Bold Contemporary", description: "Light card, bold red accents, Montserrat" },
];

export type SeamlessThemeId =
  | "church-grace" | "dark-elegant" | "bold-contemporary"
  | "modern-minimal" | "vibrant-community" | "serene-light"
  | "urban-modern" | "classic-reformed" | "organic-natural" | "warm-heritage";

type SeamlessThemeConfig = {
  accentColor: string;
  accentRgb: string;
  buttonTextColor: string;
  bgColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  fontUrl: string;
  borderRadius: string;
  isDark: boolean;
  darkBg?: string;
};

const SEAMLESS_THEMES: Record<SeamlessThemeId, SeamlessThemeConfig> = {
  "church-grace": {
    accentColor: "#C9A84C", accentRgb: "201,168,76", buttonTextColor: "#1A1A2E",
    bgColor: "#FAF7F2", textColor: "#333344",
    headingFont: "'Playfair Display',serif", bodyFont: "'Inter',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap",
    borderRadius: "8px", isDark: false,
  },
  "dark-elegant": {
    accentColor: "#FBBF24", accentRgb: "251,191,36", buttonTextColor: "#0F0F0F",
    bgColor: "#171717", textColor: "#E5E5E5",
    headingFont: "'Cormorant Garamond',serif", bodyFont: "'Inter',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600&display=swap",
    borderRadius: "8px", isDark: true, darkBg: "#0F0F0F",
  },
  "bold-contemporary": {
    accentColor: "#E63946", accentRgb: "230,57,70", buttonTextColor: "#ffffff",
    bgColor: "#F8F9FA", textColor: "#212529",
    headingFont: "'Montserrat',sans-serif", bodyFont: "'Open Sans',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;600&display=swap",
    borderRadius: "10px", isDark: false,
  },
  "modern-minimal": {
    accentColor: "#0EA5E9", accentRgb: "14,165,233", buttonTextColor: "#ffffff",
    bgColor: "#FAFAFA", textColor: "#1E293B",
    headingFont: "'Crimson Pro',serif", bodyFont: "'Inter',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700&family=Inter:wght@400;500;600&display=swap",
    borderRadius: "10px", isDark: false,
  },
  "vibrant-community": {
    accentColor: "#059669", accentRgb: "5,150,105", buttonTextColor: "#ffffff",
    bgColor: "#ECFDF5", textColor: "#065F46",
    headingFont: "'Fredoka',sans-serif", bodyFont: "'Poppins',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap",
    borderRadius: "14px", isDark: false,
  },
  "serene-light": {
    accentColor: "#7C3AED", accentRgb: "124,58,237", buttonTextColor: "#ffffff",
    bgColor: "#FAF5FF", textColor: "#581C87",
    headingFont: "'Lora',serif", bodyFont: "'Nunito',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Nunito:wght@400;500;600&display=swap",
    borderRadius: "14px", isDark: false,
  },
  "urban-modern": {
    accentColor: "#6366F1", accentRgb: "99,102,241", buttonTextColor: "#ffffff",
    bgColor: "#F4F4F5", textColor: "#27272A",
    headingFont: "'Space Grotesk',sans-serif", bodyFont: "'DM Sans',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap",
    borderRadius: "10px", isDark: false,
  },
  "classic-reformed": {
    accentColor: "#B45309", accentRgb: "180,83,9", buttonTextColor: "#ffffff",
    bgColor: "#FFF7ED", textColor: "#7C2D12",
    headingFont: "'Libre Baskerville',serif", bodyFont: "'Source Serif 4',Georgia,serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Serif+4:wght@400;600&display=swap",
    borderRadius: "10px", isDark: false,
  },
  "organic-natural": {
    accentColor: "#65A30D", accentRgb: "101,163,13", buttonTextColor: "#ffffff",
    bgColor: "#F7FEE7", textColor: "#1A2E05",
    headingFont: "'Merriweather',serif", bodyFont: "'Quicksand',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Quicksand:wght@400;500;600&display=swap",
    borderRadius: "16px", isDark: false,
  },
  "warm-heritage": {
    accentColor: "#D4AF37", accentRgb: "212,175,55", buttonTextColor: "#3E2723",
    bgColor: "#FFF8DC", textColor: "#3E2723",
    headingFont: "'Merriweather',serif", bodyFont: "'Lato',sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Lato:wght@400;700&display=swap",
    borderRadius: "4px", isDark: false,
  },
};

export function getSeamlessTheme(id: string): SeamlessThemeConfig | null {
  return SEAMLESS_THEMES[id as SeamlessThemeId] ?? null;
}

export function getSeamlessThemeFontUrl(id: string): string | null {
  return SEAMLESS_THEMES[id as SeamlessThemeId]?.fontUrl ?? null;
}

/** Base CSS that strips all generic chrome from the DonationForm in seamless mode. */
export const SEAMLESS_BASE_CSS = `
  html, body {
    background: transparent !important;
    color: inherit;
  }

  /* Kill outer form wrapper borders/background */
  #checkout, [id="checkout"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* Kill inner .give-form-tithely wrapper — has inline bg:#f8f9fa + border */
  .give-form-tithely {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 8px 0 !important;
  }

  /* Kill ALL section card borders — DonationForm uses inline style={{ borderColor }} */
  .p-4.rounded-lg.border,
  .rounded-lg.border,
  div[class*="rounded-lg"][class*="border"] {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  /* Section dividers */
  .border-t, .border-slate-200 {
    border-color: rgba(0,0,0,0.06) !important;
  }
`;

export function buildSeamlessThemeCSS(id: string): string {
  const t = SEAMLESS_THEMES[id as SeamlessThemeId];
  if (!t) return SEAMLESS_BASE_CSS;
  const accent = t.accentColor;
  const rgb = t.accentRgb;

  return `
    ${SEAMLESS_BASE_CSS}

    .seamless-theme { font-family: ${t.bodyFont}; color: ${t.textColor}; }
    .seamless-theme h3 { font-family: ${t.headingFont}; color: ${t.textColor} !important; }

    /* Amount / frequency toggle buttons — override inline styles */
    .seamless-theme button[type="button"] {
      border: 2px solid rgba(${rgb},0.2) !important;
      background: rgba(${rgb},0.04) !important;
      color: ${t.textColor} !important;
      border-radius: ${t.borderRadius} !important;
      transition: all 0.2s !important;
    }
    .seamless-theme button[type="button"]:hover,
    .seamless-theme button[type="button"].ring-2,
    .seamless-theme button[type="button"][aria-pressed="true"] {
      background: ${accent} !important;
      color: ${t.buttonTextColor} !important;
      border-color: ${accent} !important;
    }

    /* Primary action button (Continue / Give) — override inline bg */
    .seamless-theme [class*="py-3"][class*="font-medium"][class*="rounded"],
    .seamless-theme button[type="submit"] {
      background: ${accent} !important;
      color: ${t.buttonTextColor} !important;
      border: none !important;
      border-radius: ${t.borderRadius} !important;
      box-shadow: 0 4px 16px rgba(${rgb},0.25) !important;
    }

    /* Inputs — override inline border */
    .seamless-theme input[type="text"],
    .seamless-theme input[type="email"],
    .seamless-theme input[type="number"],
    .seamless-theme input[type="tel"],
    .seamless-theme select,
    .seamless-theme textarea {
      border: 2px solid rgba(${rgb},0.15) !important;
      border-radius: ${t.borderRadius} !important;
      transition: border-color 0.2s !important;
    }
    .seamless-theme input:focus,
    .seamless-theme select:focus,
    .seamless-theme textarea:focus {
      border-color: ${accent} !important;
      outline: none !important;
    }

    /* Section dividers */
    .seamless-theme .border-t,
    .seamless-theme .border-slate-200,
    .seamless-theme .border-slate-300 {
      border-color: rgba(${rgb},0.08) !important;
    }

    /* Labels & headings */
    .seamless-theme label,
    .seamless-theme .font-semibold,
    .seamless-theme .text-slate-700,
    .seamless-theme .text-slate-900 {
      color: ${t.textColor} !important;
    }
    .seamless-theme .text-slate-500,
    .seamless-theme .text-slate-400,
    .seamless-theme .text-slate-600 {
      color: ${t.textColor}99 !important;
    }
    .seamless-theme .text-3xl,
    .seamless-theme .tabular-nums {
      color: ${t.textColor} !important;
    }
  `;
}

/** Google Fonts URL for Grace theme (Playfair Display + Inter) */
export const GRACE_THEME_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap";

/** Google Fonts URL for Dark Elegant theme (Cormorant Garamond + Inter) */
export const DARK_ELEGANT_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap";

/** Google Fonts URL for Bold Contemporary theme (Montserrat + Open Sans) */
export const BOLD_CONTEMPORARY_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Open+Sans:wght@300;400;600;700&display=swap";

/* ──────────────────────────────────────────────────────
 * Shared CSS overrides for DonationForm Tailwind classes
 * inside a dark-background form panel (.gs-form).
 * ────────────────────────────────────────────────────── */
const DARK_FORM_OVERRIDES = (accentColor: string, accentRgb: string, accentDark: string) => `
  /* Form wrapper: override inline background/border from DonationForm */
  .gs-form .give-form-tithely,
  .gs-form > div > .give-form-tithely,
  .gs-form [class*="give-form"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  .gs-form #checkout {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* Reset ALL Tailwind borders inside the form panel */
  .gs-form .rounded-lg.border,
  .gs-form .p-4.rounded-lg.border,
  .gs-form [class*="rounded-lg"][class*="border"],
  .gs-form .border {
    background: transparent !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }

  .gs-form .border-slate-200,
  .gs-form .border-slate-300,
  .gs-form .border-t {
    border-color: rgba(255, 255, 255, 0.12) !important;
  }

  /* Text colors */
  .gs-form label,
  .gs-form .text-slate-700,
  .gs-form .text-slate-600,
  .gs-form .font-semibold {
    color: rgba(255, 255, 255, 0.85) !important;
  }

  .gs-form .text-slate-500,
  .gs-form .text-slate-400 {
    color: rgba(255, 255, 255, 0.5) !important;
  }

  .gs-form .text-slate-900,
  .gs-form h3 {
    color: white !important;
  }

  .gs-form .text-3xl,
  .gs-form .tabular-nums {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  /* Inputs — !important required to beat inline styles */
  .gs-form input[type="text"],
  .gs-form input[type="email"],
  .gs-form input[type="number"],
  .gs-form input[type="tel"],
  .gs-form select,
  .gs-form textarea {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    color: white !important;
  }

  .gs-form input::placeholder,
  .gs-form textarea::placeholder {
    color: rgba(255, 255, 255, 0.3) !important;
  }

  .gs-form select option {
    background: ${accentDark};
    color: white;
  }

  /* Amount / toggle buttons — !important needed to beat inline styles */
  .gs-form button[type="button"] {
    border: 1px solid rgba(${accentRgb}, 0.4) !important;
    background: rgba(${accentRgb}, 0.08) !important;
    color: white !important;
  }

  .gs-form button[type="button"]:hover,
  .gs-form button[type="button"].ring-2,
  .gs-form button[type="button"][aria-pressed="true"] {
    background: ${accentColor} !important;
    color: ${accentDark} !important;
    border-color: ${accentColor} !important;
  }

  /* Primary action button (Continue / Give) */
  .gs-form [class*="py-3"][class*="font-medium"][class*="rounded-lg"],
  .gs-form button[type="submit"] {
    background: ${accentColor} !important;
    color: ${accentDark} !important;
    border: none !important;
    box-shadow: 0 4px 20px rgba(${accentRgb}, 0.35);
  }

  /* Checkbox */
  .gs-form input[type="checkbox"] {
    border-color: rgba(255, 255, 255, 0.3) !important;
    background: rgba(255, 255, 255, 0.08) !important;
  }

  /* Goal progress bar */
  .gs-form .bg-slate-100 {
    background: rgba(255, 255, 255, 0.1) !important;
  }

  /* ChevronDown, icons */
  .gs-form svg {
    color: rgba(255, 255, 255, 0.6);
  }
`;

/* ──────────────────────────────────────────────────────
 * Shared CSS overrides for DonationForm Tailwind classes
 * inside a LIGHT-background form card (.gs-form-light).
 * ────────────────────────────────────────────────────── */
const LIGHT_FORM_OVERRIDES = (accentColor: string, accentRgb: string) => `
  /* Amount / toggle buttons */
  .gs-form-light button[type="button"]:not([class*="bg-"]) {
    border: 2px solid #E5E7EB;
    background: transparent;
    color: #1E293B;
    transition: all 0.2s;
  }

  .gs-form-light button[type="button"]:not([class*="bg-"]):hover,
  .gs-form-light button[type="button"].ring-2,
  .gs-form-light button[type="button"][aria-pressed="true"] {
    border-color: ${accentColor};
    background: rgba(${accentRgb}, 0.06);
    color: ${accentColor};
  }

  /* Primary action button */
  .gs-form-light [class*="py-3"][class*="font-medium"][class*="rounded-lg"],
  .gs-form-light button[type="submit"] {
    background: ${accentColor} !important;
    color: white !important;
    border: none !important;
    box-shadow: 0 4px 20px rgba(${accentRgb}, 0.25);
  }

  /* Inputs */
  .gs-form-light input[type="text"],
  .gs-form-light input[type="email"],
  .gs-form-light input[type="number"],
  .gs-form-light input[type="tel"],
  .gs-form-light select,
  .gs-form-light textarea {
    border: 2px solid #E5E7EB !important;
    border-radius: 10px !important;
    transition: border-color 0.2s;
  }

  .gs-form-light input:focus,
  .gs-form-light select:focus,
  .gs-form-light textarea:focus {
    border-color: ${accentColor} !important;
  }

  /* Section borders */
  .gs-form-light .border-slate-200,
  .gs-form-light .border-t {
    border-color: #E5E7EB !important;
  }
`;


/**
 * Full CSS for the Grace theme, extracted from church-standalone/give.html.
 * Uses give-split layout with dark form panel, gold accents.
 */
export const GRACE_THEME_CSS = `
/* ── Grace Community Church embed form theme ── */
.embed-theme-grace {
  --gold: #C9A84C;
  --deep: #1A1A2E;
  --navy: #16213E;
  --cream: #FAF7F2;
  --text: #333344;
  --muted: #6B7280;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.embed-theme-grace *,
.embed-theme-grace *::before,
.embed-theme-grace *::after {
  box-sizing: border-box;
}

/* give-split: image left, form right */
.embed-theme-grace .give-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
}

.embed-theme-grace .gs-img img,
.embed-theme-grace .gs-img video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 320px;
}

.embed-theme-grace .gs-form {
  background: var(--deep);
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.embed-theme-grace .gs-form .sec-eye {
  font-size: 11px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 700;
  margin-bottom: 14px;
  display: block;
}

.embed-theme-grace .gs-form h3 {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: white;
  margin-bottom: 8px;
}

.embed-theme-grace .gs-form > .gs-form-desc {
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  margin-bottom: 24px;
}

.embed-theme-grace .gs-form-secure {
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  margin-top: 10px;
  text-align: center;
}

/* Override DonationForm Tailwind inside Grace theme */
.embed-theme-grace ${DARK_FORM_OVERRIDES("#C9A84C", "201, 168, 76", "#1A1A2E")}

/* Responsive — viewport-based fallback */
@media (max-width: 768px) {
  .embed-theme-grace .give-split {
    grid-template-columns: 1fr;
  }
}

/* Container-query support for previews inside narrow containers */
@container (max-width: 600px) {
  .embed-theme-grace .give-split {
    grid-template-columns: 1fr;
  }
}
`;


/**
 * Full CSS for the Dark Elegant theme (from templates/dark-elegant/give.html).
 * Dark #0F0F0F background, warm gold #FBBF24 accents, Cormorant Garamond headings.
 */
export const DARK_ELEGANT_THEME_CSS = `
/* ── Dark Elegant embed form theme ── */
.embed-theme-dark-elegant {
  --accent: #FBBF24;
  --accent-hover: #F59E0B;
  --dark: #0F0F0F;
  --bg: #171717;
  --card: #1F1F1F;
  --border: rgba(255, 255, 255, 0.08);
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.embed-theme-dark-elegant *,
.embed-theme-dark-elegant *::before,
.embed-theme-dark-elegant *::after {
  box-sizing: border-box;
}

.embed-theme-dark-elegant .give-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: 500px;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
}

.embed-theme-dark-elegant .gs-img {
  position: relative;
  overflow: hidden;
}

.embed-theme-dark-elegant .gs-img img,
.embed-theme-dark-elegant .gs-img video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 400px;
}

.embed-theme-dark-elegant .gs-img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 60%, var(--dark));
}

.embed-theme-dark-elegant .gs-form {
  background: var(--dark);
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-left: 1px solid var(--border);
}

.embed-theme-dark-elegant .gs-form .sec-eye {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
  display: block;
}

.embed-theme-dark-elegant .gs-form h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  line-height: 1.2;
}

.embed-theme-dark-elegant .gs-form > .gs-form-desc {
  color: #A3A3A3;
  font-size: 15px;
  margin-bottom: 28px;
}

.embed-theme-dark-elegant .gs-form-secure {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  justify-content: center;
}

/* Override DonationForm Tailwind inside Dark Elegant theme */
.embed-theme-dark-elegant ${DARK_FORM_OVERRIDES("#FBBF24", "251, 191, 36", "#0F0F0F")}

/* Responsive */
@media (max-width: 768px) {
  .embed-theme-dark-elegant .give-split {
    grid-template-columns: 1fr;
  }
  .embed-theme-dark-elegant .gs-form {
    border-left: none;
    border-top: 1px solid var(--border);
  }
}

@container (max-width: 600px) {
  .embed-theme-dark-elegant .give-split {
    grid-template-columns: 1fr;
  }
  .embed-theme-dark-elegant .gs-form {
    border-left: none;
    border-top: 1px solid var(--border);
  }
}
`;


/**
 * Full CSS for the Bold Contemporary theme (from templates/bold-contemporary/give.html).
 * Light card background, bold red #E63946 accent, Montserrat + Open Sans.
 * Uses a side-by-side layout: text left, white card with form right.
 */
export const BOLD_CONTEMPORARY_THEME_CSS = `
/* ── Bold Contemporary embed form theme ── */
.embed-theme-bold {
  --primary: #E63946;
  --primary-dark: #C62828;
  --dark: #0D1821;
  --light: #F8F9FA;
  --text: #212529;
  --muted: #6C757D;
  font-family: 'Open Sans', sans-serif;
  box-sizing: border-box;
}

.embed-theme-bold *,
.embed-theme-bold *::before,
.embed-theme-bold *::after {
  box-sizing: border-box;
}

.embed-theme-bold .give-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  background: white;
}

.embed-theme-bold .gs-img {
  position: relative;
  overflow: hidden;
}

.embed-theme-bold .gs-img img,
.embed-theme-bold .gs-img video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 400px;
}

.embed-theme-bold .gs-form-light {
  background: white;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.embed-theme-bold .gs-form-light .sec-eye {
  display: inline-block;
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--primary);
  font-weight: 800;
  margin-bottom: 16px;
  background: rgba(230, 57, 70, 0.08);
  padding: 6px 14px;
  border-radius: 50px;
  border: 1px solid rgba(230, 57, 70, 0.15);
}

.embed-theme-bold .gs-form-light h3 {
  font-family: 'Montserrat', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: var(--dark);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  line-height: 1.15;
}

.embed-theme-bold .gs-form-light > .gs-form-desc {
  color: var(--muted);
  font-size: 15px;
  margin-bottom: 28px;
  line-height: 1.6;
}

.embed-theme-bold .gs-form-secure {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: var(--muted);
}

/* Override DonationForm Tailwind inside Bold Contemporary theme */
.embed-theme-bold ${LIGHT_FORM_OVERRIDES("#E63946", "230, 57, 70")}

/* Responsive */
@media (max-width: 768px) {
  .embed-theme-bold .give-split {
    grid-template-columns: 1fr;
  }
}

@container (max-width: 600px) {
  .embed-theme-bold .give-split {
    grid-template-columns: 1fr;
  }
}
`;
