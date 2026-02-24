"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type FeedTheme = "aurora" | "midnight" | "cosmic" | "pearl" | "solar";

export type FeedThemeDef = {
  id: FeedTheme;
  label: string;
  description: string;
  bg: string;
  accent: string;
  card: string;
  text: string;
};

export const FEED_THEMES: FeedThemeDef[] = [
  {
    id: "aurora",
    label: "Aurora",
    description: "Fresh emerald light",
    bg: "#f0fdf9",
    accent: "#10b981",
    card: "#ffffff",
    text: "#0d2318",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Soft twilight",
    bg: "#1a2d3f",
    accent: "#58a6ff",
    card: "#1e3650",
    text: "#e2eaf3",
  },
  {
    id: "cosmic",
    label: "Cosmic",
    description: "Airy lavender",
    bg: "#faf5ff",
    accent: "#7c3aed",
    card: "#ffffff",
    text: "#1e0a3c",
  },
  {
    id: "pearl",
    label: "Pearl",
    description: "Pure white",
    bg: "#ffffff",
    accent: "#10b981",
    card: "#ffffff",
    text: "#0a0a0a",
  },
  {
    id: "solar",
    label: "Solar",
    description: "Warm cream",
    bg: "#fffbf0",
    accent: "#d97706",
    card: "#ffffff",
    text: "#1c1204",
  },
];

type FeedThemeContextType = {
  theme: FeedTheme;
  setTheme: (t: FeedTheme) => void;
  themeDef: FeedThemeDef;
};

const FeedThemeContext = createContext<FeedThemeContextType>({
  theme: "aurora",
  setTheme: () => {},
  themeDef: FEED_THEMES[0],
});

export function FeedThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<FeedTheme>("aurora");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("feed-theme") as FeedTheme | null;
      if (stored && FEED_THEMES.some((t) => t.id === stored)) {
        setThemeState(stored);
      }
    } catch {}
  }, []);

  const setTheme = (t: FeedTheme) => {
    setThemeState(t);
    try { localStorage.setItem("feed-theme", t); } catch {}
  };

  const themeDef = FEED_THEMES.find((t) => t.id === theme) ?? FEED_THEMES[0];

  if (!mounted) {
    return (
      <div data-feed-theme="aurora" className="ft-bg min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <FeedThemeContext.Provider value={{ theme, setTheme, themeDef }}>
      <div
        data-feed-theme={theme}
        className="ft-bg min-h-screen"
        style={{ transition: "background-color 0.6s cubic-bezier(0.4,0,0.2,1)" }}
      >
        {children}
      </div>
    </FeedThemeContext.Provider>
  );
}

export function useFeedTheme() {
  return useContext(FeedThemeContext);
}
