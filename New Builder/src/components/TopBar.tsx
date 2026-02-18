import { useState, useRef, useEffect } from 'react';
import { useBuilderStore } from '../store/useBuilderStore';
import type { BuilderMode } from '../types';

export function TopBar() {
  const { mode, setMode, templates, applyTemplate } = useBuilderStore();
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modes: { id: BuilderMode; label: string }[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'preview', label: 'Preview' },
    { id: 'publish', label: 'Publish' },
  ];

  return (
    <header className="h-12 shrink-0 border-b border-stone-200 bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-stone-800">Site Builder</span>
        <span className="text-stone-400 text-sm hidden sm:inline">Churches · Nonprofits · Institutions</span>
        {mode === 'edit' && (
          <div className="relative" ref={templateRef}>
            <button
              type="button"
              onClick={() => setTemplateOpen((o) => !o)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            >
              Start from template ({templates.length})
            </button>
            {templateOpen && (
              <div className="absolute left-0 top-full mt-1 w-72 max-h-[70vh] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl z-50 py-1">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      applyTemplate(t.id);
                      setTemplateOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition"
                  >
                    <span className="font-medium text-stone-800">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-stone-200 overflow-hidden">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-4 py-2 text-sm font-medium transition ${
                mode === m.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === 'publish' && (
          <a
            href="#export"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Export / Host
          </a>
        )}
      </div>
    </header>
  );
}
