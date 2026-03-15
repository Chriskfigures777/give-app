/**
 * Broadcast email template system.
 * Supports full customization: logo, colors, fonts, size, weight,
 * signature, layout, and more.
 */

// ─── Font options ────────────────────────────────────────────────────────────

export type FontFamily =
  | "sans"
  | "serif"
  | "mono"
  | "georgia"
  | "garamond"
  | "trebuchet"
  | "verdana";

export const FONT_FAMILIES: { id: FontFamily; label: string; stack: string }[] = [
  { id: "sans",      label: "Sans-serif (Modern)",  stack: "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" },
  { id: "serif",     label: "Serif (Classic)",       stack: "'Times New Roman', Times, serif" },
  { id: "georgia",   label: "Georgia (Elegant)",     stack: "Georgia, 'Times New Roman', serif" },
  { id: "garamond",  label: "Garamond (Literary)",   stack: "Garamond, 'Book Antiqua', Palatino, serif" },
  { id: "trebuchet", label: "Trebuchet (Friendly)",  stack: "'Trebuchet MS', Helvetica, sans-serif" },
  { id: "verdana",   label: "Verdana (Readable)",    stack: "Verdana, Geneva, Tahoma, sans-serif" },
  { id: "mono",      label: "Monospace (Technical)", stack: "'Courier New', Courier, monospace" },
];

export function getFontStack(id: FontFamily): string {
  return FONT_FAMILIES.find((f) => f.id === id)?.stack ?? FONT_FAMILIES[0].stack;
}

// ─── Template presets ────────────────────────────────────────────────────────

export type TemplateId =
  | "clean-white"
  | "bold-dark"
  | "warm-faith"
  | "royal-purple"
  | "forest-green"
  | "sky-blue";

export type BroadcastTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  bg: string;
  cardBg: string;
  accent: string;
  textColor: string;
  mutedColor: string;
  headerBg: string;
  headerTextColor: string;
  buttonTextColor: string;
  defaultFont: FontFamily;
};

export const BROADCAST_TEMPLATES: BroadcastTemplate[] = [
  {
    id: "clean-white",
    name: "Clean White",
    description: "Crisp and minimal — works for any message.",
    bg: "#f1f5f9",
    cardBg: "#ffffff",
    accent: "#3b82f6",
    textColor: "#1e293b",
    mutedColor: "#94a3b8",
    headerBg: "#3b82f6",
    headerTextColor: "#ffffff",
    buttonTextColor: "#ffffff",
    defaultFont: "sans",
  },
  {
    id: "bold-dark",
    name: "Bold Dark",
    description: "Dramatic and modern — great for announcements.",
    bg: "#0f172a",
    cardBg: "#1e293b",
    accent: "#6366f1",
    textColor: "#e2e8f0",
    mutedColor: "#64748b",
    headerBg: "#6366f1",
    headerTextColor: "#ffffff",
    buttonTextColor: "#ffffff",
    defaultFont: "sans",
  },
  {
    id: "warm-faith",
    name: "Warm Faith",
    description: "Inviting and warm — perfect for church communities.",
    bg: "#fdf6ee",
    cardBg: "#fffaf4",
    accent: "#d97706",
    textColor: "#292524",
    mutedColor: "#a8a29e",
    headerBg: "#92400e",
    headerTextColor: "#fef3c7",
    buttonTextColor: "#ffffff",
    defaultFont: "georgia",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Elegant and regal — ideal for events and fundraisers.",
    bg: "#faf5ff",
    cardBg: "#ffffff",
    accent: "#7c3aed",
    textColor: "#1e1b4b",
    mutedColor: "#a78bfa",
    headerBg: "#4c1d95",
    headerTextColor: "#ede9fe",
    buttonTextColor: "#ffffff",
    defaultFont: "garamond",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Natural and grounded — great for mission and outreach.",
    bg: "#f0fdf4",
    cardBg: "#ffffff",
    accent: "#16a34a",
    textColor: "#14532d",
    mutedColor: "#86efac",
    headerBg: "#166534",
    headerTextColor: "#dcfce7",
    buttonTextColor: "#ffffff",
    defaultFont: "sans",
  },
  {
    id: "sky-blue",
    name: "Sky Blue",
    description: "Light and airy — friendly and approachable.",
    bg: "#e0f2fe",
    cardBg: "#ffffff",
    accent: "#0284c7",
    textColor: "#0c4a6e",
    mutedColor: "#7dd3fc",
    headerBg: "#0369a1",
    headerTextColor: "#e0f2fe",
    buttonTextColor: "#ffffff",
    defaultFont: "trebuchet",
  },
];

