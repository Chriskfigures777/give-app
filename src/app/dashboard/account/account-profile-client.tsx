"use client";

import { useState } from "react";
import { toast } from "sonner";
import { User, Save, Loader2, Heart, Users, Zap, Church, Building2 } from "lucide-react";
import { UserTypeBadge } from "@/components/user-type-badge";

type Props = {
  userId: string;
  initialName: string;
  initialBio: string;
  role: string;
  email: string;
  avatarUrl: string | null;
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  donor: "You give to organizations and causes you care about.",
  missionary: "You serve as a missionary supported by organizations.",
  nonprofit: "You represent or manage a nonprofit organization.",
  church: "You represent or manage a church.",
  member: "You are a community member on the platform.",
  platform_admin: "Platform administrator.",
};

export function AccountProfileClient({
  userId,
  initialName,
  initialBio,
  role,
  email,
  avatarUrl,
}: Props) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name.trim(),
          bio: bio.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("Profile updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-2 py-4 sm:px-4 sm:py-6">
      {/* Header */}
      <div className="dashboard-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          Your public identity on the platform. Other members and organizations can see this.
        </p>
      </div>

      {/* Avatar + identity card */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        <div className="border-b border-dashboard-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/20">
              <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <h2 className="text-sm font-semibold text-dashboard-text">
              Profile Identity
            </h2>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-dashboard-border"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 ring-2 ring-dashboard-border text-xl font-bold text-sky-600 dark:text-sky-400">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-dashboard-text">{name || "Your Name"}</p>
              <p className="text-xs text-dashboard-text-muted mt-0.5">{email}</p>
              <div className="mt-1.5">
                <UserTypeBadge type={role} />
              </div>
            </div>
          </div>

          {/* Role info */}
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1">
              Your Role
            </p>
            <div className="flex items-center gap-2">
              <UserTypeBadge type={role} size="sm" />
              <span className="text-xs text-dashboard-text-muted">
                {ROLE_DESCRIPTIONS[role] ?? "Community member."}
              </span>
            </div>
          </div>

          {/* Name field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              maxLength={100}
              className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
          </div>

          {/* Bio field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">
              Bio <span className="normal-case font-normal">(shown on your public profile)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself, your mission, or why you give…"
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
            />
            <p className="mt-1 text-right text-[11px] text-dashboard-text-muted/60">
              {bio.length}/500
            </p>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-sky-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* Community labels explanation */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-2 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        <div className="border-b border-dashboard-border px-5 py-4">
          <h2 className="text-sm font-semibold text-dashboard-text">Community Labels</h2>
          <p className="text-xs text-dashboard-text-muted mt-0.5">How members are identified in the community</p>
        </div>
        <div className="p-5 grid gap-3 sm:grid-cols-2">
          {[
            { type: "church", desc: "A church or faith community" },
            { type: "nonprofit", desc: "A registered nonprofit org" },
            { type: "missionary", desc: "Individual missionary worker" },
            { type: "donor", desc: "Individual supporter & giver" },
            { type: "member", desc: "General community member" },
          ].map(({ type, desc }) => (
            <div
              key={type}
              className="flex items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-card-hover/20 px-3 py-2.5"
            >
              <UserTypeBadge type={type} size="sm" />
              <span className="text-xs text-dashboard-text-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
