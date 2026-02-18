import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

async function canAccessOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from("organizations")
    .select("owner_user_id")
    .eq("id", orgId)
    .single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase
    .from("organization_admins")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!admin;
}

/** POST: Publish or unpublish a website builder project */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const body = await req.json();
    const { organizationId, projectId, unpublish } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (profile?.role !== "platform_admin" && organizationId !== orgId) {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (unpublish) {
      const { error } = await supabase
        .from("organizations")
        .update({ published_website_project_id: null })
        .eq("id", organizationId);

      if (error) {
        console.error("organization-website unpublish error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, published: false });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId required when publishing" }, { status: 400 });
    }

    const { data: project } = await supabase
      .from("website_builder_projects")
      .select("id, organization_id")
      .eq("id", projectId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("organizations")
      .update({ published_website_project_id: projectId })
      .eq("id", organizationId);

    if (error) {
      console.error("organization-website publish error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, published: true, projectId });
  } catch (e) {
    console.error("organization-website publish error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
