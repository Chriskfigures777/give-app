import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrgPlan, getEffectiveMissionaryLimit } from "@/lib/plan";

/**
 * POST: Organization invites a missionary by email (for people who don't have an account yet).
 * Sends Supabase invite email. When they accept, they sign up and are linked to this org.
 * Body: { email: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId) {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const email = (body.email as string)?.trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check plan limit
    const { plan, planStatus } = await getOrgPlan(orgId, supabase);
    const limit = getEffectiveMissionaryLimit(plan, planStatus);

    if (limit < Infinity) {
      const { count } = await supabase
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("missionary_sponsor_org_id", orgId);

      if ((count ?? 0) >= limit) {
        return NextResponse.json(
          {
            error: `Your plan allows up to ${limit} missionary${limit === 1 ? "" : "ies"}. Upgrade to add more.`,
          },
          { status: 403 }
        );
      }
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        {
          error: "This person already has a Give account. Use \"Add as missionary\" instead to connect them.",
        },
        { status: 400 }
      );
    }

    // Get org slug for redirect
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", orgId)
      .single();

    const orgSlug = (orgRow as { slug: string } | null)?.slug ?? "";

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.DOMAIN ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const redirectTo = appUrl
      ? `${appUrl.replace(/\/$/, "")}/auth/callback?invite_org=${encodeURIComponent(orgSlug)}&next=/dashboard/missionary`
      : undefined;

    const service = createServiceClient();

    const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        invite_org_id: orgId,
        invite_org_slug: orgSlug,
        role: "missionary",
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes("already been invited")) {
        return NextResponse.json(
          { error: "This person has already been invited. They need to check their email and accept the invite." },
          { status: 400 }
        );
      }
      if (error.message?.toLowerCase().includes("already registered")) {
        return NextResponse.json(
          { error: "This person already has a Give account. Use \"Add as missionary\" instead." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Invite sent to ${email}. They'll receive an email to create their account and will be linked to your organization.`,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
