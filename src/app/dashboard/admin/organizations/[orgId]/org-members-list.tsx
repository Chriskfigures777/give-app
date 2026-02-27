type AdminRow = {
  id: string;
  user_id: string;
  role: string | null;
  created_at: string | null;
  user_profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
  } | null;
};

export function OrgMembersList({ admins }: { admins: Record<string, unknown>[] }) {
  const rows = admins as AdminRow[];
  if (rows.length === 0) {
    return <p className="text-sm text-dashboard-text-muted">No additional admins.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((admin) => {
        const profile = admin.user_profiles;
        return (
          <li
            key={admin.id}
            className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 px-3 py-2.5"
          >
            <p className="text-sm font-medium text-dashboard-text">
              {profile?.full_name || "No name"}
            </p>
            <p className="text-xs text-dashboard-text-muted">{profile?.email}</p>
            <p className="text-xs text-dashboard-text-muted capitalize">{admin.role || "admin"}</p>
          </li>
        );
      })}
    </ul>
  );
}
