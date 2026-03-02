# Give — Full App Overview, Revenue Model & Impact Potential

> **As of February 2026**

---

## What Is Give?

**Give** is a full-stack SaaS fundraising platform built specifically for **churches and nonprofits**. It combines donation processing, a website builder, a CMS, peer networking, and financial analytics into one platform — competing with tools like Tithe.ly, Pushpay, and Subsplash, but at a lower price point with more flexibility.

It is a **multi-tenant platform**: one codebase, many organizations, each with their own branding, team, donation forms, website, and Stripe Connect payout account.

---

## Core Feature Areas

### 1. Donation Processing
- One-time, monthly, and yearly recurring donations
- Customizable donation forms (colors, suggested amounts, anonymous option, fee coverage)
- Embeddable donation cards for external websites
- QR code generation for offline/event giving
- Shareable donation links with configurable split recipients
- Stripe Connect for direct org payouts (no platform holding funds)
- Fee coverage: donor can absorb Stripe fees so org gets 100% of stated amount
- Plaid + Dwolla integration for ACH bank transfers

### 2. Donation Campaigns
- Goal-based campaigns with deadline support
- Progress bars and real-time tracking
- Campaign-specific donation routing

### 3. Tax Receipts & Compliance
- Automated tax receipts emailed to every donor
- Year-end PDF tax summaries
- Receipt video experience (confetti celebration animation)
- Secure receipt access via unique tokens

### 4. Website Builder & CMS
- Drag-and-drop website editor (page builder)
- Multi-page site support (Home, About, Give, Events, Ministries, Media, Visit)
- Custom domain support with DNS configuration
- CMS for sermon archives, podcast episodes, and worship recordings
- Eventbrite sync for events
- Pexels stock media integration

### 5. Social & Community Layer
- Live public donation feed with reactions and comments
- Donor sharing of donations to feed
- Peer organization connections (networking between nonprofits)
- In-app messaging between organizations
- Split payment proposals via chat (org-to-org revenue sharing)

### 6. Splits & Missionaries
- Payment splitting: one donation routed to multiple Stripe Connect accounts
- Internal split payouts to bank accounts within a single org
- Missionary fundraising: organizations sponsor individuals who raise funds under the org's umbrella
- Endowment fund integration: 30% of platform fee flows to endowment funds

### 7. Team & Access Control
- Role-based access: Owner, Admin, Team Member, Missionary, Donor
- Per-seat team member billing ($10/mo per seat)
- Multi-organization support: one user account, many orgs

### 8. Analytics & Reporting
- Real-time donation feed
- Donor segmentation
- Platform-wide statistics
- Time-period filtering
- Campaign goal progress tracking

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19 |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth |
| Payments | Stripe + Stripe Connect Express |
| Bank Linking | Plaid + Dwolla |
| Email | Resend |
| Media | AWS S3 + CloudFront, Pexels API |
| Infrastructure | Vercel (Next.js) + AWS Lambda (webhooks) + Route 53 |
| Events | Eventbrite API |
| UI | shadcn/ui, Radix UI, Tailwind CSS |
| Animation | GSAP, Motion, canvas-confetti |

---

## Pricing Model

| Plan | Price | Trial | Key Limits |
|------|-------|-------|------------|
| **Free** | $0/mo | None | Unlimited donations & forms, up to 2 split recipients, no missionaries |
| **Growth (Website)** | $35/mo | 14 days | Website builder, custom domains, up to 7 split recipients, 3 missionaries |
| **Pro** | $49/mo | 14 days | CMS (sermons, podcasts), unlimited splits, unlimited missionaries, advanced analytics |
| **Team seats** | +$10/mo each | — | Additional admins/staff |

**Platform transaction fee: 1% on every donation processed**

---

## Revenue Streams

### Stream 1 — SaaS Subscriptions
Monthly recurring revenue from organizations on Growth or Pro plans, plus team seat add-ons.

### Stream 2 — 1% Platform Fee (Transaction Revenue)
Every donation processed generates 1% revenue. This scales with total donation volume on the platform — not with org count.

