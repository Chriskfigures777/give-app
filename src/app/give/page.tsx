import Link from "next/link";

/**
 * /give with no slug – show a short message so this route doesn’t 404.
 * Donation links should be /give/{organization-slug}.
 */
export default function GiveIndexPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Give</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Use your organization’s donation link to give (e.g. /give/your-org-slug).
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:opacity-90"
      >
        Back to home
      </Link>
    </main>
  );
}
