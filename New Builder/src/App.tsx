import { useBuilderStore } from './store/useBuilderStore';
import { TopBar } from './components/TopBar';
import { PageTabs } from './components/PageTabs';
import { ComponentsPanel } from './components/ComponentsPanel';
import { StylePanel } from './components/StylePanel';
import { BuilderCanvas } from './components/BuilderCanvas';
import { PreviewFrame } from './components/PreviewFrame';
import { PublishPanel } from './components/PublishPanel';

function App() {
  const mode = useBuilderStore((s) => s.mode);

  const isEdit = mode === 'edit';
  const isPreview = mode === 'preview';
  const isPublish = mode === 'publish';

  return (
    <div className="h-screen flex flex-col bg-stone-100">
      <TopBar />

      <div className="flex-1 flex min-h-0">
        {isEdit && <ComponentsPanel />}

        {isPreview && (
          <div className="flex-1 min-w-0 overflow-auto bg-white">
            <PreviewFrame />
          </div>
        )}

        {isEdit && (
          <div className="flex-1 min-w-0 flex flex-col">
            <PageTabs />
            <BuilderCanvas />
          </div>
        )}

        {isPublish && (
          <div className="flex-1 min-w-0 overflow-auto bg-white">
            <PublishPanel />
          </div>
        )}

        {isEdit && <StylePanel />}
      </div>
    </div>
  );
}

export default App;
