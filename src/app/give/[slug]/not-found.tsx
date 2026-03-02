export default function GiveNotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6 gap-4"
      style={{
        background: "var(--stripe-light-grey)",
        color: "var(--stripe-dark)",
      }}
    >
      <h1 className="text-8xl font-bold tracking-tight">404</h1>
      <p className="text-lg opacity-80">This donation form isn’t available.</p>
      <p className="text-sm opacity-70">
        The organization may not exist or Stripe hasn’t been connected yet.
      </p>
    </main>
  );
}
