"use client";

import { Auth0Provider as Auth0ReactProvider } from "@auth0/auth0-react";

const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
const audience = process.env.NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

/**
 * Auth0Provider for banking. Only renders when Auth0 is configured.
 * Used for Unit banking - Unit validates the Auth0 JWT via JWKS.
 */
export function Auth0Provider({ children }: { children: React.ReactNode }) {
  if (!domain || !clientId) {
    return <>{children}</>;
  }

  return (
    <Auth0ReactProvider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== "undefined" ? window.location.origin : appUrl,
        ...(audience && { audience }),
      }}
      cacheLocation="localstorage"
      useRefreshTokens
    >
      {children}
    </Auth0ReactProvider>
  );
}
