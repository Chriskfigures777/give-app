"use client";

import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Palette, Check } from "lucide-react";
import { useDashboardTheme, DASHBOARD_THEMES } from "./dashboard-theme-provider";
import { cn } from "@/lib/utils";

const THEME_SWATCHES: Record<string, string> = {
  light: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  dark: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  purple: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
  green: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "dark-gray": "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
  blue: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
};

type Props = {
  className?: string;
  size?: "sm" | "default";
  /** "top" = dropdown below button (for nav bar), "bottom" = dropdown above button (for sidebar) */
  placement?: "top" | "bottom";
};

/** Dashboard theme picker — choose from light, dark, purple, green, dark-gray, blue. */
export function DashboardThemePicker({ className, size, placement = "bottom" }: Props) {
  const { theme, setTheme } = useDashboardTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 280;
    const gap = 8;
    if (placement === "bottom") {
      setPosition({
        top: rect.top - dropdownHeight - gap,
        left: rect.left,
      });
    } else {
      setPosition({
        top: rect.bottom + gap,
        left: rect.left,
      });
    }
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      const dropdown = document.getElementById("dashboard-theme-dropdown");
      if (dropdown?.contains(target)) return;
      setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("click", onOutside), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onOutside);
    };
  }, [open]);

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "h-9 w-9 p-1.5" : "h-10 w-10 p-2";

  const dropdownContent = mounted && open && position && (
    <div
      id="dashboard-theme-dropdown"
      role="listbox"
      aria-label="Theme options"
      className="fixed z-[9999] min-w-[180px] rounded-xl border border-dashboard-border bg-dashboard-card py-2 shadow-xl"
      style={{
        top: position.top,
        left: position.left,
        boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
        Theme
      </p>
      {DASHBOARD_THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="option"
          aria-selected={theme === t.id}
          onClick={() => {
            setTheme(t.id);
            setOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors",
            "hover:bg-dashboard-card-hover/80",
            theme === t.id && "bg-dashboard-card-hover/50 text-dashboard-text"
          )}
        >
          <span
            className="h-6 w-6 shrink-0 rounded-lg border-2 border-dashboard-border"
            style={{ background: THEME_SWATCHES[t.id] ?? "#e2e8f0" }}
          />
          <span className="flex-1 text-dashboard-text">{t.label}</span>
          {theme === t.id && (
            <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Choose dashboard theme"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "rounded-xl transition-all duration-200 inline-flex items-center justify-center",
          "text-dashboard-text-muted hover:text-dashboard-text hover:bg-dashboard-card-hover/50",
          btnSize,
          open && "bg-dashboard-card-hover/70 text-dashboard-text",
          className
        )}
      >
        <Palette className={iconSize} aria-hidden />
      </button>

      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
    </div>
  );
}
