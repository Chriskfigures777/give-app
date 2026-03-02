import { useState, useEffect } from 'react';
import { useBuilderStore } from '../store/useBuilderStore';
import { BlockRenderer } from './blocks/BlockRenderer';

/** Full-page preview: shows one page at a time; hash (#slug) controls which page. */
export function PreviewFrame() {
  const { pages, theme, gridColumns } = useBuilderStore();
  const [previewSlug, setPreviewSlug] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
  );

  useEffect(() => {
    const onHash = () => setPreviewSlug(window.location.hash.slice(1));
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const effectiveSlug = previewSlug || pages[0]?.slug || '';
  const previewPage = pages.find((p) => p.slug === effectiveSlug) ?? pages[0];
  const blocks = previewPage?.blocks ?? [];

  return (
    <div
      className="w-full min-h-screen overflow-auto"
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.bodyFont,
        color: theme.colors.text,
      }}
    >
      {pages.length > 1 && (
        <nav className="sticky top-0 z-10 flex flex-wrap gap-2 items-center px-4 py-3 border-b border-stone-200 bg-white/95 backdrop-blur">
          {pages.map((p) => (
            <a
              key={p.id}
              href={`#${p.slug}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                p.slug === effectiveSlug
                  ? 'bg-indigo-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {p.name}
            </a>
          ))}
        </nav>
      )}
      <div
        className="w-full min-h-screen"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: 0,
        }}
      >
        {blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            theme={theme}
            isSelected={false}
            isEdit={false}
            onSelect={() => {}}
            onUpdateProp={() => {}}
            gridColumns={gridColumns}
          />
        ))}
      </div>
    </div>
  );
}
