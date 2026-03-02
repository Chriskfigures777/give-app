import type { PageTemplate } from '../types';

const HERO_COMMUNITY =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=85';
const HERO_NATURE =
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1920&q=85';
const HERO_HANDS =
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1920&q=85';
const HERO_CHURCH =
  'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=1920&q=85';
const HERO_KIDS =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1920&q=85';
const HERO_OFFICE =
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1920&q=85';
const IMG_MEETING =
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80';
const IMG_TEAM =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80';
const IMG_NATURE =
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80';
const IMG_VOLUNTEER =
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&q=80';
const IMG_HOPE =
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80';

const SHARED_HEADER = {
  kind: 'header' as const,
  props: {
    siteName: 'My Organization',
    showNav: true,
    navLink1Text: 'Home',
    navLink1LinkType: 'page' as const,
    navLink1Page: 'home',
    navLink1Url: '',
    navLink2Text: 'About',
    navLink2LinkType: 'page' as const,
    navLink2Page: 'about',
    navLink2Url: '',
    navLink3Text: 'Contact',
    navLink3LinkType: 'page' as const,
    navLink3Page: 'contact',
    navLink3Url: '',
  },
  gridSpan: 12,
};

const SHARED_FOOTER = {
  kind: 'footer' as const,
  props: {
    copyright: '© 2026 My Organization. All rights reserved.',
    tagline: 'Built with the Site Builder.',
  },
  gridSpan: 12,
};

