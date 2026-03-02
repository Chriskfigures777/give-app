import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { OAuthConsentForm } from "./oauth-consent-form";

type Props = { searchParams: Promise<{ authorization_id?: string }> };

export default async function OAuthConsentPage({ searchParams }: Props) {
  const { authorization_id: authorizationId } = await searchParams;

  if (!authorizationId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Invalid request</h1>
          <p className="mt-2 text-slate-600">
            Missing authorization_id. This page is used when third-party apps request access to your account.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block font-medium text-emerald-600 hover:text-emerald-700"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`
    );
  }

  const { data: authDetails, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

  if (error || !authDetails) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Authorization error</h1>
          <p className="mt-2 text-slate-600">
            {error?.message ?? "Invalid or expired authorization request."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block font-medium text-emerald-600 hover:text-emerald-700"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // OAuthRedirect: user already consented — redirect immediately
  if ("redirect_url" in authDetails) {
    redirect(authDetails.redirect_url);
  }

  // OAuthAuthorizationDetails: show consent page with client info
  const details = authDetails;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <BrandMark fullLogo variant="light" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Authorize {details.client.name}
          </h1>
          <p className="mt-2 text-slate-600">
            This application wants to access your account.
          </p>

          <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Application</p>
              <p className="mt-0.5 font-medium text-slate-900">{details.client.name}</p>
            </div>
            {details.redirect_uri && (
              <div>
                <p className="text-sm font-medium text-slate-500">Redirect URI</p>
                <p className="mt-0.5 break-all text-sm text-slate-700">
                  {details.redirect_uri}
                </p>
              </div>
            )}
            {details.scope && details.scope.trim() && (
              <div>
                <p className="text-sm font-medium text-slate-500">Requested permissions</p>
                <ul className="mt-1.5 space-y-1">
                  {details.scope.split(" ").map((scopeItem) => (
                    <li key={scopeItem} className="text-sm text-slate-700">
                      • {scopeItem}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <OAuthConsentForm authorizationId={authorizationId} />
        </div>
      </main>
    </div>
  );
}
