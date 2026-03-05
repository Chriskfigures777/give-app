import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { isBankingReturnTo, buildBankingCallbackRedirectUrl } from "@/lib/banking-redirect";

const LOG = (msg: string, d?: object, _hypothesisId?: string) => {
  if (process.env.NODE_ENV === "development") {
    console.error("[signup]", msg, d ?? "");
  }
};

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    LOG("signup route hit", {});
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      role,
      plansToBeMissionary,
      organizationName,
      churchRole,
      needsTechIntegrationHelp,
      willingToPayTechHelp,
      ownsBusinessOutsideChurch,
      businessDescription,
      businessEmail,
      desiredTools,
      marketingConsent,
    } = body as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: string;
      plansToBeMissionary?: boolean;
      organizationName?: string;
      churchRole?: string;
      needsTechIntegrationHelp?: string;
      willingToPayTechHelp?: string;
      ownsBusinessOutsideChurch?: string;
      businessDescription?: string;
      businessEmail?: string;
      desiredTools?: string;
      marketingConsent?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // #region agent log
    const t0 = Date.now();
    LOG("createClient start", {}, "H1");
    // #endregion
    const { url: supabaseUrl, anonKey } = getSupabaseEnv();
    let healthRes: Response | null = null;
    try {
      healthRes = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, {
        method: "GET",
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      healthRes = null;
    }
    if (!healthRes?.ok) {
      LOG("health check failed", { status: healthRes?.status }, "H7");
      return NextResponse.json(
        { error: "Cannot reach Supabase. Check your connection or project status." },
        { status: 503 }
      );
    }
    const supabase = await createClient();
    // #region agent log
    LOG("createClient done", { ms: Date.now() - t0 }, "H1");
    const t1 = Date.now();
    LOG("signUp start", {}, "H1");
    // #endregion

    let emailRedirectTo =
      typeof body.emailRedirectTo === "string" ? body.emailRedirectTo : undefined;
    const returnTo = typeof body.return_to === "string" ? body.return_to : undefined;
    // Exchange Banking: when return_to is the allowlisted banking callback, send confirmation link to BankGO.
    if (returnTo && isBankingReturnTo(returnTo)) {
      emailRedirectTo = buildBankingCallbackRedirectUrl("/dashboard");
    }
    // Fallback: use app URL so email links go to /auth/callback, not root.
    if (!emailRedirectTo) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.DOMAIN ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
        (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
      if (appUrl) {
        emailRedirectTo = `${appUrl.replace(/\/$/, "")}/auth/callback`;
      }
    }

    const signUpOpts = {
      email,
      password,
      options: {
        emailRedirectTo: emailRedirectTo || undefined,
        data: {
          full_name: fullName || "",
          role: role || "donor",
          ...(typeof plansToBeMissionary === "boolean" ? { plans_to_be_missionary: plansToBeMissionary } : {}),
          ...(organizationName?.trim()
            ? { organization_name: organizationName.trim() }
            : {}),
          ...(churchRole?.trim() ? { church_role: churchRole.trim() } : {}),
          ...(needsTechIntegrationHelp ? { needs_tech_integration_help: needsTechIntegrationHelp } : {}),
          ...(willingToPayTechHelp ? { willing_to_pay_tech_help: willingToPayTechHelp } : {}),
          ...(ownsBusinessOutsideChurch ? { owns_business_outside_church: ownsBusinessOutsideChurch } : {}),
          ...(businessDescription?.trim() ? { business_description: businessDescription.trim() } : {}),
          ...(businessEmail?.trim() ? { business_email: businessEmail.trim() } : {}),
          ...(desiredTools?.trim() ? { desired_tools: desiredTools.trim() } : {}),
          ...(marketingConsent ? { marketing_consent: marketingConsent } : {}),
        },
      },
    };

    const timeoutMs = 25000;
    const runSignUp = () => {
      const signUpPromise = supabase.auth.signUp(signUpOpts);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      );
      return Promise.race([signUpPromise, timeoutPromise]) as Promise<Awaited<ReturnType<typeof supabase.auth.signUp>>>;
    };

    let result: Awaited<ReturnType<typeof supabase.auth.signUp>>;
    try {
      result = await runSignUp();
    } catch (firstErr) {
      if ((firstErr as Error)?.message !== "timeout") throw firstErr;
      // #region agent log
      LOG("signUp timeout, retrying with fresh client", { ms: Date.now() - t1 }, "H10");
      // #endregion
      const freshSupabase = await createClient();
      const runSignUpFresh = () => {
        const p = freshSupabase.auth.signUp(signUpOpts);
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeoutMs)
        );
        return Promise.race([p, timeout]) as Promise<Awaited<ReturnType<typeof supabase.auth.signUp>>>;
      };
      try {
        result = await runSignUpFresh();
      } catch (retryErr) {
        if ((retryErr as Error)?.message === "timeout") {
          return NextResponse.json(
            { error: "Supabase is taking too long. Please check your connection and try again." },
            { status: 504 }
          );
        }
        throw retryErr;
      }
    }

    const { data, error } = result;
    // #region agent log
    LOG("signUp done", { hasError: !!error, hasSession: !!data?.session, ms: Date.now() - t1 }, "H1");
    // #endregion

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // When email confirmation is enabled, Supabase returns success with empty identities if user already exists
    const identities = data?.user?.identities ?? [];
    if (identities.length === 0 && !data?.session) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: { session: data.session, user: data.user },
      error: null,
    });
  } catch (e) {
    // #region agent log
    LOG("signup route error", { err: e instanceof Error ? e.message : String(e) }, "H1");
    // #endregion
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Signup failed" },
      { status: 500 }
    );
  }
}
