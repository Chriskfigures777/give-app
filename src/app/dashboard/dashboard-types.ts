/** Donation row as returned from server with joined org, campaign, endowment names */
export type DonationRow = {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string | null;
  organization_id: string | null;
  donor_email: string | null;
  donor_name: string | null;
  currency: string;
  campaign_id: string | null;
  endowment_fund_id: string | null;
  organizations: { name: string; slug: string } | null;
  donation_campaigns: { name: string } | null;
  endowment_funds: { name: string } | null;
};

/** Organization row for dashboard (with totalDonations computed client-side if needed) */
export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
  created_at: string | null;
  onboarding_completed: boolean | null;
  totalDonations?: number; // computed from donations
};

/** Flat donation for client filters/tables (camelCase for consistency with New Dashbord design) */
export type DonationFlat = {
  id: string;
  donationId: string;
  amount_cents: number;
  amount: number; // dollars for display
  status: string;
  createdAt: string | null;
  organization_id: string | null;
  orgName: string;
  donorEmail: string | null;
  donorName: string | null;
  currency: string;
  campaign: string | null;
  endowment: string | null;
};

/** Org row for table with totalDonations */
export type OrganizationFlat = {
  id: string;
  name: string;
  slug: string;
  email: string; // website_url or "—"
  type: string | null;
  status: string; // active/inactive from onboarding_completed
  totalDonations: number;
  createdAt: string | null;
};
