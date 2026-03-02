"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  ExternalLink,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";

type Thread = {
  id: string;
  connectionId: string;
  otherName: string;
  otherOrgSlug: string | null;
  otherLogoUrl?: string | null;
  otherProfileImageUrl?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function SkeletonRows() {
  return (
    <div className="px-2 py-2 space-y-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        >
          <div className="h-10 w-10 rounded-full msg-skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 msg-skeleton rounded" />
            <div className="h-2.5 w-36 msg-skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NavMessagesDropdown({ open, onClose, anchorRef }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/chat/threads")
        .then((r) => r.json())
        .then((d) => setThreads(d.threads ?? []))
        .finally(() => setLoading(false));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        anchorRef.current?.contains(e.target as Node)
      )
        return;
      onClose();
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [open, onClose, anchorRef]);

  const handleMessage = (threadId: string) => {
    onClose();
    const url = new URL(pathname ?? "/", window.location.origin);
    url.searchParams.set("thread", threadId);
    router.push(url.pathname + url.search);
  };

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute right-0 top-full z-[100] mt-2 w-[360px] rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/[0.08] dark:shadow-black/[0.25] overflow-hidden chat-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <MessageCircle className="h-3 w-3 text-white" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
            Messages
          </h3>
        </div>
        <Link
          href="/messages"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto chat-scroll">
        {loading ? (
          <SkeletonRows />
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center mb-3">
              <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              No conversations yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 max-w-[200px] leading-relaxed">
              Connect with organizations to start messaging.
            </p>
            <Link
              href="/dashboard/connections"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              onClick={onClose}
            >
              Find connections
            </Link>
          </div>
        ) : (
          <div className="py-1.5 px-1.5">
            {threads.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleMessage(t.id)}
                className="thread-row-in w-full"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200 group">
                  {/* Avatar */}
                  <div className="relative h-10 w-10 shrink-0">
                    <div className="h-full w-full rounded-full overflow-hidden bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-500/20 dark:to-teal-500/20 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                      {(t.otherProfileImageUrl ?? t.otherLogoUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.otherProfileImageUrl ?? t.otherLogoUrl ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                          {getInitials(t.otherName)}
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-[1.5px] border-white dark:border-slate-900 bg-emerald-500" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                        {t.otherName}
                      </p>
                      {t.lastMessageAt && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                          {formatTime(t.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-snug">
                      {t.lastMessagePreview ?? "No messages yet"}
                    </p>
                    {t.otherOrgSlug && (
                      <Link
                        href={`/org/${t.otherOrgSlug}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 mt-1 text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        View page
                      </Link>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
