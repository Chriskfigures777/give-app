"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/members", label: "Members", icon: Users, exact: false },
  { href: "/dashboard/admin/organizations", label: "Organizations", icon: Building2, exact: false },
  { href: "/dashboard/admin/surveys", label: "Surveys", icon: MessageSquare, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out ${
              isActive
                ? "bg-white dark:bg-slate-700 text-dashboard-text shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2]"
                : "text-dashboard-text-muted hover:text-dashboard-text"
            }`}
          >
            <Icon
              className={`h-4 w-4 transition-colors duration-200 ${
                isActive ? "text-emerald-600 dark:text-emerald-400" : ""
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
