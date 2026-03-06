"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  Wallet,
  Banknote,
  Calendar,
  Users,
  Settings,
  CreditCard,
  ShieldCheck,
  BarChart3,
  FileText,
  Target,
  Handshake,
  Layout,
  FileStack,
  Share2,
  Receipt,
  Code2,
  UserCircle,
  Contact,
  BookOpen,
  ClipboardList,
  Mail,
} from "lucide-react";
import { DashboardShortcuts } from "./dashboard-shortcuts";

type Props = {
  isPlatformAdmin: boolean;
  orgId: string | null;
  onboardingCompleted?: boolean;
  isMissionary?: boolean;
  missionarySponsorOrgId?: string | null;
  plansToBeMissionary?: boolean;
  profileRole?: string;
};

const iconClass = "h-5 w-5 shrink-0";

// BANKGO-matching class strings (no rounded, no font overrides — inherits ~14px default)
// Active:   bg = rgba(52,211,153,0.12)  text = #34d399  icon = #34d399
// Inactive: bg = transparent            text = #eef0f6  icon = #eef0f6
// Hover:    bg = var(--bg-card-hover) at 90% opacity

const navLinkBase =
  "sidebar-nav-link group relative flex w-full items-center gap-3 px-4 py-2.5 transition-colors duration-150";

const navLinkActive =
  "text-[#34d399]";

const navLinkInactive =
  "text-dashboard-text hover:bg-dashboard-card-hover hover:opacity-90";

const navLinkActiveBg = { background: "rgba(52, 211, 153, 0.12)" };

