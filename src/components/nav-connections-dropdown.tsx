"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { MessageSquare, ExternalLink, ArrowRight, Users } from "lucide-react";

type Connection = {
  id: string;
  side_a_id: string;
  side_a_type: string;
  side_b_id: string;
  side_b_type: string;
  threadId: string | null;
  otherName: string;
  otherOrgSlug: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
};

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, type: "spring" as const, stiffness: 300, damping: 24 },
  }),
};

function SkeletonLoader() {
  return (
    <div className="px-4 py-3 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded-lg bg-slate-100" />
            <div className="h-3 w-1/3 rounded-lg bg-slate-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NavConnectionsDropdown({ open, onClose, anchorRef }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/peers/connections")
        .then((r) => r.json())
        .then((d) => setConnections(d.connections ?? []))
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
          className="absolute right-0 top-full z-[100] mt-2.5 w-[340px] overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
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
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {loading ? (
              <SkeletonLoader />
            ) : connections.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-3 px-4 py-10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                  <Users className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">No peers yet</p>
                  <Link
                    href="/dashboard/connections"
                    className="mt-1 inline-block text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    onClick={onClose}
                  >
                    Find peers
                  </Link>
                </div>
              </motion.div>
            ) : (
              <ul className="py-1">
                {connections.map((c, i) => (
                  <motion.li
                    key={c.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    className="border-b border-slate-50/80 last:border-0"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors duration-150">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{c.otherName}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {c.otherOrgSlug && (
                            <Link
                              href={`/org/${c.otherOrgSlug}`}
                              onClick={onClose}
                              className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Visit
                            </Link>
                          )}
                          {c.threadId && (
                            <button
                              type="button"
                              onClick={() => handleMessage(c.threadId!)}
                              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Message
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
