"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "give-dashboard-theme";

export const DASHBOARD_THEMES = [
  { id: "light", label: "Light", dark: false },
  { id: "dark", label: "Dark", dark: true },
  { id: "purple", label: "Purple", dark: true },
  { id: "green", label: "Green", dark: false },
  { id: "dark-gray", label: "Dark Gray", dark: true },
  { id: "blue", label: "Blue", dark: true },
] as const;

export type DashboardThemeId = (typeof DASHBOARD_THEMES)[number]["id"];

const DARK_THEME_IDS = new Set<string>(
  DASHBOARD_THEMES.filter((t) => t.dark).map((t) => t.id)
);

type DashboardThemeContextValue = {
  theme: DashboardThemeId;
  setTheme: (theme: DashboardThemeId) => void;
  toggleTheme: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

/**
 * Dashboard-only theme. Light is default. Applies theme via data-dashboard-theme and dark class.
 * Supports: light, dark, purple, green, dark-gray, blue.
 */
export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<DashboardThemeId>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as DashboardThemeId | null;
      const valid = DASHBOARD_THEMES.some((t) => t.id === stored);
      if (stored && valid) {
        setThemeState(stored);
      }
    } catch {
      // ignore
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    const root = document.documentElement;
    root.setAttribute("data-dashboard-theme", theme);
    if (DARK_THEME_IDS.has(theme)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    return () => {
      root.removeAttribute("data-dashboard-theme");
      root.classList.remove("dark");
    };
  }, [mounted, theme]);

  const setTheme = (t: DashboardThemeId) => setThemeState(t);
  const toggleTheme = () =>
    setThemeState((t) => (t === "light" ? "dark" : t === "dark" ? "light" : t === "green" ? "dark" : "light"));

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

const DEFAULT_THEME_CTX: DashboardThemeContextValue = {
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
};

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    if (typeof window === "undefined") {
      return DEFAULT_THEME_CTX;
    }
    throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  }
  return ctx;
}
