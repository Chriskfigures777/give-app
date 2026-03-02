# The Exchange — 5-Year Growth Strategy & Marketing Plan
**Prepared:** February 2026 | **Confidential**

---

## Executive Summary

The Exchange is a SaaS fundraising and community platform purpose-built for churches and nonprofits. It combines donation processing, a website builder, a CMS, team management, peer networking with automatic Stripe payment splits, and an embeddable form system — all under a single, affordable SaaS subscription starting at $0/month.

The platform's core revenue model is a **1% fee on every dollar transacted**, making it a volume play: the more churches and nonprofits process, the more revenue The Exchange generates without additional marginal cost. At scale, this fee is a formidable and compounding asset.

This document outlines a 5-year phased plan to grow from a pilot-stage product to a globally recognized platform for faith-based and nonprofit giving.

---

## Platform Overview (Current State)

| Dimension | Detail |
|-----------|--------|
| **Tech Stack** | Next.js 16, Supabase (PostgreSQL), Stripe Connect, AWS (S3, CloudFront, Route 53), Vercel |
| **Plans** | Free ($0), Growth ($29/mo, 14-day trial), Pro ($49/mo, 14-day trial) |
| **Platform Fee** | 1% of every donation processed |
| **Core Features** | Donation forms, recurring giving, tax receipts, website builder, CMS (sermons/podcasts), payment splits, embeddable forms, QR codes, org networking, messaging, public donation feed |
| **Stripe Integration** | Stripe Connect Express for direct org payouts; Stripe Billing for SaaS subscriptions |
| **Unique Differentiators** | Native payment splits (no competitor offers this), free forever tier, 1% fee vs. competitors' 0.49–2.99%, fully integrated website + CMS + giving in one platform |

### Competitive Landscape

| Feature | The Exchange | Tithe.ly | Pushpay | Subsplash |
|---------|-------------|----------|---------|-----------|
| Starting Price | $0/mo | ~$29/mo | ~$99+/mo | ~$199+/mo |
| Transaction Fee | 1% | 0.49–1.9% | 1.99%+ | Variable |
| Website Builder | Yes | No | No | Yes |
| CMS (Sermons/Podcasts) | Yes (Pro) | No | No | Yes |
| Native Payment Splits | Yes | No | No | No |
| Free Forever Tier | Yes | No | No | No |
| 14-Day Free Trial | Yes | Limited | No | No |
| Embeddable Forms | Yes | Yes | Yes | Partial |
| Org-to-Org Networking | Yes | No | No | No |

---

## Revenue Model Deep Dive

### SaaS Subscription Revenue

| Plan | Monthly Price | Annual Price per Org |
|------|--------------|----------------------|
| Free | $0 | $0 |
| Growth (Website) | $29/mo | $348 |
| Pro | $49/mo | $588 |
| Team Seat Add-On | +$10/mo each | +$120/seat/year |

### Transaction Fee Revenue

The 1% platform fee is the compounding engine. As donation volume grows across all organizations on the platform, revenue scales independent of org count:

| Scenario | Orgs | Avg Monthly Giving/Org | Monthly Volume | Monthly Platform Revenue |
|----------|------|------------------------|----------------|--------------------------|
| Year 1 (pilot) | 25 | $8,000 | $200,000 | $2,000 |
| Year 2 (growth) | 150 | $12,000 | $1.8M | $18,000 |
| Year 3 (scale) | 500 | $15,000 | $7.5M | $75,000 |
| Year 4 (network) | 1,500 | $18,000 | $27M | $270,000 |
| Year 5 (global) | 5,000 | $20,000 | $100M | $1,000,000 |

**Combined Year 5 ARR estimate (subscription + transaction):**
- Subscription: ~3,500 paid orgs × $38/mo avg = ~$1.6M ARR
- Transaction: ~$12M/year
- **Total: ~$13.6M ARR**

---

## Year 1: Pilot Phase — Foundation & First Customers

### Goal
Validate product-market fit with 25–50 organizations, raise $100,000 in seed funding, and build a repeatable acquisition engine.

### Funding Target: $100,000

