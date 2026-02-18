"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  DollarSign,
  Cpu,
  MessageSquare,
  Sparkles,
  CreditCard,
  ArrowRight,
  Banknote,
  BrainCircuit,
  Send,
  LayoutDashboard,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

/* ─── Pexels direct media URLs ─── */
const HERO_VIDEO =
  "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4";
const SECTION_IMAGES = {
  intro: "https://images.pexels.com/photos/8815888/pexels-photo-8815888.jpeg?auto=compress&w=800",
  giving_challenges: "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&w=800",
  giving_methods: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&w=800",
  giving_pricing: "https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&w=800",
  tech_current: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&w=800",
  tech_automation: "https://images.pexels.com/photos/7176319/pexels-photo-7176319.jpeg?auto=compress&w=800",
  tech_ai: "https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg?auto=compress&w=800",
  tech_content: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&w=800",
};

/* ─── Types ─── */
type QType = "text" | "email" | "tel" | "select" | "radio" | "checkboxGroup" | "textarea";

interface QuestionDef {
  label: string;
  sublabel?: string;
  name: string;
  type: QType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface SectionDef {
  id: string;
  half: "money" | "tech";
  title: string;
  subtitle: string;
  icon: typeof Users;
  image: string;
  questions: QuestionDef[];
  diagram?: React.ReactNode;
}

/* ─── SVG diagrams ─── */
function GivingFlowDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-emerald-700">
        How modern giving could work
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
        {[
          { label: "Donor", color: "bg-emerald-500" },
          { label: "Platform", color: "bg-teal-500" },
          { label: "Auto-Split", color: "bg-cyan-500" },
          { label: "Recipients", color: "bg-blue-500" },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${step.color}`}>
                {i + 1}
              </div>
              <span className="mt-1.5 text-xs font-medium text-slate-600">{step.label}</span>
            </div>
            {i < 3 && <ArrowRight className="hidden h-4 w-4 text-emerald-400 sm:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-amber-700">
        Pricing models comparison
      </p>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Flat Monthly", desc: "$25–$100/mo", color: "bg-amber-100 text-amber-700" },
          { label: "% Per Donation", desc: "1–3% per gift", color: "bg-orange-100 text-orange-700" },
          { label: "Hybrid", desc: "Low flat + low %", color: "bg-yellow-100 text-yellow-700" },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl px-3 py-3 ${m.color}`}>
            <p className="text-sm font-semibold">{m.label}</p>
            <p className="mt-1 text-xs opacity-80">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveStreamDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-cyan-700">
        What AI + live streaming could look like
      </p>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-xl bg-cyan-100 px-4 py-2.5 text-sm font-medium text-cyan-700">
            You go live
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400" />
          <div className="rounded-xl bg-blue-100 px-4 py-2.5 text-sm font-medium text-blue-700">
            AI listens in real time
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400" />
          <div className="rounded-xl bg-indigo-100 px-4 py-2.5 text-sm font-medium text-indigo-700">
            Give button overlays stream
          </div>
        </div>
        <ArrowRight className="h-4 w-4 rotate-90 text-cyan-400" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-xl bg-sky-100 px-4 py-2.5 text-sm font-medium text-sky-700">
            Sermon notes auto-generated
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400" />
          <div className="rounded-xl bg-teal-100 px-4 py-2.5 text-sm font-medium text-teal-700">
            Forms, quizzes &amp; devotionals created
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400" />
          <div className="rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-medium text-emerald-700">
            Sent to members (you approve first)
          </div>
        </div>
      </div>
    </div>
  );
}

function AutoGivingDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-green-700">
        Automated giving — like auto-pay for your church
      </p>
      <div className="grid gap-3 sm:grid-cols-3 text-center">
        {[
          { icon: "🔄", label: "Auto-Draft", desc: "Members set up recurring giving — funds auto-collected" },
          { icon: "✂️", label: "Auto-Split", desc: "Platform splits to missions, building fund, general" },
          { icon: "📄", label: "Auto-Reports", desc: "Tax receipts, reports, statements — all automatic" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/80 p-4 shadow-sm">
            <div className="text-2xl">{item.icon}</div>
            <p className="mt-2 text-sm font-semibold text-slate-700">{item.label}</p>
            <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-blue-700">
        What automation could look like
      </p>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { icon: "📱", label: "Auto-Text", desc: "Reminders, follow-ups" },
          { icon: "📧", label: "Auto-Email", desc: "Campaigns, newsletters" },
          { icon: "📅", label: "Events", desc: "Post & manage events" },
          { icon: "📊", label: "Surveys", desc: "Feedback after service" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/80 p-3 text-center shadow-sm">
            <div className="text-2xl">{item.icon}</div>
            <p className="mt-1 text-xs font-semibold text-slate-700">{item.label}</p>
            <p className="text-[10px] text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIContentDiagram() {
  return (
    <div className="my-6 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-purple-700">
        AI-powered content pipeline
      </p>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-xl bg-purple-100 px-4 py-2.5 text-sm font-medium text-purple-700">
            Pastor preaches via live stream
          </div>
          <ArrowRight className="h-4 w-4 text-purple-400" />
          <div className="rounded-xl bg-indigo-100 px-4 py-2.5 text-sm font-medium text-indigo-700">
            AI listens &amp; understands the message
          </div>
        </div>
        <ArrowRight className="h-4 w-4 rotate-90 text-purple-400" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-xl bg-violet-100 px-4 py-2.5 text-sm font-medium text-violet-700">
            Creates teaching packets, forms, summaries
          </div>
          <ArrowRight className="h-4 w-4 text-purple-400" />
          <div className="rounded-xl bg-fuchsia-100 px-4 py-2.5 text-sm font-medium text-fuchsia-700">
            Pastor approves &rarr; sent to members
          </div>
        </div>
        <ArrowRight className="h-4 w-4 rotate-90 text-purple-400" />
        <div className="rounded-xl bg-pink-100 px-4 py-2.5 text-sm font-medium text-pink-700">
          Over time AI learns your church &amp; curates personalized content per member
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   SECTIONS — Two halves: MONEY + TECHNOLOGY
   ──────────────────────────────────────────────── */

const SECTIONS: SectionDef[] = [
  /* ═══════ INTRO ═══════ */
  {
    id: "intro",
    half: "money",
    title: "Let's Start With You",
    subtitle: "A few quick details so we can personalize this survey for your church.",
    icon: Users,
    image: SECTION_IMAGES.intro,
    questions: [
      { label: "Your name", name: "respondent_name", type: "text", required: true, placeholder: "e.g. Pastor John" },
      { label: "Email address", name: "contact_email", type: "email", required: true, placeholder: "john@yourchurch.org" },
      { label: "Phone number", name: "phone_number", type: "tel", placeholder: "(555) 123-4567" },
      { label: "Church / organization name", name: "church_name", type: "text", required: true, placeholder: "Grace Community Church" },
      {
        label: "What type of organization are you?",
        name: "org_type",
        type: "radio",
        required: true,
        options: [
          { value: "church", label: "Church" },
          { value: "nonprofit", label: "Nonprofit" },
          { value: "missionary", label: "Missionary" },
          { value: "denomination", label: "Church network / denomination" },
        ],
      },
      {
        label: "Approximate weekly attendance?",
        name: "weekly_attendance",
        type: "select",
        required: true,
        options: [
          { value: "under_50", label: "Under 50" },
          { value: "50_150", label: "50–150" },
          { value: "151_300", label: "151–300" },
          { value: "301_500", label: "301–500" },
          { value: "501_1000", label: "501–1,000" },
          { value: "1000_plus", label: "1,000+" },
        ],
      },
      {
        label: "How many staff members handle finances and giving?",
        name: "finance_staff_count",
        type: "select",
        required: true,
        options: [
          { value: "0", label: "0 (volunteer-run)" },
          { value: "1", label: "1" },
          { value: "2_3", label: "2–3" },
          { value: "4_plus", label: "4+" },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════
     PART 1: MONEY & GIVING
     ═══════════════════════════════════════════ */
  {
    id: "giving_challenges",
    half: "money",
    title: "Giving Challenges & Current Setup",
    subtitle: "Where is money falling through the cracks? What's costing you time?",
    icon: DollarSign,
    image: SECTION_IMAGES.giving_challenges,
    diagram: <GivingFlowDiagram />,
    questions: [
      {
        label: "What is your annual operating budget (approximate)?",
        name: "annual_budget",
        type: "select",
        required: true,
        options: [
          { value: "under_100k", label: "Under $100k" },
          { value: "100k_250k", label: "$100k–$250k" },
          { value: "250k_500k", label: "$250k–$500k" },
          { value: "500k_1m", label: "$500k–$1M" },
          { value: "1m_plus", label: "$1M+" },
        ],
      },
      {
        label: "What is your biggest challenge with online giving today?",
        sublabel: "Select all that apply.",
        name: "biggest_challenges",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "manual_payments", label: "Manual missionary payments" },
          { value: "no_recurring", label: "No recurring giving" },
          { value: "poor_donor_experience", label: "Poor donor experience" },
          { value: "high_fees", label: "High fees" },
          { value: "no_splits", label: "No splits to multiple recipients" },
          { value: "hard_to_embed", label: "Hard to embed on website" },
          { value: "no_reporting", label: "No real-time reporting" },
          { value: "tax_receipts", label: "Difficult tax receipts / year-end statements" },
          { value: "other", label: "Other" },
        ],
      },
      {
        label: "How many missionaries or partner organizations do you support financially?",
        name: "missionaries_supported",
        type: "select",
        required: true,
        options: [
          { value: "0", label: "0" },
          { value: "1_3", label: "1–3" },
          { value: "4_10", label: "4–10" },
          { value: "11_25", label: "11–25" },
          { value: "25_plus", label: "25+" },
        ],
      },
      {
        label: "How do you currently distribute funds to missionaries/partners?",
        name: "distribution_method",
        type: "radio",
        required: true,
        options: [
          { value: "manual_bank", label: "Manual bank transfers" },
          { value: "check", label: "Check" },
          { value: "paypal_venmo", label: "PayPal / Venmo" },
          { value: "platform_manual", label: "Donation platform with manual splits" },
          { value: "platform_auto", label: "Automated platform splits" },
          { value: "not_applicable", label: "Not applicable" },
        ],
      },
      {
        label: "How many hours per month do you spend on donation/finance admin?",
        name: "admin_hours_per_month",
        type: "select",
        required: true,
        options: [
          { value: "0_5", label: "0–5 hours" },
          { value: "6_10", label: "6–10 hours" },
          { value: "11_20", label: "11–20 hours" },
          { value: "21_40", label: "21–40 hours" },
          { value: "40_plus", label: "40+ hours" },
        ],
      },
    ],
  },
  {
    id: "giving_methods",
    half: "money",
    title: "How Your Congregation Wants to Give",
    subtitle: "What would make giving frictionless for your members?",
    icon: CreditCard,
    image: SECTION_IMAGES.giving_methods,
    questions: [
      {
        label: "What are some better ways you would like to handle giving?",
        sublabel: "Select all that apply.",
        name: "better_ways_to_give",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "one_tap_stream", label: "One-tap giving during live stream" },
          { value: "qr_code", label: "QR code at pew / entrance" },
          { value: "text_to_give", label: "Text-to-give" },
          { value: "recurring", label: "Recurring auto-draft" },
          { value: "split_funds", label: "Split to multiple funds (general, building, missionary)" },
          { value: "kiosk", label: "In-person kiosk / tablet" },
          { value: "apple_google", label: "Apple Pay / Google Pay" },
          { value: "cash_app", label: "Cash App / Zelle integration" },
          { value: "other", label: "Other" },
        ],
      },
      {
        label: "What would make giving easier for your congregation?",
        sublabel: "Share any ideas — we're listening.",
        name: "easier_giving_ideas",
        type: "textarea",
        placeholder: "e.g. Less friction, remember my info, give from phone during service, text reminders before Sunday…",
      },
    ],
  },
  {
    id: "giving_pricing",
    half: "money",
    title: "Pricing & Willingness to Pay",
    subtitle: "Help us find the right price point so this tool is accessible to every church.",
    icon: Banknote,
    image: SECTION_IMAGES.giving_pricing,
    diagram: <PricingDiagram />,
    questions: [
      {
        label: "What would you pay per month for a full donation platform?",
        sublabel: "Includes donations, splits, embeds, and a dashboard.",
        name: "monthly_price_range",
        type: "select",
        required: true,
        options: [
          { value: "free", label: "$0 (free only)" },
          { value: "1_25", label: "$1–$25" },
          { value: "26_50", label: "$26–$50" },
          { value: "51_100", label: "$51–$100" },
          { value: "100_plus", label: "$100+" },
        ],
      },
      {
        label: "Would you pay a percentage fee on each donation instead of (or in addition to) a monthly fee?",
        name: "percent_fee_preference",
        type: "radio",
        required: true,
        options: [
          { value: "prefer_percent", label: "Yes, prefer % fee" },
          { value: "under_2", label: "Yes, if under 2%" },
          { value: "flat_only", label: "No, prefer flat monthly only" },
          { value: "depends", label: "Depends on features" },
        ],
      },
      {
        label: "If a tool could solve your biggest giving problem, how much would you be willing to spend?",
        sublabel: "One-time or monthly — whichever feels right.",
        name: "spend_to_solve_problem",
        type: "radio",
        required: true,
        options: [
          { value: "nothing", label: "$0 — it needs to be free" },
          { value: "under_25", label: "Under $25/month" },
          { value: "25_50", label: "$25–$50/month" },
          { value: "50_100", label: "$50–$100/month" },
          { value: "100_200", label: "$100–$200/month" },
          { value: "200_plus", label: "$200+/month" },
          { value: "one_time_500", label: "A one-time fee up to $500" },
          { value: "one_time_1000_plus", label: "A one-time fee of $1,000+" },
        ],
      },
      {
        label: "What would make you switch from your current giving solution?",
        sublabel: "Select all that apply.",
        name: "switch_triggers",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "lower_fees", label: "Lower fees" },
          { value: "auto_splits", label: "Automated splits" },
          { value: "better_ux", label: "Better UX" },
          { value: "website_builder", label: "Website builder included" },
          { value: "missionary_support", label: "Missionary support built-in" },
          { value: "all_in_one", label: "All-in-one (giving + website + communication)" },
          { value: "nothing", label: "Nothing — happy with current" },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════
     PART 2: TECHNOLOGY & AI
     ═══════════════════════════════════════════ */
  {
    id: "tech_livestream",
    half: "tech",
    title: "Live Streaming & Technology",
    subtitle: "Do you currently live stream? Could AI make your streams do more for your congregation?",
    icon: Cpu,
    image: "https://images.pexels.com/photos/7594064/pexels-photo-7594064.jpeg?auto=compress&w=800",
    diagram: <LiveStreamDiagram />,
    questions: [
      {
        label: "Does your church currently live stream services?",
        name: "currently_live_stream",
        type: "radio",
        required: true,
        options: [
          { value: "yes_weekly", label: "Yes — every week" },
          { value: "yes_sometimes", label: "Yes — sometimes (special events, holidays)" },
          { value: "no_want_to", label: "No — but we want to start" },
          { value: "no_not_interested", label: "No — and we're not interested" },
        ],
      },
      {
        label: "What platform do you use (or would use) for live streaming?",
        name: "live_stream_platform",
        type: "radio",
        required: true,
        options: [
          { value: "youtube", label: "YouTube Live" },
          { value: "facebook", label: "Facebook Live" },
          { value: "church_app", label: "Church-specific app (Church Online, Resi)" },
          { value: "zoom", label: "Zoom" },
          { value: "multiple", label: "Multiple platforms at once" },
          { value: "none", label: "None yet" },
          { value: "other", label: "Other" },
        ],
      },
      {
        label: "Would you want to integrate giving directly into your live stream so members can give while watching?",
        sublabel: "Think: a 'Give Now' button that pops up during the offering, or a QR code overlay on the stream.",
        name: "live_stream_giving_interest",
        type: "radio",
        required: true,
        options: [
          { value: "absolutely", label: "Absolutely — this would increase giving" },
          { value: "interested", label: "Interested — I'd want to see how it works" },
          { value: "maybe", label: "Maybe — depends on how seamless it is" },
          { value: "no", label: "No — we keep giving separate from streaming" },
        ],
      },
      {
        label: "If AI could listen to your live stream in real time, which of these features would you want?",
        sublabel: "Select all that interest you.",
        name: "live_stream_ai_features",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "auto_forms", label: "Auto-create forms based on what's said (prayer requests, sign-ups)" },
          { value: "sermon_notes", label: "Auto-generate sermon notes / summary for members" },
          { value: "discussion_guides", label: "Create small-group discussion guides from the message" },
          { value: "quizzes_tests", label: "Generate quizzes or tests for Bible study groups" },
          { value: "devotionals", label: "Create daily devotionals based on Sunday's sermon" },
          { value: "action_items", label: "Extract action items and send to relevant teams" },
          { value: "captions_transcript", label: "Real-time captions and searchable transcript" },
          { value: "highlight_clips", label: "Auto-clip highlights for social media" },
          { value: "member_followup", label: "Auto-send follow-up messages to stream viewers" },
          { value: "none", label: "None of these interest me" },
        ],
      },
      {
        label: "What are your biggest challenges with live streaming today?",
        sublabel: "Select all that apply.",
        name: "live_stream_challenges",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "tech_setup", label: "Technical setup is too complicated" },
          { value: "cost", label: "Equipment / software costs" },
          { value: "low_engagement", label: "Low viewer engagement" },
          { value: "no_giving", label: "No way to collect giving during stream" },
          { value: "no_interaction", label: "No way to interact with viewers" },
          { value: "poor_quality", label: "Poor audio/video quality" },
          { value: "no_follow_up", label: "No follow-up with online viewers afterward" },
          { value: "not_streaming", label: "We don't stream yet" },
          { value: "none", label: "No major challenges" },
        ],
      },
      {
        label: "Would you want a real-time dashboard with charts showing who's watching, giving activity during stream, and engagement metrics?",
        name: "want_charts_dashboard",
        type: "radio",
        required: true,
        options: [
          { value: "yes_essential", label: "Yes — that would be essential" },
          { value: "yes_nice", label: "Yes — nice to have" },
          { value: "maybe", label: "Maybe — I'd need to see it" },
          { value: "no", label: "No — I don't need that" },
        ],
      },
    ],
  },
  {
    id: "tech_auto_giving",
    half: "tech",
    title: "Automated Giving & Transactions",
    subtitle: "Like auto-pay for bills — could churches automate giving, splits, and transfers for a small fee?",
    icon: Banknote,
    image: "https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&w=800",
    diagram: <AutoGivingDiagram />,
    questions: [
      {
        label: "Would you be interested in automating your church's giving process — similar to how banks automate bill pay?",
        sublabel: "Members set up recurring auto-drafts, funds auto-split to missionaries/partners, and reports generate themselves.",
        name: "auto_giving_interest",
        type: "radio",
        required: true,
        options: [
          { value: "love_it", label: "Love it — set it and forget it" },
          { value: "interested", label: "Interested — especially for recurring donors" },
          { value: "cautious", label: "Cautious — I'd want control over every transaction" },
          { value: "no", label: "No — we prefer manual processes" },
        ],
      },
      {
        label: "Which automated giving features would you actually use?",
        sublabel: "Select all that apply.",
        name: "auto_giving_features",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "recurring_auto_draft", label: "Recurring auto-draft from member bank accounts" },
          { value: "auto_split_missionaries", label: "Automatic splits to missionaries/partners" },
          { value: "auto_tax_receipts", label: "Automatic tax receipts & year-end statements" },
          { value: "auto_reports", label: "Auto-generated financial reports (weekly, monthly)" },
          { value: "auto_fund_allocation", label: "Auto fund allocation (building fund, general, missions)" },
          { value: "auto_payroll_pastoral", label: "Auto pastoral/staff payroll from tithes" },
          { value: "scheduled_transfers", label: "Scheduled bank transfers (weekly batch)" },
          { value: "pledge_tracking", label: "Pledge tracking with auto-reminders" },
          { value: "none", label: "None — we'd do this manually" },
        ],
      },
      {
        label: "Would you be comfortable paying a small transfer fee for automated transactions — similar to how banks charge for wire transfers?",
        sublabel: "For example: $0.25–$1.00 per auto-transfer, or 0.5% of the transaction.",
        name: "auto_transfer_fee_comfort",
        type: "radio",
        required: true,
        options: [
          { value: "yes_worth_it", label: "Yes — the time savings are worth it" },
          { value: "yes_if_low", label: "Yes — if the fee is under $0.50 per transaction" },
          { value: "depends", label: "Depends on volume and total cost" },
          { value: "no_fee", label: "No — fees are a dealbreaker" },
          { value: "pass_to_donor", label: "Only if donors can choose to cover the fee" },
        ],
      },
    ],
  },
  {
    id: "tech_current",
    half: "tech",
    title: "Your Current Tech & Tools",
    subtitle: "What are you using today? What's missing?",
    icon: Cpu,
    image: SECTION_IMAGES.tech_current,
    questions: [
      {
        label: "What type of software would best solve your giving needs?",
        name: "software_type",
        type: "radio",
        required: true,
        options: [
          { value: "all_in_one", label: "All-in-one (donations + website + splits + communication)" },
          { value: "donation_only", label: "Donation-only platform" },
          { value: "chms_addon", label: "Add-on to existing church management (ChMS)" },
          { value: "mobile_app", label: "Mobile app for congregants" },
          { value: "other", label: "Other" },
        ],
      },
      {
        label: "Do you have a church website today?",
        name: "has_website",
        type: "radio",
        required: true,
        options: [
          { value: "no", label: "No" },
          { value: "yes_basic", label: "Yes (basic)" },
          { value: "yes_advanced", label: "Yes (custom/advanced)" },
        ],
      },
      {
        label: "What website/online tools do you need help with?",
        sublabel: "Select all that apply.",
        name: "website_tool_needs",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "church_website", label: "Building or updating a church website" },
          { value: "online_giving_page", label: "Online giving page / donate button" },
          { value: "event_posting", label: "Event posting & registration" },
          { value: "member_directory", label: "Member directory / profiles" },
          { value: "sermon_archive", label: "Sermon archive / media library" },
          { value: "volunteer_signup", label: "Volunteer sign-up sheets" },
          { value: "blog_updates", label: "Blog / news updates" },
          { value: "live_stream", label: "Live stream integration" },
          { value: "none", label: "We're covered — no help needed" },
        ],
      },
      {
        label: "How does your church currently manage paperwork (forms, sign-ups, volunteer sheets)?",
        name: "paperwork_method",
        type: "radio",
        required: true,
        options: [
          { value: "all_paper", label: "All paper / printed forms" },
          { value: "mix_paper_digital", label: "Mix of paper and digital (Google Forms, email)" },
          { value: "mostly_digital", label: "Mostly digital tools" },
          { value: "church_software", label: "Church management software (Planning Center, Breeze, etc.)" },
          { value: "no_system", label: "No real system — things fall through the cracks" },
        ],
      },
      {
        label: "Which features matter most to you in a church platform?",
        sublabel: "Select your top picks.",
        name: "top_features",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "auto_splits", label: "Automated missionary splits" },
          { value: "recurring", label: "Recurring giving" },
          { value: "embeddable_forms", label: "Embeddable donation forms" },
          { value: "website_builder", label: "Website builder" },
          { value: "custom_domains", label: "Custom domains" },
          { value: "realtime_dashboard", label: "Real-time dashboard" },
          { value: "donor_management", label: "Donor management" },
          { value: "events_integration", label: "Events integration" },
          { value: "member_surveys", label: "Member surveys & feedback" },
          { value: "other", label: "Other" },
        ],
      },
      {
        label: "What type of tech do you wish was more available or improved for churches?",
        sublabel: "Select all that apply.",
        name: "wish_tech_improved",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "online_giving", label: "Online giving / donation platforms" },
          { value: "live_stream_giving", label: "Live-stream integrated giving" },
          { value: "church_website", label: "Church website builder" },
          { value: "member_management", label: "Member / donor management (ChMS)" },
          { value: "accounting", label: "Accounting & financial reporting" },
          { value: "event_management", label: "Event management & ticketing" },
          { value: "volunteer_scheduling", label: "Volunteer scheduling" },
          { value: "communication", label: "Communication tools (email, SMS, push)" },
          { value: "media_streaming", label: "Media / sermon streaming" },
          { value: "mobile_app", label: "Church mobile app" },
          { value: "other", label: "Other" },
        ],
      },
    ],
  },
  {
    id: "tech_automation",
    half: "tech",
    title: "Automation & Communication",
    subtitle: "Automatic texting, emailing, campaigns — what would save you the most time?",
    icon: Send,
    image: SECTION_IMAGES.tech_automation,
    diagram: <AutomationDiagram />,
    questions: [
      {
        label: "What communication automation would be most valuable to your church?",
        sublabel: "Select all that apply.",
        name: "automation_needs",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "auto_text_reminders", label: "Automatic text reminders (service times, events)" },
          { value: "auto_text_followup", label: "Automatic text follow-ups (first-time visitors, absent members)" },
          { value: "auto_email_newsletters", label: "Automatic email newsletters" },
          { value: "auto_email_receipts", label: "Automatic donation receipts & year-end statements" },
          { value: "drip_campaigns", label: "Drip campaigns (new member onboarding series)" },
          { value: "event_reminders", label: "Event RSVP reminders & updates" },
          { value: "birthday_anniversary", label: "Birthday / anniversary messages" },
          { value: "prayer_requests", label: "Automated prayer request collection & distribution" },
          { value: "giving_nudges", label: "Gentle giving reminders / recurring prompts" },
          { value: "none", label: "We don't need automation right now" },
        ],
      },
      {
        label: "How do you communicate with your members today?",
        sublabel: "Select all that apply.",
        name: "member_communication",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "email", label: "Email newsletters" },
          { value: "sms", label: "Text / SMS" },
          { value: "social_media", label: "Social media (Facebook, Instagram)" },
          { value: "church_app", label: "Church app" },
          { value: "bulletin", label: "Printed bulletin / announcements" },
          { value: "word_of_mouth", label: "Word of mouth / phone calls" },
          { value: "group_chat", label: "Group chat (GroupMe, WhatsApp)" },
          { value: "website", label: "Church website" },
          { value: "other", label: "Other" },
        ],
      },
      {
        label: "Would you use a tool that runs automated campaigns for your church?",
        sublabel: "Think: welcome series for visitors, follow-up sequences, fundraiser pushes, seasonal campaigns.",
        name: "campaign_tools_interest",
        type: "radio",
        required: true,
        options: [
          { value: "absolutely", label: "Absolutely — this is a game-changer" },
          { value: "interested", label: "Interested — I'd want to try it" },
          { value: "maybe", label: "Maybe — depends on ease of use" },
          { value: "no", label: "No — we prefer manual communication" },
        ],
      },
      {
        label: "Do you need help with event posting and management?",
        sublabel: "Creating events, collecting RSVPs, sending reminders, tracking attendance.",
        name: "event_posting_needs",
        type: "radio",
        required: true,
        options: [
          { value: "desperately", label: "Yes — we desperately need this" },
          { value: "would_help", label: "It would help but isn't critical" },
          { value: "have_solution", label: "We already have a solution for this" },
          { value: "not_needed", label: "We don't really do events" },
        ],
      },
    ],
  },
  {
    id: "tech_ai",
    half: "tech",
    title: "AI-Powered Tools",
    subtitle: "Imagine AI that listens to your sermons, creates content, and helps you stay connected — automatically.",
    icon: BrainCircuit,
    image: SECTION_IMAGES.tech_ai,
    diagram: <AIContentDiagram />,
    questions: [
      {
        label: "Would you be interested in AI that listens during a live stream or service, then automatically builds forms for members to fill out?",
        sublabel: "Example: AI hears the pastor ask for prayer requests, then auto-creates and sends a prayer-request form to attendees.",
        name: "ai_form_interest",
        type: "radio",
        required: true,
        options: [
          { value: "love_it", label: "Love it — that would save us tons of time" },
          { value: "interested", label: "Interested — I'd want to see a demo" },
          { value: "maybe", label: "Maybe — depends on accuracy and cost" },
          { value: "not_interested", label: "Not interested" },
          { value: "concerned", label: "Concerned about AI in a church setting" },
        ],
      },
      {
        label: "Would you want AI that analyzes your sermon (via live stream) and automatically creates teaching packets, discussion guides, or devotionals for your members?",
        sublabel: "The AI listens to the message, determines the key themes, and generates content — you approve it before it goes out.",
        name: "ai_sermon_content",
        type: "radio",
        required: true,
        options: [
          { value: "amazing", label: "That would be amazing — huge time saver" },
          { value: "try_it", label: "I'd try it — if I can review before sending" },
          { value: "some_interest", label: "Somewhat interested" },
          { value: "not_for_us", label: "Not for us" },
          { value: "prefer_manual", label: "We prefer to create content manually" },
        ],
      },
      {
        label: "Would you want a tool that automatically creates serve-day packets, teaching materials, or small-group guides based on your sermon content?",
        name: "teaching_packets_interest",
        type: "radio",
        required: true,
        options: [
          { value: "yes_weekly", label: "Yes — we'd use this every week" },
          { value: "yes_monthly", label: "Yes — for special events and monthly series" },
          { value: "maybe", label: "Maybe — need to see what it produces" },
          { value: "no", label: "No — we create our own materials" },
        ],
      },
      {
        label: "How important is it that you (the pastor) can approve AI-generated content before it's sent to members?",
        name: "pastor_approval_workflow",
        type: "radio",
        required: true,
        options: [
          { value: "must_approve", label: "Must approve everything — nothing goes out without my OK" },
          { value: "approve_first_then_trust", label: "Approve at first, then let AI handle it once I trust it" },
          { value: "auto_fine", label: "Fully automatic is fine — I trust good AI" },
          { value: "not_interested", label: "Not interested in AI-generated content" },
        ],
      },
    ],
  },
  {
    id: "tech_content",
    half: "tech",
    title: "Member Development & AI Curation",
    subtitle: "Over time, AI could learn your church culture and curate personalized content for every member.",
    icon: LayoutDashboard,
    image: SECTION_IMAGES.tech_content,
    questions: [
      {
        label: "Would you want AI that develops over time to understand your church members and curate content specifically for them?",
        sublabel: "For example: a new believer gets beginner devotionals, a leader gets advanced study guides — all based on your preaching.",
        name: "ai_member_curation",
        type: "radio",
        required: true,
        options: [
          { value: "revolutionary", label: "That sounds revolutionary — I'd pay for this" },
          { value: "very_interested", label: "Very interested — tell me more" },
          { value: "cautious", label: "Cautiously interested — I have questions" },
          { value: "not_needed", label: "Not something we need" },
          { value: "concerned", label: "Concerned about privacy / data" },
        ],
      },
      {
        label: "What tools would help you develop and understand your members over time?",
        sublabel: "Select all that interest you.",
        name: "member_development_tools",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "spiritual_assessments", label: "Spiritual growth assessments / surveys" },
          { value: "personalized_devotionals", label: "Personalized devotionals from your sermons" },
          { value: "small_group_matching", label: "AI-powered small group matching" },
          { value: "attendance_insights", label: "Attendance & engagement insights" },
          { value: "giving_trends", label: "Giving trend analysis per member" },
          { value: "milestone_tracking", label: "Milestone tracking (baptism, membership, serving)" },
          { value: "pastoral_alerts", label: "Pastoral care alerts (absent members, life events)" },
          { value: "auto_check_ins", label: "Automated check-in messages" },
          { value: "none", label: "We don't need these tools" },
        ],
      },
      {
        label: "How do you currently track that your team (staff + volunteers) is learning and growing spiritually?",
        name: "team_growth_tracking",
        type: "radio",
        required: true,
        options: [
          { value: "no_tracking", label: "We don't really track it" },
          { value: "informal", label: "Informal check-ins / conversations" },
          { value: "small_groups", label: "Small-group attendance and feedback" },
          { value: "surveys", label: "Periodic surveys or self-assessments" },
          { value: "software", label: "Dedicated software / discipleship platform" },
        ],
      },
      {
        label: "How do you know how your congregation is doing — spiritually and personally?",
        sublabel: "Select all that apply.",
        name: "congregation_engagement",
        type: "checkboxGroup",
        required: true,
        options: [
          { value: "pastor_conversations", label: "One-on-one pastor conversations" },
          { value: "small_groups", label: "Small-group leaders report back" },
          { value: "prayer_cards", label: "Prayer request cards / forms" },
          { value: "attendance", label: "We track attendance patterns" },
          { value: "giving_patterns", label: "We notice giving patterns" },
          { value: "social_media", label: "Social media engagement" },
          { value: "no_system", label: "Honestly, we don't have a good system" },
          { value: "would_love_help", label: "We'd love a tool that helps with this" },
        ],
      },
      {
        label: "Is there anything else you'd love a church tech tool to do?",
        name: "tech_wishlist_open",
        type: "textarea",
        placeholder: "Share any ideas, frustrations, or dreams — we're building this for you.",
      },
      {
        label: "May we follow up with you?",
        name: "allow_follow_up",
        type: "radio",
        options: [
          { value: "true", label: "Yes, feel free to reach out" },
          { value: "false", label: "No thanks" },
        ],
      },
    ],
  },
];

