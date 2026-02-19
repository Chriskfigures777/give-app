"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, Check, PieChart } from "lucide-react";
import { SplitPercentageChart } from "@/components/split-percentage-chart";
import type { OrgPlan } from "@/lib/plan";

type Split = { percentage: number; accountId: string };
type Peer = {
  id: string;
  name: string;
  slug: string;
  stripe_connect_account_id: string;
};

interface Props {
  organizationId: string;
  organizationName: string;
  initialSplits: Split[];
  connectedPeers: Peer[];
  splitRecipientLimit?: number;
  currentPlan?: OrgPlan;
}

export function SplitSettingsPanel({
  organizationId,
  organizationName,
  initialSplits,
  connectedPeers,
  splitRecipientLimit = Infinity,
  currentPlan = "free",
}: Props) {
  const router = useRouter();
  const [splits, setSplits] = useState<Split[]>(initialSplits);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/form-customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          splits: splits.length > 0 ? splits : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setSaved(true);
      toast.success("Payment splits saved");
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-4 px-7 py-5 border-b border-slate-100 dark:border-slate-700/30">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
            <PieChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Payment Splits
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
              Control how donations are distributed
              {splitRecipientLimit !== Infinity && (
                <span className="ml-1 text-xs">
                  ({splits.length}/{splitRecipientLimit} recipient{splitRecipientLimit === 1 ? "" : "s"})
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-95 active:scale-[0.98] bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/20"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving" : saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="p-7">
        <SplitPercentageChart
          splits={splits}
          onSplitsChange={setSplits}
          connectedPeers={connectedPeers}
          organizationName={organizationName}
          maxRecipients={splitRecipientLimit}
          currentPlan={currentPlan}
        />
      </div>
    </section>
  );
}
