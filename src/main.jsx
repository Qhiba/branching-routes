import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'styles/global.css'
import App from './App.jsx'
import { loadFromIndexedDB, saveToIndexedDB } from 'utils'
import { useNarrativeStore, useSimulationStore, useCampaignStore } from 'store'

async function initPersistence() {
  // PROTECTED: existing loadFromIndexedDB handles both missing DB and existing data unchanged
  const data = await loadFromIndexedDB();
  if (data) {
    useNarrativeStore.getState().loadGraph(data);
    useSimulationStore.getState().exitCampaign();
  }

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

initPersistence().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
