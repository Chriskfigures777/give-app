import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { WebsiteBuilderClient } from "./website-builder-client";

export default async function WebsiteBuilderPage() {
  const { profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId || (!profile?.organization_id && !profile?.preferred_organization_id)) {
    redirect("/dashboard");
  }

  return (
    <div className="h-full w-full">
      <WebsiteBuilderClient organizationId={orgId} />
    </div>
  );
}
