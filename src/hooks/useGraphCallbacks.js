// ============================================================
// useGraphCallbacks.js — React Flow event callbacks wired to stores
// ============================================================
// Provides callback handlers for React Flow interactions:
//   - onNodesChange: handles drag, select, remove
//   - onEdgesChange: handles edge removal
//   - onConnect: creates next entries in the narrative store
//     AND adds the edge to React Flow's local state via addEdge
//   - onNodeDragStop: persists final position to _position
//
// All mutations route through the narrative store (AR-02).
// Node selection routes through the UI store.
//
// Key export: useGraphCallbacks() → { onNodesChange, onEdgesChange,
//             onConnect, onNodeDragStop }
// ============================================================

import { useCallback } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';

/**
 * Determine which entity collection a node ID belongs to.
 * Uses the prefix convention from entityDefaults.js factories.
 *
 * @param {string} nodeId
 * @returns {'common'|'choice'|'ending'|null}
 */
function getEntityType(nodeId) {
  if (!nodeId) return null;
  if (nodeId.startsWith('node_')) return 'common';
  if (nodeId.startsWith('choice_')) return 'choice';
  if (nodeId.startsWith('ending_')) return 'ending';

  // Fallback: check stores directly
  const state = useNarrativeStore.getState();
  if (state.common[nodeId]) return 'common';
  if (state.choice[nodeId]) return 'choice';
  if (state.ending[nodeId]) return 'ending';
  return null;
}

/**
 * Hook that provides React Flow event callbacks wired to narrative and UI stores.
 *
 * @param {Function} setNodes — React Flow's setNodes state setter
 * @param {Function} setEdges — React Flow's setEdges state setter
 * @returns {{ onNodesChange, onEdgesChange, onConnect, onNodeDragStop }}
 */
export function useGraphCallbacks(setNodes, setEdges) {
  /**
   * Handle React Flow node changes (position, selection, removal).
   * Applies changes to the local React Flow state for smooth interaction,
   * then syncs position updates to the narrative store on drag stop.
   */
  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      // Handle selection changes — route to UI store
      for (const change of changes) {
        if (change.type === 'select') {
          if (change.selected) {
            useUIStore.getState().selectNode(change.id);
          }
        }
      }
    },
    [setNodes]
  );

  /**
   * Handle React Flow edge changes (removal).
   * Applies changes to local state and syncs removals to the narrative store.
   */
  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));

      // Handle edge removals — remove the corresponding next entry
      for (const change of changes) {
        if (change.type === 'remove') {
          // Edge IDs follow the pattern:
          //   Common Node: "edge-{sourceId}-{nextEntryId}"
          //   Choice:      "edge-{sourceId}-{optionId}-{nextEntryId}"
          const parts = change.id.split('-');
          if (parts.length >= 3) {
            const sourceId = parts[1];
            const entityType = getEntityType(sourceId);

            if (entityType === 'common') {
              const entryId = parts.slice(2).join('-');
              useNarrativeStore.getState().removeNextEntry(sourceId, entryId);
            }
            // AMBIGUOUS: Choice option next entry removal requires both
            // optionId and entryId — handled when edge IDs have 4 parts.
            // For now, choice edge removal via graph interaction is deferred
            // to the inspector/context menu (Phase 8/9).
          }
        }
      }
    },
    [setEdges]
  );

  /**
   * Handle new connections drawn between nodes.
   * Adds the edge to React Flow's local state immediately (via addEdge)
   * AND creates a next entry in the source entity via the narrative store.
   *
   * React Flow requires onConnect to call setEdges with addEdge for
   * the edge to render in controlled mode. The useEffect sync in
   * GraphCanvas will then reconcile with the store-derived edges.
   */
  const onConnect = useCallback(
    (connection) => {
      const { source, target } = connection;
      if (!source || !target) return;

      const entityType = getEntityType(source);

      if (entityType === 'common') {
        // 1. Add edge to React Flow local state immediately for visual feedback
        setEdges((eds) =>
          addEdge({ ...connection, type: 'conditional' }, eds)
        );
        // 2. Update narrative store (source of truth) — this creates the
        //    proper next entry with a generated ID. When useGraphSync
        //    recomputes edges, the useEffect sync in GraphCanvas will
        //    replace the temporary addEdge entry with the store-derived one.
        useNarrativeStore.getState().addNextEntry(source, target);
      }
      // AMBIGUOUS: Connecting from a Choice node via drag is ambiguous
      // because it's unclear which option's next[] to add to.
      // This will be handled in Phase 8 (context menu: "Connect to...").
    },
    [setEdges]
  );

  /**
   * Handle node drag stop — persist the final position to the narrative store.
   * This writes the `_position` field (AR-10).
   */
  const onNodeDragStop = useCallback((_event, node) => {
    const entityType = getEntityType(node.id);
    const position = { x: Math.round(node.position.x), y: Math.round(node.position.y) };

    if (entityType === 'common') {
      useNarrativeStore.getState().updateCommonNode(node.id, { _position: position });
    } else if (entityType === 'choice') {
      useNarrativeStore.getState().updateChoice(node.id, { _position: position });
    } else if (entityType === 'ending') {
      useNarrativeStore.getState().updateEnding(node.id, { _position: position });
    }
  }, []);

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
  };
}
