"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  Send,
  MoreHorizontal,
  SquarePen,
  ChevronUp,
  MessageCircle,
  Smile,
  Paperclip,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Thread = {
  id: string;
  connectionId: string;
  otherName: string;
  otherOrgSlug?: string | null;
  otherLogoUrl?: string | null;
  otherProfileImageUrl?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
};
type Message = {
  id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
};

function formatThreadDate(iso: string | null | undefined): string {
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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AvatarCircle({
  src,
  name,
  size = "md",
  showOnline = false,
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  showOnline?: boolean;
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
  };
  const onlineDotSize = {
    sm: "h-2 w-2 border",
    md: "h-2.5 w-2.5 border-[1.5px]",
    lg: "h-3 w-3 border-2",
  };
  return (
    <div className={cn("relative shrink-0", sizeClasses[size])}>
      <div
        className={cn(
          "h-full w-full rounded-full overflow-hidden bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-500/20 dark:to-teal-500/20 ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
          sizeClasses[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-semibold text-emerald-700 dark:text-emerald-300">
            {getInitials(name)}
          </span>
        )}
      </div>
      {showOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-white dark:border-slate-900 bg-emerald-500",
            onlineDotSize[size]
          )}
        />
      )}
    </div>
  );
}

function SkeletonThreads() {
  return (
    <div className="p-3 space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl">
          <div className="h-10 w-10 rounded-full msg-skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-24 msg-skeleton rounded" />
            <div className="h-3 w-36 msg-skeleton rounded" />
          </div>
          <div className="h-3 w-10 msg-skeleton rounded" />
        </div>
      ))}
    </div>
  );
}

function SkeletonMessages() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-start">
        <div className="h-10 w-48 msg-skeleton" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-40 msg-skeleton" />
      </div>
      <div className="flex justify-start">
        <div className="h-10 w-56 msg-skeleton" />
      </div>
      <div className="flex justify-end">
        <div className="h-14 w-44 msg-skeleton" />
      </div>
    </div>
  );
}

export function FloatingChatBubble() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get("thread");
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
  const [selectedThread, setSelectedThread] = useState<{
    id: string;
    otherName: string;
    otherLogoUrl?: string | null;
    otherProfileImageUrl?: string | null;
  } | null>(null);
  const [profile, setProfile] = useState<{
    userId: string;
    orgId: string | null;
    isOrgOwner: boolean;
    avatarUrl?: string | null;
    orgLogoUrl?: string | null;
  } | null>(null);

  const refreshThreads = useCallback(() => {
    fetch("/api/chat/threads")
      .then((r) => r.json())
      .then((d) => {
        setThreads(d.threads ?? []);
        setThreadsLoaded(true);
      });
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) =>
        setProfile({
          userId: d.userId,
          orgId: d.orgId,
          isOrgOwner: d.isOrgOwner,
          avatarUrl: d.avatarUrl ?? null,
          orgLogoUrl: d.orgLogoUrl ?? null,
        })
      );
  }, []);

  useEffect(() => {
    if (threadParam) {
      setOpen(true);
      fetch("/api/chat/threads")
        .then((r) => r.json())
        .then((d) => {
          setThreadsLoaded(true);
          const t = (d.threads ?? []).find(
            (x: Thread) => x.id === threadParam
          );
          if (t)
            setSelectedThread({
              id: t.id,
              otherName: t.otherName,
              otherLogoUrl: t.otherLogoUrl,
              otherProfileImageUrl: t.otherProfileImageUrl,
            });
        });
    }
  }, [threadParam]);

  useEffect(() => {
    if (open) {
      refreshThreads();
    } else {
      setThreadsLoaded(false);
    }
  }, [open, refreshThreads]);

  const avatarUrl = profile?.orgLogoUrl ?? profile?.avatarUrl ?? null;

  if (!open) {
    return (
      <div className="fixed bottom-6 right-6 z-[9998] chat-bar-slide-in">
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 px-2 py-1.5 shadow-lg shadow-black/[0.06] dark:shadow-black/[0.2] transition-all hover:shadow-xl hover:shadow-black/[0.08] dark:hover:shadow-black/[0.3]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
            aria-label="Open messages"
          >
            <AvatarCircle src={avatarUrl} name="Messaging" size="sm" showOnline />
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              Messaging
            </span>
          </button>
          <div className="flex items-center gap-0.5 pl-1 border-l border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="New message"
            >
              <SquarePen className="h-3.5 w-3.5" />
            </button>
            <Link
              href="/messages"
              className="p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Open full messages"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9998] chat-slide-up">
      <div className="w-[380px] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl shadow-black/[0.08] dark:shadow-black/[0.3] overflow-hidden flex flex-col max-h-[540px]">
        {selectedThread ? (
          <ChatPanel
            threadId={selectedThread.id}
            otherName={selectedThread.otherName}
            otherAvatar={
              selectedThread.otherProfileImageUrl ??
              selectedThread.otherLogoUrl ??
              null
            }
            profile={profile}
            onBack={() => {
              setSelectedThread(null);
              refreshThreads();
              const url = new URL(window.location.href);
              url.searchParams.delete("thread");
              router.replace(url.pathname + url.search);
            }}
            onClose={() => setOpen(false)}
          />
        ) : (
          <ThreadList
            threads={threads}
            threadsLoaded={threadsLoaded}
            onSelect={(t) =>
              setSelectedThread({
                id: t.id,
                otherName: t.otherName,
                otherLogoUrl: t.otherLogoUrl,
                otherProfileImageUrl: t.otherProfileImageUrl,
              })
            }
            onClose={() => setOpen(false)}
            onThreadsUpdate={refreshThreads}
          />
        )}
      </div>
    </div>
  );
}

