// ============================================================
// ContextMenu.jsx — Right-click context menu component
// ============================================================
// Renders a context-sensitive right-click menu with options
// determined by the click target (canvas, node, or edge).
// Executes actions via narrative, simulation, and UI stores.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/ui/
//   AR-02: all state from Zustand stores
//   AR-09: styles consume tokens via ContextMenu.css
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Square,
  GitBranch,
  Flag,
  Bookmark,
  BarChart2,
  Route,
  BookOpen,
  Clipboard,
  Pencil,
  Trash2,
  Copy,
  Link,
  CircleDot,
  Eye,
  ClipboardCopy,
  Filter,
} from 'lucide-react';

import { useContextMenu } from '@/hooks/useContextMenu.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';

import './ContextMenu.css';

// ── Icon map ─────────────────────────────────────────────────

const ICON_MAP = {
  'square': Square,
  'git-branch': GitBranch,
  'flag': Flag,
  'bookmark': Bookmark,
  'bar-chart-2': BarChart2,
  'route': Route,
  'book-open': BookOpen,
  'clipboard': Clipboard,
  'pencil': Pencil,
  'trash-2': Trash2,
  'copy': Copy,
  'link': Link,
  'circle-dot': CircleDot,
  'eye': Eye,
  'clipboard-copy': ClipboardCopy,
  'filter': Filter,
};

// ── ContextMenu component ────────────────────────────────────

/**
 * Right-click context menu with context-sensitive options.
 * Shows different menu items based on what was right-clicked:
 *   - Empty canvas: Create entities, Paste
 *   - Node: Edit, Delete, Duplicate, Toggle State/Seen, Copy
 *   - Edge: Delete, Edit Conditions
 */
