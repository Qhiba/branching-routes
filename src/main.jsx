import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import 'styles/global.css'
import App from './App.jsx'
import { ErrorBoundary } from 'components'
import { loadFromIndexedDB, saveToIndexedDB, migrateGraph } from 'utils'
import { useNarrativeStore, useSimulationStore, useCampaignStore, initHistory } from 'store'

async function initPersistence() {
  // PROTECTED: existing loadFromIndexedDB handles both missing DB and existing data unchanged
  const raw = await loadFromIndexedDB();
  if (raw) {
    // FIX (Redesign Step 2): the autosave goes through the same migration + sanitization as file import
    // (previously it bypassed it). If the autosave is unreadable, fall back to the raw object as before.
    let data = raw;
    try {
      data = migrateGraph(raw);
    } catch (err) {
      console.error('[initPersistence] Autosave migration failed; loading raw autosave.', err);
    }
    useNarrativeStore.getState().loadGraph(data);
    useSimulationStore.getState().exitCampaign();
  }

  // ADDED (Redesign Step 5): undo / redo history starts after the autosave is restored (AR-17)
  initHistory();

  await useCampaignStore.getState().loadCampaignsFromIndexedDB();

  let timeoutId;
  useNarrativeStore.subscribe((state) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveToIndexedDB(state.exportGraph());
    }, 1000);
  });

  let campaignTimeoutId;
  useCampaignStore.subscribe((state) => {
    clearTimeout(campaignTimeoutId);
    campaignTimeoutId = setTimeout(() => {
      state.saveCampaignsToIndexedDB();
    }, 1000);
  });
}

// ADDED (Redesign Step 3): dev-only design-system reference sheet at /#design (no persistence wiring).
// The import.meta.env.DEV branch is removed from production builds.
if (import.meta.env.DEV && window.location.hash === '#design') {
  import('./components/dev/DesignSystemPreview.jsx').then((mod) => {
    createRoot(document.getElementById('root')).render(createElement(mod.default));
  });
} else {
  initPersistence().then(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    )
  })
}
