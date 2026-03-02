import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const row = {
      weekly_attendance: body.weekly_attendance ?? null,
      org_type: body.org_type ?? null,
      annual_budget: body.annual_budget ?? null,
      finance_staff_count: body.finance_staff_count ?? null,
      biggest_challenges: parseArray(body.biggest_challenges),
      missionaries_supported: body.missionaries_supported ?? null,
      distribution_method: body.distribution_method ?? null,
      admin_hours_per_month: body.admin_hours_per_month ?? null,
      software_type: body.software_type ?? null,
      top_features: parseArray(body.top_features),
      networking_importance: body.networking_importance ?? null,
      has_website: body.has_website ?? null,
      tech_type_needed: body.tech_type_needed ?? null,
      software_vs_streaming: body.software_vs_streaming ?? null,
      wish_tech_improved: parseArray(body.wish_tech_improved),
      spend_to_solve_problem: body.spend_to_solve_problem ?? null,
      better_ways_to_give: parseArray(body.better_ways_to_give),
      easier_giving_ideas: body.easier_giving_ideas ?? null,
      paperwork_method: body.paperwork_method ?? null,
      member_communication: parseArray(body.member_communication),
      ai_form_interest: body.ai_form_interest ?? null,
      team_growth_tracking: body.team_growth_tracking ?? null,
      congregation_engagement: parseArray(body.congregation_engagement),
      automation_needs: parseArray(body.automation_needs),
      campaign_tools_interest: body.campaign_tools_interest ?? null,
      event_posting_needs: body.event_posting_needs ?? null,
      teaching_packets_interest: body.teaching_packets_interest ?? null,
      ai_sermon_content: body.ai_sermon_content ?? null,
      ai_member_curation: body.ai_member_curation ?? null,
      pastor_approval_workflow: body.pastor_approval_workflow ?? null,
      member_development_tools: parseArray(body.member_development_tools),
      communication_automation: parseArray(body.communication_automation),
      website_tool_needs: parseArray(body.website_tool_needs),
      currently_live_stream: body.currently_live_stream ?? null,
      live_stream_platform: body.live_stream_platform ?? null,
      live_stream_giving_interest: body.live_stream_giving_interest ?? null,
      live_stream_ai_features: parseArray(body.live_stream_ai_features),
      live_stream_challenges: parseArray(body.live_stream_challenges),
      want_charts_dashboard: body.want_charts_dashboard ?? null,
      auto_giving_interest: body.auto_giving_interest ?? null,
      auto_giving_features: parseArray(body.auto_giving_features),
      auto_transfer_fee_comfort: body.auto_transfer_fee_comfort ?? null,
      monthly_price_range: body.monthly_price_range ?? null,
      percent_fee_preference: body.percent_fee_preference ?? null,
      switch_triggers: parseArray(body.switch_triggers),
      respondent_name: body.respondent_name ?? null,
      phone_number: body.phone_number ?? null,
      contact_email: body.contact_email ?? null,
      church_name: body.church_name ?? null,
      allow_follow_up: body.allow_follow_up === "true" || body.allow_follow_up === true,
    };

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("church_market_survey_responses")
      .insert(row);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

function parseArray(val: unknown): string[] | null {
  if (Array.isArray(val)) return val.filter(Boolean) as string[];
  if (typeof val === "string" && val.trim()) return val.split(",").filter(Boolean);
  return null;
}
