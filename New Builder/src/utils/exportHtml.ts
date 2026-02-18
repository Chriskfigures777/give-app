import type { BuilderBlock, SiteTheme } from '../types';

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=85';
const DEFAULT_UNSPLASH =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80';

const ASPECT_RATIOS: Record<string, string> = {
  '16/9': '56.25%',
  '4/3': '75%',
  '1/1': '100%',
  '3/4': '133.33%',
  '2/3': '150%',
  auto: '56.25%',
};

function escapeHtml(str: string): string {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function blockToHtml(block: BuilderBlock, theme: SiteTheme): string {
  const c = theme.colors;
  const hf = theme.typography.headingFont;
  const bf = theme.typography.bodyFont;
  const baseSize = theme.typography.baseSize ?? 16;

  const p = (key: string, def: string) => escapeHtml(String(block.props[key] ?? def));
  const pRaw = (key: string, def: string) => String(block.props[key] ?? def);

  switch (block.kind) {
    case 'hero': {
      const title = p('title', 'Welcome to Our Community');
      const subtitle = p('subtitle', 'Building a better world together.');
      const showButton = block.props.showButton !== false;
      const buttonText = p('buttonText', 'Get Started');
      const backgroundImage = pRaw('backgroundImage', DEFAULT_HERO_IMAGE).trim() || DEFAULT_HERO_IMAGE;
      const overlayOpacity = Math.min(1, Math.max(0, Number(block.props.overlayOpacity) ?? 0.5));
      const minHeight = Math.max(320, Number(block.props.minHeight) ?? 560);
      const hasBgImage = Boolean(backgroundImage);
      const contentColor = hasBgImage ? 'rgba(255,255,255,0.92)' : c.textMuted;
      const textColor = hasBgImage ? '#fff' : c.text;
      return `<section style="position:relative;border-radius:1rem;overflow:hidden;min-height:${hasBgImage ? minHeight : 280}px;">
${hasBgImage ? `<div style="position:absolute;inset:0;background-image:url(${escapeHtml(backgroundImage)});background-size:cover;background-position:center;"></div>
<div style="position:absolute;inset:0;background-color:rgba(0,0,0,${overlayOpacity});"></div>` : `<div style="position:absolute;inset:0;background-color:${c.surface};"></div>`}
<div style="position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:4rem 1.5rem;min-height:${hasBgImage ? minHeight : 'auto'}px;color:${textColor};">
<h1 style="font-family:${hf};font-size:clamp(2.25rem,5vw,4rem);font-weight:700;margin-bottom:1.25rem;max-width:56rem;margin-left:auto;margin-right:auto;line-height:1.1;">${title}</h1>
<div style="font-family:${bf};font-size:1.125rem;max-width:42rem;margin:0 auto 2rem;opacity:0.95;color:${contentColor};">${subtitle}</div>
${showButton ? `<span style="display:inline-block;padding:1rem 2rem;border-radius:1rem;font-weight:600;font-size:1.125rem;background-color:${c.primary};color:#fff;">${buttonText}</span>` : ''}
</div></section>`;
    }

    case 'header': {
      const siteName = p('siteName', 'My Organization');
      const showNav = block.props.showNav !== false;
      const link1Text = p('navLink1Text', 'About');
      const link1Url = pRaw('navLink1Url', '#about');
      const link2Text = p('navLink2Text', 'Events');
      const link2Url = pRaw('navLink2Url', '#events');
      const link3Text = p('navLink3Text', 'Contact');
      const link3Url = pRaw('navLink3Url', '#contact');
      return `<header style="padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;border-radius:1rem;border:1px solid ${c.surface};background-color:${c.background};color:${c.text};">
<span style="font-family:${hf};font-size:1.25rem;font-weight:700;">${siteName}</span>
${showNav ? `<nav style="display:flex;gap:1.5rem;">
<a href="${escapeHtml(link1Url)}" style="font-size:0.875rem;font-weight:500;color:${c.primary};">${link1Text}</a>
<a href="${escapeHtml(link2Url)}" style="font-size:0.875rem;font-weight:500;color:${c.primary};">${link2Text}</a>
<a href="${escapeHtml(link3Url)}" style="font-size:0.875rem;font-weight:500;color:${c.primary};">${link3Text}</a>
</nav>` : ''}
</header>`;
    }

    case 'section': {
      const title = p('title', 'Section');
      const content = p('content', '');
      return `<section style="padding:4rem 1.5rem;border-radius:1.5rem;border:1px solid rgba(0,0,0,0.08);background-color:${c.background};color:${c.text};">
<h2 style="font-family:${hf};font-size:1.875rem;font-weight:700;margin-bottom:1.25rem;color:${c.text};">${title}</h2>
<div style="max-width:42rem;font-size:1.125rem;line-height:1.625;font-family:${bf};color:${c.textMuted};">${content}</div>
</section>`;
    }

    case 'text': {
      const content = p('content', 'Add your text here.');
      return `<div style="padding:1.25rem 1.5rem;border-radius:1rem;font-family:${bf};color:${c.text};font-size:${baseSize}px;">${content}</div>`;
    }

    case 'image': {
      const src = pRaw('src', DEFAULT_UNSPLASH) || DEFAULT_UNSPLASH;
      const alt = p('alt', 'Image');
      const aspectKey = (block.props.aspectRatio as string) || '16/9';
      const paddingBottom = ASPECT_RATIOS[aspectKey] ?? ASPECT_RATIOS['16/9'];
      return `<div style="border-radius:1rem;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
<div style="position:relative;width:100%;overflow:hidden;background:#e2e8f0;padding-bottom:${paddingBottom};">
<img src="${escapeHtml(src)}" alt="${alt}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" loading="lazy" />
</div></div>`;
    }

    case 'cta': {
      const headline = p('headline', 'Join Us Today');
      const description = p('description', 'Take the next step.');
      const buttonText = p('buttonText', 'Sign Up');
      return `<section style="padding:5rem 1.5rem;text-align:center;border-radius:1.5rem;background-color:${c.primary};color:#fff;">
<h2 style="font-family:${hf};font-size:2.25rem;font-weight:700;margin-bottom:1rem;max-width:42rem;margin-left:auto;margin-right:auto;">${headline}</h2>
<div style="margin-bottom:2rem;font-size:1.25rem;max-width:36rem;margin-left:auto;margin-right:auto;opacity:0.9;">${description}</div>
<span style="display:inline-block;padding:1rem 2rem;border-radius:1rem;font-weight:600;background:#fff;color:${c.primary};">${buttonText}</span>
</section>`;
    }

    case 'footer': {
      const copyright = p('copyright', '© 2026 Your Organization.');
      const tagline = p('tagline', '');
      return `<footer style="padding:2.5rem 1.5rem;text-align:center;border-radius:1rem;border-top:1px solid ${c.surface};background-color:${c.surface};color:${c.textMuted};">
<p style="font-family:${bf};font-size:0.875rem;">${copyright}</p>
${tagline ? `<p style="font-size:0.875rem;margin-top:0.5rem;opacity:0.8;color:${c.textMuted};">${tagline}</p>` : ''}
</footer>`;
    }

    case 'columns': {
      const columns = Math.min(Math.max(Number(block.props.columns) ?? 3, 1), 6);
      const colHtml = Array.from({ length: columns }, (_, i) =>
        `<div style="padding:1.5rem;border-radius:1rem;border:1px dashed rgba(0,0,0,0.08);min-height:120px;color:${c.textMuted};"><span style="font-size:0.875rem;font-weight:500;">Column ${i + 1}</span></div>`
      ).join('');
      return `<div style="padding:2rem 0;display:grid;grid-template-columns:repeat(${columns},1fr);gap:1.5rem;border-radius:1.5rem;background-color:${c.surface};">
${colHtml}
</div>`;
    }

    case 'spacer': {
      const height = Math.max(0, Number(block.props.height) ?? 48);
      return `<div style="height:${height}px;" aria-hidden="true"></div>`;
    }

    case 'mediaSection': {
      const imageSrc = pRaw('imageSrc', DEFAULT_UNSPLASH) || DEFAULT_UNSPLASH;
      const imagePosition = block.props.imagePosition === 'right' ? 'right' : 'left';
      const title = p('title', 'Our Story');
      const content = p('content', 'Share your mission and impact. This layout puts a striking image beside your message—ideal for about sections, programs, or campaigns.');
      const imageEl = `<div style="position:relative;width:100%;min-height:280px;border-radius:1rem;overflow:hidden;background:#e2e8f0;"><img src="${escapeHtml(imageSrc)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" loading="lazy" /></div>`;
      const textEl = `<div style="display:flex;flex-direction:column;justify-content:center;padding:1.5rem 0;">
<h2 style="font-family:${hf};font-size:1.875rem;font-weight:700;margin-bottom:1rem;color:${c.text};">${title}</h2>
<div style="font-size:1.125rem;line-height:1.625;font-family:${bf};color:${c.textMuted};">${content}</div>
</div>`;
      const gridOrder = imagePosition === 'left' ? `${imageEl}\n${textEl}` : `${textEl}\n${imageEl}`;
      return `<section style="background-color:${c.background};overflow:hidden;">
<div style="display:grid;gap:2rem;align-items:center;grid-template-columns:1fr 1fr;">
${gridOrder}
</div></section>`;
    }

    case 'events': {
      const title = p('title', 'Upcoming Events');
      const e1t = p('event1Title', 'Community Gathering');
      const e1d = p('event1Date', 'Feb 15, 2026');
      const e1tm = p('event1Time', '6:00 PM');
      const e2t = p('event2Title', 'Community Gathering');
      const e2d = p('event2Date', 'Feb 15, 2026');
      const e2tm = p('event2Time', '6:00 PM');
      const e3t = p('event3Title', 'Community Gathering');
      const e3d = p('event3Date', 'Feb 15, 2026');
      const e3tm = p('event3Time', '6:00 PM');
      const events = [
        [e1t, e1d, e1tm],
        [e2t, e2d, e2tm],
        [e3t, e3d, e3tm],
      ];
      const cards = events.map(([t, d, tm]) => `<div style="padding:1.5rem;border-radius:1rem;border:1px solid rgba(0,0,0,0.06);background-color:${c.background};">
<h3 style="font-family:${hf};font-weight:600;font-size:1.125rem;margin-bottom:0.5rem;color:${c.text};">${t}</h3>
<p style="font-size:0.875rem;color:${c.textMuted};font-family:${bf};">${d} · ${tm}</p>
</div>`).join('');
      return `<section style="padding:4rem 1.5rem;border-radius:1.5rem;border:1px solid rgba(0,0,0,0.08);background-color:${c.surface};color:${c.text};">
<h2 style="font-family:${hf};font-size:1.875rem;font-weight:700;margin-bottom:2.5rem;color:${c.text};">${title}</h2>
<div style="display:grid;gap:1.25rem;grid-template-columns:repeat(3,1fr);">${cards}</div>
</section>`;
    }

    case 'testimonial': {
      const quote = p('quote', 'A meaningful quote.');
      const author = p('author', '— Someone');
      return `<blockquote style="padding:2.5rem 2rem;border-radius:1.5rem;border-left:4px solid ${c.primary};background-color:${c.surface};color:${c.text};">
<p style="font-size:1.25rem;font-style:italic;margin-bottom:1rem;line-height:1.625;font-family:${bf};">"${quote}"</p>
<cite style="font-size:0.875rem;font-style:normal;font-weight:500;display:block;color:${c.textMuted};">${author}</cite>
</blockquote>`;
    }

    case 'donate': {
      const title = p('title', 'Support Our Cause');
      const description = p('description', 'Every gift makes a difference.');
      const buttonText = p('buttonText', 'Donate Now');
      return `<section style="padding:5rem 1.5rem;text-align:center;border-radius:1.5rem;background-color:${c.secondary};color:#fff;">
<h2 style="font-family:${hf};font-size:2rem;font-weight:700;margin-bottom:1rem;">${title}</h2>
<div style="margin-bottom:2rem;font-size:1.125rem;max-width:36rem;margin-left:auto;margin-right:auto;opacity:0.9;">${description}</div>
<span style="display:inline-block;padding:1rem 2rem;border-radius:1rem;font-weight:600;background-color:${c.accent};color:#fff;">${buttonText}</span>
</section>`;
    }

    case 'contactForm': {
      const title = p('title', 'Get in Touch');
      const subtitle = p('subtitle', "We'd love to hear from you. Send us a message.");
      const nameLabel = p('nameLabel', 'Name');
      const emailLabel = p('emailLabel', 'Email');
      const messageLabel = p('messageLabel', 'Message');
      const buttonText = p('buttonText', 'Send Message');
      return `<section style="padding:4rem 1.5rem;border-radius:1.5rem;border:1px solid rgba(0,0,0,0.08);background-color:${c.surface};color:${c.text};">
<div style="max-width:36rem;margin:0 auto;">
<h2 style="font-family:${hf};font-size:1.875rem;font-weight:700;margin-bottom:0.75rem;color:${c.text};">${title}</h2>
<p style="font-size:1.125rem;margin-bottom:2rem;color:${c.textMuted};font-family:${bf};">${subtitle}</p>
<form style="display:flex;flex-direction:column;gap:1.25rem;" onsubmit="return false;">
<div><label style="display:block;font-size:0.875rem;font-weight:500;margin-bottom:0.375rem;color:${c.text};">${nameLabel}</label>
<input type="text" placeholder="${nameLabel}" style="width:100%;padding:0.75rem 1rem;border-radius:0.75rem;border:1px solid rgba(0,0,0,0.12);background:${c.background};color:${c.text};font-size:0.875rem;" /></div>
<div><label style="display:block;font-size:0.875rem;font-weight:500;margin-bottom:0.375rem;color:${c.text};">${emailLabel}</label>
<input type="email" placeholder="${emailLabel}" style="width:100%;padding:0.75rem 1rem;border-radius:0.75rem;border:1px solid rgba(0,0,0,0.12);background:${c.background};color:${c.text};font-size:0.875rem;" /></div>
<div><label style="display:block;font-size:0.875rem;font-weight:500;margin-bottom:0.375rem;color:${c.text};">${messageLabel}</label>
<textarea rows="4" placeholder="${messageLabel}" style="width:100%;padding:0.75rem 1rem;border-radius:0.75rem;border:1px solid rgba(0,0,0,0.12);background:${c.background};color:${c.text};font-size:0.875rem;resize:vertical;"></textarea></div>
<button type="submit" style="padding:0.875rem 2rem;border-radius:0.75rem;font-weight:600;color:#fff;background-color:${c.primary};border:none;cursor:pointer;">${buttonText}</button>
</form></div></section>`;
    }

    default:
      return '';
  }
}

/**
 * Build full HTML document string that matches the Preview layout:
 * same grid, theme (colors/fonts), and block order with real content.
 */
export function buildExportHtml(
  blocks: BuilderBlock[],
  theme: SiteTheme,
  gridColumns: number,
  title = 'My Site'
): string {
  const span = (block: BuilderBlock) => Math.min(block.gridSpan ?? 12, gridColumns);
  const blocksHtml = blocks
    .map(
      (block) =>
        `<div style="grid-column:span ${span(block)};">${blockToHtml(block, theme)}</div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ${theme.typography.bodyFont}; color: ${theme.colors.text}; background: ${theme.colors.background}; }
    a { color: ${theme.colors.primary}; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="min-height:100vh;">
  <div style="width:100%;min-height:100vh;overflow:auto;">
    <div style="width:100%;min-height:100vh;max-width:72rem;margin:0 auto;padding:2.5rem 1rem;display:grid;grid-template-columns:repeat(${gridColumns},1fr);gap:1.5rem;">
${blocksHtml}
    </div>
  </div>
</body>
</html>`;
}
