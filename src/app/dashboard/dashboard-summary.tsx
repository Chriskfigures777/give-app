"use client";

type Donation = {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string | null;
  organization_id: string | null;
};

type Org = { id: string; name: string; slug: string };

export function DashboardSummary({
  totalCents,
  totalDonationsCount,
  recentDonations,
  organizations,
}: {
  totalCents: number;
  totalDonationsCount: number;
  recentDonations: Donation[];
  organizations: Org[];
}) {
  const totalDollars = (totalCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Total donations (sample)</p>
        <p className="text-2xl font-semibold">{totalDollars}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {totalDonationsCount} successful
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Organizations</p>
        <p className="text-2xl font-semibold">{organizations.length}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 md:col-span-2">
        <p className="text-sm font-medium mb-2">Recent donations</p>
        <ul className="space-y-2">
          {recentDonations.length === 0 ? (
            <li className="text-sm text-muted-foreground">No donations yet.</li>
          ) : (
            recentDonations.map((d) => (
              <li
                key={d.id}
                className="flex justify-between text-sm border-b border-border pb-2 last:border-0"
              >
                <span>
                  ${(Number(d.amount_cents) / 100).toFixed(2)} — {d.status}
                </span>
                <span className="text-muted-foreground">
                  {d.created_at
                    ? new Date(d.created_at).toLocaleDateString()
                    : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
