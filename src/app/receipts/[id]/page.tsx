import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getReceiptVideoUrl } from "@/lib/receipt-video";
import { DownloadReceiptButton } from "./download-receipt-button";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ReceiptPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: donation, error } = await supabase
    .from("donations")
    .select(`
      id,
      amount_cents,
      status,
      created_at,
      donor_email,
      donor_name,
      user_id,
      receipt_token,
      currency,
      organization_id,
      organizations(name, slug),
      donation_campaigns(name)
    `)
    .eq("id", id)
    .single();

  if (error || !donation) notFound();

  const d = donation as {
    id: string;
    amount_cents: number;
    status: string;
    created_at: string | null;
    donor_email: string | null;
    donor_name: string | null;
    user_id: string | null;
    receipt_token: string | null;
    currency: string;
    organization_id: string | null;
    organizations: { name: string; slug: string } | null;
    donation_campaigns: { name: string } | null;
  };

  if (d.status !== "succeeded") notFound();

  const isOwnerByAuth =
    user &&
    (d.user_id === user.id ||
      (d.donor_email && d.donor_email.toLowerCase() === (user.email ?? "").toLowerCase()));
  const isOwnerByToken = token && d.receipt_token && token === d.receipt_token;
  // Legacy: donations without receipt_token (created before token support) allow anonymous access
  const isLegacyNoToken = !d.receipt_token && !user;
  if (!isOwnerByAuth && !isOwnerByToken && !isLegacyNoToken) notFound();

  const amount = Number(d.amount_cents) / 100;
  const date = d.created_at
    ? new Date(d.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";
  const orgName = d.organizations?.name ?? "Organization";
  const orgSlug = d.organizations?.slug ?? null;
  const campaignName = d.donation_campaigns?.name ?? "General";

  const { url: mediaUrl, isVideo } = await getReceiptVideoUrl();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg">
        {/* Video/Image hero - card-style like embed cards */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-slate-200">
          {isVideo ? (
            <video
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden
            />
          ) : (
            <img
              src={mediaUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
            <h1 className="text-2xl font-bold leading-tight drop-shadow-sm">
              Thank you for your donation
            </h1>
            <p className="mt-1 text-sm opacity-95">
              Your generosity makes a difference.
            </p>
          </div>
        </div>

        {/* Receipt details */}
        <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-white p-6 shadow-lg">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Organization</span>
              <span className="font-medium text-slate-900">{orgName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Fund</span>
              <span className="font-medium text-slate-900">{campaignName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-900">{date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="text-lg font-semibold text-emerald-600">
                ${amount.toFixed(2)} USD
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Receipt ID</span>
              <span className="font-mono text-xs text-slate-600">{d.id}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <DownloadReceiptButton donationId={d.id} receiptToken={isOwnerByToken ? d.receipt_token : undefined} />
            <div className="flex flex-col gap-2">
              {orgSlug && (
                <Link
                  href={`/give/${orgSlug}`}
                  className="text-center text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Give again to {orgName}
                </Link>
              )}
              <Link
                href={isOwnerByAuth ? "/dashboard/my-donations" : "/"}
                className="text-center text-sm text-slate-500 hover:text-slate-900"
              >
                {isOwnerByAuth ? "Back to my donations" : "Return home"}
              </Link>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            This receipt is for your records. No goods or services were provided
            in exchange for this donation. For tax purposes, please retain this
            receipt with your records.
          </p>
        </div>
      </div>
    </main>
  );
}
