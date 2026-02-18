import { useState, useEffect } from 'react';
import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

const DEFAULT_UNSPLASH =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80';

type MediaVariant = 'default' | 'card' | 'bordered' | 'overlay' | 'large' | 'stacked' | 'minimal' | 'floating' | 'split' | 'alternate';

export function MediaSectionBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const rawImageSrc = (block.props.imageSrc as string) || DEFAULT_UNSPLASH;
  const [imageSrc, setImageSrc] = useState(rawImageSrc);
  useEffect(() => {
    setImageSrc(rawImageSrc);
  }, [rawImageSrc]);
  const imagePosition = (block.props.imagePosition as string) === 'right' ? 'right' : 'left';
  const title = (block.props.title as string) ?? 'Our Story';
  const content =
    (block.props.content as string) ??
    'Share your mission and impact. This layout puts a striking image beside your message—ideal for about sections, programs, or campaigns.';
  const variant = (block.props.mediaVariant as MediaVariant) || 'default';

  const imageWrapperClass =
    variant === 'card' ? 'rounded-3xl overflow-hidden shadow-xl border border-stone-100'
    : variant === 'bordered' ? 'rounded-2xl overflow-hidden border-2'
    : variant === 'overlay' ? 'rounded-2xl overflow-hidden'
    : variant === 'large' ? 'min-h-[360px] md:min-h-[480px] rounded-2xl overflow-hidden shadow-2xl'
    : variant === 'floating' ? 'rounded-2xl overflow-hidden shadow-2xl -mt-4'
    : variant === 'minimal' ? 'rounded-xl overflow-hidden'
    : 'rounded-2xl overflow-hidden bg-stone-200 shadow-xl';

  const imageEl = (
    <div
      className={`relative w-full min-h-[280px] md:min-h-[380px] bg-stone-200 ${imageWrapperClass}`}
      style={variant === 'bordered' ? { borderColor: c.primary } : undefined}
    >
      <img
        src={imageSrc}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover ${variant === 'overlay' ? 'opacity-90' : ''}`}
        onError={() => setImageSrc(DEFAULT_UNSPLASH)}
      />
    </div>
  );

  const textEl = (
    <div className="flex flex-col justify-center py-8 md:py-12">
      <h2
        className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-5"
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
        className="text-base md:text-lg lg:text-xl leading-relaxed text-stone-600"
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
    </div>
  );

  return (
    <section
      className={`builder-block media-section overflow-hidden py-4 ${
        variant === 'alternate' ? 'bg-stone-50' : ''
      } ${variant === 'stacked' ? 'md:flex md:flex-col' : ''}`}
      style={{ backgroundColor: variant === 'alternate' ? undefined : c.background }}
    >
      <div className={`grid gap-10 md:gap-14 lg:gap-20 items-center md:grid-cols-2 ${
        variant === 'split' ? 'max-w-6xl mx-auto' : ''
      }`}>
        {imagePosition === 'left' ? (
          <>
            {imageEl}
            {textEl}
          </>
        ) : (
          <>
            {textEl}
            {imageEl}
          </>
        )}
      </div>
    </section>
  );
}
