import { redirect } from "next/navigation";

/**
 * Demo page was removed. Redirect to the real banking page.
 * Handles old bookmarks and cached links.
 */
export default function BankingDemoRedirect() {
  redirect("/dashboard/banking");
}
