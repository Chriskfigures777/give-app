"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Utensils,
  Home,
  HeartPulse,
  Users,
  Palette,
  Megaphone,
  Baby,
  HandHeart,
  Globe,
  Scale,
  FlaskConical,
} from "lucide-react";

const CAUSES = [
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "hunger", label: "Hunger", icon: Utensils },
  { id: "housing", label: "Housing", icon: Home },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "community", label: "Community", icon: Users },
  { id: "arts", label: "Arts", icon: Palette },
  { id: "outreach", label: "Outreach", icon: Megaphone },
  { id: "youth", label: "Youth", icon: Baby },
  { id: "homeless", label: "Homelessness", icon: HandHeart },
  { id: "missions", label: "Missions", icon: Globe },
  { id: "social justice", label: "Social Justice", icon: Scale },
  { id: "research", label: "Research", icon: FlaskConical },
];

export function CauseChips() {
  const searchParams = useSearchParams();

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Browse by cause
      </h2>
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {CAUSES.map((cause) => {
          const params = new URLSearchParams(searchParams.toString());
          const isActive = params.get("cause") === cause.id;
          if (isActive) params.delete("cause");
          else params.set("cause", cause.id);
          params.delete("offset");
          const href = `/explore?${params.toString()}`;
          const Icon = cause.icon;

          return (
            <Link
              key={cause.id}
              href={href}
              className={`group flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                  : "border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md"
              }`}
            >
              <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-emerald-100" : "text-slate-400 group-hover:text-emerald-500"}`} />
              {cause.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
