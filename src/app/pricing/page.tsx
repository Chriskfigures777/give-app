import type { Metadata } from "next";
import { PricingHero } from "./pricing-hero";
import { PricingHowItWorks } from "./pricing-how-it-works";
import { PricingBreakdown } from "./pricing-breakdown";
import { PricingWhyChoose } from "./pricing-why-choose";
import { PricingFaq } from "./pricing-faq";
import { LiveDonationFeed } from "@/components/live-donation-feed";
import { LiveStatsPulse } from "@/components/live-stats-pulse";
import { DonationsProvider } from "@/lib/use-donations";
import { LandingFormSection } from "@/components/landing-form-section";
import { SiteFooter } from "@/components/site-footer";
import { getPlatformStats } from "@/lib/platform-stats";

export const metadata: Metadata = {
  title: "Pricing — Give",
  description:
    "Free to use. Pay only when you receive donations. 1% platform fee, Stripe processing. No monthly plans or upfront costs. Built for churches and nonprofits.",
};

export default async function PricingPage() {
  const stats = await getPlatformStats();

  return (
    <>
      <PricingHero stats={stats} />
      <LiveStatsPulse stats={stats} variant="light" />
      <PricingHowItWorks />
      <DonationsProvider>
        <LiveDonationFeed variant="light" />
      </DonationsProvider>
      <PricingBreakdown />
      <PricingWhyChoose />
      <PricingFaq />
      <LandingFormSection />
      <SiteFooter />
    </>
  );
}
