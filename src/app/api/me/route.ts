import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** GET: Current user profile for client-side use (org-to-org chat, etc.) */
export async function GET(req: NextRequest) {
  try {
    const { user, profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    const includeCounts = req.nextUrl.searchParams.get("counts") === "1";

    let isOrgOwner = false;
    let orgSlug: string | null = null;
    let orgLogoUrl: string | null = null;

    const [orgResult, notifResult, peerResult] = await Promise.all([
      orgId
        ? supabase
            .from("organizations")
            .select("owner_user_id, slug, logo_url, profile_image_url")
            .eq("id", orgId)
            .single()
        : Promise.resolve({ data: null }),
      includeCounts
        ? supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .neq("type", "connection_request")
            .is("read_at", null)
        : Promise.resolve({ count: 0 }),
      includeCounts && orgId
        ? supabase
            .from("peer_requests")
            .select("id", { count: "exact", head: true })
            .eq("recipient_id", orgId)
            .eq("recipient_type", "organization")
            .eq("status", "pending")
        : Promise.resolve({ count: 0 }),
    ]);

    const org = orgResult.data as { owner_user_id: string; slug?: string; logo_url?: string | null; profile_image_url?: string | null } | null;
    if (org) {
      isOrgOwner = org.owner_user_id === user.id;
      orgSlug = org.slug ?? null;
      orgLogoUrl = org.profile_image_url ?? org.logo_url ?? null;
    }

    const avatarUrl = (user.user_metadata?.avatar_url as string) ?? (user.user_metadata?.picture as string) ?? null;

    const body: Record<string, unknown> = {
      userId: user.id,
      orgId: orgId ?? null,
      orgSlug,
      isOrgOwner,
      avatarUrl,
      orgLogoUrl,
    };
    if (includeCounts) {
      body.unreadNotificationsCount = (notifResult as { count?: number }).count ?? 0;
      body.pendingConnectionRequestsCount = (peerResult as { count?: number }).count ?? 0;
    }

    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
