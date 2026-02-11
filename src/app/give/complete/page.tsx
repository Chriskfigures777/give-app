import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ShareComplete } from "./share-complete";

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function GiveCompletePage({ searchParams }: Props) {
  const { slug } = await searchParams;
  let thankYouMessage = "Thank you for your donation!";
  let orgName = "";
  let giveLink = "/";

  if (slug) {
    const supabase = await createClient();
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (orgRow) {
      orgName = (orgRow as { name: string }).name;
      giveLink = `/give/${slug}`;
      const { data: formCustomRow } = await supabase
        .from("form_customizations")
        .select("thank_you_message")
        .eq("organization_id", (orgRow as { id: string }).id)
        .single();

      const formCustom = formCustomRow as { thank_you_message: string | null } | null;
      if (formCustom?.thank_you_message) {
        thankYouMessage = formCustom.thank_you_message ?? thankYouMessage;
      }
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold mb-2">Thank you</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md whitespace-pre-wrap">
        {thankYouMessage}
      </p>
      <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
        Your donation was successful. You will receive a confirmation email if you provided one.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {slug && (
          <Link href={giveLink}>
            <Button variant="outline">Give again to {orgName}</Button>
          </Link>
        )}
        <Link href="/">
          <Button>Return home</Button>
        </Link>
      </div>
      <ShareComplete orgName={orgName} className="mt-8" />
    </main>
  );
}
