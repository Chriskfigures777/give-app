"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmText.trim().toLowerCase() === "delete my account";

  const handleDelete = async () => {
    if (!canConfirm) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete account");
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-red-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-red-800/40 dark:bg-slate-800/50">
        <div className="relative border-b border-red-100 bg-gradient-to-r from-red-50/60 via-white to-rose-50/40 px-6 py-5 dark:border-red-900/40 dark:from-red-900/10 dark:via-slate-800/50 dark:to-rose-900/10">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 dark:bg-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Danger zone
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Irreversible account actions
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Delete your account
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Permanently remove your account, profile, and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(true); setConfirmText(""); setError(null); }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:shadow-sm dark:border-red-800/60 dark:bg-slate-800 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete account
            </button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-red-900 dark:text-red-100">
              Delete your account?
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              This will permanently delete your account, profile data, and sign you out.
              This action <strong className="text-red-600 dark:text-red-400">cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Type <span className="font-semibold text-red-600 dark:text-red-400">delete my account</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              autoComplete="off"
              disabled={deleting}
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canConfirm || deleting}
              className="rounded-xl"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Permanently delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