### Stream 3 — Endowment Fund Partnership (30% of Platform Fee)
30% of the 1% platform fee flows to configured endowment funds. This is a built-in partnership/revenue-sharing model baked into the architecture.

---

## Revenue Model: How Much Can You Make?

### Assumptions Used
- Average church/nonprofit: **$10,000/mo in donations** processed through Give
- Average plan revenue per org: **$40/mo** (blended across Free, Growth, Pro)
- 1% platform fee on all donations processed
- 14-day trial means most users are real paying customers if retained

---

### Year 1: Early Stage (0 → 100 Organizations)

| Metric | Value |
|--------|-------|
| Orgs acquired | 100 |
| Orgs on paid plans (40%) | 40 |
| Subscription MRR | 40 × $40 = **$1,600/mo** |
| Total donations processed/mo | 100 × $10K = $1M |
| Platform fee (1%) | **$10,000/mo** |
| **Total MRR (end of Year 1)** | **~$11,600/mo** |
| **Total ARR** | **~$139,200/yr** |

---

### Year 2: Growth Phase (100 → 500 Organizations)

| Metric | Value |
|--------|-------|
| Orgs | 500 |
| Orgs on paid plans (50%) | 250 |
| Subscription MRR | 250 × $40 = **$10,000/mo** |
| Total donations processed/mo | 500 × $12K = $6M |
| Platform fee (1%) | **$60,000/mo** |
| **Total MRR** | **~$70,000/mo** |
| **Total ARR** | **~$840,000/yr** |

---

### Year 3: Scale Phase (500 → 2,000 Organizations)

| Metric | Value |
|--------|-------|
| Orgs | 2,000 |
| Orgs on paid plans (55%) | 1,100 |
| Subscription MRR | 1,100 × $42 = **$46,200/mo** |
| Total donations processed/mo | 2,000 × $15K = $30M |
| Platform fee (1%) | **$300,000/mo** |
| **Total MRR** | **~$346,200/mo** |
| **Total ARR** | **~$4.15M/yr** |

---

### Year 5: Maturity (5,000+ Organizations)

| Metric | Value |
|--------|-------|
| Orgs | 5,000 |
| Orgs on paid plans (60%) | 3,000 |
| Subscription MRR | 3,000 × $45 = **$135,000/mo** |
| Total donations processed/mo | 5,000 × $18K = $90M |
| Platform fee (1%) | **$900,000/mo** |
| Team seat add-ons (est.) | **$50,000/mo** |
| **Total MRR** | **~$1,085,000/mo** |
| **Total ARR** | **~$13M/yr** |

---

### Revenue Sensitivity: The 1% Fee is the Real Engine

The subscription revenue is important but the **transaction fee scales exponentially** with total giving volume. Here's what the 1% fee looks like at different platform scales:

| Monthly Donations Processed | Monthly Platform Fee Revenue |
|-----------------------------|------------------------------|
| $1M (100 small orgs) | $10,000/mo |
| $5M (400 orgs) | $50,000/mo |
| $10M (700 orgs) | $100,000/mo |
| $50M (2,500 orgs) | $500,000/mo |
| $100M (5,000 orgs) | $1,000,000/mo |
| $500M (20,000 orgs) | $5,000,000/mo |

> The top 4 church giving platforms (Tithe.ly, Pushpay, Subsplash, Planning Center Giving) collectively process **over $10 billion/year** in donations. Even 1% market share = $100M/yr in donation volume → **$1M/yr in platform fees alone.**

---

## Competitive Landscape & Positioning

| Platform | Price | Transaction Fee | Website Builder | CMS | Splits |
|----------|-------|----------------|-----------------|-----|--------|
| **Give (yours)** | $0–$49/mo | 1% | Yes | Yes | Yes (unique) |
| Tithe.ly | $99+/mo | 0.49%–2.99% | Basic | No | No |
| Pushpay | $500+/mo | Custom | No | No | No |
| Subsplash | $199+/mo | 0.89%–2.89% | Yes | Yes | No |
| Givebutter | Free | 2%+ | No | No | No |

