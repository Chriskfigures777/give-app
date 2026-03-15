import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { ConnectCardClient } from "./connect-card-client";
import { env } from "@/env";

export const dynamic = "force-dynamic";

export default async function ConnectCardPage() {
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, slug, name, connect_card_settings")
    .eq("id", orgId)
    .maybeSingle();

  const org = orgRow as { id?: string; slug?: string; name?: string; connect_card_settings?: unknown } | null;
  const orgDbId = org?.id ?? "";
  const orgSlug = org?.slug ?? "";
  const orgName = org?.name ?? "";

  // Load submissions server-side (initial load)
  const { data } = await supabase
    .from("website_form_inquiries")
    .select("id, visitor_name, visitor_email, visitor_phone, fields, created_at")
    .eq("organization_id", orgId)
    .eq("form_kind", "connect_card")
    .order("created_at", { ascending: false });

  const baseUrl = env.app.domain().replace(/\/$/, "") || "";

  return (
    <ConnectCardClient
      orgSlug={orgSlug}
      orgId={orgDbId}
      orgName={orgName}
      baseUrl={baseUrl}
      initialSubmissions={(data ?? []) as Submission[]}
      initialSettings={(org?.connect_card_settings as ConnectCardSettings | null) ?? null}
    />
  );
}

export type Submission = {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  fields: Record<string, string>;
  created_at: string;
};

export type MinistryOption = {
  value: string;
  label: string;
  icon: string;
};

export type ConnectCardSettings = {
  primary_color?: string;
  accent_color?: string;
  welcome_headline?: string;
  welcome_subtext?: string;
  bg_image_url?: string;
  hidden_fields?: string[];
  ministry_options?: MinistryOption[];
};
