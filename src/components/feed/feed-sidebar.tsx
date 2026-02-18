"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

type SidebarOrg = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  profile_image_url?: string | null;
};

const PLACEHOLDER_LOGO =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

function getOrgImageUrl(org: SidebarOrg): string {
  return org.profile_image_url ?? org.logo_url ?? PLACEHOLDER_LOGO;
}

function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
        <div className="space-y-3">
          <div className="feed-shimmer h-4 w-24 rounded-lg" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="feed-shimmer h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="feed-shimmer h-3.5 w-3/4 rounded" />
                <div className="feed-shimmer h-2.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrgRow({ org, actionLabel }: { org: SidebarOrg; actionLabel: string }) {
  return (
    <Link
      href={`/org/${org.slug}`}
      className="group flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-slate-50/80"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 p-[1.5px]">
        <div className="h-full w-full overflow-hidden rounded-full">
          <Image
            src={getOrgImageUrl(org)}
            alt={org.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 group-hover:text-slate-900">
          {org.name}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 opacity-0 transition-all duration-200 group-hover:opacity-100">
        {actionLabel}
      </span>
    </Link>
  );
}

export function FeedSidebar() {
  const [connections, setConnections] = useState<SidebarOrg[]>([]);
  const [savedOrgs, setSavedOrgs] = useState<SidebarOrg[]>([]);
  const [discoverOrgs, setDiscoverOrgs] = useState<SidebarOrg[]>([]);
  const [myOrgSlug, setMyOrgSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [meRes, connRes, savedRes, searchRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/peers/connections"),
          fetch("/api/donor/saved-organizations"),
          fetch("/api/search?limit=5"),
        ]);

        const meData = await meRes.json();
        const mySlug = meData.orgSlug ?? null;
        setMyOrgSlug(mySlug);

        const connData = await connRes.json();
        const savedData = await savedRes.json();
        const searchData = await searchRes.json();

        const connOrgs: SidebarOrg[] = (connData.connections ?? [])
          .filter(
            (c: { otherOrgSlug: string | null }) => c.otherOrgSlug
          )
          .map(
            (c: {
              otherName: string;
              otherOrgSlug: string;
              otherProfileImageUrl?: string | null;
              otherLogoUrl?: string | null;
            }) => ({
              id: c.otherOrgSlug,
              name: c.otherName,
              slug: c.otherOrgSlug,
              profile_image_url: c.otherProfileImageUrl ?? undefined,
              logo_url: c.otherLogoUrl ?? undefined,
            })
          );

        const saved: SidebarOrg[] = (savedData.organizations ?? []).map(
          (o: {
            id: string;
            name: string;
            slug: string;
            logo_url?: string | null;
            profile_image_url?: string | null;
          }) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            profile_image_url: o.profile_image_url,
            logo_url: o.logo_url,
          })
        );

        const merged = new Map<string, SidebarOrg>();
        for (const o of connOrgs) {
          if (!merged.has(o.slug)) merged.set(o.slug, o);
        }
        for (const o of saved) {
          if (!merged.has(o.slug)) merged.set(o.slug, o);
        }
        let peersList = Array.from(merged.values());
        if (mySlug) {
          peersList = peersList.filter((o) => o.slug !== mySlug);
        }
        setConnections(peersList);
        setSavedOrgs(saved);

        const orgs = searchData.organizations ?? [];
        const existingSlugs = new Set(merged.keys());
        const suggested = orgs
          .filter(
            (o: { slug: string }) =>
              !existingSlugs.has(o.slug) && o.slug !== mySlug
          )
          .slice(0, 5)
          .map(
            (o: {
              id: string;
              name: string;
              slug: string;
              logo_url?: string | null;
              profile_image_url?: string | null;
            }) => ({
              id: o.id,
              name: o.name,
              slug: o.slug,
              profile_image_url: o.profile_image_url,
              logo_url: o.logo_url,
            })
          );
        setDiscoverOrgs(suggested);
      } catch {
        setConnections([]);
        setSavedOrgs([]);
        setDiscoverOrgs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <SidebarSkeleton />;

  const rawOrgs = connections.length > 0 ? connections : savedOrgs;
  const yourOrgs = myOrgSlug
    ? rawOrgs.filter((o) => o.slug !== myOrgSlug)
    : rawOrgs;
  const showDiscover = yourOrgs.length < 3 && discoverOrgs.length > 0;

  return (
    <div className="space-y-0">
      {/* Your Peers */}
      <div className="p-4 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-500" strokeWidth={2} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Your Peers
          </h3>
          <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
            {yourOrgs.length}
          </span>
        </div>
        {yourOrgs.length === 0 ? (
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 text-center">
            <p className="text-sm text-slate-500">
              No peers yet.
            </p>
            <Link
              href="/explore"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Discover organizations
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-0.5">
            {yourOrgs.slice(0, 8).map((org) => (
              <OrgRow key={org.slug} org={org} actionLabel="Visit" />
            ))}
          </div>
        )}
      </div>

      {/* Discover */}
      {showDiscover && (
        <div className="border-t border-slate-100/80 p-4 pb-3">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-500" strokeWidth={2} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Suggested for You
            </h3>
          </div>
          <div className="space-y-0.5">
            {discoverOrgs.map((org) => (
              <OrgRow key={org.slug} org={org} actionLabel="Follow" />
            ))}
          </div>
          <Link
            href="/explore"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50/80 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Explore all
          </Link>
        </div>
      )}

      {/* Trending activity indicator */}
      <div className="border-t border-slate-100/80 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Live Activity
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Your feed updates in real-time. New posts and donations appear
          automatically.
        </p>
      </div>
    </div>
  );
}
