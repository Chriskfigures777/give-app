"use client";

import { usePathname } from "next/navigation";
import { SiteNav } from "./site-nav";

/** Renders SiteNav only when not on an embed route (embed = no nav). */
export function NavWrapper() {
  const pathname = usePathname();
  const isEmbed = pathname?.includes("/embed");
  if (isEmbed) return null;
  return <SiteNav />;
}
