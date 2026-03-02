"use client";

import dynamic from "next/dynamic";

const ConnectAccountManagementClient = dynamic(
  () => import("./connect-account-management-client"),
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

export function ConnectAccountManagementWrapper({ publishableKey }: Props) {
  return <ConnectAccountManagementClient publishableKey={publishableKey} />;
}
