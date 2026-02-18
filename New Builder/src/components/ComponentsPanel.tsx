import { useState } from 'react';
import { useBuilderStore } from '../store/useBuilderStore';
import { COMPONENT_DEFINITIONS } from '../data/components';
import { LIBRARY_COMPONENT_KINDS } from '../data/componentLibraries';
import { ComponentLibraryModal } from './ComponentLibraryModal';
import type { ComponentKind } from '../types';
import type { BlockProps } from '../types';

export function ComponentsPanel() {
  const addBlock = useBuilderStore((s) => s.addBlock);
  const [modalKind, setModalKind] = useState<ComponentKind | null>(null);

  const handleAdd = (e: React.MouseEvent, def: (typeof COMPONENT_DEFINITIONS)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    addBlock({
      kind: def.kind,
      props: { ...def.defaultProps },
      gridSpan: def.defaultGridSpan ?? 12,
    });
  };

  const handleSelectFromLibrary = (props: BlockProps, defaultGridSpan?: number) => {
    if (!modalKind) return;
    addBlock({
      kind: modalKind,
      props: { ...props },
      gridSpan: defaultGridSpan ?? 12,
    });
    setModalKind(null);
  };

  return (
    <>
      <aside className="w-72 shrink-0 border-r border-stone-200 bg-white flex flex-col overflow-hidden relative z-10">
        <div className="p-3 border-b border-stone-200">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
            Components
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Click to add · Library components open a preview modal
          </p>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="grid grid-cols-2 gap-2">
            {COMPONENT_DEFINITIONS.map((def) => {
              const hasLibrary = LIBRARY_COMPONENT_KINDS.includes(def.kind);
              return (
                <button
                  key={def.kind}
                  type="button"
                  onClick={(e) => {
                    if (hasLibrary) {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalKind(def.kind);
                    } else {
                      handleAdd(e, def);
                    }
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-stone-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition text-center cursor-pointer"
                >
                  <span className="text-2xl mb-1" aria-hidden>{def.icon}</span>
                  <span className="text-xs font-medium text-stone-700">{def.label}</span>
                  {hasLibrary && (
                    <span className="text-[10px] text-stone-400 mt-0.5">+ preview</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <ComponentLibraryModal
        open={modalKind !== null}
        onClose={() => setModalKind(null)}
        kind={modalKind}
        onSelect={handleSelectFromLibrary}
      />
    </>
  );
}
