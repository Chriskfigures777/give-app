import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { MessagesPageClient } from "./messages-client";

export default async function MessagesPage() {
  const { profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard?org=required");

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 dark:bg-slate-950">
      <MessagesPageClient />
    </main>
  );
}
