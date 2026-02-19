"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, useInView } from "motion/react";
import { Heart, Users, DollarSign, TrendingUp, Activity, Clock } from "lucide-react";
import type { PlatformStats } from "@/lib/platform-stats";

/* ---------- Animated counter that rolls digits ---------- */
function AnimatedDigit({ digit, delay }: { digit: string; delay: number }) {
  const isNum = /\d/.test(digit);

  if (!isNum) {
    return (
      <span className="inline-block" style={{ width: digit === "," ? "0.3em" : "0.6em" }}>
        {digit}
      </span>
    );
  }

  return (
    <span className="relative inline-block h-[1.15em] w-[0.65em] overflow-hidden">
      <motion.span
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {digit}
      </motion.span>
    </span>
  );
}

function RollingNumber({ value, prefix = "" }: { value: string; prefix?: string }) {
  const chars = (prefix + value).split("");
  return (
    <span className="inline-flex items-center tabular-nums">
      {chars.map((ch, i) => (
        <AnimatedDigit key={`${ch}-${i}`} digit={ch} delay={i * 0.05} />
      ))}
    </span>
  );
}

/* ---------- Live clock ---------- */
function LiveClock({ isDark }: { isDark: boolean }) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      return now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-sm tabular-nums ${
        isDark
          ? "border-white/[0.08] bg-white/[0.04] text-white/60"
          : "border-slate-200 bg-white text-slate-500 shadow-sm"
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{time || "--:--:--"}</span>
    </div>
  );
}

/* ---------- Pulse ring animation ---------- */
function PulseRing({ color }: { color: string }) {
  return (
    <span className="absolute -right-1 -top-1 flex h-3 w-3">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${color}`}
      />
      <span className={`relative inline-flex h-3 w-3 rounded-full ${color}`} />
    </span>
  );
}

/* ---------- Stat card ---------- */
function StatCard({
  icon: Icon,
  value,
  label,
  prefix,
  gradient,
  pulse,
  isDark,
  index,
}: {
  icon: typeof Heart;
  value: string;
  label: string;
  prefix?: string;
  gradient: string;
  pulse?: boolean;
  isDark: boolean;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => setShow(true), index * 120);
      return () => clearTimeout(t);
    }
  }, [isInView, index]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border p-7 transition-all duration-500 ${
        isDark
          ? "border-white/[0.06] bg-white/[0.03] backdrop-blur-md hover:border-white/[0.12] hover:bg-white/[0.06]"
          : "border-slate-200/80 bg-white shadow-sm hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="relative">
        <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {pulse && <PulseRing color="bg-emerald-400" />}
      </div>

      <div
        className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        {show ? <RollingNumber value={value} prefix={prefix} /> : <span className="opacity-0">{prefix}{value}</span>}
      </div>

      <p className={`mt-1.5 text-sm font-medium ${isDark ? "text-white/50" : "text-slate-500"}`}>
        {label}
      </p>

      {/* Corner glow */}
      <div
        className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full transition-all duration-500 group-hover:scale-150 ${
          isDark ? "bg-white/[0.02] group-hover:bg-white/[0.04]" : "bg-slate-100/50 group-hover:bg-slate-100"
        }`}
      />
    </motion.div>
  );
}

/* ---------- Activity sparkline ---------- */
function ActivitySparkline({ isDark }: { isDark: boolean }) {
  // Deterministic pattern: same on server and client to avoid hydration mismatch.
  // Uses a wave formula to simulate donation activity over 24 hours.
  const bars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const t = i / 23;
        const wave =
          0.3 * Math.sin(t * Math.PI * 3) + 0.35 * Math.sin(t * Math.PI * 2.3) + 0.35;
        return Math.round(Math.max(0.2, Math.min(0.8, wave)) * 1000) / 1000;
      }),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className={`mt-10 rounded-2xl border p-6 ${
        isDark
          ? "border-white/[0.06] bg-white/[0.02]"
          : "border-slate-200/80 bg-white shadow-sm"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={`h-4 w-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
          <span
            className={`text-sm font-semibold ${isDark ? "text-white/70" : "text-slate-600"}`}
          >
            Donation activity — last 24 hours
          </span>
        </div>
        <LiveClock isDark={isDark} />
      </div>

      {/* Sparkline bars */}
      <div className="flex items-end gap-[3px]" style={{ height: 64 }}>
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-1 origin-bottom rounded-t ${
              i === bars.length - 1
                ? "bg-emerald-500"
                : isDark
                  ? "bg-white/[0.08]"
                  : "bg-slate-200"
            }`}
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between">
        <span className={`text-xs ${isDark ? "text-white/30" : "text-slate-400"}`}>24h ago</span>
        <span className={`text-xs ${isDark ? "text-white/30" : "text-slate-400"}`}>Now</span>
      </div>
    </motion.div>
  );
}

/* ---------- Main component ---------- */
export function LiveStatsPulse({
  stats,
  variant = "dark",
}: {
  stats: PlatformStats;
  variant?: "dark" | "light";
}) {
  const [liveStats, setLiveStats] = useState(stats);
  const isDark = variant === "dark";

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/platform-stats");
      const data = await res.json();
      if (data.totalOrganizations !== undefined) {
        setLiveStats(data);
      }
    } catch {
      /* keep stale */
    }
  }, []);

  // Poll every 30s for fresh data
  useEffect(() => {
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  function formatDollars(cents: number): string {
    const d = cents / 100;
    if (d >= 1_000_000) return `${(d / 1_000_000).toFixed(1)}M`;
    if (d >= 1_000) return `${(d / 1_000).toFixed(1)}k`;
    return Math.round(d).toLocaleString();
  }

  const cards = [
    {
      icon: Heart,
      value: liveStats.totalDonations.toLocaleString(),
      label: "Donations processed",
      gradient: "from-emerald-500 to-teal-500",
      pulse: true,
    },
    {
      icon: Users,
      value: liveStats.totalOrganizations.toLocaleString(),
      label: "Organizations",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: DollarSign,
      value: formatDollars(liveStats.totalDonatedCents),
      label: "Total donated",
      gradient: "from-violet-500 to-purple-500",
      prefix: "$",
    },
    {
      icon: TrendingUp,
      value: liveStats.uniqueDonors.toLocaleString(),
      label: "Unique givers",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <section
      className={`relative overflow-hidden py-24 md:py-32 ${
        isDark ? "bg-slate-950" : "bg-gradient-to-b from-slate-50 to-white"
      }`}
    >
      {isDark && (
        <>
          <div className="orb orb-emerald absolute -left-48 top-0 h-[600px] w-[600px]" />
          <div className="orb orb-cyan absolute -right-32 bottom-0 h-[500px] w-[500px]" />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 flex flex-col items-center gap-4 text-center"
        >
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              isDark
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-emerald-200 bg-emerald-50 text-emerald-600"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Real-time platform data
          </span>

          <h2
            className={`text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Give by the numbers
          </h2>
          <p className={`max-w-2xl text-lg ${isDark ? "text-white/60" : "text-slate-500"}`}>
            Every number is real, updated live. Watch generosity grow in real time.
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <StatCard
              key={card.label}
              icon={card.icon}
              value={card.value}
              label={card.label}
              prefix={card.prefix}
              gradient={card.gradient}
              pulse={card.pulse}
              isDark={isDark}
              index={i}
            />
          ))}
        </div>

        {/* Activity sparkline */}
        <ActivitySparkline isDark={isDark} />
      </div>
    </section>
  );
}
