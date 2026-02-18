import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

type TestimonialVariant = 'default' | 'card' | 'minimal' | 'quote' | 'bordered' | 'centered' | 'large' | 'floating' | 'dark' | 'accent' | 'compact' | 'split';

export function TestimonialBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const quote = (block.props.quote as string) ?? 'A meaningful quote.';
  const author = (block.props.author as string) ?? '— Someone';
  const variant = (block.props.testimonialVariant as TestimonialVariant) || 'default';

  const blockClass =
    variant === 'default' ? 'py-10 px-8 md:px-10 rounded-3xl border-l-4'
    : variant === 'card' ? 'py-10 px-8 rounded-3xl shadow-xl border border-stone-100'
    : variant === 'minimal' ? 'py-8 px-6 rounded-xl'
    : variant === 'quote' ? 'py-12 px-8 rounded-2xl border-l-4'
    : variant === 'bordered' ? 'py-10 px-8 rounded-2xl border-2'
    : variant === 'centered' ? 'py-12 px-8 rounded-3xl text-center border-l-0'
    : variant === 'large' ? 'py-14 px-10 rounded-3xl border-l-4'
    : variant === 'floating' ? 'py-10 px-8 rounded-3xl shadow-2xl mx-4'
    : variant === 'dark' ? 'py-10 px-8 rounded-3xl'
    : variant === 'accent' ? 'py-10 px-8 rounded-3xl border-l-4'
    : variant === 'compact' ? 'py-6 px-6 rounded-xl border-l-4'
    : variant === 'split' ? 'py-10 px-8 rounded-2xl'
    : 'py-10 px-8 md:px-10 rounded-3xl border-l-4';

  return (
    <blockquote
      className={`builder-block testimonial-block ${blockClass} transition-all duration-300 ease-out hover:shadow-lg`}
      style={{
        backgroundColor: variant === 'dark' ? c.primary : c.surface,
        borderColor: variant === 'dark' ? 'transparent' : c.primary,
        color: variant === 'dark' ? '#fff' : c.text,
      }}
    >
      <p
        className={`italic mb-4 leading-relaxed ${variant === 'large' ? 'text-xl md:text-2xl' : variant === 'compact' ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}
        style={{ fontFamily: theme.typography.bodyFont, color: variant === 'dark' ? 'rgba(255,255,255,0.95)' : undefined }}
      >
        {isEdit && onUpdateProp ? (
          <>
            "
            <EditableText
              value={quote}
              onSave={(v) => onUpdateProp('quote', v)}
              as="span"
              placeholder="Quote…"
              style={{ fontFamily: theme.typography.bodyFont }}
            />
            "
          </>
        ) : (
          `"${quote}"`
        )}
      </p>
      <cite
        className="text-sm md:text-base not-italic font-medium block"
        style={{ color: variant === 'dark' ? 'rgba(255,255,255,0.8)' : c.textMuted }}
      >
        {isEdit && onUpdateProp ? (
          <EditableText
            value={author}
            onSave={(v) => onUpdateProp('author', v)}
            as="span"
            placeholder="— Author"
            style={{ color: c.textMuted }}
          />
        ) : (
          author
        )}
      </cite>
    </blockquote>
  );
}
