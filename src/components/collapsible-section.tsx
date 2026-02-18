"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  variant?: "card" | "minimal";
};

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  icon,
  className = "",
  variant = "minimal",
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  );

  useEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      const h = contentRef.current.scrollHeight;
      setContentHeight(h);
      const timer = setTimeout(() => setContentHeight(undefined), 300);
      return () => clearTimeout(timer);
    } else {
      const h = contentRef.current.scrollHeight;
      setContentHeight(h);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setContentHeight(0);
        });
      });
    }
  }, [isOpen]);

  const wrapperClass =
    variant === "card"
      ? "rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden"
      : "";

  return (
    <div className={`${wrapperClass} ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex w-full items-center gap-2.5 p-4 text-left transition-all duration-200 ${
          variant === "card"
            ? "hover:bg-dashboard-card-hover/50"
            : "rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm hover:bg-dashboard-card-hover/50 hover:shadow-md"
        }`}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
        </span>
        {icon && <span className="shrink-0">{icon}</span>}
        <h2 className="text-sm font-semibold text-dashboard-text">{title}</h2>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: contentHeight !== undefined ? `${contentHeight}px` : "none",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className={variant === "minimal" ? "mt-2" : "border-t border-dashboard-border"}>
          {children}
        </div>
      </div>
    </div>
  );
}
