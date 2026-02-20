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
    <main className="relative min-h-screen overflow-hidden bg-[#f8fafb]">
      {/* Layered ambient gradient mesh */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[30%] -left-[10%] h-[800px] w-[800px] rounded-full bg-emerald-100/50 blur-[140px]" />
        <div className="absolute -top-[10%] right-[5%] h-[600px] w-[600px] rounded-full bg-teal-100/40 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[500px] w-[500px] rounded-full bg-cyan-50/40 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[400px] w-[500px] rounded-full bg-violet-50/20 blur-[100px]" />
      </div>
      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-[1680px] justify-start gap-6 px-4 py-6 sm:px-6 lg:gap-8 xl:gap-10 xl:px-10">
        <FeedClient />
      </div>
    </main>
  );
}
