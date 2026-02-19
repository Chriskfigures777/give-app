import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrgPlan, hasAccessToPlan } from "@/lib/plan";
import Link from "next/link";
import { ArrowLeft, Globe, Layers } from "lucide-react";
import { CmsClient } from "./cms-client";
import { PaywallGate } from "@/components/paywall-gate";

export default async function CmsPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) {
    redirect("/dashboard");
  }

  const { plan, planStatus } = await getOrgPlan(orgId, supabase);
  const hasAccess = hasAccessToPlan(plan, planStatus, "pro");

  if (!hasAccess) {
    return (
      <PaywallGate
        requiredPlan="pro"
        featureName="Website CMS"
        featureDescription="Edit your website content — pages, blocks, sermons, podcasts, and more — directly from the dashboard."
        currentPlan={plan}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dashboard">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-dashboard-border bg-dashboard-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link
            href="/dashboard/pages"
            className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-dashboard-text-muted transition-all hover:bg-dashboard-card-hover hover:text-dashboard-text"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Website Builder
          </Link>
          <div className="h-5 w-px bg-dashboard-border" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-dashboard-text">Content Manager</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 sm:flex">
              <Globe className="h-3 w-3" />
              Connected to Website
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <CmsClient organizationId={orgId} />
      </div>
    </div>
  );
}
