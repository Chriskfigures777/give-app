import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { FeedClient } from "./feed-client";
import { FeedThemeProvider } from "@/components/feed/feed-theme-context";

export const metadata = {
  title: "Feed — Community",
};

export default async function FeedPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  return (
    <FeedThemeProvider>
      <FeedClient />
    </FeedThemeProvider>
  );
}
