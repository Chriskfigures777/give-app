"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/use-user";
import { Twitter, Linkedin, Github, ArrowRight } from "lucide-react";
import { BrandMark } from "./brand-mark";

const BRAND_DESCRIPTION =
  "The modern donation platform for churches and nonprofits. Fast, transparent, impactful.";

type FooterLinkItem = { href: string; label: string; isForm?: boolean };

const PLATFORM_LINKS_LOGGED_OUT: FooterLinkItem[] = [
  { href: "/give", label: "Give" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Sign up" },
];

const PLATFORM_LINKS_LOGGED_IN: FooterLinkItem[] = [
  { href: "/give", label: "Give" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/api/auth/signout", label: "Sign out", isForm: true },
];

const WHO_WE_SERVE: FooterLinkItem[] = [
  { href: "/mission", label: "Churches & Nonprofits" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About Us" },
];

const QUICK_LINKS_LOGGED_OUT: FooterLinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/mission", label: "Mission" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign up" },
];

const QUICK_LINKS_LOGGED_IN: FooterLinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/mission", label: "Mission" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/api/auth/signout", label: "Sign out", isForm: true },
];

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FooterLink({ href, label, isForm }: FooterLinkItem) {
  if (isForm && href === "/api/auth/signout") {
    return (
      <form action="/api/auth/signout" method="POST" className="inline">
        <button
          type="submit"
          className="text-sm text-white/60 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 font-inherit"
        >
          {label}
        </button>
      </form>
    );
  }
  return (
    <Link
      href={href}
      className="text-sm text-white/60 hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}

const SOCIAL_LINKS = [
  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
  { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
  { href: "https://github.com", icon: Github, label: "GitHub" },
];

export function SiteFooter() {
  const { user } = useUser();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const platformLinks = user
    ? PLATFORM_LINKS_LOGGED_IN
    : PLATFORM_LINKS_LOGGED_OUT;
  const quickLinks = user ? QUICK_LINKS_LOGGED_IN : QUICK_LINKS_LOGGED_OUT;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) setNewsletterSubmitted(true);
  };

  return (
    <footer className="relative w-full bg-slate-950 mt-auto overflow-hidden">
      {/* Decorative top gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="relative w-full max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 pt-20 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 justify-items-start">
          {/* Brand */}
          <div className="flex flex-col gap-5 max-w-xs lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center"
            >
              <BrandMark
                className="h-9 w-9 drop-shadow-[0_8px_12px_rgba(16,185,129,0.25)]"
                id="footer"
              />
            </Link>
            <p className="text-sm leading-relaxed text-white/50">
              {BRAND_DESCRIPTION}
            </p>
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-white/50 transition-all hover:bg-white/[0.1] hover:text-white"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <FooterColumn title="Platform">
            {platformLinks.map((link) => (
              <FooterLink
                key={link.href + link.label}
                href={link.href}
                label={link.label}
                isForm={link.isForm}
              />
            ))}
          </FooterColumn>

          {/* Who We Serve */}
          <FooterColumn title="Who We Serve">
            {WHO_WE_SERVE.map((link) => (
              <FooterLink
                key={link.href}
                href={link.href}
                label={link.label}
              />
            ))}
          </FooterColumn>

          {/* Quick Links */}
          <FooterColumn title="Quick Links">
            {quickLinks.map((link) => (
              <FooterLink
                key={link.href + link.label}
                href={link.href}
                label={link.label}
                isForm={link.isForm}
              />
            ))}
          </FooterColumn>

          {/* Newsletter */}
          <div className="flex flex-col gap-4 max-w-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Stay updated
            </h3>
            {newsletterSubmitted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-medium text-emerald-400">
                  Thanks for subscribing!
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex gap-2"
              >
                <input
                  type="email"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-emerald-500 p-2.5 text-white transition-all hover:bg-emerald-400"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:justify-between">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Give. All rights reserved.
          </p>
          <a
            href="mailto:support@give.com"
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            support@give.com
          </a>
        </div>
      </div>

      {/* Decorative orbs */}
      <div className="orb orb-emerald absolute -left-48 bottom-0 h-[400px] w-[400px] opacity-30" />
      <div className="orb orb-cyan absolute -right-32 top-0 h-[300px] w-[300px] opacity-20" />
    </footer>
  );
}
