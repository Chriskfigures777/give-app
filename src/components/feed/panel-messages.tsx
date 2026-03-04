"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  Send,
  MessageCircle,
  ChevronLeft,
  ArrowUpRight,
  Loader2,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// BANKGO-matching dark palette
const SB = {
  card:      "#181c26",
  cardHover: "#1e2330",
  border:    "rgba(255,255,255,0.06)",
  text:      "#eef0f6",
  textMuted: "#8891a5",
  textDim:   "#565e72",
  accent:    "#34d399",
  accentDim: "rgba(52,211,153,0.12)",
  inputBg:   "#12151c",
} as const;

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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AvatarMini({
  src,
  name,
  size = "sm",
  showOnline = false,
}: {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md";
  showOnline?: boolean;
}) {
  const sizePx = { xs: "h-6 w-6 text-[8px]", sm: "h-9 w-9 text-[10px]", md: "h-10 w-10 text-xs" };
  return (
    <div className={cn("relative shrink-0", sizePx[size])}>
      <div
        className={cn("h-full w-full rounded-full overflow-hidden", sizePx[size])}
        style={{ background: `linear-gradient(135deg, ${SB.accentDim}, rgba(13,148,136,0.15))` }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-semibold" style={{ color: SB.accent }}>
            {getInitials(name)}
          </span>
        )}
      </div>
      {showOnline && (
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border" style={{ background: "#22c55e", borderColor: SB.card }} />
      )}
    </div>
  );
}

export function PanelMessages() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [profile, setProfile] = useState<{ userId: string; orgId: string | null } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshThreads = useCallback(() => {
    fetch("/api/chat/threads")
      .then((r) => r.json())
      .then((d) => {
        setThreads(d.threads ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setProfile({ userId: d.userId, orgId: d.orgId }))
      .catch(() => {});
    refreshThreads();
  }, [refreshThreads]);

  const filteredThreads = threads.filter(
    (t) =>
      !searchQuery ||
      t.otherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2.5 animate-pulse">
            <div className="h-9 w-9 rounded-full shrink-0" style={{ background: SB.cardHover }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded-lg" style={{ background: SB.cardHover }} />
              <div className="h-2.5 w-36 rounded-lg" style={{ background: SB.inputBg }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (selectedThread) {
    return (
      <CompactConversation
        thread={selectedThread}
        profile={profile}
        onBack={() => setSelectedThread(null)}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: SB.textMuted }} />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/20"
            style={{
              background: SB.inputBg,
              border: `1px solid ${SB.border}`,
              color: SB.text,
            }}
          />
        </div>
      </div>

      {/* Thread list */}
      {filteredThreads.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: SB.accentDim }}>
            <MessageCircle className="h-5 w-5" style={{ color: SB.accent }} />
          </div>
          {threads.length === 0 ? (
            <>
              <p className="text-sm font-medium" style={{ color: SB.textMuted }}>No conversations yet</p>
              <p className="mt-1 text-xs" style={{ color: SB.textMuted }}>
                Connect with peers to start messaging
              </p>
              <Link
                href="/dashboard/connections"
                className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:shadow-md"
                style={{ background: "linear-gradient(to right, #10b981, #0d9488)" }}
              >
                Find peers
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </>
          ) : (
            <p className="text-sm" style={{ color: SB.textMuted }}>No matches found</p>
          )}
        </div>
      ) : (
        <div className="px-2 py-1">
          {filteredThreads.map((t, i) => (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => setSelectedThread(t)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <AvatarMini
                src={t.otherProfileImageUrl ?? t.otherLogoUrl}
                name={t.otherName}
                size="sm"
                showOnline
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-sm font-semibold" style={{ color: SB.text }}>
                    {t.otherName}
                  </p>
                  {t.lastMessageAt && (
                    <span className="shrink-0 text-[10px] tabular-nums" style={{ color: SB.textMuted }}>
                      {formatThreadDate(t.lastMessageAt)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs" style={{ color: SB.textMuted }}>
                  {t.lastMessagePreview ?? "No messages yet"}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Full messages link */}
      <div className="px-3 py-3" style={{ borderTop: `1px solid ${SB.border}` }}>
        <Link
          href="/messages"
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors"
          style={{ background: SB.inputBg, color: SB.textMuted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; (e.currentTarget as HTMLElement).style.color = SB.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = SB.inputBg; (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Open full messages
        </Link>
      </div>
    </div>
  );
}

function CompactConversation({
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
      .channel(`panel-chat:${thread.id}`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const senderType = profile?.orgId ? "organization" : "user";
    const senderId = profile?.orgId ?? profile?.userId ?? "";
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
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
          prev.map((m) => (m.id === optimistic.id ? inserted : m))
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const isFromMe = (m: Message) =>
    (m.sender_type === "user" && m.sender_id === profile?.userId) ||
    (m.sender_type === "organization" &&
      !!profile?.orgId &&
      m.sender_id === profile.orgId);

  const otherAvatar =
    thread.otherProfileImageUrl ?? thread.otherLogoUrl ?? null;

  return (
    <div className="flex h-full flex-col" style={{ maxHeight: "calc(100vh - 310px)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${SB.border}` }}>
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{ color: SB.textMuted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <AvatarMini src={otherAvatar} name={thread.otherName} size="sm" showOnline />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: SB.text }}>
            {thread.otherName}
          </p>
          <p className="text-[10px] font-medium" style={{ color: SB.accent }}>Active now</p>
        </div>
        <Link
          href={`/messages?thread=${thread.id}`}
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: SB.textMuted }}
          title="Open full view"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-0">
        {!messagesLoaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: SB.accent }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Send className="h-6 w-6 -rotate-12 mb-2" style={{ color: SB.textMuted }} />
            <p className="text-xs" style={{ color: SB.textMuted }}>
              Start chatting with{" "}
              <span className="font-semibold" style={{ color: SB.text }}>{thread.otherName}</span>
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const fromMe = isFromMe(m);
            return (
              <div
                key={m.id}
                className={cn("flex", fromMe ? "justify-end" : "justify-start")}
              >
                {!fromMe && (
                  <div className="mr-1.5 self-end shrink-0">
                    <AvatarMini src={otherAvatar} name={thread.otherName} size="xs" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                    fromMe
                      ? "rounded-br-md"
                      : "rounded-bl-md"
                  )}
                  style={
                    fromMe
                      ? { background: "linear-gradient(135deg, #059669, #0d9488)", color: "#fff" }
                      : { background: SB.cardHover, color: SB.text }
                  }
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className="text-[9px] mt-0.5 tabular-nums"
                    style={{ color: fromMe ? "rgba(255,255,255,0.6)" : SB.textMuted }}
                  >
                    {formatMessageTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 shrink-0" style={{ borderTop: `1px solid ${SB.border}` }}>
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-1.5"
          style={{ border: `1px solid ${SB.border}`, background: SB.inputBg }}
        >
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message..."
            rows={1}
            className="flex-1 bg-transparent text-xs resize-none outline-none py-1 max-h-[80px] leading-relaxed"
            style={{ color: SB.text }}
          />
          <button
            type="button"
            className="mb-0.5 p-1 transition-colors"
            style={{ color: SB.textMuted }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = SB.textMuted; }}
          >
            <Smile className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #059669, #0d9488)" }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
