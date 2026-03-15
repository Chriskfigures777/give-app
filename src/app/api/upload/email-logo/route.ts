import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const BUCKET = "organization-assets";
const MAX_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ct = file.type || "image/png";
    if (!ALLOWED_TYPES.includes(ct)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP, or SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 3MB." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const ext = ct === "image/svg+xml" ? "svg" : (ct.split("/")[1]?.replace("jpeg", "jpg") || "png");
    const path = `${orgId}/logo-${randomUUID()}.${ext}`;

    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET)
      .upload(path, file, { contentType: ct, upsert: false });

    if (uploadError) {
      console.error("Logo upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = serviceClient.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("Logo upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
