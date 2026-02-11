import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = req.nextUrl.origin || process.env.DOMAIN || "http://localhost:3000";
  return NextResponse.redirect(`${url}/`, { status: 302 });
}