/* ─── Field renderers ─── */

function TextField({ q, value, onChange }: { q: QuestionDef; value: string; onChange: (v: string) => void }) {
  const inputType = q.type === "email" ? "email" : q.type === "tel" ? "tel" : "text";
  return (
    <input
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={q.placeholder}
      required={q.required}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
    />
  );
}

function SelectField({ q, value, onChange }: { q: QuestionDef; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={q.required}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
    >
      <option value="">Select one…</option>
      {q.options?.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RadioField({ q, value, onChange }: { q: QuestionDef; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {q.options?.map((o) => (
        <label
          key={o.value}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
            value === o.value
              ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <input
            type="radio"
            name={q.name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="accent-emerald-500"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function CheckboxGroupField({ q, value, onChange }: { q: QuestionDef; value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(",").filter(Boolean) : [];
  const toggle = (val: string) => {
    const next = selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val];
    onChange(next.join(","));
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {q.options?.map((o) => (
        <label
          key={o.value}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
            selected.includes(o.value)
              ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="accent-emerald-500"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function TextareaField({ q, value, onChange }: { q: QuestionDef; value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={q.placeholder}
      rows={4}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
    />
  );
}

function QuestionField({ q, value, onChange }: { q: QuestionDef; value: string; onChange: (v: string) => void }) {
  switch (q.type) {
    case "text":
    case "email":
    case "tel":
      return <TextField q={q} value={value} onChange={onChange} />;
    case "select":
      return <SelectField q={q} value={value} onChange={onChange} />;
    case "radio":
      return <RadioField q={q} value={value} onChange={onChange} />;
    case "checkboxGroup":
      return <CheckboxGroupField q={q} value={value} onChange={onChange} />;
    case "textarea":
      return <TextareaField q={q} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

/* ─── 3D Tilt Section Header ─── */
function SectionHeaderCard({ section, step, firstName }: { section: SectionDef; step: number; firstName: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 25 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const SectionIcon = section.icon;
  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease }}
      className="group mb-8 cursor-default"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm transition-shadow duration-500 group-hover:shadow-xl group-hover:shadow-slate-200/50">
        <div className="relative h-52 sm:h-60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={section.image}
            alt={section.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-3 flex items-center gap-2"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${
                section.half === "money" ? "bg-emerald-500" : "bg-blue-500"
              }`}>
                <SectionIcon className="h-4 w-4" />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                section.half === "money" ? "text-emerald-300" : "text-blue-300"
              }`}>
                Section {step + 1} of {SECTIONS.length}
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease }}
              className="text-2xl font-extrabold text-white sm:text-3xl"
            >
              {firstName && step > 0 ? `${firstName}, ` : ""}
              {section.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-1 text-sm text-white/60"
            >
              {section.subtitle}
            </motion.p>
          </div>
          <div
            className={`absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-[0.08] blur-3xl transition-all duration-700 group-hover:opacity-[0.15] group-hover:scale-150 ${
              section.half === "money"
                ? "from-emerald-400 to-teal-400"
                : "from-blue-400 to-indigo-400"
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Part divider ─── */
function PartDivider({ label, partNumber, color }: { label: string; partNumber: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease }}
      className="mx-auto max-w-4xl px-6 py-6"
    >
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ duration: 0.25 }}
        className={`flex items-center gap-4 rounded-2xl ${color} p-5 shadow-lg`}
      >
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl font-bold text-white"
        >
          {partNumber}
        </motion.div>
        <div>
          <p className="text-lg font-bold text-white">{label}</p>
          <p className="text-sm text-white/80">
            {partNumber === 1
              ? "Questions about giving, finances, and pricing"
              : "Questions about tools, AI, automation, and communication"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Progress bar ─── */
function ProgressBar({ current, total, half }: { current: number; total: number; half: "money" | "tech" }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3">
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
          half === "money"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {half === "money" ? "Money & Giving" : "Technology & AI"}
        </span>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                half === "money"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {current + 1} / {total}
        </span>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export function SurveyClient() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const section = SECTIONS[step];
  const firstName = data.respondent_name?.split(" ")[0] ?? "";

  const setField = useCallback(
    (name: string, value: string) => setData((prev) => ({ ...prev, [name]: value })),
    [],
  );

  const canProceed = () => {
    for (const q of section.questions) {
      if (q.required && !data[q.name]?.trim()) return false;
    }
    return true;
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (!canProceed()) {
      formRef.current?.reportValidity();
      return;
    }
    if (step < SECTIONS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/survey/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit survey");
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* Detect part transitions for divider */
  const showMoneyDivider = step === 1;
  const showTechDivider = SECTIONS[step]?.half === "tech" && SECTIONS[step - 1]?.half !== "tech";

  if (submitted) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 to-white px-6">
        <div className="pointer-events-none absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-200/30 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-1/3 h-[300px] w-[300px] rounded-full bg-teal-200/20 blur-[100px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease }}
          className="relative z-10 max-w-lg text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
            transition={{ delay: 0.2, duration: 0.8, ease }}
          >
            <CheckCircle className="mx-auto h-20 w-20 text-emerald-500" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease }}
            className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900"
          >
            Thank you{firstName ? `, ${firstName}` : ""}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease }}
            className="mt-4 text-lg leading-relaxed text-slate-600"
          >
            Your responses will help us build a better platform for churches and nonprofits everywhere.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease }}
          >
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 hover:shadow-emerald-500/30"
            >
              Back to Give
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const SectionIcon = section.icon;
  const isFirst = step === 0;
  const isLast = step === SECTIONS.length - 1;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero with video (first page only) */}
      {isFirst && (
        <div className="relative flex h-[480px] items-center justify-center overflow-hidden bg-slate-950">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            src={HERO_VIDEO}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/50 to-slate-950/90" />
          <div className="grain-overlay absolute inset-0" />
          <div className="orb orb-emerald absolute -left-32 top-1/4 h-[400px] w-[400px] animate-float" />
          <div className="orb orb-cyan absolute -right-24 bottom-1/4 h-[300px] w-[300px] animate-float-delayed" />
          <div className="relative z-10 max-w-3xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm font-medium text-white/70">Church Market Survey</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.4, duration: 0.8, ease }}
              className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
            >
              Help us build the{" "}
              <span className="shimmer-text">
                right tools
              </span>{" "}
              for your church
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.6, duration: 0.7, ease }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl"
            >
              Two sections: <strong className="text-emerald-300">Money &amp; Giving</strong> and{" "}
              <strong className="text-blue-300">Technology &amp; AI</strong>. Takes about 5–7 minutes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="mt-8"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="mx-auto flex w-fit flex-col items-center gap-2"
              >
                <div className="h-8 w-5 rounded-full border-2 border-white/20 p-1">
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    className="h-1.5 w-1.5 rounded-full bg-white/50"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}

      <ProgressBar current={step} total={SECTIONS.length} half={section.half} />

      {/* Part dividers */}
      {showMoneyDivider && (
        <PartDivider
          label="Part 1: Money & Giving"
          partNumber={1}
          color="bg-gradient-to-r from-emerald-600 to-teal-600"
        />
      )}
      {showTechDivider && (
        <PartDivider
          label="Part 2: Technology & AI"
          partNumber={2}
          color="bg-gradient-to-r from-blue-600 to-indigo-600"
        />
      )}

      <div className="relative mx-auto max-w-4xl px-6 py-10">
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -left-32 top-10 h-[300px] w-[300px] rounded-full bg-emerald-100/30 blur-[100px]" />
        <div className="pointer-events-none absolute -right-24 top-1/2 h-[250px] w-[250px] rounded-full bg-blue-100/20 blur-[80px]" />

        <AnimatePresence mode="wait">
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: 40, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -40, filter: "blur(4px)" }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Section header with image — 3D tilt card */}
            <SectionHeaderCard section={section} step={step} firstName={firstName} />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            {section.diagram && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
              >
                {section.diagram}
              </motion.div>
            )}

            {/* Questions — staggered entrance */}
            <form ref={formRef} onSubmit={handleNext} className="space-y-8">
              {section.questions.map((q, qi) => (
                <motion.div
                  key={q.name}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + qi * 0.06, duration: 0.5, ease }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-semibold text-slate-800">
                    {q.label}
                    {q.required && <span className="ml-1 text-red-400">*</span>}
                  </label>
                  {q.sublabel && (
                    <p className="text-xs text-slate-500">{q.sublabel}</p>
                  )}
                  <QuestionField q={q} value={data[q.name] ?? ""} onChange={(v) => setField(q.name, v)} />
                </motion.div>
              ))}

              {/* Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease }}
                className="flex items-center justify-between gap-4 border-t border-slate-100 pt-6"
              >
                <motion.button
                  whileHover={{ scale: 1.03, x: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleBack}
                  disabled={isFirst}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60 ${
                    section.half === "money"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/30"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/30"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Submitting…
                    </span>
                  ) : isLast ? (
                    <>Submit Survey</>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="border-t border-slate-100 bg-slate-50 px-6 py-6 text-center"
      >
        <p className="text-xs text-slate-400">
          Your responses are confidential. We only use contact info if you opt in.
          <br />
          Photos by{" "}
          <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
            Pexels
          </a>
        </p>
      </motion.div>
    </div>
  );
}
