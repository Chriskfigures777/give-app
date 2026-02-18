"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { TypeformForm, type TypeformStepConfig } from "@/components/typeform-form";

const ACCOUNT_TYPES = [
  { value: "giver", label: "Giver", description: "I want to give to nonprofits and churches. Track my giving and support causes I care about.", emoji: "heart" },
  { value: "organization", label: "Organization", description: "I run a church or nonprofit. Accept donations, customize forms, and manage campaigns.", emoji: "building" },
] as const;

const STEPS_GIVER = [
  { label: "What's your full name?", name: "fullName", type: "text" as const, required: true, placeholder: "Your name", autoComplete: "name" },
  { label: "What's your email?", name: "email", type: "email" as const, required: true, placeholder: "you@example.com", autoComplete: "email" },
  {
    label: "Do you plan on being a missionary?",
    name: "plansToBeMissionary",
    type: "radio" as const,
    required: true,
    options: [
      { value: "yes", label: "Yes — I plan to receive support through a church or nonprofit" },
      { value: "no", label: "No — I'm a giver supporting causes I care about" },
    ],
  },
  { label: "Choose a password (min 6 characters)", name: "password", type: "password" as const, required: true, autoComplete: "new-password" },
];

const DESIRED_TOOLS_OPTIONS = [
  { value: "financial", label: "Financial software" },
  { value: "document", label: "Document management / paperwork organization" },
  { value: "livestream", label: "Live streaming / broadcast tools" },
  { value: "church_management", label: "Church management (people, membership, attendance)" },
  { value: "volunteer", label: "Volunteer management" },
  { value: "event", label: "Event management" },
  { value: "communications", label: "Communications (email, text, announcements)" },
  { value: "invoicing", label: "Invoicing / payments" },
  { value: "crm", label: "Customer management (CRM)" },
  { value: "project", label: "Project management" },
  { value: "scheduling", label: "Scheduling / appointment booking" },
  { value: "ai_ministry", label: "AI tools for ministry (sermon prep, content creation)" },
  { value: "reporting", label: "Reporting / analytics" },
  { value: "other", label: "Other" },
];

const STEPS_NONPROFIT: TypeformStepConfig[] = [
  { label: "What's your full name?", name: "fullName", type: "text", required: true, placeholder: "Your name", autoComplete: "name" },
  { label: "What's your email?", name: "email", type: "email", required: true, placeholder: "you@example.com", autoComplete: "email" },
  { label: "Organization name (optional)", name: "organizationName", type: "text", required: false, placeholder: "e.g. My Nonprofit Inc" },
  {
    label: "What's your role at the church or organization?",
    name: "churchRole",
    type: "select",
    required: false,
    options: [
      { value: "pastor", label: "Pastor" },
      { value: "admin", label: "Admin/Staff" },
      { value: "finance", label: "Finance" },
      { value: "other", label: "Other" },
    ],
  },
  {
    label: "Do you need help integrating technology at your church?",
    name: "needsTechIntegrationHelp",
    type: "radio",
    required: false,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    label: "Would you pay for someone to help with that?",
    name: "willingToPayTechHelp",
    type: "radio",
    required: false,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    label: "Do you own or run a business outside this church?",
    name: "ownsBusinessOutsideChurch",
    type: "radio",
    required: false,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    label: "If so, what business do you own? What do you do?",
    name: "businessDescription",
    type: "textarea",
    required: true,
    placeholder: "Describe your business...",
    showWhen: (data) => data.ownsBusinessOutsideChurch === "yes",
  },
  {
    label: "What is your business email?",
    name: "businessEmail",
    type: "email",
    required: true,
    placeholder: "business@example.com",
    showWhen: (data) => data.ownsBusinessOutsideChurch === "yes",
  },
  {
    label: "What other tools would you like to see? (Select all that apply)",
    name: "desiredTools",
    type: "checkboxGroup",
    required: false,
    options: DESIRED_TOOLS_OPTIONS,
  },
  {
    label: "Would you be open to receiving updates about other Figure Solutions products for your church or business?",
    name: "marketingConsent",
    type: "checkbox",
    required: false,
  },
  { label: "Choose a password (min 6 characters)", name: "password", type: "password", required: true, autoComplete: "new-password" },
];

