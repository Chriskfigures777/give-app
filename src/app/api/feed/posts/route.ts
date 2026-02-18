import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { supabase, user, profile } = await requireAuth();

    const body = await req.json();
    const content = (body?.content ?? "").trim();
    const mediaUrl = (body?.media_url ?? "").trim() || null;
    const mediaType = (body?.media_type ?? "") as "image" | "video" | "link" | "";
    const linkUrl = (body?.link_url ?? "").trim() || null;
    const linkTitle = (body?.link_title ?? "").trim() || null;
    const linkDescription = (body?.link_description ?? "").trim() || null;
    const linkThumbnailUrl = (body?.link_thumbnail_url ?? "").trim() || null;
    const organizationId = body?.organization_id ?? profile?.organization_id ?? profile?.preferred_organization_id;

    if (!content || content.length > 5000) {
      return NextResponse.json(
        { error: "Post content must be 1-5000 characters" },
        { status: 400 }
      );
    }

    const validMediaTypes = ["image", "video", "link"];
    if (mediaType && !validMediaTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: "Invalid media_type. Use image, video, or link." },
        { status: 400 }
      );
    }

    const COMMUNITY_ORG_ID = "00000000-0000-0000-0000-000000000001";

    // Fallback: use first saved org, then Community org for any authenticated user
    let resolvedOrgId = organizationId;
    if (!resolvedOrgId) {
      const { data: savedRow } = await supabase
        .from("donor_saved_organizations")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      resolvedOrgId = (savedRow as { organization_id: string } | null)?.organization_id ?? null;
    }
    if (!resolvedOrgId) {
      resolvedOrgId = COMMUNITY_ORG_ID;
    }

    // Verify user has access to this org (is member or admin)
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, owner_user_id, name, slug")
      .eq("id", resolvedOrgId)
      .single();

    if (!orgRow) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const org = orgRow as { id: string; owner_user_id: string | null; name: string; slug: string };
    const isOwner = org.owner_user_id === user.id;

    // Check organization_admins
    const { data: adminRow } = await supabase
      .from("organization_admins")
      .select("id")
      .eq("organization_id", resolvedOrgId)
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = !!adminRow;

    // Donors can post if preferred_organization_id matches or org is in saved_organizations
    const isDonorWithPreferred = profile?.preferred_organization_id === resolvedOrgId;
    const { data: savedCheck } = await supabase
      .from("donor_saved_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", resolvedOrgId)
      .maybeSingle();
    const isDonorWithSaved = !!savedCheck;
    const isCommunityOrg = resolvedOrgId === COMMUNITY_ORG_ID;

    if (!isCommunityOrg && !isOwner && !isAdmin && !isDonorWithPreferred && !isDonorWithSaved) {
      return NextResponse.json(
        { error: "You do not have permission to post for this organization" },
        { status: 403 }
      );
    }

    const { data: post, error } = await supabase
      .from("feed_items")
      .insert({
        item_type: "post",
        organization_id: resolvedOrgId,
        author_id: user.id,
        author_type: isOwner || isAdmin ? "organization" : "user",
        payload: {
          content,
          ...(mediaUrl && { media_url: mediaUrl }),
          ...(mediaType && { media_type: mediaType }),
          ...(linkUrl && { link_url: linkUrl }),
          ...(linkTitle && { link_title: linkTitle }),
          ...(linkDescription && { link_description: linkDescription }),
          ...(linkThumbnailUrl && { link_thumbnail_url: linkThumbnailUrl }),
          author_name: profile?.full_name ?? "Anonymous",
          organization_name: org.name,
          organization_slug: org.slug,
        },
      })
      .select("id, item_type, organization_id, payload, created_at")
      .single();

    if (error) {
      console.error("Post insert error:", error);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
