import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const decision = formData.get("decision");
  const authorizationId = formData.get("authorization_id") as string | null;

  if (!authorizationId) {
    return NextResponse.json({ error: "Missing authorization_id" }, { status: 400 });
  }

  const supabase = await createClient();

  if (decision === "approve") {
    const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId, {
      skipBrowserRedirect: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data?.redirect_url) {
      return NextResponse.redirect(data.redirect_url);
    }
  } else {
    const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId, {
      skipBrowserRedirect: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data?.redirect_url) {
      return NextResponse.redirect(data.redirect_url);
    }
  }

  return NextResponse.json({ error: "No redirect URL returned" }, { status: 500 });
}