| Category | Budget | Notes |
|----------|--------|-------|
| Facebook/Instagram Ads | $30,000 | 14-day free trial campaigns targeting church admins |
| Founder Outreach & Events | $10,000 | Travel to conferences (Exponential, Church Communication Network) |
| Content Marketing Setup | $8,000 | Blog, SEO infrastructure, YouTube channel |
| Product Polish & Bug Fixes | $25,000 | Dev hours: onboarding UX, Stripe Connect flow, embed card stability |
| Legal & Compliance | $7,000 | Terms of service, nonprofit compliance, data privacy |
| Tools & Infrastructure | $10,000 | Vercel Pro, Supabase Pro, AWS, Resend, Stripe fees buffer |
| Reserve/Contingency | $10,000 | Buffer for unexpected spend |
| **Total** | **$100,000** | |

### Key Initiatives

#### 1. Direct Church Recruitment (5–10 Founding Partners)
- Personally reach out to 50–100 churches via LinkedIn, church directories, and warm introductions
- Offer "Founding Partner" status: lifetime Growth plan at $0/mo in exchange for testimonials and referrals
- Target: small-to-mid-size churches ($3K–$25K/month in giving) who are either unbanked on giving software or paying too much for Tithe.ly/Pushpay
- Capture their giving volume to validate the 1% revenue model

**Outreach Script Framework:**
> "Hi [Pastor/Admin], I'm the founder of The Exchange — a platform built for churches that combines giving forms, a website builder, and even lets you automatically split donations with partner ministries. We're offering early-access churches a free lifetime Growth plan. Would you be open to a 15-minute demo?"

#### 2. Facebook & Instagram Ads — 14-Day Free Trial Campaign

**Campaign Structure:**

| Ad Set | Audience | Hook | CTA |
|--------|----------|------|-----|
| Cold — Church Admins | Interest: church management, Tithe.ly, Pushpay, church leadership | "Your giving platform is charging you 2%+ per donation. Ours charges 1% — and gives you a free website." | Start Free 14-Day Trial |
| Cold — Nonprofit Leaders | Interest: nonprofit management, fundraising, GivingTuesday | "Finally: a free website + donation platform built for nonprofits. No setup fee. No monthly cost to start." | Start Free Trial |
| Retargeting — Website Visitors | Custom audience: site visitors (7-day) | "You visited The Exchange. Still deciding? Here's what 1% really means for your church." | Watch Demo |
| Lookalike — Email List | LAL: current email list (1–5%) | "Churches like yours are switching to The Exchange." | Book a Demo |

**Monthly Ad Budget:** $2,500/month ($30,000/year)
**Estimated CPL (cost per lead):** $15–$40
**Estimated Monthly Leads:** 60–160
**Expected Trial-to-Paid Conversion:** 15–25%

#### 3. Embedded Form Launch — "Bring Your Own Website" Strategy
- Create a standalone landing page at `/embed` showing how to copy-paste the donation form iframe onto any existing website (WordPress, Squarespace, Wix)
- Create YouTube tutorial: "How to add a donation form to your church website in 5 minutes"
- This removes the barrier of switching websites entirely — orgs can adopt The Exchange just for giving

#### 4. Email Newsletter — "The Exchange Weekly"
- Weekly 300-word newsletter: church giving trends, donation platform comparisons, tips for growing your church's online giving
- List-building: free resources gated behind email opt-in (e.g., "Church Giving Best Practices PDF")
- Expected list size by Year 1 end: 1,000–3,000 subscribers

#### 5. SEO Foundation
- Target bottom-of-funnel keywords:
  - "best giving platform for churches"
  - "Tithe.ly alternative"
  - "free donation form for nonprofits"
  - "church website builder with giving"
  - "how to accept donations for church online"
- Publish 2–4 blog posts/month starting Month 2

### Year 1 KPIs

| Metric | Target |
|--------|--------|
| Organizations onboarded | 25–50 |
| Paid plan conversions | 10–20 |
| Monthly donation volume | $200,000–$500,000 |
| Monthly platform revenue (1%) | $2,000–$5,000 |
| Monthly SaaS revenue | $300–$800 |
| Email list size | 1,000–3,000 |
| Facebook ad leads | 500–1,500 total |
| Website visitors (monthly) | 2,000–8,000 |

