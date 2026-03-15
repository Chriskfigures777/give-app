// ─── The Exchange App — Presenter Script .docx Generator ─────────────────────
// Clean format: Name / Slide / Text — no special characters, paste-ready for AI voice tools
// Run:  node scripts/generate-presenter-script.mjs

import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  BorderStyle, convertInchesToTwip,
} from "docx";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "../The Exchange App - Presenter Script.docx");

const FONT  = "Calibri";
const NAVY  = "0F172A";
const EMR   = "10B981";
const SLATE = "64748B";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function t(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size ?? 22, color: opts.color ?? NAVY, bold: opts.bold ?? false });
}

function p(children, opts = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    spacing: { before: opts.before ?? 0, after: opts.after ?? 80 },
    alignment: opts.align ?? AlignmentType.LEFT,
  });
}

function blank() {
  return new Paragraph({ children: [t("")], spacing: { before: 0, after: 60 } });
}

function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E2E8F0" } },
    spacing: { before: 180, after: 180 },
    children: [t("")],
  });
}

// ─── Script blocks ────────────────────────────────────────────────────────────
const script = [
  {
    voice: "Sarah",
    slide: "Slide 1",
    lines: [
      "Welcome to The Exchange App, focused on digital infrastructure for the global church economy.",
      "",
      "Our mission, inspired by 2 Corinthians 5:21, is to build a platform where the Body of Christ can exchange resources, generosity, service, and support in one connected ecosystem.",
      "",
      "We are raising between $150,000 and $500,000 in seed investment, with a stewardship runway of approximately 18 to 24 months and a clear plan to reach break-even in Year 2.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 2",
    lines: [
      "The global church is the largest trust network in the world, yet it remains digitally fragmented.",
      "",
      "There are an estimated 2.3 billion Christians globally, over 380,000 US churches and faith-based nonprofits, and more than $700 billion in Christian giving worldwide. But most organizations are still running on five or more disconnected tools with no way to coordinate across them. Generosity is not the problem. Infrastructure is.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 3",
    lines: [
      "Three things converged to make this the right moment to build.",
      "",
      "Post-COVID giving behavior shifted permanently to digital. API-based fintech infrastructure from companies like Unit and Stripe made bank-grade financial tools accessible to vertical platforms for the first time without building a bank. And network-effect software became the dominant model for platforms that want to compound over time.",
      "",
      "The Exchange is positioned directly at that intersection, and the window to establish category leadership is open right now.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 4",
    lines: [
      "The Exchange brings everything into one place. Let me walk through what that actually means.",
      "",
      "Giving and donations — organizations can accept tithes, one-time gifts, and recurring giving with donor receipts and giving history built in. Joint shared giving lets two connected organizations automatically split incoming donations between them. Payment transfers let funds move directly through the network.",
      "",
      "Website builder and custom forms — churches can build and host their own site and create custom donation or intake forms without touching code.",
      "",
      "Flock management is the CRM layer — leaders track their members, flag who is active, and know who needs follow-up. AI notes turn sermon or meeting content into automatic engagement surveys. Broadcasts let them reach their entire list by SMS or email from the same dashboard.",
      "",
      "There is also a budget sheet for both individuals and organizations — completely free — so members and staff can track income, expenses, and giving all in one place. And payroll processing is coming around Month 6 for churches with staff.",
      "",
      "Most organizations today use five or more separate tools to cover what this platform does. This is not a collection of features. It is one operating system for the faith community.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 5",
    lines: [
      "Three capabilities set us apart from everything currently available.",
      "",
      "AI Notes to Engagement. When a pastor records or uploads notes from a sermon or meeting, the platform automatically generates survey questions, sends them to members, and then scores member engagement based on responses. Active members, middle-tier members, and inactive members are identified so the pastor knows exactly who needs follow-up without doing any manual tracking.",
      "",
      "Joint Shared Giving. When two organizations are connected on the platform, they can set up an automatic revenue split on incoming donations. Every time a tithe comes in, a portion automatically routes to the partner organization. No spreadsheets. No manual transfers.",
      "",
      "And the Banking Ecosystem. Around Month 12, we introduce a free banking layer — peer-to-peer transfers, fund movement, and eventually FDIC accounts and debit cards. Monetization comes from interchange over time, not from a subscription fee.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 6",
    lines: [
      "Underneath every feature on this platform is a social network. That is intentional.",
      "",
      "Today, anyone on the Exchange can search for a church, a nonprofit, or a cause they believe in, and donate directly from the results. Organizations post updates to a community feed. Members interact, share, and stay connected to the mission in between services.",
      "",
      "Two features drive organic growth at zero cost. Connect forms — when a pastor shares their in-app connect survey, members sign up directly through it. Every form completed is a new platform user, no ad spend required. And AI-generated surveys — after a pastor saves their sermon notes, the platform automatically generates follow-up survey questions and sends them to the congregation. Members stay on the platform. Engagement becomes measurable without anyone having to do it manually.",
      "",
      "Now here is where this is going. Anonymous fund requests. Someone in Georgia needs help with rent. They send a private request through their church. The church broadcasts it to their network. Real-time funds arrive from people who are willing to give. No public post. No shame. No waiting for a government program. The Body of Christ, taking care of its own, through infrastructure that makes it fast and private.",
      "",
      "Post boosting is also on the roadmap. Organizations can boost a post for ten to twenty dollars to reach a wider audience inside the Exchange network. That is a new revenue stream that does not require a third-party ad platform.",
      "",
      "And the mobile app — dedicated iOS and Android, focused on the social and discovery experience — targets a launch of six to eight months from the close of this round.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 7",
    lines: [
      "The addressable market is large and underdeveloped. Christian giving globally exceeds an estimated $700 billion annually. In the United States alone, there are approximately 380,000 churches and faith-based nonprofits.",
      "",
      "We are not trying to capture all of it. At just one percent US penetration, that represents approximately 3,800 organizations, which at our current pricing model supports roughly $3.87 million in annual recurring revenue. That is our near-term target, and it is achievable without needing to dominate the market.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 8",
    lines: [
      "Pricing is designed to remove every barrier to entry.",
      "",
      "Anyone can sign up free — individuals, donors, and organizations alike. Organizations on the free plan can accept donations, connect with other organizations, and start building their presence on the platform from day one. No credit card. No time limit.",
      "",
      "The budget sheet is also free for everyone — individuals and organizations alike. It is a full-featured tool: income tracking, fixed and variable expenses, a transaction log, net cash flow calculation, analytics with year-over-year charts, and an Excel export. The org budget is shared across all church staff and admins. And it comes with Tithe and Giving as a built-in default expense category because this platform was built for the faith community, not adapted from something generic.",
      "",
      "The $29 Basic plan and $49 Pro plan both include a 14-day free trial of premium features — specifically the website builder, AI tools, and advanced analytics. The free plan is not a stripped-down preview. It is a fully functional starting point.",
      "",
      "The $89 payroll plan is a separate product targeted for around Month 6. Banking is a separate free layer targeted for around Month 12, monetized through interchange rather than subscription fees.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 9",
    lines: [
      "Revenue is simple. Year 1 is about proving the model works. Our goal is somewhere between $50,000 and $80,000 in revenue while we prove that churches and nonprofits want this and that we can acquire them efficiently.",
      "",
      "Year 2, the platform reaches break-even. The network is growing, subscriptions are compounding, and the 1% transaction fee on every donation processed starts adding up at scale.",
      "",
      "Ads start at $1,000 a month. We do not increase spend until the data shows it is working. Everything beyond that is a private conversation, and we welcome it.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 10",
    lines: [
      "We studied the platforms most commonly used by churches and nonprofits — Subsplash, Pushpay, Tithe.ly, and Planning Center. Each one handles parts of what a church needs. Based on what we found, none of them combine giving, joint shared giving, a social network, payroll, AI notes, CRM, and a website builder in one integrated experience.",
      "",
      "The Exchange starts at $29 a month. Most alternatives start higher and still require additional tools on top. There may be others we have not found yet — but based on our research, we believe this combination is unique.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 11",
    lines: [
      "Before we spend a dollar on ads, we earn proof.",
      "",
      "Phase 0 is entirely in person. We attend conferences, visit churches directly, and onboard one to three pilot organizations at no cost. We are not selling yet. We are listening and validating. Once a pilot church has real results, we capture a short testimonial and a simple one-page story. That becomes the foundation for everything that follows. And during this phase, the platform is already generating organic growth through connect forms and AI surveys. Every member who fills out a connect survey or responds to a pastor's AI-generated survey becomes a platform user at zero cost to us.",
      "",
      "Phase 2 is controlled ad testing starting at $1,000 a month on Facebook only. We do not split attention across platforms, and we do not scale anything until the data shows it is working.",
      "",
      "Phase 3 scales what Phase 2 proved. Phase 4, once there is a large enough audience, activates a faith-based advisor referral network. Each phase earns the right to the next one.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 12",
    lines: [
      "When we do start paid advertising, the research is clear on where to begin.",
      "",
      "Facebook gives us job-title targeting at a CPM of roughly $10 to $15. We can reach Executive Pastors, Church Administrators, and Ministry Directors directly. That precision targeting does not exist at this price on any other platform.",
      "",
      "YouTube is next, using pre-roll video at $0.05 to $0.10 per view. The audience watching church management and ministry finance content on YouTube is already in the mindset we need.",
      "",
      "We test one variable at a time. Hook copy first. Then creative format. Then audience. Then the call to action. We do not scale any ad set until we have consistent results. The total 24-month ad budget is approximately $200,000, and we treat every dollar as a test before it becomes a scale.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 13",
    lines: [
      "Our advertising strategy is straightforward. We start on Facebook and we do not move to another platform until Facebook is proven.",
      "",
      "Each platform has its own creative format, its own audience behavior, and its own optimization logic. Trying to run five platforms at once with a small team and a limited budget does not produce five times the results. It produces weaker results on every channel. Focused attention on one platform builds the expertise and the data needed to make the right next move.",
      "",
      "Once Facebook is working, we add YouTube. Once both are working, we explore TikTok, faith network placements on sites like the Gospel Coalition and Blue Letter Bible, and eventually LinkedIn for larger enterprise-level churches. But not before.",
      "",
      "One proven channel funds the next. That is the strategy, and it is subject to revision based on what the data actually shows.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 14",
    lines: [
      "Every ad we run has one goal: getting a church leader to either sign up free or start a 14-day trial of the premium features.",
      "",
      "The free plan is always available and always the lowest-friction entry point. Anyone can sign up, start accepting donations, and begin exploring the platform without spending a cent. The 14-day trial specifically unlocks the website builder and AI tools, which are the premium features we believe will drive paid conversions.",
      "",
      "We do not know the exact conversion rates yet because we have not run the ads at scale. What we know is that we will measure every step of the funnel and adjust based on what we learn.",
      "",
      "Primary message: start free, no credit card. Secondary message: try the website builder free for 14 days. The free plan is not a hook. It is a real product. The trial is the on-ramp to paid.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 15",
    lines: [
      "Email is the lowest-cost retention and upgrade channel we have, built on behavioral triggers rather than a calendar.",
      "",
      "New leads from website signups and ad landing pages receive three emails over their first seven days — platform introduction, a pilot church proof story, then a free trial invitation. In-person pilot outreach is handled separately and does not feed into this sequence.",
      "",
      "Upgrade sequences run automatically. Free plan organizations receive a $29 upgrade sequence at Day 7, 14, 30, and 60. $29 plan organizations receive a $49 upgrade sequence at Day 30, 45, and 65. When the $89 payroll plan is live, $49 plan organizations see a payroll-focused sequence. Banking is introduced separately as a free feature when it launches.",
      "",
      "Trial nurture emails go out at Day 1, 3, 7, and 13. If someone reaches Day 15 without converting, they receive a 7-day extension offer. Churned users receive a win-back sequence at Day 30, 60, and 90.",
      "",
      "The platform runs on Brevo at $25 to $150 a month depending on volume.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 16",
    lines: [
      "Around Month 6, once we have real paying organizations on the platform, we launch a YouTube Creator Program.",
      "",
      "Track 1 targets creators with 5,000 to 50,000 subscribers in church administration, ministry finance, and nonprofit management. We offer them a free Pro plan in exchange for an honest review video. No scripts. No talking points. They use the product and share what they actually think.",
      "",
      "We do not move to Track 2 until 20 to 30 Track 1 videos are published. Those videos become the social proof we bring to larger creators.",
      "",
      "Track 2 targets creators with 50,000 to 500,000 subscribers at $500 to $3,000 per placement. Total program budget is $12,000. Projected output is 50 to 200 new leads per month at very low ongoing cost.",
      "",
      "A trusted creator recommending a product to an engaged audience converts at a higher rate than a paid ad. We are building that pipeline with intention.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 17",
    lines: [
      "Getting a church onto the platform is the beginning. Keeping them is where the model compounds.",
      "",
      "Every premium feature has value-framing copy at the gate, not just a paywall. Usage-limit notifications fire at 80 percent so organizations see the value before they feel the friction. The third survey a church runs triggers a CRM upgrade prompt. The third staff member added triggers a payroll plan prompt. Context is always tied to what the organization is actually doing.",
      "",
      "The financial lock-in deepens over time. Their website is here. Their payroll workflow will be here. Their giving history is here. Their donor relationships are here. Moving platforms means rebuilding all of that, not just canceling a subscription.",
      "",
      "We are targeting monthly churn below 5 percent in Phase 1 and below 3 percent as the platform matures. Organizations that adopt website, payroll, and banking together are expected to have near-zero churn.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 18",
    lines: [
      "Once an organization is on the platform — free or paid — we have three internal channels that move them toward greater engagement without any additional ad spend.",
      "",
      "The first is in-app milestones. When a church processes their first donation, we acknowledge it. When they send their first survey, we recognize it. When they add their fifth team member, we introduce the payroll plan in that context. Encouragement comes before any sales prompt.",
      "",
      "The second is SMS and email. Day 3 is a welcome message. Day 7 shows them a summary of what they have built that week. Day 14 highlights one feature they have not yet discovered. Day 30 delivers a monthly stewardship summary with context on what the next plan would add. If usage drops for three consecutive days, a check-in message goes out automatically.",
      "",
      "The third is a customer success call. Every free plan organization gets a personal call within their first 14 days. The purpose is not to sell. It is to understand what they are trying to accomplish and make sure they are getting real value. If their goals align with a paid plan, it gets mentioned naturally.",
    ],
  },
  {
    voice: "Marcus",
    slide: "Slide 19",
    lines: [
      "Over 24 months, we build toward a two-app ecosystem.",
      "",
      "Months 1 through 6 are focused on foundation. The web platform is live. Pilot churches are onboarding. The payroll feature is being built toward activation around Month 6.",
      "",
      "Months 7 through 12 bring the mobile app. We target launch of the iOS and Android social experience at roughly Month 6 to 8 from close. Paid advertising scales through this period. The first banking layer rolls out around Month 12 as a free peer-to-peer transfer product. Monetization on banking comes from interchange over time, not from a subscription.",
      "",
      "Months 13 through 24 activate post boosting inside the platform, giving churches a way to reach a wider audience for ten to twenty dollars without leaving the app. That is a new revenue stream that requires no third-party ad network. We also develop the Exchange Banking App into a more complete product — FDIC accounts, debit cards, and broader peer-to-peer capabilities. The goal is two apps that feel like one ecosystem.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 20",
    lines: [
      "The Exchange builds five compounding advantages over time.",
      "",
      "Data network effects mean every organization on the platform improves AI quality and giving benchmarks for all others. Financial lock-in deepens as organizations add payroll and banking. Community network effects compound through joint shared giving and organizational connections. Brand resonance tied to 2 Corinthians 5:21 is theological and cultural, not just a tagline. And platform stickiness grows with every feature adopted, because replacing this platform means replacing an entire operating system.",
      "",
      "The longer an organization uses The Exchange, the harder it becomes to leave and the more value it gets from staying.",
    ],
  },
  {
    voice: "Morgan",
    slide: "Slide 21",
    lines: [
      "This team is built around execution and stewardship.",
      "",
      "Christopher Figures leads product vision and platform architecture. Shawn Fair drives financial strategy, investor relationships, and sales. Nathan VandenHoek leads technical infrastructure and security.",
      "",
      "Three founders. Complementary skill sets. No outside hires required to execute Phase 1.",
    ],
  },
  {
    voice: "Sarah",
    slide: "Slide 22",
    lines: [
      "We are seeking between $150,000 and $500,000 in seed investment. Smaller checks are welcome. Every dollar will be deployed with stewardship and discipline.",
      "",
      "Here is what that investment unlocks. Phase 1: we launch, run controlled ad tests starting at $1,000 a month, and prove the model works with real organizations. Phase 2: we build the mobile app, activate payroll, and launch the free banking layer. Phase 3: we reach break-even in Year 2 without needing a second round to survive.",
      "",
      "The full financial details are available for any serious conversation. We are not hiding anything. We just believe the right place to discuss the numbers in depth is one on one, not in a video.",
    ],
  },
  {
    voice: "Sarah",
    slide: "Slide 23",
    lines: [
      "God made him who had no sin to be sin for us, so that in him we might become the righteousness of God. Second Corinthians 5:21.",
      "",
      "The Exchange is live today at theexchangeapp.church. The product is real. The market is real. And the discipline behind this plan is real.",
      "",
      "We are not asking you to believe in a concept. We are inviting you to invest in something that is already built, in a community that is ready for it, with a team that understands what faithful stewardship of your capital looks like.",
      "",
      "For follow-up, reach Christopher Figures at christopher@figuressolutions.com, or Shawn Fair at shawn@fairstewardshipgroup.com, phone 586-248-1966.",
    ],
  },
];

// ─── Build document paragraphs ────────────────────────────────────────────────
const children = [];

children.push(
  p(t("The Exchange App - Presenter Script", { bold: true, size: 32, color: NAVY }), { before: 0, after: 80 }),
  p(t("$150K–$500K Seed Round  -  23 Slides  -  Target Runtime: 7 Minutes", { size: 22, color: SLATE }), { after: 60 }),
  p(t("Voices: Sarah opens and closes. Morgan presents product and market. Marcus covers marketing slides 12-20.", { size: 20, color: SLATE }), { after: 0 }),
  rule(),
);

script.forEach(({ voice, slide, lines }) => {
  children.push(
    p(t(voice, { bold: true, size: 28, color: NAVY }), { before: 160, after: 40 }),
    p(t(slide, { size: 22, color: SLATE }), { before: 0, after: 120 }),
  );
  lines.forEach(line => {
    if (line === "") {
      children.push(blank());
    } else {
      children.push(p(t(line, { size: 22, color: NAVY })));
    }
  });
  children.push(rule());
});

// ─── Write file ───────────────────────────────────────────────────────────────
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top:    convertInchesToTwip(1.0),
          bottom: convertInchesToTwip(1.0),
          left:   convertInchesToTwip(1.1),
          right:  convertInchesToTwip(1.1),
        },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  writeFileSync(OUTPUT_PATH, buffer);
  console.log("✅  Presenter script generated:");
  console.log("    " + OUTPUT_PATH);
  console.log("");
  console.log("📌  Format: Voice name / Slide number / Clean dialogue text");
  console.log("📌  No special characters — paste-ready for AI voice tools");
  console.log("📌  3 voices: Sarah (open/close) - Morgan (product/market) - Marcus (marketing slides 11-18)");
  console.log("📌  23 slides  -  approx. 6-7 minutes runtime");
});
