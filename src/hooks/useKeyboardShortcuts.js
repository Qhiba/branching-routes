import { useEffect } from 'react';
import { useSimulationStore, useUIStore, useNarrativeStore, useToastStore } from 'store';

// ADDED: Phase 1 stub hook for keyboard shortcuts
// MODIFIED: Phase 2 dispatch mappings implemented
export default function useKeyboardShortcuts() {
  const { isCampaignActive } = useSimulationStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // ADDED: Phase 2 — Ctrl+K palette toggle (before input guard; fires even when palette input focused)
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault(); // Firefox: suppress default browser search-bar focus
        window.dispatchEvent(new Event('palette-toggle'));
        return;
      }

      // Guard: do not trigger if an input field is focused
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Ctrl+C / Ctrl+V node copy-paste (Phase 8 Change #4)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (!isCampaignActive) {
          const uiState = useUIStore.getState();
          const selectedId = uiState.selectedNodeId || (uiState.selectedNodeIds.length > 0 ? uiState.selectedNodeIds[0] : null);
          if (selectedId) {
            e.preventDefault();
            const state = useNarrativeStore.getState();
            const node = state.common[selectedId] || state.choice[selectedId] || state.ending[selectedId];
            if (node) {
              uiState.setCopiedNode(node);
              useToastStore.getState().addToast(`Copied node: ${node.data?.label || 'Node'}`, 'success');
            }
          }
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (!isCampaignActive) {
          const uiState = useUIStore.getState();
          if (uiState.copiedNode) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('canvas-paste-node', { detail: {} }));
          }
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        if (!isCampaignActive) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'warp_exit' } }));
        }
        return;
      }

      // PROTECTED: ESC clears selection (legacy behavior preserved)
      if (e.key === 'Escape') {
        useUIStore.getState().clearSelection();
        return;
      }

      // Guard: do not trigger single-key shortcuts if Ctrl, Meta, or Alt is held
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      
      // View shortcuts (can be used in campaign mode too, unless specified otherwise)
      // Actually phase 2 specifies "All authoring shortcuts are guarded ... during campaign mode." -> meaning View shortcuts are NOT guarded?
      // "View / state shortcuts" includes V, L, R. "Escape" is also there.
      // I will put view shortcuts BEFORE the campaign guard, except if they modify authoring... wait, `V`, `L`, `R` don't modify authoring. So they can precede the guard or not. Let's look at the plan: "All authoring shortcuts are guarded: do not fire when isCampaignActive === true."

      if (e.key.toLowerCase() === 'v') {
        useUIStore.getState().toggleSnapToGrid();
        return;
      }

      if (e.key.toLowerCase() === 'l') {
        window.dispatchEvent(new Event('graph-layout-tidy'));
        return;
      }

      if (e.key.toLowerCase() === 'r') {
        useUIStore.getState().toggleLabelDisplayMode();
        return;
      }

      // ADDED: Phase 3 — G: cycle cluster visualization mode (view-only, allowed during campaign)
      if (e.key.toLowerCase() === 'g') {
        useUIStore.getState().cycleClusterMode();
        return;
      }

      // Guard: Authoring shortcuts disabled in campaign mode
      if (isCampaignActive) return;

      const key = e.key.toLowerCase();

      if (key === 'n') {
        window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'common' } }));
        return;
      }
      if (key === 'c') {
        window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'choice' } }));
        return;
      }
      if (key === 'e') {
        window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'ending' } }));
        return;
      }
      if (key === 'w') {
        window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'warp_entrance' } }));
        return;
      }
      
      if (key === 'f') {
        window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'flag' } }));
        return;
      }
      if (key === 's') {
        window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'status' } }));
        return;
      }
      if (key === 'p') {
        window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'path' } }));
        return;
      }
      if (key === 'h') {
        window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'chapter' } }));
        return;
      }

      // M — Toggle seen mark on selected node(s)
      if (key === 'm') {
        const uiState = useUIStore.getState();
        const toggleNodeSeen = useNarrativeStore.getState().toggleNodeSeen;

        if (uiState.selectedNodeIds.length > 0) {
          uiState.selectedNodeIds.forEach(id => toggleNodeSeen(id));
        } else if (uiState.selectedNodeId) {
          toggleNodeSeen(uiState.selectedNodeId);
        }
        return;
      }
      
      if (e.key === 'Delete') {
        const uiState = useUIStore.getState();
        const navState = useNarrativeStore.getState();
        
        // FIX 2.b: Prioritize multi-select batch deletion over single-node deletion
        if (uiState.selectedNodeIds.length > 1) {
          uiState.selectedNodeIds.forEach(id => navState.deleteNode(id));
        } else if (uiState.selectedNodeId) {
          navState.deleteNode(uiState.selectedNodeId);
        } else if (uiState.selectedEdgeId) {
          navState.deleteEdge(uiState.selectedEdgeId);
        } else if (uiState.selectedNodeIds.length === 1) {
          navState.deleteNode(uiState.selectedNodeIds[0]);
        }
        uiState.clearSelection();
        return;
      }
    };

    const handleAltKeyDown = (e) => {
      if (e.key === 'Alt') document.body.classList.add('alt-pressed');
    };
    const handleAltKeyUp = (e) => {
      if (e.key === 'Alt') document.body.classList.remove('alt-pressed');
    };
    const handleAltBlur = () => document.body.classList.remove('alt-pressed');

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleAltKeyDown);
    window.addEventListener('keyup', handleAltKeyUp);
    window.addEventListener('blur', handleAltBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleAltKeyDown);
      window.removeEventListener('keyup', handleAltKeyUp);
      window.removeEventListener('blur', handleAltBlur);
      document.body.classList.remove('alt-pressed');
    };
  }, [isCampaignActive]);
}