---

## Year 2: Scale — Automated Acquisition & Competitive Targeting

### Goal
Grow to 150–200 organizations, $18,000/month in platform fees, and $3,000+/month in SaaS revenue. Automate the marketing funnel and begin targeting competitor users.

### Key Initiatives

#### 1. Competitor Displacement Campaigns — Target Tithe.ly Users
Tithe.ly has 12,000+ customers paying $29–$99/month with 0.49–1.9% transaction fees. Many are price-sensitive.

**Tactics:**
- Run Facebook/Google ads targeting people who engage with Tithe.ly, Pushpay, or Subsplash content
- Create a dedicated landing page: `/switch-from-tithely` with a side-by-side comparison
- Publish "Tithe.ly vs. The Exchange" comparison article (target SEO)
- Offer switching incentive: first 3 months of Growth plan at 50% off for verified Tithe.ly customers
- Partner with church bookkeepers and treasurers who manage platform decisions

**Estimated ROI:** If 2% of 12,000 Tithe.ly customers switch (240 orgs × $29/mo avg) = $6,960/month added MRR

#### 2. Email Automation Sequences
Build automated nurture sequences using Brevo or Resend:

| Trigger | Sequence | Length |
|---------|----------|--------|
| Trial signup | Onboarding drip (setup, first donation, embed form, website builder) | 7 emails over 14 days |
| Trial day 10 | Conversion urgency: "Your trial ends in 4 days — upgrade to keep your website live" | 3 emails |
| Trial expired (no conversion) | Win-back: free plan positioning, case studies | 4 emails over 30 days |
| Free plan (60+ days) | Upgrade campaign: "You've processed $X in donations. Unlock your website + CMS" | Monthly email |
| New donation milestone | "You just hit $10,000 in total giving on The Exchange" — share stats, upsell Pro | Triggered |

#### 3. Content Marketing Acceleration
- Publish 4–6 blog posts/month targeting:
  - Nonprofit giving trends
  - Church website best practices
  - "How I grew our online giving by X%" (case studies from Founding Partners)
- Launch YouTube channel with:
  - Platform walkthroughs
  - "Church Tech Tips" series
  - Comparison videos ("Why we switched from Tithe.ly")
- Begin podcast appearances on church leadership podcasts

#### 4. Partnership Channel — Church Networks & Denominations
- Identify 10–20 regional church networks or denominations
- Negotiate affiliate partnerships: networks promote The Exchange to member churches in exchange for a revenue share (e.g., 10% of subscription revenue from referred orgs for 12 months)
- Focus on networks of 50–500 churches for concentrated reach

#### 5. Referral Program
- Build an in-product referral program: existing org admins get 1 free month for every org they refer that converts to a paid plan
- Make referral link shareable from dashboard with pre-written copy

#### 6. Google Ads — High-Intent Keywords
- Expand from Facebook to Google Ads targeting high-intent searches:
  - "church giving software"
  - "nonprofit donation platform"
  - "online giving for churches"
- Budget: $2,000–$4,000/month
- Estimated CPC: $2–$8
- Expected monthly clicks: 500–2,000
- Expected conversions: 25–100 trials/month

### Year 2 KPIs

| Metric | Target |
|--------|--------|
| Organizations onboarded | 150–200 |
| Paid plan conversions | 60–90 |
| Monthly donation volume | $1.8M–$3M |
| Monthly platform revenue (1%) | $18,000–$30,000 |
| Monthly SaaS revenue | $1,800–$2,700 |
| Email list size | 5,000–12,000 |
| Referral-sourced signups | 15–30% of new orgs |
| Churn rate (monthly) | < 3% |

---

## Year 3: Establish — Budget Breakdown, Operational Scale & Brand Authority

### Goal
Reach 500 organizations, $75,000/month in platform fees, and establish The Exchange as the go-to platform for churches under 2,000 members. Formalize operations, hiring, and brand authority.

### $100,000 Seed Fund: Full Allocation Breakdown

Looking back at the Year 1 $100,000 and forward to how efficient use of those funds created compounding returns:

