import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { HeroSectionClient } from "@/components/hero-section-client";
import { LandingFeaturedOrgs } from "@/components/landing-featured-orgs";
import { LandingFeatures } from "@/components/landing-features";
import { LandingPainPoints } from "@/components/landing-pain-points";
import { LandingPricingTiers } from "@/components/landing-pricing-tiers";
import { LandingScrollingReviews } from "@/components/landing-scrolling-reviews";
import { LandingMissionSection } from "@/components/landing-mission-section";
import { LandingStorySections } from "@/components/landing-story-sections";
import { LiveDonationFeed } from "@/components/live-donation-feed";
import { LiveStatsPulse } from "@/components/live-stats-pulse";
import { LandingFormSection } from "@/components/landing-form-section";
import { SiteFooter } from "@/components/site-footer";
import { getPlatformStats } from "@/lib/platform-stats";
import { DonationsProvider } from "@/lib/use-donations";

export default async function HomePage() {
  const { user } = await getSession();
  if (user) redirect("/feed");

  const stats = await getPlatformStats();

  /* ─────────────────────────────────────────────────────────────
     2026 High-Conversion Homepage Layout (MAP Framework)
     Research: SaaS Hero, Blur Test, NextAfter, CRO studies

     MOTIVATE  → Hero, Pain Points, Features (problem → solution)
     ASSURE    → Reviews, Pricing, Stories, Live Proof
     PROMPT    → Mission, Final CTA, Footer
     ───────────────────────────────────────────────────────────── */
  return (
    <DonationsProvider>
      {/* ── MOTIVATE: Hook in 3-5 seconds ── */}
      {/* 1. Hero — outcome-first headline, trust badges, live donation card */}
      <HeroSectionClient stats={stats} />

      {/* 2. Pain Points — validate the problem immediately (problem-first positioning) */}
      <LandingPainPoints />

      {/* 3. Features — show the solution right after identifying the pain */}
      <LandingFeatures />

      {/* ── ASSURE: Build trust & remove objections ── */}
      {/* 4. Scrolling Reviews — first social proof layer (testimonials) */}
      <LandingScrollingReviews />

      {/* 5. Pricing — 60% of visitors check pricing before anything else; free tier removes friction */}
      <LandingPricingTiers />

      {/* 6. Story Sections — deeper narrative for engaged visitors */}
      <LandingStorySections />

      {/* 7. Live Donation Feed — real-time social proof creates urgency */}
      <LiveDonationFeed variant="dark" />

      {/* 8. Featured Orgs — platform credibility (organizations already on Give) */}
      <LandingFeaturedOrgs />

      {/* ── PROMPT: Convert remaining visitors ── */}
      {/* 9. Mission — purpose/values for deep scrollers who need "why" */}
      <LandingMissionSection />

      {/* 10. Live Stats — platform-wide momentum */}
      <LiveStatsPulse stats={stats} variant="dark" />

      {/* 11. Final CTA — last-chance conversion with contact form */}
      <LandingFormSection />

      <SiteFooter />
    </DonationsProvider>
  );
}
