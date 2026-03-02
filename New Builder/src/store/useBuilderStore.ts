import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  BuilderMode,
  BuilderBlock,
  BuilderPage,
  SiteTheme,
  ThemeColors,
  ThemeTypography,
} from '../types';
import { PAGE_TEMPLATES } from '../data/templates';

const defaultColors: ThemeColors = {
  primary: '#2563eb',
  secondary: '#1e40af',
  accent: '#f59e0b',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
};

const defaultTypography: ThemeTypography = {
  headingFont: 'Fraunces, Georgia, serif',
  bodyFont: 'DM Sans, system-ui, sans-serif',
  baseSize: 16,
};

const presetThemes: SiteTheme[] = [
  {
    id: 'institutional',
    name: 'Institutional',
    colors: {
      ...defaultColors,
      primary: '#1e3a5f',
      secondary: '#2c5282',
      accent: '#c9a227',
    },
    typography: defaultTypography,
  },
  {
    id: 'church',
    name: 'Church',
    colors: {
      ...defaultColors,
      primary: '#7c3aed',
      secondary: '#5b21b6',
      accent: '#fbbf24',
    },
    typography: defaultTypography,
  },
  {
    id: 'nonprofit',
    name: 'Nonprofit',
    colors: {
      ...defaultColors,
      primary: '#059669',
      secondary: '#047857',
      accent: '#f97316',
    },
    typography: defaultTypography,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    colors: {
      ...defaultColors,
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#6366f1',
    },
    typography: defaultTypography,
  },
  // Faith / Sacred — deep purple & gold, reverent (churches, worship)
  {
    id: 'faith',
    name: 'Faith',
    colors: {
      ...defaultColors,
      primary: '#4c1d95',
      secondary: '#5b21b6',
      accent: '#d4af37',
      background: '#fefce8',
      surface: '#fef9c3',
      text: '#1e1b4b',
      textMuted: '#5b5b7a',
    },
    typography: {
      headingFont: 'Playfair Display, Georgia, serif',
      bodyFont: 'Lato, system-ui, sans-serif',
      baseSize: 16,
    },
  },
  // Give — green, modern donations (like the example site)
  {
    id: 'give',
    name: 'Give',
    colors: {
      ...defaultColors,
      primary: '#16a34a',
      secondary: '#15803d',
      accent: '#22c55e',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#0f172a',
      textMuted: '#64748b',
    },
    typography: defaultTypography,
  },
  // Community — warm coral & gray (community orgs, outreach)
  {
    id: 'community',
    name: 'Community',
    colors: {
      ...defaultColors,
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#f97316',
      background: '#fff7ed',
      surface: '#ffedd5',
      text: '#292524',
      textMuted: '#78716c',
    },
    typography: {
      headingFont: 'Lato, system-ui, sans-serif',
      bodyFont: 'DM Sans, system-ui, sans-serif',
      baseSize: 16,
    },
  },
  // Education — navy & light blue (schools, universities)
  {
    id: 'education',
    name: 'Education',
    colors: {
      ...defaultColors,
      primary: '#1e3a8a',
      secondary: '#1d4ed8',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#eff6ff',
      text: '#0f172a',
      textMuted: '#475569',
    },
    typography: {
      headingFont: 'Source Serif 4, Georgia, serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      baseSize: 16,
    },
  },
  // Foundation — navy & gold (trust, endowments)
  {
    id: 'foundation',
    name: 'Foundation',
    colors: {
      ...defaultColors,
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#b45309',
      background: '#fafaf9',
      surface: '#f5f5f4',
      text: '#1c1917',
      textMuted: '#57534e',
    },
    typography: {
      headingFont: 'Playfair Display, Georgia, serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      baseSize: 16,
    },
  },
  // Warm — earth tones (food banks, shelters, outreach)
  {
    id: 'warm',
    name: 'Warm',
    colors: {
      ...defaultColors,
      primary: '#92400e',
      secondary: '#b45309',
      accent: '#d97706',
      background: '#fffbeb',
      surface: '#fef3c7',
      text: '#292524',
      textMuted: '#78716c',
    },
    typography: defaultTypography,
  },
  // Ocean — soft blue & teal (wellness, calm, environmental)
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      ...defaultColors,
      primary: '#0d9488',
      secondary: '#0f766e',
      accent: '#2dd4bf',
      background: '#f0fdfa',
      surface: '#ccfbf1',
      text: '#134e4a',
      textMuted: '#0f766e',
    },
    typography: defaultTypography,
  },
  // Hope — coral & soft purple (healing, hope, support)
  {
    id: 'hope',
    name: 'Hope',
    colors: {
      ...defaultColors,
      primary: '#be185d',
      secondary: '#9d174d',
      accent: '#a855f7',
      background: '#fdf2f8',
      surface: '#fce7f3',
      text: '#431407',
      textMuted: '#9a3412',
    },
    typography: defaultTypography,
  },
  // Professional — slate & blue (corporate nonprofit, clean)
  {
    id: 'professional',
    name: 'Professional',
    colors: {
      ...defaultColors,
      primary: '#334155',
      secondary: '#475569',
      accent: '#2563eb',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
    },
    typography: {
      headingFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      baseSize: 16,
    },
  },
  // Heritage — burgundy & cream (traditional, established)
  {
    id: 'heritage',
    name: 'Heritage',
    colors: {
      ...defaultColors,
      primary: '#7f1d1d',
      secondary: '#991b1b',
      accent: '#b45309',
      background: '#fefce8',
      surface: '#fef9c3',
      text: '#1c1917',
      textMuted: '#57534e',
    },
    typography: {
      headingFont: 'Playfair Display, Georgia, serif',
      bodyFont: 'Source Serif 4, Georgia, serif',
      baseSize: 16,
    },
  },
  // Serene — soft blue/gray (meditation, peace)
  {
    id: 'serene',
    name: 'Serene',
    colors: {
      ...defaultColors,
      primary: '#475569',
      secondary: '#64748b',
      accent: '#7dd3fc',
      background: '#f8fafc',
      surface: '#f1f5f9',
      text: '#1e293b',
      textMuted: '#64748b',
    },
    typography: defaultTypography,
  },
  // Bold — red/coral (urgency, action, health)
  {
    id: 'bold',
    name: 'Bold',
    colors: {
      ...defaultColors,
      primary: '#b91c1c',
      secondary: '#991b1b',
      accent: '#ea580c',
      background: '#ffffff',
      surface: '#fef2f2',
      text: '#0f172a',
      textMuted: '#64748b',
    },
    typography: {
      headingFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'DM Sans, system-ui, sans-serif',
      baseSize: 16,
    },
  },
  // Sunrise — warm yellow & orange (optimism, youth)
  {
    id: 'sunrise',
    name: 'Sunrise',
    colors: {
      ...defaultColors,
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#facc15',
      background: '#fffbeb',
      surface: '#fef3c7',
      text: '#292524',
      textMuted: '#78716c',
    },
    typography: defaultTypography,
  },
  // Forest — deep green (nature, environment)
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      ...defaultColors,
      primary: '#166534',
      secondary: '#14532d',
      accent: '#22c55e',
      background: '#f0fdf4',
      surface: '#dcfce7',
      text: '#052e16',
      textMuted: '#166534',
    },
    typography: defaultTypography,
  },
  // Royal — deep blue & gold (prestige, legacy)
  {
    id: 'royal',
    name: 'Royal',
    colors: {
      ...defaultColors,
      primary: '#1e3a8a',
      secondary: '#1e40af',
      accent: '#ca8a04',
      background: '#fefce8',
      surface: '#fef9c3',
      text: '#1e1b4b',
      textMuted: '#4338ca',
    },
    typography: {
      headingFont: 'Playfair Display, Georgia, serif',
      bodyFont: 'Lato, system-ui, sans-serif',
      baseSize: 16,
    },
  },
  // Clean — black & white with accent (minimal, editorial)
  {
    id: 'clean',
    name: 'Clean',
    colors: {
      ...defaultColors,
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#0ea5e9',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
    },
    typography: {
      headingFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      baseSize: 16,
    },
  },
  // Compassion — soft rose (care, community)
  {
    id: 'compassion',
    name: 'Compassion',
    colors: {
      ...defaultColors,
      primary: '#be123c',
      secondary: '#9f1239',
      accent: '#fb7185',
      background: '#fff1f2',
      surface: '#ffe4e6',
      text: '#4c0519',
      textMuted: '#9f1239',
    },
    typography: defaultTypography,
  },
  // Trust — corporate blue (reliability, finance)
  {
    id: 'trust',
    name: 'Trust',
    colors: {
      ...defaultColors,
      primary: '#0369a1',
      secondary: '#0c4a6e',
      accent: '#0ea5e9',
      background: '#ffffff',
      surface: '#f0f9ff',
      text: '#0c4a6e',
      textMuted: '#0369a1',
    },
    typography: {
      headingFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      baseSize: 16,
    },
  },
];

