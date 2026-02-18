"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConvertToMissionaryButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConvert() {
    setLoading(true);
    try {
      const res = await fetch("/api/missionaries/convert", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to convert");
      }
      router.refresh();
      window.location.href = "/dashboard/missionary";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleConvert}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
    >
      {loading ? "Converting…" : "Convert to missionary"}
    </button>
  );
}
