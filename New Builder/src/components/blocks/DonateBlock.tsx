import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

type DonateVariant = 'default' | 'minimal' | 'outline' | 'card' | 'gradient' | 'dark' | 'light' | 'split' | 'compact' | 'impact' | 'urgent' | 'trust';

export function DonateBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const title = (block.props.title as string) ?? 'Support Our Cause';
  const description = (block.props.description as string) ?? 'Every gift makes a difference.';
  const buttonText = (block.props.buttonText as string) ?? 'Donate Now';
  const buttonLinkType = (block.props.buttonLinkType as string) ?? 'none';
  const buttonLinkValue = (block.props.buttonLinkValue as string) ?? '';
  const buttonHref =
    buttonLinkType === 'page' && buttonLinkValue
      ? `#${buttonLinkValue}`
      : buttonLinkType === 'external' && buttonLinkValue
        ? buttonLinkValue
        : null;
  const variant = (block.props.donateVariant as DonateVariant) || 'default';

  const isMinimal = variant === 'minimal';
  const isOutline = variant === 'outline';
  const isCard = variant === 'card';
  const isGradient = variant === 'gradient';
  const isDark = variant === 'dark';
  const isLight = variant === 'light';
  const isCompact = variant === 'compact';

  const bgStyle =
    isGradient ? { background: `linear-gradient(135deg, ${c.secondary} 0%, ${c.primary} 100%)` }
    : isDark ? { backgroundColor: c.text }
    : isLight ? { backgroundColor: c.surface, color: c.text }
    : isMinimal ? { backgroundColor: 'transparent', color: c.text }
    : { backgroundColor: c.secondary, color: '#fff' };

  return (
    <section
      className={`builder-block donate-block w-full px-4 sm:px-6 lg:px-8 text-center overflow-hidden transition-all duration-300 ease-out ${
        isCompact ? 'py-12 md:py-16' : isMinimal ? 'py-12 md:py-16' : 'py-24 md:py-32'
      } ${isCard ? 'rounded-3xl shadow-xl border border-stone-200/50 mx-4' : ''}`}
      style={{ ...bgStyle }}
    >
      <div className="max-w-4xl mx-auto">
        <h2
          className={`text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-5 tracking-tight ${isCompact ? 'text-xl md:text-2xl' : ''}`}
          style={{ fontFamily: theme.typography.headingFont, color: isLight || isMinimal ? c.text : '#fff' }}
        >
          {isEdit && onUpdateProp ? (
            <EditableText value={title} onSave={(v) => onUpdateProp('title', v)} as="span" className="block" placeholder="Title" style={{ color: isLight || isMinimal ? c.text : '#fff' }} />
          ) : (
            title
          )}
        </h2>
        <div className="mb-10 text-lg max-w-2xl mx-auto" style={{ color: isLight || isMinimal ? c.textMuted : 'rgba(255,255,255,0.9)' }}>
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
            className={`inline-block rounded-2xl font-semibold text-base md:text-lg shadow-xl transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-2xl no-underline ${isCompact ? 'px-6 py-3' : 'px-10 py-4'} ${isOutline ? 'border-2 bg-transparent' : ''}`}
            style={
              isOutline ? { borderColor: c.primary, color: c.primary } : { backgroundColor: c.accent, color: '#fff' }
            }
          >
            {isEdit && onUpdateProp ? (
              <EditableText value={buttonText} onSave={(v) => onUpdateProp('buttonText', v)} as="span" placeholder="Button text" style={{ color: isOutline ? c.primary : '#fff' }} />
            ) : (
              buttonText
            )}
          </a>
        ) : (
          <span
            data-link-element="button1"
            className={`inline-block rounded-2xl font-semibold text-base md:text-lg shadow-xl transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-2xl ${isCompact ? 'px-6 py-3' : 'px-10 py-4'} ${isOutline ? 'border-2 bg-transparent' : ''}`}
            style={
              isOutline ? { borderColor: c.primary, color: c.primary } : { backgroundColor: c.accent, color: '#fff' }
            }
          >
            {isEdit && onUpdateProp ? (
              <EditableText value={buttonText} onSave={(v) => onUpdateProp('buttonText', v)} as="span" placeholder="Button text" style={{ color: isOutline ? c.primary : '#fff' }} />
            ) : (
              buttonText
            )}
          </span>
        )}
      </div>
    </section>
  );
}