function createDefaultPage(id: string, name: string, slug: string, blocks: BuilderBlock[] = []): BuilderPage {
  return { id, name, slug, blocks };
}

interface BuilderState {
  mode: BuilderMode;
  pages: BuilderPage[];
  currentPageId: string | null;
  selectedBlockId: string | null;
  selectedSubElement: string | null;
  theme: SiteTheme;
  themes: SiteTheme[];
  templates: typeof PAGE_TEMPLATES;
  gridColumns: number;

  setMode: (mode: BuilderMode) => void;
  setBlocks: (blocks: BuilderBlock[]) => void;
  addBlock: (block: Omit<BuilderBlock, 'id'>, index?: number) => void;
  updateBlock: (id: string, updates: Partial<Pick<BuilderBlock, 'props' | 'gridSpan'>>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;
  moveBlockToIndex: (id: string, toIndex: number) => void;
  selectBlock: (id: string | null) => void;
  selectSubElement: (element: string | null) => void;
  setTheme: (theme: SiteTheme) => void;
  setThemeColors: (colors: Partial<ThemeColors>) => void;
  setThemeTypography: (typo: Partial<ThemeTypography>) => void;
  setGridColumns: (n: number) => void;
  applyTemplate: (templateId: string) => void;

  setCurrentPage: (pageId: string) => void;
  addPage: (name?: string, slug?: string) => void;
  removePage: (pageId: string) => void;
  updatePage: (pageId: string, updates: Partial<Pick<BuilderPage, 'name' | 'slug'>>) => void;
}

const initialPageId = uuid();

export const useBuilderStore = create<BuilderState>((set) => ({
  mode: 'edit',
  pages: [createDefaultPage(initialPageId, 'Home', 'home', [])],
  currentPageId: initialPageId,
  selectedBlockId: null,
  selectedSubElement: null,
  theme: {
    id: 'custom',
    name: 'Custom',
    colors: defaultColors,
    typography: defaultTypography,
  },
  themes: presetThemes,
  templates: PAGE_TEMPLATES,
  gridColumns: 12,

  setMode: (mode) => set({ mode }),

  applyTemplate: (templateId) =>
    set((state) => {
      const template = PAGE_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return state;
      const theme = state.themes.find((th) => th.id === template.themeId) ?? state.theme;
      let pages: BuilderPage[];
      if (template.pages?.length) {
        pages = template.pages.map((pg) => ({
          id: uuid(),
          name: pg.name,
          slug: pg.slug,
          blocks: (pg.blocks ?? []).map((b) => ({ ...b, id: uuid() })),
        }));
      } else {
        const blocks = (template.blocks ?? []).map((b) => ({ ...b, id: uuid() }));
        pages = [createDefaultPage(uuid(), 'Home', 'home', blocks)];
      }
      return { theme, pages, currentPageId: pages[0]?.id ?? null, selectedBlockId: null };
    }),

  setBlocks: (blocks) =>
    set((state) => {
      if (!state.currentPageId) return state;
      return {
        pages: state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, blocks } : p
        ),
      };
    }),

  addBlock: (block, index) =>
    set((state) => {
      if (!state.currentPageId) return state;
      const newBlock: BuilderBlock = { ...block, id: uuid() };
      const pages = state.pages.map((p) => {
        if (p.id !== state.currentPageId) return p;
        const blocks = [...p.blocks];
        blocks.splice(index ?? blocks.length, 0, newBlock);
        return { ...p, blocks };
      });
      return { pages, selectedBlockId: newBlock.id };
    }),

  updateBlock: (id, updates) =>
    set((state) => {
      if (!state.currentPageId) return state;
      return {
        pages: state.pages.map((p) => {
          if (p.id !== state.currentPageId) return p;
          return {
            ...p,
            blocks: p.blocks.map((b) => {
              if (b.id !== id) return b;
              const { props: propUpdates, gridSpan, ...rest } = updates as Record<string, unknown>;
              const reserved = new Set(['id', 'kind', 'children']);
              const propRest = Object.fromEntries(
                Object.entries(rest).filter(([k]) => !reserved.has(k))
              ) as Partial<BuilderBlock['props']>;
              const newProps = { ...b.props, ...(propUpdates ?? {}), ...propRest };
              const next: BuilderBlock = { ...b, props: newProps };
              if (typeof gridSpan === 'number') next.gridSpan = gridSpan;
              return next;
            }),
          };
        }),
      };
    }),

  removeBlock: (id) =>
    set((state) => {
      if (!state.currentPageId) return state;
      return {
        pages: state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, blocks: p.blocks.filter((b) => b.id !== id) } : p
        ),
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      };
    }),

  moveBlock: (id, direction) =>
    set((state) => {
      if (!state.currentPageId) return state;
      const page = state.pages.find((p) => p.id === state.currentPageId);
      if (!page) return state;
      const i = page.blocks.findIndex((b) => b.id === id);
      if (i === -1) return state;
      const j = direction === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= page.blocks.length) return state;
      const blocks = [...page.blocks];
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return {
        pages: state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, blocks } : p
        ),
      };
    }),

  moveBlockToIndex: (id, toIndex) =>
    set((state) => {
      if (!state.currentPageId) return state;
      const page = state.pages.find((p) => p.id === state.currentPageId);
      if (!page) return state;
      const fromIndex = page.blocks.findIndex((b) => b.id === id);
      if (fromIndex === -1) return state;
      const clamped = Math.max(0, Math.min(toIndex, page.blocks.length));
      if (fromIndex === clamped) return state;
      const blocks = page.blocks.filter((_, i) => i !== fromIndex);
      const insertIndex = clamped > fromIndex ? clamped - 1 : clamped;
      blocks.splice(insertIndex, 0, page.blocks[fromIndex]);
      return {
        pages: state.pages.map((p) =>
          p.id === state.currentPageId ? { ...p, blocks } : p
        ),
      };
    }),

  selectBlock: (id) => set((state) => ({
    selectedBlockId: id,
    selectedSubElement: id !== state.selectedBlockId ? null : state.selectedSubElement,
  })),

  selectSubElement: (element) => set({ selectedSubElement: element }),

  setTheme: (theme) => set({ theme }),

  setThemeColors: (colors) =>
    set((state) => ({
      theme: { ...state.theme, colors: { ...state.theme.colors, ...colors } },
    })),

  setThemeTypography: (typo) =>
    set((state) => ({
      theme: { ...state.theme, typography: { ...state.theme.typography, ...typo } },
    })),

  setGridColumns: (gridColumns) => set({ gridColumns }),

  setCurrentPage: (pageId) => set({ currentPageId: pageId, selectedBlockId: null, selectedSubElement: null }),

  addPage: (name = 'New Page', slug) => {
    const id = uuid();
    const safeSlug = (slug ?? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) || 'page';
    set((state) => ({
      pages: [...state.pages, createDefaultPage(id, name, safeSlug, [])],
      currentPageId: id,
      selectedBlockId: null,
    }));
  },

  removePage: (pageId) =>
    set((state) => {
      const next = state.pages.filter((p) => p.id !== pageId);
      return {
        pages: next,
        currentPageId: state.currentPageId === pageId ? next[0]?.id ?? null : state.currentPageId,
        selectedBlockId: null,
      };
    }),

  updatePage: (pageId, updates) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
    })),
}));
