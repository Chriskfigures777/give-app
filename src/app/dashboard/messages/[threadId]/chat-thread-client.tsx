"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  DollarSign,
  X,
  Handshake,
  Check,
  XCircle,
  Smile,
  Paperclip,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FUND_REQUESTS_ENABLED, SPLITS_ENABLED } from "@/lib/feature-flags";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();
const CACHE_KEY_PLATFORM = "__platform__";

function getStripePromise(
  stripeConnectAccountId?: string | null
): Promise<Stripe | null> | null {
  if (typeof window === "undefined") return null;
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) return null;
  const key = stripeConnectAccountId ?? CACHE_KEY_PLATFORM;
  let p = stripePromiseCache.get(key);
  if (!p) {
    p = stripeConnectAccountId
      ? loadStripe(pk, { stripeAccount: stripeConnectAccountId })
      : loadStripe(pk);
    stripePromiseCache.set(key, p);
  }
  return p;
}

type Message = {
  id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
};
type FundRequest = {
  id: string;
  amount_cents: number;
  description: string | null;
  status: string;
  fulfilled_amount_cents: number;
};
type SplitProposal = {
  id: string;
  thread_id: string;
  proposer_org_id: string;
  amount_cents: number;
  split_percentages: [number, number];
  description: string | null;
  proposer_accepted_at: string | null;
  recipient_accepted_at: string | null;
  status: string;
  created_at: string | null;
};

type Props = {
  threadId: string;
  otherName: string;
  orgId: string | null;
  otherOrgId: string | null;
  isOrgOwner: boolean;
  userId: string;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
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
    </div>
  );
}

