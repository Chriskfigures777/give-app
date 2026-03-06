"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  TrendingUp,
  Sparkles,
  Send,
  MapPin,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { FeedItemResponse } from "@/app/api/feed/route";
import { motion, AnimatePresence } from "motion/react";

const PLACEHOLDER_LOGO =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getOrgImageUrl(item: FeedItemResponse): string {
  return (
    item.organization_profile_image_url ??
    item.organization_logo_url ??
    (item.payload?.profile_image_url as string) ??
    (item.payload?.logo_url as string) ??
    PLACEHOLDER_LOGO
  );
}

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
};

type Props = {
  item: FeedItemResponse;
  index?: number;
  onUpdate?: (updates: {
    support_count?: number;
    user_supported?: boolean;
    comment_count?: number;
  }) => void;
  onEdit?: (id: string, payload: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
};

export function FeedItemCard({
  item,
  index = 0,
  onUpdate,
  onEdit,
  onDelete,
}: Props) {
  const [supportCount, setSupportCount] = useState(item.support_count ?? 0);
  const [userSupported, setUserSupported] = useState(item.user_supported ?? false);
  const [commentCount, setCommentCount] = useState(item.comment_count ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareComment, setShareComment] = useState("");
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState((item.payload?.content as string) ?? "");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [supportAnimating, setSupportAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const canEditDelete =
    item.is_author && (item.item_type === "post" || item.item_type === "share");

  const router = useRouter();
  const linkHref = `/org/${item.organization_slug}`;
  const imageUrl = getOrgImageUrl(item);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/feed/${item.id}/comments`);
      const data = await res.json();
      if (res.ok) setComments(data.comments ?? []);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSupportClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSupportAnimating(true);
    setTimeout(() => setSupportAnimating(false), 600);
    try {
      const res = await fetch(`/api/feed/${item.id}/reactions`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const supported = data.supported ?? false;
      setUserSupported(supported);
      setSupportCount((c) => (supported ? c + 1 : Math.max(0, c - 1)));
      onUpdate?.({
        support_count: supported ? supportCount + 1 : supportCount - 1,
        user_supported: supported,
      });
    } catch {
      toast.error("Failed to update support");
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentsOpen((o) => {
      if (!o) fetchComments();
      return !o;
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCommentInput("");
      setCommentCount((c) => c + 1);
      onUpdate?.({ comment_count: commentCount + 1 });
      fetchComments();
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareModalOpen(true);
  };

  const handleShareSubmit = async () => {
    setShareSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${item.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: shareComment.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      toast.success("Shared to feed");
      setShareModalOpen(false);
      setShareComment("");
    } catch {
      toast.error("Failed to share");
    } finally {
      setShareSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    const content = editContent.trim();
    if (!content || editSubmitting) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onEdit?.(item.id, { ...item.payload, content });
      setEditModalOpen(false);
      toast.success("Post updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onDelete?.(item.id);
      setDeleteConfirmOpen(false);
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  /* ── Card header (org avatar + name + timestamp) ── */
  const cardHeader = (nameOverride?: string, subtitle?: React.ReactNode) => (
    <div className="flex items-start gap-3 px-4 pt-4 pb-1">
      <div
        className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-full ring-2 ring-white"
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.08)" }}
        onClick={(e) => { e.stopPropagation(); router.push(linkHref); }}
      >
        <Image
          src={imageUrl}
          alt={item.organization_name}
          fill
          className="object-cover"
          sizes="44px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span
            className="text-[14px] font-bold cursor-pointer hover:underline underline-offset-2"
            style={{ color: "var(--feed-text)" }}
            onClick={(e) => { e.stopPropagation(); router.push(linkHref); }}
          >
            {nameOverride ?? item.organization_name}
          </span>
          {subtitle && (
            <span className="text-[13px]" style={{ color: "var(--feed-text-muted)" }}>
              {subtitle}
            </span>
          )}
        </div>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--feed-text-dim)" }}>
          {formatRelativeTime(item.created_at)}
        </p>
      </div>
    </div>
  );

  /* ── Action bar ── */
  const actionBar = (
    <div
      className="flex items-center gap-1 px-3 py-2"
      style={{ borderTop: "1px solid var(--feed-border)", background: "rgba(0,0,0,0.015)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleSupportClick}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200"
        style={{
          color: userSupported ? "#e11d48" : "var(--feed-text-muted)",
          background: userSupported ? "rgba(225, 29, 72, 0.08)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!userSupported) (e.currentTarget as HTMLElement).style.background = "rgba(225,29,72,0.06)";
        }}
        onMouseLeave={(e) => {
          if (!userSupported) (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <Heart
          className={`h-[16px] w-[16px] transition-all duration-300 ${supportAnimating ? "scale-125" : ""}`}
          style={userSupported ? { fill: "#e11d48", color: "#e11d48" } : {}}
        />
        <span>{supportCount > 0 ? supportCount : "Support"}</span>
      </button>

      <button
        type="button"
        onClick={handleCommentClick}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200"
        style={{
          color: commentsOpen ? "var(--feed-accent-dark)" : "var(--feed-text-muted)",
          background: commentsOpen ? "var(--feed-badge-bg)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!commentsOpen) (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.06)";
        }}
        onMouseLeave={(e) => {
          if (!commentsOpen) (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <MessageCircle className="h-[16px] w-[16px]" />
        <span>{commentCount > 0 ? commentCount : "Comment"}</span>
      </button>

      <button
        type="button"
        onClick={handleShareClick}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200"
        style={{ color: "var(--feed-text-muted)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
          (e.currentTarget as HTMLElement).style.color = "var(--feed-text)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--feed-text-muted)";
        }}
      >
        <Share2 className="h-[16px] w-[16px]" />
        <span>Share</span>
      </button>
    </div>
  );

  /* ── Comments section ── */
  const commentSection = commentsOpen && (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div
          className="px-4 py-4"
          style={{ borderTop: "1px solid var(--feed-border)", background: "var(--feed-input-bg)" }}
        >
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="flex gap-2.5">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment…"
                className="flex-1 rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all duration-200"
                style={{
                  background: "var(--feed-card)",
                  border: "1px solid var(--feed-border-strong)",
                  color: "var(--feed-text)",
                }}
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={!commentInput.trim() || commentSubmitting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40 transition-all duration-200"
                style={{ background: "var(--feed-gradient)", boxShadow: "0 2px 8px rgba(52,211,153,0.3)" }}
              >
                {commentSubmitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </button>
            </div>
          </form>

          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="ft-skeleton h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="ft-skeleton h-3 w-24 rounded" />
                    <div className="ft-skeleton h-3 w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: "var(--feed-gradient)" }}
                  >
                    {c.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="inline-block rounded-2xl rounded-tl-md px-3.5 py-2.5"
                      style={{
                        background: "var(--feed-card)",
                        border: "1px solid var(--feed-border)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <span className="text-[13px] font-semibold block" style={{ color: "var(--feed-text)" }}>
                        {c.author_name}
                      </span>
                      <p className="text-[13px] leading-relaxed" style={{ color: "var(--feed-text-muted)" }}>
                        {c.content}
                      </p>
                    </div>
                    <p className="mt-1 px-1 text-[11px]" style={{ color: "var(--feed-text-dim)" }}>
                      {formatRelativeTime(c.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm" style={{ color: "var(--feed-text-dim)" }}>
              No comments yet — be the first!
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  /* ── Card content variants ── */
  let cardContent: React.ReactNode;

  switch (item.item_type) {
    /* ── Donation ── */
    case "donation": {
      const amountCents = (item.payload.amount_cents as number) ?? 0;
      cardContent = (
        <>
          {cardHeader(undefined, "received a donation")}
          <div className="px-4 pb-4 pt-3">
            <div
              className="rounded-2xl px-5 py-5 text-center"
              style={{
                background: "var(--feed-donation-bg)",
                border: "1px solid var(--feed-donation-border)",
              }}
            >
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(5,150,105,0.12)" }}
              >
                <Sparkles className="h-5 w-5" style={{ color: "#059669" }} />
              </div>
              <p
                className="text-4xl font-extrabold tabular-nums"
                style={{ color: "#059669", letterSpacing: "-0.02em" }}
              >
                {formatAmount(amountCents)}
              </p>
              <p className="mt-1.5 text-[13px]" style={{ color: "var(--feed-text-muted)" }}>
                donated to their mission
              </p>
            </div>
          </div>
        </>
      );
      break;
    }

    /* ── Goal progress ── */
    case "goal_progress": {
      const goalPct = (item.payload.goal_pct as number) ?? 0;
      const goalAmountCents = (item.payload.goal_amount_cents as number) ?? 0;
      const campaignName = (item.payload.campaign_name as string) ?? "Fundraising Goal";
      const clampedPct = Math.min(100, Math.max(0, goalPct));
      cardContent = (
        <>
          {cardHeader(undefined, (
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {campaignName}
            </span>
          ))}
          <div className="px-4 pb-4 pt-3">
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--feed-goal-bg)",
                border: "1px solid var(--feed-goal-border)",
              }}
            >
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <span
                    className="text-3xl font-extrabold tabular-nums"
                    style={{ color: "#0d9488", letterSpacing: "-0.02em" }}
                  >
                    {Math.round(goalPct)}
                    <span className="text-xl">%</span>
                  </span>
                  <p className="mt-0.5 text-[12px]" style={{ color: "var(--feed-text-muted)" }}>
                    of goal reached
                  </p>
                </div>
                <p className="text-[13px] font-medium" style={{ color: "var(--feed-text-muted)" }}>
                  Goal: {formatAmount(goalAmountCents)}
                </p>
              </div>
              {/* Progress bar */}
              <div
                className="h-2.5 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(14,148,136,0.15)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${clampedPct}%`,
                    background: "linear-gradient(90deg, #059669 0%, #0d9488 100%)",
                  }}
                />
              </div>
              <p className="mt-2.5 text-[12px]" style={{ color: "var(--feed-text-muted)" }}>
                Help them reach their fundraising goal
              </p>
            </div>
          </div>
        </>
      );
      break;
    }

    /* ── New org ── */
    case "new_org": {
      const city = (item.payload.city as string) ?? null;
      const state = (item.payload.state as string) ?? null;
      const location = [city, state].filter(Boolean).join(", ");
      cardContent = (
        <>
          {cardHeader(undefined, location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {location}
            </span>
          ) : "just joined Give")}
          <div className="px-4 pb-4 pt-3">
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-4"
              style={{
                background: "var(--feed-new-org-bg)",
                border: "1px solid var(--feed-new-org-border)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(124,58,237,0.12)" }}
              >
                <Sparkles className="h-5 w-5" style={{ color: "#7c3aed" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold" style={{ color: "var(--feed-new-org-text)" }}>
                  Welcome to Give!
                </p>
                <p className="text-[13px]" style={{ color: "var(--feed-text-muted)" }}>
                  {item.organization_name} is now on the platform
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-40" style={{ color: "var(--feed-new-org-text)" }} />
            </div>
          </div>
        </>
      );
      break;
    }

    /* ── Post ── */
    case "post": {
      const content = (item.payload.content as string) ?? "";
      const postMediaUrl = (item.payload.media_url as string) ?? null;
      const mediaType = (item.payload.media_type as "image" | "video" | "link") ?? null;
      const postLinkUrl = (item.payload.link_url as string) ?? null;
      const linkTitle = (item.payload.link_title as string) ?? null;
      const linkDescription = (item.payload.link_description as string) ?? null;
      const linkThumbnailUrl = (item.payload.link_thumbnail_url as string) ?? null;
      const authorName = (item.payload.author_name as string) ?? item.organization_name;

      const inferMediaType = (url: string): "image" | "video" => {
        const ext = url.split(".").pop()?.toLowerCase() ?? "";
        if (["mp4", "webm", "mov", "ogg"].includes(ext)) return "video";
        return "image";
      };
      const resolvedMediaType = mediaType ?? (postMediaUrl ? inferMediaType(postMediaUrl) : null);

      let mediaBlock: React.ReactNode = null;
      if (resolvedMediaType === "image" && postMediaUrl) {
        mediaBlock = (
          <div className="mt-2 overflow-hidden" style={{ marginLeft: "-1px", marginRight: "-1px" }}>
            <div
              className="relative aspect-video w-full overflow-hidden"
              style={{ background: "var(--feed-input-bg)" }}
            >
              <Image
                src={postMediaUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover/card:scale-[1.01]"
                sizes="(max-width: 680px) 100vw, 600px"
                unoptimized
              />
            </div>
          </div>
        );
      } else if (resolvedMediaType === "video" && postMediaUrl) {
        mediaBlock = (
          <div className="mt-2 overflow-hidden px-4">
            <div
              className="aspect-video w-full overflow-hidden rounded-2xl"
              style={{ background: "var(--feed-input-bg)" }}
            >
              <video
                src={postMediaUrl}
                controls
                className="h-full w-full object-contain"
                preload="metadata"
                playsInline
              />
            </div>
          </div>
        );
      } else if (mediaType === "link" && postLinkUrl) {
        const domain = (() => {
          try { return new URL(postLinkUrl).hostname.replace(/^www\./, ""); }
          catch { return "Link"; }
        })();
        mediaBlock = (
          <div className="mt-2 px-4">
            <a
              href={postLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block overflow-hidden rounded-xl transition-all duration-200 hover:opacity-90"
              style={{
                border: "1px solid var(--feed-border-strong)",
                background: "var(--feed-input-bg)",
              }}
            >
              {linkThumbnailUrl && (
                <div
                  className="relative aspect-video w-full overflow-hidden"
                  style={{ background: "var(--feed-border)" }}
                >
                  <Image
                    src={linkThumbnailUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 680px) 100vw, 600px"
                    unoptimized
                  />
                </div>
              )}
              <div className="p-3.5">
                {linkTitle && (
                  <p className="font-semibold" style={{ color: "var(--feed-text)" }}>{linkTitle}</p>
                )}
                {linkDescription && (
                  <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--feed-text-muted)" }}>
                    {linkDescription}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--feed-text-dim)" }}>
                  <ExternalLink className="h-3 w-3" />
                  {domain}
                </div>
              </div>
            </a>
          </div>
        );
      }

      cardContent = (
        <>
          {cardHeader(authorName)}
          {content && (
            <div className="px-4 pt-2 pb-1">
              <p
                className="text-[14.5px] leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--feed-text)" }}
              >
                {content}
              </p>
            </div>
          )}
          {mediaBlock}
        </>
      );
      break;
    }

    /* ── Share ── */
    case "share": {
      const sharedByName = (item.payload.shared_by_name as string) ?? "Someone";
      const comment = (item.payload.comment as string) ?? null;
      cardContent = (
        <>
          {cardHeader(sharedByName, (
            <span className="inline-flex items-center gap-1">
              <Share2 className="h-3 w-3" /> shared a post
            </span>
          ))}
          {comment && (
            <div className="px-4 pt-2 pb-3 mx-4 mt-2 mb-1 rounded-xl" style={{ background: "var(--feed-input-bg)", border: "1px solid var(--feed-border)" }}>
              <p
                className="text-[14px] italic leading-relaxed"
                style={{ color: "var(--feed-text-muted)" }}
              >
                &ldquo;{comment}&rdquo;
              </p>
            </div>
          )}
        </>
      );
      break;
    }

    default:
      cardContent = (
        <>
          {cardHeader()}
          <div className="px-4 pt-2 pb-1">
            <p className="text-sm" style={{ color: "var(--feed-text-muted)" }}>Activity update</p>
          </div>
        </>
      );
  }

  return (
    <>
      <div
        className="group/card relative overflow-hidden rounded-2xl ft-card-interactive"
        style={{
          background: "var(--feed-card)",
          border: "1px solid var(--feed-border)",
          boxShadow: "var(--feed-card-shadow)",
        }}
      >
        {/* More options menu */}
        {canEditDelete && (
          <div className="absolute top-3.5 right-3.5 z-10" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              className="rounded-xl p-2 opacity-0 transition-all duration-200 group-hover/card:opacity-100"
              style={{ color: "var(--feed-text-dim)", background: "var(--feed-card)" }}
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded-xl py-1 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150"
                style={{
                  background: "var(--feed-card)",
                  border: "1px solid var(--feed-border-strong)",
                  boxShadow: "var(--feed-card-shadow-hover)",
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    setEditModalOpen(true);
                    setEditContent((item.payload?.content as string) ?? "");
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-all duration-150"
                  style={{ color: "var(--feed-text)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--feed-input-bg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Pencil className="h-4 w-4" style={{ color: "var(--feed-text-muted)" }} />
                  Edit post
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-500 transition-all duration-150"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card content — clickable to navigate to org */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push(linkHref)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(linkHref);
            }
          }}
          className="block pb-1 cursor-pointer"
        >
          {cardContent}
        </div>

        {/* Engagement counts */}
        {(supportCount > 0 || commentCount > 0) && (
          <div
            className="flex items-center gap-3 px-4 py-2 text-[12px]"
            style={{ color: "var(--feed-text-dim)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {supportCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                <span className="font-medium">{supportCount}</span>
              </span>
            )}
            {commentCount > 0 && (
              <span>
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </span>
            )}
          </div>
        )}

        {actionBar}
        {commentSection}
      </div>

      {/* ── Edit modal ── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent
          className="max-w-md rounded-2xl shadow-2xl border-0"
          style={{ background: "#0e1117", border: "1px solid rgba(255,255,255,0.08)", color: "#eef0f6" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#eef0f6" }}>Edit post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
              style={{
                background: "#080b12",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#eef0f6",
              }}
              rows={4}
              maxLength={5000}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleEditSubmit}
                disabled={!editContent.trim() || editSubmitting}
                className="rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #34d399 0%, #0d9488 100%)" }}
              >
                {editSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving…</>
                  : <><Check className="h-4 w-4 mr-1.5" /> Save changes</>
                }
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="rounded-xl"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8891a5", background: "transparent" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm modal ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          className="max-w-md rounded-2xl shadow-2xl border-0"
          style={{ background: "#0e1117", border: "1px solid rgba(255,255,255,0.08)", color: "#eef0f6" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#eef0f6" }}>Delete this post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "#8891a5" }}>
            This action cannot be undone. The post and all its comments will be permanently removed.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting…</> : "Delete post"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8891a5", background: "transparent" }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Share modal ── */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent
          className="max-w-md rounded-2xl shadow-2xl border-0"
          style={{ background: "#0e1117", border: "1px solid rgba(255,255,255,0.08)", color: "#eef0f6" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#eef0f6" }}>Share to your feed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={shareComment}
              onChange={(e) => setShareComment(e.target.value)}
              placeholder="Add your thoughts (optional)…"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
              style={{
                background: "#080b12",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#eef0f6",
              }}
              rows={3}
              maxLength={500}
            />
            <Button
              onClick={handleShareSubmit}
              disabled={shareSubmitting}
              className="w-full rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #34d399 0%, #0d9488 100%)" }}
            >
              {shareSubmitting
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Sharing…</>
                : <><Share2 className="h-4 w-4 mr-1.5" /> Share now</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
