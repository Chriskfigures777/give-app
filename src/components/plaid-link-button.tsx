"use client";

import { useCallback } from "react";
import { usePlaidLink, type PlaidLinkOnExit } from "react-plaid-link";

export type PlaidLinkSuccessMetadata = {
  accounts?: { id: string; name?: string; mask?: string; type?: string }[];
  institution?: { id: string; name: string };
};

type Props = {
  linkToken: string | null;
  onSuccess: (
    publicToken: string,
    metadata: PlaidLinkSuccessMetadata
  ) => void | Promise<void>;
  onExit?: PlaidLinkOnExit;
  disabled?: boolean;
  children: React.ReactNode;
};

export function PlaidLinkButton({
  linkToken,
  onSuccess,
  onExit,
  disabled,
  children,
}: Props) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      onSuccess(publicToken, metadata as unknown as PlaidLinkSuccessMetadata);
    },
    onExit,
  });

  const handleClick = useCallback(() => {
    if (ready && !disabled) open();
  }, [ready, disabled, open]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready || disabled}
      className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
