# Revenue Modal Context

**Purpose:** This document is for an AI tool building a **plan for revenue modals**. It provides product context (BankGO + Give/Exchange) and the **revenue modal scope** for the Exchange platform.

---

## 1. Product 1 — The Give App (The Exchange)

**What it is:** A SaaS fundraising platform for churches and nonprofits. It combines donations, website builder, CMS, payment splits, public feed, peer connections, messaging, and missionary support in one platform.

**Stack:** Next.js 16, Supabase, Stripe Connect, Vercel.

**Pricing:** Free ($0), Growth ($29/mo, 14-day trial), Pro ($49/mo, 14-day trial); team seats +$10/mo.

**Revenue:** 1% platform fee on every donation; SaaS subscriptions (Growth/Pro).

**Differentiators:** Native payment splits (automatic distribution to missionaries/partners), free tier, 1% fee, integrated website + CMS + giving, org-to-org networking and missionary connect flows.

**Existing UI:** There is already a **pricing modal** ([`src/components/pricing-modal.tsx`](../src/components/pricing-modal.tsx)) opened from hero, nav, and landing; it shows Free / Growth ($29) / Pro ($49). The **revenue modal** you are planning is **separate** and should surface **all** revenue streams and entry points listed in Section 4 below.

---

## 2. Product 2 — BankGO (Exchange Banking)

**What it is:** The **banking** app (Exchange Banking). Separate app/origin from Give; same Supabase project (shared users/auth).

**Relationship:** Users can start on BankGO and be sent to Exchange for signup/login, then redirected back to BankGO with an auth code so BankGO sets its own session. No cookie sharing across domains. See [`docs/EXCHANGE-REDIRECT-PROMPT.md`](EXCHANGE-REDIRECT-PROMPT.md) and [`src/lib/banking-redirect.ts`](../src/lib/banking-redirect.ts) for implementation.

**Design:** Dashboard and UI follow a “BANKGO” style (dark sidebar, emerald accent, fixed brand header) referenced in Give’s dashboard layout and globals.

**Revenue angle:** “Advisor join banking” — users can **click on advisor in area** to engage with banking/advisor side. The revenue modal plan should call this out explicitly as an entry point.

---

## 3. Revenue Modal Scope (Exchange Platform)

**The revenue modal is for the Exchange platform** (the Give app), not the banking app. It should present these revenue streams and entry points:

| Item | Description |
|------|-------------|
| **Exchange platform** | The revenue modal is for the Exchange (Give) product, not the banking app. |
| **Transaction cards** | Surface transaction cards as a revenue product/feature (e.g. where users complete or manage transactions). |
| **Boosting posts** | **Boost post** is a feature for orgs or users who want to reach a **broader audience**, need **more donations** primarily, or need **more help overall** with something — it increases the likelihood that someone would be willing to give. Boosting posts (e.g. in Feed/Explore) is a paid/revenue feature and should be included in the revenue modal. |
| **Advisor join banking** | Users can click on **advisor in area** to join or engage with banking (BankGO); the modal should explain or link to this path. |
| **1% transaction cost on Give** | Make clear that the Give platform charges a **1% transaction fee** on donations. |
| **$29 website builder for churches** | The **Growth** plan ($29/mo) is the website builder tier for churches; call this out in the revenue modal. |

---

## 4. Planning Notes for the Revenue Modal

When building the revenue modals plan, consider:

- **Where the modal appears:** e.g. dashboard, feed, post-checkout, post-donation.
- **Audience:** org admins vs donors vs missionaries — and how each item above maps to a CTA or upsell for that audience.
- **How each revenue stream maps to a CTA:** transaction cards, boost post, advisor join banking, 1% fee messaging, and $29 Growth (website builder) should each have a clear entry point or explanation in the modal.

---

## 5. Quick Reference

| Term | Meaning |
|------|---------|
| **Give / Exchange** | give-app-main codebase; main domain = Exchange. |
| **BankGO** | Separate codebase/deployment; banking domain; auth via redirect-with-code from Exchange. |
| **Existing pricing UI** | [`src/components/pricing-modal.tsx`](../src/components/pricing-modal.tsx), [`src/app/pricing/`](../src/app/pricing/). |

For deeper product context, see [GIVE_APP_OVERVIEW.md](../GIVE_APP_OVERVIEW.md), [THE_EXCHANGE_5_YEAR_STRATEGY.md](../THE_EXCHANGE_5_YEAR_STRATEGY.md), and [docs/GIVE_APP_FOR_CLAUDE.md](GIVE_APP_FOR_CLAUDE.md).
