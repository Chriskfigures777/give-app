"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, ExternalLink, Upload } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type Props = {
  organizationId: string;
};

type EditorProjectState = {
  projectId: string;
  siteUrl: string | null;
  publishedUrl: string | null;
  isPublished: boolean;
};

/**
 * Loads the GrapeJS Studio editor in an iframe to avoid React 19 ref compatibility
 * issues with the SDK's forwardRef usage.
 */
export function WebsiteBuilderClient({ organizationId }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [projectState, setProjectState] = useState<EditorProjectState | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [justPublishedUrl, setJustPublishedUrl] = useState<string | null>(null);
  const iframeSrc = `/dashboard/pages/editor-frame`;

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "editor-project-loaded") {
        setProjectState({
          projectId: e.data.projectId,
          siteUrl: e.data.siteUrl ?? null,
          publishedUrl: e.data.publishedUrl ?? null,
          isPublished: e.data.isPublished ?? false,
        });
        setJustPublishedUrl(null);
      } else if (e.data?.type === "editor-project-unloaded") {
        setProjectState(null);
        setJustPublishedUrl(null);
      } else if (e.data?.type === "site-published") {
        if (e.data.published && e.data.publishedUrl) {
          setJustPublishedUrl(e.data.publishedUrl);
          setProjectState((p) => p ? { ...p, isPublished: true, publishedUrl: e.data.publishedUrl } : null);
        } else {
          setJustPublishedUrl(null);
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
      if (data.ok) {
        const nowPublished = !projectState.isPublished;
        setProjectState((p) => (p ? { ...p, isPublished: nowPublished } : null));
        if (nowPublished) {
          // Fetch updated status to get live publishedUrl
          try {
            const statusRes = await fetch(
              `/api/organization-website/status?organizationId=${encodeURIComponent(organizationId)}`,
              { credentials: "include" }
            );
            const statusData = await statusRes.json();
            const liveUrl = statusData.publishedUrl || statusData.siteUrl || null;
            if (liveUrl) {
              setJustPublishedUrl(liveUrl);
              setProjectState((p) => p ? { ...p, publishedUrl: liveUrl } : null);
            }
          } catch { /* ignore */ }
        } else {
          setJustPublishedUrl(null);
        }
      }
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Top bar - all buttons above the editor so nothing covers content */}
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
            {projectState.siteUrl && (
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Preview
              </button>
            )}
            {projectState.isPublished && (projectState.publishedUrl || justPublishedUrl) && (
              <a
                href={justPublishedUrl || projectState.publishedUrl || ""}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View live site
              </a>
            )}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {isPublishing ? "Publishing..." : projectState.isPublished ? "Unpublish" : "Publish"}
            </button>
          </div>
        )}
      </header>
      {/* Published URL banner */}
      {justPublishedUrl && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
          <span className="font-medium text-emerald-800">Site published!</span>
          <a
            href={justPublishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View live site: {justPublishedUrl}
          </a>
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="h-full w-full border-0"
          title="Website builder"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
