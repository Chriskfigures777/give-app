"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { SiteNav } from "./site-nav";
import { useUser } from "@/lib/use-user";
import { useMe } from "@/lib/use-me";

const FloatingChatBubble = dynamic(() => import("./floating-chat-bubble").then((m) => ({ default: m.FloatingChatBubble })), {
  ssr: false,
  loading: () => null,
});

/** Renders SiteNav only when not on an embed route (embed = no nav). */
export function NavWrapper() {
  const pathname = usePathname();
  const { user } = useUser();
  const { me } = useMe();

  const isEmbed = pathname?.includes("/embed");
  const isDashboard = pathname?.startsWith("/dashboard");
  const isLoggedInWithOrg = !!user && !!me?.orgId;
  const showFloatingBubble = !isEmbed && !isDashboard && isLoggedInWithOrg;

  if (isEmbed) return null;
  return (
    <>
      <SiteNav />
      {showFloatingBubble && (
        <Suspense fallback={null}>
          <FloatingChatBubble />
        </Suspense>
      )}
    </>
  );
}
