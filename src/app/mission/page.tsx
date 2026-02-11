import type { Metadata } from "next";
import Link from "next/link";
import { MissionHero } from "./mission-hero";
import { MissionZigzag } from "./mission-zigzag";
import { LandingFormSection } from "@/components/landing-form-section";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Our Mission — Give",
  description: "Our mission is to change the lives of families, nonprofits, and organizations. 1% transaction fee; 30% goes to endowment funds. We manage every investment so it goes toward a good cause.",
};

export default function MissionPage() {
  return (
    <>
      <MissionHero />
      <MissionZigzag />
      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-lg text-slate-600">
            Ready to start accepting donations and directing impact?
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Get started
          </Link>
        </div>
      </section>
      <LandingFormSection />
      <SiteFooter />
    </>
  );
}
