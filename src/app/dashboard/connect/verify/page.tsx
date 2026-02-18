import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/client";
import { ConnectOnboardingWrapper } from "./connect-onboarding-wrapper";
import { RefreshVerifyButton } from "./refresh-verify-button";
import { VerifyStatusFetcher } from "./verify-status-fetcher";

export const dynamic = "force-dynamic";

/**
 * Embedded Stripe Connect onboarding for organizations.
 * Users complete verification (business details, identity, and banking) in-app via Stripe's
 * embedded component—no redirect to Stripe, Typeform/Shopify-style flow.
 */
export default async function ConnectVerifyPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  let needsVerification = true;
  let verifiedMessage: string | null = null;
  let accountDisplayName: string | null = null;
  let accountError: string | null = null;

  if (orgId && profile?.role !== "platform_admin") {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, stripe_connect_account_id")
      .eq("id", orgId)
      .single();
    const org = orgRow as { id: string; name: string; stripe_connect_account_id: string | null } | null;
    const stripeAccountId = org?.stripe_connect_account_id;

    if (stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        const hasRequirements =
          (account.requirements?.currently_due?.length ?? 0) > 0 ||
          (account.requirements?.eventually_due?.length ?? 0) > 0;
        const isVerified = account.charges_enabled === true || account.payouts_enabled === true;

        if (!hasRequirements || isVerified) {
          needsVerification = false;
          verifiedMessage = isVerified
            ? "Your account is fully verified and ready to receive payouts."
            : "No additional verification steps are required at this time.";
          accountDisplayName =
            (account.business_profile as { name?: string } | null)?.name ??
            account.email ??
            org?.name ??
            null;
        }
      } catch (e) {
        if (stripeAccountId.startsWith("acct_seed_")) {
          accountError = "This organization has a test placeholder account ID. Complete Connect onboarding to create a real payout account.";
        } else {
          accountError = "Could not load account. The stored payout account may be invalid or no longer exist.";
        }
      }
    }
  }

  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    "";

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <VerifyStatusFetcher />
      <div className="dashboard-fade-in flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {needsVerification ? "Complete account verification" : "Payout account"}
          </h1>
          <p className="mt-1 text-slate-600">
            {needsVerification
              ? "Add your organization details, identity, and banking so you can receive payouts. This stays secure and is required to accept donations."
              : verifiedMessage}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <RefreshVerifyButton />
          <Link
            href="/dashboard/settings"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            Back to settings
          </Link>
        </div>
      </div>

      {accountError && (
        <div className="dashboard-fade-in rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Account setup issue</p>
          <p className="mt-1 text-sm">{accountError}</p>
          <p className="mt-2 text-xs">
            Complete the verification form below to create a real payout account. The invalid placeholder will be replaced automatically.
          </p>
        </div>
      )}

      {needsVerification ? (
        <div className="dashboard-fade-in dashboard-fade-in-delay-1">
          <ConnectOnboardingWrapper publishableKey={publishableKey || undefined} />
        </div>
      ) : (
        <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-900">Account verified</h2>
              {accountDisplayName && (
                <p className="mt-1 text-sm font-medium text-slate-700">{accountDisplayName}</p>
              )}
              <p className="mt-1 text-sm text-slate-600">{verifiedMessage}</p>
              <p className="mt-3 text-sm text-slate-500">
                Payouts are sent automatically based on your account schedule.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/connect/manage"
                  className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Update bank account & billing
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back to settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
