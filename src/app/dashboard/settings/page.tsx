import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/client";

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

export default async function SettingsPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  type OrgRow = { id: string; name: string; stripe_connect_account_id: string | null; onboarding_completed: boolean | null };
  let org: OrgRow | null = null;
  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, stripe_connect_account_id, onboarding_completed")
      .eq("id", orgId)
      .single();
    org = data as OrgRow | null;
  }

  const verificationStatus = org?.stripe_connect_account_id
    ? await getStripeVerificationStatus(org.stripe_connect_account_id)
    : "none";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-muted-foreground">Organization and account settings.</p>

      {org && profile?.role !== "platform_admin" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Payout account</h2>
          <p className="mt-1 text-sm text-slate-600">
            To receive donations, your organization must complete verification: business details, identity, and banking. You do this once through a secure form—no redirect to a third-party site.
          </p>
          {verificationStatus === "verified" ? (
            <p className="mt-4 text-sm font-medium text-emerald-600">Account verified</p>
          ) : verificationStatus === "actions_required" ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-amber-600">Actions required</p>
              <p className="mt-1 text-sm text-slate-600">
                Please complete the remaining verification steps to receive payouts.
              </p>
              <Link
                href="/dashboard/connect/verify"
                className="mt-3 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Complete verification
              </Link>
            </div>
          ) : verificationStatus === "pending" ? (
            <p className="mt-4 text-sm font-medium text-amber-600">
              Verification submitted. Waiting on Stripe approval—usually 1–2 business days.
            </p>
          ) : (
            <Link
              href="/dashboard/connect/verify"
              className="mt-4 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Complete verification
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
