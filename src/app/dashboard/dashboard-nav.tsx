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
  Palette,
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

export function DashboardNav({ isPlatformAdmin, orgId, onboardingCompleted, isMissionary, missionarySponsorOrgId, plansToBeMissionary, profileRole }: Props) {
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
          className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
            active
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/10"
              : "text-dashboard-text-muted hover:bg-dashboard-card-hover/60 hover:text-dashboard-text"
          }`}
        >
          <span className={`transition-colors ${active ? "text-emerald-600 dark:text-emerald-400" : "text-dashboard-text-muted group-hover:text-dashboard-text"}`}>
            {icon}
          </span>
          <span>{label}</span>
        </Link>
      </li>
    );
  };

  const NavSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5 last:mb-0">
      <p className="mb-1.5 px-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-dashboard-text-muted/70">
        {title}
      </p>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );

  return (
    <>
      <NavSection title="Overview">
        {link("/dashboard", "Overview", <LayoutDashboard className={iconClass} />, true)}
        {link("/dashboard/my-donations", "My gifts", <Heart className={iconClass} />)}
        {(isMissionary || profileRole === "missionary" || plansToBeMissionary) &&
          link("/dashboard/missionary", "My embed", <Share2 className={iconClass} />)}
      </NavSection>

      {(isPlatformAdmin || orgId) && (
        <NavSection title="Organization">
          {(isPlatformAdmin || orgId) && link("/dashboard/donations", "Donations", <Wallet className={iconClass} />)}
          {!isPlatformAdmin && orgId && (
            <>
              <li className="shrink-0">
                <Link
                  href="/dashboard/connections"
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                    pathname.startsWith("/dashboard/connections")
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/10"
                      : "text-dashboard-text-muted hover:bg-dashboard-card-hover/60 hover:text-dashboard-text"
                  }`}
                >
                  <span className="relative">
                    <Handshake className={iconClass} />
                    {connectionRequestCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {connectionRequestCount > 9 ? "9+" : connectionRequestCount}
                      </span>
                    )}
                  </span>
                  <span>Peers</span>
                </Link>
              </li>
              {link("/dashboard/events", "Events", <Calendar className={iconClass} />)}
              {link("/dashboard/goals", "Goals", <Target className={iconClass} />)}
              {link("/dashboard/givers", "Givers", <Users className={iconClass} />)}
              {link("/dashboard/profile", "Public page", <FileText className={iconClass} />)}
              {link("/dashboard/pages", "Website builder", <Layout className={iconClass} />)}
              {link("/dashboard/pages/cms", "Website content", <FileStack className={iconClass} />)}
              {link("/dashboard/customization", "Form Design", <Palette className={iconClass} />)}
            </>
          )}
        </NavSection>
      )}

      <NavSection title="Account">
        {link("/dashboard/settings", "Settings", <Settings className={iconClass} />)}
        {!isPlatformAdmin && orgId && link("/dashboard/billing", "Plan & Billing", <Receipt className={iconClass} />)}
        {!isPlatformAdmin && orgId && (
          <>
            <li className="shrink-0">
              <Link
                href="/dashboard/connect/verify"
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  pathname.startsWith("/dashboard/connect")
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/10"
                    : "text-dashboard-text-muted hover:bg-dashboard-card-hover/60 hover:text-dashboard-text"
                }`}
              >
                <CreditCard className={iconClass} />
                <span>{onboardingCompleted ? "Payout account" : "Complete verification"}</span>
              </Link>
            </li>
            {onboardingCompleted && (
              <>
                <li className="shrink-0">
                  <Link
                    href="/dashboard/connect/manage"
                    className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      pathname === "/dashboard/connect/manage"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/10"
                        : "text-dashboard-text-muted hover:bg-dashboard-card-hover/60 hover:text-dashboard-text"
                    }`}
                  >
                    <Banknote className={iconClass} />
                    <span>Manage billing</span>
                  </Link>
                </li>
              </>
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
