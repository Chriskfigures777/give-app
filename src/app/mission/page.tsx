import type { Metadata } from "next";
import Link from "next/link";
import { MissionHero } from "./mission-hero";
import { MissionZigzag } from "./mission-zigzag";
import { LandingFormSection } from "@/components/landing-form-section";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Our Mission — Give",
  description:
    "Our mission is to change the lives of families, nonprofits, and organizations—and to help change the communities around us.",
};

export default function MissionPage() {
  return (
    <>
      <MissionHero />
      <MissionZigzag />

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-slate-950 py-24">
        <div className="orb orb-emerald absolute -right-32 top-0 h-[400px] w-[400px]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to start accepting donations?
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Join thousands of organizations that trust Give to handle their
            donations with transparency and impact.
          </p>
          <Link
            href="/signup"
            className="glow-btn mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            Get started free
          </Link>
        </div>
      </section>

      <LandingFormSection />
      <SiteFooter />
    </>
  );
}
