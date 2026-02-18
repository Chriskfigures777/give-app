import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth";

type InternalSplitEntry = { percentage: number; externalAccountId: string };

/**
 * PATCH: Save internal splits configuration.
 * Body: { internalSplits: { percentage: number; externalAccountId: string }[] }
 * Must total 100%. All externalAccountIds must belong to the org's Connect account.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { supabase, profile, organizationId: orgIdFromAuth } = await requireOrgAdmin();
    const organizationId = orgIdFromAuth ?? profile?.organization_id ?? profile?.preferred_organization_id;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const body = await req.json();
    const { internalSplits } = body as { internalSplits: InternalSplitEntry[] };

    if (!Array.isArray(internalSplits)) {
      return NextResponse.json(
        { error: "internalSplits must be an array" },
        { status: 400 }
      );
    }

    const total = internalSplits.reduce((s, e) => s + (e.percentage ?? 0), 0);
    if (total !== 100) {
      return NextResponse.json(
        { error: "Splits must total 100%" },
        { status: 400 }
      );
    }

    const valid = internalSplits.every(
      (e) =>
        typeof e.percentage === "number" &&
        e.percentage > 0 &&
        typeof e.externalAccountId === "string" &&
        e.externalAccountId.length > 0
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Each split must have percentage > 0 and externalAccountId" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("form_customizations")
      .select("id")
      .eq("organization_id", organizationId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("form_customizations")
        .update({ internal_splits: internalSplits })
        .eq("organization_id", organizationId);
      if (error) {
        console.error("internal-splits update error", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from("form_customizations").insert({
        organization_id: organizationId,
        internal_splits: internalSplits,
      });
      if (error) {
        console.error("internal-splits insert error", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("internal-splits PATCH error", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
