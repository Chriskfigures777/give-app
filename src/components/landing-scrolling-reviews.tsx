"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Pastor Michael Thompson",
    role: "Lead Pastor, Cornerstone Church",
    location: "Dallas, TX",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "Give transformed how our congregation supports missions. We went from paper envelopes to a seamless digital experience. Our giving increased 45% in the first three months alone.",
  },
  {
    name: "Sarah Williams",
    role: "Executive Director, Hope Foundation",
    location: "Atlanta, GA",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "As a nonprofit, we needed something simple and trustworthy. Give lets our donors feel confident that every dollar goes where it should. The transparency features are unmatched.",
  },
  {
    name: "David & Maria Chen",
    role: "Youth Ministry Directors",
    location: "San Francisco, CA",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "Our youth fundraisers used to be chaotic. Now we embed a Give form on our page and donations flow in automatically. The recurring giving feature means consistent funding for our programs.",
  },
  {
    name: "Rev. James Okafor",
    role: "Senior Pastor, New Life Assembly",
    location: "Houston, TX",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "We support 12 missionaries and the automated splits changed everything. No more manual calculations or late payments. Our missionaries receive their support the moment someone gives.",
  },
  {
    name: "Emily Rodriguez",
    role: "Church Administrator",
    location: "Phoenix, AZ",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "I used to spend 15 hours a week on donation tracking. With Give's dashboard, it takes me 30 minutes. The receipts are automatic, the reports are beautiful, and our members love the experience.",
  },
  {
    name: "Pastor Robert Kim",
    role: "Founding Pastor, Grace Korean Church",
    location: "Los Angeles, CA",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "Our bilingual congregation needed a solution that works for everyone. Give's mobile-first forms are so intuitive that even our elderly members use it comfortably. Truly inclusive.",
  },
  {
    name: "Angela Foster",
    role: "Operations Manager, City Light Ministries",
    location: "Nashville, TN",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "Connecting with partner nonprofits through Give has been a game-changer. We share donation forms with three local shelters and the combined impact reporting shows our congregation the real difference they make.",
  },
  {
    name: "Marcus & Tina Jackson",
    role: "Small Group Leaders",
    location: "Charlotte, NC",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "Setting up recurring giving for our family took 2 minutes. We love seeing exactly where our tithe goes each month. The transparency builds so much trust between us and our church leadership.",
  },
  {
    name: "Dr. Patricia Adams",
    role: "Board Chair, Faith Community Foundation",
    location: "Chicago, IL",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "We evaluated five platforms before choosing Give. The combination of Stripe-powered security, beautiful design, and the endowment fund feature made it the clear winner for our foundation.",
  },
  {
    name: "Pastor Daniel Wright",
    role: "Community Pastor, The Bridge Church",
    location: "Denver, CO",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=face&q=80",
    stars: 5,
    text: "We went from relying on a single government grant to having 200+ recurring donors in under six months. Give didn't just give us a tool—it gave us financial independence to pursue our calling.",
  },
];

function ReviewCard({ review }: { review: (typeof REVIEWS)[number] }) {
  return (
    <div className="flex w-[360px] shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-lg sm:w-[400px]">
      {/* Stars */}
      <div className="mb-4 flex gap-0.5">
        {Array.from({ length: review.stars }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-amber-400 text-amber-400"
          />
        ))}
      </div>

      {/* Review text */}
      <p className="flex-1 text-[14px] leading-relaxed text-slate-600">
        &ldquo;{review.text}&rdquo;
      </p>

      {/* Person */}
      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
        <img
          src={review.avatar}
          alt={review.name}
          className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {review.name}
          </p>
          <p className="truncate text-xs text-slate-500">
            {review.role}
          </p>
          <p className="text-[11px] text-slate-400">{review.location}</p>
        </div>
      </div>
    </div>
  );
}

export function LandingScrollingReviews() {
  const topRow = REVIEWS.slice(0, 5);
  const bottomRow = REVIEWS.slice(5, 10);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white py-20 md:py-28">
      {/* Subtle decorative bg */}
      <div className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-50/40 blur-[100px]" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl px-6 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Trusted by churches everywhere
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Hear from our community
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Churches and faith-based organizations share how Give has
            transformed their giving experience.
          </p>
        </motion.div>

        {/* Scrolling rows */}
        <div className="mt-14 space-y-5">
          {/* Row 1 — scrolls left */}
          <div className="relative">
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent sm:w-40" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent sm:w-40" />

            <div className="flex gap-5 animate-marquee" style={{ width: "max-content" }}>
              {[...topRow, ...topRow].map((review, i) => (
                <ReviewCard key={`top-${i}`} review={review} />
              ))}
            </div>
          </div>

          {/* Row 2 — scrolls right (reversed) */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent sm:w-40" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent sm:w-40" />

            <div
              className="flex gap-5"
              style={{
                width: "max-content",
                animation: "marqueeReverse 45s linear infinite",
              }}
            >
              {[...bottomRow, ...bottomRow].map((review, i) => (
                <ReviewCard key={`bottom-${i}`} review={review} />
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center text-xs text-slate-400"
        >
          These testimonials are illustrative examples and do not represent
          actual individuals or organizations.
        </motion.p>
      </div>
    </section>
  );
}
