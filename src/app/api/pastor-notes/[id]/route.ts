import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getAuthForApi } = await import("@/lib/auth");
    const auth = await getAuthForApi();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profile, supabase } = auth;
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { id } = await params;
    const { data, error } = await supabase
      .from("pastor_notes")
      .select("id, title, content, created_at, updated_at, author_user_id")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("pastor-notes GET [id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch note" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getAuthForApi } = await import("@/lib/auth");
    const auth = await getAuthForApi();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profile, supabase } = auth;
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { id } = await params;
    let body: { title?: string; content?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const updates: { title?: string; content?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body.title === "string") updates.title = body.title.trim() || "Untitled";
    if (typeof body.content === "string") updates.content = body.content;

    const { data, error } = await supabase
      .from("pastor_notes")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("id, title, content, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("pastor-notes PATCH [id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getAuthForApi } = await import("@/lib/auth");
    const auth = await getAuthForApi();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profile, supabase } = auth;
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { id } = await params;
    const { error } = await supabase
      .from("pastor_notes")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("pastor-notes DELETE [id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete note" },
      { status: 500 }
    );
  }
}
