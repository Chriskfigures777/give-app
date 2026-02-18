"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Props = {
  organizationName: string;
  slug: string;
  embedUrl: string;
  embedUrlFullScreen: string;
  iframeCode: string;
};

export function MissionaryEmbedClient({
  organizationName,
  slug,
  embedUrl,
  embedUrlFullScreen,
  iframeCode,
}: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(embedUrlFullScreen);
    toast.success("Link copied to clipboard");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(iframeCode);
    toast.success("Embed code copied to clipboard");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-dashboard-card">
        <h3 className="text-base font-bold text-slate-900 dark:text-dashboard-text">Share link</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-dashboard-text-muted">
          Direct link to the donation form. Share on social media, email, or messaging.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <code className="flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {embedUrlFullScreen}
          </code>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedLink ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-dashboard-card">
        <h3 className="text-base font-bold text-slate-900 dark:text-dashboard-text">Embed code</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-dashboard-text-muted">
          Paste this into your website, blog, or anywhere you want to receive support.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
          <code>{iframeCode}</code>
        </pre>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedCode ? "Copied" : "Copy embed code"}
          </button>
          <a
            href={`/give/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </a>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-dashboard-text-muted">
        Donations through this form go to {organizationName}. They can split revenue with you once you&apos;re connected. Contact your sponsoring organization to set up splits.
      </p>
    </div>
  );
}
