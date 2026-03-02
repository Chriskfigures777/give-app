import { useBuilderStore } from '../store/useBuilderStore';
import { useState } from 'react';
import { buildExportHtml } from '../utils/exportHtml';

export function PublishPanel() {
  const { pages, currentPageId, theme, gridColumns } = useBuilderStore();
  const blocks = pages.find((p) => p.id === currentPageId)?.blocks ?? [];
  const [exported, setExported] = useState(false);

  const handleExportStatic = () => {
    // Build real HTML matching the Preview: same layout, theme, and block content
    const html = buildExportHtml(blocks, theme, gridColumns);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-stone-800">Host your website</h2>
      <p className="text-stone-600 text-sm">
        Export your design as HTML, then upload to any static host (Netlify, Vercel,
        GitHub Pages, or your church/nonprofit hosting).
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExportStatic}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          {exported ? 'Downloaded! Export again' : 'Download HTML'}
        </button>
      </div>
      <div className="border border-stone-200 rounded-lg p-4 bg-stone-50 text-sm text-stone-600">
        <strong>Tip:</strong> Use <strong>Preview</strong> mode to see the full design, then use your browser’s
        “Print → Save as PDF” to capture the page, or connect this app to a static site generator for a full export.
      </div>
    </div>
  );
}
