import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getRemainingCredits } from "@/lib/ai-credits";
import { NoteEditorClient } from "../note-editor-client";
import { Suspense } from "react";

export default async function NewNotePage() {
  const { profile } = await requireAuth();
  const orgId = profile?.organization_id ?? profile?.preferred_organization_id;
  if (!orgId) redirect("/dashboard");

  const credits = await getRemainingCredits(orgId);

  return (
    <Suspense>
      <NoteEditorClient
        noteId={null}
        initialTitle=""
        initialContent=""
        initialCoverUrl={null}
        initialCoverType={null}
        creditsRemaining={credits.remaining}
        creditsCap={credits.cap}
      />
    </Suspense>
  );
}
