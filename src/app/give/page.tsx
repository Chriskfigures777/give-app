import Link from "next/link";

/**
 * /give with no slug – promote discovery and search.
 * Donation links should be /give/{organization-slug}.
 */
export default function GiveIndexPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Give</h1>
      <p className="text-slate-600 mb-8 text-center max-w-md">
        Search for an organization to give to or browse by cause.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/explore"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Find organizations
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
