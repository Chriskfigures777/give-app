import { redirect } from "next/navigation";

/** Redirect legacy /dashboard/customization to Website form */
export default function CustomizationPage() {
  redirect("/dashboard/website-form");
}
