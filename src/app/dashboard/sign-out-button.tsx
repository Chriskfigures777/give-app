"use client";

import { useAuth0 } from "@auth0/auth0-react";

/**
 * Clears Unit banking localStorage keys before signout.
 * Required per Unit docs: session tokens must be cleared on logout.
 * When Auth0 is configured, also logs out of Auth0 so users can switch accounts.
 */
const USE_AUTH0 = !!(
  process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID
);

function clearUnitTokens() {
  try {
    localStorage.removeItem("unitCustomerToken");
    localStorage.removeItem("unitVerifiedCustomerToken");
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

function FormSignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST" className="mt-0.5">
      <button
        type="submit"
        onClick={clearUnitTokens}
        className="h-auto p-0 text-xs font-medium text-dashboard-text-muted hover:text-dashboard-text bg-transparent border-none cursor-pointer"
      >
        Sign out
      </button>
    </form>
  );
}

function Auth0SignOutButton() {
  const { logout } = useAuth0();

  function handleSignOut(e: React.MouseEvent) {
    e.preventDefault();
    clearUnitTokens();
    const returnTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/auth/signout`
        : "/api/auth/signout";
    logout({ logoutParams: { returnTo, federated: true } });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="h-auto p-0 text-xs font-medium text-dashboard-text-muted hover:text-dashboard-text bg-transparent border-none cursor-pointer"
    >
      Sign out
    </button>
  );
}

export function SignOutButton() {
  return USE_AUTH0 ? <Auth0SignOutButton /> : <FormSignOutButton />;
}