| Year 1 Investment | Allocation | Output by Year 3 |
|-------------------|------------|------------------|
| Facebook/Instagram Ads ($30K) | 30% | ~150 trial signups → 30 paid orgs → $880/mo MRR |
| Product Polish ($25K) | 25% | Stable onboarding, 90%+ Stripe Connect success rate |
| Founder Outreach ($10K) | 10% | 10 Founding Partners → 50+ referrals → $2,500/mo MRR |
| Content & SEO ($8K) | 8% | 20+ blog posts → 5,000 organic visitors/mo by Year 3 |
| Legal & Compliance ($7K) | 7% | Clean SaaS contracts, nonprofit compliance ready for enterprise |
| Infrastructure ($10K) | 10% | Production-grade hosting → zero major downtime events |
| Reserve ($10K) | 10% | Deployed in Year 2 for Google Ads + first hire |

**Key Lesson from Year 1–2:** The highest-ROI spend was Founder Outreach ($10K) generating word-of-mouth networks. Every dollar spent on direct relationship building returned 3–5× more organizations than ads.

### Year 3 Budget (Projected Revenue-Funded): ~$500,000

| Category | Budget | Headcount |
|----------|--------|-----------|
| Engineering (2 devs) | $180,000 | 2 FTE |
| Marketing (1 growth marketer) | $90,000 | 1 FTE |
| Customer Success (1 rep) | $65,000 | 1 FTE |
| Paid Advertising | $80,000 | — |
| Content Production | $30,000 | Contract |
| Tools & Infrastructure | $35,000 | — |
| Conferences & Events | $20,000 | — |
| **Total** | **$500,000** | 4 FTE |

### Key Initiatives

#### 1. Onboarding Optimization
- Instrument the full onboarding funnel with Posthog or Mixpanel
- Identify top drop-off points in: signup → Stripe Connect → first donation → website builder
- Run A/B tests on key onboarding steps
- Target: reduce time-to-first-donation from 3 days to under 24 hours

#### 2. Case Study Content Engine
- Produce 1 detailed case study/month from existing orgs
- Format: written (blog), video (YouTube), and shareable social card
- Focus metrics: "X church grew online giving 40% in 3 months"
- Use these in all ad creative, email sequences, and sales outreach

#### 3. Church Conference Presence
- Sponsor or exhibit at 3–5 church tech/leadership conferences:
  - **Exponential** (largest church planting conference, ~4,000 attendees)
  - **Church Communication Network** events
  - **The Nines** (online church leadership summit)
  - **Orange Conference** (family ministry)
- Budget: $5,000–$8,000 per conference including travel, booth, materials
- Goal: 50–100 qualified leads per conference

#### 4. Affiliate / Partner Program Formalization
- Build a formal affiliate dashboard (Rewardful or PartnerStack)
- Tiered commissions:
  - Church consultant / bookkeeper: 20% of first 12 months SaaS revenue
  - Denomination partner: 15% recurring for life of customer
- Target 30–50 active affiliates generating 20–30% of new signups by end of Year 3

#### 5. Enterprise/Network Tier Introduction
- Create a "Network Plan" for denominations or church networks managing 10+ churches
- Pricing: negotiated, ~$20–$30/org/month (volume discount vs. individual Growth plan)
- Features: centralized reporting, bulk user management, network-level donation splits
- This unlocks B2B2C distribution: one sale = 10–50 new organizations

### Year 3 KPIs

| Metric | Target |
|--------|--------|
| Organizations onboarded | 500 |
| Paid plan conversions | 200–250 |
| Monthly donation volume | $7.5M |
| Monthly platform revenue (1%) | $75,000 |
| Monthly SaaS revenue | $6,000–$8,000 |
| MRR (total) | $81,000–$83,000 |
| ARR run rate | ~$1M |
| Team size | 4–6 FTE |
| Churn rate (monthly) | < 2% |
| NPS score | > 50 |

---

## Year 4: Network — Social Layer Activation & Platform Evolution

### Goal
Evolve from a giving platform into a social giving network. Activate the org-to-org connections layer, expand payment splits into a viral distribution mechanism, and reach 1,500 organizations.

### The Platform Flywheel

