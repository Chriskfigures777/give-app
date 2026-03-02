"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type Props = {
  donationId: string;
  /** When viewing via token (e.g. anonymous donor), pass for PDF download auth */
  receiptToken?: string | null;
};

export function DownloadReceiptButton({ donationId, receiptToken }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = new URL(`/api/receipts/${donationId}`, window.location.origin);
      apiUrl.searchParams.set("format", "pdf");
      if (receiptToken) apiUrl.searchParams.set("token", receiptToken);
      const res = await fetch(apiUrl.toString(), {
        credentials: "include",
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let message = `Failed to generate receipt (${res.status})`;
        if (contentType?.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          message = data.detail || data.error || message;
        } else {
          const text = await res.text();
          if (text.length < 200) message = text || message;
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${donationId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download receipt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Download className="h-4 w-4" />
        {loading ? "Generating PDF…" : "Download PDF"}
      </button>
      {error && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <a
            href={`/api/receipts/${donationId}?format=pdf${receiptToken ? `&token=${encodeURIComponent(receiptToken)}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            Try opening in new tab
          </a>
        </div>
      )}
    </div>
  );
}
