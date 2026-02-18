import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { ConnectAccountManagementWrapper } from "./connect-account-management-wrapper";
import { AddBankAccountForm } from "../../settings/add-bank-account-form";

/**
 * Settings page for managing payout account, bank details, and billing information.
 * Uses Stripe Connect embedded account-management component.
 */
export default async function ConnectManagePage() {
  await requireAuth();

  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    "";

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="dashboard-fade-in flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Manage billing & payout account
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Update your bank account (routing and account numbers), business details, and billing information.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Back to settings
        </Link>
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-1">
        <ConnectAccountManagementWrapper publishableKey={publishableKey || undefined} />
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Add another bank account
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Add multiple bank accounts for split payouts (e.g., Operating Fund, Building Fund). Each account will appear in the split configuration.
        </p>
        <AddBankAccountForm
          publishableKey={publishableKey}
          expandedByDefault={false}
        />
      </div>
    </div>
  );
}
