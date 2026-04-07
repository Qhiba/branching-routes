// ============================================================
// useKeyboardShortcuts.js — Global keyboard shortcut listener
// ============================================================
// Registers all keyboard shortcuts per spec §3.3 and routes
// them to the appropriate store actions. Shortcuts are suppressed
// when a text input element has focus.
//
// Key export: useKeyboardShortcuts()
//
// Architecture rules enforced:
//   AR-02: all mutations route through Zustand stores
// ============================================================

import { useEffect, useCallback } from 'react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { useReactFlow } from '@xyflow/react';

// ── Input focus guard ────────────────────────────────────────

/**
 * Check if the currently focused element is a text input.
 * When true, keyboard shortcuts should be suppressed so the
 * user can type normally.
 * @returns {boolean}
 */
function isTextInputFocused() {
  const el = document.activeElement;
  if (!el) return false;

  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    // Allow shortcuts for non-text inputs (checkbox, radio, etc.)
    const textTypes = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];
    return textTypes.includes(type);
  }
  if (tag === 'textarea') return true;
  if (el.isContentEditable) return true;

  return false;
}

// ── Viewport cursor position helper ─────────────────────────

/**
 * Get a reasonable position for newly created nodes.
 * Uses the center of the viewport converted to flow coordinates.
 * @param {object} reactFlowInstance — React Flow instance
 * @returns {{ x: number, y: number }}
 */
