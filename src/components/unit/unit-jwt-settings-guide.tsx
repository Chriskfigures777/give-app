"use client";

import { CollapsibleSection } from "@/components/collapsible-section";
import { Shield, AlertCircle } from "lucide-react";

/**
 * Unit JWT Settings Guide
 *
 * Documents the JWKS path and issuer configuration for Unit's JWT-based
 * customer token authentication. Unit supports Auth0, Stytch, and Amazon Cognito.
 *
 * Per Unit docs: Configure JWKs path in Unit Dashboard → Settings → Org Settings → JWT Settings.
 * JWT "sub" (subject) identifies the user and is associated with the Unit Customer resource.
 */
export function UnitJwtSettingsGuide() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-dashboard-text">Unit JWT Authentication</h3>
            <p className="mt-1 text-sm text-dashboard-text-muted">
              Unit uses your IdP&apos;s JWT to obtain customer tokens. Configure the JWKs path in Unit
              Dashboard → Settings → Org Settings → JWT Settings. Enforce 2FA and 24h expiration.
            </p>
          </div>
        </div>
      </div>

      <CollapsibleSection title="Auth0" defaultOpen={true} variant="card">
        <div className="space-y-3 p-4 text-sm">
          <div>
            <span className="font-medium text-dashboard-text-muted">JWKS Path:</span>
            <code className="ml-2 block rounded bg-dashboard-bg px-2 py-1 font-mono text-xs text-dashboard-text">
              https://&lt;domain-name&gt;.auth0.com/.well-known/jwks.json
            </code>
          </div>
          <div>
            <span className="font-medium text-dashboard-text-muted">Custom Domain (if defined):</span>
            <p className="mt-1 text-dashboard-text-muted">
              Add to JWT Settings in format: <code className="rounded bg-dashboard-bg px-1">https://../</code>{" "}
              (without .well-known/jwks.json)
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Stytch" defaultOpen={false} variant="card">
        <div className="space-y-3 p-4 text-sm">
          <div>
            <span className="font-medium text-dashboard-text-muted">JWKS Path:</span>
            <code className="ml-2 block rounded bg-dashboard-bg px-2 py-1 font-mono text-xs text-dashboard-text">
              https://[live|test].stytch.com/v1/sessions/jwks/&lt;project-id&gt;
            </code>
          </div>
          <div>
            <span className="font-medium text-dashboard-text-muted">Issuer (if not default):</span>
            <p className="mt-1 text-dashboard-text-muted">
              If issuer is not <code className="rounded bg-dashboard-bg px-1">stytch.com/&lt;project-id&gt;</code>,
              add the correct issuer under JWT Settings.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Amazon Cognito" defaultOpen={false} variant="card">
        <div className="space-y-3 p-4 text-sm">
          <div>
            <span className="font-medium text-dashboard-text-muted">JWKS Path:</span>
            <code className="ml-2 block rounded bg-dashboard-bg px-2 py-1 font-mono text-xs text-dashboard-text">
              https://cognito-idp.&lt;region&gt;.amazonaws.com/&lt;user-pool-id&gt;/.well-known/jwks.json
            </code>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Custom with JWKS (e.g. Supabase)" defaultOpen={false} variant="card">
        <div className="space-y-3 p-4 text-sm">
          <div>
            <span className="font-medium text-dashboard-text-muted">JWKS Path:</span>
            <code className="ml-2 block rounded bg-dashboard-bg px-2 py-1 font-mono text-xs text-dashboard-text">
              https://&lt;project-ref&gt;.supabase.co/auth/v1/.well-known/jwks.json
            </code>
          </div>
          <div>
            <span className="font-medium text-dashboard-text-muted">JWT Issuer:</span>
            <code className="ml-2 block rounded bg-dashboard-bg px-2 py-1 font-mono text-xs text-dashboard-text">
              https://&lt;project-ref&gt;.supabase.co/auth/v1
            </code>
          </div>
          <div>
            <span className="font-medium text-dashboard-text-muted">JWT Audience:</span>
            <code className="ml-2 rounded bg-dashboard-bg px-2 py-1 font-mono text-xs text-dashboard-text">
              authenticated
            </code>
          </div>
        </div>
      </CollapsibleSection>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            JWT requirements for customer token
          </p>
          <p className="mt-1 text-amber-700 dark:text-amber-300">
            Configure your IdP to enforce two-factor authentication and a 24-hour token expiration.
            Individual customers need <code className="rounded px-1">jwtSubject</code> or{" "}
            <code className="rounded px-1">AuthorizedUser&apos;s jwtSubject</code>. Business customers
            need Contact&apos;s or AuthorizedUser&apos;s jwtSubject.
          </p>
        </div>
      </div>
    </div>
  );
}
