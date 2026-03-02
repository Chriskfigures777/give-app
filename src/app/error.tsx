"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "hsl(var(--background, #fff))",
        color: "hsl(var(--foreground, #0a0a0a))",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#666", marginBottom: "1.5rem", textAlign: "center", maxWidth: "28rem" }}>
        An error occurred. You can try again or return home.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            backgroundColor: "hsl(var(--primary, #000))",
            color: "hsl(var(--primary-foreground, #fff))",
            border: "none",
            borderRadius: "0.375rem",
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid hsl(var(--border, #e5e5e5))",
            borderRadius: "0.375rem",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          Home
        </a>
        <a
          href="/login"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid hsl(var(--border, #e5e5e5))",
            borderRadius: "0.375rem",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          Sign in
        </a>
      </div>
    </main>
  );
}
