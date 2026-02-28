"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { UserTypeBadge } from "@/components/user-type-badge";

type SidebarOrg = {
  id: string;
  name: string;
  slug: string;
  org_type?: string | null;
  logo_url?: string | null;
  profile_image_url?: string | null;
};

type SidebarMember = {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
};

const PLACEHOLDER_LOGO =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

function getOrgImageUrl(org: SidebarOrg): string {
  return org.profile_image_url ?? org.logo_url ?? PLACEHOLDER_LOGO;
}

function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-3">
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

function OrgRow({ org }: { org: SidebarOrg }) {
  return (
    <Link
      href={`/org/${org.slug}`}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
          <Image
            src={getOrgImageUrl(org)}
            alt={org.name}
            fill
            className="object-cover"
            sizes="36px"
          />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{org.name}</p>
        {org.org_type && (
          <div className="mt-0.5">
            <UserTypeBadge type={org.org_type} size="xs" />
          </div>
        )}
      </div>
    </Link>
  );
}

type DiscoverItem =
  | { kind: "org"; org: SidebarOrg }
  | { kind: "user"; member: SidebarMember };

export function FeedSidebar() {
  const [connections, setConnections] = useState<SidebarOrg[]>([]);
  const [memberConnections, setMemberConnections] = useState<SidebarMember[]>([]);
  const [savedOrgs, setSavedOrgs] = useState<SidebarOrg[]>([]);
  const [discoverItems, setDiscoverItems] = useState<DiscoverItem[]>([]);
  const [myOrgSlug, setMyOrgSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [meRes, connRes, savedRes, searchRes, peersRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/peers/connections"),
          fetch("/api/donor/saved-organizations"),
          fetch("/api/search?limit=5"),
          fetch("/api/peers/search?limit=8"),
        ]);

        const meData = await meRes.json();
        const mySlug = meData.orgSlug ?? null;
        const myUserId = meData.userId ?? null;
        setMyOrgSlug(mySlug);

        const connData = await connRes.json();
        const savedData = await savedRes.json();
        const searchData = await searchRes.json();
        const peersData = peersRes.ok ? await peersRes.json() : { results: [] };

        const connOrgs: SidebarOrg[] = (connData.connections ?? [])
          .filter(
            (c: { otherOrgSlug: string | null }) => c.otherOrgSlug
          )
          .map(
            (c: {
              otherName: string;
              otherOrgSlug: string;
              otherRole?: string | null;
              otherProfileImageUrl?: string | null;
              otherLogoUrl?: string | null;
            }) => ({
              id: c.otherOrgSlug,
              name: c.otherName,
              slug: c.otherOrgSlug,
              org_type: c.otherRole ?? undefined,
              profile_image_url: c.otherProfileImageUrl ?? undefined,
              logo_url: c.otherLogoUrl ?? undefined,
            })
          );

        // Individual member connections (users, not orgs)
        const connMembers: SidebarMember[] = (connData.connections ?? [])
          .filter(
            (c: { otherType: string; otherOrgSlug: string | null }) =>
              c.otherType === "user" && !c.otherOrgSlug
          )
          .map(
            (c: { otherId: string; otherName: string; otherRole?: string }) => ({
              id: c.otherId,
              name: c.otherName,
              role: c.otherRole ?? "member",
            })
          );
        setMemberConnections(connMembers);

        const saved: SidebarOrg[] = (savedData.organizations ?? []).map(
          (o: {
            id: string;
            name: string;
            slug: string;
            org_type?: string | null;
            logo_url?: string | null;
            profile_image_url?: string | null;
          }) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            org_type: o.org_type ?? undefined,
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

        // Build discover list: mix of orgs and individual users not already connected
        const connectedOrgSlugs = new Set(merged.keys());
        const connectedUserIds = new Set(connMembers.map((m) => m.id));

        const items: DiscoverItem[] = [];

        // Add suggested orgs from /api/search
        const suggestedOrgs = (searchData.organizations ?? [])
          .filter(
            (o: { slug: string }) =>
              !connectedOrgSlugs.has(o.slug) && o.slug !== mySlug
          )
          .slice(0, 3);
        for (const o of suggestedOrgs) {
          items.push({
            kind: "org",
            org: {
              id: o.id,
              name: o.name,
              slug: o.slug,
              org_type: o.org_type ?? undefined,
              profile_image_url: o.profile_image_url,
              logo_url: o.logo_url,
            },
          });
        }

        // Add suggested individual users from /api/peers/search
        const suggestedUsers = (peersData.results ?? [])
          .filter(
            (r: { type: string; id: string }) =>
              r.type === "user" && !connectedUserIds.has(r.id) && r.id !== myUserId
          )
          .slice(0, 3);
        for (const u of suggestedUsers) {
          items.push({
            kind: "user",
            member: {
              id: u.id,
              name: u.name,
              role: u.role ?? "member",
            },
          });
        }

        setDiscoverItems(items);
      } catch {
        setConnections([]);
        setSavedOrgs([]);
        setDiscoverItems([]);
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
  const totalPeers = yourOrgs.length + memberConnections.length;
  const showDiscover = discoverItems.length > 0;

  return (
    <div className="space-y-0">
      {/* Your Network (orgs + members) */}
      <div className="p-4 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" strokeWidth={2} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your Network
          </h3>
          {totalPeers > 0 && (
            <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {totalPeers}
            </span>
          )}
        </div>
        {totalPeers === 0 ? (
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">No connections yet.</p>
            <Link
              href="/dashboard/connections"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Find people <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-0.5">
            {yourOrgs.slice(0, 6).map((org) => (
              <OrgRow key={org.slug} org={org} />
            ))}
            {memberConnections.slice(0, 4).map((member) => (
              <Link
                key={member.id}
                href={`/u/${member.id}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                  <div className="mt-0.5">
                    <UserTypeBadge type={member.role} size="xs" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Discover — mixed orgs + individual users */}
      {showDiscover && (
        <div className="border-t border-slate-100 p-4 pb-3">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={2} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Discover
            </h3>
          </div>
          <div className="space-y-0.5">
            {discoverItems.map((item) =>
              item.kind === "org" ? (
                <OrgRow key={item.org.slug} org={item.org} />
              ) : (
                <Link
                  key={item.member.id}
                  href={`/u/${item.member.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                    {item.member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.member.name}</p>
                    <div className="mt-0.5">
                      <UserTypeBadge type={item.member.role} size="xs" />
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
          <Link
            href="/explore"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Explore all
          </Link>
        </div>
      )}

      {/* Live indicator */}
      <div className="border-t border-slate-100 p-4">
        <p className="text-xs text-slate-500">
          Feed updates in real time.
        </p>
      </div>
    </div>
  );
}
