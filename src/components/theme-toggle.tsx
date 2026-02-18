"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useDashboardTheme } from "./dashboard-theme-provider";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "default";
};

/** Dashboard-only: toggle between light (default) and dark mode. */
export function DashboardThemeToggle({ className, size }: Props) {
  const { theme, toggleTheme } = useDashboardTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      className={cn(
        "rounded-lg p-2 transition-colors",
        "text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card-hover/50",
        size === "sm" && "p-1.5",
        className
      )}
    >
      {mounted ? (
        isDark ? (
          <Sun className={iconSize} aria-hidden />
        ) : (
          <Moon className={iconSize} aria-hidden />
        )
      ) : (
        <Sun className={iconSize} aria-hidden />
      )}
    </button>
  );
}
