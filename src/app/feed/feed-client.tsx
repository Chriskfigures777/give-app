"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import {
  Type,
  ImageIcon,
  Video,
  Link2,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useMe } from "@/lib/use-me";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import { FeedRightPanel } from "@/components/feed/feed-right-panel";
import { FeedLeftSidebar } from "@/components/feed/feed-left-sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { FeedItemResponse } from "@/app/api/feed/route";

type PostType = "text" | "photo" | "video" | "link";

/* ── Premium shimmer skeleton ── */
function FeedSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-slate-200/40 bg-white/90 shadow-sm backdrop-blur-xl"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3.5">
              <div className="feed-shimmer h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2.5">
                <div className="feed-shimmer h-4 w-2/5 rounded-full" />
                <div className="feed-shimmer h-3 w-1/4 rounded-full" />
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              <div className="feed-shimmer h-3.5 w-full rounded-full" />
              <div className="feed-shimmer h-3.5 w-4/5 rounded-full" />
              <div className="feed-shimmer h-3.5 w-3/5 rounded-full" />
            </div>
            {i % 2 === 0 && (
              <div className="mt-4 feed-shimmer h-48 w-full rounded-xl" />
            )}
          </div>
          <div className="border-t border-slate-100/60 px-5 py-3">
            <div className="flex gap-8">
              <div className="feed-shimmer h-4 w-16 rounded-full" />
              <div className="feed-shimmer h-4 w-20 rounded-full" />
              <div className="feed-shimmer h-4 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const POST_TYPES: {
  id: PostType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "text", label: "Text", icon: Type },
  { id: "photo", label: "Photo", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "link", label: "Link", icon: Link2 },
];

