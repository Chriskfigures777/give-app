interface BrandMarkProps {
  className?: string;
  id?: string;
}

export function BrandMark({ className = "", id = "brand" }: BrandMarkProps) {
  const gradId = `bm-g-${id}`;
  const shineId = `bm-s-${id}`;

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="0"
          x2="36"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#10b981" />
          <stop offset="0.5" stopColor="#059669" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient
          id={shineId}
          x1="18"
          y1="36"
          x2="18"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      {/* Gradient background */}
      <rect width="36" height="36" rx="10" fill={`url(#${gradId})`} />
      {/* Glass shine overlay */}
      <rect width="36" height="36" rx="10" fill={`url(#${shineId})`} />
      {/* Left wing - sweeping upward from center base */}
      <path
        d="M18 27 C14 24 10 20 9 16 C8 12 9 10 12 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right wing - mirror of left */}
      <path
        d="M18 27 C22 24 26 20 27 16 C28 12 27 10 24 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Spark - aspiration point between wing tips */}
      <circle cx="18" cy="8" r="1.5" fill="white" />
    </svg>
  );
}
