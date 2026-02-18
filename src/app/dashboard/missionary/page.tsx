import { createClient } from "@/lib/supabase/server";
import { getCachedDashboardAuth } from "@/lib/auth";
import { env } from "@/env";
import { MissionaryEmbedClient } from "./missionary-embed-client";
import Link from "next/link";

/** Missionary dashboard: embed code to receive support. */
export default async function MissionaryPage() {
  const { profile, isMissionary, missionarySponsorOrgId } = await getCachedDashboardAuth();

  if (!isMissionary && profile?.role !== "missionary" && !profile?.plans_to_be_missionary) {
    return (
      <div className="space-y-6 p-2 sm:p-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Convert to missionary</h2>
          <p className="mt-2 text-amber-800 dark:text-amber-200">
            You&apos;re a giver. To receive support as a missionary, a church or nonprofit needs to connect with you and add you as their missionary. Once added, you&apos;ll get an embed code to share on your website, social media, or anywhere you&apos;d like to receive funding.
          </p>
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            Reach out to your sponsoring church or nonprofit and ask them to add you as a missionary in their Give dashboard.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!missionarySponsorOrgId) {
    return (
      <div className="space-y-6 p-2 sm:p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-dashboard-card">
          <h2 className="text-lg font-bold text-slate-900 dark:text-dashboard-text">Waiting for connection</h2>
          <p className="mt-2 text-slate-600 dark:text-dashboard-text-muted">
            You&apos;ve indicated you plan to be a missionary. Once a church or nonprofit connects with you and adds you as their missionary, you&apos;ll see your embed code here.
          </p>
          <p className="mt-3 text-sm text-slate-500 dark:text-dashboard-text-muted">
            Ask your sponsoring organization to add you from their Givers page in the Give dashboard.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", missionarySponsorOrgId)
    .single();

  const orgRow = org as { id: string; name: string; slug: string } | null;
  if (!orgRow) {
    return (
      <div className="p-4 text-slate-500">Organization not found.</div>
    );
  }

  const baseUrl = env.app.domain().replace(/\/$/, "");
  const embedUrl = `${baseUrl}/give/${orgRow.slug}/embed`;
  const embedUrlFullScreen = `${baseUrl}/give/${orgRow.slug}/embed?fullscreen=1`;
  const iframeCode = `<iframe src="${embedUrlFullScreen}" style="width: 100%; height: 100vh; min-height: 500px; border: none;" title="Support ${orgRow.name}"></iframe>`;

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dashboard-text">My embed</h1>
        <p className="mt-1 text-slate-600 dark:text-dashboard-text-muted">
          Copy and paste this embed code anywhere you&apos;d like to receive support — your website, blog, or social links.
        </p>
      </div>

      <MissionaryEmbedClient
        organizationName={orgRow.name}
        slug={orgRow.slug}
        embedUrl={embedUrl}
        embedUrlFullScreen={embedUrlFullScreen}
        iframeCode={iframeCode}
      />
    </div>
  );
}
