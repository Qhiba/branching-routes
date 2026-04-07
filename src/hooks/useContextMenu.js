// ============================================================
// useContextMenu.js — Context menu position/visibility/target management
// ============================================================
// Manages the state and logic for the right-click context menu.
// Determines which menu items to display based on the click target
// (empty canvas, node, or edge) and maps targets to menu option
// descriptors.
//
// Key export: useContextMenu() → { menuState, showMenu, hideMenu,
//             getMenuItems }
//
// Architecture rules enforced:
//   AR-02: context menu state lives in useUIStore, this hook
//          provides derived logic and convenience functions
// ============================================================

import { useCallback } from 'react';
import { useUIStore } from '@/store/useUIStore.js';

// ── Menu item definitions ────────────────────────────────────

/**
 * Menu items for right-clicking on empty canvas.
 * Per spec §3.2: Create Common Node, Create Choice, Create Ending,
 * Create Flag, Create Status Point, Create Path, Create Chapter, Paste
 */
const CANVAS_MENU_ITEMS = [
  { id: 'create-common-node', label: 'Create Common Node', icon: 'square', shortcut: 'N', group: 'create' },
  { id: 'create-choice', label: 'Create Choice', icon: 'git-branch', shortcut: 'C', group: 'create' },
  { id: 'create-ending', label: 'Create Ending', icon: 'flag', shortcut: 'E', group: 'create' },
  { id: 'divider-1', type: 'divider' },
  { id: 'create-flag', label: 'Create Flag', icon: 'bookmark', shortcut: 'F', group: 'create' },
  { id: 'create-status-point', label: 'Create Status Point', icon: 'bar-chart-2', shortcut: 'S', group: 'create' },
  { id: 'divider-2', type: 'divider' },
  { id: 'create-path', label: 'Create Path', icon: 'route', group: 'create' },
  { id: 'create-chapter', label: 'Create Chapter', icon: 'book-open', group: 'create' },
  { id: 'divider-3', type: 'divider' },
  { id: 'paste', label: 'Paste', icon: 'clipboard', shortcut: 'Ctrl+V', group: 'clipboard' },
];

/**
 * Menu items for right-clicking on a node.
 * Per spec §3.2: Edit, Delete, Duplicate, Connect to...,
 * Toggle State, Toggle Seen, Copy
 */
const NODE_MENU_ITEMS = [
  { id: 'edit-node', label: 'Edit', icon: 'pencil', shortcut: 'I', group: 'edit' },
  { id: 'delete-node', label: 'Delete', icon: 'trash-2', shortcut: 'Del', group: 'edit' },
  { id: 'duplicate-node', label: 'Duplicate', icon: 'copy', group: 'edit' },
  { id: 'divider-1', type: 'divider' },
  { id: 'connect-to', label: 'Connect to...', icon: 'link', group: 'connect' },
  { id: 'divider-2', type: 'divider' },
  { id: 'toggle-state', label: 'Toggle State', icon: 'circle-dot', shortcut: 'Space', group: 'simulation' },
  { id: 'toggle-seen', label: 'Toggle Seen', icon: 'eye', shortcut: 'V', group: 'simulation' },
  { id: 'divider-3', type: 'divider' },
  { id: 'copy-node', label: 'Copy', icon: 'clipboard-copy', shortcut: 'Ctrl+C', group: 'clipboard' },
];

/**
 * Menu items for right-clicking on an edge.
 * Per spec §3.2: Delete, Edit Conditions
 */
const EDGE_MENU_ITEMS = [
  { id: 'delete-edge', label: 'Delete', icon: 'trash-2', shortcut: 'Del', group: 'edit' },
  { id: 'edit-conditions', label: 'Edit Conditions', icon: 'filter', group: 'edit' },
];

/**
 * Get the appropriate menu items based on the target type.
 * @param {'canvas'|'node'|'edge'|null} targetType
 * @returns {Array} Menu item descriptors
 */
function getMenuItemsForTarget(targetType) {
  switch (targetType) {
    case 'node':
      return NODE_MENU_ITEMS;
    case 'edge':
      return EDGE_MENU_ITEMS;
    case 'canvas':
    default:
      return CANVAS_MENU_ITEMS;
  }
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Hook for managing context menu state and item resolution.
 *
 * @returns {{
 *   menuState: { visible: boolean, x: number, y: number, targetId: string|null, targetType: string } | null,
 *   showMenu: Function,
 *   hideMenu: Function,
 *   getMenuItems: Function,
 * }}
 */
export function useContextMenu() {
  const menuState = useUIStore((s) => s.contextMenu);
  const showContextMenu = useUIStore((s) => s.showContextMenu);
  const hideContextMenu = useUIStore((s) => s.hideContextMenu);

  /**
   * Show the context menu for a given event and target.
   * @param {MouseEvent} event — The right-click event
   * @param {string|null} [targetId] — Entity ID of the clicked target
   * @param {'canvas'|'node'|'edge'} [targetType='canvas'] — Type of target
   */
  const showMenu = useCallback(
    (event, targetId = null, targetType = 'canvas') => {
      event.preventDefault();
      event.stopPropagation();
      showContextMenu({
        x: event.clientX,
        y: event.clientY,
        targetId,
        targetType,
      });
    },
    [showContextMenu]
  );

  /**
   * Hide the context menu.
   */
  const hideMenu = useCallback(() => {
    hideContextMenu();
  }, [hideContextMenu]);

  /**
   * Get the menu items for the current target type.
   * @returns {Array} Menu item descriptors
   */
  const getMenuItems = useCallback(() => {
    if (!menuState) return [];
    return getMenuItemsForTarget(menuState.targetType);
  }, [menuState]);

  return {
    menuState,
    showMenu,
    hideMenu,
    getMenuItems,
  };
}
