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

  const { data: note, error } = await supabase
    .from("pastor_notes")
    .select("id, title, content")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !note) notFound();

  const credits = await getRemainingCredits(orgId);
  const n = note as { title: string; content: string };

  return (
    <NoteEditorClient
      noteId={id}
      initialTitle={n.title ?? ""}
      initialContent={n.content ?? ""}
      creditsRemaining={credits.remaining}
      creditsCap={credits.cap}
    />
  );
}
