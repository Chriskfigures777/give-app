import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { ConnectCardForm } from "@/app/connect/[orgId]/connect-card-form";
import type { ConnectCardSettings } from "@/app/dashboard/connect-card/page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ orgId: string; orgSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { orgId } = await params;
  const supabase = createServiceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();

  const name = (org as { name?: string } | null)?.name ?? "Connect";
  return {
    title: `Connect Card — ${name}`,
    description: `Fill out a Connect Card for ${name} to get connected with the community.`,
  };
}

export default async function ConnectCardPage({ params }: Props) {
  const { orgId } = await params;
  const supabase = createServiceClient();

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, slug, description, logo_url, profile_image_url, city, state, connect_card_settings")
    .eq("id", orgId)
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
