"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  organizationName: string;
  slug: string;
  frequency: "monthly" | "yearly";
  onSuccess: () => void;
  onCancel: () => void;
  accentColor?: string;
  accentText?: string;
  borderRadius?: string;
};

export function InlineAuthForm({
  organizationName,
  slug,
  frequency,
  onSuccess,
  onCancel,
  accentColor = "#374151",
  accentText = "#fff",
  borderRadius = "8px",
}: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const inputBorder = "#e5e7eb";
  const inputBg = "#fff";
  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    fontSize: "15px",
    padding: "12px 14px",
    border: `1px solid ${inputBorder}`,
    borderRadius,
    background: inputBg,
    color: "var(--stripe-dark, #1a1a2e)",
    outline: "none",
  };

  async function saveOrganization() {
    try {
      await fetch("/api/donor/save-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
    } catch {
      // Non-blocking
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    await saveOrganization();
    onSuccess();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    let res: Response;
    try {
      res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role: "donor",
          plansToBeMissionary: false,
          emailRedirectTo: `${window.location.origin}/give/${encodeURIComponent(slug)}/embed?frequency=${encodeURIComponent(frequency)}`,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      setLoading(false);
      const msg = fetchErr instanceof Error ? fetchErr.message : "Request failed";
      setError(msg === "The operation was aborted." ? "Request timed out. Please try again." : msg);
      return;
    }

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Signup failed");
      return;
    }

    if (json.data?.session) {
      await saveOrganization();
      onSuccess();
      return;
    }
    setMessage("Check your email to confirm your account, then come back and sign in.");
    setMode("login");
  }

  const frequencyLabel = frequency === "monthly" ? "monthly" : "yearly";

  return (
    <div
      className="space-y-4"
      style={{
        padding: "20px",
        border: `1px solid ${inputBorder}`,
        borderRadius,
        background: "#f8f9fa",
      }}
    >
      <div className="text-center space-y-1">
        <h3 className="text-base font-semibold text-slate-800">
          {mode === "login" ? "Sign in" : "Create an account"}
        </h3>
        <p className="text-sm text-slate-500 leading-snug">
          {mode === "login"
            ? `Sign in to set up your ${frequencyLabel} donation to ${organizationName}. This lets you manage and cancel recurring gifts.`
            : `Create a free account to manage your ${frequencyLabel} donation to ${organizationName}.`}
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {message && (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
          role="status"
        >
          <p className="text-sm text-emerald-700">{message}</p>
        </div>
      )}

      <form
        onSubmit={mode === "login" ? handleLogin : handleSignup}
        className="space-y-3"
      >
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password{mode === "signup" ? " (min 6 characters)" : ""}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Choose a password" : "Your password"}
            required
            minLength={mode === "signup" ? 6 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 font-medium rounded-lg flex items-center justify-center gap-2"
          style={{
            background: accentColor,
            color: accentText,
            border: "none",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
            borderRadius,
            fontSize: "15px",
          }}
        >
          {loading
            ? (mode === "login" ? "Signing in..." : "Creating account...")
            : (mode === "login" ? "Sign in & continue" : "Create account & continue")}
        </button>
      </form>

      <div className="text-center space-y-2 pt-1">
        {mode === "login" ? (
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
              className="font-semibold text-emerald-600 hover:text-emerald-700 bg-transparent border-none cursor-pointer"
              style={{ padding: 0, fontSize: "inherit" }}
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); setMessage(null); }}
              className="font-semibold text-emerald-600 hover:text-emerald-700 bg-transparent border-none cursor-pointer"
              style={{ padding: 0, fontSize: "inherit" }}
            >
              Sign in
            </button>
          </p>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
          style={{ padding: 0, fontSize: "inherit" }}
        >
          Back to one-time donation
        </button>
      </div>
    </div>
  );
}