function getCenterPosition(reactFlowInstance) {
  try {
    // Get the center of the browser viewport
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    // Convert screen coordinates to flow coordinates
    const position = reactFlowInstance.screenToFlowPosition({
      x: centerX,
      y: centerY,
    });
    return {
      x: Math.round(position.x),
      y: Math.round(position.y),
    };
  } catch {
    return { x: 0, y: 0 };
  }
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Register all global keyboard shortcuts.
 * Must be called inside a ReactFlowProvider context.
 *
 * Shortcuts from spec §3.3:
 *   N         — Create new Common Node at viewport center
 *   C         — Create new Choice at viewport center
 *   E         — Create new Ending at viewport center
 *   F         — Create new Flag
 *   S         — Create new Status Point
 *   Del/Bksp  — Delete selected elements
 *   Space     — Cycle node state for selected node
 *   V         — Cycle seen state for selected node
 *   I         — Toggle inspector panel for selected node
 *   Ctrl+K    — Open command palette
 *   Escape    — Deselect / Close panel / Close context menu
 *   R         — Reset simulation state
 *   L         — Auto-layout graph (for later phases)
 *   Ctrl+F    — Open route finder dialog (for later phases)
 */
export function useKeyboardShortcuts() {
  const reactFlowInstance = useReactFlow();

  const handleKeyDown = useCallback(
    (event) => {
      const key = event.key;
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      // ── Escape — always active (close panels, deselect) ────
      if (key === 'Escape') {
        event.preventDefault();
        const ui = useUIStore.getState();

        // Priority: context menu → command palette → inspector → deselect
        if (ui.contextMenu) {
          ui.hideContextMenu();
        } else if (ui.commandPaletteOpen) {
          ui.toggleCommandPalette(false);
        } else if (ui.inspectorOpen) {
          ui.closeInspector();
        } else if (ui.selectedNodeId) {
          ui.selectNode(null);
        }
        return;
      }

      // ── Ctrl+K — Open command palette ──────────────────────
      if (isCtrl && key.toLowerCase() === 'k') {
        event.preventDefault();
        useUIStore.getState().toggleCommandPalette();
        return;
      }

      // ── Ctrl+F — Open route finder dialog (for later phases)
      if (isCtrl && key.toLowerCase() === 'f') {
        event.preventDefault();
        // AMBIGUOUS: Route finder dialog not yet implemented (Phase 12).
        // Showing a toast as placeholder feedback.
        useUIStore.getState().addToast('Route finder not yet available', 'info');
        return;
      }

      // ── Suppress all remaining shortcuts when text input focused ──
      if (isTextInputFocused()) return;

      // ── Ctrl combos (processed before single-key shortcuts) ──
      if (isCtrl) return; // Don't intercept other Ctrl shortcuts

      // ── Delete / Backspace — Delete selected elements ──────
      if (key === 'Delete' || key === 'Backspace') {
        const selectedNodeId = useUIStore.getState().selectedNodeId;
        if (!selectedNodeId) return;

        event.preventDefault();
        const narrative = useNarrativeStore.getState();

        // Determine entity type and delete
        if (narrative.common[selectedNodeId]) {
          narrative.deleteCommonNode(selectedNodeId);
        } else if (narrative.choice[selectedNodeId]) {
          narrative.deleteChoice(selectedNodeId);
        } else if (narrative.ending[selectedNodeId]) {
          narrative.deleteEnding(selectedNodeId);
        }

        useUIStore.getState().selectNode(null);
        useUIStore.getState().addToast('Element deleted', 'info', 3000);
        return;
      }

      // ── N — Create new Common Node ─────────────────────────
      if (key.toLowerCase() === 'n' && !isShift) {
        event.preventDefault();
        const pos = getCenterPosition(reactFlowInstance);
        const nodeId = useNarrativeStore.getState().addCommonNode({ _position: pos });
        useUIStore.getState().selectNode(nodeId);
        useUIStore.getState().addToast('Common Node created', 'success', 3000);
        return;
      }

      // ── C — Create new Choice ──────────────────────────────
      // Note: 'c' without Ctrl — Ctrl+C is copy (handled by browser)
      if (key.toLowerCase() === 'c' && !isShift) {
        event.preventDefault();
        const pos = getCenterPosition(reactFlowInstance);
        const choiceId = useNarrativeStore.getState().addChoice({ _position: pos });
        useUIStore.getState().selectNode(choiceId);
        useUIStore.getState().addToast('Choice created', 'success', 3000);
        return;
      }

      // ── E — Create new Ending ──────────────────────────────
      if (key.toLowerCase() === 'e' && !isShift) {
        event.preventDefault();
        const pos = getCenterPosition(reactFlowInstance);
        const endingId = useNarrativeStore.getState().addEnding({ _position: pos });
        useUIStore.getState().selectNode(endingId);
        useUIStore.getState().addToast('Ending created', 'success', 3000);
        return;
      }

      // ── F — Create new Flag ────────────────────────────────
      if (key.toLowerCase() === 'f' && !isShift) {
        event.preventDefault();
        const flagId = useNarrativeStore.getState().addFlag();
        useUIStore.getState().addToast(`Flag created: ${flagId}`, 'success', 3000);
        return;
      }

      // ── S — Create new Status Point ────────────────────────
      if (key.toLowerCase() === 's' && !isShift) {
        event.preventDefault();
        const statusId = useNarrativeStore.getState().addStatusPoint();
        useUIStore.getState().addToast(`Status Point created: ${statusId}`, 'success', 3000);
        return;
      }

      // ── Space — Cycle node simulation state ────────────────
      if (key === ' ') {
        const selectedNodeId = useUIStore.getState().selectedNodeId;
        if (!selectedNodeId) return;
        event.preventDefault();
        useSimulationStore.getState().cycleNodeStatus(selectedNodeId);
        return;
      }

      // ── V — Cycle seen state ───────────────────────────────
      if (key.toLowerCase() === 'v' && !isShift) {
        const selectedNodeId = useUIStore.getState().selectedNodeId;
        if (!selectedNodeId) return;
        event.preventDefault();
        useSimulationStore.getState().cycleNodeSeen(selectedNodeId);
        return;
      }

      // ── I — Toggle inspector panel ─────────────────────────
      if (key.toLowerCase() === 'i' && !isShift) {
        event.preventDefault();
        const ui = useUIStore.getState();
        if (ui.inspectorOpen) {
          ui.closeInspector();
        } else if (ui.selectedNodeId) {
          ui.openInspector();
        }
        return;
      }

      // ── R — Reset simulation state ─────────────────────────
      if (key.toLowerCase() === 'r' && !isShift) {
        event.preventDefault();
        useSimulationStore.getState().resetSimulation();
        useUIStore.getState().addToast('Simulation reset', 'info', 3000);
        return;
      }

      // ── L — Auto-layout graph (for later phases) ──────────
      if (key.toLowerCase() === 'l' && !isShift) {
        event.preventDefault();
        // Auto-layout not yet implemented (Phase 14)
        useUIStore.getState().addToast('Auto-layout not yet available', 'info', 3000);
        return;
      }
    },
    [reactFlowInstance]
  );

  // Register and cleanup the global keydown listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
