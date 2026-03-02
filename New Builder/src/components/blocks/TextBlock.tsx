import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

type TextVariant = 'default' | 'lead' | 'small' | 'muted' | 'bordered' | 'card' | 'highlight' | 'minimal' | 'centered' | 'large' | 'quote' | 'caption';

export function TextBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const content = (block.props.content as string) ?? 'Add your text here.';
  const variant = (block.props.textVariant as TextVariant) || 'default';

  const blockClass =
    variant === 'default' ? 'py-5 px-6 rounded-2xl'
    : variant === 'lead' ? 'py-6 px-6 rounded-2xl text-lg'
    : variant === 'small' ? 'py-3 px-4 rounded-xl text-sm'
    : variant === 'muted' ? 'py-5 px-6 rounded-2xl'
    : variant === 'bordered' ? 'py-5 px-6 rounded-2xl border-2'
    : variant === 'card' ? 'py-6 px-6 rounded-2xl shadow-md border border-stone-100'
    : variant === 'highlight' ? 'py-6 px-6 rounded-2xl border-l-4'
    : variant === 'minimal' ? 'py-4 px-4 rounded-lg'
    : variant === 'centered' ? 'py-5 px-6 rounded-2xl text-center'
    : variant === 'large' ? 'py-6 px-6 rounded-2xl text-lg md:text-xl'
    : variant === 'quote' ? 'py-5 px-6 rounded-xl italic border-l-4'
    : variant === 'caption' ? 'py-2 px-4 rounded text-sm'
    : 'py-5 px-6 rounded-2xl';

  return (
    <div
      className={`builder-block text-block ${blockClass} transition-all duration-200`}
      style={{
        fontFamily: theme.typography.bodyFont,
        color: variant === 'muted' ? c.textMuted : c.text,
        fontSize: theme.typography.baseSize ? `${theme.typography.baseSize}px` : undefined,
        borderColor: variant === 'bordered' ? c.primary : variant === 'highlight' || variant === 'quote' ? c.primary : undefined,
        backgroundColor: variant === 'card' ? c.surface : undefined,
      }}
    >
      {isEdit && onUpdateProp ? (
        <EditableText
          value={content}
          onSave={(v) => onUpdateProp('content', v)}
          as="p"
          multiline
          placeholder="Add your text…"
          style={{ fontFamily: theme.typography.bodyFont, color: c.text }}
        />
      ) : (
        content
      )}
    </div>
  );
}
