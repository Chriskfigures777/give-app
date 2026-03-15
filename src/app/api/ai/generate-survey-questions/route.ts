import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { getRemainingCredits, recordUsage } from "@/lib/ai-credits";
import { createNotification } from "@/lib/notifications";

export type SurveyQuestion = { id?: string; text: string; type: "multiple_choice" | "yes_no" | "short_answer" | "long_answer"; options?: string[] };

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJson(raw: string): string {
  // Strip markdown code fences if Claude wraps response in ```json ... ``` or ``` ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Find the first [ to last ] in case there's extra text around the array
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw;
}

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
        { error: "No AI credits remaining. Buy more credits in Plan & Billing, or try again next month." },
        { status: 402 }
      );
    }

    let body: { noteId?: string; noteTitle?: string; content?: string; count?: number; questionTypes?: string[] };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    let content = typeof body.content === "string" ? stripHtml(body.content).trim() : "";
    let noteTitle: string | undefined = typeof body.noteTitle === "string" ? body.noteTitle.trim() || undefined : undefined;
    if (body.noteId && !content) {
      const { data: note, error } = await supabase
        .from("pastor_notes")
        .select("content, title")
        .eq("id", body.noteId)
        .eq("organization_id", orgId)
        .single();
      if (error || !note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      const row = note as { content: string; title?: string };
      content = stripHtml(row.content ?? "").trim();
      if (!noteTitle && row.title) noteTitle = row.title.trim() || undefined;
    }

    if (!content) {
      return NextResponse.json({ error: "Note has no content — add some text to your note first." }, { status: 400 });
    }

    const count = Math.min(Math.max(Number(body.count) || 5, 1), 15);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    // Build question type instructions from caller's preference
    const allowedTypes = Array.isArray(body.questionTypes) && body.questionTypes.length > 0
      ? body.questionTypes
      : ["multiple_choice", "short_answer"];

    const typeDescriptions: Record<string, string> = {
      multiple_choice: '"multiple_choice" (include "options": ["A","B","C","D"] with 3-4 choices)',
      yes_no:          '"yes_no" (include "options": ["Yes","No"])',
      short_answer:    '"short_answer" (one-line text response, no options)',
      long_answer:     '"long_answer" (paragraph text response, no options)',
    };
    const typeInstructions = allowedTypes
      .map(t => `  - ${typeDescriptions[t] ?? t}`)
      .join("\n");

    const client = new Anthropic({ apiKey });
    const prompt = `You are helping a church or faith-based nonprofit create a short survey to gauge engagement or understanding of ministry content.

Below is the ministry/sermon note content. Generate exactly ${count} survey questions that a leader could use to understand how people responded to this content. Questions should be clear, respectful, and appropriate for a faith context.

ALLOWED question types (only use these):
${typeInstructions}

Distribute the questions across the allowed types as evenly as possible.

IMPORTANT: Return ONLY a raw JSON array with no markdown, no code fences, no explanation. Just the JSON array starting with [ and ending with ].
Each item: { "text": "question text", "type": "<one of the allowed types above>", "options": [...] }

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

    if (!raw) {
      console.error("generate-survey-questions: empty response from Claude");
      return NextResponse.json({ error: "AI returned an empty response — please try again." }, { status: 500 });
    }

    let questions: SurveyQuestion[] = [];
    try {
      const jsonStr = extractJson(raw);
      const parsed = JSON.parse(jsonStr) as SurveyQuestion[];
      if (Array.isArray(parsed)) {
        questions = parsed.slice(0, count).map((q, i) => {
          const validTypes = ["multiple_choice", "yes_no", "short_answer", "long_answer"];
          const type = validTypes.includes(q.type) ? q.type : "short_answer";
          return {
            id: `q-${i}`,
            text: typeof q.text === "string" ? q.text : "",
            type: type as SurveyQuestion["type"],
            options: (type === "multiple_choice" || type === "yes_no") && Array.isArray(q.options)
              ? q.options
              : type === "yes_no" ? ["Yes", "No"] : undefined,
          };
        }).filter(q => q.text.length > 0);
      }
    } catch (parseErr) {
      console.error("generate-survey-questions: failed to parse Claude response:", raw.slice(0, 500), parseErr);
      return NextResponse.json({ error: "AI returned an unexpected format — please try again." }, { status: 500 });
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: "AI returned no valid questions — please try again." }, { status: 500 });
    }

    await recordUsage(orgId, user.id, 1);

    // Notify the user that AI questions are ready (shows in dashboard notification bell)
    if (body.noteId) {
      await createNotification({
        userId: user.id,
        type: "ai_questions_ready",
        payload: {
          note_id: body.noteId,
          note_title: noteTitle ?? "Untitled",
        },
      });
    }

    return NextResponse.json({ questions });
  } catch (e) {
    console.error("generate-survey-questions:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
