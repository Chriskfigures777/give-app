import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/** Public: get published survey definition for response form (no auth). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("organization_surveys")
      .select("id, title, description, questions, cover_image_url, theme")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("public surveys GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch survey" },
      { status: 500 }
    );
  }
}