function ContextMenu() {
  const { menuState, hideMenu, getMenuItems } = useContextMenu();
  const menuRef = useRef(null);
  const reactFlowInstance = useReactFlow();

  // ── Viewport boundary clamping ─────────────────────────────
  // Adjust menu position to keep it within the viewport
  useEffect(() => {
    if (!menuState?.visible || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let adjustedX = menuState.x;
    let adjustedY = menuState.y;

    // Clamp to right edge
    if (adjustedX + rect.width > viewportW - 8) {
      adjustedX = viewportW - rect.width - 8;
    }
    // Clamp to bottom edge
    if (adjustedY + rect.height > viewportH - 8) {
      adjustedY = viewportH - rect.height - 8;
    }
    // Clamp to left/top edges
    adjustedX = Math.max(8, adjustedX);
    adjustedY = Math.max(8, adjustedY);

    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  }, [menuState]);

  // ── Action handler ─────────────────────────────────────────

  const handleAction = useCallback(
    (itemId) => {
      if (!menuState) return;

      const { targetId } = menuState;
      const narrative = useNarrativeStore.getState();
      const ui = useUIStore.getState();
      const simulation = useSimulationStore.getState();

      // Convert screen position to flow coordinates for entity creation
      const flowPosition = (() => {
        try {
          return reactFlowInstance.screenToFlowPosition({
            x: menuState.x,
            y: menuState.y,
          });
        } catch {
          return { x: 0, y: 0 };
        }
      })();

      const pos = {
        x: Math.round(flowPosition.x),
        y: Math.round(flowPosition.y),
      };

      switch (itemId) {
        // ── Canvas: Create entities ─────────────────────────
        case 'create-common-node': {
          const nodeId = narrative.addCommonNode({ _position: pos });
          ui.selectNode(nodeId);
          ui.addToast('Common Node created', 'success', 3000);
          break;
        }
        case 'create-choice': {
          const choiceId = narrative.addChoice({ _position: pos });
          ui.selectNode(choiceId);
          ui.addToast('Choice created', 'success', 3000);
          break;
        }
        case 'create-ending': {
          const endingId = narrative.addEnding({ _position: pos });
          ui.selectNode(endingId);
          ui.addToast('Ending created', 'success', 3000);
          break;
        }
        case 'create-flag': {
          const flagId = narrative.addFlag();
          ui.addToast(`Flag created: ${flagId}`, 'success', 3000);
          break;
        }
        case 'create-status-point': {
          const statusId = narrative.addStatusPoint();
          ui.addToast(`Status Point created: ${statusId}`, 'success', 3000);
          break;
        }
        case 'create-path': {
          const pathId = narrative.addPath();
          ui.addToast(`Path created: ${pathId}`, 'success', 3000);
          break;
        }
        case 'create-chapter': {
          const chapterId = narrative.addChapter();
          ui.addToast(`Chapter created: ${chapterId}`, 'success', 3000);
          break;
        }
        case 'paste': {
          // AMBIGUOUS: Clipboard paste not yet implemented (requires copy state).
          // Showing placeholder toast.
          ui.addToast('Paste not yet available', 'info', 3000);
          break;
        }

        // ── Node: Edit/Delete/Duplicate/Connect/Toggle ──────
        case 'edit-node': {
          if (targetId) {
            ui.selectNode(targetId);
            ui.openInspector();
          }
          break;
        }
        case 'delete-node': {
          if (!targetId) break;
          if (narrative.common[targetId]) {
            narrative.deleteCommonNode(targetId);
          } else if (narrative.choice[targetId]) {
            narrative.deleteChoice(targetId);
          } else if (narrative.ending[targetId]) {
            narrative.deleteEnding(targetId);
          }
          ui.selectNode(null);
          ui.addToast('Element deleted', 'info', 3000);
          break;
        }
        case 'duplicate-node': {
          if (!targetId) break;
          // Duplicate the entity with a new ID and offset position
          const offset = { x: 40, y: 40 };
          if (narrative.common[targetId]) {
            const original = narrative.common[targetId];
            const newId = narrative.addCommonNode({
              name: original.name,
              type: original.type,
              chapter: original.chapter,
              path: original.path,
              description: original.description,
              _position: {
                x: original._position.x + offset.x,
                y: original._position.y + offset.y,
              },
            });
            ui.selectNode(newId);
            ui.addToast('Node duplicated', 'success', 3000);
          } else if (narrative.choice[targetId]) {
            const original = narrative.choice[targetId];
            const newId = narrative.addChoice({
              text: original.text,
              chapter: original.chapter,
              path: original.path,
              _position: {
                x: original._position.x + offset.x,
                y: original._position.y + offset.y,
              },
            });
            ui.selectNode(newId);
            ui.addToast('Choice duplicated', 'success', 3000);
          } else if (narrative.ending[targetId]) {
            const original = narrative.ending[targetId];
            const newId = narrative.addEnding({
              name: original.name,
              type: original.type,
              chapter: original.chapter,
              path: original.path,
              _position: {
                x: original._position.x + offset.x,
                y: original._position.y + offset.y,
              },
            });
            ui.selectNode(newId);
            ui.addToast('Ending duplicated', 'success', 3000);
          }
          break;
        }
        case 'connect-to': {
          // AMBIGUOUS: "Connect to..." requires a target node picker or
          // interactive mode — deferred to Phase 9 inspector integration.
          ui.addToast('Use drag from handle to connect nodes', 'info', 3000);
          break;
        }
        case 'toggle-state': {
          if (targetId) {
            simulation.cycleNodeStatus(targetId);
          }
          break;
        }
        case 'toggle-seen': {
          if (targetId) {
            simulation.cycleNodeSeen(targetId);
          }
          break;
        }
        case 'copy-node': {
          // AMBIGUOUS: Copy to clipboard not yet implemented (requires clipboard state).
          ui.addToast('Copy not yet available', 'info', 3000);
          break;
        }

        // ── Edge: Delete/Edit Conditions ────────────────────
        case 'delete-edge': {
          if (!targetId) break;
          // Edge targetId is the edge ID (e.g., "edge-nodeId-nextEntryId")
          const parts = targetId.split('-');
          if (parts.length >= 3) {
            const sourceId = parts[1];
            if (narrative.common[sourceId]) {
              const entryId = parts.slice(2).join('-');
              narrative.removeNextEntry(sourceId, entryId);
              ui.addToast('Edge deleted', 'info', 3000);
            }
            // AMBIGUOUS: Choice edge deletion requires option context.
            // Deferred to inspector (Phase 9).
          }
          break;
        }
        case 'edit-conditions': {
          // AMBIGUOUS: Condition editing requires the inspector (Phase 9).
          ui.addToast('Condition editor opens in inspector (Phase 9)', 'info', 3000);
          break;
        }

        default:
          break;
      }

      // Close the menu after executing the action
      hideMenu();
    },
    [menuState, hideMenu, reactFlowInstance]
  );

  // ── Early return if menu is not visible ────────────────────

  if (!menuState?.visible) return null;

  const items = getMenuItems();

  // ── Determine danger items ─────────────────────────────────

  const isDangerItem = (itemId) =>
    itemId === 'delete-node' || itemId === 'delete-edge';

  const isCreateItem = (itemId) =>
    itemId.startsWith('create-');

  return (
    <>
      {/* Invisible click-outside overlay */}
      <div
        className="context-menu-overlay"
        onClick={hideMenu}
        onContextMenu={(e) => {
          e.preventDefault();
          hideMenu();
        }}
      />

      {/* Menu */}
      <div
        className="context-menu"
        ref={menuRef}
        style={{
          left: menuState.x,
          top: menuState.y,
        }}
        role="menu"
        id="context-menu"
      >
        {items.map((item) => {
          // Dividers
          if (item.type === 'divider') {
            return (
              <div
                key={item.id}
                className="context-menu__divider"
                role="separator"
              />
            );
          }

          // Menu items
          const IconComponent = ICON_MAP[item.icon];
          const itemClasses = [
            'context-menu__item',
            isDangerItem(item.id) && 'context-menu__item--danger',
            isCreateItem(item.id) && 'context-menu__item--create',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={item.id}
              className={itemClasses}
              role="menuitem"
              id={`context-menu-${item.id}`}
              onClick={() => handleAction(item.id)}
            >
              {IconComponent && (
                <IconComponent className="context-menu__icon" size={14} />
              )}
              <span className="context-menu__label">{item.label}</span>
              {item.shortcut && (
                <span className="context-menu__shortcut">{item.shortcut}</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default ContextMenu;
