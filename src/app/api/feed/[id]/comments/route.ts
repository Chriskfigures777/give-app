import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id: feedItemId } = await params;

    if (!feedItemId) {
      return NextResponse.json({ error: "Feed item ID required" }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from("feed_item_comments")
      .select("id, content, created_at, user_id, organization_id")
      .eq("feed_item_id", feedItemId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    const rows = (comments ?? []) as { id: string; content: string; created_at: string; user_id: string; organization_id: string | null }[];
    const userIds = [...new Set(rows.map((c) => c.user_id))];
    const orgIds = [...new Set(rows.map((c) => c.organization_id).filter(Boolean))] as string[];

    let profileMap = new Map<string, string>();
    let orgMap = new Map<string, { name: string; slug: string }>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, full_name")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        const row = p as { id: string; full_name: string | null };
        profileMap.set(row.id, row.full_name ?? "Anonymous");
      }
    }

    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .in("id", orgIds);
      for (const o of orgs ?? []) {
        const row = o as { id: string; name: string; slug: string };
        orgMap.set(row.id, { name: row.name, slug: row.slug });
      }
    }

    const flattened = rows.map((c) => {
      const org = c.organization_id ? orgMap.get(c.organization_id) : null;
      return {
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        organization_id: c.organization_id,
        author_name: org?.name ?? profileMap.get(c.user_id) ?? "Anonymous",
        author_slug: org?.slug ?? null,
      };
    });

    return NextResponse.json({ comments: flattened });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile } = await requireAuth();
    const { id: feedItemId } = await params;

    if (!feedItemId) {
      return NextResponse.json({ error: "Feed item ID required" }, { status: 400 });
    }

    const body = await req.json();
    const content = (body?.content ?? "").trim();

    if (!content || content.length > 2000) {
      return NextResponse.json(
        { error: "Comment must be 1-2000 characters" },
        { status: 400 }
      );
    }

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id ?? null;

    const { data: comment, error } = await supabase
      .from("feed_item_comments")
      .insert({
        feed_item_id: feedItemId,
        user_id: user.id,
        organization_id: orgId,
        content,
      })
      .select("id, content, created_at, user_id, organization_id")
      .single();

    if (error) {
      console.error("Comment insert error:", error);
      return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
