import { requirePlatformAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-dashboard-text">Platform Admin</h1>
        <p className="text-dashboard-text-muted mt-1">
          Manage members, organizations, and platform settings.
        </p>
      </div>
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}
