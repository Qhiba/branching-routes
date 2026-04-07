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
// Key export: useGraphSync() → { nodes, edges }
// ============================================================

import { useMemo } from 'react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';

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
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function useGraphSync() {
  const common = useNarrativeStore((s) => s.common);
  const choice = useNarrativeStore((s) => s.choice);
  const ending = useNarrativeStore((s) => s.ending);
  const entryNode = useNarrativeStore((s) => s.metadata.entry_node);

  // AMBIGUOUS: Simulation store data (nodeStates) is read here for future
  // node renderer use but not consumed in this hook's output directly.
  // Node renderers will read it via their own selectors.

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

    // Edges from Common Node next[] entries
    for (const node of Object.values(common)) {
      result.push(...buildEdgesFromCommonNode(node));
    }

    // Edges from Choice options[].next[] entries
    for (const ch of Object.values(choice)) {
      result.push(...buildEdgesFromChoice(ch));
    }

    return result;
  }, [common, choice]);

  return { nodes, edges };
}
