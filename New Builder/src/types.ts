export type BuilderMode = 'edit' | 'preview' | 'publish';

export type ComponentKind =
  | 'hero'
  | 'header'
  | 'section'
  | 'mediaSection'
  | 'cta'
  | 'events'
  | 'testimonial'
  | 'donate'
  | 'contactForm'
  | 'footer'
  | 'text'
  | 'image'
  | 'columns'
  | 'spacer';

/** A single page in the site (edit or preview) */
export interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  blocks: BuilderBlock[];
}

/** A full template: theme + one or more pages (ids assigned when applied) */
export interface PageTemplate {
  id: string;
  name: string;
  themeId: string;
  /** Multi-page: each entry is a full page. If absent, use legacy `blocks` as single Home page. */
  pages?: { name: string; slug: string; blocks: Omit<BuilderBlock, 'id'>[] }[];
  /** Legacy: single page of blocks (used when `pages` is not provided). */
  blocks?: Omit<BuilderBlock, 'id'>[];
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  baseSize: number;
}

export interface SiteTheme {
  id: string;
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
}

export interface BlockProps {
  [key: string]: string | number | boolean | undefined;
}

export interface BuilderBlock {
  id: string;
  kind: ComponentKind;
  props: BlockProps;
  children?: BuilderBlock[];
  gridSpan?: number; // 1-12 for grid column span
}

export interface ComponentDefinition {
  kind: ComponentKind;
  label: string;
  icon: string;
  defaultProps: BlockProps;
  defaultGridSpan?: number;
}

/** Passed to blocks when rendering in builder (edit mode) for inline editing */
export interface BuilderBlockViewProps {
  isEdit?: boolean;
  onUpdateProp?: (key: string, value: string | number | boolean) => void;
}
