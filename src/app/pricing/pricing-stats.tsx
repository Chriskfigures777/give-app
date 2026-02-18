"use client";

import { motion } from "motion/react";
import { Heart, Users, DollarSign, TrendingUp } from "lucide-react";
import type { PlatformStats } from "@/lib/platform-stats";

function formatDollars(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return `$${Math.round(dollars).toLocaleString()}`;
}

export function PricingStats({ stats }: { stats: PlatformStats }) {
  const items = [
    {
      icon: Users,
      value: stats.totalOrganizations.toLocaleString(),
      label: "Organizations",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      icon: Heart,
      value: stats.totalDonations.toLocaleString(),
      label: "Donations processed",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: DollarSign,
      value: formatDollars(stats.totalDonatedCents),
      label: "Total donated",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: TrendingUp,
      value: stats.uniqueDonors.toLocaleString(),
      label: "Unique givers",
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <section className="relative bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Real-time platform data
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Give by the numbers
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="landing-card group flex items-center gap-5 p-6"
            >
              <div
                className={`inline-flex shrink-0 rounded-2xl bg-gradient-to-br ${item.gradient} p-3 shadow-lg`}
              >
                <item.icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {item.value}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
