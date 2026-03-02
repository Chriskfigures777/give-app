import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

const BUCKET = "org-assets";
const COMMUNITY_ORG_ID = "00000000-0000-0000-0000-000000000001";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const organizationId = (formData.get("organizationId") as string) || orgId || COMMUNITY_ORG_ID;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    // Community org: any authenticated user can upload
    const isCommunityOrg = organizationId === COMMUNITY_ORG_ID;
    if (!isCommunityOrg && profile?.role !== "platform_admin") {
      const { data: org } = await supabase
        .from("organizations")
        .select("owner_user_id")
        .eq("id", organizationId)
        .single();
      const { data: admin } = await supabase
        .from("organization_admins")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", user.id)
        .maybeSingle();
      const { data: savedCheck } = await supabase
        .from("donor_saved_organizations")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      const isOwner = (org as { owner_user_id?: string } | null)?.owner_user_id === user.id;
      if (!isOwner && !admin && !savedCheck) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ct = file.type || "image/jpeg";
    const isImage = ALLOWED_IMAGE_TYPES.includes(ct);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(ct);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP, GIF for images or MP4, WebM for videos." },
        { status: 400 }
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isImage
            ? "Image too large. Maximum 10MB."
            : "Video too large. Maximum 50MB.",
        },
        { status: 400 }
      );
    }

    const ext = ct.split("/")[1] || (isImage ? "jpg" : "mp4");
    const id = randomUUID();
    const path = `${organizationId}/feed-media/${id}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: ct,
      upsert: true,
    });

    if (error) {
      console.error("feed-media upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("feed-media upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
