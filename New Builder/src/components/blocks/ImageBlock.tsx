import { useState, useEffect } from 'react';
import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';

const DEFAULT_UNSPLASH =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80';

const ASPECT_RATIOS: Record<string, string> = {
  '16/9': '56.25%',
  '4/3': '75%',
  '1/1': '100%',
  '3/4': '133.33%',
  '2/3': '150%',
  auto: '0',
};

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

type ImageVariant = 'default' | 'rounded' | 'circle' | 'bordered' | 'shadow' | 'minimal' | 'card' | 'fullBleed' | 'float' | 'polaroid' | 'overlay' | 'frame';

export function ImageBlock({ block }: Props) {
  const rawSrc = (block.props.src as string) || DEFAULT_UNSPLASH;
  const [src, setSrc] = useState(rawSrc);
  const alt = (block.props.alt as string) ?? 'Image';
  const aspectKey = (block.props.aspectRatio as string) || '16/9';
  const aspectRatio = ASPECT_RATIOS[aspectKey] ?? ASPECT_RATIOS['16/9'];
  const variant = (block.props.imageVariant as ImageVariant) || 'default';

  useEffect(() => {
    setSrc(rawSrc);
  }, [rawSrc]);

  const wrapperClass =
    variant === 'default' ? 'rounded-2xl overflow-hidden shadow-lg'
    : variant === 'rounded' ? 'rounded-3xl overflow-hidden shadow-md'
    : variant === 'circle' ? 'rounded-full overflow-hidden shadow-lg aspect-square'
    : variant === 'bordered' ? 'rounded-2xl overflow-hidden border-2'
    : variant === 'shadow' ? 'rounded-2xl overflow-hidden shadow-2xl'
    : variant === 'minimal' ? 'rounded-xl overflow-hidden'
    : variant === 'card' ? 'rounded-2xl overflow-hidden shadow-lg border border-stone-100'
    : variant === 'fullBleed' ? 'rounded-none overflow-hidden'
    : variant === 'float' ? 'rounded-2xl overflow-hidden shadow-xl'
    : variant === 'polaroid' ? 'rounded-lg overflow-hidden bg-white p-2 shadow-lg'
    : variant === 'overlay' ? 'rounded-2xl overflow-hidden'
    : variant === 'frame' ? 'rounded-2xl overflow-hidden border-4'
    : 'rounded-2xl overflow-hidden shadow-lg';

  return (
    <div className={`builder-block image-block ${wrapperClass} transition-all duration-300 hover:shadow-xl`}>
      <div
        className="relative w-full overflow-hidden bg-stone-200"
        style={{
          paddingBottom: aspectRatio === '0' ? '56.25%' : aspectRatio,
        }}
      >
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setSrc(DEFAULT_UNSPLASH)}
        />
      </div>
    </div>
  );
}
