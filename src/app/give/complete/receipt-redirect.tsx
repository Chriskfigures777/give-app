"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "failed";

/**
 * When user lands on /give/complete after payment success, Stripe adds payment_intent
 * to the URL. We fetch the payment from Stripe and create the donation immediately—
 * no waiting for the webhook. Receipt appears instantly.
 */
export function ReceiptRedirect() {
  const hasRun = useRef(false);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || hasRun.current) return;
    const params = new URLSearchParams(window.location.search);
    const paymentIntent = params.get("payment_intent");
    if (!paymentIntent || !paymentIntent.startsWith("pi_")) return;
    const pi = paymentIntent;

    hasRun.current = true;
    setStatus("loading");

    const slug = params.get("slug");
    const query = new URLSearchParams({ pi });
    if (slug) query.set("slug", slug);
    fetch(`/api/donations/by-payment-intent?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.found && data.donationId) {
          setStatus("success");
          const url = data.receiptToken
            ? `/receipts/${data.donationId}?token=${encodeURIComponent(data.receiptToken)}`
            : `/receipts/${data.donationId}`;
          window.location.href = url;
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, []);

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <p className="text-slate-600">
          We&apos;re still processing your donation. Your receipt will be sent to your email if you provided one.
        </p>
        <p className="text-sm text-slate-500">
          You can also find it later in{" "}
          <Link href="/dashboard/my-donations" className="text-emerald-600 hover:underline font-medium">
            My Donations
          </Link>{" "}
          if you&apos;re logged in.
        </p>
        <Link href="/">
          <Button>Return home</Button>
        </Link>
      </div>
    );
  }

  return <p className="text-slate-600">Loading your receipt…</p>;
}
