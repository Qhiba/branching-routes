import { useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphCanvas from '@/components/graph/GraphCanvas.jsx';
import ContextMenu from '@/components/ui/ContextMenu.jsx';
import InspectorPanel from '@/components/inspector/InspectorPanel.jsx';
import CampaignSelector from '@/components/campaign/CampaignSelector.jsx';
import { useSimulationSync } from '@/hooks/useSimulationSync.js';
import { loadProject, initAutoSave } from '@/services/persistence.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useCampaignStore } from '@/store/useCampaignStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';

/**
 * App — Root component for Branching Routes V2.
 *
 * Phase 6: Renders the full-viewport graph canvas as the primary
 * application surface. The ReactFlowProvider is required by
 * @xyflow/react for internal context (zoom, pan, viewport state).
 *
 * Phase 8: Added ContextMenu component for right-click menus.
 *
 * Phase 9: Added InspectorPanel — draggable floating editor panel
 * for editing selected entities.
 *
 * Phase 10: Wired useSimulationSync — always-running simulation
 * engine that recalculates edge validity, node reachability, and
 * auto-lock suggestions on every state change.
 *
 * Phase 11: Added CampaignSelector — floating campaign management
 * panel. Wired persistence layer (loadProject + initAutoSave) so
 * narrative data + campaigns auto-persist to IndexedDB.
 *
 * Future phases will add:
 *   - Phase 13: TopBar, StatusStrip, CommandPalette, ToastContainer
 */
function App() {
  // Phase 10: Wire simulation engine to store subscriptions
  useSimulationSync();

  // Phase 11: Load persisted data on mount + wire auto-save
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    (async () => {
      try {
        const saved = await loadProject();
        if (saved.narrativeData) {
          // Hydrate narrative store with persisted data
          useNarrativeStore.setState(saved.narrativeData);
        }
        if (saved.campaigns) {
          // Hydrate campaign store with persisted campaigns
          useCampaignStore.getState().loadCampaigns(
            saved.campaigns,
            saved.activeCampaignId
          );
          // If an active campaign was restored, push its state into simulation store
          if (saved.activeCampaignId && saved.campaigns[saved.activeCampaignId]) {
            const activeCampaign = saved.campaigns[saved.activeCampaignId];
            useSimulationStore.setState({
              nodeStates: activeCampaign.nodeStates || {},
              flagOverrides: activeCampaign.flagOverrides || {},
              statusOverrides: activeCampaign.statusOverrides || {},
            });
          }
        }
      } catch (_err) {
        // Error already surfaced via AR-08 inside loadProject.
      }

      // Start auto-save subscriptions after initial load
      initAutoSave();
    })();
  }, []);

  return (
    <ReactFlowProvider>
      <GraphCanvas />
      <ContextMenu />
      <InspectorPanel />
      <CampaignSelector />
    </ReactFlowProvider>
  );
}

export default App;
