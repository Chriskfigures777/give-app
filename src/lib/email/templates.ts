/**
 * Transactional email templates. Plain HTML, no marketing content.
 */

const BASE_STYLES = `
  body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  .amount { font-size: 1.5rem; font-weight: 600; color: #059669; }
  .muted { color: #64748b; font-size: 0.875rem; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #94a3b8; }
`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type DonationReceivedParams = {
  donorName: string | null;
  amountFormatted: string;
  organizationName: string;
  dateFormatted: string;
};

export function donationReceivedHtml(params: DonationReceivedParams): string {
  const name = params.donorName ? escapeHtml(params.donorName) : "Donor";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Donation Confirmation</title></head>
<body style="${BASE_STYLES}">
  <h1 style="font-size: 1.25rem; margin-bottom: 16px;">Thank you for your donation</h1>
  <p>Hi ${name},</p>
  <p>Your donation has been received and processed.</p>
  <p><strong>Amount:</strong> <span class="amount">${escapeHtml(params.amountFormatted)}</span></p>
  <p><strong>Organization:</strong> ${escapeHtml(params.organizationName)}</p>
  <p><strong>Date:</strong> ${escapeHtml(params.dateFormatted)}</p>
  <p>Thank you for your support.</p>
  <div class="footer">
    <p>This is a transactional confirmation. No promotional content.</p>
  </div>
</body>
</html>`;
}

export type ReceiptAttachedParams = {
  donorName: string | null;
  amountFormatted: string;
  organizationName: string;
  receiptId: string;
  receiptUrl: string;
  dateFormatted: string;
};

export function receiptAttachedHtml(params: ReceiptAttachedParams): string {
  const name = params.donorName ? escapeHtml(params.donorName) : "Donor";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Receipt</title></head>
<body style="${BASE_STYLES}">
  <h1 style="font-size: 1.25rem; margin-bottom: 16px;">Your donation receipt</h1>
  <p>Hi ${name},</p>
  <p>Your tax receipt for your donation is ready.</p>
  <p><strong>Amount:</strong> <span class="amount">${escapeHtml(params.amountFormatted)}</span></p>
  <p><strong>Organization:</strong> ${escapeHtml(params.organizationName)}</p>
  <p><strong>Date:</strong> ${escapeHtml(params.dateFormatted)}</p>
  <p><strong>Receipt ID:</strong> <code style="font-size: 0.875rem;">${escapeHtml(params.receiptId)}</code></p>
  <p><a href="${escapeHtml(params.receiptUrl)}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 6px;">View receipt</a></p>
  <p class="muted" style="margin-top: 24px;">This receipt is for your records. No goods or services were provided in exchange for this donation. For tax purposes, please retain this receipt.</p>
  <div class="footer">
    <p>Tax-deductible status depends on the organization's 501(c)(3) status. Consult your tax advisor.</p>
  </div>
</body>
</html>`;
}

export type OrgDonationReceivedParams = {
  organizationName: string;
  amountFormatted: string;
  donorNameOrEmail: string;
  dateFormatted: string;
};

export function orgDonationReceivedHtml(params: OrgDonationReceivedParams): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Donation Received</title></head>
<body style="${BASE_STYLES}">
  <h1 style="font-size: 1.25rem; margin-bottom: 16px;">New donation received</h1>
  <p>Your organization received a new donation.</p>
  <p><strong>Organization:</strong> ${escapeHtml(params.organizationName)}</p>
  <p><strong>Amount:</strong> <span class="amount">${escapeHtml(params.amountFormatted)}</span></p>
  <p><strong>From:</strong> ${escapeHtml(params.donorNameOrEmail)}</p>
  <p><strong>Date:</strong> ${escapeHtml(params.dateFormatted)}</p>
  <div class="footer">
    <p>This is a transactional notification.</p>
  </div>
</body>
</html>`;
}

export type PayoutProcessedParams = {
  organizationName: string;
  amountFormatted: string;
  destination: string;
  dateFormatted: string;
};

export function payoutProcessedHtml(params: PayoutProcessedParams): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payout Processed</title></head>
<body style="${BASE_STYLES}">
  <h1 style="font-size: 1.25rem; margin-bottom: 16px;">Your payout was processed</h1>
  <p>Your organization's payout has been completed.</p>
  <p><strong>Organization:</strong> ${escapeHtml(params.organizationName)}</p>
  <p><strong>Amount:</strong> <span class="amount">${escapeHtml(params.amountFormatted)}</span></p>
  <p><strong>Destination:</strong> ${escapeHtml(params.destination)}</p>
  <p><strong>Processing date:</strong> ${escapeHtml(params.dateFormatted)}</p>
  <p>Funds should arrive in your bank account within 1–3 business days.</p>
  <div class="footer">
    <p>This is a transactional notification. No donor details are included.</p>
  </div>
</body>
</html>`;
}

export type ConfirmEmailParams = {
  confirmUrl: string;
  expiresInHours: number;
};

export function confirmEmailHtml(params: ConfirmEmailParams): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Confirm your email</title></head>
<body style="${BASE_STYLES}">
  <h1 style="font-size: 1.25rem; margin-bottom: 16px;">Confirm your email</h1>
  <p>Please confirm your email address by clicking the link below.</p>
  <p><a href="${escapeHtml(params.confirmUrl)}" style="display: inline-block; margin: 16px 0; padding: 10px 20px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 6px;">Confirm email</a></p>
  <p class="muted">This link expires in ${params.expiresInHours} hours. If you did not request this, you can ignore this email.</p>
  <div class="footer">
    <p>This is a secure confirmation. No marketing content.</p>
  </div>
</body>
</html>`;
}
