import type { Metadata } from "next";
import { AboutHero } from "./about-hero";
import { FounderSection } from "./founder-section";
import { TeamSection } from "./team-section";
import { AboutStorySection } from "./about-story-section";
import { LandingFormSection } from "@/components/landing-form-section";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "About Us — Give",
  description: "Meet Christopher Figures and the team behind Give. We're building tools so ministries and nonprofits can focus on what matters.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <FounderSection />
      <TeamSection />
      <AboutStorySection />
      <LandingFormSection />
      <SiteFooter />
    </>
  );
}
