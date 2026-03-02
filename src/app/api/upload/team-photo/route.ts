import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

const BUCKET = "org-assets";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
      const { data: org } = await supabase
        .from("organizations")
        .select("owner_user_id")
        .eq("id", orgId)
        .single();
      const { data: admin } = await supabase
        .from("organization_admins")
        .select("id")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();
      const isOwner = (org as { owner_user_id?: string } | null)?.owner_user_id === user.id;
      if (!isOwner && !admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const organizationId = (formData.get("organizationId") as string) || orgId;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ct = file.type || "image/jpeg";
    if (!ALLOWED_TYPES.includes(ct)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 5MB." },
        { status: 400 }
      );
    }

    const ext = ct.split("/")[1] || "jpg";
    const id = randomUUID();
    const path = `${organizationId}/team-photos/${id}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: ct,
      upsert: true,
    });

    if (error) {
      console.error("team-photo upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("team-photo upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
