# Plaid Integration Setup Guide for Give (2026)

This guide covers how to set up Plaid for church financial processing—specifically for disbursing funds to missionaries after donations are received via Stripe.

---

## Overview: Two Plaid Paths

| Path | Use Case | Complexity | Eligibility |
|------|----------|------------|-------------|
| **Standard Transfer** | You (platform) move money between linked bank accounts | Medium | Apply via Dashboard |
| **Transfer for Platforms** | Each church is an "originator" with own Ledger; you manage their disbursements | High | Beta—contact Plaid Sales |

**For Give**: Start with **Standard Transfer** unless you need multi-tenant Ledgers per church. Transfer for Platforms is designed for platforms with many end-customers; it has stricter eligibility and "payouts to individuals" (e.g., missionaries) may require clarification.

---

## Prerequisites

1. **Plaid account**: [dashboard.plaid.com](https://dashboard.plaid.com)
2. **Transfer application**: Submit via Dashboard → Settings → Team → Products → Transfer
3. **OAuth questionnaire**: If using major banks (Chase, Bank of America, etc.), complete 6+ weeks before launch
4. **Environment variables**:
   ```
   PLAID_CLIENT_ID=your_client_id
   PLAID_SECRET=your_secret          # Use sandbox secret for testing
   PLAID_ENV=sandbox                 # or development, production
   ```

---

## Step 1: Apply for Transfer

1. Go to [Plaid Dashboard](https://dashboard.plaid.com) → Settings → Team → Products
2. Enable **Transfer**
3. Complete the application (use case: "Church financial operations—disbursing donations to designated recipients")
4. Wait for approval (typically 1–2 weeks)
5. Complete the [Transfer Implementation Checklist](https://dashboard.plaid.com/transfer) in the Dashboard

---

## Step 2: Install Dependencies

```bash
pnpm add plaid react-plaid-link
```

- **plaid**: Node.js SDK for Plaid API
- **react-plaid-link**: React hook for Plaid Link (bank connection UI)

---

## Step 3: Create Link Token API Route

Create `src/app/api/plaid/create-link-token/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, orgId } = body as { userId?: string; orgId?: string };

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId ?? orgId ?? "anonymous" },
      client_name: "Give",
      products: ["transfer"],
      country_codes: ["US"],
      language: "en",
      redirect_uri: process.env.PLAID_REDIRECT_URI, // optional
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error("Plaid link token error:", err);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
```

---

## Step 4: Bank Account Linking (Plaid Link)

**Church flow** (source of funds):

```tsx
// src/components/plaid-link-button.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export function PlaidLinkButton({
  onSuccess,
  linkToken,
}: {
  onSuccess: (publicToken: string, metadata: { accounts: { id: string; mask?: string }[] }) => void;
  linkToken: string | null;
}) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      onSuccess(publicToken, metadata);
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready || !linkToken}>
      Connect bank account
    </button>
  );
}
```

**Missionary flow** (destination): Same component; store `account_id` from metadata for each missionary.

---

## Step 5: Exchange Public Token for Access Token

Create `src/app/api/plaid/exchange-token/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(req: Request) {
  try {
    const { public_token } = await req.json();
    if (!public_token) {
      return NextResponse.json({ error: "Missing public_token" }, { status: 400 });
    }

    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    return NextResponse.json({
      access_token: response.data.access_token,
      item_id: response.data.item_id,
    });
  } catch (err) {
    console.error("Plaid exchange error:", err);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}
```

**Store** `access_token` and `account_id` in your database (e.g., `organization_plaid_accounts` for church, `missionary_plaid_accounts` for missionaries). Encrypt at rest.

---

## Step 6: Create Transfer (Two-Step: Authorize + Create)

### 6a. Authorize Transfer

```typescript
// src/lib/plaid/transfer.ts
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  })
);

export async function authorizeTransfer(params: {
  accessToken: string;
  accountId: string;
  amount: number; // cents
  type: "debit" | "credit";
  userLegalName: string;
  idempotencyKey: string;
}) {
  const auth = await plaidClient.transferAuthorizationCreate({
    access_token: params.accessToken,
    account_id: params.accountId,
    type: params.type,
    amount: params.amount.toString(),
    user: { legal_name: params.userLegalName },
    network: "ach",
    ach_class: "ppd", // or "ccd" for business accounts
    idempotency_key: params.idempotencyKey,
  });

  if (auth.data.authorization.decision === "declined") {
    throw new Error(`Transfer declined: ${JSON.stringify(auth.data.authorization.decision_rationale)}`);
  }

  return auth.data.authorization.authorization_id;
}
```

### 6b. Create Transfer

```typescript
export async function createTransfer(params: {
  authorizationId: string;
  accessToken: string;
  accountId: string;
  description: string;
  amount?: number; // optional; defaults to authorized amount
}) {
  const transfer = await plaidClient.transferCreate({
    authorization_id: params.authorizationId,
    access_token: params.accessToken,
    account_id: params.accountId,
    description: params.description,
    amount: params.amount?.toString(),
  });

  return transfer.data.transfer;
}
```

---

## Step 7: Flow of Funds (Church → Missionaries)

### Option A: Church Bank → Missionary Banks (Standard Transfer)

**Constraint**: For **credit** transfers (sending TO missionaries), you need funds in **your** Plaid Ledger first. Funds enter your Ledger via **debit** transfers (pulling from church's bank).

**Flow**:
1. Church links bank via Plaid Link → you store `access_token`, `account_id`
2. Missionaries link banks → you store their `access_token`, `account_id`
3. When donation is confirmed (Stripe webhook):
   - Option 1: Wait for Stripe payout to church's bank (2–3 days), then run a batch job that creates **debit** transfers from church's bank into your Ledger, then **credit** transfers to missionaries. (Requires your platform to hold funds temporarily.)
   - Option 2: If church's bank is the same account that receives Stripe payouts, you debit from church's bank (after funds have landed) into your Ledger, then credit to missionaries.

**Ledger requirement**: You must have a Plaid Ledger (created when you're approved for Transfer). Debits add to it; credits subtract.

### Option B: Transfer for Platforms (Church as Originator)

Each church gets their own Ledger. Flow:
1. Church onboarded as originator (KYB/KYC)
2. Church links funding account (bank that receives Stripe payouts)
3. Church deposits from funding account to their Ledger via `/transfer/ledger/deposit`
4. You create credit transfers from church's Ledger to missionary bank accounts

**Note**: "Payouts to individuals are not supported unless related to payment collection." Missionary support may need Plaid approval—contact sales.

---

## Step 8: Webhook for Transfer Events

Create `src/app/api/webhooks/plaid/route.ts` to handle:
- `TRANSFER_EVENTS_UPDATE` – transfer status changes (pending → posted → settled)
- Use for idempotency and updating your `disbursements` table

---

## Step 9: Database Schema Additions

```sql
-- Church's linked bank (source of funds)
CREATE TABLE organization_plaid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  access_token_encrypted TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_mask TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Missionary/destination bank accounts
CREATE TABLE plaid_destination_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  recipient_name TEXT NOT NULL,  -- e.g., missionary name
  access_token_encrypted TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_mask TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disbursement records (for idempotency and tracking)
CREATE TABLE plaid_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES donations(id),
  transfer_id TEXT UNIQUE,
  amount_cents BIGINT NOT NULL,
  destination_account_id UUID REFERENCES plaid_destination_accounts(id),
  status TEXT DEFAULT 'pending',
  plaid_event_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Step 10: ACH Processing Windows

Submit transfers before cutoff to hit desired settlement:

| Window   | Cutoff (ET) | Settlement      |
|----------|-------------|-----------------|
| Same Day | 9:35 AM     | Same day ~1 PM  |
| Same Day | 1:50 PM     | Same day ~5 PM  |
| Same Day | 3:00 PM     | Same day ~6 PM  |
| Standard | 8:30 PM     | Next biz day    |

Submit at least 15 minutes before cutoff.

---

## Security Checklist

- [ ] Encrypt `access_token` at rest (e.g., with Supabase Vault or KMS)
- [ ] Never log or expose `access_token` or `account_id` to client
- [ ] Use idempotency keys on all transfer authorization/create calls
- [ ] Validate org ownership before creating transfers
- [ ] Store Proof of Authorization (POA) for NACHA compliance on debits

---

## Sandbox Testing

- Use `PLAID_ENV=sandbox`
- Sandbox has low limits ($10/transfer, $100/month) until Implementation Checklist is approved
- For special test credentials (other than `user_good`/`pass_good`), use `/sandbox/public_token/create` or a non-OAuth institution like **First Platypus Bank** (`ins_109508`)

### Simple Test Credentials (Your Sample Bank Account)

From the Plaid Dashboard → Credentials → Test Users:

| Username | Password | Use |
|----------|----------|-----|
| `user_good` | `pass_good` | Basic account access for most products; use to connect a sample bank account |

For additional pre-populated test accounts, see the [Sandbox docs](https://plaid.com/docs/sandbox/test-credentials/). To get started, see the [official Plaid Quickstart](https://plaid.com/docs/quickstart/).

### Transactions Testing

| Username | Password | Use |
|----------|----------|-----|
| `user_transactions_dynamic` | any | Realistic transaction history |
| `user_ewa_user`, `user_yuppie`, `user_small_business` | any | Persona-based testing |

### Auth Micro-Deposit Testing

| Username | Password |
|----------|----------|
| `user_good` | `microdeposits_good` |

### MFA Testing

| Flow | Username | Password | Code/Answer |
|------|----------|----------|-------------|
| Device OTP | `user_good` | `mfa_device` | `1234` |
| Questions (n rounds, m questions) | `user_good` | `mfa_questions_<n>_<m>` | `answer_<i>_<j>` |
| Selections | `user_good` | `mfa_selections` | `Yes` |

### Error Simulation

Use `user_good` with password `error_[ERROR_CODE]` to trigger errors, e.g.:
- `error_ITEM_LOCKED`
- `error_INVALID_CREDENTIALS`
- `error_INSTITUTION_DOWN`

**Note**: Error credentials do not work with OAuth institutions. Use First Platypus Bank or another non-OAuth institution.

### Recommended for Transfer Testing

Use **First Platypus Bank** (`ins_109508`) with `user_good` / `pass_good` for predictable Link flows without OAuth complexity.

---

## Next Steps

1. Apply for Transfer in Plaid Dashboard
2. Implement Link token + exchange endpoints
3. Add Plaid Link UI to dashboard (church + missionary bank linking)
4. Build transfer authorization + create flow, triggered after Stripe payout (or on batch schedule)
5. Add webhook handler for transfer events
6. Contact Plaid Sales if you need Transfer for Platforms or have questions about missionary payouts

---

## References

- [Plaid Transfer Docs](https://plaid.com/docs/transfer/)
- [Transfer for Platforms](https://plaid.com/docs/transfer/platform-payments/)
- [Creating Transfers](https://plaid.com/docs/transfer/creating-transfers/)
- [Plaid Link Web](https://plaid.com/docs/link/web/)
- [Transfer Quickstart (GitHub)](https://github.com/plaid/transfer-quickstart)
