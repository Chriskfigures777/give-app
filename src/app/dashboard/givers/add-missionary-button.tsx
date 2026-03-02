"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

type Props = {
  giverEmail: string;
  giverName?: string | null;
};

export function AddMissionaryButton({ giverEmail, giverName }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    if (!giverEmail?.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/missionaries/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giverEmail: giverEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to add missionary");
      }
      toast.success(`${giverName ?? giverEmail} added as missionary`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
      title="Add as missionary"
    >
      <UserPlus className="h-3.5 w-3.5" />
      {loading ? "Adding…" : "Add as missionary"}
    </button>
  );
}
