import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MembersTable } from "./members-table";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("user_profiles")
    .select("id, full_name, email, role, organization_id, preferred_organization_id, is_missionary, missionary_sponsor_org_id, created_at")
    .order("created_at", { ascending: false });

  // Count by type
  const donors = users?.filter((u) => u.role === "donor") ?? [];
  const missionaries = users?.filter((u) => u.role === "missionary" || u.is_missionary) ?? [];
  const orgAdmins = users?.filter((u) => u.role === "organization_admin") ?? [];
  const platformAdmins = users?.filter((u) => u.role === "platform_admin") ?? [];

  const tabs = [
    { id: "all", label: "All members", count: users?.length ?? 0 },
    { id: "donors", label: "Donors", count: donors.length },
    { id: "missionaries", label: "Missionaries", count: missionaries.length },
    { id: "nonprofits", label: "Non-Profits", count: orgAdmins.length },
    { id: "admins", label: "Platform Admins", count: platformAdmins.length },
  ];

  const activeUsers =
    tab === "donors" ? donors
    : tab === "missionaries" ? missionaries
    : tab === "nonprofits" ? orgAdmins
    : tab === "admins" ? platformAdmins
    : (users ?? []);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/admin/members?tab=${t.id}`}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-dashboard-card border border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text hover:border-dashboard-border/80"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                tab === t.id
                  ? "bg-white/20 text-white"
                  : "bg-dashboard-card-hover text-dashboard-text-muted"
              }`}
            >
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        <MembersTable users={activeUsers} activeTab={tab} />
      </section>
    </div>
  );
}
