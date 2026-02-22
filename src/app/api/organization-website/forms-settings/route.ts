import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function canAccessOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data: org } = await supabase
    .from("organizations")
    .select("owner_user_id")
    .eq("id", orgId)
    .single();
  if ((org as { owner_user_id?: string } | null)?.owner_user_id === userId) return true;
  const { data: admin } = await supabase
    .from("organization_admins")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!admin;
}

function normalizeEmail(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim();
  if (!v) return null;
  // very small sanity check; full RFC validation is overkill here
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v.toLowerCase();
}

function normalizeName(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim();
  if (!v) return null;
  return v.length > 80 ? v.slice(0, 80) : v;
}

export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const organizationId = req.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (profile?.role !== "platform_admin" && organizationId !== orgId) {
      const ok = await canAccessOrg(supabase, user.id, organizationId);
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: org, error } = await supabase
      .from("organizations")
      .select("id, name, slug, owner_user_id, website_forms_forward_to_email, website_forms_reply_name, website_forms_auto_reply_enabled, website_forms_auto_reply_message")
      .eq("id", organizationId)
      .single();
    if (error || !org) {
      return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
    }

    // default forward email = org owner's profile email (if available)
    let defaultForwardTo: string | null = null;
    const ownerId = (org as { owner_user_id?: string | null }).owner_user_id ?? null;
    if (ownerId) {
      const { data: ownerProfile } = await supabase
        .from("user_profiles")
        .select("email, business_email")
        .eq("id", ownerId)
        .maybeSingle();
      const p = ownerProfile as { email?: string | null; business_email?: string | null } | null;
      defaultForwardTo = (p?.business_email ?? p?.email ?? null) || null;
    }

    return NextResponse.json({
      organizationId,
      orgName: (org as { name?: string }).name ?? "",
      orgSlug: (org as { slug?: string }).slug ?? "",
      forwardToEmail: (org as { website_forms_forward_to_email?: string | null }).website_forms_forward_to_email ?? null,
      replyName: (org as { website_forms_reply_name?: string | null }).website_forms_reply_name ?? null,
      autoReplyEnabled: (org as { website_forms_auto_reply_enabled?: boolean }).website_forms_auto_reply_enabled ?? true,
      autoReplyMessage: (org as { website_forms_auto_reply_message?: string | null }).website_forms_auto_reply_message ?? null,
      defaults: {
        forwardToEmail: defaultForwardTo,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const organizationId = typeof body?.organizationId === "string" ? body.organizationId : null;
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (profile?.role !== "platform_admin" && organizationId !== orgId) {
      const ok = await canAccessOrg(supabase, user.id, organizationId);
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const forwardToEmailRaw = body?.forwardToEmail;
    const replyNameRaw = body?.replyName;
    const autoReplyEnabledRaw = body?.autoReplyEnabled;
    const autoReplyMessageRaw = body?.autoReplyMessage;

    const forwardToEmail =
      forwardToEmailRaw === null || forwardToEmailRaw === ""
        ? null
        : normalizeEmail(forwardToEmailRaw);
    if (forwardToEmailRaw && forwardToEmailRaw !== "" && forwardToEmailRaw !== null && !forwardToEmail) {
      return NextResponse.json({ error: "Invalid forwardToEmail" }, { status: 400 });
    }

    const replyName =
      replyNameRaw === null || replyNameRaw === ""
        ? null
        : normalizeName(replyNameRaw);

    const autoReplyEnabled =
      typeof autoReplyEnabledRaw === "boolean" ? autoReplyEnabledRaw : undefined;

    const autoReplyMessage =
      autoReplyMessageRaw === null || autoReplyMessageRaw === ""
        ? null
        : typeof autoReplyMessageRaw === "string"
          ? autoReplyMessageRaw.trim().slice(0, 2000)
          : undefined;

    const updatePayload: Record<string, unknown> = {
      website_forms_forward_to_email: forwardToEmail,
      website_forms_reply_name: replyName,
      updated_at: new Date().toISOString(),
    };
    if (autoReplyEnabled !== undefined) {
      updatePayload.website_forms_auto_reply_enabled = autoReplyEnabled;
    }
    if (autoReplyMessage !== undefined) {
      updatePayload.website_forms_auto_reply_message = autoReplyMessage;
    }

    const { error } = await supabase
      .from("organizations")
      .update(updatePayload)
      .eq("id", organizationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      forwardToEmail,
      replyName,
      autoReplyEnabled: autoReplyEnabled ?? true,
      autoReplyMessage: autoReplyMessage ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

