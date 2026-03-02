"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

type ShortcutOrg = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  profile_image_url?: string | null;
};

const PLACEHOLDER_LOGO =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

function getOrgImageUrl(org: ShortcutOrg): string {
  return org.profile_image_url ?? org.logo_url ?? PLACEHOLDER_LOGO;
}

type Props = {
  orgId: string | null;
  isPlatformAdmin: boolean;
};

export function DashboardShortcuts({ orgId, isPlatformAdmin }: Props) {
  const [peers, setPeers] = useState<ShortcutOrg[]>([]);
  const [savedOrgs, setSavedOrgs] = useState<ShortcutOrg[]>([]);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [donationLinksCount, setDonationLinksCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [meRes, connRes, savedRes, donationLinksRes] = await Promise.all([
          fetch("/api/me"),
          orgId ? fetch("/api/peers/connections") : Promise.resolve(null),
          fetch("/api/donor/saved-organizations"),
          orgId && !isPlatformAdmin ? fetch("/api/donation-links") : Promise.resolve(null),
        ]);

        const meData = await meRes.json();
        setOrgSlug(meData.orgSlug ?? null);

        const connData = connRes ? await connRes.json() : { connections: [] };
        const connOrgs: ShortcutOrg[] = (connData.connections ?? [])
          .filter((c: { otherOrgSlug: string | null }) => c.otherOrgSlug)
          .map((c: { otherName: string; otherOrgSlug: string; otherProfileImageUrl?: string | null; otherLogoUrl?: string | null }) => ({
            id: c.otherOrgSlug,
            name: c.otherName,
            slug: c.otherOrgSlug,
            profile_image_url: c.otherProfileImageUrl ?? undefined,
            logo_url: c.otherLogoUrl ?? undefined,
          }));
        setPeers(connOrgs);

        const savedData = await savedRes.json();
        const saved: ShortcutOrg[] = (savedData.organizations ?? []).map(
          (o: { id: string; name: string; slug: string; logo_url?: string | null; profile_image_url?: string | null }) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            profile_image_url: o.profile_image_url,
            logo_url: o.logo_url,
          })
        );
        setSavedOrgs(saved);

        if (donationLinksRes?.ok) {
          const dlData = await donationLinksRes.json();
          const links = dlData.donationLinks ?? [];
          setDonationLinksCount(links.length);
        } else {
          setDonationLinksCount(0);
        }
      } catch {
        setPeers([]);
        setSavedOrgs([]);
        setDonationLinksCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orgId, isPlatformAdmin]);

  const mergedPeers = [...peers];
  for (const o of savedOrgs) {
    if (!mergedPeers.some((p) => p.slug === o.slug)) {
      mergedPeers.push(o);
    }
  }
  const displayPeers = orgSlug ? mergedPeers.filter((p) => p.slug !== orgSlug) : mergedPeers;
  const hasShortcuts = displayPeers.length > 0 || (orgSlug && donationLinksCount > 0);

  if (loading || !hasShortcuts) return null;

  return (
    <div className="mb-6 last:mb-0">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="mb-2 flex w-full items-center gap-2 px-4 py-1.5 text-left"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-dashboard-text-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-dashboard-text-muted" />
        )}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted">
          Shortcuts
        </p>
      </button>
      {isOpen && (
        <ul className="flex flex-col gap-1">
          {orgSlug && donationLinksCount > 0 && (
            <li className="shrink-0">
              <Link
                href={`/give/${orgSlug}`}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-dashboard-text-muted transition-all duration-200 hover:bg-dashboard-card-hover/50 hover:text-dashboard-text"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>Your give page</span>
              </Link>
            </li>
          )}
          {displayPeers.slice(0, 6).map((org) => (
            <li key={org.slug} className="shrink-0">
              <Link
                href={`/org/${org.slug}`}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 hover:bg-dashboard-card-hover/50"
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-dashboard-card-hover">
                  <Image
                    src={getOrgImageUrl(org)}
                    alt={org.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
                <span className="truncate text-sm font-medium text-dashboard-text-muted hover:text-dashboard-text">
                  {org.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
