import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, Receipt, Heart, CreditCard } from "lucide-react";
import { ManageSubscriptionsButton } from "./manage-subscriptions-button";
import { YearEndDownload } from "./year-end-download";

export default async function MyDonationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch recurring subscriptions
  const { data: subscriptions } = await supabase
    .from("donor_subscriptions")
    .select(`
      id,
      amount_cents,
      currency,
      interval,
      status,
      created_at,
      organizations(name, slug)
    `)
    .eq("user_id", user.id)
    .in("status", ["active", "past_due"]);

  type SubRow = {
    id: string;
    amount_cents: number;
    currency: string;
    interval: string;
    status: string;
    created_at: string | null;
    organizations: { name: string; slug: string } | null;
  };
  const activeSubs = (subscriptions ?? []) as SubRow[];

  // Fetch saved organizations for quick give
  const { data: savedOrgs } = await supabase
    .from("donor_saved_organizations")
    .select(`
      organization_id,
      organizations(name, slug)
    `)
    .eq("user_id", user.id);

  type SavedOrgRow = {
    organization_id: string;
    organizations: { name: string; slug: string } | null;
  };
  const savedOrgsList = (savedOrgs ?? []) as SavedOrgRow[];
  const seenOrgIds = new Set<string>();
  const uniqueSavedOrgs = savedOrgsList.filter((o) => {
    if (!o.organizations?.slug || seenOrgIds.has(o.organization_id)) return false;
    seenOrgIds.add(o.organization_id);
    return true;
  });

  // Fetch donations by user_id (when logged in) or donor_email
  const { data: byUserId } = await supabase
    .from("donations")
    .select(`
      id,
      amount_cents,
      status,
      created_at,
      donor_email,
      donor_name,
      currency,
      organization_id,
      campaign_id,
      organizations(name, slug),
      donation_campaigns(name)
    `)
    .eq("user_id", user.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: byEmail } = user.email
    ? await supabase
        .from("donations")
        .select(`
          id,
          amount_cents,
          status,
          created_at,
          donor_email,
          donor_name,
          currency,
          organization_id,
          campaign_id,
          organizations(name, slug),
          donation_campaigns(name)
        `)
        .eq("donor_email", user.email)
        .eq("status", "succeeded")
        .is("user_id", null)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  type DonationRow = {
    id: string;
    amount_cents: number;
    status: string;
    created_at: string | null;
    donor_email: string | null;
    donor_name: string | null;
    currency: string;
    organization_id: string | null;
    campaign_id: string | null;
    organizations: { name: string; slug: string } | null;
    donation_campaigns: { name: string } | null;
  };

  const byUserIdList = (byUserId ?? []) as DonationRow[];
  const byEmailList = (byEmail ?? []) as DonationRow[];
  const seenIds = new Set(byUserIdList.map((d) => d.id));
  const merged = [
    ...byUserIdList,
    ...byEmailList.filter((d) => !seenIds.has(d.id) && seenIds.add(d.id)),
  ].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );

  const totalCents = merged.reduce((sum, d) => sum + Number(d.amount_cents ?? 0), 0);
  const currentYear = new Date().getFullYear();
  const ytdCents = merged
    .filter((d) => new Date(d.created_at ?? 0).getFullYear() === currentYear)
    .reduce((sum, d) => sum + Number(d.amount_cents ?? 0), 0);

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="dashboard-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My gifts</h1>
        <p className="mt-1 text-slate-600">
          View your giving history and download tax receipts.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total given</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                ${(totalCents / 100).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <Receipt className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="dashboard-fade-in dashboard-fade-in-delay-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Year to date ({currentYear})</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                ${(ytdCents / 100).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-violet-500/10 p-2.5">
              <Heart className="h-6 w-6 text-violet-600" />
            </div>
          </div>
        </div>
        <div className="dashboard-fade-in dashboard-fade-in-delay-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Gifts</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{merged.length}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-2.5">
              <Download className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Year-end tax summary */}
      <YearEndDownload hasDonations={merged.length > 0} />

      {/* Recurring subscriptions — manage payments */}
      {activeSubs.length > 0 && (
        <div className="dashboard-fade-in dashboard-fade-in-delay-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Recurring payments
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your monthly or yearly gifts. Update payment method, change amount, or cancel.
            </p>
          </div>
          <ul className="divide-y divide-slate-200">
            {activeSubs.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    ${(Number(s.amount_cents) / 100).toLocaleString()}
                    /{s.interval === "month" ? "month" : "year"} to {s.organizations?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.created_at
                      ? `Started ${new Date(s.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
                      : ""}
                  </p>
                </div>
                <ManageSubscriptionsButton />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Give — saved organizations */}
      {uniqueSavedOrgs.length > 0 && (
        <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden ${activeSubs.length > 0 ? "dashboard-fade-in dashboard-fade-in-delay-5" : "dashboard-fade-in dashboard-fade-in-delay-4"}`}>
          <div className="border-b border-slate-200/80 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="h-4 w-4 text-emerald-600" />
              Quick give — pay directly
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organizations you&apos;ve supported, saved to your profile. Give again in one click.
            </p>
          </div>
          <ul className="divide-y divide-slate-200">
            {uniqueSavedOrgs.map((o) => (
              <li
                key={o.organization_id}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/50"
              >
                <span className="font-medium text-slate-900">
                  {o.organizations?.name ?? "Unknown"}
                </span>
                <Link
                  href={`/give/${o.organizations!.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Give now
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Donation list */}
      <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden ${activeSubs.length > 0 && uniqueSavedOrgs.length > 0 ? "dashboard-fade-in dashboard-fade-in-delay-6" : activeSubs.length > 0 || uniqueSavedOrgs.length > 0 ? "dashboard-fade-in dashboard-fade-in-delay-5" : "dashboard-fade-in dashboard-fade-in-delay-4"}`}>
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">Giving history</h2>
        </div>
        {merged.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p>No gifts yet.</p>
            <p className="text-sm mt-1">Gifts made while logged in will appear here.</p>
            <Link href="/" className="mt-4 inline-block text-emerald-600 hover:underline">
              Find an organization to support →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {merged.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50/50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    ${(Number(d.amount_cents) / 100).toLocaleString()} to{" "}
                    {d.organizations?.name ?? "Unknown"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {d.donation_campaigns?.name ? `${d.donation_campaigns.name} · ` : ""}
                    {d.created_at
                      ? new Date(d.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {d.organizations?.slug && (
                    <Link
                      href={`/give/${d.organizations.slug}`}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      Give again
                    </Link>
                  )}
                  <a
                    href={`/receipts/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Receipt
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
