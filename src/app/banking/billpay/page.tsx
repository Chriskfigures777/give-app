import { redirect } from "next/navigation";

/**
 * Redirect for Unit's Reactivation Billpay Page URL.
 * Unit is configured with /banking/billpay; the actual page lives at /dashboard/banking/billpay.
 */
export default function BankingBillpayRedirect() {
  redirect("/dashboard/banking/billpay");
}