**Give's advantages:**
1. Lowest price point for a full-featured platform
2. True payment splits (no competitor does this natively)
3. Built-in website builder + CMS in one tool
4. 14-day free trial lowers barrier to adoption
5. Free forever tier drives organic word-of-mouth

---

## Growth Levers

### Short Term (Now → 12 months)
- **Free tier as a funnel**: Unlimited donations on the free plan means zero friction to start. Every free user is a conversion opportunity.
- **14-day trials**: Users who set up Stripe Connect and process real donations rarely churn.
- **Splits as viral growth**: When one org splits donations to another org, that second org discovers Give.
- **Public donation feed**: Visible on `/feed` and public org pages — social proof drives organic signup.
- **QR codes at events**: Offline presence drives online signups.

### Medium Term (12–36 months)
- **Missionary network effects**: Each missionary is a new user who may become an org admin later.
- **Peer connections**: The org-to-org network becomes a moat — switching costs rise as relationships deepen.
- **CMS stickiness**: Once a church uploads 100 sermons and 50 podcast episodes, they are not leaving.
- **Custom domains**: Organizations publish their entire web presence through Give — migration pain is high.
- **Team seat expansion**: As orgs grow their staff, seat revenue grows automatically.

### Long Term (3–5 years)
- **Become the operating system for faith communities**: donations, website, CMS, events, communications, team management — all in one platform.
- **Endowment fund network**: The built-in endowment routing creates relationships with institutional money.
- **Data network effects**: Donor profiles that span multiple organizations create cross-sell and re-engagement opportunities.
- **Enterprise/denomination deals**: Selling Give to a denomination of 500 churches = instant 500 orgs.

---

## Total Addressable Market

| Segment | Count (US) | Avg Annual Giving | Total Giving Volume |
|---------|-----------|-------------------|---------------------|
| Churches | 380,000 | $250K | $95 billion |
| Nonprofits (501c3) | 1.5M | $150K | $225 billion |
| Missionaries/Individuals | 5M+ | $25K | $125 billion |
| **Total US TAM** | | | **~$445 billion/yr** |

At **1% platform fee** on 1% market capture = **$44.5M/yr** in platform fee revenue alone.
At **1% platform fee** on 5% market capture = **$222.5M/yr**

> The giving market is enormous, recurring, and **recession-resistant**. Charitable giving increased every year during both 2008 and 2020.

---

## Risk Factors

| Risk | Mitigation |
|------|------------|
| Stripe fee changes | Pass through to orgs; fee is separate from platform fee |
| Competition from Tithe.ly/Pushpay | Lower price, unique splits feature, CMS depth |
| Churn from free tier non-converters | Free tier creates brand awareness, not cost |
| Regulatory (PCI DSS, nonprofit compliance) | Stripe handles PCI; receipts handled automatically |
| Single-developer risk | Architecture is clean and documented; scalable handoff |

---

## Summary Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Market size | 10/10 | $445B+ in giving annually |
| Recurring revenue | 9/10 | Subscriptions + % of recurring donations |
| Switching costs | 9/10 | CMS content, custom domains, donor history |
| Competitive moat | 8/10 | Splits, CMS, price point, faith community focus |
| Scalability | 9/10 | Serverless, Stripe Connect, multi-tenant by design |
| Feature completeness | 9/10 | Website + CMS + Donations + Network in one tool |
| Viral / word of mouth | 8/10 | Public feed, splits, QR codes, free tier |
| Revenue ceiling | 10/10 | Transaction fee scales with giving volume, not org count |

---

## Bottom Line

At **100 orgs**, Give generates ~**$140K/yr**.
At **500 orgs**, it generates ~**$840K/yr**.
At **2,000 orgs**, it generates ~**$4M/yr**.
At **5,000 orgs**, it generates ~**$13M/yr**.

The **1% transaction fee is the real wealth engine** — it scales with donor generosity, not headcount. As total giving volume on the platform grows, revenue grows proportionally with minimal additional cost.

Give is not just a donation tool. It is a **faith community operating system** — and once a church or nonprofit is fully embedded (sermons, podcasts, website, donors, team, events), the switching cost is effectively zero. They don't leave.

**The platform is already built. The only constraint is distribution.**
