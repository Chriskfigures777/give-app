"use client";

import { type ReactNode, useState } from "react";
import { Expand } from "lucide-react";

type Props = {
  label: string;
  icon?: ReactNode;
  thumbnail: ReactNode;
  previewHover?: ReactNode;
  selected: boolean;
  onClick: () => void;
  onFullPreview?: () => void;
};

/**
 * Reusable card box for form/embed style selection.
 * Uses a 4:3 aspect ratio for proper screenshot-friendly proportions.
 * Shows thumbnail normally; on hover shows overlay with expand option.
 */
export function FormTemplateBox({
  label,
  icon,
  thumbnail,
  previewHover,
  selected,
  onClick,
  onFullPreview,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative w-full rounded-2xl border-2 overflow-hidden transition-all duration-300 ease-out text-left cursor-pointer ${
        selected
          ? "border-emerald-500 bg-emerald-50/30 shadow-lg shadow-emerald-500/10 dark:bg-emerald-500/5 dark:shadow-emerald-500/5"
          : "border-transparent bg-white dark:bg-slate-800/60 hover:shadow-xl hover:shadow-black/[0.04] hover:border-slate-200 dark:hover:border-slate-600"
      }`}
      style={{
        boxShadow: selected
          ? undefined
          : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      {/* Thumbnail area — 4:3 ratio for proper card proportions */}
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-700/30 relative">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {thumbnail}
        </div>

        {/* Hover preview overlay */}
        {previewHover && hovered && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 flex items-center justify-center p-3 transition-opacity duration-200">
            <div className="flex items-center justify-center w-full h-full origin-center scale-[0.65]">
              {previewHover}
            </div>
          </div>
        )}

        {/* Expand button on hover */}
        {onFullPreview && hovered && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFullPreview();
            }}
            className="absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition-all duration-200 shadow-lg"
            title="Full preview"
          >
            <Expand className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Selected checkmark */}
        {selected && (
          <div className="absolute top-2.5 left-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Label footer */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-700/50">
        {icon && (
          <span className={`shrink-0 transition-colors ${selected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
            {icon}
          </span>
        )}
        <span className={`text-sm font-semibold truncate ${selected ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>
          {label}
        </span>
      </div>
    </div>
  );
}
