import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { FeedClient } from "./feed-client";

export const metadata = {
  title: "Feed — Community",
};

export default async function FeedPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      {/* Ambient gradient orbs — matches explore/dashboard */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[30%] -left-[10%] h-[600px] w-[600px] rounded-full bg-emerald-100/30 blur-[120px]" />
        <div className="absolute -top-[10%] right-[5%] h-[500px] w-[500px] rounded-full bg-teal-100/25 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-cyan-50/20 blur-[80px]" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[1680px] justify-start gap-8 px-4 py-8 sm:px-6 lg:gap-10 xl:gap-12 xl:px-10">
        <FeedClient />
      </div>
    </main>
  );
}
