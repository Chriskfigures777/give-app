"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

type Props = {
  hasDonations: boolean;
};

export function YearEndDownload({ hasDonations }: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/receipts/year-end?year=${year}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let message = `Failed to generate summary (${res.status})`;
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
      a.download = `donation-summary-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download tax summary");
    } finally {
      setLoading(false);
    }
  };

  if (!hasDonations) return null;

  const years = Array.from({ length: Math.min(10, currentYear - 2019) }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm">
      <FileText className="h-5 w-5 text-dashboard-text-muted" />
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-dashboard-text">Year-end tax summary</span>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          className="rounded-lg border border-dashboard-border bg-dashboard-input px-3 py-1.5 text-sm text-dashboard-text"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-dashboard-text px-4 py-1.5 text-sm font-medium text-dashboard hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Generating…" : "Download PDF"}
        </button>
      </div>
      {error && (
        <div className="w-full space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <a
            href={`/api/receipts/year-end?year=${year}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-dashboard-text-muted underline hover:text-dashboard-text"
          >
            Try opening in new tab
          </a>
        </div>
      )}
    </div>
  );
}
