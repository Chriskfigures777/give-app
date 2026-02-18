"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
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
  const [userSupported, setUserSupported] = useState(
    item.user_supported ?? false
  );
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
  const [editContent, setEditContent] = useState(
    (item.payload?.content as string) ?? ""
  );
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
      const res = await fetch(`/api/feed/${item.id}/reactions`, {
        method: "POST",
      });
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

  /* ── Engagement action bar ── */
  const actionBar = (
    <div
      className="flex items-center gap-1 border-t border-slate-100/80 px-5 py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleSupportClick}
        className={`group/btn inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
          userSupported
            ? "bg-rose-50 text-rose-600"
            : "text-slate-500 hover:bg-slate-50 hover:text-rose-500"
        } ${supportAnimating ? "feed-glow-pulse" : ""}`}
      >
        <Heart
          className={`h-[18px] w-[18px] transition-all duration-200 ${
            userSupported
              ? "fill-rose-500 text-rose-500 scale-110"
              : "group-hover/btn:scale-110"
          }`}
        />
        <span>{supportCount > 0 ? supportCount : "Support"}</span>
      </button>
      <button
        type="button"
        onClick={handleCommentClick}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
          commentsOpen
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:bg-slate-50 hover:text-blue-500"
        }`}
      >
        <MessageCircle className="h-[18px] w-[18px]" />
        <span>{commentCount > 0 ? commentCount : "Comment"}</span>
      </button>
      <button
        type="button"
        onClick={handleShareClick}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-emerald-500"
      >
        <Share2 className="h-[18px] w-[18px]" />
        <span>Share</span>
      </button>
    </div>
  );

  /* ── Comments section ── */
  const commentSection = commentsOpen && (
    <div className="border-t border-slate-100/80 bg-slate-50/40 px-5 py-4">
      <form onSubmit={handleCommentSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm placeholder:text-slate-400 transition-all focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!commentInput.trim() || commentSubmitting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-all duration-200 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
      {commentsLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="feed-shimmer h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="feed-shimmer h-3 w-20 rounded" />
                <div className="feed-shimmer h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-[11px] font-bold text-emerald-700">
                {c.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-block rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                  <span className="text-[13px] font-semibold text-slate-800">
                    {c.author_name}
                  </span>
                  <p className="text-[13px] leading-relaxed text-slate-600">
                    {c.content}
                  </p>
                </div>
                <p className="mt-0.5 px-1 text-[11px] text-slate-400">
                  {formatRelativeTime(c.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-sm text-slate-400">
          No comments yet. Be the first!
        </p>
      )}
    </div>
  );

  /* ── Shared content header (avatar + name + timestamp) ── */
  /* Uses spans instead of Links to avoid nested <a> (whole card is clickable) */
  const contentHeader = (
    nameOverride?: string,
    subtitle?: React.ReactNode
  ) => (
    <div className="flex items-start gap-3.5 px-5 pt-5">
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 p-[2px] transition-transform duration-200 hover:scale-105 block">
        <div className="h-full w-full overflow-hidden rounded-full bg-white">
          <Image
            src={imageUrl}
            alt={item.organization_name}
            fill
            className="object-cover"
            sizes="44px"
          />
        </div>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-slate-900 hover:text-emerald-700 transition-colors">
            {nameOverride ?? item.organization_name}
          </span>
          <span className="shrink-0 text-[13px] text-slate-400">
            {formatRelativeTime(item.created_at)}
          </span>
        </div>
        {subtitle && (
          <div className="mt-0.5 text-[13px] text-slate-500">{subtitle}</div>
        )}
      </div>
    </div>
  );

  /* ── Card variants by item type ── */
  let cardContent: React.ReactNode;

  switch (item.item_type) {
    case "donation": {
      const amountCents = (item.payload.amount_cents as number) ?? 0;
      cardContent = (
        <>
          {contentHeader(undefined, "received a donation")}
          <div className="px-5 py-3">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-cyan-50/30 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight feed-gradient-text">
                  {formatAmount(amountCents)}
                </p>
                <p className="text-[13px] text-slate-500">donated</p>
              </div>
            </div>
          </div>
        </>
      );
      break;
    }

    case "goal_progress": {
      const goalPct = (item.payload.goal_pct as number) ?? 0;
      const goalAmountCents =
        (item.payload.goal_amount_cents as number) ?? 0;
      const campaignName =
        (item.payload.campaign_name as string) ?? "goal";
      const clampedPct = Math.min(100, goalPct);
      cardContent = (
        <>
          {contentHeader(undefined, `Campaign: ${campaignName}`)}
          <div className="px-5 py-3">
            <div className="rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-cyan-50/30 p-4">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-xl font-bold feed-gradient-text">
                    {Math.round(goalPct)}%
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-500">
                  of {formatAmount(goalAmountCents)}
                </span>
              </div>
              <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/60">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700 ease-out"
                  style={{ width: `${clampedPct}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                  style={{
                    width: `${clampedPct}%`,
                    animation: "feed-progress-shimmer 2s ease-in-out infinite",
                  }}
                />
              </div>
              <p className="mt-2 text-[13px] text-slate-500">
                Help them reach their goal
              </p>
            </div>
          </div>
        </>
      );
      break;
    }

    case "new_org": {
      const city = (item.payload.city as string) ?? null;
      const state = (item.payload.state as string) ?? null;
      const location = [city, state].filter(Boolean).join(", ");
      cardContent = (
        <>
          {contentHeader(undefined, location || "New on Give")}
          <div className="px-5 py-3">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-50/80 via-purple-50/50 to-fuchsia-50/30 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-slate-900">
                  {item.organization_name} just joined Give
                </p>
                <span className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
                  Visit their page
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </>
      );
      break;
    }

    case "post": {
      const content = (item.payload.content as string) ?? "";
      const postMediaUrl = (item.payload.media_url as string) ?? null;
      const mediaType =
        (item.payload.media_type as "image" | "video" | "link") ?? null;
      const postLinkUrl = (item.payload.link_url as string) ?? null;
      const linkTitle = (item.payload.link_title as string) ?? null;
      const linkDescription =
        (item.payload.link_description as string) ?? null;
      const linkThumbnailUrl =
        (item.payload.link_thumbnail_url as string) ?? null;
      const authorName =
        (item.payload.author_name as string) ?? item.organization_name;

      const inferMediaType = (url: string): "image" | "video" => {
        const ext = url.split(".").pop()?.toLowerCase() ?? "";
        if (["mp4", "webm", "mov", "ogg"].includes(ext)) return "video";
        return "image";
      };
      const resolvedMediaType =
        mediaType ?? (postMediaUrl ? inferMediaType(postMediaUrl) : null);

      let mediaBlock: React.ReactNode = null;
      if (resolvedMediaType === "image" && postMediaUrl) {
        mediaBlock = (
          <div className="mt-1 px-5 pb-1">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={postMediaUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 680px) 100vw, 600px"
                unoptimized
              />
            </div>
          </div>
        );
      } else if (resolvedMediaType === "video" && postMediaUrl) {
        mediaBlock = (
          <div className="mt-1 px-5 pb-1">
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
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
          try {
            return new URL(postLinkUrl).hostname.replace(/^www\./, "");
          } catch {
            return "Link";
          }
        })();
        mediaBlock = (
          <div className="mt-1 px-5 pb-1">
            <a
              href={postLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="group/link block overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
            >
              {linkThumbnailUrl && (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-200">
                  <Image
                    src={linkThumbnailUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover/link:scale-[1.02]"
                    sizes="(max-width: 680px) 100vw, 600px"
                    unoptimized
                  />
                </div>
              )}
              <div className="p-3.5">
                {linkTitle && (
                  <p className="font-semibold text-slate-900 group-hover/link:text-emerald-700 transition-colors">
                    {linkTitle}
                  </p>
                )}
                {linkDescription && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {linkDescription}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
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
          {contentHeader(authorName)}
          {content && (
            <div className="px-5 pt-2 pb-1">
              <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                {content}
              </p>
            </div>
          )}
          {mediaBlock}
        </>
      );
      break;
    }

    case "share": {
      const sharedByName =
        (item.payload.shared_by_name as string) ?? "Someone";
      const comment = (item.payload.comment as string) ?? null;
      cardContent = (
        <>
          {contentHeader(sharedByName, (
            <span className="inline-flex items-center gap-1">
              <Share2 className="h-3 w-3" /> shared a post
            </span>
          ))}
          {comment && (
            <div className="px-5 pt-2 pb-1">
              <p className="text-[15px] italic leading-relaxed text-slate-600">
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
          {contentHeader()}
          <div className="px-5 pt-2 pb-1">
            <p className="text-[15px] text-slate-600">Activity update</p>
          </div>
        </>
      );
  }

  return (
    <>
      <div className="group/card relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-300 hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.03)]">
        {/* Subtle top accent line */}
        {item.item_type === "donation" && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-60" />
        )}
        {item.item_type === "new_org" && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 opacity-60" />
        )}

        {/* More options menu */}
        {canEditDelete && (
          <div className="absolute top-4 right-4 z-10" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 group-hover/card:opacity-100"
              aria-label="More options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded-xl border border-slate-200/80 bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    setEditModalOpen(true);
                    setEditContent(
                      (item.payload?.content as string) ?? ""
                    );
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4 text-slate-400" />
                  Edit post
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card content - clickable div to avoid nested <a> tags */}
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

        {/* Engagement counts badge row */}
        {(supportCount > 0 || commentCount > 0) && (
          <div className="flex items-center gap-3 px-5 py-1.5 text-[12px] text-slate-400">
            {supportCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                {supportCount} {supportCount === 1 ? "support" : "supports"}
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

      {/* Edit modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              rows={4}
              maxLength={5000}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleEditSubmit}
                disabled={!editContent.trim() || editSubmitting}
                className="rounded-xl"
              >
                {editSubmitting ? "Saving..." : "Save changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This action cannot be undone. The post and all its comments will
            be permanently removed.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              className="rounded-xl"
            >
              {deleteSubmitting ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Share to your feed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={shareComment}
              onChange={(e) => setShareComment(e.target.value)}
              placeholder="Add your thoughts (optional)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              rows={3}
              maxLength={500}
            />
            <Button
              onClick={handleShareSubmit}
              disabled={shareSubmitting}
              className="rounded-xl"
            >
              {shareSubmitting ? "Sharing..." : "Share now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
