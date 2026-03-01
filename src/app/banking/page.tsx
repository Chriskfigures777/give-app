"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "unit-elements-white-label-app": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "jwt-token"?: string },
        HTMLElement
      >;
    }
  }
}

type Status = "loading" | "unauthenticated" | "apply" | "ready";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export default function BankingPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Application form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "", ssn: "",
    phone: "", street: "", city: "", state: "", postalCode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setStatus("unauthenticated"); return; }

      // Try to get a Unit customer token (exchanges Supabase JWT → Unit token)
      const res = await fetch("/api/unit/customer-token");

      if (res.status === 404) {
        // No Unit customer yet — show application form
        setStatus("apply");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setToken(data.token); // Unit customer token
        setStatus("ready");
        return;
      }

      // Fallback: check if they just need to apply
      setStatus("apply");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setToken(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    // Get email from Supabase session
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const res = await fetch("/api/unit/create-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, email: user?.email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    // Customer created — now exchange for a Unit customer token
    const tokenRes = await fetch("/api/unit/customer-token");
    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      setToken(tokenData.token);
    }

    setStatus("ready");
    setSubmitting(false);
  }

  const field = (
    id: keyof typeof form,
    label: string,
    type = "text",
    placeholder = "",
    hint?: string
  ) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={form[id]}
        onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
        required
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
      />
    </div>
  );

  return (
    <>
      <Script
        src="https://ui.s.unit.sh/release/latest/components-extended.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

      <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>

        {/* Loading */}
        {status === "loading" && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-slate-400">Loading banking…</span>
          </div>
        )}

        {/* Not signed in */}
        {status === "unauthenticated" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Banking</h1>
              <p className="mt-2 text-sm text-slate-500">Sign in to access your banking dashboard.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity">
                Log in to Banking
              </Link>
              <Link href="/signup" className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-colors">
                Create account
              </Link>
            </div>
          </div>
        )}

        {/* Application form — no Unit customer yet */}
        {status === "apply" && (
          <div className="mx-auto w-full max-w-lg px-4 py-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Open your banking account</h1>
              <p className="mt-2 text-sm text-slate-500">
                Fill out the form below to create your free banking account. Your information is encrypted and secure.
              </p>
            </div>

            <form onSubmit={handleApply} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="grid grid-cols-2 gap-4">
                {field("firstName", "First name", "text", "John")}
                {field("lastName", "Last name", "text", "Doe")}
              </div>

              {field("dateOfBirth", "Date of birth", "date")}

              {field("ssn", "Social Security Number", "text", "123-45-6789",
                "Required for identity verification. Never stored on our servers.")}

              {field("phone", "Phone number", "tel", "(555) 555-5555")}

              {field("street", "Street address", "text", "123 Main St")}

              <div className="grid grid-cols-2 gap-4">
                {field("city", "City", "text", "New York")}
                <div className="flex flex-col gap-1">
                  <label htmlFor="state" className="text-sm font-semibold text-slate-700">State</label>
                  <select
                    id="state"
                    required
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Select…</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {field("postalCode", "ZIP code", "text", "10001")}

              {formError && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Opening your account…" : "Open Banking Account"}
              </button>

              <p className="text-center text-xs text-slate-400">
                By continuing you agree to the banking terms. Banking services provided by Unit and its bank partners.
              </p>
            </form>
          </div>
        )}

        {/* Unit white-label app — customer exists */}
        {status === "ready" && !scriptReady && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-slate-400">Initializing banking interface…</span>
          </div>
        )}

        {status === "ready" && scriptReady && token && (
          <div className="flex-1 w-full">
            {/* @ts-ignore – custom web component */}
            <unit-elements-white-label-app jwt-token={token} />
          </div>
        )}
      </div>
    </>
  );
}
