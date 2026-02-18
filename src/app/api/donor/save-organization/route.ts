import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Save an organization to the donor's profile for quick re-giving.
 * POST body: { organizationId?: string; slug?: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { organizationId, slug } = body as { organizationId?: string; slug?: string };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let orgId: string | null = organizationId ?? null;
    if (!orgId && slug) {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single();
      orgId = (orgRow as { id: string } | null)?.id ?? null;
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID or slug required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("donor_saved_organizations").upsert(
      { user_id: user.id, organization_id: orgId },
      { onConflict: "user_id,organization_id" }
    );

    if (error) {
      console.error("Save organization error:", error);
      return NextResponse.json(
        { error: "Failed to save organization" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Save organization error:", e);
    return NextResponse.json(
      { error: "Failed to save organization" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Unsave an organization.
 * Query: ?organizationId=xxx or ?slug=xxx
 */
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    let orgId: string | null = url.searchParams.get("organizationId");
    const slug = url.searchParams.get("slug");
    if (!orgId && slug) {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single();
      orgId = (orgRow as { id: string } | null)?.id ?? null;
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID or slug required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("donor_saved_organizations")
      .delete()
      .eq("user_id", user.id)
      .eq("organization_id", orgId);

    if (error) {
      console.error("Unsave organization error:", error);
      return NextResponse.json(
        { error: "Failed to unsave organization" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Unsave organization error:", e);
    return NextResponse.json(
      { error: "Failed to unsave organization" },
      { status: 500 }
    );
  }
}