The Exchange has a built-in network flywheel:
1. **Org A** joins and processes donations
2. **Org A** connects with **Org B** (a partner ministry) through the networking feature
3. They create a **payment split** — Org A's donors now automatically give 5% to Org B
4. **Org B** joins The Exchange to receive those split payments
5. **Org B** brings its own donor base to the platform
6. The cycle repeats

This is the social network moat. Every split relationship creates a two-sided acquisition loop.

### Key Initiatives

#### 1. Split Network Activation Campaign
- Send in-product prompts to all existing orgs: "Do you have a partner ministry? Set up an automatic giving split."
- Create a public "Split Network" directory — orgs can discover which ministries they can automatically support
- Feature: "Endorsed by [Org Name]" badge for orgs in the split network
- Goal: 30% of orgs have at least one active split relationship by end of Year 4

#### 2. Social Proof & Community Features
- Expand the public donation feed with org-level analytics sharing (opt-in)
- "Impact Reports" — auto-generated monthly summaries orgs can share on social media
- Share-to-social buttons on donation completion page ("I just gave to [Org] — join me")
- Donor community: donors can follow their favorite orgs and get updates

#### 3. The Exchange App (Mobile)
- Launch a React Native companion app (or PWA) for:
  - Donors to manage recurring giving, view giving history, discover new orgs
  - Org admins to view real-time donation notifications
  - QR code scanning for in-person giving at events
- Partner with Expo or use Next.js PWA for rapid launch
- App store presence increases discoverability and brand legitimacy

#### 4. Advanced Analytics & AI Insights (Pro Tier Feature)
- "Giving Insights" dashboard: predictive analytics on donor retention
- AI-generated newsletter content for orgs to send to their donor base
- Donor lapse prediction: "3 donors haven't given in 90 days — send a re-engagement email?"
- This makes the Pro plan ($49/mo) significantly more valuable and reduces churn

#### 5. GivingTuesday & Seasonal Campaigns
- Build a "Campaign in a Box" feature: orgs can launch branded GivingTuesday campaigns in 5 minutes
- The Exchange runs a platform-wide GivingTuesday campaign promoting all member orgs
- Create a matched-giving fund: platform contributes $1 for every $10 raised on GivingTuesday (sponsored by partners)
- Estimated volume spike: 3–5× daily average during GivingTuesday

#### 6. API & Integration Layer
- Launch a public API for third-party integrations
- Priority integrations:
  - **Planning Center** (church management software, 60,000+ churches)
  - **Salesforce Nonprofit** (NPSP)
  - **Mailchimp** (sync donor lists)
  - **Zapier** connector for no-code automation
- API access as a Pro plan feature — increases plan value and reduces churn

### Year 4 KPIs

| Metric | Target |
|--------|--------|
| Organizations onboarded | 1,500 |
| Paid plan conversions | 700–900 |
| Monthly donation volume | $27M |
| Monthly platform revenue (1%) | $270,000 |
| Monthly SaaS revenue | $22,000–$28,000 |
| MRR (total) | ~$295,000 |
| ARR run rate | ~$3.5M |
| Orgs with active split relationships | 30% |
| Mobile app downloads | 10,000+ |
| Team size | 10–15 FTE |
| Churn rate (monthly) | < 1.5% |

---

## Year 5: Global Expansion — Scale Giving Worldwide

### Goal
Scale to 5,000+ organizations globally, $100M+ in monthly donation volume, and $1M+/month in platform fees. Establish The Exchange as the global standard for faith-based and nonprofit digital giving.

### International Market Opportunity

**Top Target Markets (English-speaking, high church-going rates):**

| Country | Church-going Population | Notes |
|---------|------------------------|-------|
| United States | ~130M | Primary market, already active |
| Nigeria | ~85M | Fastest-growing Christian population globally |
| Brazil | ~175M | Large evangelical movement, underserved tech market |
| Kenya | ~35M | Mobile-first, M-Pesa culture, high church density |
| United Kingdom | ~5M | Smaller but high-income, strong nonprofit culture |
| Philippines | ~85M | Very high Catholic/Protestant population |
| South Korea | ~10M | Tech-savvy, high-giving culture |

