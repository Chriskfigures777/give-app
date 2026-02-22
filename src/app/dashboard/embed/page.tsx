import { redirect } from "next/navigation";

/** Redirect legacy embed URL to Customization (org-only section). */
export default function EmbedPage() {
  redirect("/dashboard/website-form");
}
