import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, ExternalLink, Layout, Users } from "lucide-react";
import { OrgAccountEditor } from "./org-account-editor";
import { OrgMembersList } from "./org-members-list";
import { PasswordResetButton } from "./password-reset-button";

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  // @ts-ignore – plan columns not in generated types
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, org_type, city, state, owner_user_id, member_count, website_url, stripe_connect_account_id, stripe_billing_customer_id, stripe_plan_subscription_id, onboarding_completed, created_at, plan, plan_status, published_website_project_id, logo_url, page_summary")
    .eq("id", orgId)
    .single();

  if (!org) notFound();

  const o = org as unknown as Record<string, unknown>;

  // Fetch owner profile
  const { data: owner } = o.owner_user_id
    ? await supabase
        .from("user_profiles")
        .select("id, full_name, email, role, created_at")
        .eq("id", o.owner_user_id as string)
        .single()
    : { data: null };

  // Fetch org admins
  const { data: admins } = await supabase
    .from("organization_admins")
    .select("id, user_id, role, created_at, user_profiles(id, full_name, email, role)")
    .eq("organization_id", orgId);

  // Fetch recent donations
  const { data: recentDonations } = await supabase
    .from("donations")
    .select("id, amount_cents, status, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(10);

  const plan = (o.plan as string) ?? "free";
  const created = o.created_at
    ? new Date(o.created_at as string).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "—";

  const totalDonationsCents = (recentDonations ?? []).reduce(
    (sum, d) => sum + Number(d.amount_cents ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard/admin/organizations"
        className="inline-flex items-center gap-2 text-sm text-dashboard-text-muted hover:text-dashboard-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All organizations
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text">{(o.name as string) || "Unnamed Organization"}</h2>
          <p className="text-sm text-dashboard-text-muted mt-1">
            /{o.slug as string} · {(o.org_type as string) || "Organization"} · Created {created}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {o.website_url && (
            <a
              href={o.website_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
            >
              <Globe className="h-4 w-4" /> View Website
            </a>
          )}
          <Link
            href={`/dashboard/admin/organizations/${orgId}/website`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Layout className="h-4 w-4" /> Website &amp; DNS
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Account info + stats + donations */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick stats */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Plan", value: plan.charAt(0).toUpperCase() + plan.slice(1), sub: (o.plan_status as string) ?? undefined },
              { label: "Members", value: String(o.member_count ?? "—") },
              { label: "Donations (last 10)", value: String(recentDonations?.length ?? 0), sub: `$${(totalDonationsCents / 100).toLocaleString()} total` },
              { label: "Stripe Connect", value: o.stripe_connect_account_id ? "Connected" : "None" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-dashboard-border bg-dashboard-card p-4">
                <p className="text-xs font-medium text-dashboard-text-muted">{stat.label}</p>
                <p className="mt-1 text-xl font-bold text-dashboard-text">{stat.value}</p>
                {stat.sub && <p className="text-xs text-dashboard-text-muted">{stat.sub}</p>}
              </div>
            ))}
          </section>

          {/* Account editor */}
          <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-dashboard-text mb-4">Account settings</h3>
            <OrgAccountEditor
              orgId={orgId}
              initialName={(o.name as string) ?? ""}
              initialSlug={(o.slug as string) ?? ""}
              initialPlan={plan}
              initialPlanStatus={(o.plan_status as string) ?? ""}
            />
          </section>

          {/* Recent donations */}
          {(recentDonations?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-dashboard-border">
                <h3 className="text-base font-semibold text-dashboard-text">Recent donations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dashboard-border bg-dashboard-card-hover/30">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashboard-border">
                    {recentDonations!.map((d) => (
                      <tr key={d.id} className="hover:bg-dashboard-card-hover/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-dashboard-text tabular-nums">
                          ${((d.amount_cents ?? 0) / 100).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            d.status === "succeeded"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-dashboard-text-muted tabular-nums">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Right: Owner + Team + Quick links */}
        <div className="space-y-6">
          {/* Owner card */}
          <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-dashboard-text mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-dashboard-text-muted" /> Owner
            </h3>
            {owner ? (
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-dashboard-text">{owner.full_name || "No name"}</p>
                  <p className="text-sm text-dashboard-text-muted">{owner.email}</p>
                </div>
                <div className="pt-2 space-y-2">
                  <a
                    href={`mailto:${owner.email}`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 py-2 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
                  >
                    Email owner
                  </a>
                  <PasswordResetButton userId={owner.id} email={owner.email ?? ""} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-dashboard-text-muted">No owner assigned</p>
            )}
          </section>

          {/* Team / admins */}
          <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-dashboard-text mb-3">Admins & team</h3>
            <OrgMembersList admins={(admins as Record<string, unknown>[]) ?? []} />
          </section>

          {/* Quick links */}
          <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-dashboard-text mb-3">Quick links</h3>
            <div className="space-y-2">
              {([
                {
                  label: "Website & DNS",
                  href: `/dashboard/admin/organizations/${orgId}/website`,
                  external: false,
                  disabled: false,
                },
                {
                  label: "View public site",
                  href: `/${o.slug as string}`,
                  external: true,
                  disabled: !o.slug,
                },
                {
                  label: "Stripe Billing Customer",
                  href: `https://dashboard.stripe.com/customers/${o.stripe_billing_customer_id as string}`,
                  external: true,
                  disabled: !o.stripe_billing_customer_id,
                },
                {
                  label: "Stripe Connect Account",
                  href: `https://dashboard.stripe.com/connect/accounts/${o.stripe_connect_account_id as string}`,
                  external: true,
                  disabled: !o.stripe_connect_account_id,
                },
              ] as { label: string; href: string; external: boolean; disabled: boolean }[]).map((link) => {
                if (link.disabled) {
                  return (
                    <div
                      key={link.label}
                      className="flex items-center justify-between rounded-lg border border-dashboard-border bg-dashboard-card-hover/20 px-3 py-2.5 text-sm text-dashboard-text-muted opacity-50"
                    >
                      {link.label}
                      <span className="text-xs">N/A</span>
                    </div>
                  );
                }
                if (!link.external) {
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center justify-between rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 px-3 py-2.5 text-sm text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
                    >
                      {link.label}
                      <ExternalLink className="h-3.5 w-3.5 text-dashboard-text-muted" />
                    </Link>
                  );
                }
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-dashboard-border bg-dashboard-card-hover/30 px-3 py-2.5 text-sm text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
                  >
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5 text-dashboard-text-muted" />
                  </a>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