export function getTemplate(id: TemplateId): BroadcastTemplate {
  return BROADCAST_TEMPLATES.find((t) => t.id === id) ?? BROADCAST_TEMPLATES[0];
}

// ─── Design overrides ────────────────────────────────────────────────────────

export type LogoPosition = "left" | "center" | "right";
export type LayoutWidth = "narrow" | "standard" | "wide";

export type DesignOverrides = {
  // Colors
  accentColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  bodyBgColor?: string;
  cardBgColor?: string;
  bodyTextColor?: string;
  footerTextColor?: string;

  // Typography
  fontFamily?: FontFamily;
  bodyFontSize?: number;        // px, e.g. 14–20
  bodyFontWeight?: "normal" | "bold";
  bodyLineHeight?: number;      // e.g. 1.4–2.0
  bodyFontStyle?: "normal" | "italic";

  // Logo
  logoUrl?: string;
  logoAltText?: string;
  logoHeight?: number;          // px, e.g. 40–120
  logoPosition?: LogoPosition;
  showLogoInHeader?: boolean;   // show logo in header bar; false = show org name text

  // Header
  headerText?: string;
  headerFontSize?: number;
  showHeader?: boolean;

  // Footer
  footerText?: string;
  showSignature?: boolean;
  signatureName?: string;
  signatureTitle?: string;
  signaturePhone?: string;

  // Layout
  layoutWidth?: LayoutWidth;
  borderRadius?: number;        // card corner radius px, 0–24
  showDivider?: boolean;
};

// ─── HTML builder ─────────────────────────────────────────────────────────────

export type BuildBroadcastHtmlOptions = {
  template: BroadcastTemplate;
  orgName: string;
  subject: string;
  previewText?: string;
  body: string;
  unsubscribeUrl: string;
  design?: DesignOverrides;
};

const WIDTH_MAP: Record<LayoutWidth, number> = {
  narrow: 480,
  standard: 600,
  wide: 680,
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bodyToHtml(
  text: string,
  textColor: string,
  fontStack: string,
  fontSize: number,
  fontWeight: string,
  lineHeight: number,
  fontStyle: string,
): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return paragraphs
    .map((para) => {
      const lines = para
        .split(/\n/)
        .map((line) => escHtml(line.trim()))
        .join("<br>");
      return `<p style="margin:0 0 18px 0;color:${textColor};font-family:${fontStack};font-size:${fontSize}px;font-weight:${fontWeight};line-height:${lineHeight};font-style:${fontStyle};">${lines}</p>`;
    })
    .join("\n");
}

