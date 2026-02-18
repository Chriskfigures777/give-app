"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Lock, ChevronDown, ChevronLeft } from "lucide-react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentStep } from "./payment-step";
import {
  calculateChargeAmountCents,
  estimateDonorFeeCents,
  getFeeCoverageLabel,
  type FeeCoverage,
} from "@/lib/fee-calculator";
import { useUser } from "@/lib/use-user";

type Campaign = {
  id: string;
  name: string;
  suggested_amounts: unknown;
  minimum_amount_cents: number | null;
  allow_recurring: boolean | null;
  allow_anonymous?: boolean | null;
  goal_amount_cents?: number | null;
  current_amount_cents?: number | null;
};

type EndowmentFund = { id: string; name: string };

type Props = {
  organizationId: string;
  organizationName: string;
  campaigns: Campaign[];
  endowmentFunds: EndowmentFund[];
  suggestedAmounts: number[];
  minimumAmountCents: number;
  showEndowmentSelection: boolean;
  allowCustomAmount: boolean;
  /** When true, shows "Give anonymously" checkbox. Default true. */
  allowAnonymous?: boolean;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  /** Border radius for buttons and boxes (e.g. "6px", "0.5rem"). */
  borderRadius?: string | null;
  /** When true, form content is not wrapped in its own card (use when page already has one card with image + title). */
  noCard?: boolean;
  /** Org slug for thank-you page redirect. */
  slug?: string;
  /** Initial payment frequency from URL (e.g. after login redirect). */
  initialFrequency?: "monthly" | "yearly";
  /** Override base path for URL sync (e.g. /org/slug when embedded in org page). */
  basePathOverride?: string;
  /** When true, checkout section stretches to 100% width (for fullscreen embed). */
  fullWidth?: boolean;
  /** When set, use donation link with splits (charge lands on platform, webhook splits). */
  donationLinkId?: string;
  /** For in-chat fund requests. */
  fundRequestId?: string;
  /** When set, use embed card or form splits (charge lands on platform, webhook splits). */
  embedCardId?: string;
};

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();
const CACHE_KEY_PLATFORM = "__platform__";

function getStripePromise(stripeConnectAccountId?: string | null): Promise<Stripe | null> | null {
  if (typeof window === "undefined") return null;
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) return null;
  const key = stripeConnectAccountId ?? CACHE_KEY_PLATFORM;
  let p = stripePromiseCache.get(key);
  if (!p) {
    p = stripeConnectAccountId
      ? loadStripe(pk, { stripeAccount: stripeConnectAccountId })
      : loadStripe(pk);
    stripePromiseCache.set(key, p);
  }
  return p;
}

