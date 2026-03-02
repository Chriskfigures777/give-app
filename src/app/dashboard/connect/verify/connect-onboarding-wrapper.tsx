"use client";

import dynamic from "next/dynamic";

const ConnectOnboardingClient = dynamic(
  () => import("./connect-onboarding-client").then((m) => ({ default: m.ConnectOnboardingClient })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    ),
  }
);

type Props = { publishableKey?: string };

export function ConnectOnboardingWrapper({ publishableKey }: Props) {
  return <ConnectOnboardingClient publishableKey={publishableKey} />;
}
