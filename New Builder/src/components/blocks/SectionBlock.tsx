import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

type SectionVariant = 'default' | 'card' | 'elevated' | 'bordered' | 'gradient' | 'quote' | 'stats' | 'minimal' | 'highlight' | 'icon' | 'full' | 'alternate';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

export function SectionBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const title = (block.props.title as string) ?? 'Section';
  const content = (block.props.content as string) ?? '';
  const variant = (block.props.sectionVariant as SectionVariant) || 'default';

  const base = 'builder-block section-block py-16 md:py-20 transition-all duration-300 ease-out';
  const variantClasses: Record<SectionVariant, string> = {
    default: 'px-6 md:px-10 rounded-2xl border border-stone-200/60 hover:border-stone-300/80',
    card: 'px-8 md:px-12 rounded-3xl shadow-lg hover:shadow-xl border border-stone-100',
    elevated: 'px-8 md:px-12 rounded-3xl shadow-xl hover:shadow-2xl border-0',
    bordered: 'px-8 md:px-12 rounded-2xl border-2',
    gradient: 'px-8 md:px-12 rounded-3xl border-0',
    quote: 'px-8 md:px-12 rounded-2xl border-l-4',
    stats: 'px-8 md:px-12 rounded-2xl border-0 text-center',
    minimal: 'px-6 md:px-10 rounded-xl border-0',
    highlight: 'px-8 md:px-12 rounded-2xl border-2',
    icon: 'px-8 md:px-12 rounded-2xl border border-stone-200/60',
    full: 'px-6 md:px-12 rounded-none border-0 max-w-none',
    alternate: 'px-8 md:px-12 rounded-2xl border-0',
  };
  const borderStyle =
    variant === 'bordered' ? { borderColor: c.primary }
    : variant === 'quote' ? { borderLeftWidth: 4, borderLeftColor: c.primary }
    : variant === 'highlight' ? { borderColor: c.accent }
    : variant === 'gradient' ? { background: `linear-gradient(135deg, ${c.surface} 0%, ${c.background} 100%)` }
    : variant === 'alternate' ? { backgroundColor: c.surface }
    : undefined;

  return (
    <section
      className={`${base} ${variantClasses[variant]}`}
      style={{
        backgroundColor: variant === 'gradient' || variant === 'alternate' ? undefined : c.background,
        color: c.text,
        ...borderStyle,
      }}
    >
      <h2
        className="text-2xl md:text-3xl lg:text-4xl font-bold mb-5 md:mb-6 tracking-tight"
        style={{ fontFamily: theme.typography.headingFont, color: c.text }}
      >
        {isEdit && onUpdateProp ? (
          <EditableText
            value={title}
            onSave={(v) => onUpdateProp('title', v)}
            as="span"
            className="block"
            style={{ fontFamily: theme.typography.headingFont, color: c.text }}
          />
        ) : (
          title
        )}
      </h2>
      <div
        className="max-w-2xl text-base md:text-lg leading-relaxed"
        style={{ fontFamily: theme.typography.bodyFont, color: c.textMuted }}
      >
        {isEdit && onUpdateProp ? (
          <EditableText
            value={content}
            onSave={(v) => onUpdateProp('content', v)}
            as="p"
            multiline
            placeholder="Add content…"
            style={{ fontFamily: theme.typography.bodyFont, color: c.textMuted }}
          />
        ) : (
          content
        )}
      </div>
    </section>
  );
}
