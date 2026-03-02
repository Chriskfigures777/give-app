import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;
  const body = await req.json();
  const { name, slug, plan, plan_status } = body as {
    name?: string;
    slug?: string;
    plan?: string;
    plan_status?: string | null;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (slug !== undefined) updates.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (plan !== undefined) updates.plan = plan;
  if ("plan_status" in body) updates.plan_status = plan_status ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createServiceClient();
  // @ts-ignore – plan columns not in generated types
  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
