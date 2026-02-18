"use client";

import Link from "next/link";
import { Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  goal_amount_cents?: number | null;
  current_amount_cents?: number | null;
  goal_deadline?: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
};

type Props = {
  campaigns: Campaign[];
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function AnimatedProgressBar({
  percent,
  delay = 0,
  variant = "amount",
}: {
  percent: number;
  delay?: number;
  variant?: "amount" | "time";
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const gradient =
    variant === "amount"
      ? "from-emerald-500 via-teal-500 to-emerald-600"
      : "from-violet-500 via-purple-500 to-violet-600";

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-dashboard-card-hover/50">
      <div
        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${gradient} progress-bar-fill`}
        style={
          {
            width: `${clamped}%`,
            "--progress-delay": `${delay}ms`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function CampaignCard({
  campaign,
  index,
}: {
  campaign: Campaign;
  index: number;
}) {
  const goalCents = campaign.goal_amount_cents ?? 0;
  const currentCents = campaign.current_amount_cents ?? 0;
  const amountPercent = goalCents > 0 ? (currentCents / goalCents) * 100 : 0;

  const deadline = campaign.goal_deadline
    ? new Date(campaign.goal_deadline)
    : null;
  const created = campaign.created_at ? new Date(campaign.created_at) : null;
  const now = new Date();

  let timePercent = 0;
  let timeLabel = "";
  let showTimeBar = false;
  if (deadline) {
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) {
      timeLabel = `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`;
    } else if (daysLeft === 0) {
      timeLabel = "Ends today";
    } else {
      timeLabel = "Ended";
    }
    if (created) {
      const totalMs = deadline.getTime() - created.getTime();
      const elapsedMs = now.getTime() - created.getTime();
      if (totalMs > 0) {
        timePercent = Math.min(100, (elapsedMs / totalMs) * 100);
        showTimeBar = true;
      }
    }
  }

  const delayClass =
    index === 0
      ? "dashboard-fade-in-delay-3"
      : index === 1
        ? "dashboard-fade-in-delay-4"
        : "dashboard-fade-in-delay-5";

  return (
    <div
      className={`dashboard-fade-in ${delayClass} group rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-500/30`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-dashboard-text truncate">
              {campaign.name}
            </h3>
          </div>
          {campaign.description && (
            <p className="mt-1.5 text-base text-dashboard-text-muted line-clamp-2">
              {campaign.description}
            </p>
          )}

          {/* Amount progress */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-2 text-lg">
              <span className="text-2xl font-bold text-dashboard-text tabular-nums">
                {formatCurrency(currentCents)}
              </span>
              <span className="text-base font-medium text-dashboard-text-muted">
                {goalCents > 0
                  ? `of ${formatCurrency(goalCents)} goal`
                  : "raised (no goal set)"}
              </span>
            </div>
            {goalCents > 0 && (
              <div className="mt-1.5">
                <AnimatedProgressBar
                  percent={amountPercent}
                  delay={index * 120}
                  variant="amount"
                />
              </div>
            )}
          </div>

          {/* Time period progress (when deadline exists) */}
          {deadline && (
            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-dashboard-text-muted">
                  Campaign period
                </span>
                <span className="text-base font-semibold text-dashboard-text-muted">
                  {timeLabel}
                </span>
              </div>
              {showTimeBar && (
                <div className="mt-1.5">
                  <AnimatedProgressBar
                    percent={timePercent}
                    delay={index * 120 + 80}
                    variant="time"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardGoalsOverview({ campaigns }: Props) {
  const activeCampaigns = campaigns.filter((c) => c.is_active !== false);

  if (activeCampaigns.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="dashboard-fade-in dashboard-fade-in-delay-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-dashboard-text">
            Campaign goals
          </h2>
          <p className="mt-1 text-base text-dashboard-text-muted">
            Track progress toward your active fundraising campaigns
          </p>
        </div>
        <Button variant="outline" size="default" asChild>
          <Link
            href="/dashboard/goals"
            className="inline-flex items-center gap-2 text-base font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Manage goals
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeCampaigns.slice(0, 6).map((campaign, i) => (
          <CampaignCard key={campaign.id} campaign={campaign} index={i} />
        ))}
      </div>
    </div>
  );
}
