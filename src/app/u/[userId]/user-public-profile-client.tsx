"use client";

import { useState } from "react";
import Link from "next/link";
import { UserTypeBadge } from "@/components/user-type-badge";
import { UserPlus, Check, Building2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Profile = {
  id: string;
  full_name: string;
  role: string;
  bio: string | null;
};

type OrgInfo = {
  name: string;
  slug: string;
  logo_url: string | null;
} | null;

type Props = {
  profile: Profile;
  orgInfo: OrgInfo;
  viewerUserId: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserPublicProfileClient({ profile, orgInfo, viewerUserId }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const isOwnProfile = viewerUserId === profile.id;

  const handleConnect = async () => {
    if (!viewerUserId) {
      window.location.href = "/login";
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch("/api/peers/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: profile.id,
          recipientType: "user",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send request");
      setConnected(true);
      toast.success("Connection request sent!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send request");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 pb-24 pt-14 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          {/* Avatar */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 text-3xl font-bold text-white backdrop-blur-sm ring-4 ring-white/20">
            {getInitials(profile.full_name)}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{profile.full_name}</h1>
          <div className="mt-3 flex items-center justify-center">
            <UserTypeBadge type={profile.role} size="sm" />
          </div>
          {profile.bio && (
            <p className="mt-4 max-w-md mx-auto text-base text-sky-100/90 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Actions */}
          {!isOwnProfile && (
            <div className="mt-6 flex items-center justify-center gap-3">
              {viewerUserId ? (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting || connected}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:bg-sky-50 disabled:opacity-70"
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : connected ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {connected ? "Request sent" : "Connect"}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:bg-sky-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign in to connect
                </Link>
              )}
            </div>
          )}

          {isOwnProfile && (
            <div className="mt-6">
              <Link
                href="/dashboard/account"
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
              >
                Edit your profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto -mt-12 max-w-3xl px-6 pb-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* About card */}
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              About
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Role</span>
                <UserTypeBadge type={profile.role} size="sm" />
              </div>
              {profile.bio ? (
                <p className="text-sm leading-relaxed text-slate-700">{profile.bio}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">No bio yet.</p>
              )}
            </div>
          </div>

          {/* Affiliated org card */}
          {orgInfo && (
            <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Organization
              </h2>
              <Link
                href={`/org/${orgInfo.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-sky-200 hover:bg-sky-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                  {orgInfo.logo_url ? (
                    <img
                      src={orgInfo.logo_url}
                      alt={orgInfo.name}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-sky-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{orgInfo.name}</p>
                  <p className="text-xs text-slate-500">View organization</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
