import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=85';

type HeroVariant = 'center' | 'centerBadge' | 'left' | 'split' | 'minimal' | 'gradient' | 'narrow' | 'floating';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

export function HeroBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const title = (block.props.title as string) ?? 'Welcome to Our Community';
  const subtitle =
    (block.props.subtitle as string) ?? 'Building a better world together.';
  const showButton = block.props.showButton !== false;
  const buttonText = (block.props.buttonText as string) ?? 'Get Started';
  const button2Text = (block.props.button2Text as string) ?? '';
  const showButton2 = Boolean(button2Text?.trim());
  const backgroundImage =
    (block.props.backgroundImage as string) || DEFAULT_HERO_IMAGE;
  const overlayOpacity = Math.min(
    1,
    Math.max(0, Number(block.props.overlayOpacity) ?? 0.5)
  );
  const minHeight = Math.max(320, Number(block.props.minHeight) ?? 560);
  const variant = (block.props.heroVariant as HeroVariant) || 'center';
  const buttonLinkType = (block.props.buttonLinkType as string) || 'none';
  const buttonLinkValue = (block.props.buttonLinkValue as string) || '';
  const button2LinkType = (block.props.button2LinkType as string) || 'none';
  const button2LinkValue = (block.props.button2LinkValue as string) || '';
  const buttonHref =
    buttonLinkType === 'page' && buttonLinkValue
      ? `#${buttonLinkValue}`
      : buttonLinkType === 'external' && buttonLinkValue
        ? buttonLinkValue
        : null;
  const button2Href =
    button2LinkType === 'page' && button2LinkValue
      ? `#${button2LinkValue}`
      : button2LinkType === 'external' && button2LinkValue
        ? button2LinkValue
        : null;

  const hasBgImage = Boolean(backgroundImage?.trim());

  const isDark = hasBgImage;
  const textColor = isDark ? '#fff' : c.text;
  const subColor = isDark ? 'rgba(255,255,255,0.92)' : c.textMuted;

  const content = (
    <>
      {variant === 'centerBadge' && (
        <span
          className="inline-block px-5 py-2.5 rounded-full text-lg md:text-xl font-bold mb-6 md:mb-8 tracking-tight"
          style={{
            backgroundColor: c.primary,
            color: '#fff',
            fontFamily: theme.typography.headingFont,
          }}
        >
          {isEdit && onUpdateProp ? (
            <EditableText
              value={title}
              onSave={(v) => onUpdateProp('title', v)}
              as="span"
              className="text-white"
              placeholder="Headline"
            />
          ) : (
            title
          )}
        </span>
      )}
      {(variant === 'center' || variant === 'left' || variant === 'split' || variant === 'minimal' || variant === 'gradient' || variant === 'narrow' || variant === 'floating') && (
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight max-w-4xl leading-[1.08]"
          style={{
            fontFamily: theme.typography.headingFont,
            color: textColor,
            ...(variant === 'center' ? {} : { textAlign: 'left' }),
          }}
        >
          {isEdit && onUpdateProp ? (
            <EditableText
              value={title}
              onSave={(v) => onUpdateProp('title', v)}
              as="span"
              className="block"
              style={{ fontFamily: theme.typography.headingFont, color: textColor }}
            />
          ) : (
            title
          )}
        </h1>
      )}
      <div
        className="text-lg md:text-xl lg:text-2xl max-w-2xl mt-5 md:mt-6 opacity-95"
        style={{
          fontFamily: theme.typography.bodyFont,
          color: subColor,
          ...(['center', 'centerBadge', 'minimal', 'gradient', 'narrow', 'floating'].includes(variant) ? {} : { textAlign: 'left', marginLeft: 0, marginRight: 0 }),
        }}
      >
        {isEdit && onUpdateProp ? (
          <EditableText
            value={subtitle}
            onSave={(v) => onUpdateProp('subtitle', v)}
            as="p"
            placeholder="Add a subtitle…"
            style={{ fontFamily: theme.typography.bodyFont, color: subColor }}
          />
        ) : (
          subtitle || null
        )}
      </div>
      {(showButton || showButton2) && (
        <div className={`flex flex-wrap gap-4 mt-8 md:mt-10 ${['center', 'centerBadge', 'minimal', 'gradient', 'narrow', 'floating'].includes(variant) ? 'justify-center' : 'justify-start'}`}>
          {showButton && (buttonHref ? (
            <a
              href={buttonHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base md:text-lg shadow-xl transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-2xl no-underline"
              style={{ backgroundColor: c.primary, color: '#fff' }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText value={buttonText} onSave={(v) => onUpdateProp('buttonText', v)} as="span" className="text-white" placeholder="Button text" />
              ) : buttonText}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base md:text-lg shadow-xl transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-2xl" style={{ backgroundColor: c.primary, color: '#fff' }}>
              {isEdit && onUpdateProp ? (
                <EditableText value={buttonText} onSave={(v) => onUpdateProp('buttonText', v)} as="span" className="text-white" placeholder="Button text" />
              ) : buttonText}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </span>
          ))}
          {showButton2 && (button2Href ? (
            <a
              href={button2Href}
              className="inline-flex items-center px-8 py-4 rounded-2xl font-semibold text-base border-2 transition-all duration-200 hover:opacity-90 no-underline"
              style={{ borderColor: isDark ? '#fff' : c.text, color: isDark ? '#fff' : c.text }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText value={button2Text} onSave={(v) => onUpdateProp('button2Text', v)} as="span" placeholder="Second button" />
              ) : button2Text}
            </a>
          ) : (
            <span className="inline-flex items-center px-8 py-4 rounded-2xl font-semibold text-base border-2 transition-all duration-200 hover:opacity-90" style={{ borderColor: isDark ? '#fff' : c.text, color: isDark ? '#fff' : c.text }}>
              {isEdit && onUpdateProp ? (
                <EditableText value={button2Text} onSave={(v) => onUpdateProp('button2Text', v)} as="span" placeholder="Second button" />
              ) : button2Text}
            </span>
          ))}
        </div>
      )}
    </>
  );

  if (variant === 'split') {
    return (
      <section
        className="builder-block hero-block hero-split relative w-full overflow-hidden"
        style={{ minHeight: hasBgImage ? minHeight : 400 }}
      >
        {hasBgImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
            />
          </>
        )}
        {!hasBgImage && (
          <div className="absolute inset-0" style={{ backgroundColor: c.surface }} />
        )}
        <div className="relative grid md:grid-cols-2 gap-0 min-h-[400px] md:min-h-[480px] items-center w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <div className="order-2 md:order-1 flex flex-col justify-center text-left">
            {variant === 'split' && (
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]"
                style={{ fontFamily: theme.typography.headingFont, color: textColor }}
              >
                {isEdit && onUpdateProp ? (
                  <EditableText value={title} onSave={(v) => onUpdateProp('title', v)} as="span" style={{ color: textColor }} />
                ) : title}
              </h1>
            )}
            <div className="text-lg md:text-xl max-w-xl mt-4" style={{ color: subColor, fontFamily: theme.typography.bodyFont }}>
              {isEdit && onUpdateProp ? (
                <EditableText value={subtitle} onSave={(v) => onUpdateProp('subtitle', v)} as="p" placeholder="Subtitle" style={{ color: subColor }} />
              ) : (
                subtitle
              )}
            </div>
            {(showButton || showButton2) && variant === 'split' && (
              <div className="flex flex-wrap gap-4 mt-8">
                {showButton && (buttonHref ? (
                  <a href={buttonHref} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold no-underline" style={{ backgroundColor: c.primary, color: '#fff' }}>
                    {isEdit && onUpdateProp ? <EditableText value={buttonText} onSave={(v) => onUpdateProp('buttonText', v)} as="span" className="text-white" /> : buttonText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold" style={{ backgroundColor: c.primary, color: '#fff' }}>
                    {isEdit && onUpdateProp ? <EditableText value={buttonText} onSave={(v) => onUpdateProp('buttonText', v)} as="span" className="text-white" /> : buttonText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </span>
                ))}
                {showButton2 && (button2Href ? (
                  <a href={button2Href} className="inline-flex px-6 py-3.5 rounded-xl font-semibold border-2 no-underline" style={{ borderColor: isDark ? '#fff' : c.text, color: isDark ? '#fff' : c.text }}>
                    {isEdit && onUpdateProp ? <EditableText value={button2Text} onSave={(v) => onUpdateProp('button2Text', v)} as="span" /> : button2Text}
                  </a>
                ) : (
                  <span className="inline-flex px-6 py-3.5 rounded-xl font-semibold border-2" style={{ borderColor: isDark ? '#fff' : c.text, color: isDark ? '#fff' : c.text }}>
                    {isEdit && onUpdateProp ? <EditableText value={button2Text} onSave={(v) => onUpdateProp('button2Text', v)} as="span" /> : button2Text}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="order-1 md:order-2 relative min-h-[300px] md:min-h-0 md:aspect-square rounded-2xl overflow-hidden">
            {hasBgImage && (
              <img
                src={backgroundImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </section>
    );
  }

  const isMinimal = variant === 'minimal';
  const isGradient = variant === 'gradient';
  const isNarrow = variant === 'narrow';
  const isFloating = variant === 'floating';
  const isCenterLike = ['center', 'centerBadge', 'minimal', 'gradient', 'narrow', 'floating'].includes(variant);

  return (
    <section
      className="builder-block hero-block relative w-full overflow-hidden"
      style={{
        minHeight: isMinimal ? 380 : hasBgImage ? minHeight : 380,
        ...(isMinimal ? { backgroundColor: c.surface } : {}),
      }}
    >
      {hasBgImage && !isMinimal && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div
            className="absolute inset-0"
            style={
              isGradient
                ? { background: `linear-gradient(135deg, rgba(0,0,0,${overlayOpacity * 0.7}) 0%, rgba(0,0,0,${overlayOpacity}) 100%)` }
                : { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }
            }
          />
        </>
      )}
      {!hasBgImage && !isMinimal && (
        <div className="absolute inset-0" style={{ backgroundColor: c.surface }} />
      )}
      <div
        className={`relative flex flex-col justify-center px-6 sm:px-8 md:px-12 lg:px-16 py-20 md:py-28 lg:py-36 min-h-inherit ${
          isCenterLike ? 'items-center text-center' : 'items-start text-left max-w-6xl mx-auto'
        } ${isNarrow ? 'max-w-3xl mx-auto' : ''}`}
        style={{ minHeight: hasBgImage && !isMinimal ? minHeight : undefined }}
      >
        {isFloating ? (
          <div
            className="rounded-3xl px-8 py-10 md:px-12 md:py-14 shadow-2xl max-w-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: c.text }}
          >
            {content}
          </div>
        ) : (
          content
        )}
      </div>
    </section>
  );
}
