# Email Address Setup for Nonprofits & Churches (Website Builder)

This guide explains how organizations on the **Website** or **Pro** plan can create professional email addresses (e.g. `pastor@yourchurch.org`, `info@yournpo.org`) tied to their custom domain.

> **Support tip:** Most orgs can handle this entirely in their domain registrar (GoDaddy, Google Domains, etc.) — no need to touch Give's DNS panel at all. A quick phone walkthrough is usually the fastest path.

---

## How to Know Where to Add MX Records

This depends on how the org connected their domain to Give:

| How their domain is connected | Where to add MX records |
|---|---|
| **CNAME method** — they just added a `www` CNAME at their registrar | **At their registrar** (GoDaddy, Google Domains, Namecheap, etc.) — easiest path |
| **Nameserver method** — they clicked "Configure DNS" in Give (NS records now point to AWS Route 53) | **In Give's DNS panel** — Settings → Custom Domains → Manage DNS Records |

**Not sure which method they used?** Ask them to log into their registrar and check their nameservers:
- If nameservers say something like `ns-123.awsdns-12.com` → they're on the Nameserver method
- If nameservers are still GoDaddy/Google/Namecheap defaults → they're on the CNAME method (most common)

---

## Step 1 — Choose an Email Hosting Provider

| Provider | Cost | Notes |
|---|---|---|
| **Google Workspace** | Free for nonprofits via [Google for Nonprofits](https://www.google.com/nonprofits/) | Most popular; best to recommend first |
| **Microsoft 365** | Donated licenses via [Microsoft Nonprofit](https://nonprofit.microsoft.com/) | Good if they're already using Office |
| **Zoho Mail** | Free up to 5 users | Solid budget option for small churches |
| **Fastmail** | ~$3/user/mo | Simple setup, privacy-focused |

> **Always check Google for Nonprofits or Microsoft Nonprofit first** — most 501(c)(3)s and churches qualify and can get email hosting at no cost.

---

## Step 2 — Confirm Their Custom Domain is Verified on Give

1. Dashboard → Settings → Custom Domains
2. Domain should show a green **Verified** badge
3. If not, complete domain verification before setting up email

---

## Step 3A — Adding MX Records at Their Registrar (Most Common)

If they're on the **CNAME method**, walk them through this in their registrar's DNS settings:

### GoDaddy
1. Log in → My Products → find domain → **DNS**
2. Click **Add New Record**
3. Type: `MX` | Name: `@` | Value: *(mail server from provider)* | Priority: *(number from provider)*
4. Repeat for each MX record → Save

### Google Domains / Google Squarespace (now Squarespace Domains)
1. Log in → select domain → **DNS** tab
2. Scroll to Custom Records → **Manage Custom Records**
3. Add each MX record (Type: MX, Host: leave blank or `@`, Value: mail server, Priority: number)

### Namecheap
1. Log in → Domain List → **Manage** → Advanced DNS
2. Add New Record → Type: `MX Record` | Host: `@` | Value: mail server | Priority: number

### Cloudflare
1. Log in → select domain → **DNS** tab
2. Add Record → Type: `MX` | Name: `@` | Mail server: *(from provider)* | Priority: number
3. Make sure the proxy is **off** (gray cloud) for MX records

---

## Step 3B — Adding MX Records in Give's DNS Panel (Nameserver Method Only)

If their nameservers point to Route 53:

1. Dashboard → Settings → Custom Domains
2. Click **Manage DNS Records** for their domain
3. For each MX record:
   - **Type:** `MX`
   - **Name:** `@`
   - **Value:** mail server hostname from their email provider
   - **Priority:** number their provider specifies
   - **TTL:** `3600`
4. Click **Save** for each record

---

## MX Record Values by Provider

### Google Workspace

| Priority | Value |
|---|---|
| 1 | `aspmx.l.google.com` |
| 5 | `alt1.aspmx.l.google.com` |
| 5 | `alt2.aspmx.l.google.com` |
| 10 | `alt3.aspmx.l.google.com` |
| 10 | `alt4.aspmx.l.google.com` |

### Microsoft 365

| Priority | Value |
|---|---|
| 0 | `yourorg-com.mail.protection.outlook.com` |

*(Microsoft shows the exact hostname in their admin portal — it includes their domain name)*

### Zoho Mail

| Priority | Value |
|---|---|
| 10 | `mx.zoho.com` |
| 20 | `mx2.zoho.com` |
| 50 | `mx3.zoho.com` |

---

## Step 4 — Add SPF / DKIM / DMARC (Recommended for Deliverability)

These TXT records prevent emails from landing in spam. Add them wherever MX records live (registrar or Give DNS panel):

| Type | Name | What it does |
|---|---|---|
| `TXT` | `@` | **SPF** — tells the internet which servers are allowed to send from their domain |
| `TXT` or `CNAME` | `google._domainkey` *(varies by provider)* | **DKIM** — cryptographic signature on outgoing email |
| `TXT` | `_dmarc` | **DMARC** — instructs receivers what to do if SPF/DKIM fails |

The email provider's setup wizard will give them the exact values to copy/paste.

---

## Step 5 — Create Email Addresses

In the email provider's admin console, create mailboxes for the team:

| Use Case | Suggested Address |
|---|---|
| General contact | `info@yourorg.org` |
| Pastoral / leadership | `pastor@yourchurch.org` |
| Giving / donations | `giving@yourorg.org` |
| Volunteers | `volunteer@yourchurch.org` |
| Events | `events@yourorg.org` |
| Office / admin | `admin@yourorg.org` |

Adding more addresses later requires no DNS changes — just add users or aliases in the provider's admin console.

---

## Step 6 — Update Website Form Forwarding in Give

Tell Give where to send contact-form submissions from their website:

1. Dashboard → Settings → Website Forms
2. **Forward email** → set to the inbox that should receive inquiries (e.g. `info@yourchurch.org`)
3. **Reply name** → their org name (e.g. `Grace Community Church`)
4. **Auto-reply** → enable if they want visitors to get a confirmation email
5. Save

---

## Troubleshooting

**Emails not arriving after adding MX records**
- DNS takes up to 24–48 hours to propagate — wait and check again
- Use [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) to verify records are live
- Remove any old/conflicting MX records that may still be there

**Form submissions not forwarding**
- Check the Forward email is saved correctly in Settings → Website Forms
- Check spam folder — first emails from a new domain often land there
- Confirm domain shows Verified in Settings → Custom Domains

**SPF/DKIM failures or email landing in spam**
- Copy the TXT values exactly from the provider — even one character off breaks it
- Some providers use CNAME for DKIM instead of TXT — use whatever type they specify
- Allow 1 hour after saving for TXT records to propagate

---

## Related Codebase Files

| File | Purpose |
|---|---|
| [src/app/dashboard/settings/dns-records-panel.tsx](../src/app/dashboard/settings/dns-records-panel.tsx) | Give's DNS panel UI (MX, TXT, CNAME, etc.) |
| [src/app/dashboard/settings/custom-domains-form.tsx](../src/app/dashboard/settings/custom-domains-form.tsx) | Domain list and verification status |
| [src/app/dashboard/settings/website-forms-settings.tsx](../src/app/dashboard/settings/website-forms-settings.tsx) | Forward email, reply name, auto-reply config |
| [src/app/api/organization-website/domains/route.ts](../src/app/api/organization-website/domains/route.ts) | API — add/verify/delete custom domains |
| [src/lib/route53.ts](../src/lib/route53.ts) | Route 53 DNS helpers |
