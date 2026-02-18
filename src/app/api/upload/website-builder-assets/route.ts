import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

const BUCKET = "org-assets";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

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

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId && profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Organization required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile?.role !== "platform_admin" && orgId) {
      const canAccess = await canAccessOrg(supabase, user.id, orgId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const organizationId = (formData.get("organizationId") as string) || orgId;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    if (profile?.role !== "platform_admin" && organizationId !== orgId) {
      const canAccess = await canAccessOrg(supabase, user.id, organizationId);
      if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const files = formData.getAll("files") as File[];
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results: { src: string }[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const ct = file.type || "image/jpeg";
      const isImage = ALLOWED_IMAGE_TYPES.includes(ct);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(ct);

      if (!isImage && !isVideo) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Use JPEG, PNG, WebP, GIF, SVG for images or MP4, WebM for videos.` },
          { status: 400 }
        );
      }

      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} too large. Max ${isImage ? "10MB" : "50MB"}.` },
          { status: 400 }
        );
      }

      const ext = ct.split("/")[1] || (isImage ? "jpg" : "mp4");
      const id = randomUUID();
      const path = `${organizationId}/website-builder/${id}.${ext}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: ct,
        upsert: true,
      });

      if (error) {
        console.error("website-builder-assets upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);
      results.push({ src: publicUrl });
    }

    return NextResponse.json(results);
  } catch (e) {
    console.error("website-builder-assets upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
