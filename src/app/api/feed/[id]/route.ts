import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** PATCH: Edit a post or share (author only) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await requireAuth();
    const { id } = await params;

    const { data: row, error: fetchError } = await supabase
      .from("feed_items")
      .select("id, item_type, author_id, payload")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const item = row as { id: string; item_type: string; author_id: string | null; payload: Record<string, unknown> };
    if (item.item_type !== "post" && item.item_type !== "share") {
      return NextResponse.json({ error: "Only posts and shares can be edited" }, { status: 400 });
    }

    if (item.author_id !== user.id) {
      return NextResponse.json({ error: "You can only edit your own posts" }, { status: 403 });
    }

    const body = await req.json();
    const content = (body?.content ?? "").trim();
    const mediaUrl = (body?.media_url ?? "").trim() || null;
    const mediaType = (body?.media_type ?? "") as "image" | "video" | "link" | "";
    const linkUrl = (body?.link_url ?? "").trim() || null;
    const linkTitle = (body?.link_title ?? "").trim() || null;
    const linkDescription = (body?.link_description ?? "").trim() || null;
    const linkThumbnailUrl = (body?.link_thumbnail_url ?? "").trim() || null;

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

    const currentPayload = (item.payload ?? {}) as Record<string, unknown>;
    const updatedPayload = {
      ...currentPayload,
      content,
      ...(mediaUrl && { media_url: mediaUrl }),
      ...(mediaType && { media_type: mediaType }),
      ...(linkUrl && { link_url: linkUrl }),
      ...(linkTitle && { link_title: linkTitle }),
      ...(linkDescription && { link_description: linkDescription }),
      ...(linkThumbnailUrl && { link_thumbnail_url: linkThumbnailUrl }),
    };

    const { error: updateError } = await supabase
      .from("feed_items")
      .update({ payload: updatedPayload })
      .eq("id", id)
      .eq("author_id", user.id);

    if (updateError) {
      console.error("Feed item update error:", updateError);
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** DELETE: Delete a post or share (author only) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await requireAuth();
    const { id } = await params;

    const { data: row, error: fetchError } = await supabase
      .from("feed_items")
      .select("id, item_type, author_id")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const item = row as { id: string; item_type: string; author_id: string | null };
    if (item.item_type !== "post" && item.item_type !== "share") {
      return NextResponse.json({ error: "Only posts and shares can be deleted" }, { status: 400 });
    }

    if (item.author_id !== user.id) {
      return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("feed_items")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id);

    if (deleteError) {
      console.error("Feed item delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
