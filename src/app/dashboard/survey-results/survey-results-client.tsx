"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "motion/react";
import {
  ClipboardList,
  Calendar,
  Users,
  BarChart3,
  DollarSign,
  Cpu,
  Sparkles,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import {
  SurveyAreaChart,
} from "@/components/survey/survey-charts";
import { getLabel } from "@/components/survey/survey-label-map";
import type { SurveyResponse } from "./page";

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

const ACCENT_COLORS = [
  { bar: "from-emerald-500 to-teal-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", dot: "bg-emerald-500" },
  { bar: "from-blue-500 to-cyan-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300", dot: "bg-blue-500" },
  { bar: "from-violet-500 to-purple-500", badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300", dot: "bg-violet-500" },
  { bar: "from-amber-500 to-orange-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", dot: "bg-amber-500" },
  { bar: "from-rose-500 to-pink-500", badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300", dot: "bg-rose-500" },
  { bar: "from-indigo-500 to-blue-500", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300", dot: "bg-indigo-500" },
  { bar: "from-teal-500 to-emerald-500", badge: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300", dot: "bg-teal-500" },
  { bar: "from-fuchsia-500 to-purple-500", badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300", dot: "bg-fuchsia-500" },
];

type QuestionDef = {
  field: keyof SurveyResponse;
  labelField: string;
  question: string;
  isArray: boolean;
  section: "money" | "tech";
};

const QUESTIONS: QuestionDef[] = [
  { field: "weekly_attendance", labelField: "weekly_attendance", question: "What is your church's approximate weekly attendance?", isArray: false, section: "money" },
  { field: "biggest_challenges", labelField: "biggest_challenges", question: "What is your biggest challenge with online giving today?", isArray: true, section: "money" },
  { field: "software_type", labelField: "software_type", question: "What type of software would best solve your giving needs?", isArray: false, section: "money" },
  { field: "software_vs_streaming", labelField: "software_vs_streaming", question: "Software-based or streaming/live-based?", isArray: false, section: "money" },
  { field: "wish_tech_improved", labelField: "wish_tech_improved", question: "What tech do you wish was more available for churches?", isArray: true, section: "money" },
  { field: "spend_to_solve_problem", labelField: "spend_to_solve_problem", question: "How much would you spend to solve your biggest giving problem?", isArray: false, section: "money" },
  { field: "better_ways_to_give", labelField: "better_ways_to_give", question: "What are better ways you would like to handle giving?", isArray: true, section: "money" },
  { field: "top_features", labelField: "top_features", question: "Which features matter most to you?", isArray: true, section: "money" },
  { field: "paperwork_method", labelField: "paperwork_method", question: "How does your church manage paperwork?", isArray: false, section: "money" },
  { field: "member_communication", labelField: "member_communication", question: "How do you communicate with members?", isArray: true, section: "money" },
  { field: "monthly_price_range", labelField: "monthly_price_range", question: "What would you pay per month?", isArray: false, section: "money" },
  { field: "networking_importance", labelField: "networking_importance", question: "How important is connecting with other churches (networking)?", isArray: false, section: "money" },
  { field: "website_tool_needs", labelField: "website_tool_needs", question: "Website & online tool needs?", isArray: true, section: "money" },
  { field: "currently_live_stream", labelField: "currently_live_stream", question: "Do you currently live stream?", isArray: false, section: "tech" },
  { field: "live_stream_platform", labelField: "live_stream_platform", question: "Which live stream platform do you use?", isArray: false, section: "tech" },
  { field: "live_stream_giving_interest", labelField: "live_stream_giving_interest", question: "Interest in live stream giving?", isArray: false, section: "tech" },
  { field: "live_stream_ai_features", labelField: "live_stream_ai_features", question: "What AI features would you want in live streams?", isArray: true, section: "tech" },
  { field: "live_stream_challenges", labelField: "live_stream_challenges", question: "What are your live streaming challenges?", isArray: true, section: "tech" },
  { field: "want_charts_dashboard", labelField: "want_charts_dashboard", question: "Want a real-time charts dashboard?", isArray: false, section: "tech" },
  { field: "auto_giving_interest", labelField: "auto_giving_interest", question: "Interest in automated giving?", isArray: false, section: "tech" },
  { field: "auto_giving_features", labelField: "auto_giving_features", question: "What auto giving features do you want?", isArray: true, section: "tech" },
  { field: "auto_transfer_fee_comfort", labelField: "auto_transfer_fee_comfort", question: "Comfort with auto-transfer fees?", isArray: false, section: "tech" },
  { field: "automation_needs", labelField: "automation_needs", question: "What communication automation do you need?", isArray: true, section: "tech" },
  { field: "campaign_tools_interest", labelField: "campaign_tools_interest", question: "Interest in campaign tools?", isArray: false, section: "tech" },
  { field: "event_posting_needs", labelField: "event_posting_needs", question: "Need for event posting & management?", isArray: false, section: "tech" },
  { field: "ai_form_interest", labelField: "ai_form_interest", question: "Interest in AI that auto-builds forms from live stream?", isArray: false, section: "tech" },
  { field: "teaching_packets_interest", labelField: "teaching_packets_interest", question: "Interest in teaching packets?", isArray: false, section: "tech" },
  { field: "ai_sermon_content", labelField: "ai_sermon_content", question: "Interest in AI sermon content generation?", isArray: false, section: "tech" },
  { field: "ai_member_curation", labelField: "ai_member_curation", question: "Interest in AI member content curation?", isArray: false, section: "tech" },
  { field: "pastor_approval_workflow", labelField: "pastor_approval_workflow", question: "Pastor approval workflow preference?", isArray: false, section: "tech" },
  { field: "member_development_tools", labelField: "member_development_tools", question: "What member development tools do you need?", isArray: true, section: "tech" },
  { field: "team_growth_tracking", labelField: "team_growth_tracking", question: "How do you track team spiritual growth?", isArray: false, section: "tech" },
  { field: "congregation_engagement", labelField: "congregation_engagement", question: "How do you know how your congregation is doing?", isArray: true, section: "tech" },
];

/* ─── 3D Tilt KPI Card ─── */
function KPICard({
  label,
  value,
  icon: Icon,
  gradient,
  iconBg,
  iconColor,
  index,
}: {
  label: string;
  value: string;
  icon: typeof ClipboardList;
  gradient: string;
  iconBg: string;
  iconColor: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 200, damping: 25 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() { mouseX.set(0); mouseY.set(0); }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      whileHover={{ scale: 1.04, y: -6, transition: { duration: 0.2, ease } }}
      whileTap={{ scale: 0.97 }}
      className={`kpi-card group relative overflow-hidden rounded-2xl border border-dashboard-border bg-gradient-to-br ${gradient} bg-dashboard-card p-5`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-dashboard-text">
            {value}
          </p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br from-white/5 to-white/0 blur-xl transition-all duration-700 group-hover:scale-150 group-hover:opacity-100 opacity-0" />
    </motion.div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({
  title,
  description,
  icon: Icon,
  gradient,
}: {
  title: string;
  description: string;
  icon: typeof DollarSign;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease }}
      className="relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8"
      style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-90`} />
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-sm text-white/70">{description}</p>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  );
}

/* ─── Animated Horizontal Bar ─── */
function HorizontalBar({
  label,
  count,
  percentage,
  maxPercentage,
  barGradient,
  index,
}: {
  label: string;
  count: number;
  percentage: number;
  maxPercentage: number;
  barGradient: string;
  index: number;
}) {
  const barWidth = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05, ease }}
      className="group/bar"
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-dashboard-text leading-snug">{label}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-bold tabular-nums text-dashboard-text">{count}</span>
          <span className="rounded-full bg-dashboard-card-hover/80 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-dashboard-text-muted dark:bg-white/10">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-dashboard-card-hover/60 dark:bg-white/[0.06]">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 + index * 0.06, ease }}
          className={`h-full origin-left rounded-full bg-gradient-to-r ${barGradient}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Question Card ─── */
function QuestionCard({
  questionNum,
  question,
  data,
  totalResponses,
  accentIndex,
  globalIndex,
}: {
  questionNum: number;
  question: string;
  data: NameValue[];
  totalResponses: number;
  accentIndex: number;
  globalIndex: number;
}) {
  const accent = ACCENT_COLORS[accentIndex % ACCENT_COLORS.length];
  const totalAnswered = data.reduce((sum, d) => sum + d.value, 0);
  const maxPercentage = data.length > 0 ? (data[0].value / totalAnswered) * 100 : 0;

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.55, delay: (globalIndex % 4) * 0.06, ease }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-card p-5 sm:p-6 transition-shadow duration-300 hover:shadow-lg dark:hover:shadow-white/[0.02]"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${accent.badge} text-xs font-bold`}>
          {questionNum}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-dashboard-text">
            {question}
          </h3>
          <p className="mt-1 text-xs text-dashboard-text-muted">
            {totalAnswered} response{totalAnswered !== 1 ? "s" : ""}
            {totalAnswered < totalResponses && (
              <span className="ml-1 opacity-60">
                of {totalResponses} total
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, i) => (
          <HorizontalBar
            key={item.name}
            label={item.name}
            count={item.value}
            percentage={totalAnswered > 0 ? (item.value / totalAnswered) * 100 : 0}
            maxPercentage={maxPercentage}
            barGradient={accent.bar}
            index={i}
          />
        ))}
      </div>

      <div className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent.bar} opacity-[0.04] blur-2xl transition-all duration-700 group-hover:opacity-[0.10] group-hover:scale-150`} />
    </motion.div>
  );
}

/* ─── Open-Ended Responses Card ─── */
function OpenEndedCard({
  title,
  icon: Icon,
  iconColor,
  borderHoverColor,
  responses: items,
}: {
  title: string;
  icon: typeof MessageSquare;
  iconColor: string;
  borderHoverColor: string;
  responses: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, 5);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease }}
      className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-card p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconColor}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-dashboard-text">{title}</h3>
            <p className="text-xs text-dashboard-text-muted">{items.length} response{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {items.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 rounded-lg border border-dashboard-border px-3 py-1.5 text-xs font-medium text-dashboard-text-muted transition-colors hover:bg-dashboard-card-hover hover:text-dashboard-text"
          >
            {expanded ? "Show less" : `Show all ${items.length}`}
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3, ease }}>
              <ChevronDown className="h-3 w-3" />
            </motion.div>
          </button>
        )}
      </div>
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {visibleItems.map((text, i) => (
            <motion.div
              key={text + i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3, delay: i * 0.03, ease }}
              whileHover={{ x: 4, scale: 1.005, transition: { duration: 0.15 } }}
              className={`rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 px-4 py-3 transition-colors ${borderHoverColor}`}
            >
              <p className="text-sm text-dashboard-text leading-relaxed italic">
                &ldquo;{text}&rdquo;
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
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

  const questionData = useMemo(() => {
    return QUESTIONS.map((q) => ({
      ...q,
      data: q.isArray
        ? countArrayField(responses, q.field, q.labelField)
        : countField(responses, q.field, q.labelField),
    }));
  }, [responses]);

  const moneyQuestions = questionData.filter((q) => q.section === "money");
  const techQuestions = questionData.filter((q) => q.section === "tech");

  const openEndedResponses = useMemo(
    () => responses.filter((r) => r.easier_giving_ideas?.trim()).map((r) => r.easier_giving_ideas!.trim()),
    [responses],
  );

  const techWishlistResponses = useMemo(
    () => responses.filter((r) => (r as Record<string, unknown>).tech_wishlist_open && String((r as Record<string, unknown>).tech_wishlist_open).trim())
      .map((r) => String((r as Record<string, unknown>).tech_wishlist_open).trim()),
    [responses],
  );

  let moneyQuestionNum = 0;
  let techQuestionNum = 0;

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -left-40 top-20 h-[350px] w-[350px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-[600px] h-[300px] w-[300px] rounded-full bg-blue-500/[0.04] blur-[100px]" />
      <div className="pointer-events-none absolute left-1/2 top-[1200px] h-[250px] w-[250px] -translate-x-1/2 rounded-full bg-violet-500/[0.03] blur-[80px]" />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Responses"
          value={totalResponses.toString()}
          icon={ClipboardList}
          gradient="from-emerald-500/10 to-teal-500/10"
          iconBg="bg-emerald-100 dark:bg-emerald-500/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          index={0}
        />
        <KPICard
          label="Date Range"
          value={dateRange}
          icon={Calendar}
          gradient="from-blue-500/10 to-cyan-500/10"
          iconBg="bg-blue-100 dark:bg-blue-500/20"
          iconColor="text-blue-600 dark:text-blue-400"
          index={1}
        />
        <KPICard
          label="Unique Organizations"
          value={responses.filter((r) => r.church_name?.trim()).length.toString()}
          icon={Users}
          gradient="from-violet-500/10 to-purple-500/10"
          iconBg="bg-violet-100 dark:bg-violet-500/20"
          iconColor="text-violet-600 dark:text-violet-400"
          index={2}
        />
        <KPICard
          label="Follow-up Opted In"
          value={responses.filter((r) => r.allow_follow_up).length.toString()}
          icon={BarChart3}
          gradient="from-amber-500/10 to-orange-500/10"
          iconBg="bg-amber-100 dark:bg-amber-500/20"
          iconColor="text-amber-600 dark:text-amber-400"
          index={3}
        />
      </div>

      {/* Responses Over Time */}
      <SurveyAreaChart data={responsesOverTime} title="Responses Over Time" />

      {/* ═══ PART 1: MONEY & GIVING ═══ */}
      <SectionHeader
        title="Part 1: Money & Giving"
        description="Attendance, challenges, pricing, and giving preferences"
        icon={DollarSign}
        gradient="from-emerald-600 to-teal-600"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {moneyQuestions.map((q, i) => {
          if (q.data.length === 0) return null;
          moneyQuestionNum++;
          return (
            <QuestionCard
              key={q.field}
              questionNum={moneyQuestionNum}
              question={q.question}
              data={q.data}
              totalResponses={totalResponses}
              accentIndex={i}
              globalIndex={i}
            />
          );
        })}
      </div>

      {/* Open-ended: Giving ideas */}
      <OpenEndedCard
        title="What would make giving easier?"
        icon={MessageSquare}
        iconColor="bg-gradient-to-br from-emerald-500 to-teal-500"
        borderHoverColor="hover:border-emerald-500/30"
        responses={openEndedResponses}
      />

      {/* ═══ PART 2: TECHNOLOGY & AI ═══ */}
      <SectionHeader
        title="Part 2: Technology & AI"
        description="Live streaming, automation, AI tools, and member development"
        icon={Cpu}
        gradient="from-blue-600 to-indigo-600"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {techQuestions.map((q, i) => {
          if (q.data.length === 0) return null;
          techQuestionNum++;
          return (
            <QuestionCard
              key={q.field}
              questionNum={techQuestionNum}
              question={q.question}
              data={q.data}
              totalResponses={totalResponses}
              accentIndex={i + moneyQuestions.length}
              globalIndex={i}
            />
          );
        })}
      </div>

      {/* Open-ended: Tech wishlist */}
      <OpenEndedCard
        title="What else would you love a church tech tool to do?"
        icon={Sparkles}
        iconColor="bg-gradient-to-br from-blue-500 to-indigo-500"
        borderHoverColor="hover:border-blue-500/30"
        responses={techWishlistResponses}
      />
    </div>
  );
}
