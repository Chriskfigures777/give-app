import { useEffect, useRef, useState } from 'react';
import { useBuilderStore } from '../store/useBuilderStore';
import { BlockRenderer } from './blocks/BlockRenderer';

const DRAG_TYPE = 'application/x-builder-block';

export function BuilderCanvas() {
  const { pages, currentPageId, theme, selectedBlockId, mode, gridColumns, selectBlock, selectSubElement, updateBlock, moveBlockToIndex } = useBuilderStore();
  const blocks = pages.find((p) => p.id === currentPageId)?.blocks ?? [];
  const isEdit = mode === 'edit';
  const mainRef = useRef<HTMLElement>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // When a new block is selected (e.g. after adding), scroll it into view
  useEffect(() => {
    if (!selectedBlockId || !mainRef.current) return;
    const el = document.getElementById(`block-${selectedBlockId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [selectedBlockId]);

  const handleDragStart = (blockId: string) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DRAG_TYPE, blockId);
    e.dataTransfer.setData('text/plain', blockId); // fallback for some browsers
    e.dataTransfer.setDragImage(new Image(), 0, 0); // hide default ghost so drop zones are visible
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData(DRAG_TYPE) || e.dataTransfer.getData('text/plain');
    if (id) moveBlockToIndex(id, index);
    setDropTargetIndex(null);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  return (
    <main
      ref={mainRef}
      className="flex-1 overflow-auto canvas-grid min-h-0 bg-stone-100"
      onClick={() => { if (isEdit) { selectBlock(null); selectSubElement(null); } }}
    >
      <div
        className="w-full min-h-full py-6"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: 0,
        }}
      >
        {blocks.length === 0 && isEdit && (
          <div
            className="col-span-full flex flex-col items-center justify-center py-24 text-stone-400"
            style={{ gridColumn: `1 / -1` }}
          >
            <p className="text-lg font-medium">Your page is empty</p>
            <p className="text-sm mt-1">Add components from the left panel to get started.</p>
          </div>
        )}

        {isEdit && blocks.length > 0 && (
          <div
            style={{ gridColumn: '1 / -1' }}
            className={`min-h-[12px] transition-colors duration-150 rounded ${dropTargetIndex === 0 ? 'bg-indigo-200/60 ring-2 ring-indigo-400 ring-inset' : ''}`}
            onDragOver={handleDragOver(0)}
            onDragLeave={() => setDropTargetIndex((i) => (i === 0 ? null : i))}
            onDrop={handleDrop(0)}
          />
        )}

        {blocks.map((block, i) => (
          <div
            key={block.id}
            style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}
          >
            {isEdit && (
              <div
                style={{ minHeight: 20 }}
                className={`transition-colors duration-150 rounded-t flex-shrink-0 ${dropTargetIndex === i ? 'bg-indigo-300/70 ring-2 ring-indigo-400' : ''}`}
                onDragOver={handleDragOver(i)}
                onDragLeave={() => setDropTargetIndex((idx) => (idx === i ? null : idx))}
                onDrop={handleDrop(i)}
              />
            )}
            <BlockRenderer
              block={block}
              theme={theme}
              isSelected={selectedBlockId === block.id}
              isEdit={isEdit}
              onSelect={() => selectBlock(block.id)}
              onUpdateProp={(key, value) => updateBlock(block.id, { [key]: value })}
              gridColumns={gridColumns}
              onDragStart={isEdit ? handleDragStart(block.id) : undefined}
              onDragEnd={() => setDropTargetIndex(null)}
              onDragOver={isEdit ? handleDragOver(i + 1) : undefined}
              onDragLeave={isEdit ? () => setDropTargetIndex((idx) => (idx === i + 1 ? null : idx)) : undefined}
              onDrop={isEdit ? handleDrop(i + 1) : undefined}
              isDropTarget={dropTargetIndex === i + 1}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
