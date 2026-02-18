import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

const COL_KEYS = ['column1Text', 'column2Text', 'column3Text', 'column4Text', 'column5Text', 'column6Text'] as const;

type ColumnsVariant = 'default' | 'bordered' | 'cards' | 'minimal' | 'elevated' | 'compact' | 'split' | 'dark' | 'accent' | 'grid' | 'featured' | 'simple';

export function ColumnsBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const columns = Math.min(Math.max((block.props.columns as number) ?? 3, 1), 6);
  const variant = (block.props.columnsVariant as ColumnsVariant) || 'default';

  const blockClass =
    variant === 'default' ? 'py-8 md:py-10 grid gap-6 md:gap-8 rounded-3xl'
    : variant === 'bordered' ? 'py-8 md:py-10 grid gap-6 rounded-2xl border-2'
    : variant === 'cards' ? 'py-8 md:py-10 grid gap-6 rounded-3xl'
    : variant === 'minimal' ? 'py-6 md:py-8 grid gap-4 rounded-xl'
    : variant === 'elevated' ? 'py-10 md:py-12 grid gap-6 rounded-3xl shadow-lg'
    : variant === 'compact' ? 'py-6 grid gap-4 rounded-2xl'
    : variant === 'split' ? 'py-8 grid gap-8 rounded-2xl'
    : variant === 'dark' ? 'py-8 md:py-10 grid gap-6 rounded-3xl'
    : variant === 'accent' ? 'py-8 md:py-10 grid gap-6 rounded-3xl'
    : variant === 'grid' ? 'py-8 grid gap-6 rounded-3xl'
    : variant === 'featured' ? 'py-10 grid gap-8 rounded-3xl'
    : variant === 'simple' ? 'py-6 grid gap-4 rounded-xl'
    : 'py-8 md:py-10 grid gap-6 md:gap-8 rounded-3xl';

  const cellClass =
    variant === 'default' ? 'p-6 md:p-8 rounded-2xl border border-dashed min-h-[120px]'
    : variant === 'bordered' ? 'p-6 rounded-2xl border-2 min-h-[120px]'
    : variant === 'cards' ? 'p-6 rounded-2xl shadow-md border border-stone-100 min-h-[120px]'
    : variant === 'minimal' ? 'p-4 rounded-xl min-h-[100px]'
    : variant === 'compact' ? 'p-4 rounded-xl min-h-[80px]'
    : variant === 'dark' ? 'p-6 rounded-2xl min-h-[120px]'
    : 'p-6 md:p-8 rounded-2xl border border-dashed min-h-[120px]';

  return (
    <div
      className={`builder-block columns-block ${blockClass} transition-all duration-200`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        backgroundColor: variant === 'dark' ? c.primary : variant === 'accent' ? c.surface : c.surface,
      }}
    >
      {Array.from({ length: columns }).map((_, i) => {
        const key = COL_KEYS[i];
        const text = (block.props[key] as string) ?? `Column ${i + 1} content. Double-click to edit.`;
        return (
          <div
            key={i}
            className={`${cellClass} transition-all duration-200 hover:shadow-sm`}
            style={{
              borderColor: variant === 'bordered' ? c.primary : variant === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
              color: variant === 'dark' ? 'rgba(255,255,255,0.9)' : c.textMuted,
              fontFamily: theme.typography.bodyFont,
              backgroundColor: variant === 'dark' ? 'rgba(255,255,255,0.1)' : variant === 'cards' ? c.background : undefined,
            }}
          >
            {isEdit && onUpdateProp ? (
              <EditableText
                value={text}
                onSave={(v) => onUpdateProp(key, v)}
                as="p"
                multiline
                placeholder={`Column ${i + 1}`}
                style={{ color: c.textMuted }}
              />
            ) : (
              <p className="text-sm">{text}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
