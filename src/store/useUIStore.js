// ============================================================
// useUIStore.js — Zustand store for UI state
// ============================================================
// Manages transient UI state: selected node, inspector panel,
// context menu, command palette, toast notifications, and
// IndexedDB persist-error flag (AR-08).
//
// State shape:
//   selectedNodeId       — currently selected node ID or null
//   inspectorOpen        — whether the inspector panel is visible
//   inspectorPinned      — whether the inspector stays open on deselect
//   contextMenu          — { visible, x, y, targetId, targetType } or null
//   commandPaletteOpen   — whether the command palette modal is open
//   toasts               — array of { id, message, type, duration }
//   persistError         — persistent flag for IndexedDB failure (AR-08)
//
// Architecture rules enforced:
//   AR-02: all shared UI state lives here, not in component useState
//   AR-08: showPersistError / clearPersistError for IndexedDB errors
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ── Toast ID counter ─────────────────────────────────────────
let _toastIdCounter = 0;

// ── Default toast duration (ms) ──────────────────────────────
const DEFAULT_TOAST_DURATION = 5000;

// ── Store ────────────────────────────────────────────────────

export const useUIStore = create(
  subscribeWithSelector((set, get) => ({
    // ── State shape ─────────────────────────────────────────

    selectedNodeId: null,
    inspectorOpen: false,
    inspectorPinned: false,
    contextMenu: null,
    commandPaletteOpen: false,
    toasts: [],
    persistError: null,

    // ── Node selection ──────────────────────────────────────

    /**
     * Select a node by ID. Pass `null` to deselect.
     * When deselecting, closes the inspector unless it is pinned.
     * @param {string|null} nodeId
     */
    selectNode: (nodeId) => {
      set((state) => {
        const updates = { selectedNodeId: nodeId };
        // If deselecting and inspector is not pinned, close it
        if (nodeId == null && !state.inspectorPinned) {
          updates.inspectorOpen = false;
        }
        return updates;
      });
    },

    // ── Inspector controls ──────────────────────────────────

    /**
     * Open the inspector panel.
     */
    openInspector: () => {
      set({ inspectorOpen: true });
    },

    /**
     * Close the inspector panel.
     */
    closeInspector: () => {
      set({ inspectorOpen: false });
    },

    /**
     * Toggle the pinned state of the inspector.
     * When pinned, the inspector stays open even when the node is deselected.
     * @param {boolean} [pinned] — If provided, sets the pinned state directly.
     *   If omitted, toggles the current state.
     */
    pinInspector: (pinned) => {
      set((state) => ({
        inspectorPinned: pinned != null ? pinned : !state.inspectorPinned,
      }));
    },

    // ── Context menu ────────────────────────────────────────

    /**
     * Show the context menu at a given position with target info.
     * @param {{ x: number, y: number, targetId?: string, targetType?: string }} options
     *   - x, y: screen coordinates
     *   - targetId: ID of the right-clicked entity (null for canvas)
     *   - targetType: 'node' | 'edge' | 'canvas'
     */
    showContextMenu: ({ x, y, targetId = null, targetType = 'canvas' }) => {
      set({
        contextMenu: { visible: true, x, y, targetId, targetType },
      });
    },

    /**
     * Hide the context menu.
     */
    hideContextMenu: () => {
      set({ contextMenu: null });
    },

    // ── Command palette ─────────────────────────────────────

    /**
     * Toggle the command palette open/closed.
     * @param {boolean} [open] — If provided, sets state directly.
     */
    toggleCommandPalette: (open) => {
      set((state) => ({
        commandPaletteOpen: open != null ? open : !state.commandPaletteOpen,
      }));
    },

    // ── Toast notifications ─────────────────────────────────

    /**
     * Add a toast notification. Auto-removes after `duration` ms.
     * @param {string} message — Toast message text
     * @param {'info'|'success'|'warning'|'error'} [type='info'] — Toast type
     * @param {number} [duration] — Auto-dismiss duration in ms (default 5000)
     * @returns {number} Toast ID
     */
    addToast: (message, type = 'info', duration = DEFAULT_TOAST_DURATION) => {
      const id = ++_toastIdCounter;
      const toast = { id, message, type, duration };

      set((state) => ({
        toasts: [...state.toasts, toast],
      }));

      // Schedule auto-removal
      if (duration > 0) {
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      }

      return id;
    },

    /**
     * Remove a toast by ID.
     * @param {number} id — Toast ID to remove
     */
    removeToast: (id) => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    },

    // ── Persist error (AR-08) ───────────────────────────────

    /**
     * Set a persistent error flag when an IndexedDB operation fails.
     * The error stays visible until explicitly cleared.
     * @param {string} [errorMessage] — Description of the persistence failure
     */
    showPersistError: (errorMessage = 'Failed to save to IndexedDB') => {
      set({ persistError: errorMessage });
    },

    /**
     * Clear the persistent error flag.
     */
    clearPersistError: () => {
      set({ persistError: null });
    },
  }))
);