**Key Localization Requirements:**
- Multi-currency support (Stripe already supports 135+ currencies)
- Local payment methods: M-Pesa (Kenya), PIX (Brazil), PayNow (Singapore)
- Language localization (Spanish, Portuguese, French, Swahili)
- Local tax receipt formats per country

### Key Initiatives

#### 1. International Stripe Connect Rollout
- The Exchange's Stripe integration already supports international Connect accounts
- Priority: enable UK, Canada, Australia, and Nigeria (Stripe supported)
- Partner with local church networks in each market for initial distribution
- Localize the signup and onboarding flow for each market

#### 2. Global Giving Network
- The split system becomes a global mechanism: a US church can automatically direct 10% of every donation to a partner church in Kenya
- This is unique and unprecedented — no competitor offers cross-border giving splits
- Marketing: "Give locally. Impact globally."

#### 3. Enterprise & Denomination Contracts
- Target the top 20 US denominations (Southern Baptist, United Methodist, Assemblies of God, etc.)
- Each denomination represents hundreds to thousands of member churches
- Offer centralized billing, network-level reporting, and custom branding
- Estimated deal size: $50,000–$500,000/year per denomination contract

#### 4. The Exchange Foundation
- Launch a nonprofit arm: The Exchange Foundation
- Purpose: match donations on the platform for underserved communities and fund access for small churches that can't afford even the Growth plan
- Marketing: "Every transaction on The Exchange helps fund giving access for churches in the developing world"
- This PR narrative drives mainstream media coverage and brand authority

#### 5. Series A Fundraising
- Use Year 4 metrics ($3.5M ARR, 30%+ YoY growth, 1,500 orgs) to raise a Series A round of $5M–$15M
- Use Series A to fund:
  - International expansion ($3M)
  - Sales team for denomination/enterprise deals ($3M)
  - Engineering for mobile app and API platform ($2M)
  - Marketing and brand ($2M)

#### 6. Platform Marketplace
- Launch "The Exchange Marketplace": vetted third-party services for churches
  - Church management software
  - Event production companies
  - Worship music licensing
  - Financial consulting for nonprofits
- Revenue: referral fees from marketplace partners (10–20% of referred contracts)
- This creates a recurring revenue stream independent of donation volume

### Year 5 KPIs

| Metric | Target |
|--------|--------|
| Organizations onboarded | 5,000+ |
| Countries with active orgs | 10+ |
| Paid plan conversions | 3,500 |
| Monthly donation volume | $100M |
| Monthly platform revenue (1%) | $1,000,000 |
| Monthly SaaS revenue | $100,000+ |
| MRR (total) | ~$1.1M |
| ARR run rate | ~$13M |
| Mobile app downloads | 100,000+ |
| Team size | 30–50 FTE |
| Churn rate (monthly) | < 1% |

---

## 5-Year Summary Roadmap

```
YEAR 1: PILOT
├── Raise $100,000 seed funding
├── 25–50 orgs onboarded (5–10 founding partners)
├── Facebook ads → 14-day free trial funnel
├── Embedded form launch (iFrame strategy)
├── SEO foundation + email newsletter
└── Target: $2,000–$5,000/mo platform fees

YEAR 2: SCALE
├── Target Tithe.ly / Pushpay users (competitor displacement)
├── Automated email sequences + referral program
├── Google Ads expansion
├── Church denomination partnerships
└── Target: $18,000–$30,000/mo platform fees

YEAR 3: ESTABLISH
├── $500K budget (revenue-funded)
├── 4+ FTE team
├── Conference presence (Exponential, etc.)
├── Affiliate program + case study engine
├── Enterprise/Network tier launch
└── Target: $75,000/mo platform fees + ~$1M ARR

YEAR 4: NETWORK
├── Social giving flywheel activation
├── Split network directory
├── Mobile app (PWA or React Native)
├── AI analytics + API integrations
├── GivingTuesday platform campaigns
└── Target: $270,000/mo platform fees + ~$3.5M ARR

YEAR 5: GLOBAL
├── International expansion (UK, Nigeria, Brazil, Kenya)
├── Cross-border giving splits
├── Denomination enterprise contracts
├── Series A fundraising ($5–15M)
├── The Exchange Foundation (nonprofit arm)
├── Platform marketplace
└── Target: $1,000,000/mo platform fees + ~$13M ARR
```

