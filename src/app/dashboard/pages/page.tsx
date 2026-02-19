import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrgVerification } from "@/lib/verification";
import { WebsiteBuilderClient } from "./website-builder-client";
import { VerificationGate } from "@/components/verification-gate";

export default async function WebsiteBuilderPage() {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) {
    redirect("/dashboard");
  }

  if (!isPlatformAdmin) {
    const { verificationStatus } = await getOrgVerification(orgId, supabase);

    if (verificationStatus !== "verified") {
      return (
        <VerificationGate
          verificationStatus={verificationStatus}
          featureName="Website Builder"
          featureDescription="Build and publish a beautiful website for your organization. You need a verified Stripe Connect account so your donation buttons work on the published site."
        />
      );
    }
  }

  return (
    <div className="h-full w-full">
      <WebsiteBuilderClient organizationId={orgId} />
    </div>
  );
}
