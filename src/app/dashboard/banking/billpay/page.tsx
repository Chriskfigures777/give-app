import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export default async function BillpayReactivationPage() {
  await requireAuth();

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="dashboard-fade-in flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
            Reactivate Bill Pay
          </h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Your bill pay access needs to be reactivated before you can make payments.
          </p>
        </div>
        <Link
          href="/dashboard/banking"
          className="shrink-0 rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Back to Banking
        </Link>
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-dashboard-text">
              Bill Pay Suspended
            </h2>
            <p className="mt-1 text-sm text-dashboard-text-muted">
              Your bill pay feature has been temporarily suspended. This can happen due to inactivity, a required verification, or account review. Please complete the steps below to restore access.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-dashboard-text">
            Steps to reactivate
          </h3>
          <ol className="space-y-2 text-sm text-dashboard-text-muted list-decimal list-inside">
            <li>Visit your banking dashboard and complete any pending identity verification.</li>
            <li>Ensure your account information is up to date (address, phone number).</li>
            <li>Contact support if the suspension persists after completing verification.</li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard/banking"
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
          >
            Go to Banking Dashboard
          </Link>
          <a
            href="mailto:support@givewith.us"
            className="inline-flex items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-card px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
