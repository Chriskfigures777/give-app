import { redirect } from "next/navigation";

/** Website form settings now live in the Website builder. Redirect there with form panel open. */
export default function WebsiteFormPage() {
  redirect("/dashboard/pages?openForm=1");
}
