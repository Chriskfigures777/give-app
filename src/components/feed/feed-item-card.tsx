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
      className="flex items-center border-t border-slate-100 px-4 py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleSupportClick}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
          userSupported ? "text-rose-600" : "text-slate-500 hover:text-rose-500"
        } ${supportAnimating ? "feed-glow-pulse" : ""}`}
      >
        <Heart
          className={`h-[17px] w-[17px] transition-all duration-200 ${
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
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
          commentsOpen ? "text-blue-600" : "text-slate-500 hover:text-blue-500"
        }`}
      >
        <MessageCircle className="h-[17px] w-[17px]" />
        <span>{commentCount > 0 ? commentCount : "Comment"}</span>
      </button>
      <button
        type="button"
        onClick={handleShareClick}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <Share2 className="h-[17px] w-[17px]" />
        <span>Share</span>
      </button>
    </div>
  );

  /* ── Comments section ── */
  const commentSection = commentsOpen && (
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
      <form onSubmit={handleCommentSubmit} className="mb-4">
        <div className="flex gap-2.5">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!commentInput.trim() || commentSubmitting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
      {commentsLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="feed-shimmer h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="feed-shimmer h-3 w-24 rounded-full" />
                <div className="feed-shimmer h-3 w-3/4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                {c.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-block rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <span className="text-[13px] font-semibold text-slate-800">
                    {c.author_name}
                  </span>
                  <p className="text-[13px] leading-relaxed text-slate-600">
                    {c.content}
                  </p>
                </div>
                <p className="mt-1 px-1 text-[11px] text-slate-400">
                  {formatRelativeTime(c.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );

  /* ── Shared content header (avatar + name + timestamp) ── */
  const contentHeader = (
    nameOverride?: string,
    subtitle?: React.ReactNode
  ) => (
    <div className="flex items-start gap-3 px-4 pt-4">
      <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-full overflow-hidden rounded-full bg-white">
          <Image
            src={imageUrl}
            alt={item.organization_name}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900 hover:text-emerald-700">
            {nameOverride ?? item.organization_name}
          </span>
          <span className="shrink-0 text-[12px] text-slate-400 tabular-nums">
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
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{formatAmount(amountCents)}</p>
                <p className="text-xs text-slate-500">donated</p>
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
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                  <span className="text-xl font-bold text-slate-900">{Math.round(goalPct)}%</span>
                </div>
                <span className="text-sm text-slate-500">of {formatAmount(goalAmountCents)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${clampedPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Help them reach their goal</p>
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
          {contentHeader(undefined, location || "Just joined")}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{item.organization_name} joined</p>
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-violet-600">
                  Visit <ExternalLink className="h-3 w-3" />
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
          <div className="mt-1 px-4 pb-1">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
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
          <div className="mt-1 px-4 pb-1">
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
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
          <div className="mt-1 px-4 pb-1">
            <a
              href={postLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300"
            >
              {linkThumbnailUrl && (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-200">
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
                  <p className="font-semibold text-slate-900">
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
            <div className="px-4 pt-2 pb-1">
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
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
            <div className="px-4 pt-2 pb-1">
              <p className="text-sm italic leading-relaxed text-slate-600">
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
          <div className="px-4 pt-2 pb-1">
            <p className="text-sm text-slate-600">Activity update</p>
          </div>
        </>
      );
  }

  return (
    <>
      <div className="group/card relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
        {/* Accent line */}
        {item.item_type === "donation" && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
        )}
        {item.item_type === "new_org" && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
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
          <div className="flex items-center gap-4 px-4 py-2 text-xs text-slate-400">
            {supportCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                {supportCount}
              </span>
            )}
            {commentCount > 0 && (
              <span className="text-slate-400">
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
