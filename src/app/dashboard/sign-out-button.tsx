"use client";

/**
 * Clears Unit banking localStorage keys before posting to the signout route.
 * Required per Unit docs: session tokens must be cleared on logout.
 */
export function SignOutButton() {
  function handleSignOut() {
    try {
      localStorage.removeItem("unitCustomerToken");
      localStorage.removeItem("unitVerifiedCustomerToken");
    } catch {
      // localStorage may be unavailable in some contexts
    }
  }

  return (
    <form action="/api/auth/signout" method="POST" className="mt-0.5">
      <button
        type="submit"
        onClick={handleSignOut}
        className="h-auto p-0 text-xs font-medium text-dashboard-text-muted hover:text-dashboard-text bg-transparent border-none cursor-pointer"
      >
        Sign out
      </button>
    </form>
  );
}