export function FeedClient() {
  const [items, setItems] = useState<FeedItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<PostType>("text");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkThumbnailUrl, setLinkThumbnailUrl] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const { me } = useMe();
  const orgId = me?.orgId ?? null;
  const [newItemsBanner, setNewItemsBanner] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const limit = 20;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pendingItemsRef = useRef<FeedItemResponse[]>([]);

  const fetchFeed = useCallback(async (append = false) => {
    const off = append ? offsetRef.current : 0;
    if (append) setLoadingMore(true);
    try {
      const res = await fetch(`/api/feed?limit=${limit}&offset=${off}`);
      const data = await res.json();
      if (!res.ok) return;
      const newItems = data.items ?? [];
      setItems((prev) => (append ? [...prev, ...newItems] : newItems));
      setHasMore(data.hasMore ?? false);
      offsetRef.current = off + newItems.length;
      setOffset(offsetRef.current);
    } finally {
      if (append) setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchFeed().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("feed-items")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_items" },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            item_type: string;
            organization_id: string;
            payload: Record<string, unknown>;
            created_at: string;
          };
          if (newRow.item_type === "connection_request") return;
          const p = newRow.payload ?? {};
          const newItem: FeedItemResponse = {
            id: newRow.id,
            item_type: newRow.item_type as FeedItemResponse["item_type"],
            organization_id: newRow.organization_id,
            organization_name:
              (p.organization_name as string) ?? "Organization",
            organization_slug: (p.organization_slug as string) ?? "",
            organization_profile_image_url:
              (p.profile_image_url as string) ?? null,
            organization_logo_url: (p.logo_url as string) ?? null,
            payload: p,
            created_at: newRow.created_at,
          };
          pendingItemsRef.current = [
            newItem,
            ...pendingItemsRef.current,
          ];
          setNewItemsBanner((c) => c + 1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNewItems = () => {
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.id));
      const unique = pendingItemsRef.current.filter(
        (i) => !existing.has(i.id)
      );
      return [...unique, ...prev];
    });
    pendingItemsRef.current = [];
    setNewItemsBanner(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchFeed(true);
      },
      { rootMargin: "200px", threshold: 0 }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchFeed]);

  const resetComposer = () => {
    setPostContent("");
    setPostType("text");
    setMediaUrl(null);
    setMediaFile(null);
    setLinkUrl("");
    setLinkTitle("");
    setLinkDescription("");
    setLinkThumbnailUrl("");
    setComposerOpen(false);
  };

  const handleMediaSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error(
        "Please select an image (JPEG, PNG, WebP, GIF) or video (MP4, WebM)"
      );
      return;
    }
    setMediaFile(file);
    setMediaUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "organizationId",
        orgId ?? "00000000-0000-0000-0000-000000000001"
      );
      const res = await fetch("/api/upload/feed-media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setMediaUrl(data.url);
    } catch {
      toast.error("Failed to upload media");
      setMediaFile(null);
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  };

  const handleCreatePost = async () => {
    const content = postContent.trim();
    if (!content || postSubmitting) return;
    if (postType === "photo" || postType === "video") {
      if (!mediaUrl && !mediaFile) {
        toast.error("Please add a photo or video");
        return;
      }
      if (mediaFile && !mediaUrl) {
        toast.error("Please wait for upload to complete");
        return;
      }
    }
    if (postType === "link" && !linkUrl.trim()) {
      toast.error("Please enter a link URL");
      return;
    }
    setPostSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        content,
        media_type: postType === "text" ? undefined : postType,
      };
      if (orgId) body.organization_id = orgId;
      if (mediaUrl) body.media_url = mediaUrl;
      if (postType === "link") {
        body.link_url = linkUrl.trim();
        if (linkTitle) body.link_title = linkTitle;
        if (linkDescription) body.link_description = linkDescription;
        if (linkThumbnailUrl)
          body.link_thumbnail_url = linkThumbnailUrl;
      }
      const res = await fetch("/api/feed/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "Failed to create post");
      resetComposer();
      toast.success("Post created");
      fetchFeed();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create post"
      );
    } finally {
      setPostSubmitting(false);
    }
  };

  const canPost =
    postContent.trim().length > 0 &&
    !postSubmitting &&
    (postType === "text" ||
      (postType === "link" && linkUrl.trim().length > 0) ||
      (postType === "photo" && !!mediaUrl) ||
      (postType === "video" && !!mediaUrl));

  return (
    <>
      {/* Left sidebar */}
      <FeedLeftSidebar />

      {/* Center feed */}
      <div className="min-w-[min(100%,360px)] flex-1 lg:min-w-[500px] lg:max-w-[680px]">
        {/* Feed header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Community Feed
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay connected with organizations and supporters in your network
          </p>
        </div>

        {/* New items banner */}
        <AnimatePresence>
          {newItemsBanner > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
            >
              <button
                type="button"
                onClick={loadNewItems}
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-cyan-50/90 px-5 py-3.5 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur-xl transition-all duration-200 hover:shadow-md hover:border-emerald-300/60"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                {newItemsBanner} new {newItemsBanner === 1 ? "post" : "posts"} available
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post composer */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/40 bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300">
          <AnimatePresence mode="wait">
            {composerOpen ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 space-y-4"
              >
                {/* Type selector pills */}
                <div className="flex gap-1 rounded-xl bg-slate-50/80 p-1 border border-slate-100/60">
                  {POST_TYPES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPostType(id);
                        setMediaUrl(null);
                        setMediaFile(null);
                        setLinkUrl("");
                        setLinkTitle("");
                        setLinkDescription("");
                        setLinkThumbnailUrl("");
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                        postType === id
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Text area */}
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What would you like to share with your community?"
                  className="w-full rounded-xl border border-slate-200/60 bg-slate-50/40 px-4 py-3.5 text-[15px] leading-relaxed placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 resize-none"
                  rows={4}
                  maxLength={5000}
                  autoFocus
                />

                {/* Photo/Video upload */}
                {(postType === "photo" || postType === "video") && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={
                        postType === "photo"
                          ? "image/jpeg,image/png,image/webp,image/gif"
                          : "video/mp4,video/webm"
                      }
                      onChange={handleMediaSelect}
                      className="hidden"
                    />
                    {mediaUrl ? (
                      <div className="relative overflow-hidden rounded-xl bg-slate-100 aspect-video max-h-64">
                        {postType === "photo" ? (
                          <Image
                            src={mediaUrl}
                            alt="Upload preview"
                            fill
                            className="object-contain"
                            sizes="(max-width: 680px) 100vw, 400px"
                          />
                        ) : (
                          <video
                            src={mediaUrl}
                            controls
                            className="w-full h-full object-contain"
                            preload="metadata"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMediaUrl(null);
                            setMediaFile(null);
                          }}
                          className="absolute top-2 right-2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                          aria-label="Remove media"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={mediaUploading}
                        className="w-full rounded-xl border-2 border-dashed border-slate-200/80 bg-slate-50/40 py-10 text-center text-slate-400 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 hover:text-emerald-500 disabled:opacity-50"
                      >
                        {mediaUploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                            <span className="text-sm font-medium text-slate-600">
                              Uploading...
                            </span>
                          </span>
                        ) : (
                          <span className="flex flex-col items-center gap-2">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                              {postType === "photo" ? (
                                <ImageIcon className="h-6 w-6" />
                              ) : (
                                <Video className="h-6 w-6" />
                              )}
                            </span>
                            <span className="text-sm font-medium">
                              Click to add{" "}
                              {postType === "photo"
                                ? "a photo"
                                : "a video"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {postType === "photo" ? "JPEG, PNG, WebP, GIF" : "MP4, WebM"}
                            </span>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Link inputs */}
                {postType === "link" && (
                  <div className="space-y-2.5">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="w-full rounded-xl border border-slate-200/60 bg-slate-50/40 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Link title (optional)"
                      className="w-full rounded-xl border border-slate-200/60 bg-slate-50/40 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <textarea
                      value={linkDescription}
                      onChange={(e) =>
                        setLinkDescription(e.target.value)
                      }
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full rounded-xl border border-slate-200/60 bg-slate-50/40 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 resize-none"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100/80">
                  <div className="flex items-center gap-2 pt-3">
                    <Button
                      onClick={handleCreatePost}
                      disabled={!canPost}
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-md disabled:opacity-40"
                    >
                      {postSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Posting...
                        </span>
                      ) : (
                        "Publish"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={resetComposer}
                      className="rounded-xl text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                  <span className="ml-auto pt-3 text-xs tabular-nums text-slate-400">
                    {postContent.length.toLocaleString()}/5,000
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                type="button"
                onClick={() => setComposerOpen(true)}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-all duration-200 hover:bg-slate-50/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 ring-2 ring-emerald-500/10 transition-all duration-200 group-hover:ring-emerald-500/20 group-hover:shadow-sm">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="flex-1 text-[15px] text-slate-400 group-hover:text-slate-500 transition-colors">
                  Share something with your community...
                </span>
                <div className="flex gap-2 text-slate-300 group-hover:text-slate-400 transition-colors">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-slate-100">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-slate-100">
                    <Video className="h-4 w-4" />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-slate-100">
                    <Link2 className="h-4 w-4" />
                  </span>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Feed content */}
        {loading ? (
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/40 bg-white/90 p-16 text-center shadow-sm backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <p className="mt-6 text-lg font-bold text-slate-800">
              Your feed is waiting
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
              Connect with organizations and supporters to see activity, updates, and stories here.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl hover:shadow-emerald-500/25"
            >
              Discover organizations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.04, 0.25),
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <FeedItemCard
                  item={item}
                  index={index}
                  onEdit={(id, payload) => {
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === id
                          ? { ...i, payload: { ...i.payload, ...payload } }
                          : i
                      )
                    );
                  }}
                  onDelete={(id) => {
                    setItems((prev) => prev.filter((i) => i.id !== id));
                  }}
                />
              </motion.div>
            ))}
            <div ref={sentinelRef} className="h-4" aria-hidden />
            {loadingMore && (
              <div className="flex justify-center py-10">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/40 bg-white/90 px-6 py-3 shadow-sm backdrop-blur-xl">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span className="text-sm font-medium text-slate-500">
                    Loading more posts...
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right dynamic panel */}
      <FeedRightPanel />
    </>
  );
}
