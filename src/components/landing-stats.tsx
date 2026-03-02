"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { TrendingUp, Users, DollarSign, Heart } from "lucide-react";
import type { PlatformStats } from "@/lib/platform-stats";

type StatItem = {
  value: number;
  suffix: string;
  label: string;
  icon: typeof Heart;
  color: string;
  decimals?: number;
};

function buildStats(stats: PlatformStats): StatItem[] {
  const totalDollars = stats.totalDonatedCents / 100;

  let donationValue: number;
  let donationSuffix: string;
  if (totalDollars >= 1_000_000) {
    donationValue = parseFloat((totalDollars / 1_000_000).toFixed(1));
    donationSuffix = "M";
  } else if (totalDollars >= 1_000) {
    donationValue = parseFloat((totalDollars / 1_000).toFixed(1));
    donationSuffix = "k";
  } else {
    donationValue = Math.round(totalDollars);
    donationSuffix = "";
  }

  return [
    {
      value: stats.totalDonations,
      suffix: "",
      label: "Donations processed",
      icon: Heart,
      color: "from-emerald-500 to-teal-500",
    },
    {
      value: stats.totalOrganizations,
      suffix: "",
      label: "Organizations",
      icon: Users,
      color: "from-cyan-500 to-blue-500",
    },
    {
      value: donationValue,
      suffix: donationSuffix,
      label: "Total donated",
      icon: DollarSign,
      color: "from-violet-500 to-purple-500",
      decimals: donationSuffix ? 1 : 0,
    },
    {
      value: stats.uniqueDonors,
      suffix: "",
      label: "Unique givers",
      icon: TrendingUp,
      color: "from-amber-500 to-orange-500",
    },
  ];
}

function AnimatedStat({
  target,
  suffix,
  label,
  icon: Icon,
  color,
  index,
  prefix,
  decimals = 0,
}: {
  target: number;
  suffix: string;
  label: string;
  icon: typeof Heart;
  color: string;
  index: number;
  prefix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1800;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.06]"
    >
      <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${color} p-3 shadow-lg`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {prefix}
        {formatted}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-white/50">{label}</p>
      <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/[0.02] transition-all duration-500 group-hover:scale-150 group-hover:bg-white/[0.04]" />
    </motion.div>
  );
}

export function LandingStats({ stats }: { stats: PlatformStats }) {
  const dynamicStats = buildStats(stats);

  return (
    <section className="relative overflow-hidden bg-slate-950 py-28 md:py-36">
      <div className="orb orb-emerald absolute -left-48 top-0 h-[600px] w-[600px]" />
      <div className="orb orb-cyan absolute -right-32 bottom-0 h-[500px] w-[500px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            By the numbers
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Trusted by organizations everywhere
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Real numbers, real impact. Here&apos;s what Give has accomplished since launch.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dynamicStats.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              target={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              icon={stat.icon}
              color={stat.color}
              index={i}
              prefix={stat.label === "Total donated" ? "$" : undefined}
              decimals={stat.decimals}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
