"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, ExternalLink, Upload, Eye, Globe, AlertCircle, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type Props = {
  organizationId: string;
};

type EditorProjectState = {
  projectId: string;
  siteUrl: string | null;
  publishedUrl: string | null;
  isPublished: boolean;
  hasCustomDomain: boolean;
  customDomain: string | null;
};

export function WebsiteBuilderClient({ organizationId }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [projectState, setProjectState] = useState<EditorProjectState | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [justPublishedUrl, setJustPublishedUrl] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<"domain" | "preview" | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const iframeSrc = `/dashboard/pages/editor-frame`;

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "editor-project-loaded") {
        setProjectState({
          projectId: e.data.projectId,
          siteUrl: e.data.siteUrl ?? null,
          publishedUrl: e.data.publishedUrl ?? null,
          isPublished: e.data.isPublished ?? false,
          hasCustomDomain: e.data.hasCustomDomain ?? false,
          customDomain: e.data.customDomain ?? null,
        });
        setJustPublishedUrl(null);
        setPublishMode(null);
      } else if (e.data?.type === "editor-project-unloaded") {
        setProjectState(null);
        setJustPublishedUrl(null);
        setPublishMode(null);
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
    try {
      if (iframeRef.current) {
        iframeRef.current.src = iframeSrc;
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
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={handleBackToProjects}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-60"
            title="Back to project list"
          >
            <RotateCcw className="h-4 w-4" />
            {isResetting ? "Loading…" : "Back to projects"}
          </button>
        </div>
        {projectState && (
          <div className="flex items-center gap-2">
            {/* Preview button -- always available */}
            {projectState.siteUrl && (
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            )}
            {/* View live site link -- only when published with a custom domain */}
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
            {/* View preview link -- published without a domain */}
            {projectState.isPublished && !projectState.hasCustomDomain && projectState.siteUrl && (
              <a
                href={projectState.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View published preview
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
      {/* Publish error banner */}
      {publishError && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="font-medium text-red-800">{publishError}</span>
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
              className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Domain-published banner */}
      {showDomainPublished && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
          <span className="font-medium text-emerald-800">
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
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="font-medium text-blue-800">
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
              className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
            >
              Connect domain
            </Link>
          </div>
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="h-full w-full border-0"
          title="Website builder"
        />
      </div>
    </div>
  );
}