---

## Marketing Channels: Priority & ROI Matrix

| Channel | Year Active | Est. CAC | Est. LTV | Priority |
|---------|-------------|----------|----------|----------|
| Direct Founder Outreach | Y1 | $50–$200 | $3,000+ | Critical |
| Facebook/Instagram Ads | Y1–Y5 | $100–$300 | $3,000+ | High |
| SEO + Blog Content | Y1–Y5 | $20–$50 | $3,000+ | High |
| Referral Program | Y2–Y5 | $50–$150 | $3,000+ | High |
| Denomination Partnerships | Y2–Y5 | $500–$2,000 | $50,000+ | Critical |
| Google Ads | Y2–Y5 | $150–$400 | $3,000+ | Medium |
| YouTube / Video | Y2–Y5 | $30–$80 | $3,000+ | Medium |
| Conferences | Y3–Y5 | $200–$600 | $3,000+ | Medium |
| Affiliate Program | Y3–Y5 | $100–$300 | $3,000+ | High |
| Podcast Appearances | Y2–Y5 | $20–$100 | $3,000+ | Medium |
| PR / Media | Y4–Y5 | $0–$500 | $3,000+ | High |

---

## Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stripe changes fee structure | Low | High | Diversify to Plaid/Dwolla; lock platform fee in contracts |
| Competitor copies splits feature | Medium | Medium | Build network effects before feature parity; speed to market |
| Low trial-to-paid conversion | Medium | High | Optimize onboarding; build value during trial; use in-app prompts |
| Church data breach / trust issue | Low | Critical | SOC 2 compliance by Year 3; end-to-end encryption; security audits |
| Slow international Stripe rollout | Medium | Low | Focus US market; international is Year 5 optionality |
| High churn in free tier | High | Low | Free tier is acquisition, not revenue; track conversion, not retention |
| Donation volumes plateau | Low | High | Expand use cases: event ticketing, capital campaigns, pledges |

---

## Brand & Messaging Framework

### Core Brand Promise
> "The Exchange: Where giving connects communities."

### Audience Segments & Messaging

**Small Church (< 200 members)**
- Pain: "We're using a paper plate and Venmo for offerings."
- Message: "Get a professional donation platform free — forever. No setup fees, no contracts."
- Hook: Free tier + embedded form on existing website

**Mid-Size Church (200–2,000 members)**
- Pain: "We're paying $100+/month for Pushpay and still building our website separately."
- Message: "One platform for your website, your giving, and your CMS. Starting at $29/month."
- Hook: 14-day free trial of the full Growth plan

**Large Church / Multisite (2,000+ members)**
- Pain: "Our giving is managed by 3 different vendors. Reporting is a nightmare."
- Message: "Consolidate giving, website, CMS, and team management. Built for multi-campus churches."
- Hook: Custom Network Plan demo + dedicated onboarding

**Nonprofit / Ministry**
- Pain: "We're a small nonprofit and can't afford Salesforce NPSP or a custom website."
- Message: "Tax-deductible giving, donor management, and a beautiful website — all free to start."
- Hook: Nonprofit discount + embeddable form for existing site

---

## Conclusion

The Exchange is positioned at an inflection point. The platform is architecturally complete, competitively differentiated, and ready for market adoption. The 1% platform fee is a compounding revenue engine that rewards volume — and the unique payment splits feature creates a viral distribution loop that no competitor can quickly replicate.

The 5-year plan is built on three compounding pillars:

1. **Distribution first** (Years 1–2): Get organizations on the platform by any means necessary — ads, outreach, free tier, embedded forms, competitor targeting
2. **Network effects** (Years 3–4): Activate the social and split network to make The Exchange sticky and self-distributing
3. **Global scale** (Year 5): Use the network moat and brand authority to expand internationally and pursue institutional contracts

At $1M+/month in platform fees by Year 5, The Exchange becomes one of the most impactful financial networks for faith communities in the world — not by being the biggest platform, but by being the most connected one.

---

*The Exchange — Built for Givers. Designed for Community.*

*Document prepared February 2026 | Confidential — Internal Use Only*
