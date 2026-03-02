"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Image as ImageIcon, Video } from "lucide-react";

type PhotoResult = { id: number; url: string; src: string; photographer: string };
type VideoResult = { id: number; url: string; src: string; image: string; duration: number; user: string };

type Props = {
  mode: "photos" | "videos" | "both";
  onSelect: (url: string, type: "image" | "video") => void;
  onClose: () => void;
};

const DEBOUNCE_MS = 350;

export function PexelsMediaPicker({ mode, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<"photos" | "videos">(mode === "photos" ? "photos" : mode === "videos" ? "videos" : "photos");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [photos, setPhotos] = useState<PhotoResult[]>([]);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPhotos = useCallback(async (q: string, p: number) => {
    if (!q.trim()) {
      setPhotos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pexels/search/photos?q=${encodeURIComponent(q)}&page=${p}&per_page=20`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to search");
      setPhotos(data.photos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVideos = useCallback(async (q: string, p: number) => {
    if (!q.trim()) {
      setVideos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pexels/search/videos?q=${encodeURIComponent(q)}&page=${p}&per_page=20`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to search");
      setVideos(data.videos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setPhotos([]);
      setVideos([]);
      return;
    }
    setPage(1);
    if (tab === "photos") fetchPhotos(debouncedQuery, 1);
    else fetchVideos(debouncedQuery, 1);
  }, [debouncedQuery, tab, fetchPhotos, fetchVideos]);

  const handleSelectPhoto = (photo: PhotoResult) => {
    if (photo.src) onSelect(photo.src, "image");
  };

  const handleSelectVideo = (video: VideoResult) => {
    if (video.src) onSelect(video.src, "video");
  };

  const showPhotos = (mode === "photos" || mode === "both") && tab === "photos";
  const showVideos = (mode === "videos" || mode === "both") && tab === "videos";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Search Pexels</h2>
            {mode === "both" && (
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setTab("photos")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    tab === "photos" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  Photos
                </button>
                <button
                  type="button"
                  onClick={() => setTab("videos")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    tab === "videos" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Video className="h-4 w-4" />
                  Videos
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "photos" ? "Search photos (e.g. church, community)…" : "Search videos (e.g. worship, charity)…"}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          {!debouncedQuery.trim() && (
            <p className="py-12 text-center text-slate-500">
              Enter a search term to find {tab === "photos" ? "photos" : "videos"} on Pexels.
            </p>
          )}
          {debouncedQuery.trim() && loading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}
          {debouncedQuery.trim() && !loading && showPhotos && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => handleSelectPhoto(photo)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-emerald-300 hover:ring-2 hover:ring-emerald-500/30"
                >
                  <img
                    src={photo.src}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
          {debouncedQuery.trim() && !loading && showVideos && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {videos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => handleSelectVideo(video)}
                  className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-emerald-300 hover:ring-2 hover:ring-emerald-500/30"
                >
                  <img
                    src={video.image}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                    {video.duration}s
                  </span>
                </button>
              ))}
            </div>
          )}
          {debouncedQuery.trim() && !loading && !error && tab === "photos" && photos.length === 0 && (
            <p className="py-12 text-center text-slate-500">No photos found. Try another search.</p>
          )}
          {debouncedQuery.trim() && !loading && !error && tab === "videos" && videos.length === 0 && (
            <p className="py-12 text-center text-slate-500">No videos found. Try another search.</p>
          )}
        </div>

        <div className="border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500">
          <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
            Photos provided by Pexels
          </a>
        </div>
      </div>
    </div>
  );
}
