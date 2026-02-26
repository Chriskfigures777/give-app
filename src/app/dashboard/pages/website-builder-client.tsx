"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RotateCcw, Upload, Eye, Globe, AlertCircle, X, Palette, CreditCard, DollarSign, Target } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { ThemeFormEditor } from "../customization/theme-form-editor";
import { CampaignsEditor } from "../customization/campaigns-editor";
import { DonateButtonFormSelector } from "../customization/donate-button-form-selector";
import type { FormsPageData } from "../forms/forms-data";

type Props = {
  organizationId: string;
  websiteFormName?: string;
  formsData: FormsPageData | null;
  baseUrl: string;
  splitRecipientLimit: number;
  plan?: "free" | "growth" | "pro";
  openFormInitially?: boolean;
  initialProjectId?: string | null;
};

type EditorProjectState = {
  projectId: string;
  siteUrl: string | null;
  publishedUrl: string | null;
  isPublished: boolean;
  hasCustomDomain: boolean;
  customDomain: string | null;
};

export function WebsiteBuilderClient({
  organizationId,
  websiteFormName = "Main form",
  formsData,
  baseUrl,
  splitRecipientLimit,
  plan = "free",
  openFormInitially = false,
  initialProjectId = null,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [projectState, setProjectState] = useState<EditorProjectState | null>(null);

  // Sync project from URL on mount/refresh so we stay on the builder when user refreshes
  const urlProjectId = searchParams?.get("project")?.trim() || null;
  const effectiveProjectId = projectState?.projectId ?? urlProjectId ?? initialProjectId;
  const [formPanelOpen, setFormPanelOpen] = useState(openFormInitially);
  const [isPublishing, setIsPublishing] = useState(false);
  const [justPublishedUrl, setJustPublishedUrl] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<"domain" | "preview" | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const baseIframeSrc = "/dashboard/pages/editor-frame";
  const iframeSrc =
    effectiveProjectId
      ? `${baseIframeSrc}?project=${encodeURIComponent(effectiveProjectId)}`
      : baseIframeSrc;

  useEffect(() => {
    if (openFormInitially) setFormPanelOpen(true);
  }, [openFormInitially]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "editor-project-selected") {
        // Update URL immediately when user clicks a project (before editor loads) so refresh keeps them on the builder
        const projectId = e.data.projectId;
        if (projectId) {
          router.replace(`/dashboard/pages?project=${encodeURIComponent(projectId)}`, { scroll: false });
        }
      } else if (e.data?.type === "editor-project-loaded") {
        const projectId = e.data.projectId;
        setProjectState({
          projectId,
          siteUrl: e.data.siteUrl ?? null,
          publishedUrl: e.data.publishedUrl ?? null,
          isPublished: e.data.isPublished ?? false,
          hasCustomDomain: e.data.hasCustomDomain ?? false,
          customDomain: e.data.customDomain ?? null,
        });
        setJustPublishedUrl(null);
        setPublishMode(null);
        router.replace(`/dashboard/pages?project=${encodeURIComponent(projectId)}`, { scroll: false });
      } else if (e.data?.type === "editor-project-unloaded") {
        setProjectState(null);
        setJustPublishedUrl(null);
        setPublishMode(null);
        router.replace("/dashboard/pages", { scroll: false });
      } else if (e.data?.type === "site-published") {
        if (e.data.published && e.data.publishedUrl) {
          setJustPublishedUrl(e.data.publishedUrl);
          setPublishMode(e.data.publishMode ?? null);
          setProjectState((p) => p ? { ...p, isPublished: true, publishedUrl: e.data.publishedUrl } : null);
        } else {
          setJustPublishedUrl(null);
          setPublishMode(null);
          setProjectState((p) => p ? { ...p, isPublished: false } : null);
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function handleBackToProjects() {
    if (isResetting) return;
    setIsResetting(true);
    setProjectState(null);
    router.replace("/dashboard/pages", { scroll: false });
    try {
      if (iframeRef.current) {
        iframeRef.current.src = baseIframeSrc;
      }
    } finally {
      setIsResetting(false);
    }
  }

  function handlePreview() {
    if (!projectState?.siteUrl || !projectState?.projectId) return;
    const url = `${projectState.siteUrl}${projectState.siteUrl.includes("?") ? "&" : "?"}preview=${encodeURIComponent(projectState.projectId)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handlePublish() {
    if (!projectState || isPublishing) return;
    setIsPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch("/api/organization-website/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          projectId: projectState.isPublished ? null : projectState.projectId,
          unpublish: projectState.isPublished,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.error || "Failed to publish. Please try again.");
        return;
      }
      if (data.ok) {
        const nowPublished = !projectState.isPublished;
        setProjectState((p) => (p ? { ...p, isPublished: nowPublished } : null));
        if (nowPublished) {
          try {
            const statusRes = await fetch(
              `/api/organization-website/status?organizationId=${encodeURIComponent(organizationId)}`,
              { credentials: "include" }
            );
            const statusData = await statusRes.json();
            const liveUrl = statusData.publishedUrl || statusData.siteUrl || null;
            const mode: "domain" | "preview" = statusData.hasCustomDomain ? "domain" : "preview";
            if (liveUrl) {
              setJustPublishedUrl(liveUrl);
              setPublishMode(mode);
              setProjectState((p) => p ? {
                ...p,
                publishedUrl: liveUrl,
                hasCustomDomain: statusData.hasCustomDomain ?? false,
                customDomain: statusData.customDomain ?? null,
              } : null);
            }
          } catch { /* ignore */ }
        } else {
          setJustPublishedUrl(null);
          setPublishMode(null);
        }
      }
    } finally {
      setIsPublishing(false);
    }
  }

  const showDomainPublished = publishMode === "domain" && justPublishedUrl;
  const showPreviewPublished = publishMode === "preview" && justPublishedUrl;

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-dashboard-sidebar px-4 py-2">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-dashboard-card px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-dashboard-card-hover hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={handleBackToProjects}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-dashboard-card px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-dashboard-card-hover hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-60"
            title="Back to project list"
          >
            <RotateCcw className="h-4 w-4" />
            {isResetting ? "Loading…" : "Back to projects"}
          </button>
        </div>
        {projectState && (
          <div className="flex items-center gap-2">
            {/* Edit website form — opens settings panel inside website builder */}
            {formsData ? (
              <button
                type="button"
                onClick={() => setFormPanelOpen(true)}
                className="flex items-center gap-2 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                title="Edit the donation form that appears in your website pages"
              >
                <CreditCard className="h-4 w-4" />
                <span>Edit website form</span>
                <span className="text-emerald-600 font-medium">({websiteFormName})</span>
              </button>
            ) : (
              <Link
                href="/dashboard/custom-forms"
                className="flex items-center gap-2 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                title="Edit donation forms"
              >
                <CreditCard className="h-4 w-4" />
                <span>Edit website form</span>
              </Link>
            )}
            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => {
                iframeRef.current?.contentWindow?.postMessage({ type: "toggle-theme-panel" }, "*");
              }}
              className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 hover:text-indigo-900 transition-colors"
              title="Change theme colors"
            >
              <Palette className="h-4 w-4" />
              Theme
            </button>
            {/* Preview button -- always available */}
            {projectState.siteUrl && (
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-dashboard-card px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-dashboard-card-hover hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            )}
            {/* View live site link -- when published with a custom domain */}
            {projectState.isPublished && projectState.hasCustomDomain && (projectState.publishedUrl || justPublishedUrl) && (
              <a
                href={justPublishedUrl || projectState.publishedUrl || ""}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-100 transition-colors"
              >
                <Globe className="h-4 w-4" />
                View live site
              </a>
            )}
            {/* Preview link -- always available when published so users can view even if domain is broken */}
            {projectState.isPublished && projectState.siteUrl && (
              <a
                href={projectState.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View preview
              </a>
            )}
            {/* Publish / Unpublish button */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60 ${
                projectState.isPublished
                  ? "bg-slate-500 hover:bg-slate-600"
                  : projectState.hasCustomDomain
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Upload className="h-4 w-4" />
              {isPublishing
                ? "Publishing..."
                : projectState.isPublished
                  ? "Unpublish"
                  : projectState.hasCustomDomain
                    ? "Publish to domain"
                    : "Publish preview"}
            </button>
          </div>
        )}
      </header>
      {/* Website form info banner — clarifies which form appears in templates */}
      {projectState && (
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <CreditCard className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              The donation forms in your website templates use the form below. Edit amounts, splits, and design here.
            </span>
          </div>
          {formsData ? (
            <button
              type="button"
              onClick={() => setFormPanelOpen(true)}
              className="shrink-0 font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Edit website form
            </button>
          ) : (
            <Link href="/dashboard/custom-forms" className="shrink-0 font-semibold text-emerald-600 hover:text-emerald-700 underline">
              Custom forms
            </Link>
          )}
        </div>
      )}
      {/* Publish error banner */}
      {publishError && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
            <span className="font-medium text-red-800 dark:text-red-300">{publishError}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Go to Settings
            </Link>
            <button
              type="button"
              onClick={() => setPublishError(null)}
              className="rounded-lg p-1 text-red-400 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Domain-published banner */}
      {showDomainPublished && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 text-sm">
          <span className="font-medium text-emerald-800 dark:text-emerald-300">
            Site published to your domain!
          </span>
          <a
            href={justPublishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            {justPublishedUrl}
          </a>
        </div>
      )}
      {/* Preview-published banner (no custom domain) */}
      {showPreviewPublished && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
            <span className="font-medium text-blue-800 dark:text-blue-300">
              Published as preview. Connect a custom domain in Settings to publish to your own URL.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={justPublishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              View preview
            </a>
            <Link
              href="/dashboard/settings"
              className="rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-dashboard-card px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-dashboard-card-hover transition-colors"
            >
              Connect domain
            </Link>
          </div>
        </div>
      )}
      <div className="relative min-h-0 flex-1 flex">
        <div className="min-h-0 flex-1">
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="h-full w-full border-0"
            title="Website builder"
          />
        </div>
        {/* Website form settings panel — slides in from right */}
        {formPanelOpen && formsData && (
          <div className="absolute inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-slate-200/80 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white px-4 py-3 dark:border-slate-700/60 dark:from-slate-800/80 dark:to-slate-900">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                  <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Website form</h2>
              </div>
              <button
                type="button"
                onClick={() => setFormPanelOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] bg-slate-50/30 dark:bg-slate-900/50 p-4 space-y-6">
              <ThemeFormEditor
                organizationId={formsData.org.id}
                organizationName={formsData.org.name}
                slug={formsData.org.slug}
                baseUrl={baseUrl}
                campaigns={formsData.campaigns}
                endowmentFunds={formsData.endowmentFunds}
                suggestedAmounts={formsData.suggestedAmounts}
                minimumAmountCents={formsData.minCents}
                showEndowmentSelection={formsData.effectiveForm.show_endowment_selection ?? false}
                allowCustomAmount={formsData.effectiveForm.allow_custom_amount ?? true}
                initialHeaderText={formsData.effectiveForm.header_text ?? "Make a Donation"}
                initialSubheaderText={formsData.effectiveForm.subheader_text ?? `Support ${formsData.org.name}`}
                initialThankYouMessage={formsData.effectiveForm.thank_you_message ?? null}
                initialThankYouVideoUrl={formsData.effectiveForm.thank_you_video_url ?? null}
                initialThankYouCtaUrl={formsData.effectiveForm.thank_you_cta_url ?? null}
                initialThankYouCtaText={formsData.effectiveForm.thank_you_cta_text ?? null}
                headerImageUrl={formsData.effectiveForm.header_image_url ?? null}
                initialDesignSet={formsData.designSet}
                initialSplits={(formsData.effectiveForm.splits as { percentage: number; accountId: string }[] | undefined) ?? []}
                initialFormDisplayMode={(formsData.effectiveForm.form_display_mode as "full" | "compressed" | "full_width") ?? "full_width"}
                connectedPeers={formsData.peerOrgs}
                splitRecipientLimit={splitRecipientLimit}
                currentPlan={plan}
                panelMode
              />
              {/* Donate button — which form opens from org page */}
              <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-700/60 dark:bg-slate-800/50">
                <div className="relative border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/40 px-4 py-3 dark:border-slate-700/50 dark:from-emerald-900/10 dark:via-slate-800/50 dark:to-teal-900/10">
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Donate button</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Which form opens from your org page</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <DonateButtonFormSelector
                    organizationId={formsData.org.id}
                    orgSlug={formsData.org.slug}
                    donationLinks={formsData.donationLinks}
                    currentDonateLinkSlug={formsData.effectiveForm.org_page_donate_link_slug ?? null}
                  />
                </div>
              </section>
              {/* Campaign goals */}
              <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-700/60 dark:bg-slate-800/50">
                <div className="relative border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/40 px-4 py-3 dark:border-slate-700/50 dark:from-emerald-900/10 dark:via-slate-800/50 dark:to-teal-900/10">
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                      <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Campaign goals</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Amounts and deadlines for donation campaigns</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <CampaignsEditor campaigns={formsData.campaigns} />
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
