type Props = {
  title: string;
  description?: string;
  /** "organizations" | "donations" | "givers" | "generic" */
  variant?: "organizations" | "donations" | "givers" | "generic";
  className?: string;
};

/** Simple empty state with inline SVG illustration */
export function EmptyState({ title, description, variant = "generic", className = "" }: Props) {
  const svg = {
    organizations: (
      <svg className="mx-auto h-24 w-24 text-dashboard-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3.75h18v18H3V3.75z" />
      </svg>
    ),
    donations: (
      <svg className="mx-auto h-24 w-24 text-dashboard-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0 7.5v3.75c0 .621.504 1.125 1.125 1.125h4.125c.621 0 1.125-.504 1.125-1.125V12m-12 5.25v-3.375c0-.621.504-1.125 1.125-1.125h3.375M12 4.875v2.625m0 4.5v2.625m0 4.5v-2.625m0 0h3.375m-3.375 0h3.375" />
      </svg>
    ),
    givers: (
      <svg className="mx-auto h-24 w-24 text-dashboard-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    generic: (
      <svg className="mx-auto h-24 w-24 text-dashboard-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {svg[variant]}
      <p className="mt-4 text-base font-semibold text-dashboard-text">{title}</p>
      {description && <p className="mt-1 text-sm text-dashboard-text-muted">{description}</p>}
    </div>
  );
}