export function DonationForm({
  organizationId,
  campaigns,
  endowmentFunds,
  suggestedAmounts,
  minimumAmountCents,
  showEndowmentSelection,
  allowCustomAmount,
  allowAnonymous = true,
  buttonColor,
  buttonTextColor,
  borderRadius: borderRadiusProp,
  noCard = false,
  slug,
  initialFrequency,
  basePathOverride,
  fullWidth = false,
  donationLinkId,
  fundRequestId,
  embedCardId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isEmbed = pathname?.includes("/embed") ?? false;
  const basePath =
    basePathOverride ??
    (isEmbed ? `/give/${slug}/embed` : `/give/${slug}`);
  const radius = borderRadiusProp ?? "var(--stripe-radius)";

  const validInitial = initialFrequency === "monthly" || initialFrequency === "yearly" ? initialFrequency : undefined;
  const urlCampaign = searchParams?.get("campaign");
  const initialCampaignId =
    urlCampaign && campaigns.some((c) => c.id === urlCampaign) ? urlCampaign : campaigns[0]?.id ?? "";
  const [amountCents, setAmountCents] = useState<number>(
    suggestedAmounts[0] ? suggestedAmounts[0] * 100 : 1000
  );
  const [customAmount, setCustomAmount] = useState("");
  const [campaignId, setCampaignId] = useState<string>(initialCampaignId);
  const [endowmentFundId, setEndowmentFundId] = useState<string>(
    endowmentFunds[0]?.id ?? ""
  );
  const [donorEmail, setDonorEmail] = useState("");
  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  /** Payment frequency: one-time, monthly, or yearly */
  const [paymentFrequency, setPaymentFrequency] = useState<"one_time" | "monthly" | "yearly">(
    validInitial ?? "one_time"
  );

  // Sync URL when frequency changes (so login link and return-from-login preserve selection)
  useEffect(() => {
    if (!slug) return;
    const current = searchParams.get("frequency");
    const desired = paymentFrequency !== "one_time" ? paymentFrequency : null;
    if (desired && current !== desired) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("frequency", desired);
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    } else if (!desired && current) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("frequency");
      const qs = params.toString();
      router.replace(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [paymentFrequency, slug, basePath, router, searchParams]);
  const [feeCoverage, setFeeCoverage] = useState<FeeCoverage>("org_pays");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripeConnectAccountId, setStripeConnectAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  /** Pairs: 1 = sections 1+2, 2 = sections 3+4, 3 = section 5. Two sections shown at a time. */
  const [expandedPair, setExpandedPair] = useState<1 | 2 | 3>(1);

  const selectedCampaign = campaigns.find((c) => c.id === campaignId);
  const showAnonymousOption = allowAnonymous && (selectedCampaign?.allow_anonymous !== false);
  // Allow monthly/yearly for all campaigns
  const effectiveFrequency = paymentFrequency;
  const { user } = useUser();
  const needsLoginForRecurring = effectiveFrequency !== "one_time" && !user;

  const effectiveCents =
    allowCustomAmount && customAmount
      ? Math.round(parseFloat(customAmount) * 100)
      : amountCents;
  const totalChargeCents = calculateChargeAmountCents(effectiveCents, feeCoverage);
  const feeCents = estimateDonorFeeCents(effectiveCents, feeCoverage);

  async function goToPayment() {
    if (effectiveCents < minimumAmountCents) {
      setError(`Minimum amount is $${(minimumAmountCents / 100).toFixed(2)}`);
      return;
    }
    // Email required for all donations (including anonymous) — for tax receipts
    const email = donorEmail?.trim();
    if (!email) {
      setError("Email is required for tax receipts and donation records.");
      return;
    }
    // Monthly/yearly require login so donors can manage their recurring gifts
    if (needsLoginForRecurring && slug) {
      const params = new URLSearchParams({ org: slug, frequency: effectiveFrequency });
      window.location.href = `/login?${params.toString()}`;
      return;
    }
    setError(null);

    // Recurring: use Stripe Checkout for subscriptions (redirects to Stripe)
    if (effectiveFrequency !== "one_time" && user) {
      const res = await fetch("/api/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: effectiveCents,
          organizationId,
          campaignId: campaignId || undefined,
          endowmentFundId: showEndowmentSelection && endowmentFundId ? endowmentFundId : undefined,
          donorEmail: email,
          donorName: isAnonymous ? undefined : (donorName || undefined),
          isAnonymous: isAnonymous || undefined,
          feeCoverage,
          interval: effectiveFrequency === "monthly" ? "month" : "year",
          slug,
          frequency: effectiveFrequency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Subscription setup failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Subscription setup failed");
      return;
    }

    // One-time: use PaymentIntent
    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: effectiveCents,
        organizationId,
        campaignId: campaignId || undefined,
        endowmentFundId:
          showEndowmentSelection && endowmentFundId ? endowmentFundId : undefined,
        donorEmail: email,
        donorName: isAnonymous ? undefined : (donorName || undefined),
        isAnonymous: isAnonymous || undefined,
        feeCoverage,
        isRecurring: false,
        paymentFrequency: "one_time",
        donationLinkId: donationLinkId || undefined,
        fundRequestId: fundRequestId || undefined,
        embedCardId: embedCardId || undefined,
        userId: user?.id ?? undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Payment setup failed");
      return;
    }
    setClientSecret(data.clientSecret);
    setPaymentIntentId(data.paymentIntentId ?? null);
    setStripeConnectAccountId(data.stripeConnectAccountId ?? null);
  }

  async function pollForDonationAndRedirect() {
    if (!paymentIntentId) return;
    const maxAttempts = 25;
    const intervalMs = 500;
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(`/api/donations/by-payment-intent?pi=${encodeURIComponent(paymentIntentId)}`);
      const data = await res.json();
      if (data.found && data.donationId) {
        const url = data.receiptToken
          ? `/receipts/${data.donationId}?token=${encodeURIComponent(data.receiptToken)}`
          : `/receipts/${data.donationId}`;
        window.location.assign(url);
        return;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    setError("Receipt is being prepared. You'll receive it by email shortly.");
    setRedirecting(false);
  }

  const stripePromise = getStripePromise(stripeConnectAccountId);
  if (clientSecret && stripePromise) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: buttonColor
              ? { colorPrimary: buttonColor }
              : undefined,
          },
        }}
      >
        <PaymentStep
          onSuccess={async () => {
            setRedirecting(true);
            await pollForDonationAndRedirect();
          }}
          redirecting={redirecting}
          onBack={() => {
            setClientSecret(null);
            setPaymentIntentId(null);
            setStripeConnectAccountId(null);
          }}
          borderRadius={radius}
          buttonColor={buttonColor || undefined}
          buttonTextColor={buttonTextColor || undefined}
          slug={slug}
        />
      </Elements>
    );
  }

  const accentColor = buttonColor || "#374151";
  const accentText = buttonTextColor || "#fff";
  const formBg = "#f8f9fa";
  const inputBg = "#fff";
  const inputBorder = "#e5e7eb";
  const sectionHeading = "text-sm font-semibold text-slate-700 mb-3";
  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    fontSize: "15px",
    padding: "12px 14px",
    border: `1px solid ${inputBorder}`,
    borderRadius: radius,
    background: inputBg,
    color: "var(--stripe-dark)",
  };
  const formStyle = noCard
    ? undefined
    : {
        border: "1px solid var(--stripe-light-grey)",
        borderRadius: radius,
        padding: "24px",
        margin: "20px 0",
        boxShadow: "var(--stripe-form-shadow)",
        background: "#fff",
      };

  return (
    <div
      id="checkout"
      className={fullWidth ? "!w-full !min-w-0 !max-w-none" : ""}
      style={{
        ...formStyle,
        background: formStyle ? "#fff" : undefined,
        ...(fullWidth && { width: "100%", minWidth: 0, maxWidth: "none" }),
      }}
    >
      <div
        className={`give-form-tithely ${fullWidth ? "!w-full !min-w-0 !max-w-none" : ""}`}
        style={{
          background: formBg,
          borderRadius: radius,
          padding: "24px",
          border: `1px solid ${inputBorder}`,
          ...(fullWidth && { width: "100%", minWidth: 0, maxWidth: "none" }),
        }}
      >
        {error && (
          <p className="text-sm mb-3" role="alert" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}

        {/* Two sections at a time: pair 1 = sections 1+2, pair 2 = sections 3+4, pair 3 = section 5 */}
        <div className={`space-y-3 ${fullWidth ? "w-full" : ""}`}>
              {/* Pair 1: Sections 1 + 2 */}
              {expandedPair === 1 && (
                <>
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: inputBorder }}
                  >
                    <h3 className={sectionHeading}>Amount & Fund</h3>
                    <div className="mb-5 text-center">
                    <div className="text-3xl font-light tracking-tight tabular-nums" style={{ color: "#9ca3af" }}>
                      $ {(effectiveCents / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {suggestedAmounts.map((dollars) => {
                        const selected = amountCents === dollars * 100 && !customAmount;
                        return (
                          <button
                            key={dollars}
                            type="button"
                            onClick={() => {
                              setAmountCents(dollars * 100);
                              setCustomAmount("");
                            }}
                            style={{
                              padding: "8px 14px",
                              border: `1px solid ${selected ? "transparent" : inputBorder}`,
                              borderRadius: radius,
                              background: selected ? accentColor : inputBg,
                              color: selected ? accentText : "var(--stripe-dark)",
                              fontWeight: 500,
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            ${dollars}
                          </button>
                        );
                      })}
                    </div>
                    {allowCustomAmount && (
                      <div className="mt-3">
                        <input
                          type="number"
                          min={minimumAmountCents / 100}
                          step="0.01"
                          placeholder={`$${(minimumAmountCents / 100).toFixed(2)} or more`}
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          style={{ ...inputStyle }}
                        />
                      </div>
                    )}
                  </div>
                  {campaigns.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Fund</label>
                      <select
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">General Fund</option>
                        {campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {selectedCampaign?.goal_amount_cents != null &&
                        selectedCampaign.goal_amount_cents > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                              <span>Goal</span>
                              <span>
                                $
                                {(
                                  Number(selectedCampaign.current_amount_cents ?? 0) / 100
                                ).toLocaleString()}{" "}
                                / $
                                {(Number(selectedCampaign.goal_amount_cents) / 100).toLocaleString()}
                              </span>
                            </div>
                            <div
                              style={{
                                height: 6,
                                borderRadius: radius,
                                background: "#e5e7eb",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${Math.min(
                                    100,
                                    (Number(selectedCampaign.current_amount_cents ?? 0) /
                                      Number(selectedCampaign.goal_amount_cents)) *
                                      100
                                  )}%`,
                                  borderRadius: radius,
                                  background: accentColor,
                                }}
                              />
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                  {showEndowmentSelection && endowmentFunds.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Endowment fund</label>
                      <select
                        value={endowmentFundId}
                        onChange={(e) => setEndowmentFundId(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">None</option>
                        {endowmentFunds.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  </div>
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: inputBorder }}
                  >
                    <h3 className={sectionHeading}>Payment frequency</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "one_time" as const, label: "One-time" },
                        { value: "monthly" as const, label: "Monthly" },
                        { value: "yearly" as const, label: "Yearly" },
                      ].map((opt) => {
                        const selected = paymentFrequency === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              if (opt.value !== "one_time" && !user && slug) {
                                const params = new URLSearchParams({ org: slug!, frequency: opt.value });
                                window.location.href = `/login?${params.toString()}`;
                                return;
                              }
                              setPaymentFrequency(opt.value);
                              setIsRecurring(opt.value !== "one_time");
                            }}
                            style={{
                              padding: "10px 16px",
                              border: `1px solid ${selected ? "transparent" : inputBorder}`,
                              borderRadius: radius,
                              background: selected ? accentColor : inputBg,
                              color: selected ? accentText : "var(--stripe-dark)",
                              fontWeight: 500,
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedPair(2)}
                    className="w-full py-3 mt-4 font-medium rounded-lg flex items-center justify-center gap-2"
                    style={{
                      background: accentColor,
                      color: accentText,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Continue
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Pair 2: Sections 3 + 4 */}
              {expandedPair === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedPair(1)}
                    className="text-sm text-slate-600 hover:text-slate-800 mb-2 flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: inputBorder }}
                  >
                    <h3 className={sectionHeading}>Contact details</h3>
                  {showAnonymousOption && (
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="give-anonymously"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <label
                        htmlFor="give-anonymously"
                        className="text-sm font-medium text-slate-700 cursor-pointer"
                      >
                        Give anonymously
                      </label>
                    </div>
                  )}
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 mb-4">
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email <span className="text-slate-500 font-normal">(required)</span>
                      </label>
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Name {isAnonymous ? "(hidden)" : "(optional)"}
                      </label>
                      <input
                        type="text"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Your name"
                        style={{ ...inputStyle, opacity: isAnonymous ? 0.6 : 1 }}
                        disabled={isAnonymous}
                      />
                    </div>
                  </div>
                  {isAnonymous && (
                    <p className="text-xs text-slate-500 mb-4">
                      Email is required for tax receipts. Name will not be shared.
                    </p>
                  )}
                  </div>
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: inputBorder }}
                  >
                    <h3 className={sectionHeading}>
                    Transaction fee
                    <span
                      className="ml-1.5 text-slate-400 font-normal"
                      title="Card processing (2.9% + 30¢) and platform fee (1%)."
                    >
                      (i)
                    </span>
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    You can cover it or the organization can absorb it.
                  </p>
                  <div className="space-y-2">
                    {(["org_pays", "donor_platform", "donor_stripe", "donor_both"] as const).map((opt) => {
                      const selected = feeCoverage === opt;
                      const fee = opt !== "org_pays" ? estimateDonorFeeCents(effectiveCents, opt) : 0;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFeeCoverage(opt)}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `1px solid ${selected ? "transparent" : inputBorder}`,
                            borderRadius: radius,
                            background: selected ? accentColor : inputBg,
                            color: selected ? accentText : "var(--stripe-dark)",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontSize: "14px",
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{getFeeCoverageLabel(opt)}</span>
                          {fee > 0 && (
                            <span style={{ opacity: selected ? 1 : 0.9 }}>
                              +${(fee / 100).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedPair(3)}
                    className="w-full py-3 mt-4 font-medium rounded-lg flex items-center justify-center gap-2"
                    style={{
                      background: accentColor,
                      color: accentText,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Continue
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Pair 3: Section 5 — Summary & Pay */}
              {expandedPair === 3 && (
                <div
                  className="p-4 rounded-lg border"
                  style={{ borderColor: inputBorder }}
                  role="region"
                  aria-label="Payment summary"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedPair(2)}
                    className="text-sm text-slate-600 hover:text-slate-800 mb-3 flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <h3 className={sectionHeading}>Payment</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    You&apos;ll add your payment method on the next step.
                  </p>
                  <div
                    className="mb-4 p-4 rounded-lg"
                    style={{
                      background: "rgba(0,0,0,0.03)",
                      border: `1px solid ${inputBorder}`,
                    }}
                  >
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>Donation</span>
                      <span>${(effectiveCents / 100).toFixed(2)}</span>
                    </div>
                    {feeCents > 0 && (
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>Transaction fee</span>
                        <span>+${(feeCents / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-slate-900 mt-2 pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span>${(totalChargeCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={goToPayment}
                    disabled={effectiveCents < minimumAmountCents}
                    style={{
                      width: "100%",
                      padding: "16px 24px",
                      border: 0,
                      borderRadius: radius,
                      background: accentColor,
                      color: accentText,
                      fontWeight: 600,
                      fontSize: "16px",
                      cursor: effectiveCents < minimumAmountCents ? "not-allowed" : "pointer",
                      opacity: effectiveCents < minimumAmountCents ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                    }}
                  >
                    Continue to pay ${(totalChargeCents / 100).toFixed(2)}
                    <Lock className="w-4 h-4 shrink-0" strokeWidth={2} />
                  </button>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
