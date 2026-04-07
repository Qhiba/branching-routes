import { useEffect, useRef, useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphCanvas from '@/components/graph/GraphCanvas.jsx';
import ContextMenu from '@/components/ui/ContextMenu.jsx';
import InspectorPanel from '@/components/inspector/InspectorPanel.jsx';
import CampaignSelector from '@/components/campaign/CampaignSelector.jsx';
import RouteFinderDialog from '@/components/route/RouteFinderDialog.jsx';
import RouteOverlay from '@/components/route/RouteOverlay.jsx';
import RouteDetailPanel from '@/components/route/RouteDetailPanel.jsx';

// Phase 13: Chrome components
import TopBar from '@/components/chrome/TopBar.jsx';
import StatusStrip from '@/components/chrome/StatusStrip.jsx';
import CommandPalette from '@/components/chrome/CommandPalette.jsx';
import ToastContainer from '@/components/ui/ToastContainer.jsx';

import { useSimulationSync } from '@/hooks/useSimulationSync.js';
import { loadProject, initAutoSave } from '@/services/persistence.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useCampaignStore } from '@/store/useCampaignStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { useUIStore } from '@/store/useUIStore.js';

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
 * Phase 12: Added RouteFinderDialog, RouteOverlay, and
 * RouteDetailPanel — route tracing system with visual overlays.
 *
 * Phase 13: Added TopBar, StatusStrip, CommandPalette, and
 * ToastContainer — full UI chrome for navigation, status,
 * command execution, and notifications.
 */
function App() {
  // Phase 10: Wire simulation engine to store subscriptions
  useSimulationSync();

  // Phase 13: Handle orientation from UI store
  const handleOrientation = useUIStore((s) => s.handleOrientation);
  const toggleHandleOrientation = useUIStore((s) => s.toggleHandleOrientation);

  // Phase 12: Route tracing state
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [tracedRoute, setTracedRoute] = useState(null);
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);

  const handleRouteResult = useCallback((result) => {
    setTracedRoute(result);
    setSelectedPathIndex(0);
    // Close dialog after getting results (except for Mode B which has no overlay)
    if (result.mode !== 'mode_b') {
      setRouteDialogOpen(false);
    }
  }, []);

  const handleClearRoute = useCallback(() => {
    setTracedRoute(null);
    setSelectedPathIndex(0);
  }, []);

  // Phase 14: R key conflict resolved — R is now simulation reset
  // (handled in useKeyboardShortcuts.js). Route finder dialog can
  // be opened via the command palette or Ctrl+F shortcut.

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
    <>
      {/* Phase 13: Top bar chrome */}
      <TopBar
        handleOrientation={handleOrientation}
        onToggleHandleOrientation={toggleHandleOrientation}
      />

      {/* Main content area with ReactFlow context */}
      <ReactFlowProvider>
        <GraphCanvas />
        <ContextMenu />
        <InspectorPanel />
        <CampaignSelector />

        {/* Phase 12: Route tracing UI */}
        <RouteFinderDialog
          isOpen={routeDialogOpen}
          onClose={() => setRouteDialogOpen(false)}
          onResult={handleRouteResult}
        />
        {tracedRoute && tracedRoute.paths && (
          <RouteOverlay
            tracedRoute={tracedRoute}
            selectedPathIndex={selectedPathIndex}
            onClear={handleClearRoute}
          />
        )}
        {tracedRoute && tracedRoute.annotatedPaths?.[selectedPathIndex] && (
          <RouteDetailPanel
            annotatedPath={tracedRoute.annotatedPaths[selectedPathIndex]}
            onClose={handleClearRoute}
          />
        )}

        {/* Phase 13: Command palette (needs ReactFlow context for fitView) */}
        <CommandPalette />
      </ReactFlowProvider>

      {/* Phase 13: Toast notifications (outside ReactFlow context) */}
      <ToastContainer />

      {/* Phase 13: Bottom status strip */}
      <StatusStrip />
    </>
  );
}

export default App;

