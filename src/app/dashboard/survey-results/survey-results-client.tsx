"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ClipboardList,
  Calendar,
  Users,
  BarChart3,
} from "lucide-react";
import {
  SurveyDonutChart,
  SurveyBarChart,
  SurveyAreaChart,
} from "@/components/survey/survey-charts";
import { getLabel } from "@/components/survey/survey-label-map";
import type { SurveyResponse } from "./page";

const stagger = 0.06;
const ease = [0.22, 1, 0.36, 1] as const;

type NameValue = { name: string; value: number };

function countField(responses: SurveyResponse[], field: keyof SurveyResponse, labelField: string): NameValue[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const val = r[field];
    if (typeof val === "string" && val) {
      counts[val] = (counts[val] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([key, value]) => ({ name: getLabel(labelField, key), value }))
    .sort((a, b) => b.value - a.value);
}

function countArrayField(responses: SurveyResponse[], field: keyof SurveyResponse, labelField: string): NameValue[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const val = r[field];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item) counts[item] = (counts[item] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .map(([key, value]) => ({ name: getLabel(labelField, key), value }))
    .sort((a, b) => b.value - a.value);
}

export function SurveyResultsClient({ responses }: { responses: SurveyResponse[] }) {
  const totalResponses = responses.length;

  const dateRange = useMemo(() => {
    if (responses.length === 0) return "No data";
    const dates = responses.map((r) => r.created_at).filter(Boolean).sort();
    const first = dates[0] ? new Date(dates[0]).toLocaleDateString() : "—";
    const last = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toLocaleDateString() : "—";
    return `${first} – ${last}`;
  }, [responses]);

  const attendanceData = useMemo(() => countField(responses, "weekly_attendance", "weekly_attendance"), [responses]);
  const challengesData = useMemo(() => countArrayField(responses, "biggest_challenges", "biggest_challenges"), [responses]);
  const softwareTypeData = useMemo(() => countField(responses, "software_type", "software_type"), [responses]);
  const techTypeData = useMemo(() => countField(responses, "tech_type_needed", "tech_type_needed"), [responses]);
  const streamingData = useMemo(() => countField(responses, "software_vs_streaming", "software_vs_streaming"), [responses]);
  const wishTechData = useMemo(() => countArrayField(responses, "wish_tech_improved", "wish_tech_improved"), [responses]);
  const spendData = useMemo(() => countField(responses, "spend_to_solve_problem", "spend_to_solve_problem"), [responses]);
  const betterWaysData = useMemo(() => countArrayField(responses, "better_ways_to_give", "better_ways_to_give"), [responses]);
  const topFeaturesData = useMemo(() => countArrayField(responses, "top_features", "top_features"), [responses]);
  const paperworkData = useMemo(() => countField(responses, "paperwork_method", "paperwork_method"), [responses]);
  const commData = useMemo(() => countArrayField(responses, "member_communication", "member_communication"), [responses]);
  const aiFormData = useMemo(() => countField(responses, "ai_form_interest", "ai_form_interest"), [responses]);
  const teamGrowthData = useMemo(() => countField(responses, "team_growth_tracking", "team_growth_tracking"), [responses]);
  const engagementData = useMemo(() => countArrayField(responses, "congregation_engagement", "congregation_engagement"), [responses]);
  const automationData = useMemo(() => countArrayField(responses, "automation_needs", "automation_needs"), [responses]);
  const campaignData = useMemo(() => countField(responses, "campaign_tools_interest", "campaign_tools_interest"), [responses]);
  const eventPostingData = useMemo(() => countField(responses, "event_posting_needs", "event_posting_needs"), [responses]);
  const teachingPacketsData = useMemo(() => countField(responses, "teaching_packets_interest", "teaching_packets_interest"), [responses]);
  const aiSermonData = useMemo(() => countField(responses, "ai_sermon_content", "ai_sermon_content"), [responses]);
  const aiCurationData = useMemo(() => countField(responses, "ai_member_curation", "ai_member_curation"), [responses]);
  const approvalData = useMemo(() => countField(responses, "pastor_approval_workflow", "pastor_approval_workflow"), [responses]);
  const memberDevData = useMemo(() => countArrayField(responses, "member_development_tools", "member_development_tools"), [responses]);
  const websiteToolsData = useMemo(() => countArrayField(responses, "website_tool_needs", "website_tool_needs"), [responses]);
  const liveStreamData = useMemo(() => countField(responses, "currently_live_stream", "currently_live_stream"), [responses]);
  const liveStreamPlatformData = useMemo(() => countField(responses, "live_stream_platform", "live_stream_platform"), [responses]);
  const liveStreamGivingData = useMemo(() => countField(responses, "live_stream_giving_interest", "live_stream_giving_interest"), [responses]);
  const liveStreamAIData = useMemo(() => countArrayField(responses, "live_stream_ai_features", "live_stream_ai_features"), [responses]);
  const liveStreamChallengesData = useMemo(() => countArrayField(responses, "live_stream_challenges", "live_stream_challenges"), [responses]);
  const chartsDashboardData = useMemo(() => countField(responses, "want_charts_dashboard", "want_charts_dashboard"), [responses]);
  const autoGivingData = useMemo(() => countField(responses, "auto_giving_interest", "auto_giving_interest"), [responses]);
  const autoGivingFeaturesData = useMemo(() => countArrayField(responses, "auto_giving_features", "auto_giving_features"), [responses]);
  const autoTransferFeeData = useMemo(() => countField(responses, "auto_transfer_fee_comfort", "auto_transfer_fee_comfort"), [responses]);
  const priceData = useMemo(() => countField(responses, "monthly_price_range", "monthly_price_range"), [responses]);
  const networkingData = useMemo(() => countField(responses, "networking_importance", "networking_importance"), [responses]);

  const responsesOverTime = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const r of responses) {
      if (!r.created_at) continue;
      const day = r.created_at.slice(0, 10);
      byDate[day] = (byDate[day] ?? 0) + 1;
    }
    return Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [responses]);

  const openEndedResponses = useMemo(
    () => responses.filter((r) => r.easier_giving_ideas?.trim()).map((r) => r.easier_giving_ideas!.trim()),
    [responses],
  );

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Responses",
            value: totalResponses.toString(),
            icon: ClipboardList,
            gradient: "from-emerald-500/10 to-teal-500/10",
            iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            delay: "dashboard-fade-in-delay-1",
          },
          {
            label: "Date Range",
            value: dateRange,
            icon: Calendar,
            gradient: "from-blue-500/10 to-cyan-500/10",
            iconBg: "bg-blue-100 dark:bg-blue-500/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            delay: "dashboard-fade-in-delay-2",
          },
          {
            label: "Unique Orgs",
            value: responses.filter((r) => r.church_name?.trim()).length.toString(),
            icon: Users,
            gradient: "from-violet-500/10 to-purple-500/10",
            iconBg: "bg-violet-100 dark:bg-violet-500/20",
            iconColor: "text-violet-600 dark:text-violet-400",
            delay: "dashboard-fade-in-delay-3",
          },
          {
            label: "Follow-up Opted In",
            value: responses.filter((r) => r.allow_follow_up).length.toString(),
            icon: BarChart3,
            gradient: "from-amber-500/10 to-orange-500/10",
            iconBg: "bg-amber-100 dark:bg-amber-500/20",
            iconColor: "text-amber-600 dark:text-amber-400",
            delay: "dashboard-fade-in-delay-4",
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * stagger, ease }}
              whileHover={{
                scale: 1.03,
                y: -4,
                transition: { duration: 0.2, ease },
              }}
              whileTap={{ scale: 0.98 }}
              className={`kpi-card rounded-2xl border border-dashboard-border bg-gradient-to-br ${card.gradient} bg-dashboard-card p-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-dashboard-text">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ PART 1: MONEY & GIVING ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease }}
        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Part 1: Money &amp; Giving</h2>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
        >
          <SurveyDonutChart data={attendanceData} title="Attendance Distribution" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.41, ease }}
        >
          <SurveyBarChart data={challengesData} title="Biggest Challenges" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.47, ease }}
        >
          <SurveyBarChart data={betterWaysData} title="Better Ways to Give" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.53, ease }}
        >
          <SurveyBarChart data={priceData} title="Monthly Price Willingness" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.59, ease }}
        >
          <SurveyDonutChart data={spendData} title="Willingness to Spend to Solve #1 Problem" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65, ease }}
        >
          <SurveyBarChart data={topFeaturesData} title="Top Features Requested" />
        </motion.div>
      </div>

      {/* ═══ PART 2: TECHNOLOGY & AI ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.7, ease }}
        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Part 2: Technology &amp; AI</h2>
      </motion.div>

      {/* Live Streaming */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.76, ease }}>
          <SurveyDonutChart data={liveStreamData} title="Currently Live Streaming?" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.82, ease }}>
          <SurveyDonutChart data={liveStreamPlatformData} title="Live Stream Platform" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.88, ease }}>
          <SurveyDonutChart data={liveStreamGivingData} title="Live Stream Giving Interest" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.94, ease }}>
          <SurveyBarChart data={liveStreamAIData} title="Live Stream AI Features Wanted" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0, ease }}>
          <SurveyBarChart data={liveStreamChallengesData} title="Live Streaming Challenges" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.06, ease }}>
          <SurveyDonutChart data={chartsDashboardData} title="Want Real-Time Charts Dashboard?" />
        </motion.div>
      </div>

      {/* Automated Giving */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.12, ease }}>
          <SurveyDonutChart data={autoGivingData} title="Automated Giving Interest" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.18, ease }}>
          <SurveyBarChart data={autoGivingFeaturesData} title="Auto Giving Features Wanted" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.24, ease }}>
          <SurveyDonutChart data={autoTransferFeeData} title="Comfort With Auto-Transfer Fees" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.3, ease }}>
          <SurveyDonutChart data={softwareTypeData} title="Software Type Preference" />
        </motion.div>
      </div>

      {/* Current Tools */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.36, ease }}>
          <SurveyBarChart data={websiteToolsData} title="Website & Online Tool Needs" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.42, ease }}>
          <SurveyBarChart data={wishTechData} title="Tech Churches Wish Was Improved" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.48, ease }}>
          <SurveyDonutChart data={paperworkData} title="How Churches Manage Paperwork" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.54, ease }}>
          <SurveyBarChart data={automationData} title="Automation Needs" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.6, ease }}>
          <SurveyBarChart data={commData} title="Member Communication Methods" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.66, ease }}>
          <SurveyDonutChart data={campaignData} title="Campaign Tools Interest" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.72, ease }}>
          <SurveyDonutChart data={aiFormData} title="Interest in AI Auto-Generated Forms" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.78, ease }}>
          <SurveyDonutChart data={aiSermonData} title="AI Sermon Content Generation" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.84, ease }}>
          <SurveyDonutChart data={teachingPacketsData} title="Teaching Packets Interest" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.9, ease }}>
          <SurveyDonutChart data={approvalData} title="Pastor Approval Workflow" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.96, ease }}>
          <SurveyDonutChart data={aiCurationData} title="AI Member Content Curation" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 2.02, ease }}>
          <SurveyBarChart data={memberDevData} title="Member Development Tools" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 2.08, ease }}>
          <SurveyDonutChart data={teamGrowthData} title="How Teams Track Spiritual Growth" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 2.14, ease }}>
          <SurveyBarChart data={engagementData} title="How Pastors Know How People Are Doing" />
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 2.2, ease }}>
          <SurveyDonutChart data={networkingData} title="Networking Importance" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 2.26, ease }}>
          <SurveyAreaChart data={responsesOverTime} title="Responses Over Time" />
        </motion.div>
      </div>

      {/* Open-ended responses */}
      {openEndedResponses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.32, ease }}
          className="survey-chart-card"
        >
          <h3 className="mb-4 text-sm font-semibold text-dashboard-text">
            Open-Ended: What would make giving easier?
          </h3>
          <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
            {openEndedResponses.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 2.4 + i * 0.05, ease }}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 px-4 py-3"
              >
                <p className="text-sm text-dashboard-text leading-relaxed">
                  &ldquo;{text}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
