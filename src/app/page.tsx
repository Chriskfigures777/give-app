import { HeroSection } from "@/components/hero-section";
import { LandingFeatures } from "@/components/landing-features";
import { LandingMissionSection } from "@/components/landing-mission-section";
import { LandingStorySections } from "@/components/landing-story-sections";
import { LandingStats } from "@/components/landing-stats";
import { LandingFormSection } from "@/components/landing-form-section";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LandingMissionSection />
      <LandingFeatures />
      <LandingStorySections />
      <LandingStats />
      <LandingFormSection />
      <SiteFooter />
    </>
  );
}
