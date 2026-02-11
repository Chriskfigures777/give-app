"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

type Props = {
  orgName: string;
  className?: string;
};

export function ShareComplete({ orgName, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = orgName
      ? `I just gave to ${orgName}!`
      : "I just made a donation!";
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Donation complete",
          text,
          url: typeof window !== "undefined" ? window.location.origin : "",
        });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled or error
    }
  }

  return (
    <div className={className}>
      <p className="text-sm text-slate-500 mb-2">Share your generosity (optional)</p>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        {copied ? "Copied!" : "Share that you gave"}
      </button>
    </div>
  );
}
