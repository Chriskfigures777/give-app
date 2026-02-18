import type { BuilderBlock, SiteTheme } from '../../types';
import { HeroBlock } from './HeroBlock';
import { HeaderBlock } from './HeaderBlock';
import { SectionBlock } from './SectionBlock';
import { MediaSectionBlock } from './MediaSectionBlock';
import { CTABlock } from './CTABlock';
import { EventsBlock } from './EventsBlock';
import { TestimonialBlock } from './TestimonialBlock';
import { DonateBlock } from './DonateBlock';
import { ContactFormBlock } from './ContactFormBlock';
import { FooterBlock } from './FooterBlock';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { ColumnsBlock } from './ColumnsBlock';
import { SpacerBlock } from './SpacerBlock';

interface BlockRendererProps {
  block: BuilderBlock;
  theme: SiteTheme;
  isSelected: boolean;
  isEdit: boolean;
  onSelect: () => void;
  onUpdateProp: (key: string, value: string | number | boolean) => void;
  gridColumns: number;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDropTarget?: boolean;
}

const BLOCK_MAP = {
  hero: HeroBlock,
  header: HeaderBlock,
  section: SectionBlock,
  mediaSection: MediaSectionBlock,
  cta: CTABlock,
  events: EventsBlock,
  testimonial: TestimonialBlock,
  donate: DonateBlock,
  contactForm: ContactFormBlock,
  footer: FooterBlock,
  text: TextBlock,
  image: ImageBlock,
  columns: ColumnsBlock,
  spacer: SpacerBlock,
};

/** Blocks that span full viewport width (no inner max-width constraint) */
const FULL_BLEED_KINDS = new Set([
  'hero',
  'header',
  'cta',
  'donate',
  'footer',
]);

export function BlockRenderer({
  block,
  theme,
  isSelected,
  isEdit,
  onSelect,
  onUpdateProp,
  gridColumns,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDropTarget,
}: BlockRendererProps) {
  const Component = BLOCK_MAP[block.kind];
  if (!Component) return null;

  const span = block.gridSpan ?? 12;
  const fullBleed = FULL_BLEED_KINDS.has(block.kind);

  return (
    <div
      id={`block-${block.id}`}
      className={`block-renderer-wrapper min-h-[24px] transition-all duration-200 ease-out flex items-stretch ${isEdit ? 'cursor-pointer' : ''} ${isSelected ? 'builder-selected rounded-xl' : ''} ${isDropTarget ? 'ring-2 ring-indigo-400 ring-inset rounded-xl' : ''}`}
      style={{
        gridColumn: `span ${Math.min(span, gridColumns)}`,
      }}
      onClick={(e) => {
        if (isEdit) {
          e.stopPropagation();
          onSelect();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isEdit && onDragStart && (
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="shrink-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded-l touch-none"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
      {fullBleed ? (
        <Component
          block={block}
          theme={theme}
          isEdit={isEdit}
          onUpdateProp={onUpdateProp}
        />
      ) : (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 first:pt-0">
          <Component
            block={block}
            theme={theme}
            isEdit={isEdit}
            onUpdateProp={onUpdateProp}
          />
        </div>
      )}
      </div>
    </div>
  );
}
