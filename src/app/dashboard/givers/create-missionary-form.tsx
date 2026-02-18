"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function CreateMissionaryForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setLoading(true);
    try {
      const res = await fetch("/api/missionaries/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giverEmail: trimmedEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to add missionary");
      }
      toast.success(`${trimmedEmail} added as missionary`);
      setEmail("");
      setExpanded(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        Add missionary
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 p-5 shadow-sm dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-teal-900/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-800/40">
          <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-dashboard-text">
            Add a missionary
          </h3>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-dashboard-text-muted">
            Enter the email of someone who has a Give account. They&apos;ll be connected to your organization and receive an embed code to collect support.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="missionary-email" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="missionary-email"
                type="email"
                required
                placeholder="missionary@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-dashboard-card dark:text-dashboard-text dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Add missionary
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              setEmail("");
            }}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors dark:text-dashboard-text-muted dark:hover:bg-dashboard-card-hover"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
