import { NextResponse } from "next/server";
import { WEBSITE_TEMPLATES } from "@/lib/website-builder-templates";

export async function GET() {
  const list = WEBSITE_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    previewHtml: t.previewHtml ?? null,
  }));
  return NextResponse.json(list);
}
