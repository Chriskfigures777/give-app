import { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { CaseStudiesContent } from "./case-studies-content";

export const metadata: Metadata = {
  title: "Case Studies | Give — Hypothetical Scenarios for Churches",
  description:
    "Explore hypothetical case studies showing how churches and faith-based nonprofits could transform their giving with Give.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <CaseStudiesContent />
      <SiteFooter />
    </>
  );
}
