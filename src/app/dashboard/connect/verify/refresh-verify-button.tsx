"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshVerifyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetch("/api/connect/check-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={loading}
      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
    >
      {loading ? "Checking…" : "Refresh status"}
    </button>
  );
}
