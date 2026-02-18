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

/* ── Modern shimmer skeleton ── */
function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3.5">
              <div className="feed-shimmer h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="feed-shimmer h-4 w-2/5 rounded-lg" />
                <div className="feed-shimmer h-3 w-1/4 rounded-lg" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="feed-shimmer h-3.5 w-full rounded-lg" />
              <div className="feed-shimmer h-3.5 w-4/5 rounded-lg" />
              <div className="feed-shimmer h-3.5 w-2/3 rounded-lg" />
            </div>
          </div>
          <div className="border-t border-slate-100/60 px-5 py-2.5">
            <div className="flex gap-6">
              <div className="feed-shimmer h-4 w-16 rounded-lg" />
              <div className="feed-shimmer h-4 w-20 rounded-lg" />
              <div className="feed-shimmer h-4 w-14 rounded-lg" />
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
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Feed
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Stay connected with your community
            </p>
          </div>
        </div>

        {/* New items banner */}
        <AnimatePresence>
          {newItemsBanner > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
            >
              <button
                type="button"
                onClick={loadNewItems}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:shadow-md hover:from-emerald-100 hover:via-teal-100 hover:to-cyan-100"
              >
                <Sparkles className="h-4 w-4" />
                {newItemsBanner} new {newItemsBanner === 1 ? "post" : "posts"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post composer */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-300 feed-composer-ring">
          <AnimatePresence mode="wait">
            {composerOpen ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5 space-y-4"
              >
                {/* Type selector pills */}
                <div className="flex gap-1.5 rounded-xl bg-slate-50/80 p-1">
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
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
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
                  placeholder="Share something with your community..."
                  className="w-full rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-3 text-[15px] placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 resize-none"
                  rows={3}
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
                        className="w-full rounded-xl border-2 border-dashed border-slate-200/80 bg-slate-50/30 py-10 text-center text-slate-400 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 hover:text-emerald-500 disabled:opacity-50"
                      >
                        {mediaUploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                            <span className="text-sm font-medium text-slate-600">
                              Uploading...
                            </span>
                          </span>
                        ) : (
                          <span className="flex flex-col items-center gap-1.5">
                            {postType === "photo" ? (
                              <ImageIcon className="h-8 w-8" />
                            ) : (
                              <Video className="h-8 w-8" />
                            )}
                            <span className="text-sm font-medium">
                              Click to add{" "}
                              {postType === "photo"
                                ? "a photo"
                                : "a video"}
                            </span>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Link inputs */}
                {postType === "link" && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="w-full rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Link title (optional)"
                      className="w-full rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <textarea
                      value={linkDescription}
                      onChange={(e) =>
                        setLinkDescription(e.target.value)
                      }
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-2.5 text-sm placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 resize-none"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={handleCreatePost}
                    disabled={!canPost}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-md disabled:opacity-50"
                  >
                    {postSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Posting...
                      </span>
                    ) : (
                      "Post"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={resetComposer}
                    className="rounded-xl text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </Button>
                  <span className="ml-auto text-xs text-slate-400">
                    {postContent.length}/5000
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
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="flex-1 text-[15px] text-slate-400">
                  Share something with your community...
                </span>
                <div className="flex gap-1.5 text-slate-300">
                  <Type className="h-4 w-4" />
                  <ImageIcon className="h-4 w-4" />
                  <Video className="h-4 w-4" />
                  <Link2 className="h-4 w-4" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Feed content */}
        {loading ? (
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/60 bg-white/70 p-16 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="mt-6 text-lg font-semibold text-slate-800">
              Your feed is empty
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Connect with organizations to see their activity and updates
              here.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-md"
            >
              Discover organizations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.03, 0.2),
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
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3 rounded-full bg-white/80 px-5 py-2.5 shadow-sm backdrop-blur-xl">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span className="text-sm font-medium text-slate-500">
                    Loading more...
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