type SignupFormProps = {
  redirectTo?: string;
  orgSlug?: string | null;
  frequency?: string | null;
};

export function SignupForm({ redirectTo = "/dashboard", orgSlug, frequency }: SignupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"giver" | "organization" | null>(null);
  const router = useRouter();

  async function handleSubmit(data: Record<string, string>) {
    setError(null);
    setMessage(null);
    setLoading(true);
    const role = accountType === "organization" ? "organization_admin" : (data.plansToBeMissionary === "yes" ? "missionary" : "donor");
    const emailRedirectTo = orgSlug
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/login?org=${encodeURIComponent(orgSlug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}`
      : undefined;

    // #region agent log
    const log = (msg: string, d?: object) => fetch("http://127.0.0.1:7242/ingest/3b544e7e-0f2a-4ba5-b9af-ad2e0e08f1b5", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "signup-form.tsx", message: msg, data: d || {}, timestamp: Date.now() }) }).catch(() => {});
    log("signup fetch start");
    // #endregion
    let res: Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role,
          plansToBeMissionary: data.plansToBeMissionary === "yes",
          organizationName: data.organizationName,
          churchRole: data.churchRole,
          needsTechIntegrationHelp: data.needsTechIntegrationHelp,
          willingToPayTechHelp: data.willingToPayTechHelp,
          ownsBusinessOutsideChurch: data.ownsBusinessOutsideChurch,
          businessDescription: data.businessDescription,
          businessEmail: data.businessEmail,
          desiredTools: data.desiredTools,
          marketingConsent: data.marketingConsent,
          emailRedirectTo,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      // #region agent log
      log("signup fetch threw", { err: String(fetchErr) });
      // #endregion
      setLoading(false);
      const msg = fetchErr instanceof Error ? fetchErr.message : "Request failed";
      setError(msg === "The operation was aborted." ? "Request timed out. Please check your connection and try again." : msg);
      return;
    }
    // #region agent log
    log("signup fetch done", { ok: res.ok, status: res.status });
    // #endregion
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Signup failed");
      return;
    }
    const signUpData = json.data;
    // If no email confirmation required, user is logged in — redirect
    if (signUpData?.session) {
      if (orgSlug && accountType === "giver") {
        try {
          await fetch("/api/donor/save-organization", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: orgSlug }),
          });
        } catch {
          // Non-blocking
        }
      }
      router.refresh();
      // Full redirect so auth state is properly loaded on destination (give page or dashboard)
      window.location.href = redirectTo;
      return;
    }
    setMessage("Check your email to confirm your account.");
    router.refresh();
  }

  if (accountType === null) {
    return (
      <div className="w-full space-y-6">
        <p className="text-slate-600">
          How do you want to use Give?
        </p>
        <div className="space-y-3">
          {ACCOUNT_TYPES.map(({ value, label, description, emoji }, i) => (
            <motion.button
              key={value}
              type="button"
              onClick={() => setAccountType(value)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="landing-card group w-full p-5 text-left"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  emoji === "heart"
                    ? "bg-gradient-to-br from-rose-500 to-pink-600"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600"
                } shadow-lg`}>
                  {emoji === "heart" ? (
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className="block text-lg font-bold text-slate-900">{label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-500">{description}</span>
                </div>
                <svg className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.button>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href={orgSlug ? `/login?org=${encodeURIComponent(orgSlug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}` : "/login"}
            className="font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const steps = accountType === "organization" ? STEPS_NONPROFIT : STEPS_GIVER;
  const loginHref = orgSlug ? `/login?org=${encodeURIComponent(orgSlug)}${frequency ? `&frequency=${encodeURIComponent(frequency)}` : ""}` : "/login";

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        </div>
      )}
      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700" role="status">
            {message}
          </p>
        </div>
      )}
      <div className="mb-6 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
        <span className="text-slate-500">Signing up as:</span>
        <span className="font-semibold text-slate-900">
          {accountType === "organization" ? "Organization" : "Giver"}
        </span>
        <button
          type="button"
          onClick={() => setAccountType(null)}
          className="ml-auto text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Change
        </button>
      </div>
      <TypeformForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Create account"
        loading={loading}
      />
      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-emerald-600 hover:text-emerald-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
