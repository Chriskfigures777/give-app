"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MoreHorizontal,
  SquarePen,
  Send,
  MessageCircle,
  Smile,
  Paperclip,
  Phone,
  Video,
  Info,
  ChevronLeft,
  ArrowUpRight,
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

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
    md: "h-11 w-11 text-xs",
    lg: "h-14 w-14 text-sm",
  };
  const onlineDotSize = {
    sm: "h-2 w-2 border",
    md: "h-2.5 w-2.5 border-[1.5px]",
    lg: "h-3.5 w-3.5 border-2",
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
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
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
    <div className="py-2 px-2 space-y-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl">
          <div className="h-11 w-11 rounded-full msg-skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-28 msg-skeleton rounded" />
            <div className="h-3 w-44 msg-skeleton rounded" />
          </div>
          <div className="h-3 w-12 msg-skeleton rounded" />
        </div>
      ))}
    </div>
  );
}

function SkeletonMessages() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-start">
        <div className="h-12 w-52 msg-skeleton" />
      </div>
      <div className="flex justify-end">
        <div className="h-12 w-44 msg-skeleton" />
      </div>
      <div className="flex justify-start">
        <div className="h-12 w-60 msg-skeleton" />
      </div>
      <div className="flex justify-end">
        <div className="h-16 w-48 msg-skeleton" />
      </div>
      <div className="flex justify-start">
        <div className="h-12 w-36 msg-skeleton" />
      </div>
    </div>
  );
}

function shouldShowDateSeparator(
  messages: Message[],
  index: number
): boolean {
  if (index === 0) return true;
  const curr = new Date(messages[index].created_at).toDateString();
  const prev = new Date(messages[index - 1].created_at).toDateString();
  return curr !== prev;
}

