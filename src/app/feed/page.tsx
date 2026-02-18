import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { FeedClient } from "./feed-client";

export default async function FeedPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      {/* Ambient gradient orbs for depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[400px] left-1/4 h-[800px] w-[800px] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute -top-[200px] right-1/4 h-[600px] w-[600px] rounded-full bg-teal-100/30 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[600px] rounded-full bg-cyan-50/30 blur-[80px]" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[1680px] justify-start gap-6 px-4 py-6 sm:px-6 lg:gap-8 xl:gap-10 xl:px-10">
        <FeedClient />
      </div>
    </main>
  );
}
