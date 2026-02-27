"use client";

import { useState } from "react";

export function PasswordResetButton({ userId, email }: { userId: string; email: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!confirm(`Send a password reset email to ${email}?`)) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to send reset email");
      }
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleReset}
        disabled={sending}
        className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60 transition-colors dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
      >
        {sending ? "Sending…" : "Send password reset"}
      </button>
      {sent && <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 text-center">Reset email sent!</p>}
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 text-center">{error}</p>}
    </div>
  );
}
