/**
 * Stock media for donation form cards: images and video.
 * Use Unsplash/Pexels direct URLs. Video uses HTML5 <video> (no extra framework).
 *
 * Stock video: Pexels license allows free use (attribution optional).
 * Link: https://www.pexels.com/videos/
 */

export type MediaType = "image" | "video";

/** One design set (card): media + title + subtitle */
export type DesignSet = {
  media_type: MediaType;
  media_url: string | null;
  title: string | null;
  subtitle: string | null;
};

/** Default header image (existing). Unsplash – community/giving themed. */
export const DEFAULT_HEADER_IMAGE_URL =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80";

/**
 * Stock video – direct MP4 URL for use in <video src="...">.
 * Free to use. Get more: https://www.pexels.com/videos/
 */
export const DEFAULT_STOCK_VIDEO_URL =
  "https://www.w3.org/2010/05/video/movie_300.mp4";

/** Link to Pexels video search for more stock videos */
export const PEXELS_VIDEO_SEARCH_URL = "https://www.pexels.com/search/videos/";

/** Stock image presets (Unsplash/Pexels direct image URLs) for quick picker */
export const STOCK_IMAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "None / custom URL" },
  {
    value: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
    label: "Community / giving (default)",
  },
  {
    value: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80",
    label: "Hands / helping",
  },
  {
    value: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80",
    label: "Donation / charity",
  },
  {
    value: "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&w=800",
    label: "People together (Pexels)",
  },
  {
    value: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    label: "Church / community",
  },
];

/** Stock video presets: direct MP4 URLs + label (for dropdown). Add your own from Pexels/Pixabay. */
export const STOCK_VIDEO_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "None / custom URL" },
  { value: "https://www.w3.org/2010/05/video/movie_300.mp4", label: "Sample (W3C)" },
  {
    value: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    label: "Sample (Google)",
  },
];

export const MAX_DESIGN_SETS = 3;
