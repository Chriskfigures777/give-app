interface BrandMarkProps {
  className?: string;
  id?: string;
  fullLogo?: boolean;
  iconOnly?: boolean;
  variant?: "light" | "dark" | "dashboard" | "feed";
}

function getTextClasses(variant: BrandMarkProps["variant"]) {
  switch (variant) {
    case "dark":
      return "text-white";
    case "dashboard":
      return "text-dashboard-text";
    case "feed":
      return "text-[color:var(--feed-text)]";
    default:
      return "text-slate-900";
  }
}

function getMarkColor(variant: BrandMarkProps["variant"]) {
  switch (variant) {
    case "dark":
      return "#34d399";
    default:
      return "#10b981";
  }
}

/**
 * Mountain Curve — Three Dots (8h-8 Asymmetric)
 * Middle dot at peak, left peak tall, right peak low.
 */
function MountainCurveMark({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 16 Q12 -4 24 4 Q36 12 45 16" stroke={color} strokeWidth="2.5" strokeLinecap="butt" fill="none" />
      <circle cx="6" cy="16" r="5.5" fill={color} />
      <circle cx="24" cy="4" r="5.5" fill={color} />
      <circle cx="42" cy="16" r="5.5" fill={color} />
    </svg>
  );
}

export function BrandMark({ className = "", id = "brand", fullLogo = false, iconOnly = false, variant = "light" }: BrandMarkProps) {
  const textClass = getTextClasses(variant);
  const markColor = getMarkColor(variant);

  if (iconOnly) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${className}`} aria-label="The Exchange">
        <MountainCurveMark color={markColor} className={`shrink-0 ${className || "h-8 w-8"}`} />
      </span>
    );
  }

  if (fullLogo) {
    return (
      <span
        className={`inline-flex items-center gap-2.5 ${className}`}
        aria-label="The Exchange"
      >
        <MountainCurveMark color={markColor} className="h-8 w-8 shrink-0" />
        <span className={`text-xl font-extrabold tracking-tight ${textClass}`} style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>
          Exchange
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 brand-mark-compact ${className}`}
      aria-label="The Exchange"
    >
      <MountainCurveMark color={markColor} className="h-7 w-7 shrink-0" />
      <span className={`text-base font-extrabold tracking-tight brand-mark-exchange ${textClass}`} style={{ fontFamily: "var(--font-barlow), Barlow, sans-serif" }}>
        Exchange
      </span>
    </span>
  );
}
