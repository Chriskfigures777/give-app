import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { PrivateCallsClient } from "./private-calls-client";

export default async function PrivateCallsPage() {
  const { profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) redirect("/dashboard");

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto overflow-x-hidden">
      <div className="px-4 py-6">
        <PrivateCallsClient />
      </div>
    </div>
  );
}
