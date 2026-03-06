import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrgVerification } from "@/lib/verification";
import Link from "next/link";
import { ArrowLeft, Globe, Layers } from "lucide-react";
import { CmsClient } from "./cms-client";
import { VerificationGate } from "@/components/verification-gate";

export default async function CmsPage() {
  const { profile, supabase } = await requireAuth();
  const isPlatformAdmin = profile?.role === "platform_admin";
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

  if (!orgId) {
    redirect("/dashboard");
  }

  if (!isPlatformAdmin) {
    const { verificationStatus } = await getOrgVerification(orgId, supabase);

    if (verificationStatus !== "verified") {
      return (
        <VerificationGate
          verificationStatus={verificationStatus}
          featureName="Website CMS"
          featureDescription="Edit your website content — pages, blocks, sermons, podcasts, and more. You need a verified Stripe Connect account first."
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-dashboard">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-dashboard-border bg-dashboard-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
          <Link
            href="/dashboard/pages"
            className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-dashboard-text-muted transition-all hover:bg-dashboard-card-hover hover:text-dashboard-text"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Website Builder
          </Link>
          <span className="text-dashboard-border-light">/</span>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
              <Layers className="h-3 w-3 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-dashboard-text">Content Manager</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:flex">
              <Globe className="h-3 w-3" />
              Connected to Website
            </span>
          </div>
        </div>
      </div>

      {/* Page header */}
      <div className="border-b border-dashboard-border bg-dashboard-card/40">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-dashboard-text tracking-tight">Content Manager</h1>
              <p className="mt-1 text-sm text-dashboard-text-muted">
                Manage your website&apos;s media, events, sermons, and more.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <CmsClient organizationId={orgId} />
      </div>
    </div>
  );
}
