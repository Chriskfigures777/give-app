import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { getRemainingCredits, recordUsage } from "@/lib/ai-credits";

export type SurveyQuestion = { id?: string; text: string; type: "multiple_choice" | "short_answer"; options?: string[] };

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase, user } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { remaining } = await getRemainingCredits(orgId);
    if (remaining < 1) {
      return NextResponse.json(
        { error: "No AI credits remaining this month. Upgrade or try again next month." },
        { status: 402 }
      );
    }

    let body: { noteId?: string; content?: string; count?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    let content = typeof body.content === "string" ? body.content.trim() : "";
    if (body.noteId && !content) {
      const { data: note, error } = await supabase
        .from("pastor_notes")
        .select("content")
        .eq("id", body.noteId)
        .eq("organization_id", orgId)
        .single();
      if (error || !note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      content = (note as { content: string }).content?.trim() ?? "";
    }

    if (!content) {
      return NextResponse.json({ error: "Note content or content required" }, { status: 400 });
    }

    const count = Math.min(Math.max(Number(body.count) || 5, 1), 15);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const prompt = `You are helping a church or faith-based nonprofit create a short survey to gauge engagement or understanding of ministry content.

Below is the ministry/sermon note content. Generate exactly ${count} survey questions that a leader could use to understand how people responded to this content. Use a mix of multiple-choice and short-answer questions. Questions should be clear, respectful, and appropriate for a faith context.

Return a JSON array only, no other text. Each item: { "text": "question text", "type": "multiple_choice" or "short_answer", "options": ["A","B","C"] } (options only for multiple_choice).

Ministry content:
---
${content.slice(0, 25000)}
---`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((c): c is { type: "text"; text: string } => c.type === "text");
    const raw = textBlock?.text?.trim() ?? "";
    let questions: SurveyQuestion[] = [];
    try {
      const parsed = JSON.parse(raw) as SurveyQuestion[];
      if (Array.isArray(parsed)) {
        questions = parsed.slice(0, count).map((q, i) => ({
          id: `q-${i}`,
          text: typeof q.text === "string" ? q.text : "",
          type: q.type === "multiple_choice" ? "multiple_choice" : "short_answer",
          options: Array.isArray(q.options) ? q.options : undefined,
        }));
      }
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    await recordUsage(orgId, user.id, 1);

    return NextResponse.json({ questions });
  } catch (e) {
    console.error("generate-survey-questions:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
