import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { ConnectCardForm } from "./connect-card-form";
import type { ConnectCardSettings } from "@/app/dashboard/connect-card/page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ orgId: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props) {
  const { orgId } = await params;
  const supabase = createServiceClient();

  const isUuid = UUID_RE.test(orgId);
  const { data: org } = isUuid
    ? await supabase.from("organizations").select("name").eq("id", orgId).maybeSingle()
    : await supabase.from("organizations").select("name").eq("slug", orgId).maybeSingle();

  const name = (org as { name?: string } | null)?.name ?? "Connect";
  return {
    title: `Connect Card — ${name}`,
    description: `Fill out a Connect Card for ${name} to get connected with the community.`,
  };
}

/**
 * Handles two cases in one route segment:
 *
 * 1. /connect/[uuid]          — legacy short link: looks up by ID and renders the form directly
 * 2. /connect/[slug]          — legacy slug link: redirects to /connect/[id]/[slug]
 *
 * The canonical URL is /connect/[orgId]/[orgSlug] (handled by the nested page).
 */
export default async function ConnectCardTopPage({ params }: Props) {
  const { orgId: segment } = await params;
  const supabase = createServiceClient();

  const isUuid = UUID_RE.test(segment);

  const { data: orgRow } = isUuid
    ? await supabase
        .from("organizations")
        .select("id, name, slug, description, logo_url, profile_image_url, city, state, connect_card_settings")
        .eq("id", segment)
        .maybeSingle()
    : await supabase
        .from("organizations")
        .select("id, name, slug, description, logo_url, profile_image_url, city, state, connect_card_settings")
        .eq("slug", segment)
        .maybeSingle();

  if (!orgRow) notFound();

  const org = orgRow as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    profile_image_url: string | null;
    city: string | null;
    state: string | null;
    connect_card_settings: ConnectCardSettings | null;
  };

  // If reached via slug, redirect to canonical URL
  if (!isUuid) {
    redirect(`/connect/${org.id}/${org.slug}`);
  }

  // UUID hit — render the form directly (no extra slug segment in URL)
  return (
    <ConnectCardForm
      orgSlug={org.slug}
      orgId={org.id}
      orgName={org.name}
      orgDescription={org.description}
      orgLogo={org.logo_url ?? org.profile_image_url}
      orgCity={org.city}
      orgState={org.state}
      settings={org.connect_card_settings}
    />
  );
}
