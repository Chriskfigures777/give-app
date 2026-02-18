import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

type ThreadOut = {
  id: string;
  connectionId: string;
  otherName: string;
  otherOrgSlug: string | null;
  otherLogoUrl: string | null;
  otherProfileImageUrl: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
};

/** GET: List chat threads for the user */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user, profile } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    const { data: connections } = await supabase
      .from("peer_connections")
      .select("id, side_a_id, side_a_type, side_b_id, side_b_type")
      .order("created_at", { ascending: false });

    type Conn = { id: string; side_a_id: string; side_a_type: string; side_b_id: string; side_b_type: string };
    const myConnections = ((connections ?? []) as Conn[]).filter(
      (c) =>
        (c.side_a_type === "user" && c.side_a_id === user.id) ||
        (c.side_b_type === "user" && c.side_b_id === user.id) ||
        (orgId && c.side_a_type === "organization" && c.side_a_id === orgId) ||
        (orgId && c.side_b_type === "organization" && c.side_b_id === orgId)
    );

    const seenOther = new Set<string>();
    const threads: ThreadOut[] = [];
    for (const conn of myConnections) {
      const otherIsA = (conn.side_a_type === "user" && conn.side_a_id !== user.id) || (conn.side_a_type === "organization" && conn.side_a_id !== orgId);
      const otherId = otherIsA ? conn.side_a_id : conn.side_b_id;
      const otherType = otherIsA ? conn.side_a_type : conn.side_b_type;

      if (otherType === "organization" && orgId && otherId === orgId) continue;
      const key = `${otherType}:${otherId}`;
      if (seenOther.has(key)) continue;
      seenOther.add(key);

      const { data: threadData } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("connection_id", conn.id)
        .single();

      const thread = threadData as { id: string } | null;
      if (!thread) continue;

      let otherName = "Unknown";
      let otherOrgSlug: string | null = null;
      let otherLogoUrl: string | null = null;
      let otherProfileImageUrl: string | null = null;
      if (otherType === "organization") {
        const { data: o } = await supabase
          .from("organizations")
          .select("name, slug, logo_url, profile_image_url")
          .eq("id", otherId)
          .single();
        const oRow = o as { name: string; slug: string; logo_url: string | null; profile_image_url: string | null } | null;
        otherName = oRow?.name ?? "Organization";
        otherOrgSlug = oRow?.slug ?? null;
        otherLogoUrl = oRow?.logo_url ?? null;
        otherProfileImageUrl = oRow?.profile_image_url ?? null;
      } else {
        const { data: p } = await supabase.from("user_profiles").select("full_name, email").eq("id", otherId).single();
        const pRow = p as { full_name: string | null; email: string | null } | null;
        otherName = pRow?.full_name || pRow?.email || "User";
      }

      threads.push({
        id: thread.id,
        connectionId: conn.id,
        otherName,
        otherOrgSlug,
        otherLogoUrl,
        otherProfileImageUrl,
        lastMessagePreview: null,
        lastMessageAt: null,
      });
    }

    if (threads.length > 0) {
      const threadIds = threads.map((t) => t.id);
      const { data: lastMessages } = await supabase
        .from("chat_messages")
        .select("thread_id, content, created_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false });

      const latestByThread: Record<string, { content: string; created_at: string }> = {};
      for (const row of lastMessages ?? []) {
        const r = row as { thread_id: string; content: string; created_at: string };
        if (!latestByThread[r.thread_id]) {
          latestByThread[r.thread_id] = { content: r.content, created_at: r.created_at };
        }
      }
      for (const t of threads) {
        const lm = latestByThread[t.id];
        if (lm) {
          t.lastMessagePreview = lm.content.length > 50 ? lm.content.slice(0, 47) + "..." : lm.content;
          t.lastMessageAt = lm.created_at;
        }
      }
    }

    return NextResponse.json({ threads });
  } catch (e) {
    console.error("Chat threads GET error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
