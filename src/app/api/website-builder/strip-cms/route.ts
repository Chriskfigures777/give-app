import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const CMS_BLOCKS = [
  "featured_sermon",
  "podcast",
  "worship_recordings",
  "events_grid",
  "events_list",
  "sermon_archive",
];

/**
 * Strips injected CMS content back to placeholders before saving.
 * Replaces <!-- cms:BLOCK:start -->...<!-- cms:BLOCK:end --> with {{cms:BLOCK}}
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    let body: { html?: string; project?: { pages?: Array<{ component?: string }> } };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    function strip(html: string): string {
      let out = html ?? "";
      for (const blockId of CMS_BLOCKS) {
        const re = new RegExp(
          `<!-- cms:${blockId}:start -->[\\s\\S]*?<!-- cms:${blockId}:end -->`,
          "g"
        );
        out = out.replace(re, `{{cms:${blockId}}}`);
      }
      return out;
    }

    if (body.html != null) {
      return NextResponse.json({ html: strip(body.html) });
    }
    if (body.project?.pages) {
      const project = { ...body.project, pages: [...body.project.pages] };
      for (let i = 0; i < project.pages.length; i++) {
        const comp = project.pages[i].component;
        if (typeof comp === "string") {
          project.pages[i] = { ...project.pages[i], component: strip(comp) };
        }
      }
      return NextResponse.json({ project });
    }
    return NextResponse.json({ error: "html or project required" }, { status: 400 });
  } catch (e) {
    console.error("strip-cms:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to strip CMS" },
      { status: 500 }
    );
  }
}