export function DashboardNav({
  isPlatformAdmin,
  orgId,
  onboardingCompleted,
  isMissionary,
  missionarySponsorOrgId,
  plansToBeMissionary,
  profileRole,
}: Props) {
  const pathname = usePathname();
  const [connectionRequestCount, setConnectionRequestCount] = useState(0);

  useEffect(() => {
    if (!orgId) return;
    fetch("/api/peers/pending-requests")
      .then((r) => r.json())
      .then((d) => {
        const incoming = d.incoming ?? [];
        setConnectionRequestCount(incoming.length);
      })
      .catch(() => setConnectionRequestCount(0));
  }, [orgId]);

  const link = (
    href: string,
    label: string,
    icon: React.ReactNode,
    exact?: boolean
  ) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <li className="shrink-0">
        <Link
          href={href}
          title={label}
          className={`${navLinkBase} ${active ? navLinkActive : navLinkInactive}`}
          style={active ? navLinkActiveBg : undefined}
        >
          <span className={`shrink-0 ${active ? "text-[#34d399]" : "text-dashboard-text"}`}>
            {icon}
          </span>
          <span className="sidebar-nav-label">{label}</span>
        </Link>
      </li>
    );
  };

  const NavSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4 last:mb-0">
      <p className="sidebar-section-title mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
        {title}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );

  return (
    <>
      <NavSection title="Overview">
        {link("/dashboard", "Overview", <LayoutDashboard className={iconClass} />, true)}
        {link("/dashboard/my-donations", "My gifts", <Heart className={iconClass} />)}
        {(isMissionary || profileRole === "missionary" || plansToBeMissionary) &&
          link("/dashboard/missionary", "My embed", <Share2 className={iconClass} />)}
        {!orgId && !isPlatformAdmin && (
          <li className="shrink-0">
            <Link
              href="/community"
              title="Community"
              className={`${navLinkBase} ${
                pathname.startsWith("/community") ? navLinkActive : navLinkInactive
              }`}
              style={pathname.startsWith("/community") ? navLinkActiveBg : undefined}
            >
              <span className={`shrink-0 ${pathname.startsWith("/community") ? "text-[#34d399]" : "text-dashboard-text"}`}>
                <Handshake className={iconClass} />
              </span>
              <span className="sidebar-nav-label">Community</span>
            </Link>
          </li>
        )}
      </NavSection>

      {(isPlatformAdmin || orgId) && (
        <NavSection title="Organization">
          {(isPlatformAdmin || orgId) && link("/dashboard/donations", "Donations", <Wallet className={iconClass} />)}

          {!isPlatformAdmin && orgId && (
            <>
              <li className="shrink-0">
                <Link
                  href="/dashboard/connections"
                  title="Peers"
                  className={`${navLinkBase} ${
                    pathname.startsWith("/dashboard/connections") ? navLinkActive : navLinkInactive
                  }`}
                  style={pathname.startsWith("/dashboard/connections") ? navLinkActiveBg : undefined}
                >
                  <span className={`relative shrink-0 ${pathname.startsWith("/dashboard/connections") ? "text-[#34d399]" : "text-dashboard-text"}`}>
                    <Handshake className={iconClass} />
                    {connectionRequestCount > 0 && (
                      <span className="sidebar-badge absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {connectionRequestCount > 9 ? "9+" : connectionRequestCount}
                      </span>
                    )}
                  </span>
                  <span className="sidebar-nav-label">Peers</span>
                </Link>
              </li>
              {link("/dashboard/events", "Events", <Calendar className={iconClass} />)}
              {link("/dashboard/goals", "Goals", <Target className={iconClass} />)}
              {link("/dashboard/people", "People", <Contact className={iconClass} />)}
              {link("/dashboard/givers", "Givers", <Users className={iconClass} />)}
              {link("/dashboard/profile", "Public page", <FileText className={iconClass} />)}
              {link("/dashboard/pages", "Website builder", <Layout className={iconClass} />)}
              {link("/dashboard/pages/cms", "Website content", <FileStack className={iconClass} />)}
              {link("/dashboard/custom-forms", "Custom forms", <Code2 className={iconClass} />)}
              {link("/dashboard/notes", "Notes", <BookOpen className={iconClass} />)}
              {link("/dashboard/surveys", "Surveys", <ClipboardList className={iconClass} />)}
              {link("/dashboard/broadcast", "Send message", <Mail className={iconClass} />)}
            </>
          )}
        </NavSection>
      )}

      <NavSection title="Account">
        {link("/dashboard/account", "My Profile", <UserCircle className={iconClass} />)}
        {link("/dashboard/settings", "Settings", <Settings className={iconClass} />)}
        {!isPlatformAdmin && orgId && link("/dashboard/billing", "Plan & Billing", <Receipt className={iconClass} />)}
        {!isPlatformAdmin && orgId && (
          <>
            <li className="shrink-0">
              <Link
                href="/dashboard/connect/verify"
                title={onboardingCompleted ? "Payout account" : "Complete verification"}
                className={`${navLinkBase} ${
                  pathname.startsWith("/dashboard/connect") ? navLinkActive : navLinkInactive
                }`}
                style={pathname.startsWith("/dashboard/connect") ? navLinkActiveBg : undefined}
              >
                <span className={`shrink-0 ${pathname.startsWith("/dashboard/connect") ? "text-[#34d399]" : "text-dashboard-text"}`}>
                  <CreditCard className={iconClass} />
                </span>
                <span className="sidebar-nav-label">
                  {onboardingCompleted ? "Payout account" : "Complete verification"}
                </span>
              </Link>
            </li>
            {onboardingCompleted && (
              <li className="shrink-0">
                <Link
                  href="/dashboard/connect/manage"
                  title="Manage billing"
                  className={`${navLinkBase} ${
                    pathname === "/dashboard/connect/manage" ? navLinkActive : navLinkInactive
                  }`}
                  style={pathname === "/dashboard/connect/manage" ? navLinkActiveBg : undefined}
                >
                  <span className={`shrink-0 ${pathname === "/dashboard/connect/manage" ? "text-[#34d399]" : "text-dashboard-text"}`}>
                    <Banknote className={iconClass} />
                  </span>
                  <span className="sidebar-nav-label">Manage billing</span>
                </Link>
              </li>
            )}
          </>
        )}
        {isPlatformAdmin && link("/dashboard/admin", "Platform Admin", <ShieldCheck className={iconClass} />)}
        {isPlatformAdmin && link("/dashboard/survey-results", "Survey Results", <BarChart3 className={iconClass} />)}
      </NavSection>

      <DashboardShortcuts orgId={orgId} isPlatformAdmin={isPlatformAdmin} />
    </>
  );
}
