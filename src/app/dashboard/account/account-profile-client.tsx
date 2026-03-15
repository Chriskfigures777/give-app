"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Camera,
  Save,
  Loader2,
  Heart,
  Users,
  Zap,
  Building2,
  Upload,
  CheckCircle2,
  ExternalLink,
  Mail,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { UserTypeBadge } from "@/components/user-type-badge";
import Link from "next/link";

type Props = {
  userId: string;
  initialName: string;
  initialBio: string;
  role: string;
  email: string;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationName: string | null;
  orgLogoUrl: string | null;
};

const ROLE_OPTIONS = [
  {
    value: "donor",
    label: "Donor",
    description: "I give to organizations and causes I care about",
    icon: Heart,
    color: "rose",
    border: "border-rose-200 dark:border-rose-500/30",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    activeBorder: "border-rose-400 dark:border-rose-400",
    activeBg: "bg-rose-100 dark:bg-rose-500/20",
    ring: "ring-rose-300/60 dark:ring-rose-400/30",
    iconBg: "bg-rose-100 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    checkColor: "text-rose-500 dark:text-rose-400",
  },
  {
    value: "missionary",
    label: "Missionary",
    description: "I serve as a missionary or field worker",
    icon: Zap,
    color: "amber",
    border: "border-amber-200 dark:border-amber-500/30",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    activeBorder: "border-amber-400 dark:border-amber-400",
    activeBg: "bg-amber-100 dark:bg-amber-500/20",
    ring: "ring-amber-300/60 dark:ring-amber-400/30",
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    checkColor: "text-amber-500 dark:text-amber-400",
  },
  {
    value: "member",
    label: "Member",
    description: "I am a general community member",
    icon: Users,
    color: "sky",
    border: "border-sky-200 dark:border-sky-500/30",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    activeBorder: "border-sky-400 dark:border-sky-400",
    activeBg: "bg-sky-100 dark:bg-sky-500/20",
    ring: "ring-sky-300/60 dark:ring-sky-400/30",
    iconBg: "bg-sky-100 dark:bg-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
    checkColor: "text-sky-500 dark:text-sky-400",
  },
  {
    value: "organization_admin",
    label: "Organization Admin",
    description: "I manage a church, nonprofit, or ministry",
    icon: Building2,
    color: "emerald",
    border: "border-emerald-200 dark:border-emerald-500/30",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    activeBorder: "border-emerald-400 dark:border-emerald-400",
    activeBg: "bg-emerald-100 dark:bg-emerald-500/20",
    ring: "ring-emerald-300/60 dark:ring-emerald-400/30",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    checkColor: "text-emerald-500 dark:text-emerald-400",
  },
] as const;

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function AccountProfileClient({
  userId,
  initialName,
  initialBio,
  role,
  email,
  avatarUrl,
  organizationId,
  organizationName,
  orgLogoUrl,
}: Props) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [selectedRole, setSelectedRole] = useState(role);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [currentOrgLogo, setCurrentOrgLogo] = useState(orgLogoUrl);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isPlatformAdmin = role === "platform_admin";
  const initials = getInitials(name);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setCurrentAvatar(data.url);
      toast.success("Profile photo updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/upload/email-logo", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");

      const patchRes = await fetch("/api/organization-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: uploadData.url }),
      });
      if (!patchRes.ok) {
        const pd = await patchRes.json();
        throw new Error(pd.error ?? "Failed to save logo");
      }
      setCurrentOrgLogo(uploadData.url);
      toast.success("Organization logo updated! It will appear on your public pages, surveys, and connect cards.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

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
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("Profile saved!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      {/* Page title */}
      <div className="dashboard-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">My Profile</h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          Your public identity — visible to other members and organizations.
        </p>
      </div>

      {/* ── Hero identity card ── */}
      <div className="dashboard-fade-in rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
        {/* Cover banner */}
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1.5px, transparent 1.5px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="px-5 pb-5">
          {/* Avatar + name row */}
          <div className="flex items-end gap-4 -mt-10 mb-4">
            {/* Avatar with upload overlay */}
            <div className="relative shrink-0 group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative h-20 w-20 rounded-2xl ring-4 ring-dashboard-card overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-sky-400"
                aria-label="Upload profile photo"
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={name || "Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-400 to-blue-600 text-2xl font-bold text-white select-none">
                    {initials}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
              </button>
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <p className="text-lg font-bold text-dashboard-text truncate">
                {name || "Your Name"}
              </p>
              <p className="text-xs text-dashboard-text-muted truncate">{email}</p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <UserTypeBadge type={isPlatformAdmin ? "platform_admin" : selectedRole} />
                {organizationName && (
                  <span className="text-[11px] text-dashboard-text-muted">
                    · {organizationName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Upload hint link */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="inline-flex items-center gap-1.5 text-xs text-dashboard-text-muted hover:text-dashboard-text transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploadingAvatar ? "Uploading…" : "Change profile photo"}
          </button>
        </div>
      </div>

      {/* ── Organization Logo ── */}
      {organizationId && (
        <div className="dashboard-fade-in rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          <div className="border-b border-dashboard-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-dashboard-text">Organization Logo</h2>
            </div>
            <p className="mt-0.5 text-xs text-dashboard-text-muted">
              This logo appears on your public page, surveys, connect cards, and email receipts.
            </p>
          </div>
          <div className="flex items-center gap-5 p-5">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoChange}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="relative h-20 w-20 shrink-0 rounded-2xl border-2 border-dashed border-dashboard-border overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-colors group focus:outline-none"
              aria-label="Upload organization logo"
            >
              {currentOrgLogo ? (
                <img src={currentOrgLogo} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-dashboard-card-hover/30 text-dashboard-text-muted">
                  <Building2 className="h-6 w-6" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingLogo ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Upload className="h-5 w-5 text-white" />
                )}
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dashboard-text">
                {currentOrgLogo ? "Logo uploaded" : "No logo yet"}
              </p>
              <p className="text-xs text-dashboard-text-muted mt-0.5">
                Upload a JPG, PNG, WebP, or SVG. Max 3 MB.
              </p>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingLogo ? "Uploading\u2026" : currentOrgLogo ? "Change logo" : "Upload logo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column grid ── */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Personal info */}
        <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          <div className="border-b border-dashboard-border px-5 py-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-sky-500" />
              <h2 className="text-sm font-semibold text-dashboard-text">Personal Info</h2>
            </div>
            <p className="mt-0.5 text-xs text-dashboard-text-muted">
              Shown on your public profile page
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                maxLength={100}
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself, your mission, or why you give…"
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
              />
              <p className="mt-1 text-right text-[11px] text-dashboard-text-muted/60">
                {bio.length}/500
              </p>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="dashboard-fade-in dashboard-fade-in-delay-1 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          <div className="border-b border-dashboard-border px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-500" />
              <h2 className="text-sm font-semibold text-dashboard-text">Account Details</h2>
            </div>
            <p className="mt-0.5 text-xs text-dashboard-text-muted">
              Your login and account info
            </p>
          </div>
          <div className="p-5 space-y-3">
            {/* Email */}
            <div className="flex items-start gap-3 rounded-xl border border-dashboard-border bg-dashboard-card-hover/20 px-4 py-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-dashboard-text-muted" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
                  Email
                </p>
                <p className="text-sm text-dashboard-text truncate">{email}</p>
              </div>
            </div>

            {/* Organization link */}
            {organizationId && organizationName && (
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-card-hover/20 px-4 py-3 hover:bg-dashboard-card-hover/40 transition-colors group"
              >
                <Building2 className="h-4 w-4 shrink-0 text-dashboard-text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
                    Organization
                  </p>
                  <p className="text-sm text-dashboard-text truncate">{organizationName}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-dashboard-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}

            {/* View public profile */}
            <Link
              href={`/u/${userId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-sky-200/60 bg-sky-50/50 dark:border-sky-500/20 dark:bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-100/60 dark:hover:bg-sky-500/15 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View public profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Role selector ── */}
      {!isPlatformAdmin && (
        <div className="dashboard-fade-in dashboard-fade-in-delay-2 rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          <div className="border-b border-dashboard-border px-5 py-4">
            <h2 className="text-sm font-semibold text-dashboard-text">Your Role</h2>
            <p className="mt-0.5 text-xs text-dashboard-text-muted">
              Choose how you participate in the community. This shows on your public profile.
            </p>
          </div>
          <div className="p-5 grid gap-3 sm:grid-cols-2">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = selectedRole === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedRole(opt.value)}
                  className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-150 ${
                    isActive
                      ? `${opt.activeBorder} ${opt.activeBg} ring-2 ${opt.ring}`
                      : `${opt.border} ${opt.bg} hover:opacity-80`
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${opt.iconBg}`}
                  >
                    <Icon className={`h-4 w-4 ${opt.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dashboard-text">{opt.label}</p>
                    <p className="mt-0.5 text-xs text-dashboard-text-muted leading-snug">
                      {opt.description}
                    </p>
                  </div>
                  {isActive && (
                    <CheckCircle2
                      className={`absolute top-3 right-3 h-4 w-4 ${opt.checkColor}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Save button ── */}
      <div className="dashboard-fade-in dashboard-fade-in-delay-3 flex items-center justify-between gap-4">
        <p className="text-xs text-dashboard-text-muted">
          Changes to your name and bio are reflected on your public profile immediately.
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50"
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
  );
}
