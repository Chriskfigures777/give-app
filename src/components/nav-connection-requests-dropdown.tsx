"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ExternalLink, ArrowRight, Handshake, UserCheck, Clock } from "lucide-react";

type IncomingRequest = {
  id: string;
  direction: "incoming";
  organization_name: string;
  organization_slug: string;
  organization_id: string;
  created_at: string;
};

type OutgoingRequest = {
  id: string;
  direction: "outgoing";
  organization_name: string;
  organization_slug: string;
  organization_id: string;
  created_at: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onCountChange?: (count: number) => void;
};

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
  return date.toLocaleDateString();
}

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

function SkeletonLoader() {
  return (
    <div className="px-4 py-3 space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded-lg bg-slate-100" />
            <div className="flex gap-2">
              <div className="h-8 w-16 rounded-lg bg-slate-100" />
              <div className="h-8 w-16 rounded-lg bg-slate-50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NavConnectionRequestsDropdown({
  open,
  onClose,
  anchorRef,
  onCountChange,
}: Props) {
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setLoading(true);
      fetch("/api/peers/pending-requests")
        .then((r) => r.json())
        .then((d) => {
          setIncoming(d.incoming ?? []);
          setOutgoing(d.outgoing ?? []);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (acceptingId || decliningId) return;
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        anchorRef.current?.contains(e.target as Node)
      )
        return;
      onClose();
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [open, onClose, anchorRef, acceptingId, decliningId]);

  const handleAccept = async (id: string) => {
    setError(null);
    setAcceptingId(id);
    try {
      const res = await fetch(`/api/peers/requests/${id}/accept`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIncoming((prev) => {
          const next = prev.filter((r) => r.id !== id);
          onCountChange?.(next.length);
          return next;
        });
      } else {
        setError(data.error ?? `Failed to accept (${res.status})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setError(null);
    setDecliningId(id);
    try {
      const res = await fetch(`/api/peers/requests/${id}/decline`, { method: "POST" });
      if (res.ok) {
        setIncoming((prev) => {
          const next = prev.filter((r) => r.id !== id);
          onCountChange?.(next.length);
          return next;
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Failed to decline (${res.status})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decline");
    } finally {
      setDecliningId(null);
    }
  };

  const hasAny = incoming.length > 0 || outgoing.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-[100] mt-2.5 w-[380px] max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3.5">
            <h3 className="text-sm font-semibold text-slate-900">Peers</h3>
            <Link
              href="/dashboard/connections"
              onClick={onClose}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              See all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-3 mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                    <span className="font-medium">{error}</span>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="shrink-0 font-semibold hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <SkeletonLoader />
            ) : !hasAny ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-3 px-4 py-10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                  <Handshake className="h-6 w-6" />
                </div>
                <p className="text-sm text-slate-400">No pending peer requests</p>
              </motion.div>
            ) : (
              <ul className="py-1">
                <AnimatePresence mode="popLayout">
                  {/* Incoming */}
                  {incoming.map((r, i) => (
                    <motion.li
                      key={`in-${r.id}`}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={i}
                      className="border-b border-slate-50/80"
                    >
                      <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50/60 transition-colors duration-150">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <UserCheck className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 leading-snug">
                            <span className="font-semibold">{r.organization_name}</span>{" "}
                            wants to connect
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {r.organization_slug && (
                              <Link
                                href={`/org/${r.organization_slug}`}
                                onClick={onClose}
                                className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Visit page
                              </Link>
                            )}
                            <motion.button
                              type="button"
                              onClick={() => handleAccept(r.id)}
                              disabled={acceptingId !== null || decliningId !== null}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:opacity-50"
                            >
                              {acceptingId === r.id ? "Accepting..." : "Accept"}
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => handleDecline(r.id)}
                              disabled={acceptingId !== null || decliningId !== null}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
                            >
                              {decliningId === r.id ? "Declining..." : "Decline"}
                            </motion.button>
                          </div>
                          <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                            {formatRelativeTime(r.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.li>
                  ))}

                  {/* Outgoing */}
                  {outgoing.map((r, i) => (
                    <motion.li
                      key={`out-${r.id}`}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={incoming.length + i}
                      className="border-b border-slate-50/80 last:border-0"
                    >
                      <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50/60 transition-colors duration-150">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 leading-snug">
                            Pending request to{" "}
                            <span className="font-semibold">{r.organization_name}</span>
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {r.organization_slug && (
                              <Link
                                href={`/org/${r.organization_slug}`}
                                onClick={onClose}
                                className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Visit page
                              </Link>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                            {formatRelativeTime(r.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
