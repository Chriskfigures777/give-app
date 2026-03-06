"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { UserTypeBadge } from "@/components/user-type-badge";

// Light palette — matches the light feed right panel
const SB = {
  card:      "#ffffff",
  cardHover: "rgba(0,0,0,0.04)",
  border:    "rgba(0,0,0,0.08)",
  text:      "#111827",
  textMuted: "#4b5563",
  textDim:   "#9ca3af",
  accent:    "#059669",
  accentDim: "rgba(5,150,105,0.09)",
  inputBg:   "#f3f4f6",
} as const;

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
        <div className="ft-skeleton h-4 w-24 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="ft-skeleton h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="ft-skeleton h-3.5 w-3/4 rounded" />
              <div className="ft-skeleton h-2.5 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrgRow({ org }: { org: SidebarOrg }) {
  return (
    <Link
      href={`/org/${org.slug}`}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors"
      style={{ color: SB.text }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full" style={{ background: SB.cardHover }}>
        <Image
          src={getOrgImageUrl(org)}
          alt={org.name}
          fill
          className="object-cover"
          sizes="36px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: SB.text }}>{org.name}</p>
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
          fetch("/api/peers/search?limit=20"),
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

        const connectedOrgSlugs = new Set(merged.keys());
        const connectedUserIds = new Set(connMembers.map((m) => m.id));

        const items: DiscoverItem[] = [];

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

        const suggestedUsers = (peersData.results ?? [])
          .filter(
            (r: { type: string; id: string }) =>
              r.type === "user" && !connectedUserIds.has(r.id) && r.id !== myUserId
          )
          .slice(0, 4);
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
      {/* Your Network */}
      <div className="p-4 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" style={{ color: SB.accent }} strokeWidth={2} />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: SB.textMuted }}>
            Your Network
          </h3>
          {totalPeers > 0 && (
            <span
              className="ml-auto rounded px-2 py-0.5 text-[11px] font-medium"
              style={{ background: "rgba(255,255,255,0.08)", color: SB.textMuted }}
            >
              {totalPeers}
            </span>
          )}
        </div>
        {totalPeers === 0 ? (
          <div className="rounded-lg p-3 text-center" style={{ background: SB.inputBg }}>
            <p className="text-sm" style={{ color: SB.textMuted }}>No connections yet.</p>
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
                className="flex items-center gap-3 rounded-lg p-2 transition-colors"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: SB.accentDim, color: SB.accent }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: SB.text }}>{member.name}</p>
                  <div className="mt-0.5">
                    <UserTypeBadge type={member.role} size="xs" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Link
          href="/community"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors"
          style={{ background: SB.accentDim, color: SB.accent }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = SB.accentDim; }}
        >
          <Users className="h-3.5 w-3.5" />
          Find &amp; connect with people
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Discover */}
      {showDiscover && (
        <div className="p-4 pb-3" style={{ borderTop: `1px solid ${SB.border}` }}>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0" style={{ color: SB.accent }} strokeWidth={2} />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: SB.textMuted }}>
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
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.cardHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: SB.accentDim, color: SB.accent }}
                  >
                    {item.member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: SB.text }}>{item.member.name}</p>
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
            className="mt-4 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors"
            style={{ background: SB.accentDim, color: SB.accent }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.18)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--feed-badge-bg)"; }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Explore all
          </Link>
        </div>
      )}

      {/* Live indicator */}
      <div className="flex items-center gap-2 p-4" style={{ borderTop: `1px solid ${SB.border}` }}>
        <span className="h-1.5 w-1.5 rounded-full ft-live-dot" style={{ background: SB.accent }} />
        <p className="text-[11px] font-medium" style={{ color: SB.textMuted }}>
          Feed updates in real time
        </p>
      </div>
    </div>
  );
}
