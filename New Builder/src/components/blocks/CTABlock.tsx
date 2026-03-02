import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

type CtaVariant = 'default' | 'outline' | 'minimal' | 'gradient' | 'dark' | 'light' | 'bordered' | 'split' | 'compact' | 'floating' | 'impact' | 'urgent';

export function CTABlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const headline = (block.props.headline as string) ?? 'Join Us Today';
  const description = (block.props.description as string) ?? 'Take the next step.';
  const buttonText = (block.props.buttonText as string) ?? 'Sign Up';
  const buttonLinkType = (block.props.buttonLinkType as string) ?? 'none';
  const buttonLinkValue = (block.props.buttonLinkValue as string) ?? '';
  const buttonHref =
    buttonLinkType === 'page' && buttonLinkValue
      ? `#${buttonLinkValue}`
      : buttonLinkType === 'external' && buttonLinkValue
        ? buttonLinkValue
        : null;
  const variant = (block.props.ctaVariant as CtaVariant) || 'default';

  const isOutline = variant === 'outline';
  const isMinimal = variant === 'minimal';
  const isGradient = variant === 'gradient';
  const isDark = variant === 'dark';
  const isLight = variant === 'light';
  const isBordered = variant === 'bordered';
  const isCompact = variant === 'compact';
  const isFloating = variant === 'floating';

  const bgStyle =
    isGradient ? { background: `linear-gradient(135deg, ${c.primary} 0%, ${c.secondary} 100%)` }
    : isDark ? { backgroundColor: c.text }
    : isLight ? { backgroundColor: c.surface, color: c.text }
    : isMinimal ? { backgroundColor: 'transparent', color: c.text }
    : { backgroundColor: c.primary, color: '#fff' };

  return (
    <section
      className={`builder-block cta-block w-full px-4 sm:px-6 lg:px-8 text-center overflow-hidden transition-all duration-300 ease-out ${
        isCompact ? 'py-12 md:py-16' : isMinimal ? 'py-12 md:py-16' : 'py-24 md:py-32'
      } ${isFloating ? 'mx-4 rounded-3xl shadow-xl border border-stone-200/50' : ''} ${isBordered ? 'border-2' : ''}`}
      style={{ ...bgStyle, borderColor: isBordered ? c.primary : undefined }}
    >
      <div className="max-w-4xl mx-auto">
        <h2
          className={`text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-5 tracking-tight ${isCompact ? 'text-2xl md:text-3xl' : ''}`}
          style={{ fontFamily: theme.typography.headingFont, color: isLight || isMinimal ? c.text : '#fff' }}
        >
          {isEdit && onUpdateProp ? (
            <EditableText value={headline} onSave={(v) => onUpdateProp('headline', v)} as="span" className="block" placeholder="Headline" style={{ color: isLight || isMinimal ? c.text : '#fff' }} />
          ) : (
            headline
          )}
        </h2>
        <div className="mb-10 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: isLight || isMinimal ? c.textMuted : 'rgba(255,255,255,0.9)' }}>
          {isEdit && onUpdateProp ? (
            <EditableText value={description} onSave={(v) => onUpdateProp('description', v)} as="p" placeholder="Description…" style={{ color: isLight || isMinimal ? c.textMuted : 'rgba(255,255,255,0.9)' }} />
          ) : (
            description
          )}
        </div>
        {buttonHref ? (
          <a
            href={buttonHref}
            data-link-element="button1"
            className={`inline-block rounded-2xl font-semibold text-base md:text-lg shadow-xl transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-2xl no-underline ${
              isCompact ? 'px-6 py-3' : 'px-10 py-4'
            } ${isOutline ? 'border-2 bg-transparent' : ''}`}
            style={
              isOutline
                ? { borderColor: c.primary, color: c.primary }
                : isLight || isMinimal
                  ? { backgroundColor: c.primary, color: '#fff' }
                  : { backgroundColor: '#fff', color: c.primary }
            }
          >
            {isEdit && onUpdateProp ? (
              <EditableText value={buttonText} onSave={(v) => onUpdateProp('buttonText', v)} as="span" placeholder="Button text" style={{ color: isOutline ? c.primary : isLight || isMinimal ? '#fff' : c.primary }} />
            ) : (
              buttonText
            )}
          </a>
        ) : (
          <span
            data-link-element="button1"
            className={`inline-block rounded-2xl font-semibold text-base md:text-lg shadow-xl transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-2xl ${
              isCompact ? 'px-6 py-3' : 'px-10 py-4'
            } ${isOutline ? 'border-2 bg-transparent' : ''}`}
            style={
              isOutline
                ? { borderColor: c.primary, color: c.primary }
                : isLight || isMinimal
                  ? { backgroundColor: c.primary, color: '#fff' }
                  : { backgroundColor: '#fff', color: c.primary }
            }
          >
            {isEdit && onUpdateProp ? (
              <EditableText value={buttonText} onSave={(v) => onUpdateProp('buttonText', v)} as="span" placeholder="Button text" style={{ color: isOutline ? c.primary : isLight || isMinimal ? '#fff' : c.primary }} />
            ) : (
              buttonText
            )}
          </span>
        )}
      </div>
    </section>
  );
}
