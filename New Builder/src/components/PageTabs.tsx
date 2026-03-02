import { useBuilderStore } from '../store/useBuilderStore';

export function PageTabs() {
  const { pages, currentPageId, setCurrentPage, addPage, removePage } = useBuilderStore();
  const currentPage = pages.find((p) => p.id === currentPageId);

  return (
    <div className="flex items-center gap-1 border-b border-stone-200 bg-white px-2">
      <div className="flex items-center gap-0.5 overflow-x-auto min-w-0">
        {pages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setCurrentPage(p.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition ${
              p.id === currentPageId
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-800'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addPage()}
        className="shrink-0 p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700"
        title="Add page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {pages.length > 1 && currentPage && (
        <button
          type="button"
          onClick={() => removePage(currentPage.id)}
          className="shrink-0 p-2 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
          title="Remove page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
