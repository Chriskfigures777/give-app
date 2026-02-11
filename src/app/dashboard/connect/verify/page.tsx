import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/client";
import { ConnectOnboardingWrapper } from "./connect-onboarding-wrapper";

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

  if (orgId && profile?.role !== "platform_admin") {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("stripe_connect_account_id")
      .eq("id", orgId)
      .single();
    const stripeAccountId = (orgRow as { stripe_connect_account_id: string | null } | null)
      ?.stripe_connect_account_id;

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
        }
      } catch {
        // Keep needsVerification true if we can't fetch
      }
    }
  }

  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {needsVerification ? "Complete account verification" : "Payout account"}
          </h1>
          <p className="mt-1 text-slate-600">
            {needsVerification
              ? "Add your organization details, identity, and banking so you can receive payouts. This stays secure and is required to accept donations."
              : verifiedMessage}
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          Back to settings
        </Link>
      </div>

      {needsVerification ? (
        <ConnectOnboardingWrapper publishableKey={publishableKey || undefined} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{verifiedMessage}</p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Back to settings
          </Link>
        </div>
      )}
    </div>
  );
}
