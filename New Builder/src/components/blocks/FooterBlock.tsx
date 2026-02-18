import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

type FooterVariant = 'default' | 'minimal' | 'centered' | 'dark' | 'bordered' | 'split' | 'compact' | 'links' | 'floating' | 'accent' | 'fullWidth' | 'simple';

export function FooterBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const copyright = (block.props.copyright as string) ?? '© 2026 Your Organization.';
  const tagline = (block.props.tagline as string) ?? '';
  const variant = (block.props.footerVariant as FooterVariant) || 'default';

  const footerClass =
    variant === 'default' ? 'py-12 md:py-14 border-t border-stone-200/60'
    : variant === 'minimal' ? 'py-8 md:py-10 border-t border-stone-200/40'
    : variant === 'centered' ? 'py-12 md:py-14 border-t border-stone-200/60 text-center'
    : variant === 'dark' ? 'py-12 md:py-14 border-t-0'
    : variant === 'bordered' ? 'py-12 md:py-14 border-t-2'
    : variant === 'split' ? 'py-10 md:py-12 border-t'
    : variant === 'compact' ? 'py-6 md:py-8 border-t border-stone-200/50'
    : variant === 'links' ? 'py-12 md:py-14 border-t'
    : variant === 'floating' ? 'py-10 mx-4 rounded-2xl border border-stone-200'
    : variant === 'accent' ? 'py-12 md:py-14 border-t-0'
    : variant === 'fullWidth' ? 'py-12 md:py-14 border-t rounded-none'
    : variant === 'simple' ? 'py-8 border-t border-stone-200'
    : 'py-12 md:py-14 border-t border-stone-200/60';

  return (
    <footer
      className={`builder-block footer-block w-full ${footerClass} transition-all duration-200`}
      style={{
        backgroundColor: variant === 'dark' ? c.text : variant === 'accent' ? c.primary : c.surface,
        color: variant === 'dark' || variant === 'accent' ? 'rgba(255,255,255,0.9)' : c.textMuted,
        borderColor: variant === 'bordered' ? c.primary : 'rgba(0,0,0,0.06)',
      }}
    >
      <div className={`w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${variant === 'centered' || variant === 'minimal' ? 'text-center' : ''}`}>
        <p className="text-sm md:text-base" style={{ fontFamily: theme.typography.bodyFont }}>
          {isEdit && onUpdateProp ? (
            <EditableText value={copyright} onSave={(v) => onUpdateProp('copyright', v)} as="span" placeholder="Copyright" style={{ color: c.textMuted }} />
          ) : (
            copyright
          )}
        </p>
        {(tagline || (isEdit && onUpdateProp)) && (
          <p className="text-sm mt-2 opacity-80" style={{ color: c.textMuted }}>
            {isEdit && onUpdateProp ? (
              <EditableText value={tagline} onSave={(v) => onUpdateProp('tagline', v)} as="span" placeholder="Tagline" style={{ color: c.textMuted }} />
            ) : (
              tagline
            )}
          </p>
        )}
      </div>
    </footer>
  );
}
