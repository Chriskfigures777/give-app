"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What does the Free plan include?",
    answer:
      "The Free plan includes: unlimited donations (no cap), donation dashboard with real-time stats, donation analytics and history, embedded donation forms (paste on any site), embed cards with multiple themes, donation links (shareable URLs), public org page, Peers (connect with other orgs), connection requests and approvals, messaging with connected orgs, events (create and manage), goals and donation campaigns, givers list and management, form customization (colors, amounts, images), suggested amounts and custom amounts, recurring gifts (monthly, etc.) and one-time gifts, anonymous giving option, endowment fund selection, QR codes for your give page, Stripe Connect payouts, payout history and bank account, year-end tax receipts, My gifts (giver history), missionary embed (if you're a missionary), Feed and Explore, and realtime donation feed. You also get a 14-day trial of the Website builder and a 14-day trial of Split transactions. No credit card required.",
  },
  {
    question: "What is the 14-day trial for paid plans?",
    answer:
      "When you sign up for the Website ($35/mo) or Pro ($49/mo) plan, you get a 14-day free trial. No charge for 14 days — $0 for two weeks. Try the website builder, split transactions, custom domains, and everything in that plan. After 14 days, you'll be charged $35/mo (Website) or $49/mo (Pro) unless you cancel. Cancel anytime before the trial ends if it's not for you.",
  },
  {
    question: "What's the difference between Website ($35) and Pro ($49)?",
    answer:
      "Website ($35/mo) includes everything in Free plus: website builder (limited templates), split transactions with peers and missionaries, custom domains, add givers as missionaries, and payment splits to connected orgs. Pro ($49/mo) includes everything in Website plus: full website builder (all templates), website CMS (edit pages and blocks), unlimited website pages, and advanced analytics. Both include a 14-day free trial.",
  },
  {
    question: "What are the fees?",
    answer:
      "Give charges a 1% platform fee on each donation. Stripe charges 2.9% + $0.30 per transaction for card processing. These fees are only deducted when a donation is processed—there are no monthly or upfront costs.",
  },
  {
    question: "What is the endowment option?",
    answer:
      "Give donates 30% of the platform fee (0.3% of each transaction) to endowment funds. Givers can optionally choose which endowment fund receives this allocation. It's completely transparent and optional.",
  },
  {
    question: "Do I need to pay monthly or upfront?",
    answer:
      "No. Give is free to use. There are no setup fees, no monthly plans, and no commitments. You only pay when you receive donations—the platform fee and Stripe fees are applied at the time of each transaction.",
  },
  {
    question: "Can givers cover the fees?",
    answer:
      "Yes. Givers can choose to cover the platform fee (1%), the processing fees (2.9% + 30¢), or both. When givers cover fees, your organization receives the full donation amount.",
  },
  {
    question: "How does the platform fee work?",
    answer:
      "When a donation is processed, 1% goes to Give to support the platform. Of that 1%, 30% can be allocated to endowment funds by the giver. Your organization receives the donation minus the platform fee and Stripe processing fees—unless the giver chooses to cover them.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-6 text-left transition-colors group"
        aria-expanded={isOpen}
      >
        <span className="text-[17px] font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
          {question}
        </span>
        <div
          className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            isOpen
              ? "bg-emerald-100 text-emerald-600 rotate-180"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[15px] leading-relaxed text-slate-600">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative bg-slate-50/50 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Common questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Everything you need to know about pricing on Give.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl rounded-3xl border border-slate-200/80 bg-white px-8 py-2 shadow-xl sm:px-10"
        >
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === i}
              onToggle={() =>
                setOpenIndex(openIndex === i ? null : i)
              }
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
