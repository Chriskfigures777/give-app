"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const inputBorder = "#e5e7eb";
const formBg = "#f8f9fa";

export function PaymentStep({
  onSuccess,
  onBack,
  borderRadius = "8px",
  buttonColor,
  buttonTextColor,
  slug,
  redirecting = false,
}: {
  onSuccess: () => void;
  onBack: () => void;
  borderRadius?: string;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  slug?: string;
  redirecting?: boolean;
}) {
  const accentColor = buttonColor || "#374151";
  const accentText = buttonTextColor || "#fff";
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setLoading(true);
    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/give/complete${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`
        : "";
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message ?? "Payment failed");
      return;
    }
    onSuccess();
  }

  return (
    <div
      style={{
        border: `1px solid ${inputBorder}`,
        borderRadius,
        padding: "24px",
        margin: "20px 0",
        background: formBg,
      }}
    >
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment method</h3>
      <p className="text-sm text-slate-600 mb-4">
        A transaction fee applies to your donation. The amount shown below includes your donation and any fees you chose to cover.
      </p>
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="text-sm mb-3" role="alert" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}
        <PaymentElement />
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: "14px 20px",
              border: `1px solid ${inputBorder}`,
              borderRadius,
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "15px",
            }}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!stripe || loading || redirecting}
            style={{
              flex: 1,
              padding: "14px 20px",
              border: 0,
              borderRadius,
              background: accentColor,
              color: accentText,
              fontWeight: 600,
              fontSize: "15px",
              cursor: !stripe || loading || redirecting ? "not-allowed" : "pointer",
              opacity: !stripe || loading || redirecting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {redirecting ? "Loading your receipt…" : loading ? "Processing…" : "Pay now"}
            <Lock className="w-4 h-4 shrink-0" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}
