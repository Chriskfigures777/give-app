import type { DesignSet } from "@/lib/stock-media";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";

type Props = {
  set: DesignSet;
  /** Fallback when media_url is empty (e.g. single-set legacy) */
  fallbackImageUrl?: string | null;
  /** CSS class for the wrapper (e.g. height) */
  className?: string;
  /** Font family for title/subtitle */
  fontFamily?: string;
  /** Font weight for title (e.g. 700, 900) */
  titleFontWeight?: number;
  /** When true, use huge centered text (for fullscreen embed) */
  fullscreen?: boolean;
};

/**
 * Renders one design set card: image or video background with title/subtitle overlay.
 * Uses native HTML5 video (no extra framework) for video cards.
 */
export function FormCardMedia({
  set,
  fallbackImageUrl,
  className = "",
  fontFamily,
  titleFontWeight = 700,
  fullscreen = false,
}: Props) {
  const mediaUrl = set.media_url?.trim() || null;
  const isVideo = set.media_type === "video" && mediaUrl;
  const imageUrl = !isVideo
    ? (mediaUrl || fallbackImageUrl || DEFAULT_HEADER_IMAGE_URL)
    : null;

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ minHeight: "14rem" }}
    >
      {isVideo ? (
        <video
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      ) : (
        <img
          src={imageUrl!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        className={`absolute inset-0 flex flex-col text-white ${
          fullscreen
            ? "justify-center items-center text-center px-6 md:px-12 lg:px-16"
            : "justify-end p-5"
        }`}
      >
        <h2
          className={
            fullscreen
              ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-2 md:mb-3 max-w-4xl"
              : "text-2xl font-bold leading-tight mb-1"
          }
          style={{
            fontFamily: fontFamily ?? undefined,
            fontWeight: titleFontWeight,
            textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)",
          }}
        >
          {set.title?.trim() || "Make a Donation"}
        </h2>
        {set.subtitle?.trim() ? (
          <p
            className={
              fullscreen
                ? "text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl max-w-3xl"
                : "text-sm"
            }
            style={{
              fontFamily: fontFamily ?? undefined,
              textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)",
            }}
          >
            {set.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
