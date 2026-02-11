"use client";

import Link from "next/link";
import { useUser } from "@/lib/use-user";

const BRAND_DESCRIPTION =
  "Donations for churches and nonprofits. Fast, simple, secure.";

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
  { href: "/about", label: "About Us" },
];

const QUICK_LINKS_LOGGED_OUT: FooterLinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/mission", label: "Mission" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign up" },
];

const QUICK_LINKS_LOGGED_IN: FooterLinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
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
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
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
          className="text-sm text-slate-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 font-inherit"
        >
          {label}
        </button>
      </form>
    );
  }
  return (
    <Link
      href={href}
      className="text-sm text-slate-300 hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}

export function SiteFooter() {
  const { user } = useUser();
  const platformLinks = user ? PLATFORM_LINKS_LOGGED_IN : PLATFORM_LINKS_LOGGED_OUT;
  const quickLinks = user ? QUICK_LINKS_LOGGED_IN : QUICK_LINKS_LOGGED_OUT;

  return (
    <footer className="w-full bg-[#1F2937] text-slate-200 mt-auto">
      <div className="w-full max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 justify-items-start">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-xs">
            <Link
              href="/"
              className="text-xl font-bold text-white hover:text-slate-100 transition-colors"
            >
              Give
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {BRAND_DESCRIPTION}
            </p>
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
              <FooterLink key={link.href} href={link.href} label={link.label} />
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

          {/* Contact */}
          <FooterColumn title="Contact">
            <a
              href="mailto:support@example.com"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              support@example.com
            </a>
            <p className="text-sm text-slate-400">Get in touch for support.</p>
          </FooterColumn>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-600/80">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Give. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
