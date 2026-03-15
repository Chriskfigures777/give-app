import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRemainingCredits } from "@/lib/ai-credits";
import { NoteEditorClient } from "../note-editor-client";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, supabase } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  type NoteRow = { id: string; title: string; content: string; cover_url?: string | null; cover_type?: string | null };

  const { data: noteData, error } = await supabase
    .from("pastor_notes")
    .select("id, title, content, cover_url, cover_type")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !noteData) notFound();
  const note = noteData as unknown as NoteRow;

  const credits = await getRemainingCredits(orgId);

  return (
    <NoteEditorClient
      noteId={id}
      initialTitle={note.title ?? ""}
      initialContent={note.content ?? ""}
      initialCoverUrl={note.cover_url ?? null}
      initialCoverType={(note.cover_type as "image" | "video" | null) ?? null}
      creditsRemaining={credits.remaining}
      creditsCap={credits.cap}
    />
  );
}
