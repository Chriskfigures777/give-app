"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "give-dashboard-theme";

export type DashboardTheme = "dark" | "light";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

/**
 * Dashboard-only theme. Light is default. Applies dark/light to html only when mounted (i.e. on dashboard).
 * Non-dashboard pages stay light.
 */
export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as DashboardTheme | null;
      if (stored === "dark" || stored === "light") {
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
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [mounted, theme]);

  const setTheme = (theme: DashboardTheme) => setThemeState(theme);
  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  return ctx;
}
