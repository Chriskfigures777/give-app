import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrgPlan, hasAccessToPlan } from "@/lib/plan";
import { WebsiteBuilderClient } from "./website-builder-client";
import { PaywallGate } from "@/components/paywall-gate";

export default async function WebsiteBuilderPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) {
    redirect("/dashboard");
  }

  const { plan, planStatus } = await getOrgPlan(orgId, supabase);
  const hasAccess = hasAccessToPlan(plan, planStatus, "website");

  if (!hasAccess) {
    return (
      <PaywallGate
        requiredPlan="website"
        featureName="Website Builder"
        featureDescription="Build a beautiful website for your organization. Connect a custom domain, use templates, and publish in minutes."
        currentPlan={plan}
      />
    );
  }

  return (
    <div className="h-full w-full">
      <WebsiteBuilderClient organizationId={orgId} />
    </div>
  );
}
