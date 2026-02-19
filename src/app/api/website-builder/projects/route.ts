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

/** List all website builder projects for an organization */
export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const organizationId = req.nextUrl.searchParams.get("organizationId");

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

    const { data, error } = await supabase
      .from("website_builder_projects")
      .select("id, name, project, created_at, updated_at, created_by")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("website-builder projects list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const projects = (data ?? []).map((p) => ({
      id: p.id,
      name: p.name ?? "Untitled",
      project: p.project,
      created_at: p.created_at,
      updated_at: p.updated_at,
      created_by: (p as { created_by?: string | null }).created_by ?? null,
    }));

    return NextResponse.json({ projects });
  } catch (e) {
    console.error("website-builder projects list error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