export function MessagesPageClient() {
  const searchParams = useSearchParams();
  const threadParam = searchParams.get("thread");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [profile, setProfile] = useState<{
    userId: string;
    orgId: string | null;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

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
      .then((d) => setProfile({ userId: d.userId, orgId: d.orgId }));
    refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    if (threadParam && threads.length > 0) {
      const t = threads.find((x) => x.id === threadParam);
      if (t) setSelectedThread(t);
    }
  }, [threadParam, threads]);

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.otherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="mx-auto flex h-[calc(100vh-72px)] max-w-7xl overflow-hidden">
      {/* Thread sidebar */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm",
          "lg:w-[400px] lg:shrink-0",
          selectedThread && "hidden lg:flex"
        )}
      >
        {/* Sidebar header */}
        <div className="flex flex-col border-b border-slate-100 dark:border-slate-800/80 p-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-600/20">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Messages
              </h1>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 transition-colors"
                aria-label="New message"
              >
                <SquarePen className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/50 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/15"
            />
          </div>

          {/* Filter pills */}
          <div className="mt-3 flex gap-1.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200",
                  activeFilter === f
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto chat-scroll">
          {!threadsLoaded ? (
            <SkeletonThreads />
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center mb-4">
                <MessageCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              {threads.length === 0 ? (
                <>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    No conversations yet
                  </p>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4 max-w-[260px] leading-relaxed">
                    Connect with peers to start messaging and collaborating.
                  </p>
                  <Link
                    href="/dashboard/connections"
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/30 transition-all"
                  >
                    Find peers
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No conversations match your search.
                </p>
              )}
            </div>
          ) : (
            <div className="py-1.5 px-2">
              {filteredThreads.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedThread(t)}
                  className="thread-row-in w-full mb-0.5"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                      selectedThread?.id === t.id
                        ? "bg-emerald-50/80 dark:bg-emerald-500/10 ring-1 ring-emerald-200/50 dark:ring-emerald-500/20"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <AvatarCircle
                      src={t.otherProfileImageUrl ?? t.otherLogoUrl}
                      name={t.otherName}
                      size="md"
                      showOnline
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "font-semibold text-sm truncate",
                            selectedThread?.id === t.id
                              ? "text-emerald-900 dark:text-emerald-100"
                              : "text-slate-900 dark:text-slate-100"
                          )}
                        >
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
      </div>

      {/* Conversation area */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0",
          !selectedThread && "hidden lg:flex"
        )}
      >
        {selectedThread ? (
          <ConversationPanel
            thread={selectedThread}
            profile={profile}
            onBack={() => setSelectedThread(null)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50/50 via-white to-emerald-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/5">
            <div className="max-w-xs">
              <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/15 dark:to-teal-500/15 flex items-center justify-center mb-5">
                <MessageCircle className="h-9 w-9 text-emerald-600/60 dark:text-emerald-400/60" />
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-base font-semibold tracking-tight">
                Select a conversation
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1.5 leading-relaxed">
                Choose a conversation from the list to view messages and start chatting.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationPanel({
  thread,
  profile,
  onBack,
}: {
  thread: Thread;
  profile: { userId: string; orgId: string | null } | null;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/chat/threads/${thread.id}/messages`);
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages ?? []);
      setMessagesLoaded(true);
    }
  }, [thread.id]);

  useEffect(() => {
    setMessagesLoaded(false);
    setMessages([]);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${thread.id}`,
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
  }, [thread.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [thread.id]);

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
      const res = await fetch(`/api/chat/threads/${thread.id}/messages`, {
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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const otherAvatar =
    thread.otherProfileImageUrl ?? thread.otherLogoUrl ?? null;

  return (
    <>
      {/* Conversation header */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 px-5 py-3 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden p-1.5 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <AvatarCircle
          src={otherAvatar}
          name={thread.otherName}
          size="md"
          showOnline
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">
            {thread.otherName}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Active now
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="Voice call"
          >
            <Phone className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="Video call"
          >
            <Video className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="Conversation info"
          >
            <Info className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto chat-scroll px-6 py-4 space-y-1 min-h-0 bg-gradient-to-b from-slate-50/30 via-white to-white dark:from-slate-900/30 dark:via-slate-900 dark:to-slate-900">
        {!messagesLoaded ? (
          <SkeletonMessages />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-4">
              <Send className="h-7 w-7 text-emerald-600 dark:text-emerald-400 -rotate-12" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Start your conversation with{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {thread.otherName}
              </span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Send a message below to get started
            </p>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const fromMe = isFromMe(m);
              const showDateSep = shouldShowDateSeparator(messages, i);
              const showAvatar =
                !fromMe &&
                (i === 0 ||
                  isFromMe(messages[i - 1]) ||
                  showDateSep);
              const isLastInGroup =
                i === messages.length - 1 ||
                isFromMe(messages[i + 1]) !== fromMe ||
                shouldShowDateSeparator(messages, i + 1);

              return (
                <div key={m.id}>
                  {showDateSep && (
                    <div className="flex items-center justify-center py-4">
                      <span className="px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-medium text-slate-500 dark:text-slate-400 backdrop-blur-sm">
                        {formatDateSeparator(m.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex msg-bubble-in",
                      fromMe ? "justify-end" : "justify-start",
                      !isLastInGroup && "mb-0.5"
                    )}
                    style={{
                      animationDelay: `${Math.min(i * 20, 300)}ms`,
                    }}
                  >
                    {!fromMe && (
                      <div className="w-8 shrink-0 self-end mr-2">
                        {showAvatar && (
                          <AvatarCircle
                            src={otherAvatar}
                            name={thread.otherName}
                            size="sm"
                          />
                        )}
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[65%] px-4 py-2.5 text-sm leading-relaxed group relative",
                        fromMe
                          ? cn(
                              "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-600/10",
                              isLastInGroup
                                ? "rounded-2xl rounded-br-md"
                                : "rounded-2xl"
                            )
                          : cn(
                              "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100",
                              isLastInGroup
                                ? "rounded-2xl rounded-bl-md"
                                : "rounded-2xl"
                            )
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {m.content}
                      </p>
                      {isLastInGroup && (
                        <p
                          className={cn(
                            "text-[10px] mt-1 tabular-nums",
                            fromMe
                              ? "text-emerald-200/70"
                              : "text-slate-400 dark:text-slate-500"
                          )}
                        >
                          {formatMessageTime(m.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-end gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-2 msg-input-focus transition-all duration-200">
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 mb-1"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
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
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none py-1.5 max-h-[120px] leading-relaxed"
          />
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 mb-1"
            aria-label="Add emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shrink-0 h-9 w-9 shadow-sm shadow-emerald-600/20 disabled:opacity-40 disabled:shadow-none transition-all duration-200 mb-0.5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </>
  );
}
