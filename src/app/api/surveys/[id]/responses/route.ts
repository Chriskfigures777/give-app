import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { upsertOrganizationContact } from "@/lib/organization-contacts";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { requireAuth } = await import("@/lib/auth");
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const { data, error } = await supabase
      .from("organization_survey_responses")
      .select("id, respondent_email, respondent_name, answers, created_at")
      .eq("survey_id", id)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("surveys responses GET:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch responses" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params;
    const supabase = createServiceClient();

    const { data: survey, error: surveyErr } = await supabase
      .from("organization_surveys")
      .select("id, organization_id, status, respondent_category")
      .eq("id", surveyId)
      .single();

    if (surveyErr || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    if (survey.status !== "published") {
      return NextResponse.json({ error: "Survey is not accepting responses" }, { status: 400 });
    }

    const orgId = survey.organization_id;
    const respondentCategory = survey.respondent_category ?? null;
    const surveyRespondentCategory =
      respondentCategory === "member" || respondentCategory === "contact"
        ? respondentCategory
        : null;

    let body: { respondent_email?: string; respondent_name?: string; answers?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const respondentEmail = typeof body.respondent_email === "string" ? body.respondent_email.trim().toLowerCase() : null;
    const respondentName = typeof body.respondent_name === "string" ? body.respondent_name.trim() : null;
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

    const { data: inserted, error: insertErr } = await supabase
      .from("organization_survey_responses")
      .insert({
        survey_id: surveyId,
        organization_id: orgId,
        respondent_email: respondentEmail ?? null,
        respondent_name: respondentName ?? null,
        answers: answers as Record<string, string>,
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("survey response insert:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    if (respondentEmail) {
      await upsertOrganizationContact(supabase, {
        organizationId: orgId,
        email: respondentEmail,
        name: respondentName ?? null,
        source: "survey",
        surveyRespondentCategory: surveyRespondentCategory ?? undefined,
      }).catch((e) => console.error("[survey response] upsertOrganizationContact failed:", e));

      const { data: contact } = await supabase
        .from("organization_contacts")
        .select("id")
        .eq("organization_id", orgId)
        .eq("email", respondentEmail)
        .maybeSingle();
      if (contact && (inserted as { id: string }).id) {
        await supabase
          .from("organization_survey_responses")
          .update({ contact_id: (contact as { id: string }).id })
          .eq("id", (inserted as { id: string }).id);
      }
    }

    return NextResponse.json({ ok: true, id: (inserted as { id: string }).id });
  } catch (e) {
    console.error("surveys responses POST:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to submit response" },
      { status: 500 }
    );
  }
}