function ThreadList({
  threads,
  threadsLoaded,
  onSelect,
  onClose,
  onThreadsUpdate,
}: {
  threads: Thread[];
  threadsLoaded: boolean;
  onSelect: (t: Thread) => void;
  onClose: () => void;
  onThreadsUpdate: () => void;
}) {
  const supabase = createClient();
  const threadIdsKey = threads
    .map((t) => t.id)
    .sort()
    .join(",");

  useEffect(() => {
    if (threads.length === 0) return;
    const ids = threads.map((t) => t.id);
    const channel = supabase
      .channel("chat-thread-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newRow = payload.new as {
            thread_id: string;
            content: string;
            created_at: string;
          };
          if (ids.includes(newRow.thread_id)) {
            onThreadsUpdate();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadIdsKey, onThreadsUpdate]);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <MessageCircle className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
            Messaging
          </h3>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="New message"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <Link
            href="/messages"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="Open full view"
          >
            <Maximize2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 chat-scroll">
        {!threadsLoaded ? (
          <SkeletonThreads />
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              No conversations yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-[220px] leading-relaxed">
              Connect with organizations to start messaging.
            </p>
            <Link
              href="/dashboard/connections"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            >
              Find connections
              <ChevronUp className="h-3 w-3 rotate-90" />
            </Link>
          </div>
        ) : (
          <div className="py-1">
            {threads.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t)}
                className="thread-row-in w-full px-2 py-0.5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200 group">
                  <AvatarCircle
                    src={t.otherProfileImageUrl ?? t.otherLogoUrl}
                    name={t.otherName}
                    size="md"
                    showOnline
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                        {t.otherName}
                      </p>
                      {t.lastMessageAt && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                          {formatThreadDate(t.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-snug">
                      {t.lastMessagePreview ?? "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ChatPanel({
  threadId,
  otherName,
  otherAvatar,
  profile,
  onBack,
  onClose,
}: {
  threadId: string;
  otherName: string;
  otherAvatar?: string | null;
  profile: {
    userId: string;
    orgId: string | null;
    isOrgOwner: boolean;
  } | null;
  onBack: () => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/chat/threads/${threadId}/messages`);
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages ?? []);
      setMessagesLoaded(true);
    }
  }, [threadId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newRow = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return [...prev, newRow];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    setNewMessage("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    const tempId = `opt-${Date.now()}`;
    const senderType = profile?.orgId ? "organization" : "user";
    const senderId = profile?.orgId ?? profile?.userId ?? "";
    const optimistic: Message = {
      id: tempId,
      sender_id: senderId,
      sender_type: senderType,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    try {
      const res = await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, senderType }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        const inserted = data.message as Message;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? inserted : m))
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const isFromMe = (m: Message) =>
    (m.sender_type === "user" && m.sender_id === profile?.userId) ||
    (m.sender_type === "organization" &&
      !!profile?.orgId &&
      m.sender_id === profile.orgId);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <AvatarCircle src={otherAvatar} name={otherName} size="sm" showOnline />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate tracking-tight">
            {otherName}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Active now
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 chat-scroll px-3 py-3 space-y-1 bg-gradient-to-b from-slate-50/50 via-white to-white dark:from-slate-900/50 dark:via-slate-900 dark:to-slate-900">
        {!messagesLoaded ? (
          <SkeletonMessages />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-3">
              <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400 -rotate-12" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const fromMe = isFromMe(m);
              const showAvatar =
                !fromMe &&
                (i === 0 || isFromMe(messages[i - 1]));
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex msg-bubble-in",
                    fromMe ? "justify-end" : "justify-start"
                  )}
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  {!fromMe && (
                    <div className="w-6 shrink-0 self-end mr-1.5">
                      {showAvatar && (
                        <AvatarCircle
                          src={otherAvatar}
                          name={otherName}
                          size="sm"
                        />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] px-3.5 py-2 text-[13px] leading-relaxed",
                      fromMe
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl rounded-br-md shadow-sm shadow-emerald-600/10"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-0.5 tabular-nums",
                        fromMe
                          ? "text-emerald-200/80"
                          : "text-slate-400 dark:text-slate-500"
                      )}
                    >
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800/80 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-1.5 msg-input-focus transition-all duration-200">
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 mb-0.5"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleTextareaInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none py-1 max-h-20 leading-snug"
          />
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 mb-0.5"
            aria-label="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shrink-0 h-8 w-8 shadow-sm shadow-emerald-600/20 disabled:opacity-40 disabled:shadow-none transition-all duration-200 mb-0.5"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}
