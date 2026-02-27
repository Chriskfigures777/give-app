import { Building2, Church, Heart, Users, Zap, User } from "lucide-react";

type BadgeVariant =
  | "church"
  | "nonprofit"
  | "missionary"
  | "donor"
  | "member"
  | "organization"
  | string;

const BADGE_CONFIGS: Record<
  string,
  { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }
> = {
  church: {
    label: "Church",
    classes:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    icon: Church,
  },
  nonprofit: {
    label: "Nonprofit",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    icon: Building2,
  },
  missionary: {
    label: "Missionary",
    classes:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    icon: Zap,
  },
  donor: {
    label: "Donor",
    classes:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    icon: Heart,
  },
  member: {
    label: "Member",
    classes:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    icon: Users,
  },
  organization: {
    label: "Organization",
    classes:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
    icon: Building2,
  },
};

function getFallback(type: string) {
  return {
    label: type.charAt(0).toUpperCase() + type.slice(1),
    classes:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    icon: User,
  };
}

export function UserTypeBadge({
  type,
  size = "sm",
}: {
  type: BadgeVariant;
  size?: "xs" | "sm";
}) {
  const config = BADGE_CONFIGS[type] ?? getFallback(type);
  const Icon = config.icon;

  const sizeClasses =
    size === "xs"
      ? "px-1.5 py-0.5 text-[10px] gap-0.5"
      : "px-2 py-0.5 text-xs gap-1";
  const iconSize = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses} ${config.classes}`}
    >
      <Icon className={iconSize} />
      {config.label}
    </span>
  );
}
