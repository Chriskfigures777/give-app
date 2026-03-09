import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
  WidthType,
  ShadingType,
} from "docx";

type OrgGoalRow = {
  id: string;
  name: string;
  description: string | null;
  horizon: string;
  start_date: string | null;
  end_date: string | null;
  target_value: number | null;
  target_unit: string | null;
};

type GoalMeta = {
  d?: string;
  milestones?: { id: string; text: string; done: boolean }[];
};

function parseMeta(description: string | null): GoalMeta {
  if (!description) return {};
  try {
    const p = JSON.parse(description) as unknown;
    if (p && typeof p === "object" && (p as { __give_goal_meta?: boolean }).__give_goal_meta) {
      return p as GoalMeta;
    }
  } catch {
    // plain text description
  }
  return { d: description };
}

const HORIZON_LABELS: Record<string, string> = {
  "90_day": "90-Day Goals",
  "1_year": "One-Year Goals",
  "3_year": "Three-Year Vision",
};

// Design system: 2026-style doc — clean hierarchy, generous spacing, branded accents
const STYLE = {
  color: {
    dark: "1A1A1A",
    body: "334155",
    muted: "64748B",
    accent: "067A55",
    accentLight: "10B981",
  },
  // Font sizes in half-points (e.g. 24 = 12pt)
  size: {
    title: 32,
    subtitle: 24,
    section: 26,
    goalTitle: 24,
    body: 22,
    small: 20,
  },
  spacing: {
    afterTitle: 120,
    afterSubtitle: 480,
    sectionBefore: 400,
    sectionAfter: 240,
    cardBefore: 200,
    cardInner: 100,
    line: 80,
  },
  border: {
    accent: { style: BorderStyle.SINGLE, color: "10B981", size: 12, space: 4 },
    cell: { style: BorderStyle.SINGLE, color: "A7F3D0", size: 4, space: 0 },
  },
  shading: {
    card: { fill: "F0FDF4", color: "auto", type: ShadingType.CLEAR },
  },
} as const;

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

export async function GET() {
  try {
    const { profile, supabase } = await requireAuth();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
    if (!orgId) return NextResponse.json({ error: "No organization selected" }, { status: 400 });

    if (profile?.role !== "platform_admin") {
      const allowed = await canAccessOrg(supabase, user.id, orgId);
      if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();
    const orgName = (org as { name?: string } | null)?.name ?? "Organization";

    const { data: goals, error } = await supabase
      .from("org_goals")
      .select("id, name, description, horizon, start_date, end_date, target_value, target_unit")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("org-goals export error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const goalsList = (goals ?? []) as OrgGoalRow[];

    const byHorizon: Record<string, OrgGoalRow[]> = {
      "90_day": [],
      "1_year": [],
      "3_year": [],
    };
    for (const g of goalsList) {
      const h = g.horizon === "1_year" || g.horizon === "3_year" ? g.horizon : "90_day";
      byHorizon[h].push(g);
    }

    type SectionChild = InstanceType<typeof Paragraph> | InstanceType<typeof Table>;
    const children: SectionChild[] = [];

    // —— Cover: title + org + accent line ——
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "Goals & Priorities",
            bold: true,
            size: STYLE.size.title,
            color: STYLE.color.dark,
          }),
        ],
        spacing: { after: STYLE.spacing.afterTitle },
      })
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: orgName,
            italics: true,
            size: STYLE.size.subtitle,
            color: STYLE.color.muted,
          }),
        ],
        spacing: { after: STYLE.spacing.afterSubtitle },
      })
    );
    children.push(
      new Paragraph({
        border: { bottom: STYLE.border.accent },
        spacing: { after: 0 },
      })
    );

    const horizonOrder: (keyof typeof byHorizon)[] = ["3_year", "1_year", "90_day"];
    for (const horizonKey of horizonOrder) {
      const list = byHorizon[horizonKey];
      if (list.length === 0) continue;

      const label = HORIZON_LABELS[horizonKey] ?? horizonKey;
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          border: { bottom: STYLE.border.accent },
          children: [
            new TextRun({
              text: label,
              bold: true,
              size: STYLE.size.section,
              color: STYLE.color.accent,
            }),
          ],
          spacing: {
            before: STYLE.spacing.sectionBefore,
            after: STYLE.spacing.sectionAfter,
          },
        })
      );

      for (const goal of list) {
        const meta = parseMeta(goal.description);
        const descText = meta.d?.trim() ?? "";

        const cellParagraphs: Paragraph[] = [];

        // Goal name
        cellParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: goal.name,
                bold: true,
                size: STYLE.size.goalTitle,
                color: STYLE.color.dark,
              }),
            ],
            spacing: { after: descText ? STYLE.spacing.line : STYLE.spacing.cardInner },
          })
        );

        if (descText) {
          cellParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: descText,
                  size: STYLE.size.body,
                  color: STYLE.color.body,
                }),
              ],
              spacing: { after: STYLE.spacing.line },
            })
          );
        }

        const dateParts: string[] = [];
        if (goal.start_date) dateParts.push(`From ${goal.start_date}`);
        if (goal.end_date) dateParts.push(`By ${goal.end_date}`);
        if (dateParts.length > 0 || (goal.target_value != null && goal.target_value > 0)) {
          const parts: string[] = [...dateParts];
          if (goal.target_value != null && goal.target_value > 0) {
            const unit = goal.target_unit?.trim() || "units";
            parts.push(`Target: ${goal.target_value.toLocaleString()} ${unit}`);
          }
          cellParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: parts.join("  ·  "),
                  size: STYLE.size.small,
                  color: STYLE.color.muted,
                }),
              ],
              spacing: { after: STYLE.spacing.cardInner },
            })
          );
        }

        const milestones = meta.milestones ?? [];
        if (milestones.length > 0) {
          cellParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Milestones",
                  bold: true,
                  size: STYLE.size.small,
                  color: STYLE.color.accent,
                }),
              ],
              spacing: { before: 60, after: 40 },
            })
          );
          for (const m of milestones) {
            const prefix = m.done ? "✓  " : "○  ";
            cellParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: prefix + m.text,
                    size: STYLE.size.small,
                    color: STYLE.color.body,
                    ...(m.done ? { strikethrough: true } : {}),
                  }),
                ],
                bullet: { level: 0 },
                spacing: { after: 30 },
              })
            );
          }
        }

        const goalCard = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: STYLE.border.cell,
            bottom: STYLE.border.cell,
            left: STYLE.border.cell,
            right: STYLE.border.cell,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: STYLE.shading.card,
                  margins: {
                    marginUnitType: WidthType.DXA,
                    top: 240,
                    bottom: 240,
                    left: 240,
                    right: 240,
                  },
                  children: cellParagraphs,
                }),
              ],
            }),
          ],
        });

        children.push(
          new Paragraph({ spacing: { before: STYLE.spacing.cardBefore, after: 0 } }),
          goalCard
        );
      }
    }

    if (children.length <= 4) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "No goals yet. Add goals in the dashboard to share your vision with members and the community.",
              italics: true,
              size: STYLE.size.body,
              color: STYLE.color.muted,
            }),
          ],
          spacing: { before: 400 },
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1.15),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1.15),
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeName = orgName.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40);
    const contentDisposition = `attachment; filename="${safeName}-goals.docx"`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": contentDisposition,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    console.error("org-goals export error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
