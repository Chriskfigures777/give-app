import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organization_surveys")
      .select("id, title, description, status, created_at, updated_at")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("surveys GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("surveys GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch surveys" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase, user } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    let body: { title?: string; description?: string; questions?: unknown[]; cover_image_url?: string; theme?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const questions = Array.isArray(body.questions) ? body.questions : [];
    const questionsWithPages = distributeQuestionsToPages(questions);

    const { data, error } = await supabase
      .from("organization_surveys")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        organization_id: orgId,
        created_by_user_id: user.id,
        title: typeof body.title === "string" ? body.title.trim() || "Untitled survey" : "Untitled survey",
        description: typeof body.description === "string" ? body.description : null,
        questions: questionsWithPages as any,
        cover_image_url: typeof body.cover_image_url === "string" ? body.cover_image_url : null,
        theme: (body.theme && typeof body.theme === "object" ? body.theme : {}) as any,
        status: "draft",
      } as any)
      .select("id, title, description, questions, cover_image_url, theme, status, created_at, updated_at")
      .single();

    if (error) {
      console.error("surveys POST:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("surveys POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create survey" },
      { status: 500 }
    );
  }
}

const QUESTIONS_PER_PAGE = 4;

function distributeQuestionsToPages(questions: unknown[]): Array<Record<string, unknown>> {
  return questions.map((q, i) => {
    const row: Record<string, unknown> = typeof q === "object" && q !== null ? { ...(q as Record<string, unknown>) } : { id: `q-${i}`, text: "", type: "short_answer" };
    row.page = Math.floor(i / QUESTIONS_PER_PAGE);
    return row;
  });
}
