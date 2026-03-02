import type { ComponentKind } from '../types';
import type { BlockProps } from '../types';

const HERO_IMG = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=85';
const HERO_NATURE = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1920&q=85';
const HERO_HANDS = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1920&q=85';
const HERO_CHURCH = 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=1920&q=85';
const HERO_KIDS = 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1920&q=85';
const HERO_OFFICE = 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1920&q=85';
const IMG_MEETING = 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80';
const IMG_TEAM = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80';

export interface ComponentLibraryPreset {
  id: string;
  label: string;
  props: BlockProps;
  defaultGridSpan?: number;
}

type LibraryMap = Partial<Record<ComponentKind, ComponentLibraryPreset[]>>;

export const COMPONENT_LIBRARIES: LibraryMap = {
  hero: [
    { id: 'hero-center-1', label: 'Center · Full width', props: { title: 'Welcome to Our Community', subtitle: 'Building a better world together.', showButton: true, buttonText: 'Get Started', heroVariant: 'center', backgroundImage: HERO_IMG, overlayOpacity: 0.45, minHeight: 560 } },
    { id: 'hero-center-2', label: 'Center · Nature', props: { title: 'Make an Impact Today', subtitle: 'Join thousands making a difference.', showButton: true, buttonText: 'Learn More', heroVariant: 'center', backgroundImage: HERO_NATURE, overlayOpacity: 0.4, minHeight: 580 } },
    { id: 'hero-center-3', label: 'Center · Hands / giving', props: { title: 'Give Back. Grow Together.', subtitle: 'Volunteer and donate in your community.', showButton: true, buttonText: 'Get Involved', heroVariant: 'center', backgroundImage: HERO_HANDS, overlayOpacity: 0.5, minHeight: 560 } },
    { id: 'hero-badge', label: 'Center with badge', props: { title: 'Your Headline Here', subtitle: 'A supporting line that draws people in.', showButton: true, buttonText: 'Start Now', heroVariant: 'centerBadge', backgroundImage: HERO_IMG, overlayOpacity: 0.45, minHeight: 560 } },
    { id: 'hero-left-1', label: 'Left-aligned · Classic', props: { title: 'Advancing the Public Good', subtitle: 'Research, policy, and programs that strengthen community.', showButton: true, buttonText: 'Explore', heroVariant: 'left', backgroundImage: HERO_OFFICE, overlayOpacity: 0.5, minHeight: 560 } },
    { id: 'hero-left-2', label: 'Left-aligned · Faith', props: { title: 'Rooted in Faith, Reaching Forward', subtitle: 'Serving our community since 1852.', showButton: true, buttonText: 'Join Us', heroVariant: 'left', backgroundImage: HERO_CHURCH, overlayOpacity: 0.55, minHeight: 560 } },
    { id: 'hero-split-1', label: 'Split · Text + image', props: { title: 'Education Changes Everything', subtitle: 'Free tutoring, mentorship, and resources for every student.', showButton: true, buttonText: 'Learn More', heroVariant: 'split', backgroundImage: HERO_KIDS, overlayOpacity: 0.45, minHeight: 520 } },
    { id: 'hero-split-2', label: 'Split · Team', props: { title: 'We Build Stronger Neighborhoods', subtitle: 'From food drives to cleanups—everyone can give back.', showButton: true, buttonText: 'Volunteer', heroVariant: 'split', backgroundImage: IMG_MEETING, overlayOpacity: 0.4, minHeight: 500 } },
    { id: 'hero-minimal', label: 'Minimal · No image', props: { title: 'Simple. Clear. Effective.', subtitle: 'A minimal hero for a focused message.', showButton: true, buttonText: 'Get Started', heroVariant: 'minimal', backgroundImage: '', overlayOpacity: 0, minHeight: 420 } },
    { id: 'hero-gradient', label: 'Gradient overlay', props: { title: 'Bold Headline', subtitle: 'With a gradient overlay for depth.', showButton: true, buttonText: 'Take Action', heroVariant: 'gradient', backgroundImage: HERO_IMG, overlayOpacity: 0.6, minHeight: 560 } },
    { id: 'hero-narrow', label: 'Narrow content', props: { title: 'Focused Message', subtitle: 'Narrow column for readability.', showButton: true, buttonText: 'Read More', heroVariant: 'narrow', backgroundImage: HERO_NATURE, overlayOpacity: 0.5, minHeight: 540 } },
    { id: 'hero-floating', label: 'Floating card', props: { title: 'Stand Out', subtitle: 'Content in a floating card over the image.', showButton: true, buttonText: 'Discover', heroVariant: 'floating', backgroundImage: HERO_OFFICE, overlayOpacity: 0.5, minHeight: 560 } },
  ],

  header: [
    { id: 'header-default', label: 'Default', props: { siteName: 'My Organization', showNav: true, navLink1Text: 'About', navLink1LinkType: 'page', navLink1Page: 'about', navLink1Url: '', navLink2Text: 'Events', navLink2LinkType: 'page', navLink2Page: 'events', navLink2Url: '', navLink3Text: 'Contact', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'default' } },
    { id: 'header-centered', label: 'Centered', props: { siteName: 'Community Hub', showNav: true, navLink1Text: 'About', navLink1LinkType: 'page', navLink1Page: 'about', navLink1Url: '', navLink2Text: 'Programs', navLink2LinkType: 'page', navLink2Page: 'programs', navLink2Url: '', navLink3Text: 'Contact', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'centered' } },
    { id: 'header-minimal', label: 'Minimal', props: { siteName: 'Simple Site', showNav: true, navLink1Text: 'Home', navLink1LinkType: 'page', navLink1Page: 'home', navLink1Url: '', navLink2Text: 'About', navLink2LinkType: 'page', navLink2Page: 'about', navLink2Url: '', navLink3Text: 'Contact', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'minimal' } },
    { id: 'header-dark', label: 'Dark bar', props: { siteName: 'Bold Brand', showNav: true, navLink1Text: 'Mission', navLink1LinkType: 'page', navLink1Page: 'about', navLink1Url: '', navLink2Text: 'Impact', navLink2LinkType: 'page', navLink2Page: 'impact', navLink2Url: '', navLink3Text: 'Donate', navLink3LinkType: 'page', navLink3Page: 'donate', navLink3Url: '', headerVariant: 'dark' } },
    { id: 'header-transparent', label: 'Transparent', props: { siteName: 'Over Hero', showNav: true, navLink1Text: 'About', navLink1LinkType: 'page', navLink1Page: 'about', navLink1Url: '', navLink2Text: 'Services', navLink2LinkType: 'page', navLink2Page: 'services', navLink2Url: '', navLink3Text: 'Contact', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'transparent' } },
    { id: 'header-bordered', label: 'Bordered', props: { siteName: 'Professional', showNav: true, navLink1Text: 'About', navLink1LinkType: 'page', navLink1Page: 'about', navLink1Url: '', navLink2Text: 'Work', navLink2LinkType: 'page', navLink2Page: 'work', navLink2Url: '', navLink3Text: 'Contact', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'bordered' } },
    { id: 'header-mega', label: 'Mega (large)', props: { siteName: 'Big Organization', showNav: true, navLink1Text: 'About Us', navLink1LinkType: 'page', navLink1Page: 'about', navLink1Url: '', navLink2Text: 'Events', navLink2LinkType: 'page', navLink2Page: 'events', navLink2Url: '', navLink3Text: 'Get in Touch', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'mega' } },
    { id: 'header-compact', label: 'Compact', props: { siteName: 'Compact', showNav: true, navLink1Text: 'About', navLink1LinkType: 'page', navLink1Page: 'about', navLink1Url: '', navLink2Text: 'Blog', navLink2LinkType: 'page', navLink2Page: 'blog', navLink2Url: '', navLink3Text: 'Contact', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'compact' } },
    { id: 'header-floating', label: 'Floating', props: { siteName: 'Floating Nav', showNav: true, navLink1Text: 'Home', navLink1LinkType: 'page', navLink1Page: 'home', navLink1Url: '', navLink2Text: 'About', navLink2LinkType: 'page', navLink2Page: 'about', navLink2Url: '', navLink3Text: 'Contact', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'floating' } },
    { id: 'header-split', label: 'Split layout', props: { siteName: 'Split Header', showNav: true, navLink1Text: 'About', navLink1LinkType: 'page', navLink1Page: 'about', navLink1Url: '', navLink2Text: 'Programs', navLink2LinkType: 'page', navLink2Page: 'programs', navLink2Url: '', navLink3Text: 'Contact', navLink3LinkType: 'page', navLink3Page: 'contact', navLink3Url: '', headerVariant: 'split' } },
  ],

  section: [
    { id: 'section-default', label: 'Default (bordered)', props: { title: 'Our Mission', content: 'Add your content here. Edit in the panel.', sectionVariant: 'default' } },
    { id: 'section-card', label: 'Card (shadow)', props: { title: 'What We Do', content: 'We create opportunities for everyone to give back. Join hundreds of volunteers.', sectionVariant: 'card' } },
    { id: 'section-elevated', label: 'Elevated', props: { title: 'Our Impact', content: 'Last year we supported over 2,000 families. Your time and donations make it possible.', sectionVariant: 'elevated' } },
    { id: 'section-bordered', label: 'Accent border', props: { title: 'Why It Matters', content: 'Studies show that community involvement strengthens neighborhoods and well-being.', sectionVariant: 'bordered' } },
    { id: 'section-gradient', label: 'Gradient', props: { title: 'Stand Out', content: 'A section with a subtle gradient background for visual interest.', sectionVariant: 'gradient' } },
    { id: 'section-quote', label: 'Quote style', props: { title: 'Testimonial', content: 'This place changed my life. I found hope and direction here.', sectionVariant: 'quote' } },
    { id: 'section-stats', label: 'Stats style', props: { title: 'By the Numbers', content: '10+ years · 5,000+ volunteers · 20+ programs.', sectionVariant: 'stats' } },
    { id: 'section-minimal', label: 'Minimal', props: { title: 'Clean & Simple', content: 'Minimal styling for a modern, uncluttered look.', sectionVariant: 'minimal' } },
    { id: 'section-highlight', label: 'Highlight', props: { title: 'Key Message', content: 'Draw attention to your most important message with a highlighted section.', sectionVariant: 'highlight' } },
    { id: 'section-icon', label: 'With icon', props: { title: 'Featured', content: 'Sections can include icons or badges for emphasis.', sectionVariant: 'icon' } },
    { id: 'section-full', label: 'Full width', props: { title: 'Full Width', content: 'A section that spans the full width for maximum impact.', sectionVariant: 'full' } },
    { id: 'section-alternate', label: 'Alternate', props: { title: 'Alternate Background', content: 'Use for alternating sections down the page.', sectionVariant: 'alternate' } },
  ],

  mediaSection: [
    { id: 'media-left-1', label: 'Image left · Story', props: { title: 'Our Story', content: 'Share your mission and impact. Pair a striking image with your message.', imageSrc: IMG_TEAM, imagePosition: 'left', mediaVariant: 'default' } },
    { id: 'media-right-1', label: 'Image right · Impact', props: { title: 'Our Impact', content: 'Last year we supported over 2,000 families. Your time and donations make it possible.', imageSrc: IMG_MEETING, imagePosition: 'right', mediaVariant: 'default' } },
    { id: 'media-left-card', label: 'Card style · Left', props: { title: 'What We Do', content: 'From food drives to neighborhood cleanups, we create opportunities for everyone.', imageSrc: IMG_TEAM, imagePosition: 'left', mediaVariant: 'card' } },
    { id: 'media-right-card', label: 'Card style · Right', props: { title: 'How It Works', content: 'We connect donors with vetted nonprofits. One platform, every donation.', imageSrc: IMG_MEETING, imagePosition: 'right', mediaVariant: 'card' } },
    { id: 'media-bordered', label: 'Bordered', props: { title: 'Our Approach', content: 'Evidence-based programs offered on a sliding scale.', imageSrc: IMG_TEAM, imagePosition: 'left', mediaVariant: 'bordered' } },
    { id: 'media-overlay', label: 'Overlay text', props: { title: 'Overlay Style', content: 'Text overlays the image for a dramatic effect.', imageSrc: HERO_IMG, imagePosition: 'left', mediaVariant: 'overlay' } },
    { id: 'media-large', label: 'Large image', props: { title: 'Big Visual', content: 'A larger image for maximum impact beside your copy.', imageSrc: HERO_NATURE, imagePosition: 'left', mediaVariant: 'large' } },
    { id: 'media-stacked', label: 'Stacked', props: { title: 'Stacked Layout', content: 'Image above or below text on small screens.', imageSrc: IMG_MEETING, imagePosition: 'left', mediaVariant: 'stacked' } },
    { id: 'media-minimal', label: 'Minimal', props: { title: 'Minimal', content: 'Clean layout with plenty of whitespace.', imageSrc: IMG_TEAM, imagePosition: 'right', mediaVariant: 'minimal' } },
    { id: 'media-floating', label: 'Floating image', props: { title: 'Floating', content: 'Image appears to float beside the content.', imageSrc: HERO_HANDS, imagePosition: 'left', mediaVariant: 'floating' } },
    { id: 'media-split', label: 'Split', props: { title: '50/50 Split', content: 'Equal weight for image and text.', imageSrc: IMG_TEAM, imagePosition: 'left', mediaVariant: 'split' } },
    { id: 'media-alternate', label: 'Alternate', props: { title: 'Alternating', content: 'Use with multiple image+text blocks for zigzag layout.', imageSrc: IMG_MEETING, imagePosition: 'right', mediaVariant: 'alternate' } },
  ],

  cta: [
    { id: 'cta-default', label: 'Default (primary)', props: { headline: 'Join Us Today', description: 'Take the next step.', buttonText: 'Sign Up', ctaVariant: 'default' } },
    { id: 'cta-outline', label: 'Outline', props: { headline: 'Get Involved', description: 'We need people like you.', buttonText: 'Volunteer', ctaVariant: 'outline' } },
    { id: 'cta-minimal', label: 'Minimal', props: { headline: 'Stay in Touch', description: 'Subscribe to our newsletter.', buttonText: 'Subscribe', ctaVariant: 'minimal' } },
    { id: 'cta-gradient', label: 'Gradient', props: { headline: 'Make an Impact', description: 'Every action counts.', buttonText: 'Donate Now', ctaVariant: 'gradient' } },
    { id: 'cta-dark', label: 'Dark', props: { headline: 'Ready to Start?', description: 'Join thousands of members.', buttonText: 'Get Started', ctaVariant: 'dark' } },
    { id: 'cta-light', label: 'Light', props: { headline: 'Questions?', description: 'We are here to help.', buttonText: 'Contact Us', ctaVariant: 'light' } },
    { id: 'cta-bordered', label: 'Bordered', props: { headline: 'Next Steps', description: 'Find out how you can contribute.', buttonText: 'Learn More', ctaVariant: 'bordered' } },
    { id: 'cta-split', label: 'Split', props: { headline: 'Two Columns', description: 'Headline and description with strong CTA.', buttonText: 'Take Action', ctaVariant: 'split' } },
    { id: 'cta-compact', label: 'Compact', props: { headline: 'Short CTA', description: 'Brief message, big button.', buttonText: 'Go', ctaVariant: 'compact' } },
    { id: 'cta-floating', label: 'Floating', props: { headline: 'Floating Card', description: 'CTA in a floating card style.', buttonText: 'Sign Up', ctaVariant: 'floating' } },
    { id: 'cta-impact', label: 'Impact', props: { headline: 'Your Gift Matters', description: '100% of donations go to the cause.', buttonText: 'Give Now', ctaVariant: 'impact' } },
    { id: 'cta-urgent', label: 'Urgent', props: { headline: 'Act Now', description: 'Limited time to make a difference.', buttonText: 'Donate', ctaVariant: 'urgent' } },
  ],

  donate: [
    { id: 'donate-default', label: 'Default', props: { title: 'Support Our Cause', description: 'Every gift makes a difference.', buttonText: 'Donate Now', donateVariant: 'default' } },
    { id: 'donate-minimal', label: 'Minimal', props: { title: 'Give', description: 'Simple and clear.', buttonText: 'Donate', donateVariant: 'minimal' } },
    { id: 'donate-outline', label: 'Outline', props: { title: 'Make a Gift', description: 'Your generosity fuels our work.', buttonText: 'Give Now', donateVariant: 'outline' } },
    { id: 'donate-card', label: 'Card', props: { title: 'Donate Today', description: 'Choose your amount and cause.', buttonText: 'Donate', donateVariant: 'card' } },
    { id: 'donate-gradient', label: 'Gradient', props: { title: 'Support Our Mission', description: 'Every dollar helps.', buttonText: 'Give', donateVariant: 'gradient' } },
    { id: 'donate-dark', label: 'Dark', props: { title: 'Give Back', description: 'Join our community of givers.', buttonText: 'Donate Now', donateVariant: 'dark' } },
    { id: 'donate-light', label: 'Light', props: { title: 'Your Gift Counts', description: 'Thank you for your support.', buttonText: 'Donate', donateVariant: 'light' } },
    { id: 'donate-split', label: 'Split', props: { title: 'Two Columns', description: 'Message and CTA side by side.', buttonText: 'Give Now', donateVariant: 'split' } },
    { id: 'donate-compact', label: 'Compact', props: { title: 'Donate', description: 'Quick and easy.', buttonText: 'Give', donateVariant: 'compact' } },
    { id: 'donate-impact', label: 'Impact', props: { title: '$25 Feeds a Family', description: 'See the impact of your gift.', buttonText: 'Donate', donateVariant: 'impact' } },
    { id: 'donate-urgent', label: 'Urgent', props: { title: 'Emergency Relief', description: '100% goes to those in need.', buttonText: 'Give Now', donateVariant: 'urgent' } },
    { id: 'donate-trust', label: 'Trust', props: { title: 'Vetted & Secure', description: 'Your donation is safe and tax-deductible.', buttonText: 'Donate Securely', donateVariant: 'trust' } },
  ],

  events: [
    { id: 'events-default', label: 'Default (cards)', props: { title: 'Upcoming Events', eventsVariant: 'default', event1Title: 'Community Gathering', event1Date: 'Feb 15, 2026', event1Time: '6:00 PM', event2Title: 'Workshop', event2Date: 'Feb 22, 2026', event2Time: '10:00 AM', event3Title: 'Annual Meetup', event3Date: 'Mar 1, 2026', event3Time: '2:00 PM' } },
    { id: 'events-cards', label: 'Cards', props: { title: 'Upcoming Events', eventsVariant: 'cards', event1Title: 'Event One', event1Date: 'Mar 8', event1Time: '9:00 AM', event2Title: 'Event Two', event2Date: 'Mar 15', event2Time: '10:00 AM', event3Title: 'Event Three', event3Date: 'Mar 22', event3Time: '6:00 PM' } },
    { id: 'events-list', label: 'List', props: { title: 'Events', eventsVariant: 'list', event1Title: 'Meeting', event1Date: 'Mar 10', event1Time: '4:00 PM', event2Title: 'Workshop', event2Date: 'Mar 18', event2Time: '6:00 PM', event3Title: 'Summit', event3Date: 'Mar 25', event3Time: '10:00 AM' } },
    { id: 'events-minimal', label: 'Minimal', props: { title: 'Events', eventsVariant: 'minimal', event1Title: 'Event 1', event1Date: 'Mar 8', event1Time: '9 AM', event2Title: 'Event 2', event2Date: 'Mar 15', event2Time: '10 AM', event3Title: 'Event 3', event3Date: 'Mar 22', event3Time: '6 PM' } },
    { id: 'events-timeline', label: 'Timeline', props: { title: 'Upcoming', eventsVariant: 'timeline', event1Title: 'First Event', event1Date: 'Mar 8', event1Time: '9:00 AM', event2Title: 'Second', event2Date: 'Mar 15', event2Time: '10:00 AM', event3Title: 'Third', event3Date: 'Mar 22', event3Time: '6:00 PM' } },
    { id: 'events-bordered', label: 'Bordered', props: { title: 'Events', eventsVariant: 'bordered', event1Title: 'Event A', event1Date: 'Mar 8', event1Time: '9 AM', event2Title: 'Event B', event2Date: 'Mar 15', event2Time: '10 AM', event3Title: 'Event C', event3Date: 'Mar 22', event3Time: '6 PM' } },
    { id: 'events-compact', label: 'Compact', props: { title: 'Events', eventsVariant: 'compact', event1Title: 'Meetup', event1Date: 'Mar 8', event1Time: '6 PM', event2Title: 'Workshop', event2Date: 'Mar 15', event2Time: '10 AM', event3Title: 'Dinner', event3Date: 'Mar 22', event3Time: '5 PM' } },
    { id: 'events-alternate', label: 'Alternate', props: { title: 'Upcoming Events', eventsVariant: 'alternate', event1Title: 'Event 1', event1Date: 'Mar 8', event1Time: '9 AM', event2Title: 'Event 2', event2Date: 'Mar 15', event2Time: '10 AM', event3Title: 'Event 3', event3Date: 'Mar 22', event3Time: '6 PM' } },
    { id: 'events-grid', label: 'Grid', props: { title: 'Events', eventsVariant: 'grid', event1Title: 'One', event1Date: 'Mar 8', event1Time: '9 AM', event2Title: 'Two', event2Date: 'Mar 15', event2Time: '10 AM', event3Title: 'Three', event3Date: 'Mar 22', event3Time: '6 PM' } },
    { id: 'events-featured', label: 'Featured', props: { title: 'Featured Events', eventsVariant: 'featured', event1Title: 'Keynote', event1Date: 'Mar 8', event1Time: '9:00 AM', event2Title: 'Panel', event2Date: 'Mar 15', event2Time: '2:00 PM', event3Title: 'Networking', event3Date: 'Mar 22', event3Time: '6:00 PM' } },
    { id: 'events-dark', label: 'Dark', props: { title: 'Upcoming Events', eventsVariant: 'dark', event1Title: 'Event', event1Date: 'Mar 8', event1Time: '9 AM', event2Title: 'Event', event2Date: 'Mar 15', event2Time: '10 AM', event3Title: 'Event', event3Date: 'Mar 22', event3Time: '6 PM' } },
    { id: 'events-centered', label: 'Centered', props: { title: 'Events', eventsVariant: 'centered', event1Title: 'Gathering', event1Date: 'Mar 8', event1Time: '6 PM', event2Title: 'Workshop', event2Date: 'Mar 15', event2Time: '10 AM', event3Title: 'Meetup', event3Date: 'Mar 22', event3Time: '2 PM' } },
  ],

  testimonial: [
    { id: 'testimonial-default', label: 'Default (quote)', props: { quote: 'This place changed my life. I found hope and direction here.', author: '— Sarah M., Member', testimonialVariant: 'default' } },
    { id: 'testimonial-card', label: 'Card', props: { quote: 'A meaningful testimonial in a card style.', author: '— Community Member', testimonialVariant: 'card' } },
    { id: 'testimonial-minimal', label: 'Minimal', props: { quote: 'Short and impactful.', author: '— Someone', testimonialVariant: 'minimal' } },
    { id: 'testimonial-quote', label: 'Quote style', props: { quote: 'A longer quote that stands out with classic quote styling.', author: '— Author Name', testimonialVariant: 'quote' } },
    { id: 'testimonial-bordered', label: 'Bordered', props: { quote: 'Testimonial with strong border.', author: '— Member', testimonialVariant: 'bordered' } },
    { id: 'testimonial-centered', label: 'Centered', props: { quote: 'Centered quote for emphasis.', author: '— Someone', testimonialVariant: 'centered' } },
    { id: 'testimonial-large', label: 'Large', props: { quote: 'A big, bold testimonial that commands attention.', author: '— Community Member', testimonialVariant: 'large' } },
    { id: 'testimonial-floating', label: 'Floating', props: { quote: 'Floating card style testimonial.', author: '— Someone', testimonialVariant: 'floating' } },
    { id: 'testimonial-dark', label: 'Dark', props: { quote: 'Testimonial on dark background.', author: '— Member', testimonialVariant: 'dark' } },
    { id: 'testimonial-accent', label: 'Accent border', props: { quote: 'With accent border.', author: '— Someone', testimonialVariant: 'accent' } },
    { id: 'testimonial-compact', label: 'Compact', props: { quote: 'Short quote, compact layout.', author: '— Author', testimonialVariant: 'compact' } },
    { id: 'testimonial-split', label: 'Split', props: { quote: 'Quote with split layout.', author: '— Member', testimonialVariant: 'split' } },
  ],

  contactForm: [
    { id: 'contact-default', label: 'Default (full)', props: { title: 'Get in Touch', subtitle: "We'd love to hear from you.", nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send Message', contactFormVariant: 'default' } },
    { id: 'contact-simple', label: 'Simple', props: { title: 'Contact Us', subtitle: 'Send a message.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send', contactFormVariant: 'simple' } },
    { id: 'contact-minimal', label: 'Minimal', props: { title: 'Say Hello', subtitle: 'Drop us a line.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Submit', contactFormVariant: 'minimal' } },
    { id: 'contact-card', label: 'Card', props: { title: 'Get in Touch', subtitle: 'We respond within 24 hours.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send Message', contactFormVariant: 'card' } },
    { id: 'contact-bordered', label: 'Bordered', props: { title: 'Contact', subtitle: 'Reach out anytime.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send', contactFormVariant: 'bordered' } },
    { id: 'contact-dark', label: 'Dark', props: { title: 'Contact Us', subtitle: "We're here to help.", nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send Message', contactFormVariant: 'dark' } },
    { id: 'contact-inline', label: 'Inline', props: { title: 'Quick Contact', subtitle: 'Short form.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send', contactFormVariant: 'inline' } },
    { id: 'contact-compact', label: 'Compact', props: { title: 'Contact', subtitle: 'Get in touch.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send', contactFormVariant: 'compact' } },
    { id: 'contact-centered', label: 'Centered', props: { title: 'Reach Out', subtitle: 'We look forward to hearing from you.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send Message', contactFormVariant: 'centered' } },
    { id: 'contact-floating', label: 'Floating', props: { title: 'Get in Touch', subtitle: 'Send us a message.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send', contactFormVariant: 'floating' } },
    { id: 'contact-fullWidth', label: 'Full width', props: { title: 'Contact', subtitle: 'Full-width form.', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', buttonText: 'Send Message', contactFormVariant: 'fullWidth' } },
  ],

  footer: [
    { id: 'footer-default', label: 'Default', props: { copyright: '© 2026 Your Organization.', tagline: 'Together we grow.', footerVariant: 'default' } },
    { id: 'footer-minimal', label: 'Minimal', props: { copyright: '© 2026 Your Org.', tagline: '', footerVariant: 'minimal' } },
    { id: 'footer-centered', label: 'Centered', props: { copyright: '© 2026 Your Organization. All rights reserved.', tagline: 'Built with care.', footerVariant: 'centered' } },
    { id: 'footer-dark', label: 'Dark', props: { copyright: '© 2026 Your Organization.', tagline: 'Making a difference.', footerVariant: 'dark' } },
    { id: 'footer-bordered', label: 'Bordered', props: { copyright: '© 2026 Your Organization.', tagline: 'Tagline here.', footerVariant: 'bordered' } },
    { id: 'footer-split', label: 'Split', props: { copyright: '© 2026 Your Organization.', tagline: 'Left and right.', footerVariant: 'split' } },
    { id: 'footer-compact', label: 'Compact', props: { copyright: '© 2026 Your Org.', tagline: '', footerVariant: 'compact' } },
    { id: 'footer-links', label: 'With links', props: { copyright: '© 2026 Your Organization.', tagline: 'Privacy · Contact', footerVariant: 'links' } },
    { id: 'footer-floating', label: 'Floating', props: { copyright: '© 2026 Your Organization.', tagline: 'Floating footer.', footerVariant: 'floating' } },
    { id: 'footer-accent', label: 'Accent', props: { copyright: '© 2026 Your Organization.', tagline: 'Thank you for visiting.', footerVariant: 'accent' } },
    { id: 'footer-fullWidth', label: 'Full width', props: { copyright: '© 2026 Your Organization.', tagline: 'All rights reserved.', footerVariant: 'fullWidth' } },
    { id: 'footer-simple', label: 'Simple', props: { copyright: '© 2026 Your Organization.', tagline: '', footerVariant: 'simple' } },
  ],

  text: [
    { id: 'text-default', label: 'Default', props: { content: 'Add your text here. Edit in the panel.', textVariant: 'default' } },
    { id: 'text-lead', label: 'Lead paragraph', props: { content: 'A lead paragraph for introducing a section. Slightly larger and more prominent.', textVariant: 'lead' } },
    { id: 'text-small', label: 'Small', props: { content: 'Smaller text for captions or fine print.', textVariant: 'small' } },
    { id: 'text-muted', label: 'Muted', props: { content: 'Muted text for secondary information.', textVariant: 'muted' } },
    { id: 'text-bordered', label: 'Bordered', props: { content: 'Text block with a border for emphasis.', textVariant: 'bordered' } },
    { id: 'text-card', label: 'Card', props: { content: 'Text in a card style with shadow.', textVariant: 'card' } },
    { id: 'text-highlight', label: 'Highlight', props: { content: 'Highlighted text with an accent border.', textVariant: 'highlight' } },
    { id: 'text-minimal', label: 'Minimal', props: { content: 'Minimal styling, clean look.', textVariant: 'minimal' } },
    { id: 'text-centered', label: 'Centered', props: { content: 'Centered text for impact.', textVariant: 'centered' } },
    { id: 'text-large', label: 'Large', props: { content: 'Larger text for key messages.', textVariant: 'large' } },
    { id: 'text-quote', label: 'Quote', props: { content: 'A quote or pull quote with italic styling.', textVariant: 'quote' } },
    { id: 'text-caption', label: 'Caption', props: { content: 'Caption or footnote style.', textVariant: 'caption' } },
  ],

  image: [
    { id: 'image-default', label: 'Default (rounded)', props: { src: IMG_TEAM, alt: 'Image', aspectRatio: '16/9', imageVariant: 'default' } },
    { id: 'image-rounded', label: 'Rounded', props: { src: IMG_MEETING, alt: 'Image', aspectRatio: '16/9', imageVariant: 'rounded' } },
    { id: 'image-circle', label: 'Circle', props: { src: IMG_TEAM, alt: 'Image', aspectRatio: '1/1', imageVariant: 'circle' } },
    { id: 'image-bordered', label: 'Bordered', props: { src: IMG_MEETING, alt: 'Image', aspectRatio: '4/3', imageVariant: 'bordered' } },
    { id: 'image-shadow', label: 'Shadow', props: { src: IMG_TEAM, alt: 'Image', aspectRatio: '16/9', imageVariant: 'shadow' } },
    { id: 'image-minimal', label: 'Minimal', props: { src: IMG_MEETING, alt: 'Image', aspectRatio: '16/9', imageVariant: 'minimal' } },
    { id: 'image-card', label: 'Card', props: { src: IMG_TEAM, alt: 'Image', aspectRatio: '4/3', imageVariant: 'card' } },
    { id: 'image-fullBleed', label: 'Full bleed', props: { src: HERO_IMG, alt: 'Image', aspectRatio: '16/9', imageVariant: 'fullBleed' } },
    { id: 'image-float', label: 'Float', props: { src: IMG_MEETING, alt: 'Image', aspectRatio: '4/3', imageVariant: 'float' } },
    { id: 'image-polaroid', label: 'Polaroid', props: { src: IMG_TEAM, alt: 'Image', aspectRatio: '4/3', imageVariant: 'polaroid' } },
    { id: 'image-overlay', label: 'Overlay', props: { src: HERO_IMG, alt: 'Image', aspectRatio: '16/9', imageVariant: 'overlay' } },
    { id: 'image-frame', label: 'Frame', props: { src: IMG_MEETING, alt: 'Image', aspectRatio: '4/3', imageVariant: 'frame' } },
  ],

  columns: [
    { id: 'columns-3-default', label: '3 columns · Default', props: { columns: 3, columnsVariant: 'default', column1Text: 'Column 1 content.', column2Text: 'Column 2 content.', column3Text: 'Column 3 content.' } },
    { id: 'columns-3-bordered', label: '3 columns · Bordered', props: { columns: 3, columnsVariant: 'bordered', column1Text: 'Content one.', column2Text: 'Content two.', column3Text: 'Content three.' } },
    { id: 'columns-3-cards', label: '3 columns · Cards', props: { columns: 3, columnsVariant: 'cards', column1Text: 'Card one.', column2Text: 'Card two.', column3Text: 'Card three.' } },
    { id: 'columns-3-minimal', label: '3 columns · Minimal', props: { columns: 3, columnsVariant: 'minimal', column1Text: 'One.', column2Text: 'Two.', column3Text: 'Three.' } },
    { id: 'columns-2-default', label: '2 columns', props: { columns: 2, columnsVariant: 'default', column1Text: 'Left column content.', column2Text: 'Right column content.' } },
    { id: 'columns-4-default', label: '4 columns', props: { columns: 4, columnsVariant: 'default', column1Text: 'One.', column2Text: 'Two.', column3Text: 'Three.', column4Text: 'Four.' } },
    { id: 'columns-compact', label: 'Compact', props: { columns: 3, columnsVariant: 'compact', column1Text: 'Short.', column2Text: 'Short.', column3Text: 'Short.' } },
    { id: 'columns-elevated', label: 'Elevated', props: { columns: 3, columnsVariant: 'elevated', column1Text: 'Content.', column2Text: 'Content.', column3Text: 'Content.' } },
    { id: 'columns-dark', label: 'Dark', props: { columns: 3, columnsVariant: 'dark', column1Text: 'Column.', column2Text: 'Column.', column3Text: 'Column.' } },
    { id: 'columns-simple', label: 'Simple', props: { columns: 3, columnsVariant: 'simple', column1Text: 'A.', column2Text: 'B.', column3Text: 'C.' } },
    { id: 'columns-featured', label: 'Featured', props: { columns: 3, columnsVariant: 'featured', column1Text: 'Featured one.', column2Text: 'Featured two.', column3Text: 'Featured three.' } },
    { id: 'columns-split', label: 'Split', props: { columns: 2, columnsVariant: 'split', column1Text: 'Left.', column2Text: 'Right.' } },
  ],

  spacer: [
    { id: 'spacer-24', label: 'Small (24px)', props: { height: 24 } },
    { id: 'spacer-48', label: 'Medium (48px)', props: { height: 48 } },
    { id: 'spacer-72', label: 'Large (72px)', props: { height: 72 } },
    { id: 'spacer-96', label: 'X-Large (96px)', props: { height: 96 } },
    { id: 'spacer-120', label: 'XX-Large (120px)', props: { height: 120 } },
    { id: 'spacer-160', label: 'Section (160px)', props: { height: 160 } },
    { id: 'spacer-200', label: 'Big (200px)', props: { height: 200 } },
    { id: 'spacer-240', label: 'Extra (240px)', props: { height: 240 } },
    { id: 'spacer-320', label: 'Hero gap (320px)', props: { height: 320 } },
    { id: 'spacer-400', label: 'Page break (400px)', props: { height: 400 } },
    { id: 'spacer-64', label: '64px', props: { height: 64 } },
    { id: 'spacer-80', label: '80px', props: { height: 80 } },
  ],
};

/** Every component has a style library (click opens modal with style picker). */
export const LIBRARY_COMPONENT_KINDS: ComponentKind[] = [
  'hero', 'header', 'section', 'mediaSection', 'cta', 'donate',
  'events', 'testimonial', 'contactForm', 'footer', 'text', 'image', 'columns', 'spacer',
];
