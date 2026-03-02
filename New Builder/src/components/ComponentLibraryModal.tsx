import { useEffect } from 'react';
import { useBuilderStore } from '../store/useBuilderStore';
import { COMPONENT_LIBRARIES } from '../data/componentLibraries';
import { COMPONENT_DEFINITIONS } from '../data/components';
import { BlockRenderer } from './blocks/BlockRenderer';
import type { ComponentKind } from '../types';
import type { BlockProps } from '../types';

const PREVIEW_SCALE = 0.28;
const PREVIEW_HEIGHT = 200;
const INNER_WIDTH_PCT = (1 / PREVIEW_SCALE) * 100;
const INNER_MIN_HEIGHT = PREVIEW_HEIGHT / PREVIEW_SCALE;

interface ComponentLibraryModalProps {
  open: boolean;
  onClose: () => void;
  kind: ComponentKind | null;
  onSelect: (props: BlockProps, defaultGridSpan?: number) => void;
}

export function ComponentLibraryModal({ open, onClose, kind, onSelect }: ComponentLibraryModalProps) {
  const theme = useBuilderStore((s) => s.theme);
  const gridColumns = useBuilderStore((s) => s.gridColumns);

  const library = kind ? COMPONENT_LIBRARIES[kind] : null;
  const def = kind ? COMPONENT_DEFINITIONS.find((d) => d.kind === kind) : null;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !kind || !library || !def) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="component-library-title"
    >
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h2 id="component-library-title" className="text-lg font-semibold text-stone-800">
            Choose a {def.label} style
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            }}
          >
            {library.map((preset) => {
              const previewBlock = {
                id: `preview-${preset.id}`,
                kind,
                props: preset.props,
                gridSpan: 12,
              };
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelect(preset.props as BlockProps, preset.defaultGridSpan);
                    onClose();
                  }}
                  className="group flex flex-col rounded-xl border-2 border-stone-200 bg-white overflow-hidden text-left transition-all hover:border-indigo-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <div
                    className="w-full overflow-hidden bg-stone-100 shrink-0"
                    style={{ height: PREVIEW_HEIGHT }}
                  >
                    <div
                      className="origin-top-left"
                      style={{
                        transform: `scale(${PREVIEW_SCALE})`,
                        width: `${INNER_WIDTH_PCT}%`,
                        minHeight: INNER_MIN_HEIGHT,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: theme.typography.bodyFont,
                          color: theme.colors.text,
                          backgroundColor: theme.colors.background,
                        }}
                      >
                        <BlockRenderer
                          block={previewBlock}
                          theme={theme}
                          isSelected={false}
                          isEdit={false}
                          onSelect={() => {}}
                          onUpdateProp={() => {}}
                          gridColumns={gridColumns}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 border-t border-stone-100 group-hover:bg-stone-50">
                    <span className="text-sm font-medium text-stone-700">{preset.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
