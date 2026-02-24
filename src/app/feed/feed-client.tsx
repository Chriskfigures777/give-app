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
  Zap,
} from "lucide-react";
import { useMe } from "@/lib/use-me";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import { FeedRightPanel } from "@/components/feed/feed-right-panel";
import { FeedLeftSidebar } from "@/components/feed/feed-left-sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { FeedItemResponse } from "@/app/api/feed/route";
import { useFeedTheme } from "@/components/feed/feed-theme-context";

type PostType = "text" | "photo" | "video" | "link";

/* ── Themed Skeleton ── */
function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-5 border"
          style={{
            background: "var(--feed-card)",
            borderColor: "var(--feed-border)",
            boxShadow: "var(--feed-card-shadow)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="ft-skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="ft-skeleton h-4 w-28 rounded-lg" />
              <div className="ft-skeleton h-3 w-20 rounded-lg" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="ft-skeleton h-3.5 w-full rounded-lg" />
            <div className="ft-skeleton h-3.5 w-4/5 rounded-lg" />
            {i % 2 === 0 && <div className="ft-skeleton h-3.5 w-3/5 rounded-lg" />}
          </div>
          {i % 3 === 0 && (
            <div className="mt-4 ft-skeleton h-44 w-full rounded-xl" />
          )}
          <div className="mt-4 flex gap-6 pt-3" style={{ borderTop: "1px solid var(--feed-border)" }}>
            <div className="ft-skeleton h-4 w-14 rounded-lg" />
            <div className="ft-skeleton h-4 w-18 rounded-lg" />
            <div className="ft-skeleton h-4 w-16 rounded-lg" />
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
  { id: "text",  label: "Text",  icon: Type      },
  { id: "photo", label: "Photo", icon: ImageIcon  },
  { id: "video", label: "Video", icon: Video      },
  { id: "link",  label: "Link",  icon: Link2      },
];

export function FeedClient() {
  const [items,           setItems]           = useState<FeedItemResponse[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [loadingMore,     setLoadingMore]     = useState(false);
  const [hasMore,         setHasMore]         = useState(false);
  const [offset,          setOffset]          = useState(0);
  const [postContent,     setPostContent]     = useState("");
  const [postType,        setPostType]        = useState<PostType>("text");
  const [mediaUrl,        setMediaUrl]        = useState<string | null>(null);
  const [mediaFile,       setMediaFile]       = useState<File | null>(null);
  const [linkUrl,         setLinkUrl]         = useState("");
  const [linkTitle,       setLinkTitle]       = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkThumbnailUrl,setLinkThumbnailUrl]= useState("");
  const [mediaUploading,  setMediaUploading]  = useState(false);
  const [postSubmitting,  setPostSubmitting]  = useState(false);
  const [composerOpen,    setComposerOpen]    = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);

  const { me } = useMe();
  const { theme } = useFeedTheme();
  const orgId = me?.orgId ?? null;

  const [newItemsBanner, setNewItemsBanner] = useState(0);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const limit           = 20;
  const sentinelRef     = useRef<HTMLDivElement>(null);
  const offsetRef       = useRef(0);
  const pendingItemsRef = useRef<FeedItemResponse[]>([]);

  /* ── Data fetching ── */
  const fetchFeed = useCallback(async (append = false) => {
    const off = append ? offsetRef.current : 0;
    if (append) setLoadingMore(true);
    try {
      const res  = await fetch(`/api/feed?limit=${limit}&offset=${off}`);
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

  /* ── Real-time subscription ── */
  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase
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
            organization_name: (p.organization_name as string) ?? "Organization",
            organization_slug: (p.organization_slug as string) ?? "",
            organization_profile_image_url: (p.profile_image_url as string) ?? null,
            organization_logo_url: (p.logo_url as string) ?? null,
            payload: p,
            created_at: newRow.created_at,
          };
          pendingItemsRef.current = [newItem, ...pendingItemsRef.current];
          setNewItemsBanner((c) => c + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadNewItems = () => {
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.id));
      const unique   = pendingItemsRef.current.filter((i) => !existing.has(i.id));
      return [...unique, ...prev];
    });
    pendingItemsRef.current = [];
    setNewItemsBanner(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Infinite scroll sentinel ── */
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) fetchFeed(true); },
      { rootMargin: "200px", threshold: 0 }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchFeed]);

  /* ── Composer helpers ── */
  const resetComposer = () => {
    setPostContent(""); setPostType("text");
    setMediaUrl(null);  setMediaFile(null);
    setLinkUrl("");     setLinkTitle("");
    setLinkDescription(""); setLinkThumbnailUrl("");
    setComposerOpen(false); setComposerFocused(false);
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Please select an image (JPEG, PNG, WebP, GIF) or video (MP4, WebM)");
      return;
    }
    setMediaFile(file);
    setMediaUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", orgId ?? "00000000-0000-0000-0000-000000000001");
      const res  = await fetch("/api/upload/feed-media", { method: "POST", body: formData });
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
    if ((postType === "photo" || postType === "video") && !mediaUrl && !mediaFile) {
      toast.error("Please add a photo or video"); return;
    }
    if ((postType === "photo" || postType === "video") && mediaFile && !mediaUrl) {
      toast.error("Please wait for upload to complete"); return;
    }
    if (postType === "link" && !linkUrl.trim()) {
      toast.error("Please enter a link URL"); return;
    }
    setPostSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        content,
        media_type: postType === "text" ? undefined : postType,
      };
      if (orgId)         body.organization_id      = orgId;
      if (mediaUrl)      body.media_url            = mediaUrl;
      if (postType === "link") {
        body.link_url         = linkUrl.trim();
        if (linkTitle)        body.link_title       = linkTitle;
        if (linkDescription)  body.link_description = linkDescription;
        if (linkThumbnailUrl) body.link_thumbnail_url = linkThumbnailUrl;
      }
      const res  = await fetch("/api/feed/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create post");
      resetComposer();
      toast.success("Post published");
      fetchFeed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setPostSubmitting(false);
    }
  };

  const canPost =
    postContent.trim().length > 0 &&
    !postSubmitting &&
    (postType === "text" ||
     (postType === "link"  && linkUrl.trim().length > 0) ||
     (postType === "photo" && !!mediaUrl) ||
     (postType === "video" && !!mediaUrl));

  /* ── Render ── */
  return (
    <>
      {/* Ambient background orbs — theme-aware */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
        style={{ zIndex: 0 }}
      >
        <div
          className="feed-orb-1 absolute -top-[20%] -left-[5%] h-[600px] w-[600px] rounded-full blur-[120px]"
          style={{ background: "var(--feed-orb-1)" }}
        />
        <div
          className="feed-orb-2 absolute -top-[10%] right-[8%] h-[500px] w-[500px] rounded-full blur-[100px]"
          style={{ background: "var(--feed-orb-2)" }}
        />
        <div
          className="feed-orb-3 absolute bottom-[15%] left-[25%] h-[400px] w-[400px] rounded-full blur-[90px]"
          style={{ background: "var(--feed-orb-3)" }}
        />
      </div>

      {/* Layout: left | center | right */}
      <div
        className="relative z-10 mx-auto flex w-full max-w-[1680px] justify-start gap-8 px-4 py-8 sm:px-6 lg:gap-10 xl:gap-12 xl:px-10"
      >
        {/* Left sidebar */}
        <FeedLeftSidebar />

        {/* Center feed */}
        <div className="min-w-[min(100%,360px)] flex-1 lg:min-w-[500px] lg:max-w-[680px] relative">

          {/* ── Sticky header ── */}
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: "var(--feed-text)" }}
                >
                  Community{" "}
                  <span style={{
                    background: "var(--feed-gradient)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    Feed
                  </span>
                </h1>
                <p className="mt-0.5 text-sm" style={{ color: "var(--feed-text-muted)" }}>
                  Live updates from organizations you follow
                </p>
              </div>
              {/* Live badge */}
              <div className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 ft-badge">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "var(--feed-badge-text)",
                    boxShadow: "0 0 6px var(--feed-badge-text)",
                  }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>

          {/* ── New items floating pill ── */}
          <AnimatePresence>
            {newItemsBanner > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="sticky top-[4.5rem] z-20 flex justify-center mb-4"
              >
                <button
                  type="button"
                  onClick={loadNewItems}
                  className="feed-new-pill flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-2xl backdrop-blur-md"
                  style={{
                    background: "var(--feed-badge-bg)",
                    color: "var(--feed-badge-text)",
                    border: "1px solid var(--feed-border-strong)",
                    boxShadow: "var(--feed-card-shadow-hover), 0 0 0 1px var(--feed-border-strong)",
                  }}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {newItemsBanner} new {newItemsBanner === 1 ? "post" : "posts"} — tap to load
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Post composer ── */}
          <div
            className="mb-5 rounded-2xl overflow-hidden ft-composer-focus transition-all duration-300"
            style={{
              background: "var(--feed-card)",
              border: "1px solid var(--feed-border)",
              boxShadow: composerFocused
                ? "0 0 0 1px var(--feed-border-strong), var(--feed-glow)"
                : "var(--feed-card-shadow)",
            }}
          >
            <AnimatePresence mode="wait">
              {composerOpen ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-5 space-y-4"
                >
                  {/* Type selector */}
                  <div
                    className="flex gap-1 rounded-xl p-1"
                    style={{ background: "var(--feed-input-bg)" }}
                  >
                    {POST_TYPES.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setPostType(id);
                          setMediaUrl(null); setMediaFile(null);
                          setLinkUrl("");    setLinkTitle("");
                          setLinkDescription(""); setLinkThumbnailUrl("");
                        }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold flex-1 justify-center transition-all duration-200"
                        style={
                          postType === id
                            ? {
                                background: "var(--feed-card)",
                                color: "var(--feed-accent)",
                                boxShadow: "var(--feed-card-shadow)",
                              }
                            : { color: "var(--feed-text-dim)" }
                        }
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Text area */}
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    onFocus={() => setComposerFocused(true)}
                    onBlur={() => setComposerFocused(false)}
                    placeholder="Share something with your community…"
                    className="w-full rounded-xl px-4 py-3 text-[15px] leading-relaxed resize-none outline-none transition-all duration-200"
                    style={{
                      background: "var(--feed-input-bg)",
                      border: "1px solid var(--feed-input-border)",
                      color: "var(--feed-text)",
                    }}
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
                        <div className="relative overflow-hidden rounded-xl aspect-video max-h-64" style={{ background: "var(--feed-input-bg)" }}>
                          {postType === "photo" ? (
                            <Image src={mediaUrl} alt="Upload preview" fill className="object-contain" sizes="(max-width: 680px) 100vw, 400px" />
                          ) : (
                            <video src={mediaUrl} controls className="w-full h-full object-contain" preload="metadata" />
                          )}
                          <button
                            type="button"
                            onClick={() => { setMediaUrl(null); setMediaFile(null); }}
                            className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
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
                          className="w-full rounded-xl border-2 border-dashed py-10 text-center transition-all duration-200 disabled:opacity-50"
                          style={{
                            borderColor: "var(--feed-border-strong)",
                            background: "var(--feed-input-bg)",
                          }}
                        >
                          {mediaUploading ? (
                            <span className="flex items-center justify-center gap-2" style={{ color: "var(--feed-text-muted)" }}>
                              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--feed-accent)" }} />
                              <span className="text-sm font-medium">Uploading…</span>
                            </span>
                          ) : (
                            <span className="flex flex-col items-center gap-2">
                              <span
                                className="flex h-12 w-12 items-center justify-center rounded-2xl mx-auto"
                                style={{ background: "var(--feed-badge-bg)" }}
                              >
                                {postType === "photo"
                                  ? <ImageIcon className="h-5 w-5" style={{ color: "var(--feed-accent)" }} />
                                  : <Video     className="h-5 w-5" style={{ color: "var(--feed-accent)" }} />
                                }
                              </span>
                              <span className="text-sm font-medium" style={{ color: "var(--feed-text)" }}>
                                Click to add {postType === "photo" ? "a photo" : "a video"}
                              </span>
                              <span className="text-xs" style={{ color: "var(--feed-text-dim)" }}>
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
                      {[
                        { val: linkUrl,         set: setLinkUrl,         type: "url",  ph: "https://example.com/article" },
                        { val: linkTitle,       set: setLinkTitle,       type: "text", ph: "Link title (optional)" },
                        { val: linkDescription, set: setLinkDescription, type: "text", ph: "Description (optional)" },
                      ].map(({ val, set, type, ph }) => (
                        <input
                          key={ph}
                          type={type}
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={ph}
                          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
                          style={{
                            background: "var(--feed-input-bg)",
                            border: "1px solid var(--feed-input-border)",
                            color: "var(--feed-text)",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    className="flex items-center gap-3 pt-3"
                    style={{ borderTop: "1px solid var(--feed-border)" }}
                  >
                    <button
                      type="button"
                      onClick={handleCreatePost}
                      disabled={!canPost}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 disabled:opacity-40"
                      style={{
                        background: canPost ? "var(--feed-gradient)" : "var(--feed-input-bg)",
                        color: canPost ? "#fff" : "var(--feed-text-dim)",
                        boxShadow: canPost ? "var(--feed-glow)" : "none",
                      }}
                    >
                      {postSubmitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</>
                      ) : (
                        <><Sparkles className="h-4 w-4" /> Publish</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetComposer}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
                      style={{ color: "var(--feed-text-dim)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--feed-text-muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--feed-text-dim)")}
                    >
                      Cancel
                    </button>
                    <span
                      className="ml-auto text-xs tabular-nums font-medium"
                      style={{ color: "var(--feed-text-dim)" }}
                    >
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
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-all duration-200 group"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "var(--feed-input-bg)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                    style={{ background: "var(--feed-badge-bg)" }}
                  >
                    <Sparkles className="h-5 w-5" style={{ color: "var(--feed-accent)" }} />
                  </div>
                  <span className="flex-1 text-sm" style={{ color: "var(--feed-text-muted)" }}>
                    Share something with your community…
                  </span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {[ImageIcon, Video, Link2].map((Icon, i) => (
                      <span
                        key={i}
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{
                          background: "var(--feed-input-bg)",
                          color: "var(--feed-text-dim)",
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    ))}
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── Feed content ── */}
          {loading ? (
            <FeedSkeleton />
          ) : items.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-16 text-center"
              style={{
                background: "var(--feed-card)",
                border: "1px solid var(--feed-border)",
                boxShadow: "var(--feed-card-shadow)",
              }}
            >
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--feed-badge-bg)" }}
              >
                <Sparkles className="h-8 w-8" style={{ color: "var(--feed-accent)" }} />
              </div>
              <p className="mt-6 text-lg font-bold" style={{ color: "var(--feed-text)" }}>
                Your feed is empty
              </p>
              <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: "var(--feed-text-muted)" }}>
                Follow organizations to see their updates, donations, and milestones here.
              </p>
              <Link
                href="/explore"
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-200"
                style={{
                  background: "var(--feed-gradient)",
                  boxShadow: "var(--feed-glow)",
                }}
              >
                Explore Organizations <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(i * 0.04, 0.4),
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <FeedItemCard
                    item={item}
                    index={i}
                    onEdit={(id, payload) => {
                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === id ? { ...x, payload: { ...x.payload, ...payload } } : x
                        )
                      );
                    }}
                    onDelete={(id) => {
                      setItems((prev) => prev.filter((x) => x.id !== id));
                    }}
                  />
                </motion.div>
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-4" aria-hidden />

              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div
                    className="flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium backdrop-blur-md"
                    style={{
                      background: "var(--feed-card)",
                      border: "1px solid var(--feed-border)",
                      color: "var(--feed-text-muted)",
                    }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--feed-accent)" }} />
                    Loading more…
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right dynamic panel */}
        <FeedRightPanel />
      </div>
    </>
  );
}
