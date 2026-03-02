import { createRemoteJWKSet, jwtVerify } from "jose";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN ?? process.env.NEXT_PUBLIC_AUTH0_DOMAIN;

export async function verifyAuth0Token(token: string): Promise<{ sub: string } | null> {
  if (!AUTH0_DOMAIN) return null;
  const issuer = AUTH0_DOMAIN.startsWith("http") ? AUTH0_DOMAIN : `https://${AUTH0_DOMAIN}`;
  const jwksUrl = `${issuer.replace(/\/$/, "")}/.well-known/jwks.json`;

  try {
    const issuerUrl = issuer.replace(/\/$/, "");
    const { payload } = await jwtVerify(token, createRemoteJWKSet(new URL(jwksUrl)), {
      issuer: `${issuerUrl}/`,
    });
    const sub = payload.sub as string;
    return sub ? { sub } : null;
  } catch {
    return null;
  }
}
