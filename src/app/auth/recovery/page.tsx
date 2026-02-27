"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

/**
 * Handles auth redirects from Supabase when tokens are in the URL hash fragment.
 * The hash (#access_token=...&type=recovery) is never sent to the server, so we need
 * a client page to parse it, set the session, and redirect to the update-password page.
 */
export default function AuthRecoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleRecovery() {
      const next = searchParams.get("next") ?? "/update-password";

      // 1. Check for tokens in hash fragment (implicit flow - password reset, magic link)
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && refreshToken && type === "recovery") {
          const supabase = createClient();
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (cancelled) return;
          if (error) {
            setStatus("error");
            setErrorMsg(error.message);
            return;
          }
          setStatus("success");
          router.replace(next);
          return;
        }
      }

      // 2. Check for code in query (PKCE flow - some Supabase configs use this)
      const code = searchParams.get("code");
      if (code) {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
          return;
        }
        setStatus("success");
        router.replace(next);
        return;
      }

      // No tokens or code found - redirect to login
      setStatus("error");
      setErrorMsg("Invalid or expired reset link. Please request a new one.");
    }

    handleRecovery();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <BrandMark fullLogo variant="light" />
        </Link>
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-red-800">Reset link invalid</h1>
          <p className="mt-2 text-red-700">{errorMsg}</p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Request a new reset link →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
        <BrandMark fullLogo variant="light" />
      </Link>
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-slate-600">Setting up your session...</p>
      </div>
    </div>
  );
}
