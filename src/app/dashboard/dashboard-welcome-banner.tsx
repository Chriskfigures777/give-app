"use client";

type Props = { userName: string | null };

export function DashboardWelcomeBanner({ userName }: Props) {
  const displayName = userName?.split(" ")[0] ?? "there";
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="dashboard-fade-in relative overflow-hidden rounded-2xl">
      {/* Animated gradient background */}
      <div className="gradient-mesh absolute inset-0 opacity-90" />
      {/* Subtle noise overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative z-10 flex flex-col justify-center px-8 py-10 sm:px-10 md:flex-row md:items-center md:justify-between md:py-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {greeting}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl tracking-tight">
            Welcome back, {displayName}
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/80 leading-relaxed">
            Here&apos;s what&apos;s happening with your donations and
            organizations today.
          </p>
        </div>
        <div className="mt-6 flex gap-3 md:mt-0">
          <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm border border-white/10 transition-all hover:bg-white/15 hover:border-white/20">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">
              Quick actions
            </p>
            <p className="text-sm font-semibold text-white mt-0.5">
              View donations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
