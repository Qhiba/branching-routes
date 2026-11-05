import { useEffect } from 'react';
import { useSimulationStore, useUIStore, useNarrativeStore, useToastStore, undo, redo, beginGroup, endGroup } from 'store';

// ADDED (Redesign Step 5): helpers shared by several shortcuts
function selectedIds() {
  const ui = useUIStore.getState();
  if (ui.selectedNodeIds.length) return ui.selectedNodeIds;
  return ui.selectedNodeId ? [ui.selectedNodeId] : [];
}

function findNode(state, id) {
  return state.common[id] || state.choice[id] || state.ending[id] || null;
}

const view = (action) => window.dispatchEvent(new CustomEvent('canvas-view', { detail: { action } }));

/** Ctrl+D — duplicate the selected node(s) 48px down-right, as one undo step. */
export function duplicateSelection() {
  const ids = selectedIds();
  if (!ids.length) return;
  const state = useNarrativeStore.getState();
  beginGroup();
  const copies = [];
  ids.forEach(id => {
    const node = findNode(state, id);
    if (node) copies.push(state.pasteNode(node, { x: node.position.x + 48, y: node.position.y + 48 }));
  });
  endGroup();
  // Select the copies so the next nudge / drag / delete acts on them
  const newIds = copies.filter(Boolean);
  if (newIds.length) window.dispatchEvent(new CustomEvent('canvas-select-nodes', { detail: { ids: newIds } }));
}

/** Arrow keys — move the selected node(s). One grid cell (16px) with snap-to-grid, 4px without; Shift = ×5. */
export function nudgeSelection(dx, dy, big) {
  const ids = selectedIds();
  if (!ids.length) return false;
  const ui = useUIStore.getState();
  const step = (ui.snapToGrid ? 16 : 4) * (big ? 5 : 1);
  const state = useNarrativeStore.getState();
  ids.forEach(id => {
    const node = findNode(state, id);
    if (node) state.updateNode(id, { position: { x: node.position.x + dx * step, y: node.position.y + dy * step } });
  });
  return true;
}

// ADDED: Phase 1 stub hook for keyboard shortcuts
// MODIFIED: Phase 2 dispatch mappings implemented
export default function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCampaignActive = useSimulationStore.getState().isCampaignActive;

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

      // ADDED (Redesign Step 5): undo / redo, select all, duplicate, zoom
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); if (!isCampaignActive) undo(); return; }
        if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); if (!isCampaignActive) redo(); return; }
        if (k === 'a') { e.preventDefault(); if (!isCampaignActive) window.dispatchEvent(new CustomEvent('canvas-select-nodes', { detail: { ids: null } })); return; }
        if (k === 'd') { e.preventDefault(); if (!isCampaignActive) duplicateSelection(); return; }
        if (k === '=' || k === '+') { e.preventDefault(); view('zoom-in'); return; }
        if (k === '-' || k === '_') { e.preventDefault(); view('zoom-out'); return; }
        if (k === '0') { e.preventDefault(); view('zoom-reset'); return; }
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

      // ADDED (Redesign Step 5): fit shortcuts and the shortcut sheet (view-only, allowed in campaign mode)
      if (e.shiftKey && e.code === 'Digit1') { e.preventDefault(); view('fit'); return; }
      if (e.shiftKey && e.code === 'Digit2') { e.preventDefault(); view('fit-selection'); return; }
      if (e.key === '?') { e.preventDefault(); useUIStore.getState().setShowShortcuts(true); return; }

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

      // ADDED: Snap Assist toggle (view-level shortcut, available outside campaign mode too)
      if (e.key.toLowerCase() === 'a') {
        useUIStore.getState().toggleSnapAssist();
        return;
      }


      // REMOVED (Step 3): G keybind for cycleClusterMode - retired in favor of canvas filters

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
        // ADDED (Redesign Step 1): Seen marks belong to the Campaign feature — inert when it is off
        if (!useUIStore.getState().featureCampaign) return;
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
          beginGroup(); // ADDED (Redesign Step 5): deleting several nodes is one undo step
          uiState.selectedNodeIds.forEach(id => navState.deleteNode(id));
          endGroup();
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

    // ADDED: Snap Assist — Ctrl body class for guide line visibility (AR-30)
    const handleCtrlKeyDown = (e) => {
      if (e.key === 'Control') document.body.classList.add('ctrl-pressed');
    };
    const handleCtrlKeyUp = (e) => {
      if (e.key === 'Control') document.body.classList.remove('ctrl-pressed');
    };

    // ADDED: Snap Assist — Shift body class for axis-lock detection (AR-30)
    const handleShiftKeyDown = (e) => {
      if (e.key === 'Shift') document.body.classList.add('shift-pressed');
    };
    const handleShiftKeyUp = (e) => {
      if (e.key === 'Shift') document.body.classList.remove('shift-pressed');
    };

    // Clear all modifier classes on window blur (prevents stuck modifiers)
    const handleBlur = () => {
      document.body.classList.remove('alt-pressed', 'ctrl-pressed', 'shift-pressed');
    };

    // ADDED (Redesign Step 5): arrow-key nudge (capture phase; see nudgeSelection)
    const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const handleArrowKeys = (e) => {
      const dir = ARROWS[e.key];
      if (!dir || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
      if (t.closest?.('[role="dialog"], [role="alertdialog"], [role="menu"], .context-menu')) return;
      if (useSimulationStore.getState().isCampaignActive) return;
      if (nudgeSelection(dir[0], dir[1], e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleArrowKeys, true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleAltKeyDown);
    window.addEventListener('keyup', handleAltKeyUp);
    window.addEventListener('keydown', handleCtrlKeyDown);
    window.addEventListener('keyup', handleCtrlKeyUp);
    window.addEventListener('keydown', handleShiftKeyDown);
    window.addEventListener('keyup', handleShiftKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleArrowKeys, true);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleAltKeyDown);
      window.removeEventListener('keyup', handleAltKeyUp);
      window.removeEventListener('keydown', handleCtrlKeyDown);
      window.removeEventListener('keyup', handleCtrlKeyUp);
      window.removeEventListener('keydown', handleShiftKeyDown);
      window.removeEventListener('keyup', handleShiftKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.body.classList.remove('alt-pressed', 'ctrl-pressed', 'shift-pressed');
    };
  }, []);
}