export function buildBroadcastHtml(opts: BuildBroadcastHtmlOptions): string {
  const t = opts.template;
  const d = opts.design ?? {};

  // Resolved values: design overrides → template defaults
  const accent        = d.accentColor        ?? t.accent;
  const headerBg      = d.headerBgColor      ?? t.headerBg;
  const headerTxtClr  = d.headerTextColor    ?? t.headerTextColor;
  const outerBg       = d.bodyBgColor        ?? t.bg;
  const cardBg        = d.cardBgColor        ?? t.cardBg;
  const bodyTxtClr    = d.bodyTextColor      ?? t.textColor;
  const footerTxtClr  = d.footerTextColor    ?? t.mutedColor;
  const fontFamily    = d.fontFamily         ?? t.defaultFont;
  const fontStack     = getFontStack(fontFamily);
  const fontSize      = d.bodyFontSize       ?? 16;
  const fontWeight    = d.bodyFontWeight     ?? "normal";
  const lineHeight    = d.bodyLineHeight     ?? 1.7;
  const fontStyle     = d.bodyFontStyle      ?? "normal";
  const logoUrl       = d.logoUrl            ?? "";
  const logoAlt       = d.logoAltText        ?? opts.orgName;
  const logoHeight    = d.logoHeight         ?? 60;
  const logoPos       = d.logoPosition       ?? "center";
  const showLogoInHdr = d.showLogoInHeader   ?? false;
  const headerText    = d.headerText         ?? opts.orgName;
  const headerFontSz  = d.headerFontSize     ?? 22;
  const showHeader    = d.showHeader         ?? true;
  const footerText    = d.footerText         ?? `${escHtml(opts.orgName)} · Sent with Exchange`;
  const showSignature = d.showSignature      ?? false;
  const sigName       = d.signatureName      ?? "";
  const sigTitle      = d.signatureTitle     ?? "";
  const sigPhone      = d.signaturePhone     ?? "";
  const width         = WIDTH_MAP[d.layoutWidth ?? "standard"];
  const radius        = d.borderRadius       ?? 12;
  const showDivider   = d.showDivider        ?? true;

  const logoAlignMap: Record<LogoPosition, string> = { left: "left", center: "center", right: "right" };
  const logoAlign = logoAlignMap[logoPos];

  const previewSnippet = opts.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escHtml(opts.previewText)}&nbsp;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;</div>`
    : "";

  const bodyHtml = bodyToHtml(opts.body, bodyTxtClr, fontStack, fontSize, fontWeight, lineHeight, fontStyle);

  // ── Header section ──
  const headerSection = showHeader ? `
          <!-- Header -->
          <tr>
            <td style="background-color:${headerBg};padding:24px 40px;text-align:center;">
              ${logoUrl && showLogoInHdr ? `
              <img src="${logoUrl}" alt="${escHtml(logoAlt)}" height="${logoHeight}" style="display:block;margin:0 auto;max-height:${logoHeight}px;border:0;">
              ` : `
              <p style="margin:0;font-family:${fontStack};font-size:${headerFontSz}px;font-weight:700;color:${headerTxtClr};letter-spacing:-0.3px;">${escHtml(headerText)}</p>
              `}
            </td>
          </tr>` : "";

  // ── Logo above body (when not in header) ──
  const logoAboveBody = logoUrl && !showLogoInHdr ? `
          <!-- Logo -->
          <tr>
            <td style="background-color:${cardBg};padding:28px 40px 0 40px;text-align:${logoAlign};">
              <img src="${logoUrl}" alt="${escHtml(logoAlt)}" height="${logoHeight}" style="display:inline-block;max-height:${logoHeight}px;border:0;">
            </td>
          </tr>` : "";

  // ── Signature block ──
  const signatureBlock = showSignature && (sigName || sigTitle || sigPhone) ? `
<p style="margin:24px 0 0 0;font-family:${fontStack};font-size:${fontSize}px;color:${bodyTxtClr};line-height:1.5;">
  ${sigName ? `<strong>${escHtml(sigName)}</strong><br>` : ""}
  ${sigTitle ? `<span style="color:${footerTxtClr};">${escHtml(sigTitle)}</span><br>` : ""}
  ${sigPhone ? `<span style="color:${footerTxtClr};">${escHtml(sigPhone)}</span>` : ""}
</p>` : "";

  // ── Divider ──
  const dividerSection = showDivider ? `
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid ${footerTxtClr}33;margin:0;">
            </td>
          </tr>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escHtml(opts.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${outerBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${previewSnippet}

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${outerBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${width}" style="max-width:${width}px;width:100%;background-color:${cardBg};border-radius:${radius}px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.09);">
          ${headerSection}
          ${logoAboveBody}

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 24px 40px;background-color:${cardBg};">
              ${bodyHtml}
              ${signatureBlock}
            </td>
          </tr>

          ${dividerSection}

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px 40px;text-align:center;background-color:${cardBg};">
              <p style="margin:0 0 6px 0;font-family:${fontStack};font-size:12px;color:${footerTxtClr};">${footerText}</p>
              <p style="margin:0;font-family:${fontStack};font-size:11px;color:${footerTxtClr};">
                You received this email because you subscribed.&nbsp;
                <a href="${opts.unsubscribeUrl}" style="color:${accent};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
