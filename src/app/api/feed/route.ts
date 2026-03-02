import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export type FeedItemType =
  | "donation"
  | "goal_progress"
  | "new_org"
  | "connection_request"
  | "post"
  | "share";

export type FeedItemResponse = {
  id: string;
  item_type: FeedItemType;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  organization_profile_image_url?: string | null;
  organization_logo_url?: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  support_count?: number;
  comment_count?: number;
  user_supported?: boolean;
  author_id?: string | null;
  is_author?: boolean;
};

export async function GET(req: NextRequest) {
  try {
    const { supabase, user, profile } = await requireAuth();

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20, 50);
    const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10) || 0;

    const COMMUNITY_ORG_ID = "00000000-0000-0000-0000-000000000001";
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const visibleOrgIds = new Set<string>();

    // Community org — everyone sees Community posts
    visibleOrgIds.add(COMMUNITY_ORG_ID);

    // User's own org(s) — so they see their posts and org activity
    if (orgId) visibleOrgIds.add(orgId);

    // Saved orgs (donor_saved_organizations)
    const { data: savedRows } = await supabase
      .from("donor_saved_organizations")
      .select("organization_id")
      .eq("user_id", user.id);
    for (const row of savedRows ?? []) {
      visibleOrgIds.add((row as { organization_id: string }).organization_id);
    }

    // Connected orgs (peer_connections)
    const { data: allConnections } = await supabase
      .from("peer_connections")
      .select("side_a_id, side_a_type, side_b_id, side_b_type");

    type Conn = { side_a_id: string; side_a_type: string; side_b_id: string; side_b_type: string };
    for (const c of (allConnections ?? []) as Conn[]) {
      const userOrOrgInvolved =
        (c.side_a_type === "user" && c.side_a_id === user.id) ||
        (c.side_b_type === "user" && c.side_b_id === user.id) ||
        (c.side_a_type === "organization" && c.side_a_id === orgId) ||
        (c.side_b_type === "organization" && c.side_b_id === orgId);
      if (userOrOrgInvolved) {
        const otherOrgId = c.side_a_type === "organization" ? c.side_a_id : c.side_b_type === "organization" ? c.side_b_id : null;
        if (otherOrgId && otherOrgId !== orgId) visibleOrgIds.add(otherOrgId);
      }
    }

    if (visibleOrgIds.size === 0) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    const orgIds = Array.from(visibleOrgIds);

    const { data: items, error } = await supabase
      .from("feed_items")
      .select("id, item_type, organization_id, author_id, payload, created_at")
      .in("organization_id", orgIds)
      .neq("item_type", "connection_request")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Feed API error:", error);
      return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
    }

    const itemRows = (items ?? []) as { id: string; item_type: string; organization_id: string; author_id: string | null; payload: Record<string, unknown>; created_at: string }[];
    const itemIds = itemRows.map((i) => i.id);

    const orgIdsInItems = [...new Set(itemRows.map((i) => i.organization_id))];
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, slug, profile_image_url, logo_url")
      .in("id", orgIdsInItems);

    type OrgRow = { id: string; name: string; slug: string; profile_image_url: string | null; logo_url: string | null };
    const orgMap = new Map(
      (orgs ?? []).map((o) => [(o as OrgRow).id, o as OrgRow])
    );

    let reactionCounts = new Map<string, number>();
    let userReactions = new Set<string>();
    let commentCounts = new Map<string, number>();

    if (itemIds.length > 0) {
      const { data: reactions } = await supabase
        .from("feed_item_reactions")
        .select("feed_item_id, user_id")
        .in("feed_item_id", itemIds);
      for (const r of reactions ?? []) {
        const row = r as { feed_item_id: string; user_id: string };
        reactionCounts.set(row.feed_item_id, (reactionCounts.get(row.feed_item_id) ?? 0) + 1);
        if (row.user_id === user.id) userReactions.add(row.feed_item_id);
      }

      const { data: commentAgg } = await supabase
        .from("feed_item_comments")
        .select("feed_item_id")
        .in("feed_item_id", itemIds);
      for (const c of commentAgg ?? []) {
        const row = c as { feed_item_id: string };
        commentCounts.set(row.feed_item_id, (commentCounts.get(row.feed_item_id) ?? 0) + 1);
      }
    }

    const enriched: FeedItemResponse[] = itemRows.map((item) => {
      const org = orgMap.get(item.organization_id);
      const supports = reactionCounts.get(item.id) ?? 0;
      const comments = commentCounts.get(item.id) ?? 0;
      const isAuthor = item.author_id === user.id;
      return {
        id: item.id,
        item_type: item.item_type as FeedItemType,
        organization_id: item.organization_id,
        organization_name: org?.name ?? "Organization",
        organization_slug: org?.slug ?? "",
        organization_profile_image_url: org?.profile_image_url ?? null,
        organization_logo_url: org?.logo_url ?? null,
        payload: item.payload ?? {},
        created_at: item.created_at,
        support_count: supports,
        comment_count: comments,
        user_supported: userReactions.has(item.id),
        author_id: item.author_id,
        is_author: isAuthor,
      };
    });

    // Algorithm-based ranking (not chronological): score = recency_decay * (1 + supports + 2*comments + 3*shares)
    // Recency decay: ~24h half-life so newer posts rank higher; engagement boosts popular content
    // Shares count: query feed_items for shares referencing our items
    const shareCounts = new Map<string, number>();
    const { data: shareRows } = await supabase
      .from("feed_items")
      .select("payload")
      .eq("item_type", "share")
      .in("organization_id", orgIds);
    for (const s of shareRows ?? []) {
      const origId = (s.payload as Record<string, unknown>)?.original_feed_item_id as string | null;
      if (origId && itemIds.includes(origId)) {
        shareCounts.set(origId, (shareCounts.get(origId) ?? 0) + 1);
      }
    }

    const LAMBDA = 0.03; // ~24h half-life for recency decay
    const now = Date.now();
    const scored = enriched.map((item) => {
      const created = new Date(item.created_at).getTime();
      const hoursAgo = (now - created) / 3600000;
      const recencyDecay = Math.exp(-LAMBDA * hoursAgo);
      const supports = item.support_count ?? 0;
      const comments = item.comment_count ?? 0;
      const shares = shareCounts.get(item.id) ?? 0;
      const score = recencyDecay * (1 + supports + 2 * comments + 3 * shares);
      return { ...item, _score: score };
    });

    scored.sort((a, b) => (b as { _score: number })._score - (a as { _score: number })._score);

    const sorted = scored.map(({ _score: _, ...rest }) => rest);

    const hasMore = (items?.length ?? 0) === limit;

    return NextResponse.json({ items: sorted, hasMore });
  } catch (e) {
    console.error("Feed API error:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
