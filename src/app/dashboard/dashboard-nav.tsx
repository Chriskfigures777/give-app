"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  isPlatformAdmin: boolean;
  orgId: string | null;
  onboardingCompleted?: boolean;
};

export function DashboardNav({ isPlatformAdmin, orgId, onboardingCompleted }: Props) {
  const pathname = usePathname();

  const link = (href: string, label: string, exact?: boolean) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <li className="shrink-0">
        <Link
          href={href}
          className={`block w-full rounded-lg px-4 py-3 font-medium transition-colors ${
            active
              ? "bg-emerald-500/10 text-emerald-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {label}
        </Link>
      </li>
    );
  };

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {link("/dashboard", "Overview", true)}
      {link("/dashboard/my-donations", "My donations")}
      {(isPlatformAdmin || orgId) && link("/dashboard/donations", "Donations")}
      {!isPlatformAdmin && orgId && (
        <>
          {link("/dashboard/events", "Events")}
          {link("/dashboard/givers", "Givers")}
          {link("/dashboard/customization", "Customization")}
        </>
      )}
      {link("/dashboard/settings", "Settings")}
      {!isPlatformAdmin && orgId && (
        <li className="shrink-0">
          <Link
            href="/dashboard/connect/verify"
            className={`block w-full rounded-lg px-4 py-3 font-medium transition-colors ${
              pathname.startsWith("/dashboard/connect")
                ? "bg-emerald-500/10 text-emerald-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {onboardingCompleted ? "Payout account" : "Complete verification"}
          </Link>
        </li>
      )}
      {isPlatformAdmin && link("/dashboard/admin", "Platform Admin")}
    </ul>
  );
}
