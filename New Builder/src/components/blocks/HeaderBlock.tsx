import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

function getNavHref(block: BuilderBlock, n: 1 | 2 | 3): string {
  const linkType = (block.props[`navLink${n}LinkType`] as string) ?? 'page';
  if (linkType === 'page') {
    let slug = block.props[`navLink${n}Page`] as string | undefined;
    if (!slug) {
      const url = (block.props[`navLink${n}Url`] as string) ?? '';
      slug = url.startsWith('#') ? url.slice(1) : url || (n === 1 ? 'about' : n === 2 ? 'events' : 'contact');
    }
    return slug ? `#${slug}` : '#';
  }
  return (block.props[`navLink${n}Url`] as string) || '#';
}

export function HeaderBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const siteName = (block.props.siteName as string) ?? 'My Organization';
  const showNav = block.props.showNav !== false;
  const link1Text = (block.props.navLink1Text as string) ?? 'About';
  const link1Url = getNavHref(block, 1);
  const link2Text = (block.props.navLink2Text as string) ?? 'Events';
  const link2Url = getNavHref(block, 2);
  const link3Text = (block.props.navLink3Text as string) ?? 'Contact';
  const link3Url = getNavHref(block, 3);
  const variant = (block.props.headerVariant as string) || 'default';

  const isCentered = variant === 'centered';
  const isMinimal = variant === 'minimal';
  const isDark = variant === 'dark';
  const isTransparent = variant === 'transparent';
  const isMega = variant === 'mega';
  const isCompact = variant === 'compact';
  const isFloating = variant === 'floating';
  const isSplit = variant === 'split';

  return (
    <header
      className={`builder-block header-block w-full transition-all duration-200 ${
        isCompact ? 'py-2 md:py-3' : isMinimal ? 'py-3 md:py-4' : isMega ? 'py-5 md:py-6' : 'py-4 md:py-5'
      } ${variant === 'bordered' ? 'border-b-2' : 'border-b border-stone-200/50'} ${
        isFloating ? 'mx-4 mt-4 rounded-2xl shadow-lg border border-stone-200/50' : ''
      }`}
      style={{
        backgroundColor: isDark ? c.primary : isTransparent ? 'transparent' : isFloating ? 'rgba(255,255,255,0.98)' : c.background,
        color: isDark ? '#fff' : c.text,
        borderColor: variant === 'bordered' ? c.primary : c.surface,
      }}
    >
      <div className={`w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center ${
        isCentered ? 'flex-col gap-4 md:flex-row md:justify-center md:gap-8'
        : isSplit ? 'flex-col gap-3 md:flex-row md:justify-between md:items-center'
        : 'justify-between'
      }`}>
        <span
          className={`font-bold tracking-tight ${
            isCompact ? 'text-sm md:text-base'
            : isMinimal ? 'text-base md:text-lg'
            : isMega ? 'text-xl md:text-2xl'
            : 'text-lg md:text-xl'
          }`}
          style={{ fontFamily: theme.typography.headingFont, color: isDark ? '#fff' : undefined }}
        >
          {isEdit && onUpdateProp ? (
            <EditableText
              value={siteName}
              onSave={(v) => onUpdateProp('siteName', v)}
              as="span"
              placeholder="Site name"
              style={{ fontFamily: theme.typography.headingFont, color: isDark ? '#fff' : c.text }}
            />
          ) : (
            siteName
          )}
        </span>
        {showNav && (
          <nav className={`flex gap-6 md:gap-8 ${isCentered ? 'flex-wrap justify-center' : ''}`}>
            <a
              href={link1Url}
              className="text-sm font-medium opacity-90 hover:opacity-100 transition-opacity"
              style={{ color: isDark ? 'rgba(255,255,255,0.95)' : c.primary }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText value={link1Text} onSave={(v) => onUpdateProp('navLink1Text', v)} as="span" placeholder="Link 1" style={{ color: isDark ? '#fff' : c.primary }} />
              ) : link1Text}
            </a>
            <a
              href={link2Url}
              className="text-sm font-medium opacity-90 hover:opacity-100 transition-opacity"
              style={{ color: isDark ? 'rgba(255,255,255,0.95)' : c.primary }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText value={link2Text} onSave={(v) => onUpdateProp('navLink2Text', v)} as="span" placeholder="Link 2" style={{ color: isDark ? '#fff' : c.primary }} />
              ) : link2Text}
            </a>
            <a
              href={link3Url}
              className="text-sm font-medium opacity-90 hover:opacity-100 transition-opacity"
              style={{ color: isDark ? 'rgba(255,255,255,0.95)' : c.primary }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText value={link3Text} onSave={(v) => onUpdateProp('navLink3Text', v)} as="span" placeholder="Link 3" style={{ color: isDark ? '#fff' : c.primary }} />
              ) : link3Text}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
