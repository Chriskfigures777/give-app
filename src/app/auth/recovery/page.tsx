import { Suspense } from "react";
import { AuthRecoveryClient } from "./recovery-client";

export const dynamic = "force-dynamic";

export default function AuthRecoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthRecoveryClient />
    </Suspense>
  );
}
