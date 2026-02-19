import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/client";
import {
  CreditCard,
  Building2,
  Globe,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Palette,
  FileText,
  Lock,
  Mail,
  PiggyBank,
} from "lucide-react";
import { WebsiteUrlForm } from "./website-url-form";
import { DomainWizard } from "./domain-wizard";
import { InternalSplitsForm } from "./internal-splits-form";

type VerificationStatus = "none" | "actions_required" | "pending" | "verified";

async function getStripeVerificationStatus(stripeConnectAccountId: string | null): Promise<VerificationStatus> {
  if (!stripeConnectAccountId) return "none";
  try {
    const account = await stripe.accounts.retrieve(stripeConnectAccountId);
    const verified = account.charges_enabled === true || account.payouts_enabled === true;
    const hasRequirements =
      (account.requirements?.currently_due?.length ?? 0) > 0 ||
      (account.requirements?.eventually_due?.length ?? 0) > 0;
    if (verified) return "verified";
    if (hasRequirements) return "actions_required";
    if (account.details_submitted === true) return "pending";
    return "none";
  } catch {
    return "none";
  }
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </span>
    );
  }
  if (status === "actions_required") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
        <AlertCircle className="h-3 w-3" />
        Action needed
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
        <Clock className="h-3 w-3" />
        Pending review
      </span>
    );
  }
  return null;
}

export default async function SettingsPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  type OrgRow = {
    id: string;
    name: string;
    stripe_connect_account_id: string | null;
    onboarding_completed: boolean | null;
    website_url: string | null;
  };
  let org: OrgRow | null = null;
  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, stripe_connect_account_id, onboarding_completed, website_url")
      .eq("id", orgId)
      .single();
    org = data as OrgRow | null;
  }

  const verificationStatus = org?.stripe_connect_account_id
    ? await getStripeVerificationStatus(org.stripe_connect_account_id)
    : "none";

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-2 py-4 sm:px-4 sm:py-6">
      {/* ── Header ── */}
      <div className="dashboard-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Manage your organization, payouts, domains, and preferences.
        </p>
      </div>

      {/* ── Payout account — Stripe Connect ── */}
      {org && profile?.role !== "platform_admin" && (
        <section className="dashboard-fade-in dashboard-fade-in-delay-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-700/60 dark:bg-slate-800/50">
            {/* Header with accent bar */}
            <div className="relative border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/40 px-6 py-5 dark:border-slate-700/50 dark:from-emerald-900/10 dark:via-slate-800/50 dark:to-teal-900/10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                    <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Payout account
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Stripe Connect</p>
                  </div>
                </div>
                <VerificationBadge status={verificationStatus} />
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {verificationStatus === "verified" ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Your account is verified and ready to receive donations. Manage your bank details or view verification info below.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <Link
                      href="/dashboard/connect/manage"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 hover:shadow-md dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Manage bank & billing
                    </Link>
                    <Link
                      href="/dashboard/connect/verify"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      View details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : verificationStatus === "actions_required" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Complete the remaining verification steps to start receiving payouts.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <Link
                      href="/dashboard/connect/verify"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-md dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    >
                      Complete verification
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/dashboard/connect/manage"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Update bank or billing
                    </Link>
                  </div>
                </div>
              ) : verificationStatus === "pending" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800/50 dark:bg-blue-900/10">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Verification submitted
                        </p>
                        <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                          Stripe is reviewing your details. This usually takes 1-2 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/connect/manage"
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Update bank or billing in the meantime
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    To receive donations, complete verification: business details, identity, and banking info. Done securely in-app.
                  </p>
                  <Link
                    href="/dashboard/connect/verify"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-md dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  >
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Split to bank accounts (internal splits) ── */}
      {org && verificationStatus === "verified" && profile?.role !== "platform_admin" && (
        <section className="dashboard-fade-in dashboard-fade-in-delay-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-700/60 dark:bg-slate-800/50">
            <div className="relative border-b border-slate-100 bg-gradient-to-r from-amber-50/60 via-white to-orange-50/40 px-6 py-5 dark:border-slate-700/50 dark:from-amber-900/10 dark:via-slate-800/50 dark:to-orange-900/10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
                  <PiggyBank className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Split to bank accounts
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Send a percentage of each donation to different bank accounts automatically
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <InternalSplitsForm organizationId={org.id} />
            </div>
          </div>
        </section>
      )}

      {/* ── Organization profile ── */}
      {org && (
        <section className="dashboard-fade-in dashboard-fade-in-delay-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-700/60 dark:bg-slate-800/50">
            <div className="relative border-b border-slate-100 bg-gradient-to-r from-violet-50/60 via-white to-purple-50/40 px-6 py-5 dark:border-slate-700/50 dark:from-violet-900/10 dark:via-slate-800/50 dark:to-purple-900/10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 dark:bg-violet-500/20">
                  <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Organization
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{org.name}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {/* Quick actions */}
              <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
                <Link
                  href="/dashboard/customization"
                  className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all duration-200 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-violet-700/50 dark:hover:bg-violet-900/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 transition-colors group-hover:bg-violet-500/15 dark:bg-violet-500/20">
                    <Palette className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Customize form & branding</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Colors, logo, donation form</p>
                  </div>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-slate-500" />
                </Link>

                <Link
                  href="/dashboard/pages"
                  className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all duration-200 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-violet-700/50 dark:hover:bg-violet-900/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 transition-colors group-hover:bg-violet-500/15 dark:bg-violet-500/20">
                    <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Publish your website</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Site builder & pages</p>
                  </div>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-slate-500" />
                </Link>
              </div>

              {/* Website URL */}
              <div className="px-6 py-5">
                <label
                  htmlFor="website_url"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  Organization website
                </label>
                <WebsiteUrlForm orgId={org.id} initialValue={org.website_url ?? ""} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Domain & hosting ── */}
      {org && (
        <section className="dashboard-fade-in dashboard-fade-in-delay-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-700/60 dark:bg-slate-800/50">
            <div className="relative border-b border-slate-100 bg-gradient-to-r from-sky-50/60 via-white to-cyan-50/40 px-6 py-5 dark:border-slate-700/50 dark:from-sky-900/10 dark:via-slate-800/50 dark:to-cyan-900/10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 dark:bg-sky-500/20">
                  <Globe className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Domain & hosting
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect or purchase a custom domain for your site
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <DomainWizard organizationId={org.id} isPlatformAdmin={profile?.role === "platform_admin"} />
            </div>
          </div>
        </section>
      )}

      {/* ── Security & data ── */}
      <section className="dashboard-fade-in dashboard-fade-in-delay-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-700/60 dark:bg-slate-800/50">
          <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/60 via-white to-slate-50/40 px-6 py-5 dark:border-slate-700/50 dark:from-slate-800/40 dark:via-slate-800/50 dark:to-slate-800/40">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 dark:bg-slate-500/20">
                <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Security & data
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Privacy, encryption, and account safety
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 dark:border-slate-700/40 dark:bg-slate-800/30">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">End-to-end encryption</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    All data encrypted at rest and in transit
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 dark:border-slate-700/40 dark:bg-slate-800/30">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Stripe payments</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    PCI-DSS compliant payment processing
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 dark:border-slate-700/40 dark:bg-slate-800/30">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Email receipts</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Automatic tax-deductible receipts
                  </p>
                </div>
              </div>
            </div>

            {profile?.role === "platform_admin" && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-700/50 dark:bg-slate-800/30">
                <Link
                  href="/dashboard/admin"
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Platform Admin panel
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
