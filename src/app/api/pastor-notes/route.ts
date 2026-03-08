import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { getAuthForApi } = await import("@/lib/auth");
    const auth = await getAuthForApi();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profile, supabase } = auth;
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("pastor_notes")
      .select("id, title, content, created_at, updated_at, author_user_id")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("pastor-notes GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("pastor-notes GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { getAuthForApi } = await import("@/lib/auth");
    const auth = await getAuthForApi();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profile, supabase, user } = auth;
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    let body: { title?: string; content?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content : "";

    const { data, error } = await supabase
      .from("pastor_notes")
      .insert({
        organization_id: orgId,
        author_user_id: user.id,
        title: title || "Untitled",
        content: content ?? "",
      })
      .select("id, title, content, created_at, updated_at")
      .single();

    if (error) {
      console.error("pastor-notes POST:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("pastor-notes POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create note" },
      { status: 500 }
    );
  }
}