export function ChatThreadClient({
  threadId,
  otherName,
  orgId,
  otherOrgId,
  isOrgOwner,
  userId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [splitProposals, setSplitProposals] = useState<SplitProposal[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFundForm, setShowFundForm] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundDescription, setFundDescription] = useState("");
  const [showSplitForm, setShowSplitForm] = useState(false);
  const [splitAmount, setSplitAmount] = useState("");
  const [splitProposerPct, setSplitProposerPct] = useState("50");
  const [splitDescription, setSplitDescription] = useState("");
  const [donateModal, setDonateModal] = useState<{
    fundRequestId: string;
    clientSecret: string;
    amountCents: number;
    stripeConnectAccountId?: string | null;
  } | null>(null);
  const [donateEmail, setDonateEmail] = useState("");
  const [donateAmount, setDonateAmount] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const isOrgToOrg = !!orgId && !!otherOrgId;

  const loadMessages = async () => {
    const res = await fetch(`/api/chat/threads/${threadId}/messages`);
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages ?? []);
      setMessagesLoaded(true);
    }
  };

  const loadFundRequests = async () => {
    const { data } = await supabase
      .from("fund_requests")
      .select(
        "id, amount_cents, description, status, fulfilled_amount_cents"
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(50);
    setFundRequests((data ?? []) as FundRequest[]);
  };

  const loadSplitProposals = async () => {
    if (!isOrgToOrg) return;
    const { data } = await supabase
      .from("split_proposals")
      .select(
        "id, thread_id, proposer_org_id, amount_cents, split_percentages, description, proposer_accepted_at, recipient_accepted_at, status, created_at"
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(50);
    setSplitProposals((data ?? []) as SplitProposal[]);
  };

  useEffect(() => {
    loadMessages();
    loadFundRequests();
    loadSplitProposals();
  }, [threadId, isOrgToOrg]);

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
        () => loadMessages()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "split_proposals",
          filter: `thread_id=eq.${threadId}`,
        },
        () => loadSplitProposals()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, supabase]);

  const handleCreateSplitProposal = async () => {
    const cents = Math.round(parseFloat(splitAmount) * 100);
    if (!cents || cents < 100) return;
    const proposerPct = Math.min(
      100,
      Math.max(0, parseInt(splitProposerPct, 10) || 50)
    );
    const recipientPct = 100 - proposerPct;
    setLoading(true);
    try {
      const res = await fetch("/api/chat/split-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          amountCents: cents,
          splitPercentages: [proposerPct, recipientPct] as [number, number],
          description: splitDescription.trim() || undefined,
        }),
      });
      if (res.ok) {
        setShowSplitForm(false);
        setSplitAmount("");
        setSplitProposerPct("50");
        setSplitDescription("");
        loadSplitProposals();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to propose split");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSplitProposal = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/split-proposals/${id}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        loadSplitProposals();
      } else {
        toast.error(data.error ?? "Failed to accept");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSplitProposal = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/split-proposals/${id}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        loadSplitProposals();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to reject");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage.trim(),
          senderType: orgId ? "organization" : "user",
        }),
      });
      if (res.ok) {
        setNewMessage("");
        loadMessages();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFundRequest = async () => {
    const cents = Math.round(parseFloat(fundAmount) * 100);
    if (!cents || cents < 100) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat/fund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          amountCents: cents,
          description: fundDescription.trim() || undefined,
        }),
      });
      if (res.ok) {
        setShowFundForm(false);
        setFundAmount("");
        setFundDescription("");
        loadFundRequests();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDonateClick = async (fr: {
    id: string;
    amount_cents: number;
  }) => {
    const amountCents =
      Math.round(
        parseFloat(donateAmount || String(fr.amount_cents / 100)) * 100
      ) || fr.amount_cents;
    const email = donateEmail.trim();
    if (!email) {
      setDonateModal({
        fundRequestId: fr.id,
        clientSecret: "",
        amountCents,
      });
      setDonateAmount(String(fr.amount_cents / 100));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/fund-requests/${fr.id}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          donorEmail: email,
          isAnonymous: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.clientSecret) {
        setDonateModal({
          fundRequestId: fr.id,
          clientSecret: data.clientSecret,
          amountCents,
          stripeConnectAccountId: data.stripeConnectAccountId ?? null,
        });
      } else {
        toast.error(data.error ?? "Failed to start donation");
      }
    } finally {
      setLoading(false);
    }
  };

  const openDonateModal = (fr: FundRequest) => {
    setDonateEmail("");
    setDonateAmount(String(fr.amount_cents / 100));
    setDonateModal({
      fundRequestId: fr.id,
      clientSecret: "",
      amountCents: fr.amount_cents,
    });
  };

  const isFromMe = (m: Message) =>
    (m.sender_type === "user" && m.sender_id === userId) ||
    (m.sender_type === "organization" &&
      !!orgId &&
      m.sender_id === orgId);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="w-full min-w-0 max-w-4xl mx-auto overflow-x-hidden">
      <div className="px-4 py-6">
        {/* Back link */}
        <Link
          href="/dashboard/messages"
          className="inline-flex items-center gap-2 text-sm text-dashboard-text-muted hover:text-dashboard-text transition-colors mb-5 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to messages
        </Link>

        {/* Header */}
        <header className="mb-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-500/20 dark:to-teal-500/20 ring-1 ring-black/[0.04] dark:ring-white/[0.06] flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {getInitials(otherName)}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-dashboard-text">
              {otherName}
            </h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              Active now
            </p>
          </div>
        </header>

        {/* Chat card */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
          {/* Messages area */}
          <div className="h-[420px] overflow-y-auto chat-scroll px-5 py-4 space-y-1.5 bg-gradient-to-b from-slate-50/30 via-white to-white dark:from-slate-900/30 dark:via-[hsl(var(--dashboard-card))] dark:to-[hsl(var(--dashboard-card))]">
            {!messagesLoaded ? (
              <SkeletonMessages />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-dashboard-text-muted">
                  Start your conversation with {otherName}
                </p>
                <p className="text-xs text-dashboard-text-muted mt-1 opacity-60">
                  Send a message below to get started
                </p>
              </div>
            ) : (
              messages.map((m, i) => {
                const fromMe = isFromMe(m);
                const isLastInGroup =
                  i === messages.length - 1 ||
                  isFromMe(messages[i + 1]) !== fromMe;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex msg-bubble-in",
                      fromMe ? "justify-end" : "justify-start",
                      !isLastInGroup && "mb-0.5"
                    )}
                    style={{
                      animationDelay: `${Math.min(i * 20, 300)}ms`,
                    }}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] px-4 py-2.5 text-sm leading-relaxed",
                        fromMe
                          ? cn(
                              "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-600/10",
                              isLastInGroup
                                ? "rounded-2xl rounded-br-md"
                                : "rounded-2xl"
                            )
                          : cn(
                              "bg-slate-100 dark:bg-slate-700/50 text-dashboard-text",
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
                              : "text-dashboard-text-muted opacity-60"
                          )}
                        >
                          {formatMessageTime(m.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Split proposals section */}
          {SPLITS_ENABLED && isOrgToOrg && splitProposals.length > 0 && (
            <div className="border-t border-dashboard-border p-4 space-y-3 bg-gradient-to-b from-transparent to-emerald-500/[0.02]">
              <h3 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider flex items-center gap-2">
                <Handshake className="h-3.5 w-3.5 text-emerald-500" />
                Split Proposals
              </h3>
              {splitProposals.map((sp) => {
                const percents = sp.split_percentages ?? [50, 50];
                const isProposer = sp.proposer_org_id === orgId;
                const canAccept =
                  sp.status === "proposed" &&
                  ((isProposer && !sp.proposer_accepted_at) ||
                    (!isProposer && !sp.recipient_accepted_at));
                const isMutuallyAgreed = sp.status === "mutually_agreed";
                const isRejected = sp.status === "rejected";
                return (
                  <div
                    key={sp.id}
                    className={cn(
                      "rounded-xl border p-3.5 transition-all duration-200",
                      isMutuallyAgreed
                        ? "border-emerald-300/50 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/[0.06]"
                        : isRejected
                          ? "border-red-200/50 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/[0.04] opacity-60"
                          : "border-dashboard-border bg-dashboard-card"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-dashboard-text font-semibold text-sm">
                          ${(sp.amount_cents / 100).toFixed(2)}{" "}
                          <span className="font-normal text-dashboard-text-muted">
                            split {percents[0]}% / {percents[1]}%
                          </span>
                        </p>
                        {sp.description && (
                          <p className="text-xs text-dashboard-text-muted mt-0.5 leading-relaxed">
                            {sp.description}
                          </p>
                        )}
                        <p className="text-[11px] text-dashboard-text-muted mt-1.5 leading-relaxed">
                          {isProposer ? "You proposed" : `${otherName} proposed`}
                          {sp.proposer_accepted_at && " · Proposer accepted"}
                          {sp.recipient_accepted_at && " · Recipient accepted"}
                          {isMutuallyAgreed && " · Both agreed — ready to create split"}
                          {isRejected && " · Rejected"}
                        </p>
                      </div>
                      {canAccept && (
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAcceptSplitProposal(sp.id)
                            }
                            disabled={loading}
                            className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-xs h-8 px-3 shadow-sm shadow-emerald-600/20"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRejectSplitProposal(sp.id)
                            }
                            disabled={loading}
                            className="rounded-lg text-xs h-8 px-3"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Propose split form */}
          {SPLITS_ENABLED && isOrgToOrg && isOrgOwner && (
            <div className="border-t border-dashboard-border p-4">
              <p className="text-[11px] text-dashboard-text-muted mb-2.5 leading-relaxed">
                Split transfers require mutual agreement. Propose a split,
                discuss, then both accept.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSplitForm(!showSplitForm)}
                className="rounded-xl text-xs h-8 mb-2"
              >
                <Handshake className="h-3.5 w-3.5 mr-1.5" />
                Propose split
              </Button>
              {showSplitForm && (
                <div className="mt-3 space-y-2.5 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/40">
                  <input
                    type="number"
                    placeholder="Amount (USD)"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    className="w-full rounded-xl border border-dashboard-border bg-white dark:bg-[hsl(var(--dashboard-input-bg))] px-3.5 py-2.5 text-sm text-dashboard-text outline-none transition-all focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-dashboard-text-muted font-medium">
                      Your share
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={splitProposerPct}
                      onChange={(e) => setSplitProposerPct(e.target.value)}
                      className="w-16 rounded-lg border border-dashboard-border bg-white dark:bg-[hsl(var(--dashboard-input-bg))] px-2 py-1.5 text-sm text-dashboard-text text-center outline-none transition-all focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/10"
                    />
                    <span className="text-xs text-dashboard-text-muted">
                      % /{" "}
                      {100 - (parseInt(splitProposerPct, 10) || 50)}%
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={splitDescription}
                    onChange={(e) => setSplitDescription(e.target.value)}
                    className="w-full rounded-xl border border-dashboard-border bg-white dark:bg-[hsl(var(--dashboard-input-bg))] px-3.5 py-2.5 text-sm text-dashboard-text outline-none transition-all focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <Button
                    onClick={handleCreateSplitProposal}
                    disabled={loading}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-sm shadow-emerald-600/20"
                  >
                    Propose split
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Fund requests */}
          {FUND_REQUESTS_ENABLED && fundRequests.length > 0 && (
            <div className="border-t border-dashboard-border p-4 space-y-3">
              <h3 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                Fund Requests
              </h3>
              {fundRequests.map((fr) => {
                const progress = Math.min(
                  100,
                  (fr.fulfilled_amount_cents / fr.amount_cents) * 100
                );
                return (
                  <div
                    key={fr.id}
                    className="rounded-xl border border-dashboard-border bg-dashboard-card p-3.5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-dashboard-text">
                          ${(fr.amount_cents / 100).toFixed(2)}{" "}
                          <span className="font-normal text-dashboard-text-muted">
                            requested
                          </span>
                        </p>
                        {fr.description && (
                          <p className="text-xs text-dashboard-text-muted mt-0.5">
                            {fr.description}
                          </p>
                        )}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[11px] text-dashboard-text-muted mb-1">
                            <span>
                              ${(fr.fulfilled_amount_cents / 100).toFixed(0)} /{" "}
                              ${(fr.amount_cents / 100).toFixed(0)}
                            </span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {fr.status === "open" && !isOrgOwner && (
                        <Button
                          size="sm"
                          onClick={() => openDonateModal(fr)}
                          disabled={loading}
                          className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-xs h-8 px-3 shadow-sm shadow-emerald-600/20 shrink-0"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Donate
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create fund request */}
          {FUND_REQUESTS_ENABLED && isOrgOwner && !isOrgToOrg && (
            <div className="border-t border-dashboard-border p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFundForm(!showFundForm)}
                className="rounded-xl text-xs h-8 mb-2"
              >
                <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                Request funds
              </Button>
              {showFundForm && (
                <div className="mt-3 space-y-2.5 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/40">
                  <input
                    type="number"
                    placeholder="Amount (USD)"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full rounded-xl border border-dashboard-border bg-white dark:bg-[hsl(var(--dashboard-input-bg))] px-3.5 py-2.5 text-sm text-dashboard-text outline-none transition-all focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={fundDescription}
                    onChange={(e) => setFundDescription(e.target.value)}
                    className="w-full rounded-xl border border-dashboard-border bg-white dark:bg-[hsl(var(--dashboard-input-bg))] px-3.5 py-2.5 text-sm text-dashboard-text outline-none transition-all focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <Button
                    onClick={handleCreateFundRequest}
                    disabled={loading}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-sm shadow-emerald-600/20"
                  >
                    Create request
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Message input */}
          <div className="border-t border-dashboard-border p-4">
            <div className="flex items-end gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-2 msg-input-focus transition-all duration-200">
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
                placeholder="Type a message..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-dashboard-text placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none py-1.5 max-h-[120px] leading-relaxed"
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
                disabled={loading || !newMessage.trim()}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shrink-0 h-9 w-9 shadow-sm shadow-emerald-600/20 disabled:opacity-40 disabled:shadow-none transition-all duration-200 mb-0.5"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Donate modal */}
        {donateModal && (
          <DonateModal
            fundRequestId={donateModal.fundRequestId}
            clientSecret={donateModal.clientSecret}
            amountCents={donateModal.amountCents}
            stripeConnectAccountId={donateModal.stripeConnectAccountId}
            donateEmail={donateEmail}
            setDonateEmail={setDonateEmail}
            donateAmount={donateAmount}
            setDonateAmount={setDonateAmount}
            onClose={() => setDonateModal(null)}
            onSuccess={() => {
              setDonateModal(null);
              loadFundRequests();
            }}
            handleDonateClick={handleDonateClick}
          />
        )}
      </div>
    </div>
  );
}

function DonateModal({
  fundRequestId,
  clientSecret,
  amountCents,
  stripeConnectAccountId,
  donateEmail,
  setDonateEmail,
  donateAmount,
  setDonateAmount,
  onClose,
  onSuccess,
  handleDonateClick,
}: {
  fundRequestId: string;
  clientSecret: string;
  amountCents: number;
  stripeConnectAccountId?: string | null;
  donateEmail: string;
  setDonateEmail: (s: string) => void;
  donateAmount: string;
  setDonateAmount: (s: string) => void;
  onClose: () => void;
  onSuccess: () => void;
  handleDonateClick: (fr: {
    id: string;
    amount_cents: number;
  }) => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  if (!clientSecret) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 chat-slide-up">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6 max-w-md w-full shadow-2xl shadow-black/[0.1]">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-dashboard-text tracking-tight">
                Donate
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-dashboard-text-muted hover:text-dashboard-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={donateEmail}
                onChange={(e) => setDonateEmail(e.target.value)}
                className="w-full rounded-xl border border-dashboard-border bg-slate-50/50 dark:bg-[hsl(var(--dashboard-input-bg))] px-3.5 py-2.5 text-sm text-dashboard-text outline-none transition-all focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/10"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider mb-1.5">
                Amount (USD)
              </label>
              <input
                type="number"
                value={donateAmount}
                onChange={(e) => setDonateAmount(e.target.value)}
                className="w-full rounded-xl border border-dashboard-border bg-slate-50/50 dark:bg-[hsl(var(--dashboard-input-bg))] px-3.5 py-2.5 text-sm text-dashboard-text outline-none transition-all focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/10"
                placeholder="100"
              />
            </div>
            <Button
              onClick={() =>
                handleDonateClick({
                  id: fundRequestId,
                  amount_cents: amountCents,
                })
              }
              disabled={loading || !donateEmail.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 h-11 text-sm font-semibold shadow-sm shadow-emerald-600/20"
            >
              Continue to payment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 chat-slide-up">
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/[0.1]">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-dashboard-text tracking-tight">
              Complete donation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dashboard-text-muted hover:text-dashboard-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {(() => {
          const stripePromise = getStripePromise(stripeConnectAccountId);
          return (
            stripePromise && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: "stripe" },
                }}
              >
                <DonatePaymentForm
                  onSuccess={onSuccess}
                  onCancel={onClose}
                />
              </Elements>
            )
          );
        })()}
      </div>
    </div>
  );
}

function DonatePaymentForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setLoading(true);
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url:
          typeof window !== "undefined" ? window.location.href : "",
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message ?? "Payment failed");
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 p-3 mb-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      <PaymentElement />
      <div className="flex gap-2 mt-5">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 h-11 font-semibold shadow-sm shadow-emerald-600/20"
        >
          {loading ? "Processing..." : "Pay now"}
        </Button>
      </div>
    </form>
  );
}
