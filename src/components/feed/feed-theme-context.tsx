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
    description: "Dark emerald",
    bg: "#060d1a",
    accent: "#10b981",
    card: "#0d193a",
    text: "#e2faf1",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Deep navy",
    bg: "#0d1117",
    accent: "#58a6ff",
    card: "#151b23",
    text: "#e6edf3",
  },
  {
    id: "cosmic",
    label: "Cosmic",
    description: "Purple void",
    bg: "#0f0a1e",
    accent: "#a78bfa",
    card: "#191030",
    text: "#f3f0ff",
  },
  {
    id: "pearl",
    label: "Pearl",
    description: "Clean light",
    bg: "#f4f5f7",
    accent: "#10b981",
    card: "#ffffff",
    text: "#111111",
  },
  {
    id: "solar",
    label: "Solar",
    description: "Warm amber",
    bg: "#0c0a06",
    accent: "#f59e0b",
    card: "#18140a",
    text: "#fefce8",
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
