import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

const BUCKET = "user-avatars";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

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

    const ext = ct.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const path = `${user.id}/avatar-${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: ct, upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // Update user_profiles table
    await supabase
      .from("user_profiles")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    // Also update auth user metadata so it appears everywhere
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error("Avatar upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
