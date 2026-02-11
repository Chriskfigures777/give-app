import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  createConnectAccount,
  attachConnectAccountToOrganization,
  createAccountSessionForOnboarding,
} from "@/lib/stripe/connect";

/**
 * Per-org mutex to prevent duplicate Connect account creation when Connect.js
 * calls fetchClientSecret multiple times (React Strict Mode, re-renders, etc.).
 */
const orgCreationLocks = new Map<string, Promise<unknown>>();

async function withOrgLock<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
  const prior = orgCreationLocks.get(orgId);
  const ourWork = prior ? prior.then(() => fn()) : fn();
  orgCreationLocks.set(orgId, ourWork);
  try {
    return await ourWork;
  } finally {
    if (orgCreationLocks.get(orgId) === ourWork) orgCreationLocks.delete(orgId);
  }
}

/**
 * Create an Account Session for embedded Connect onboarding (organization verification).
 * Call this from the client when loading the embedded onboarding page.
 * Body: { organizationId?: string } — optional; defaults to user's org from profile.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { organizationId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // no body is ok; we'll use profile org
    }

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("role, organization_id, preferred_organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileRow as
      | { role: string; organization_id: string | null; preferred_organization_id: string | null }
      | null;
    const orgId =
      body.organizationId ??
      profile?.organization_id ??
      profile?.preferred_organization_id;

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected. Add or select an organization first." },
        { status: 400 }
      );
    }

    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, stripe_connect_account_id, owner_user_id")
      .eq("id", orgId)
      .single();

    const org = orgRow as {
      id: string;
      name: string;
      stripe_connect_account_id: string | null;
      owner_user_id: string | null;
    } | null;

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const isPlatformAdmin = profile?.role === "platform_admin";
    const isOwner = org.owner_user_id === user.id;
    const { data: adminRow } = await supabase
      .from("organization_admins")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isPlatformAdmin && !isOwner && !adminRow) {
      return NextResponse.json(
        { error: "You don't have permission to manage this organization" },
        { status: 403 }
      );
    }

    let stripeAccountId = org.stripe_connect_account_id;

    if (!stripeAccountId) {
      stripeAccountId = await withOrgLock(orgId, async () => {
        const serviceSupabase = createServiceClient();
        const { data: orgRow2 } = await serviceSupabase
          .from("organizations")
          .select("stripe_connect_account_id")
          .eq("id", orgId)
          .single();
        const existing = (orgRow2 as { stripe_connect_account_id: string | null } | null)
          ?.stripe_connect_account_id;
        if (existing) return existing;

        const { accountId } = await createConnectAccount({
          email: user.email ?? "noreply@example.com",
          organizationId: org.id,
          organizationName: org.name || "Organization",
        });
        await attachConnectAccountToOrganization(serviceSupabase, org.id, accountId);
        return accountId;
      });
    }

    const { clientSecret } = await createAccountSessionForOnboarding(stripeAccountId);

    return NextResponse.json({ client_secret: clientSecret });
  } catch (e) {
    console.error("connect/account-session error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create session" },
      { status: 500 }
    );
  }
}
