import { useBuilderStore } from '../store/useBuilderStore';
import { COMPONENT_DEFINITIONS } from '../data/components';
import { ThemeChanger } from './ThemeChanger';

function PropEditor({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
  type?: 'text' | 'number' | 'checkbox';
}) {
  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-stone-300"
        />
        <span className="text-sm text-stone-600">{label}</span>
      </label>
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
      <input
        type={type}
        value={String(value ?? '')}
        onChange={(e) =>
          onChange(type === 'number' ? Number(e.target.value) : e.target.value)
        }
        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

export function StylePanel() {
  const {
    selectedBlockId,
    pages,
    currentPageId,
    updateBlock,
    removeBlock,
    moveBlock,
    setGridColumns,
    gridColumns,
  } = useBuilderStore();

  const blocks = pages.find((p) => p.id === currentPageId)?.blocks ?? [];
  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId)
    : null;
  const selectedIndex = selectedBlock ? blocks.findIndex((b) => b.id === selectedBlockId) : -1;
  const canMoveUp = selectedIndex > 0;
  const canMoveDown = selectedIndex >= 0 && selectedIndex < blocks.length - 1;

  const def = selectedBlock
    ? COMPONENT_DEFINITIONS.find((d) => d.kind === selectedBlock.kind)
    : null;

  const updateProp = (key: string, value: string | number | boolean) => {
    if (!selectedBlockId) return;
    updateBlock(selectedBlockId, { [key]: value });
  };

  return (
    <aside className="w-80 shrink-0 border-l border-stone-200 bg-white flex flex-col overflow-hidden">
      {/* Theme Changer */}
      <ThemeChanger />

      {/* Layout / Grid */}
      <section className="p-3 border-b border-stone-200">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-2">
          Layout
        </h2>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Grid columns
          </label>
          <select
            value={gridColumns}
            onChange={(e) => setGridColumns(Number(e.target.value))}
            className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
          >
            {[8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n} columns
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Selected block props */}
      {selectedBlock && def && (
        <section className="p-3 border-b border-stone-200 flex-1 overflow-auto">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-2">
            {def.label} — Properties
          </h2>
          <div className="space-y-3">
            {/* Header: nav links with page/external and header style */}
            {selectedBlock.kind === 'header' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Header style</label>
                  <select
                    value={String(selectedBlock.props.headerVariant ?? 'default')}
                    onChange={(e) => updateProp('headerVariant', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                  >
                    <option value="default">Default</option>
                    <option value="centered">Centered</option>
                    <option value="minimal">Minimal</option>
                    <option value="dark">Dark bar</option>
                    <option value="transparent">Transparent</option>
                    <option value="bordered">Bordered</option>
                    <option value="mega">Mega (large)</option>
                    <option value="compact">Compact</option>
                    <option value="floating">Floating</option>
                    <option value="split">Split layout</option>
                  </select>
                </div>
                {([1, 2, 3] as const).map((n) => {
                  const linkType = String(selectedBlock.props[`navLink${n}LinkType`] ?? 'page');
                  const pageVal = String(selectedBlock.props[`navLink${n}Page`] ?? '');
                  const urlVal = String(selectedBlock.props[`navLink${n}Url`] ?? '');
                  const textVal = String(selectedBlock.props[`navLink${n}Text`] ?? (n === 1 ? 'About' : n === 2 ? 'Events' : 'Contact'));
                  return (
                    <div key={`nav${n}`} className="rounded-lg border border-stone-200 p-2 space-y-2">
                      <label className="block text-xs font-medium text-stone-600">Nav link {n}</label>
                      <PropEditor label="Label" value={textVal} onChange={(v) => updateProp(`navLink${n}Text`, v)} />
                      <div>
                        <label className="block text-xs text-stone-500 mb-0.5">Link to</label>
                        <select
                          value={linkType}
                          onChange={(e) => updateProp(`navLink${n}LinkType`, e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                        >
                          <option value="page">Page (in this site)</option>
                          <option value="external">External URL</option>
                        </select>
                      </div>
                      {linkType === 'page' ? (
                        <div>
                          <label className="block text-xs text-stone-500 mb-0.5">Page</label>
                          <select
                            value={pageVal}
                            onChange={(e) => updateProp(`navLink${n}Page`, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                          >
                            <option value="">Select page</option>
                            {pages.map((p) => (
                              <option key={p.id} value={p.slug}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-stone-500 mb-0.5">URL</label>
                          <input
                            type="url"
                            value={urlVal}
                            onChange={(e) => updateProp(`navLink${n}Url`, e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            {Object.keys(def.defaultProps).map((key) => {
              const val = selectedBlock.props[key] ?? def.defaultProps[key];
              const isHeaderNavKey = selectedBlock.kind === 'header' && [
                'navLink1LinkType', 'navLink1Page', 'navLink1Url', 'navLink2LinkType', 'navLink2Page', 'navLink2Url',
                'navLink3LinkType', 'navLink3Page', 'navLink3Url', 'headerVariant',
                'navLink1Text', 'navLink2Text', 'navLink3Text',
              ].includes(key);
              if (isHeaderNavKey) return null;
              if (key === 'imagePosition') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">
                      Image position
                    </label>
                    <select
                      value={String(val ?? 'left')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                );
              }
              if (key === 'aspectRatio') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">
                      Aspect ratio
                    </label>
                    <select
                      value={String(val ?? '16/9')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="16/9">16∶9</option>
                      <option value="4/3">4∶3</option>
                      <option value="1/1">1∶1</option>
                      <option value="3/4">3∶4</option>
                      <option value="2/3">2∶3</option>
                    </select>
                  </div>
                );
              }
              if (key === 'heroVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">
                      Hero style
                    </label>
                    <select
                      value={String(val ?? 'center')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="center">Center (full width)</option>
                      <option value="centerBadge">Center with badge (Figures style)</option>
                      <option value="left">Left-aligned</option>
                      <option value="split">Split (text left, image right)</option>
                    </select>
                  </div>
                );
              }
              if (key === 'sectionVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">
                      Section style
                    </label>
                    <select
                      value={String(val ?? 'default')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="default">Default (bordered)</option>
                      <option value="card">Card (shadow)</option>
                      <option value="elevated">Elevated (strong shadow)</option>
                      <option value="bordered">Bordered (accent border)</option>
                      <option value="gradient">Gradient</option>
                      <option value="quote">Quote style</option>
                      <option value="stats">Stats style</option>
                      <option value="minimal">Minimal</option>
                      <option value="highlight">Highlight</option>
                      <option value="icon">With icon</option>
                      <option value="full">Full width</option>
                      <option value="alternate">Alternate</option>
                    </select>
                  </div>
                );
              }
              if (key === 'headerVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Header style</label>
                    <select
                      value={String(val ?? 'default')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="default">Default</option>
                      <option value="centered">Centered</option>
                      <option value="minimal">Minimal</option>
                      <option value="dark">Dark bar</option>
                      <option value="transparent">Transparent</option>
                      <option value="bordered">Bordered</option>
                      <option value="mega">Mega (large)</option>
                      <option value="compact">Compact</option>
                      <option value="floating">Floating</option>
                      <option value="split">Split layout</option>
                    </select>
                  </div>
                );
              }
              if (key === 'ctaVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">CTA style</label>
                    <select
                      value={String(val ?? 'default')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="default">Default (primary)</option>
                      <option value="outline">Outline</option>
                      <option value="minimal">Minimal</option>
                      <option value="gradient">Gradient</option>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="bordered">Bordered</option>
                      <option value="split">Split</option>
                      <option value="compact">Compact</option>
                      <option value="floating">Floating</option>
                      <option value="impact">Impact</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                );
              }
              if (key === 'donateVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Donate style</label>
                    <select
                      value={String(val ?? 'default')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="default">Default</option>
                      <option value="minimal">Minimal</option>
                      <option value="outline">Outline</option>
                      <option value="card">Card</option>
                      <option value="gradient">Gradient</option>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="split">Split</option>
                      <option value="compact">Compact</option>
                      <option value="impact">Impact</option>
                      <option value="urgent">Urgent</option>
                      <option value="trust">Trust</option>
                    </select>
                  </div>
                );
              }
              if (key === 'mediaVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Image + Text style</label>
                    <select
                      value={String(val ?? 'default')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="default">Default</option>
                      <option value="card">Card</option>
                      <option value="bordered">Bordered</option>
                      <option value="overlay">Overlay text</option>
                      <option value="large">Large image</option>
                      <option value="stacked">Stacked</option>
                      <option value="minimal">Minimal</option>
                      <option value="floating">Floating image</option>
                      <option value="split">Split</option>
                      <option value="alternate">Alternate</option>
                    </select>
                  </div>
                );
              }
              if (key === 'contactFormVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Contact form style</label>
                    <select value={String(val ?? 'default')} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded">
                      {['default', 'simple', 'minimal', 'card', 'bordered', 'dark', 'inline', 'compact', 'centered', 'floating', 'split', 'fullWidth'].map((v) => (
                        <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (key === 'eventsVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Events style</label>
                    <select value={String(val ?? 'default')} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded">
                      {['default', 'cards', 'list', 'minimal', 'timeline', 'bordered', 'compact', 'alternate', 'grid', 'featured', 'dark', 'centered'].map((v) => (
                        <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (key === 'testimonialVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Testimonial style</label>
                    <select value={String(val ?? 'default')} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded">
                      {['default', 'card', 'minimal', 'quote', 'bordered', 'centered', 'large', 'floating', 'dark', 'accent', 'compact', 'split'].map((v) => (
                        <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (key === 'footerVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Footer style</label>
                    <select value={String(val ?? 'default')} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded">
                      {['default', 'minimal', 'centered', 'dark', 'bordered', 'split', 'compact', 'links', 'floating', 'accent', 'fullWidth', 'simple'].map((v) => (
                        <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (key === 'textVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Text style</label>
                    <select value={String(val ?? 'default')} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded">
                      {['default', 'lead', 'small', 'muted', 'bordered', 'card', 'highlight', 'minimal', 'centered', 'large', 'quote', 'caption'].map((v) => (
                        <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (key === 'imageVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Image style</label>
                    <select value={String(val ?? 'default')} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded">
                      {['default', 'rounded', 'circle', 'bordered', 'shadow', 'minimal', 'card', 'fullBleed', 'float', 'polaroid', 'overlay', 'frame'].map((v) => (
                        <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (key === 'columnsVariant') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Columns style</label>
                    <select value={String(val ?? 'default')} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded">
                      {['default', 'bordered', 'cards', 'minimal', 'elevated', 'compact', 'split', 'dark', 'accent', 'grid', 'featured', 'simple'].map((v) => (
                        <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (key === 'buttonLinkType') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Button link type</label>
                    <select
                      value={String(val ?? 'none')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="none">No link</option>
                      <option value="page">Page (internal)</option>
                      <option value="external">External URL</option>
                    </select>
                  </div>
                );
              }
              if (key === 'buttonLinkValue') {
                const linkType = String(selectedBlock.props.buttonLinkType ?? 'none');
                if (linkType === 'none') return null;
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Button link</label>
                    {linkType === 'page' ? (
                      <select
                        value={String(val ?? '')}
                        onChange={(e) => updateProp(key, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                      >
                        <option value="">Select page</option>
                        {pages.map((p) => (
                          <option key={p.id} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="url"
                        value={String(val ?? '')}
                        onChange={(e) => updateProp(key, e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                      />
                    )}
                  </div>
                );
              }
              if (key === 'button2LinkType') {
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Second button link type</label>
                    <select
                      value={String(val ?? 'none')}
                      onChange={(e) => updateProp(key, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                    >
                      <option value="none">No link</option>
                      <option value="page">Page (internal)</option>
                      <option value="external">External URL</option>
                    </select>
                  </div>
                );
              }
              if (key === 'button2LinkValue') {
                const linkType = String(selectedBlock.props.button2LinkType ?? 'none');
                if (linkType === 'none') return null;
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Second button link</label>
                    {linkType === 'page' ? (
                      <select
                        value={String(val ?? '')}
                        onChange={(e) => updateProp(key, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                      >
                        <option value="">Select page</option>
                        {pages.map((p) => (
                          <option key={p.id} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="url"
                        value={String(val ?? '')}
                        onChange={(e) => updateProp(key, e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                      />
                    )}
                  </div>
                );
              }
              const t =
                typeof def.defaultProps[key] === 'boolean'
                  ? 'checkbox'
                  : typeof def.defaultProps[key] === 'number'
                    ? 'number'
                    : 'text';
              return (
                <PropEditor
                  key={key}
                  label={key}
                  value={val as string | number | boolean}
                  type={t}
                  onChange={(v) => updateProp(key, v)}
                />
              );
            })}
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Column span (1–12)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={selectedBlock.gridSpan ?? 12}
                onChange={(e) => {
                  const v = Math.min(12, Math.max(1, Number(e.target.value) || 1));
                  if (selectedBlockId) updateBlock(selectedBlockId, { gridSpan: v });
                }}
                className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => moveBlock(selectedBlockId!, 'up')}
              disabled={!canMoveUp}
              className="px-2 py-1 text-xs font-medium rounded border border-stone-300 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              Move up
            </button>
            <button
              type="button"
              onClick={() => moveBlock(selectedBlockId!, 'down')}
              disabled={!canMoveDown}
              className="px-2 py-1 text-xs font-medium rounded border border-stone-300 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              Move down
            </button>
            <button
              type="button"
              onClick={() => removeBlock(selectedBlockId!)}
              className="px-2 py-1 text-xs font-medium rounded border border-red-300 text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </section>
      )}

      {!selectedBlock && (
        <div className="p-4 text-sm text-stone-500">
          Select a component on the canvas to edit its properties.
        </div>
      )}
    </aside>
  );
}
