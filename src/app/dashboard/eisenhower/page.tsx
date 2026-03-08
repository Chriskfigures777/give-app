import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { EisenhowerWhiteboardClient } from "./eisenhower-whiteboard-client";

export default async function EisenhowerPage() {
  const { profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) redirect("/dashboard");

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto overflow-x-hidden">
      <div className="grid grid-cols-1 gap-6 px-4 py-6">
        <header className="dashboard-fade-in min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Priorities</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Sort tasks by <strong>important</strong> vs <strong>urgent</strong> so you can focus on the right things first.
          </p>
        </header>

        <EisenhowerWhiteboardClient />
      </div>
    </div>
  );
}
