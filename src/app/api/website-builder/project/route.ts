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

function getProjectName(project: unknown): string {
  try {
    const p = project as { pages?: Array<{ name?: string }> };
    const pages = p?.pages ?? (p as { default?: { pages?: Array<{ name?: string }> } })?.default?.pages;
    const first = Array.isArray(pages) ? pages[0] : null;
    return (first?.name as string) ?? "Untitled";
  } catch {
    return "Untitled";
  }
}

/** Get single project by id */
export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const organizationId = req.nextUrl.searchParams.get("organizationId");
    const projectId = req.nextUrl.searchParams.get("id");

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

    if (!projectId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("website_builder_projects")
      .select("id, name, project, created_at, updated_at")
      .eq("id", projectId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      console.error("website-builder project GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name ?? "Untitled",
      project: data.project,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  } catch (e) {
    console.error("website-builder project GET error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}

/** Create or update project */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const body = await req.json();
    const { organizationId, project, id: projectId, name, previewHtml } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    if (project === undefined) {
      return NextResponse.json({ error: "project required" }, { status: 400 });
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

    const projectJson = typeof project === "string" ? JSON.parse(project) : project;
    const projectName = name ?? getProjectName(projectJson);
    if (typeof previewHtml === "string" && previewHtml.length > 0) {
      (projectJson as Record<string, unknown>).previewHtml = previewHtml;
    }

    if (projectId) {
      const { data, error } = await supabase
        .from("website_builder_projects")
        .update({
          project: projectJson,
          name: projectName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .eq("organization_id", organizationId)
        .select("id, name, created_at, updated_at")
        .single();

      if (error) {
        console.error("website-builder project POST (update) error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, id: data.id, name: data.name });
    }

    const { data, error } = await supabase
      .from("website_builder_projects")
      .insert({
        organization_id: organizationId,
        project: projectJson,
        name: projectName,
      })
      .select("id, name, created_at, updated_at")
      .single();

    if (error) {
      console.error("website-builder project POST (create) error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id, name: data.name });
  } catch (e) {
    console.error("website-builder project POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}

/** Delete project by id */
export async function DELETE(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const projectId = req.nextUrl.searchParams.get("id");
    const organizationId = req.nextUrl.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
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

    const { error } = await supabase
      .from("website_builder_projects")
      .delete()
      .eq("id", projectId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("website-builder project DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("website-builder project DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
