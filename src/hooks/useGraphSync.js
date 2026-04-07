// ============================================================
// useGraphSync.js — Transforms store data into React Flow format
// ============================================================
// Subscribes to the narrative store and converts entity data
// into React Flow `nodes[]` and `edges[]` arrays.
//
// Node types:
//   - 'commonNode' → Common Node entities
//   - 'choiceNode' → Choice entities
//   - 'endingNode' → Ending entities
//
// Edges are derived from:
//   - Common Node `next[].target` references
//   - Choice `options[].next[].target` references
//
// Phase 14: Guards against edge corruption by filtering out
// edges whose target node doesn't exist in the graph.
//
// Key export: useGraphSync() → { nodes, edges }
// ============================================================

import { useMemo } from 'react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';

/**
 * Determine the React Flow node type string for a given entity type.
 * @param {'common'|'choice'|'ending'} entityType
 * @returns {string}
 */
function toNodeType(entityType) {
  switch (entityType) {
    case 'common':
      return 'commonNode';
    case 'choice':
      return 'choiceNode';
    case 'ending':
      return 'endingNode';
    default:
      return 'default';
  }
}

/**
 * Build a React Flow node object from a narrative entity.
 *
 * @param {object} entity — The narrative entity (common node, choice, or ending)
 * @param {string} entityType — 'common' | 'choice' | 'ending'
 * @returns {object} React Flow node
 */
function buildNode(entity, entityType) {
  return {
    id: entity.id,
    type: toNodeType(entityType),
    position: { x: entity._position?.x ?? 0, y: entity._position?.y ?? 0 },
    data: {
      entity,
      entityType,
    },
  };
}

/**
 * Build React Flow edges from a Common Node's `next[]` array.
 *
 * @param {object} node — Common Node entity
 * @returns {object[]} Array of React Flow edge objects
 */
function buildEdgesFromCommonNode(node) {
  return node.next.map((entry) => ({
    id: `edge-${node.id}-${entry.id}`,
    source: node.id,
    target: entry.target,
    type: 'conditional',
    data: {
      nextEntryId: entry.id,
      sourceEntityType: 'common',
      sourceNodeId: node.id,
      requires: entry.requires,
    },
  }));
}

/**
 * Build React Flow edges from a Choice's `options[].next[]` arrays.
 *
 * @param {object} choice — Choice entity
 * @returns {object[]} Array of React Flow edge objects
 */
function buildEdgesFromChoice(choice) {
  const edges = [];
  for (const option of choice.options) {
    for (const entry of option.next) {
      edges.push({
        id: `edge-${choice.id}-${option.id}-${entry.id}`,
        source: choice.id,
        target: entry.target,
        type: 'conditional',
        data: {
          nextEntryId: entry.id,
          optionId: option.id,
          sourceEntityType: 'choice',
          sourceNodeId: choice.id,
          requires: entry.requires,
          optionLabel: option.label,
        },
      });
    }
  }
  return edges;
}

/**
 * Hook that transforms narrative store data into React Flow nodes and edges.
 * Subscribes to store changes and recomputes when entities change.
 *
 * Phase 14: Filters out edges whose target doesn't exist (corruption guard).
 *
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function useGraphSync() {
  const common = useNarrativeStore((s) => s.common);
  const choice = useNarrativeStore((s) => s.choice);
  const ending = useNarrativeStore((s) => s.ending);
  const entryNode = useNarrativeStore((s) => s.metadata.entry_node);

  const nodes = useMemo(() => {
    const result = [];

    // Common Nodes
    for (const node of Object.values(common)) {
      result.push(buildNode(node, 'common'));
    }

    // Choices
    for (const ch of Object.values(choice)) {
      result.push(buildNode(ch, 'choice'));
    }

    // Endings
    for (const end of Object.values(ending)) {
      result.push(buildNode(end, 'ending'));
    }

    return result;
  }, [common, choice, ending]);

  const edges = useMemo(() => {
    const result = [];

    // Build a set of all valid node IDs for corruption guard
    const validNodeIds = new Set();
    for (const id of Object.keys(common)) validNodeIds.add(id);
    for (const id of Object.keys(choice)) validNodeIds.add(id);
    for (const id of Object.keys(ending)) validNodeIds.add(id);

    // Edges from Common Node next[] entries
    for (const node of Object.values(common)) {
      const nodeEdges = buildEdgesFromCommonNode(node);
      for (const edge of nodeEdges) {
        // Phase 14: Only include edges whose target node exists
        if (edge.target && validNodeIds.has(edge.target)) {
          result.push(edge);
        }
      }
    }

    // Edges from Choice options[].next[] entries
    for (const ch of Object.values(choice)) {
      const choiceEdges = buildEdgesFromChoice(ch);
      for (const edge of choiceEdges) {
        if (edge.target && validNodeIds.has(edge.target)) {
          result.push(edge);
        }
      }
    }

    return result;
  }, [common, choice, ending]);

  return { nodes, edges };
}
