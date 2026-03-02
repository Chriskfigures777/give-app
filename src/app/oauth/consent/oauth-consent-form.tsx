"use client";

import { useState } from "react";

type Props = { authorizationId: string };

export function OAuthConsentForm({ authorizationId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <form action="/api/oauth/decision" method="POST" className="mt-8">
      <input type="hidden" name="authorization_id" value={authorizationId} />
      <div className="flex gap-3">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={!!loading}
          onClick={() => setLoading("approve")}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading === "approve" ? "Processing…" : "Approve"}
        </button>
        <button
          type="submit"
          name="decision"
          value="deny"
          disabled={!!loading}
          onClick={() => setLoading("deny")}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {loading === "deny" ? "Processing…" : "Deny"}
        </button>
      </div>
    </form>
  );
}
