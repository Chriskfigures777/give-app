import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ReceiptRedirect } from "./receipt-redirect";
import { ShareComplete } from "./share-complete";
import { GiveCompleteConfetti } from "./give-complete-confetti";

type Props = {
  searchParams: Promise<{ slug?: string; payment_intent?: string }>;
};

export default async function GiveCompletePage({ searchParams }: Props) {
  const { slug, payment_intent } = await searchParams;
  const hasPaymentIntent = !!payment_intent && payment_intent.startsWith("pi_");
  let thankYouMessage = "Thank you for your donation!";
  let orgName = "";
  let orgId: string | null = null;
  let giveLink = "/";
  let thankYouVideoUrl: string | null = null;
  let thankYouCtaUrl: string | null = null;
  let thankYouCtaText: string | null = null;

  if (slug) {
    const supabase = await createClient();
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (orgRow) {
      orgName = (orgRow as { name: string }).name;
      orgId = (orgRow as { id: string }).id;
      giveLink = `/give/${slug}`;
      const { data: formCustomRow } = await supabase
        .from("form_customizations")
        .select("thank_you_message, thank_you_video_url, thank_you_cta_url, thank_you_cta_text")
        .eq("organization_id", (orgRow as { id: string }).id)
        .single();

      const formCustom = formCustomRow as {
        thank_you_message: string | null;
        thank_you_video_url: string | null;
        thank_you_cta_url: string | null;
        thank_you_cta_text: string | null;
      } | null;
      if (formCustom?.thank_you_message) {
        thankYouMessage = formCustom.thank_you_message ?? thankYouMessage;
      }
      thankYouVideoUrl = formCustom?.thank_you_video_url ?? null;
      thankYouCtaUrl = formCustom?.thank_you_cta_url ?? null;
      thankYouCtaText = formCustom?.thank_you_cta_text ?? null;
    }
  }

  const isVideoUrl = thankYouVideoUrl?.match(/\.(mp4|webm|ogg)(\?|$)/i);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {hasPaymentIntent ? (
        <ReceiptRedirect />
      ) : (
        <>
      <GiveCompleteConfetti />
      {thankYouVideoUrl && isVideoUrl && (
        <div className="relative mb-6 w-full max-w-md aspect-video overflow-hidden rounded-xl">
          <video
            src={thankYouVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
        </div>
      )}
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
        {thankYouCtaUrl && thankYouCtaText && (
          <a href={thankYouCtaUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">{thankYouCtaText}</Button>
          </a>
        )}
        <Link href="/">
          <Button>Return home</Button>
        </Link>
      </div>
      <ShareComplete orgName={orgName} organizationId={orgId} slug={slug ?? undefined} className="mt-8" />
        </>
      )}
    </main>
  );
}
