import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createFetchWithTimeout } from "@/lib/supabase/fetch-with-timeout-edge";

function isAppDomain(host: string): boolean {
  if (host.startsWith("localhost")) return true;
  const appDomains = (process.env.SITE_APP_DOMAIN ?? "give.app,www.give.app")
    .split(",")
    .map((d) => d.trim().toLowerCase());
  const h = host.toLowerCase();
  if (appDomains.some((d) => h === d || h.endsWith("." + d))) return true;
  if (h.endsWith(".vercel.app")) return true;
  return false;
}

function getSiteRewrite(req: NextRequest): NextResponse | null {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  // Never rewrite *.vercel.app — "give-app78" is the project name, not an org subdomain
  if (host.toLowerCase().endsWith(".vercel.app")) return null;
  const parts = host.split(".");
  if (parts.length < 3) return null;
  const subdomain = parts[0];
  if (!subdomain || subdomain === "www") return null;
  const url = req.nextUrl.clone();
  const pathname = url.pathname === "/" ? "" : url.pathname;
  const newPath = `/site/${subdomain}${pathname}`;
  url.pathname = newPath || "/";
  return NextResponse.rewrite(url);
}

async function getCustomDomainRewrite(req: NextRequest): Promise<NextResponse | null> {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  if (isAppDomain(host)) return null;

  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) return null;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: row } = await supabase
    .from("organization_domains")
    .select("organizations!inner(slug)")
    .eq("domain", host)
    .eq("status", "verified")
    .limit(1)
    .single();

  const slug = (row as { organizations?: { slug: string } } | null)?.organizations?.slug;
  if (!slug) return null;

  const url = req.nextUrl.clone();
  const pathname = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/site/${slug}${pathname}` || "/";
  return NextResponse.rewrite(url);
}

export async function proxy(req: NextRequest) {
  // Supabase sometimes redirects to /?code=xxx when redirectTo is rejected or missing.
  // Forward to /auth/callback so we can exchange the code.
  const url = req.nextUrl;
  if (url.pathname === "/" && url.searchParams.has("code")) {
    const callbackUrl = new URL("/auth/callback", req.url);
    url.searchParams.forEach((v, k) => callbackUrl.searchParams.set(k, v));
    return NextResponse.redirect(callbackUrl);
  }

  const siteRewrite = getSiteRewrite(req);
  if (siteRewrite) return siteRewrite;

  // Skip custom domain lookup for app domain (localhost, give.app) — always null
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const customRewrite = isAppDomain(host) ? null : await getCustomDomainRewrite(req);
  if (customRewrite) return customRewrite;

  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  const supabaseAnonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: createFetchWithTimeout() },
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: req,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do not run code between createServerClient and getUser/getClaims.
  // Proper session refresh here prevents random logouts.
  // On Supabase timeout (network issues), continue as unauthenticated so the app stays responsive.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable: proceed without session refresh
  }

  // Redirect unauthenticated users from /dashboard/* to login, preserving return path (localhost + prod)
  const pathname = url.pathname;
  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", req.url);
    // Safe redirect: only allow relative paths (no protocol-relative or absolute URLs)
    if (pathname.startsWith("/") && !pathname.includes("//")) {
      loginUrl.searchParams.set("redirect", pathname);
    }
    const redirectRes = NextResponse.redirect(loginUrl);
    // Copy any cookies from session refresh (e.g. cleared session) to redirect response
    supabaseResponse.cookies.getAll().forEach((c) => redirectRes.cookies.set(c.name, c.value, c));
    return redirectRes;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Refresh session on all routes that use auth (broad matcher prevents random logouts)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