/** All 24 templates are multi-page (3–5 pages each). Every template looks and feels different; every page is fully built out with header, content blocks, and footer. */
export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'multi-page-demo',
    name: 'Multi-Page (Home + About + Contact)',
    themeId: 'give',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          { ...SHARED_HEADER },
          {
            kind: 'hero',
            props: {
              title: 'Welcome',
              subtitle: 'We’re glad you’re here. Explore our site.',
              showButton: true,
              buttonText: 'Learn More',
              buttonLinkType: 'page',
              buttonLinkValue: 'about',
              backgroundImage: HERO_COMMUNITY,
              overlayOpacity: 0.45,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Get in Touch',
              description: 'We’d love to hear from you.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          { ...SHARED_HEADER },
          {
            kind: 'section',
            props: {
              title: 'About Us',
              content: 'We are a community-driven organization focused on making a difference. Edit this content to tell your story.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Story',
              content: 'Share your mission and how you got started. This layout pairs text with an image.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'This organization changed my life. I found community and purpose here.',
              author: '— A community member',
            },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          { ...SHARED_HEADER },
          {
            kind: 'contactForm',
            props: {
              title: 'Contact Us',
              subtitle: 'Send a message and we’ll get back to you.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Other Ways to Reach Us',
              content: 'You can also reach us by phone or visit in person during office hours. Check our Home page for address and hours.',
              sectionVariant: 'default',
            },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER },
        ],
      },
    ],
  },
  {
    id: 'community-hub',
    name: 'Community Hub',
    themeId: 'community',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Community Together',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Bringing People Together',
              subtitle: 'We build stronger neighborhoods through connection and action.',
              showButton: true,
              buttonText: 'Get Involved',
              buttonLinkType: 'page',
              buttonLinkValue: 'events',
              backgroundImage: HERO_COMMUNITY,
              overlayOpacity: 0.4,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'What We Do',
              content:
                'From food drives to neighborhood cleanups, we create opportunities for everyone to give back. Join hundreds of volunteers making a difference every month.',
              imageSrc: IMG_MEETING,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Impact',
              content:
                'Last year we supported over 2,000 families and planted 500 trees. Your time and donations make these numbers possible.',
              imageSrc: IMG_VOLUNTEER,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Community Breakfast',
              event1Date: 'Mar 8, 2026',
              event1Time: '9:00 AM',
              event2Title: 'Volunteer Day',
              event2Date: 'Mar 15, 2026',
              event2Time: '10:00 AM',
              event3Title: 'Town Hall',
              event3Date: 'Mar 22, 2026',
              event3Time: '6:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Join Us This Month',
              description: 'Find an event that fits your schedule and make an impact.',
              buttonText: 'View Events',
              buttonLinkType: 'page',
              buttonLinkValue: 'events',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Community Together. All rights reserved.',
              tagline: 'Stronger together.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Community Together',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About Us',
              content:
                'Community Together was founded to strengthen neighborhoods through connection and action. We believe everyone has something to give—time, skills, or resources—and that when we show up together, our communities thrive.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Story',
              content:
                'What started as a small neighborhood cleanup has grown into a network of volunteers and partners. We run food drives, tutoring programs, and community events year-round. Every project is designed with input from the people we serve.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'I moved here not knowing anyone. Community Together gave me a way to connect and give back. Now I lead the monthly breakfast.',
              author: '— Marcus T., Volunteer since 2024',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Ready to Get Involved?',
              description: 'Join our next event or sign up to volunteer.',
              buttonText: 'View Events',
              buttonLinkType: 'page',
              buttonLinkValue: 'events',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Community Together. All rights reserved.',
              tagline: 'Stronger together.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Events',
        slug: 'events',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Community Together',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Upcoming Events',
              content:
                'Join us at an upcoming gathering, volunteer day, or town hall. All events are free and open to the community. Bring a friend.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'This Month',
              event1Title: 'Community Breakfast',
              event1Date: 'Mar 8, 2026',
              event1Time: '9:00 AM',
              event2Title: 'Volunteer Day',
              event2Date: 'Mar 15, 2026',
              event2Time: '10:00 AM',
              event3Title: 'Town Hall',
              event3Date: 'Mar 22, 2026',
              event3Time: '6:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Can\'t Make It? Stay in the Loop',
              description: 'We send a monthly newsletter with events and ways to help.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Community Together. All rights reserved.',
              tagline: 'Stronger together.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Community Together',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Have a question, idea, or want to volunteer? We\'d love to hear from you.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Community Together. All rights reserved.',
              tagline: 'Stronger together.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'faith-center',
    name: 'Faith Center',
    themeId: 'faith',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Grace Community Church',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Welcome Home',
              subtitle: 'A place to belong, grow, and serve. Join us this Sunday.',
              showButton: true,
              buttonText: 'Plan Your Visit',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
              backgroundImage: HERO_CHURCH,
              overlayOpacity: 0.5,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Mission',
              content:
                'We exist to love God, love people, and make disciples. Through worship, community, and service, we help everyone discover their purpose.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'This church became my family. I found hope and direction here.',
              author: '— Sarah M., Member since 2022',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Support Our Ministry',
              description: 'Your generosity helps us serve our community and beyond.',
              buttonText: 'Give Now',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Grace Community Church.',
              tagline: 'Faith. Family. Purpose.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Grace Community Church',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About Us',
              content:
                'Grace Community Church has been a beacon of faith and fellowship in our neighborhood for decades. We are a diverse congregation united by our love for God and our commitment to serving one another and our community.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Story',
              content:
                'From our first worship service to today, we have grown in numbers and in spirit. Our building has expanded, our programs have multiplied, but our mission remains the same: to love God, love people, and make disciples.',
              imageSrc: HERO_CHURCH,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'Three generations of my family have worshipped here. It is home.',
              author: '— Robert T., Member',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Grace Community Church.',
              tagline: 'Faith. Family. Purpose.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Services',
        slug: 'services',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Grace Community Church',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Worship & Services',
              content:
                'Join us for Sunday worship at 10 a.m. We offer traditional and contemporary elements, with childcare and youth programs available. Midweek we have Bible study, small groups, and youth night.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'This Week',
              event1Title: 'Sunday Worship',
              event1Date: 'Every Sunday',
              event1Time: '10:00 AM',
              event2Title: 'Bible Study',
              event2Date: 'Wednesdays',
              event2Time: '6:30 PM',
              event3Title: 'Youth Night',
              event3Date: 'Fridays',
              event3Time: '7:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Grace Community Church.',
              tagline: 'Faith. Family. Purpose.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Grace Community Church',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'We\'d love to hear from you. Questions about visiting, serving, or joining? Send us a message.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Grace Community Church.',
              tagline: 'Faith. Family. Purpose.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'give-green',
    name: 'Give Green',
    themeId: 'give',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Green Future',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Give More. Stress Less.',
              subtitle: 'Donations for nonprofits. Fast, simple, secure—so you can focus on what matters.',
              showButton: true,
              buttonText: 'Start Giving',
              buttonLinkType: 'page',
              buttonLinkValue: 'donate',
              backgroundImage: HERO_NATURE,
              overlayOpacity: 0.45,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'How It Works',
              content:
                'We connect donors with vetted nonprofits. One platform, every donation, zero hassle. 1% fee keeps things simple—and 30% of that goes to global endowment funds.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Impact',
              content:
                'Last year we moved over $2M to vetted nonprofits. Donors get receipts and impact reports; organizations get funds quickly with low fees. Every gift makes a difference.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Ready to Give?',
              description: 'Choose your cause and amount. Every donation counts.',
              buttonText: 'Donate Now',
              buttonLinkType: 'page',
              buttonLinkValue: 'donate',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Green Future. All rights reserved.',
              tagline: 'Every donation counts.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Green Future',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About Green Future',
              content:
                'We built Green Future to make giving simple and transparent. Our platform connects donors with vetted nonprofits so every dollar goes further. We believe everyone should be able to give with confidence.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Standards',
              content:
                'Every organization on our platform goes through a verification process. We review finances, governance, and impact. Donors get receipts and impact reports; nonprofits get funds quickly.',
              imageSrc: IMG_TEAM,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Green Future. All rights reserved.',
              tagline: 'Every donation counts.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Donate',
        slug: 'donate',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Green Future',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Make Your First Donation',
              description: 'Every gift makes a difference. Choose your amount and cause. 100% of your donation goes to the nonprofit; we cover fees.',
              buttonText: 'Donate Now',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Why Give Through Us',
              content:
                'One platform, every donation, zero hassle. We send receipts, impact reports, and handle tax documentation. Give once or set up recurring giving.',
              sectionVariant: 'default',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Green Future. All rights reserved.',
              tagline: 'Every donation counts.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Green Future',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Questions? Get in Touch',
              subtitle: 'Our team is here to help you get started with giving.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Green Future. All rights reserved.',
              tagline: 'Every donation counts.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'education-first',
    name: 'Education First',
    themeId: 'education',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Learning for All',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Education Changes Everything',
              subtitle: 'We provide free tutoring, mentorship, and resources so every student can thrive.',
              showButton: true,
              buttonText: 'Learn More',
              buttonLinkType: 'page',
              buttonLinkValue: 'programs',
              backgroundImage: HERO_KIDS,
              overlayOpacity: 0.5,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Programs',
              content:
                'From after-school tutoring to college prep workshops, we support students at every stage. All programs are free and open to the community.',
              imageSrc: IMG_MEETING,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Why It Matters',
              content:
                'Studies show that students with access to mentorship and tutoring are more likely to graduate and pursue higher education. We are closing the gap, one student at a time.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Tutor Training',
              event1Date: 'Mar 10, 2026',
              event1Time: '4:00 PM',
              event2Title: 'College Info Night',
              event2Date: 'Mar 18, 2026',
              event2Time: '6:00 PM',
              event3Title: 'Family Literacy Day',
              event3Date: 'Mar 25, 2026',
              event3Time: '10:00 AM',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Get Involved',
              description: 'Sign up for a program or become a tutor.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Learning for All.',
              tagline: 'Every child deserves a chance.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Programs',
        slug: 'programs',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Learning for All',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Programs',
              content:
                'We offer after-school tutoring, college prep workshops, mentorship matching, and family literacy programs. All programs are free and open to the community. Registration opens at the start of each semester.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Tutoring',
              content:
                'One-on-one and small-group tutoring in math, reading, and writing. Our volunteer tutors are trained and background-checked. Sessions are held at local libraries and community centers.',
              imageSrc: IMG_MEETING,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'College Prep',
              content:
                'Workshops on applications, financial aid, and essay writing. We partner with local high schools and host college visits. Many of our students are first-generation college-bound.',
              imageSrc: HERO_KIDS,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Tutor Training',
              event1Date: 'Mar 10, 2026',
              event1Time: '4:00 PM',
              event2Title: 'College Info Night',
              event2Date: 'Mar 18, 2026',
              event2Time: '6:00 PM',
              event3Title: 'Family Literacy Day',
              event3Date: 'Mar 25, 2026',
              event3Time: '10:00 AM',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Learning for All.',
              tagline: 'Every child deserves a chance.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Learning for All',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Sign up for a program, become a tutor, or ask a question. We\'d love to hear from you.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Learning for All.',
              tagline: 'Every child deserves a chance.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'foundation-legacy',
    name: 'Foundation Legacy',
    themeId: 'foundation',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'The Harrison Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Grants',
              navLink2LinkType: 'page',
              navLink2Page: 'grants',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Investing in Tomorrow',
              subtitle: 'For over 30 years we have supported education, health, and the arts.',
              showButton: true,
              buttonText: 'Our Story',
              buttonLinkType: 'page',
              buttonLinkValue: 'about',
              backgroundImage: HERO_OFFICE,
              overlayOpacity: 0.55,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our History',
              content:
                'Founded in 1995, the Harrison Foundation has awarded more than $50M in grants to organizations that advance opportunity and well-being.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Focus Areas',
              content:
                'We fund initiatives in K–12 education, community health, and the performing arts. Grant applications open twice yearly.',
              imageSrc: IMG_MEETING,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Apply for a Grant',
              description: 'Learn about our application process and deadlines.',
              buttonText: 'View Guidelines',
              buttonLinkType: 'page',
              buttonLinkValue: 'grants',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 The Harrison Foundation.',
              tagline: 'Building lasting impact.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'The Harrison Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Grants',
              navLink2LinkType: 'page',
              navLink2Page: 'grants',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About the Foundation',
              content:
                'The Harrison Foundation was established to advance opportunity and well-being through strategic philanthropy. We believe in lasting impact: funding organizations and initiatives that create measurable change in education, health, and the arts.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Story',
              content:
                'Since 1995 we have partnered with hundreds of organizations. Our founders believed that private philanthropy could complement public investment—and that belief has guided every grant we make.',
              imageSrc: IMG_TEAM,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 The Harrison Foundation.',
              tagline: 'Building lasting impact.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Grants',
        slug: 'grants',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'The Harrison Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Grants',
              navLink2LinkType: 'page',
              navLink2Page: 'grants',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Grant Guidelines',
              content:
                'We fund initiatives in K–12 education, community health, and the performing arts. Grant applications open twice yearly—spring and fall. Eligible organizations must be 501(c)(3) and align with our focus areas. Typical grants range from $10,000 to $100,000.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Application Process',
              content:
                'Submit a letter of inquiry first. Selected applicants will be invited to submit a full proposal. We review applications within 90 days and notify all applicants by email.',
              sectionVariant: 'default',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Ready to Apply?',
              description: 'Contact us for current deadlines and application links.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 The Harrison Foundation.',
              tagline: 'Building lasting impact.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'The Harrison Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Grants',
              navLink2LinkType: 'page',
              navLink2Page: 'grants',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Contact Us',
              subtitle: 'For grant inquiries, partnership discussions, or general questions.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 The Harrison Foundation.',
              tagline: 'Building lasting impact.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'warm-outreach',
    name: 'Warm Outreach',
    themeId: 'warm',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Neighborhood Table',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'No One Eats Alone',
              subtitle: 'We provide hot meals and groceries to families in need. Join us.',
              showButton: true,
              buttonText: 'Volunteer',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
              backgroundImage: HERO_HANDS,
              overlayOpacity: 0.45,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Kitchen',
              content:
                'Every week our volunteers prepare and deliver hundreds of meals. We also run a free pantry with fresh produce and staples.',
              imageSrc: IMG_VOLUNTEER,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Community Dinner',
              event1Date: 'Mar 12, 2026',
              event1Time: '5:00 PM',
              event2Title: 'Pantry Sort',
              event2Date: 'Mar 19, 2026',
              event2Time: '9:00 AM',
              event3Title: 'Holiday Meal Prep',
              event3Date: 'Mar 26, 2026',
              event3Time: '10:00 AM',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Support Our Work',
              description: '$25 feeds a family for a week. Every dollar helps.',
              buttonText: 'Donate Now',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Neighborhood Table.',
              tagline: 'Fed with love.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Neighborhood Table',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About Us',
              content:
                'Neighborhood Table started when a few neighbors decided no one in our community should go hungry. Today we run a community kitchen, a free pantry, and delivery for homebound families. All of it is powered by volunteers and donations.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Impact',
              content:
                'Last year we served over 15,000 meals and distributed groceries to 500+ families. We partner with local farms for fresh produce and rely on volunteers for every shift.',
              imageSrc: IMG_VOLUNTEER,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'When I lost my job, Neighborhood Table kept my kids fed. Now I volunteer every week.',
              author: '— Lisa R., Volunteer',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Neighborhood Table.',
              tagline: 'Fed with love.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Neighborhood Table',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Want to volunteer, donate, or get help? We\'d love to hear from you.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Neighborhood Table.',
              tagline: 'Fed with love.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'ocean-calm',
    name: 'Ocean Calm',
    themeId: 'ocean',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Mindful Living',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Find Your Calm',
              subtitle: 'Wellness workshops, meditation, and support for mind and body.',
              showButton: true,
              buttonText: 'Explore Programs',
              buttonLinkType: 'page',
              buttonLinkValue: 'programs',
              backgroundImage: HERO_NATURE,
              overlayOpacity: 0.4,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Approach',
              content:
                'We believe everyone deserves access to mental wellness tools. Our programs are evidence-based and offered on a sliding scale.',
              imageSrc: IMG_HOPE,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'The workshops gave me tools I use every day. I feel more grounded and present.',
              author: '— James L.',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Start Your Journey',
              description: 'Join a workshop or schedule a consultation.',
              buttonText: 'Get in Touch',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Mindful Living.',
              tagline: 'Breathe. Grow. Thrive.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Programs',
        slug: 'programs',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Mindful Living',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Programs',
              content:
                'We offer meditation classes, stress-reduction workshops, and one-on-one support. All programs are evidence-based and designed to fit into your life. Sliding-scale pricing available.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Meditation & Mindfulness',
              content:
                'Weekly drop-in meditation, beginner series, and advanced practice groups. Our instructors are certified and our space is designed for calm and focus.',
              imageSrc: IMG_HOPE,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Workshops',
              event1Title: 'Introduction to Meditation',
              event1Date: 'Mar 9, 2026',
              event1Time: '10:00 AM',
              event2Title: 'Stress & Resilience',
              event2Date: 'Mar 16, 2026',
              event2Time: '6:00 PM',
              event3Title: 'Mindful Movement',
              event3Date: 'Mar 23, 2026',
              event3Time: '9:00 AM',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Mindful Living.',
              tagline: 'Breathe. Grow. Thrive.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Mindful Living',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Ask about programs, pricing, or partnerships. We respond within 48 hours.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Mindful Living.',
              tagline: 'Breathe. Grow. Thrive.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'hope-healing',
    name: 'Hope & Healing',
    themeId: 'hope',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Hope House',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Services',
              navLink2LinkType: 'page',
              navLink2Page: 'services',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Healing Starts Here',
              subtitle: 'Support groups, counseling, and community for those facing loss or illness.',
              showButton: true,
              buttonText: 'Learn More',
              buttonLinkType: 'page',
              buttonLinkValue: 'services',
              backgroundImage: IMG_HOPE,
              overlayOpacity: 0.5,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Services',
              content:
                'We offer peer-led support groups, one-on-one counseling referrals, and wellness workshops. All services are confidential and many are free.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'When I lost my spouse, Hope House gave me a place to grieve and heal. I\'m not alone anymore.',
              author: '— David K.',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Support Groups & Events',
              event1Title: 'Grief Support',
              event1Date: 'Mar 5, 2026',
              event1Time: '7:00 PM',
              event2Title: 'Caregiver Circle',
              event2Date: 'Mar 14, 2026',
              event2Time: '6:00 PM',
              event3Title: 'Wellness Workshop',
              event3Date: 'Mar 21, 2026',
              event3Time: '10:00 AM',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Reach Out',
              description: 'We are here to listen. Send a message or call our helpline.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Hope House.',
              tagline: 'You are not alone.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Services',
        slug: 'services',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Hope House',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Services',
              navLink2LinkType: 'page',
              navLink2Page: 'services',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'What We Offer',
              content:
                'Peer-led support groups for grief, caregiving, and illness. Referrals to licensed counselors. Wellness workshops on stress, sleep, and resilience. All services are confidential. Many are free; others are sliding-scale.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Approach',
              content:
                'We believe healing happens in community. Our facilitators are trained and many have lived experience. We create a safe, welcoming space for everyone who walks through the door.',
              imageSrc: IMG_HOPE,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Groups & Workshops',
              event1Title: 'Grief Support',
              event1Date: 'Mar 5, 2026',
              event1Time: '7:00 PM',
              event2Title: 'Caregiver Circle',
              event2Date: 'Mar 14, 2026',
              event2Time: '6:00 PM',
              event3Title: 'Wellness Workshop',
              event3Date: 'Mar 21, 2026',
              event3Time: '10:00 AM',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Hope House.',
              tagline: 'You are not alone.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Hope House',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Services',
              navLink2LinkType: 'page',
              navLink2Page: 'services',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Reach Out',
              subtitle: 'We are here to listen. Send a message or call our helpline. All inquiries are confidential.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'How can we help?',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Hope House.',
              tagline: 'You are not alone.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'professional-nonprofit',
    name: 'Professional Nonprofit',
    themeId: 'professional',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Alliance for Change',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Impact',
              navLink2LinkType: 'page',
              navLink2Page: 'impact',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Data-Driven Impact',
              subtitle: 'We partner with nonprofits to measure outcomes and scale what works.',
              showButton: true,
              buttonText: 'Our Approach',
              buttonLinkType: 'page',
              buttonLinkValue: 'impact',
              backgroundImage: HERO_OFFICE,
              overlayOpacity: 0.5,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'What We Do',
              content:
                'We provide evaluation, strategy, and capacity-building so organizations can prove and improve their impact. From logic models to dashboards.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Partners',
              content:
                'We have worked with over 200 nonprofits and foundations across education, health, and economic development. Results are published in our annual report.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Ready to Strengthen Your Impact?',
              description: 'Let us help you measure, learn, and grow.',
              buttonText: 'Get in Touch',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Alliance for Change.',
              tagline: 'Impact that lasts.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Impact',
        slug: 'impact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Alliance for Change',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Impact',
              navLink2LinkType: 'page',
              navLink2Page: 'impact',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Approach',
              content:
                'We help nonprofits design and implement evaluation frameworks, build dashboards, and use data for decision-making. Our work spans logic models, outcome measurement, and capacity-building.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Case Studies',
              content:
                'From education to health to economic development, we have helped organizations prove and improve their impact. Our annual report shares aggregated results and lessons learned.',
              imageSrc: IMG_TEAM,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Partner With Us',
              description: 'Let us help you measure, learn, and grow.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Alliance for Change.',
              tagline: 'Impact that lasts.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Alliance for Change',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Impact',
              navLink2LinkType: 'page',
              navLink2Page: 'impact',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Contact Us',
              subtitle: 'For partnership and project inquiries. We respond within 48 hours.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Submit',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Alliance for Change.',
              tagline: 'Impact that lasts.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'heritage-church',
    name: 'Heritage Church',
    themeId: 'heritage',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'First Presbyterian',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Rooted in Faith, Reaching Forward',
              subtitle: 'Serving our community since 1852. Worship with us Sundays at 10 a.m.',
              showButton: true,
              buttonText: 'Join Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'about',
              backgroundImage: HERO_CHURCH,
              overlayOpacity: 0.55,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Story',
              content:
                'For over 170 years we have been a beacon of faith and service. Our building and our mission have evolved, but our commitment to the gospel and our neighbors remains.',
              imageSrc: HERO_CHURCH,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'Three generations of my family have worshipped here. It is home.',
              author: '— Robert T.',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Support Our Ministry',
              description: 'Giving supports worship, outreach, and our building fund.',
              buttonText: 'Give',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 First Presbyterian.',
              tagline: 'Faith. Tradition. Community.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'First Presbyterian',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About Us',
              content:
                'First Presbyterian has been a pillar of faith and community since 1852. We are a congregation rooted in the Reformed tradition, committed to worship, discipleship, and service to our neighbors.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our History',
              content:
                'Our sanctuary has stood for over a century. Through wars, depressions, and change, we have gathered for worship, fellowship, and outreach. Today we continue that legacy with contemporary programs and timeless faith.',
              imageSrc: HERO_CHURCH,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Worship & Programs',
              event1Title: 'Sunday Worship',
              event1Date: 'Every Sunday',
              event1Time: '10:00 AM',
              event2Title: 'Adult Study',
              event2Date: 'Wednesdays',
              event2Time: '7:00 PM',
              event3Title: 'Choir Rehearsal',
              event3Date: 'Thursdays',
              event3Time: '6:30 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 First Presbyterian.',
              tagline: 'Faith. Tradition. Community.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'First Presbyterian',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'We\'d love to hear from you. Questions about visiting, membership, or outreach?',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 First Presbyterian.',
              tagline: 'Faith. Tradition. Community.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'serene-mission',
    name: 'Serene Mission',
    themeId: 'serene',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Peace Project',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Building Peace, One Step at a Time',
              subtitle: 'Dialogue, mediation, and education for a more peaceful world.',
              showButton: true,
              buttonText: 'Get Involved',
              buttonLinkType: 'page',
              buttonLinkValue: 'about',
              backgroundImage: HERO_NATURE,
              overlayOpacity: 0.45,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Work',
              content:
                'We train facilitators, run community dialogues, and partner with schools and organizations to reduce conflict and build understanding.',
              imageSrc: IMG_MEETING,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Why Dialogue Matters',
              content:
                'When people listen to each other, change happens. Our programs have reached thousands of participants in 15 countries.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Facilitator Training',
              event1Date: 'Mar 11, 2026',
              event1Time: '9:00 AM',
              event2Title: 'Community Dialogue',
              event2Date: 'Mar 20, 2026',
              event2Time: '6:00 PM',
              event3Title: 'Youth Summit',
              event3Date: 'Mar 28, 2026',
              event3Time: '2:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Join Us',
              description: 'Train as a facilitator or attend a dialogue near you.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Peace Project.',
              tagline: 'Listen. Understand. Act.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Peace Project',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About Peace Project',
              content:
                'We believe peace is built through listening, dialogue, and understanding. Our facilitators work in schools, communities, and organizations to reduce conflict and build bridges. We have trained thousands of people in 15 countries.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Approach',
              content:
                'We use evidence-based dialogue methods and mediation techniques. Every program is tailored to the context—schools, workplaces, or communities—and designed to create lasting change.',
              imageSrc: IMG_MEETING,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Peace Project.',
              tagline: 'Listen. Understand. Act.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Peace Project',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Interested in training, a dialogue, or a partnership? We\'d love to hear from you.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Peace Project.',
              tagline: 'Listen. Understand. Act.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'bold-action',
    name: 'Bold Action',
    themeId: 'bold',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Rapid Response',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Donate',
              navLink2LinkType: 'page',
              navLink2Page: 'donate',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'When Disaster Strikes, We Move',
              subtitle: 'Emergency aid, medical supplies, and shelter for communities in crisis.',
              showButton: true,
              buttonText: 'Donate Now',
              buttonLinkType: 'page',
              buttonLinkValue: 'donate',
              backgroundImage: HERO_HANDS,
              overlayOpacity: 0.5,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Response',
              content:
                'We deploy within 72 hours of a disaster. Your donation funds kits, logistics, and on-the-ground teams. Every dollar saves lives.',
              imageSrc: IMG_VOLUNTEER,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'How We Work',
              content:
                'Rapid Response maintains a network of trained volunteers and pre-positioned supplies. When disaster strikes, we coordinate with local partners and deploy immediately. 100% of donations go directly to crisis response.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Volunteer With Us',
              description: 'Join our trained response network. Training is free and ongoing.',
              buttonText: 'Sign Up',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Rapid Response.',
              tagline: 'Fast. Effective. Compassionate.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Donate',
        slug: 'donate',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Rapid Response',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Donate',
              navLink2LinkType: 'page',
              navLink2Page: 'donate',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Give to Emergency Relief',
              description: '100% of donations go directly to crisis response. No overhead. Every dollar saves lives.',
              buttonText: 'Donate Now',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Where Your Gift Goes',
              content:
                'Supplies and kits, logistics and transport, and on-the-ground teams. We publish annual reports and real-time updates so you can see the impact of your gift.',
              sectionVariant: 'default',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Rapid Response.',
              tagline: 'Fast. Effective. Compassionate.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Rapid Response',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Donate',
              navLink2LinkType: 'page',
              navLink2Page: 'donate',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Donate, volunteer, or partner with us. We respond within 24 hours.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Rapid Response.',
              tagline: 'Fast. Effective. Compassionate.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'institutional',
    name: 'Institutional',
    themeId: 'institutional',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Center for Civic Engagement',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Advancing the Public Good',
              subtitle: 'Research, policy, and programs that strengthen democracy and civil society.',
              showButton: true,
              buttonText: 'Explore',
              buttonLinkType: 'page',
              buttonLinkValue: 'programs',
              backgroundImage: HERO_OFFICE,
              overlayOpacity: 0.5,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Mission',
              content:
                'We convene leaders, fund research, and pilot programs that increase civic participation and trust in institutions. Founded at the university, now national in scope.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Events & Convenings',
              event1Title: 'Policy Roundtable',
              event1Date: 'Mar 9, 2026',
              event1Time: '12:00 PM',
              event2Title: 'Youth Civic Summit',
              event2Date: 'Mar 16, 2026',
              event2Time: '9:00 AM',
              event3Title: 'Annual Lecture',
              event3Date: 'Mar 30, 2026',
              event3Time: '4:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Get Involved',
              description: 'Attend an event, partner with us, or support our work.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Center for Civic Engagement.',
              tagline: 'Informed. Engaged. Effective.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Programs',
        slug: 'programs',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Center for Civic Engagement',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Programs',
              content:
                'We run research initiatives, policy convenings, and pilot programs that increase civic participation and trust in institutions. Our work spans K–12 civic education, voter engagement, and institutional reform.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Research & Policy',
              content:
                'Our researchers publish on civic participation, trust in institutions, and democratic resilience. We partner with universities, governments, and nonprofits to translate research into action.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Policy Roundtable',
              event1Date: 'Mar 9, 2026',
              event1Time: '12:00 PM',
              event2Title: 'Youth Civic Summit',
              event2Date: 'Mar 16, 2026',
              event2Time: '9:00 AM',
              event3Title: 'Annual Lecture',
              event3Date: 'Mar 30, 2026',
              event3Time: '4:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Center for Civic Engagement.',
              tagline: 'Informed. Engaged. Effective.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Center for Civic Engagement',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Contact',
              subtitle: 'For press, partnerships, or general inquiries. We respond within 48 hours.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Center for Civic Engagement.',
              tagline: 'Informed. Engaged. Effective.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'church-welcome',
    name: 'Church Welcome',
    themeId: 'church',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'New Life Church',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'You Belong Here',
              subtitle: 'A diverse, welcoming community. Worship with us in person or online.',
              showButton: true,
              buttonText: 'Watch Live',
              buttonLinkType: 'page',
              buttonLinkValue: 'about',
              backgroundImage: HERO_CHURCH,
              overlayOpacity: 0.45,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'What to Expect',
              content:
                'Casual dress, live music, and a message that applies to everyday life. Kids and youth programs available. Coffee and connection after service.',
              imageSrc: IMG_MEETING,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'This Week',
              event1Title: 'Sunday Worship',
              event1Date: 'Every Sunday',
              event1Time: '10:00 AM',
              event2Title: 'Small Groups',
              event2Date: 'Wednesdays',
              event2Time: '6:30 PM',
              event3Title: 'Youth Night',
              event3Date: 'Fridays',
              event3Time: '7:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Give',
              description: 'Your generosity supports our ministry and mission.',
              buttonText: 'Give Online',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 New Life Church.',
              tagline: 'Love God. Love people.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'New Life Church',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About New Life',
              content:
                'We are a diverse, welcoming community committed to loving God and loving people. Whether you\'re new to faith or have been on the journey for years, you belong here. We worship, grow, and serve together.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Values',
              content:
                'We believe in grace, authenticity, and community. Our services are designed to be accessible—casual dress, clear teaching, and space for questions. Kids and youth have their own programs every week.',
              imageSrc: HERO_CHURCH,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'I walked in not knowing what to expect. I left knowing I\'d found my people.',
              author: '— Jessica M.',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 New Life Church.',
              tagline: 'Love God. Love people.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'New Life Church',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Connect With Us',
              subtitle: 'Questions about visiting, small groups, or getting involved? We\'d love to hear from you.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 New Life Church.',
              tagline: 'Love God. Love people.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'minimal-impact',
    name: 'Minimal Impact',
    themeId: 'minimal',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Simple Give',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Less Noise. More Impact.',
              subtitle: 'We fund proven programs. No fluff, no waste—just results.',
              showButton: true,
              buttonText: 'See Our Work',
              buttonLinkType: 'page',
              buttonLinkValue: 'about',
              backgroundImage: HERO_NATURE,
              overlayOpacity: 0.5,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'How We Operate',
              content:
                'We raise money and give it to organizations with strong track records. Our overhead is under 5%. Transparency is core to who we are.',
              imageSrc: IMG_TEAM,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Focus',
              content:
                'Clean water, education, and health. We choose a few areas and go deep rather than spreading thin.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Give Simply.',
              description: 'Every dollar goes to proven programs. No fluff.',
              buttonText: 'Donate',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Simple Give.',
              tagline: 'Give simply. Give well.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Simple Give',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About Simple Give',
              content:
                'We exist to move money to organizations that get results. We vet every partner, publish our criteria, and keep overhead under 5%. No fluff, no waste—just impact.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Focus',
              content:
                'Clean water, education, and health. We choose a few areas and go deep. Every grant is tied to outcomes. We publish annual reports so donors see exactly where their money goes.',
              sectionVariant: 'default',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Simple Give.',
              tagline: 'Give simply. Give well.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Simple Give',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Questions about giving or partnerships? We respond within 48 hours.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Simple Give.',
              tagline: 'Give simply. Give well.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'sunrise-youth',
    name: 'Sunrise Youth',
    themeId: 'sunrise',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Youth Rise',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'The Future Starts With You',
              subtitle: 'Mentorship, leadership, and opportunities for young people.',
              showButton: true,
              buttonText: 'Join Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'programs',
              backgroundImage: HERO_KIDS,
              overlayOpacity: 0.4,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'What We Offer',
              content:
                'After-school programs, summer camps, college prep, and job readiness. All programs are free and designed with youth input.',
              imageSrc: IMG_VOLUNTEER,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'What\'s Happening',
              event1Title: 'Open House',
              event1Date: 'Mar 7, 2026',
              event1Time: '4:00 PM',
              event2Title: 'Career Day',
              event2Date: 'Mar 14, 2026',
              event2Time: '10:00 AM',
              event3Title: 'Summer Sign-Up',
              event3Date: 'Mar 28, 2026',
              event3Time: '5:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Be a Mentor',
              description: 'One hour a week can change a life.',
              buttonText: 'Apply Now',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Youth Rise.',
              tagline: 'Rise up.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Programs',
        slug: 'programs',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Youth Rise',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Programs',
              content:
                'After-school programs, summer camps, college prep, and job readiness. All programs are free and designed with youth input. We partner with schools and employers to create pathways to success.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Mentorship',
              content:
                'One-on-one and group mentorship for youth. Our mentors are trained and background-checked. One hour a week can change a life—apply to be a mentor or a mentee.',
              imageSrc: IMG_VOLUNTEER,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Open House',
              event1Date: 'Mar 7, 2026',
              event1Time: '4:00 PM',
              event2Title: 'Career Day',
              event2Date: 'Mar 14, 2026',
              event2Time: '10:00 AM',
              event3Title: 'Summer Sign-Up',
              event3Date: 'Mar 28, 2026',
              event3Time: '5:00 PM',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Youth Rise.',
              tagline: 'Rise up.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Youth Rise',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Sign up for a program, apply to be a mentor, or ask a question. We\'d love to hear from you.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Youth Rise.',
              tagline: 'Rise up.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    themeId: 'forest',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Green Earth Alliance',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Projects',
              navLink2LinkType: 'page',
              navLink2Page: 'projects',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Protect. Restore. Sustain.',
              subtitle: 'We work with communities to conserve forests and fight climate change.',
              showButton: true,
              buttonText: 'Our Work',
              buttonLinkType: 'page',
              buttonLinkValue: 'projects',
              backgroundImage: IMG_NATURE,
              overlayOpacity: 0.45,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Where We Work',
              content:
                'From local reforestation to international policy, we support projects that protect biodiversity and livelihoods. Over 1M trees planted to date.',
              imageSrc: IMG_NATURE,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Get Involved',
              content:
                'Donate, volunteer, or partner with us. Every action counts for the planet and future generations.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Support Our Mission',
              description: 'Your gift funds planting, advocacy, and community programs.',
              buttonText: 'Donate',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Green Earth Alliance.',
              tagline: 'For the planet. For each other.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Projects',
        slug: 'projects',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Green Earth Alliance',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Projects',
              navLink2LinkType: 'page',
              navLink2Page: 'projects',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Projects',
              content:
                'We work with communities on reforestation, forest protection, and climate advocacy. Projects range from local tree-planting to international policy. Over 1M trees planted to date.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Reforestation',
              content:
                'We partner with landowners, governments, and communities to restore forests. Every project is designed for long-term survival and local benefit.',
              imageSrc: IMG_NATURE,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Get Involved',
              description: 'Donate, volunteer, or partner with us.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Green Earth Alliance.',
              tagline: 'For the planet. For each other.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Green Earth Alliance',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Projects',
              navLink2LinkType: 'page',
              navLink2Page: 'projects',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Get in Touch',
              subtitle: 'Questions about donating, volunteering, or partnering? We\'d love to hear from you.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send Message',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Green Earth Alliance.',
              tagline: 'For the planet. For each other.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'royal-foundation',
    name: 'Royal Foundation',
    themeId: 'royal',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'The Crown Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Grants',
              navLink2LinkType: 'page',
              navLink2Page: 'grants',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Excellence in Giving',
              subtitle: 'Supporting the arts, education, and health for over 50 years.',
              showButton: true,
              buttonText: 'Our Legacy',
              buttonLinkType: 'page',
              buttonLinkValue: 'about',
              backgroundImage: HERO_OFFICE,
              overlayOpacity: 0.55,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our History',
              content:
                'The Crown Foundation was established to advance excellence in key areas of public life. We award grants to institutions and innovators worldwide.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Focus Areas',
              content:
                'Arts & culture, higher education, and global health. We seek partners who share our commitment to lasting impact.',
              imageSrc: IMG_MEETING,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Partner With Us',
              description: 'Institutional and major donor inquiries welcome.',
              buttonText: 'Contact',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 The Crown Foundation.',
              tagline: 'Excellence. Integrity. Impact.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'The Crown Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Grants',
              navLink2LinkType: 'page',
              navLink2Page: 'grants',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About the Foundation',
              content:
                'The Crown Foundation was established to advance excellence in the arts, education, and health. For over 50 years we have awarded grants to institutions and innovators worldwide who share our commitment to lasting impact.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Approach',
              content:
                'We fund institutions and individuals who demonstrate excellence, integrity, and impact. Grant applications are by invitation; we also conduct proactive outreach in our focus areas.',
              imageSrc: IMG_TEAM,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 The Crown Foundation.',
              tagline: 'Excellence. Integrity. Impact.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Grants',
        slug: 'grants',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'The Crown Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Grants',
              navLink2LinkType: 'page',
              navLink2Page: 'grants',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Grant Programs',
              content:
                'We award grants in the arts, higher education, and global health. Applications are typically by invitation. For inquiries about eligibility or partnership, please contact us.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 The Crown Foundation.',
              tagline: 'Excellence. Integrity. Impact.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'The Crown Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Grants',
              navLink2LinkType: 'page',
              navLink2Page: 'grants',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Contact Us',
              subtitle: 'For grant inquiries, institutional partnerships, or major donor discussions.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 The Crown Foundation.',
              tagline: 'Excellence. Integrity. Impact.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'clean-modern',
    name: 'Clean Modern',
    themeId: 'clean',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Studio for Good',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Design That Serves.',
              subtitle: 'We help nonprofits and social enterprises tell their story with clarity and impact.',
              showButton: true,
              buttonText: 'View Work',
              button2Text: 'Schedule a Call',
              heroVariant: 'centerBadge',
              backgroundImage: HERO_OFFICE,
              overlayOpacity: 0.5,
              minHeight: 560,
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'What We Do',
              sectionVariant: 'card',
              content:
                'Branding, websites, and campaigns for organizations that are changing the world. We believe great design should be accessible to every mission.',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Start a Conversation',
              description: 'Tell us about your project. We respond within 48 hours.',
              buttonText: 'Get in Touch',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Studio for Good.',
              tagline: 'Design with purpose.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Studio for Good',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About Studio for Good',
              sectionVariant: 'elevated',
              content:
                'We are a design studio that works exclusively with nonprofits and social enterprises. We believe great design should be accessible to every mission—so we offer branding, websites, and campaigns at accessible rates.',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Approach',
              content:
                'We start with strategy: who you serve, what you do, and why it matters. Then we translate that into visual identity, web design, and campaigns that move people to action.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Studio for Good.',
              tagline: 'Design with purpose.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Studio for Good',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Start a Conversation',
              subtitle: 'Tell us about your project. We respond within 48 hours.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Project details',
              buttonText: 'Send',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Studio for Good.',
              tagline: 'Design with purpose.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'compassion-care',
    name: 'Compassion Care',
    themeId: 'compassion',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Hearts United',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Care in Action',
              subtitle: 'We support families in crisis with food, counseling, and a caring community.',
              showButton: true,
              buttonText: 'Get Help',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
              backgroundImage: HERO_HANDS,
              overlayOpacity: 0.45,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Programs',
              content:
                'Emergency assistance, support groups, and referrals. We meet people where they are and walk alongside them toward stability and hope.',
              imageSrc: IMG_HOPE,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'When I had nowhere to turn, Hearts United was there. They helped me get back on my feet.',
              author: '— Maria G.',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Reach Out',
              description: 'Need support or want to volunteer? We are here.',
              buttonText: 'Contact Us',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Hearts United.',
              tagline: 'You matter.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Programs',
        slug: 'programs',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Hearts United',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'What We Offer',
              content:
                'Emergency assistance for rent, utilities, and food. Support groups for grief, addiction, and parenting. Referrals to counseling and other services. All programs are confidential and many are free.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Approach',
              content:
                'We meet people where they are. No judgment, no red tape—just care and connection. Our staff and volunteers are trained to listen and connect people to the help they need.',
              imageSrc: IMG_HOPE,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'testimonial',
            props: {
              quote: 'Hearts United didn\'t just give me food—they gave me hope. I\'m back on my feet and now I volunteer.',
              author: '— James W.',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Hearts United.',
              tagline: 'You matter.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Hearts United',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'Programs',
              navLink2LinkType: 'page',
              navLink2Page: 'programs',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Reach Out',
              subtitle: 'Need support or want to volunteer? We are here. All inquiries are confidential.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 Hearts United.',
              tagline: 'You matter.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  {
    id: 'trust-give',
    name: 'Trust & Give',
    themeId: 'trust',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'SecureGive Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Give With Confidence',
              subtitle: 'Transparent, secure giving. We ensure your donation reaches vetted nonprofits.',
              showButton: true,
              buttonText: 'Donate',
              buttonLinkType: 'page',
              buttonLinkValue: 'donate',
              backgroundImage: HERO_OFFICE,
              overlayOpacity: 0.5,
              minHeight: 560,
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'How We Work',
              content:
                'We verify every organization on our platform. Donors get receipts and impact reports. Nonprofits get funds quickly with low fees.',
              imageSrc: IMG_TEAM,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Standards',
              content:
                'Financial transparency, governance review, and outcome reporting. We only list nonprofits that meet our criteria.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Make a Donation',
              description: 'Choose a cause. Give once or monthly. See the impact.',
              buttonText: 'Give Now',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 SecureGive Foundation.',
              tagline: 'Trusted giving.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'SecureGive Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'About SecureGive',
              content:
                'We built SecureGive to make giving transparent and secure. Every organization on our platform is vetted for financial transparency, governance, and impact. Donors get receipts and impact reports; nonprofits get funds quickly.',
              sectionVariant: 'elevated',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Verification Process',
              content:
                'We review finances, governance, and outcome reporting. We only list nonprofits that meet our criteria. Donors can give with confidence.',
              imageSrc: IMG_TEAM,
              imagePosition: 'right',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 SecureGive Foundation.',
              tagline: 'Trusted giving.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Donate',
        slug: 'donate',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'SecureGive Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: {
              title: 'Make a Donation',
              description: 'Choose a cause. Give once or monthly. Every donation is secure and you\'ll receive a receipt and impact report.',
              buttonText: 'Give Now',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Why Give Through Us',
              content:
                'We verify every organization. You get receipts and impact reports. Nonprofits get funds quickly with low fees. Give with confidence.',
              sectionVariant: 'default',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 SecureGive Foundation.',
              tagline: 'Trusted giving.',
            },
            gridSpan: 12,
          },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'SecureGive Foundation',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'contactForm',
            props: {
              title: 'Contact',
              subtitle: 'Questions about giving or becoming a partner nonprofit? We respond within 48 hours.',
              nameLabel: 'Name',
              emailLabel: 'Email',
              messageLabel: 'Message',
              buttonText: 'Send',
            },
            gridSpan: 12,
          },
          {
            kind: 'footer',
            props: {
              copyright: '© 2026 SecureGive Foundation.',
              tagline: 'Trusted giving.',
            },
            gridSpan: 12,
          },
        ],
      },
    ],
  },
  // Full multi-page templates with nav linking to pages
  {
    id: 'nonprofit-full-site',
    name: 'Nonprofit Full Site (5 pages)',
    themeId: 'give',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Community First',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Building Stronger Communities',
              subtitle: 'Together we create lasting change. Join us.',
              showButton: true,
              buttonText: 'Get Involved',
              buttonLinkType: 'page',
              buttonLinkValue: 'programs',
              backgroundImage: HERO_COMMUNITY,
              overlayOpacity: 0.45,
              minHeight: 560,
              heroVariant: 'center',
            },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: {
              title: 'Our Impact',
              content: 'Last year we supported over 2,000 families. Your time and donations make it possible.',
              imageSrc: IMG_VOLUNTEER,
              imagePosition: 'left',
            },
            gridSpan: 12,
          },
          {
            kind: 'cta',
            props: {
              headline: 'Ready to Make a Difference?',
              description: 'Donate or volunteer today.',
              buttonText: 'Donate Now',
              buttonLinkType: 'page',
              buttonLinkValue: 'donate',
            },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Community First.', tagline: 'Stronger together.' } },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          { ...SHARED_HEADER, props: { ...SHARED_HEADER.props, siteName: 'Community First', navLink1Text: 'Home', navLink1Page: 'home', navLink2Text: 'About', navLink2Page: 'about', navLink3Text: 'Contact', navLink3Page: 'contact' } },
          {
            kind: 'section',
            props: { title: 'About Us', content: 'We are a community-driven organization focused on making a difference. Edit this content to tell your story.', sectionVariant: 'card' },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: { title: 'Our Story', content: 'Share your mission and how you got started.', imageSrc: IMG_TEAM, imagePosition: 'left' },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Community First.' } },
        ],
      },
      {
        name: 'Programs',
        slug: 'programs',
        blocks: [
          { ...SHARED_HEADER, props: { ...SHARED_HEADER.props, siteName: 'Community First', navLink1Text: 'Home', navLink1Page: 'home', navLink2Text: 'About', navLink2Page: 'about', navLink3Text: 'Programs', navLink3Page: 'programs' } },
          {
            kind: 'section',
            props: { title: 'Our Programs', content: 'From food drives to tutoring—we offer many ways to get involved.', sectionVariant: 'elevated' },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Community Breakfast',
              event1Date: 'Mar 8, 2026',
              event1Time: '9:00 AM',
              event2Title: 'Volunteer Day',
              event2Date: 'Mar 15, 2026',
              event2Time: '10:00 AM',
              event3Title: 'Town Hall',
              event3Date: 'Mar 22, 2026',
              event3Time: '6:00 PM',
            },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Community First.' } },
        ],
      },
      {
        name: 'Donate',
        slug: 'donate',
        blocks: [
          { ...SHARED_HEADER, props: { ...SHARED_HEADER.props, siteName: 'Community First', navLink1Text: 'Home', navLink1Page: 'home', navLink2Text: 'About', navLink2Page: 'about', navLink3Text: 'Donate', navLink3Page: 'donate' } },
          {
            kind: 'donate',
            props: { title: 'Support Our Cause', description: 'Every gift makes a difference.', buttonText: 'Donate Now' },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Community First.' } },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          { ...SHARED_HEADER, props: { ...SHARED_HEADER.props, siteName: 'Community First', navLink1Text: 'Home', navLink1Page: 'home', navLink2Text: 'About', navLink2Page: 'about', navLink3Text: 'Contact', navLink3Page: 'contact' } },
          {
            kind: 'contactForm',
            props: { title: 'Contact Us', subtitle: 'Send a message and we’ll get back to you.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send Message' },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Community First.' } },
        ],
      },
    ],
  },
  {
    id: 'church-full-site',
    name: 'Church Full Site (5 pages)',
    themeId: 'faith',
    pages: [
      {
        name: 'Home',
        slug: 'home',
        blocks: [
          {
            kind: 'header',
            props: {
              siteName: 'Grace Community Church',
              showNav: true,
              navLink1Text: 'Home',
              navLink1LinkType: 'page',
              navLink1Page: 'home',
              navLink1Url: '',
              navLink2Text: 'About',
              navLink2LinkType: 'page',
              navLink2Page: 'about',
              navLink2Url: '',
              navLink3Text: 'Contact',
              navLink3LinkType: 'page',
              navLink3Page: 'contact',
              navLink3Url: '',
            },
            gridSpan: 12,
          },
          {
            kind: 'hero',
            props: {
              title: 'Welcome Home',
              subtitle: 'A place to belong, grow, and serve. Join us this Sunday.',
              showButton: true,
              buttonText: 'Plan Your Visit',
              buttonLinkType: 'page',
              buttonLinkValue: 'contact',
              backgroundImage: HERO_CHURCH,
              overlayOpacity: 0.5,
              minHeight: 560,
              heroVariant: 'center',
            },
            gridSpan: 12,
          },
          {
            kind: 'section',
            props: {
              title: 'Our Mission',
              content: 'We exist to love God, love people, and make disciples. Through worship, community, and service.',
              sectionVariant: 'card',
            },
            gridSpan: 12,
          },
          {
            kind: 'donate',
            props: { title: 'Support Our Ministry', description: 'Your generosity helps us serve our community.', buttonText: 'Give Now' },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Grace Community Church.', tagline: 'Faith. Family. Purpose.' } },
        ],
      },
      {
        name: 'About',
        slug: 'about',
        blocks: [
          { ...SHARED_HEADER, props: { ...SHARED_HEADER.props, siteName: 'Grace Community Church', navLink1Text: 'Home', navLink1Page: 'home', navLink2Text: 'About', navLink2Page: 'about', navLink3Text: 'Contact', navLink3Page: 'contact' } },
          {
            kind: 'section',
            props: { title: 'About Us', content: 'We are a community of faith serving our neighborhood. Edit this content to tell your story.', sectionVariant: 'card' },
            gridSpan: 12,
          },
          {
            kind: 'mediaSection',
            props: { title: 'Our Story', content: 'Share your mission and how you got started.', imageSrc: HERO_CHURCH, imagePosition: 'left' },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Grace Community Church.' } },
        ],
      },
      {
        name: 'Services',
        slug: 'services',
        blocks: [
          { ...SHARED_HEADER, props: { ...SHARED_HEADER.props, siteName: 'Grace Community Church', navLink1Text: 'Home', navLink1Page: 'home', navLink2Text: 'About', navLink2Page: 'about', navLink3Text: 'Services', navLink3Page: 'services' } },
          {
            kind: 'section',
            props: { title: 'Worship & Services', content: 'Sunday worship at 10 a.m. Midweek groups and youth programs.', sectionVariant: 'elevated' },
            gridSpan: 12,
          },
          {
            kind: 'events',
            props: {
              title: 'Upcoming Events',
              event1Title: 'Sunday Worship',
              event1Date: 'Every Sunday',
              event1Time: '10:00 AM',
              event2Title: 'Bible Study',
              event2Date: 'Wednesdays',
              event2Time: '6:30 PM',
              event3Title: 'Youth Night',
              event3Date: 'Fridays',
              event3Time: '7:00 PM',
            },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Grace Community Church.' } },
        ],
      },
      {
        name: 'Give',
        slug: 'give',
        blocks: [
          { ...SHARED_HEADER, props: { ...SHARED_HEADER.props, siteName: 'Grace Community Church', navLink1Text: 'Home', navLink1Page: 'home', navLink2Text: 'About', navLink2Page: 'about', navLink3Text: 'Give', navLink3Page: 'give' } },
          {
            kind: 'donate',
            props: { title: 'Support Our Ministry', description: 'Giving supports worship, outreach, and our building fund.', buttonText: 'Give Now' },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Grace Community Church.' } },
        ],
      },
      {
        name: 'Contact',
        slug: 'contact',
        blocks: [
          { ...SHARED_HEADER, props: { ...SHARED_HEADER.props, siteName: 'Grace Community Church', navLink1Text: 'Home', navLink1Page: 'home', navLink2Text: 'About', navLink2Page: 'about', navLink3Text: 'Contact', navLink3Page: 'contact' } },
          {
            kind: 'contactForm',
            props: { title: 'Get in Touch', subtitle: 'We’d love to hear from you.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send Message' },
            gridSpan: 12,
          },
          { ...SHARED_FOOTER, props: { ...SHARED_FOOTER.props, copyright: '© 2026 Grace Community Church.' } },
        ],
      },
    ],
  },
];
