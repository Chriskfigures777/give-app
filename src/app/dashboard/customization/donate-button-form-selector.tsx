"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SPLITS_ENABLED } from "@/lib/feature-flags";
import { Check, Loader2 } from "lucide-react";

type DonationLink = { id: string; name: string; slug: string };

type Props = {
  organizationId: string;
  orgSlug: string;
  donationLinks: DonationLink[];
  currentDonateLinkSlug: string | null;
};

export function DonateButtonFormSelector({
  organizationId,
  orgSlug,
  donationLinks,
  currentDonateLinkSlug,
}: Props) {
  const [selected, setSelected] = useState<string | null>(currentDonateLinkSlug);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (slug: string | null) => {
    setSaving(true);
    try {
      const res = await fetch("/api/form-customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          org_page_donate_link_slug: slug,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setSelected(slug);
      toast.success("Donate button updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const defaultFormUrl = `/give/${orgSlug}`;
  const donateUrl = selected
    ? `/give/${orgSlug}?link=${encodeURIComponent(selected)}`
    : defaultFormUrl;

  return (
    <div className="min-w-0">
      <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
        Choose which donation form the Donate button on your org page links to. The button appears next to your profile image.
      </p>

      <div className="space-y-4">
        <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-300">Active form</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            disabled={saving}
            className={`relative inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-all duration-200 ${
              selected === null
                ? "border-emerald-500/50 bg-emerald-500 text-white shadow-sm"
                : "border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {selected === null && <Check className="h-3.5 w-3.5" />}
            Default form
            {saving && selected === null && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
          </button>
          {SPLITS_ENABLED && donationLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleSelect(link.slug)}
              disabled={saving}
              className={`relative inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                selected === link.slug
                  ? "border-emerald-500/50 bg-emerald-500 text-white shadow-sm"
                  : "border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {selected === link.slug && <Check className="h-3.5 w-3.5" />}
              {link.name}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 px-4 py-3.5 border border-black/[0.04] dark:border-white/[0.04]">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Active link</p>
          <code className="inline-block rounded-xl bg-white dark:bg-slate-800 border border-black/[0.06] dark:border-white/[0.06] px-3 py-1.5 text-[12px] font-mono text-slate-600 dark:text-slate-300">
            {donateUrl}
          </code>
        </div>
      </div>
    </div>
  );
}
