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
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
        <h2
          className="text-2xl font-bold leading-tight mb-1"
          style={{
            fontFamily: fontFamily ?? undefined,
            fontWeight: titleFontWeight,
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {set.title?.trim() || "Make a Donation"}
        </h2>
        {set.subtitle?.trim() ? (
          <p
            className="text-sm opacity-95"
            style={{
              fontFamily: fontFamily ?? undefined,
              textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            {set.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
