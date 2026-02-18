import { NextRequest, NextResponse } from "next/server";
import { getTemplateById } from "@/lib/website-builder-templates";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json({
    project: template.project,
    previewHtml: template.previewHtml ?? null,
  });
}
