// ============================================================
// simulationEngine.js — Core simulation loop
// ============================================================
// Evaluates all edge conditions, computes node reachability,
// and generates auto-lock suggestions. This is a pure-function
// module — it takes input data and returns computed results.
//
// The subscription/debounce lifecycle is handled by the
// useSimulationSync hook, not here.
//
// Key export:
//   recalculate(narrativeData, campaignState) → SimResult
//
// Dependencies: conditionEval, reachability
// ============================================================

import { evaluateCondition } from '@/utils/conditionEval.js';
import { findUnreachableNodes } from './reachability.js';

/**
 * @typedef {object} SimResult
 * @property {{ [edgeId: string]: boolean }} evaluatedEdges — pass/fail for each edge
 * @property {Set<string>} unreachableNodes — nodes not reachable from entry
 * @property {string[]} autoLockSuggestions — node IDs suggested for locking
 */

/**
 * Merge data model flag defaults with campaign/simulation overrides.
 *
 * Data model flags have a `state` field (default value).
 * Campaign/simulation overrides replace specific flag states.
 *
 * @param {object} flagEntities — narrative store `flag` collection
 * @param {object} flagOverrides — { [flagId]: boolean } from simulation/campaign
 * @returns {{ [flagId: string]: boolean }} Merged flag map
 */
function buildFlagMap(flagEntities, flagOverrides) {
  const map = {};
  for (const [id, flag] of Object.entries(flagEntities)) {
    map[id] = flagOverrides[id] ?? flag.state ?? false;
  }
  // Also include any overrides for flags that may not exist in data model
  for (const [id, value] of Object.entries(flagOverrides)) {
    if (!(id in map)) {
      map[id] = value;
    }
  }
  return map;
}

/**
 * Merge data model status point defaults with campaign/simulation overrides.
 *
 * Data model status points have a `value` field (default value).
 * Campaign/simulation overrides replace specific values.
 *
 * @param {object} statusEntities — narrative store `status` collection
 * @param {object} statusOverrides — { [statusId]: number } from simulation/campaign
 * @returns {{ [statusId: string]: number }} Merged status map
 */
function buildStatusMap(statusEntities, statusOverrides) {
  const map = {};
  for (const [id, sp] of Object.entries(statusEntities)) {
    map[id] = statusOverrides[id] ?? sp.value ?? 0;
  }
  // Also include any overrides for statuses that may not exist in data model
  for (const [id, value] of Object.entries(statusOverrides)) {
    if (!(id in map)) {
      map[id] = value;
    }
  }
  return map;
}

/**
 * Evaluate all edges in the narrative data against the current
 * flag/status state.
 *
 * Edge ID format matches useGraphSync.js conventions:
 *   - Common Node: "edge-{nodeId}-{nextEntryId}"
 *   - Choice:      "edge-{choiceId}-{optionId}-{nextEntryId}"
 *
 * Also evaluates node-level `requires` as a node prerequisite check.
 *
 * @param {object} narrativeData — { common, choice, ending }
 * @param {object} flagMap — merged flag map
 * @param {object} statusMap — merged status map
 * @returns {{ [edgeId: string]: boolean }} Edge evaluation results
 */
function evaluateAllEdges(narrativeData, flagMap, statusMap) {
  const { common = {}, choice = {} } = narrativeData;
  const result = {};

  // Evaluate Common Node next[] entries
  for (const node of Object.values(common)) {
    for (const entry of node.next || []) {
      const edgeId = `edge-${node.id}-${entry.id}`;
      // Edge passes if its own requires pass AND the source node's requires pass
      const edgeConditionPasses = evaluateCondition(entry.requires, flagMap, statusMap);
      const sourceRequiresPasses = evaluateCondition(node.requires, flagMap, statusMap);
      result[edgeId] = edgeConditionPasses && sourceRequiresPasses;
    }
  }

  // Evaluate Choice options[].next[] entries
  for (const ch of Object.values(choice)) {
    for (const option of ch.options || []) {
      for (const entry of option.next || []) {
        const edgeId = `edge-${ch.id}-${option.id}-${entry.id}`;
        // Edge passes if: choice requires + option requires + next entry requires all pass
        const choiceRequires = evaluateCondition(ch.requires, flagMap, statusMap);
        const optionRequires = evaluateCondition(option.requires, flagMap, statusMap);
        const entryRequires = evaluateCondition(entry.requires, flagMap, statusMap);
        result[edgeId] = choiceRequires && optionRequires && entryRequires;
      }
    }
  }

  return result;
}

/**
 * Generate auto-lock suggestions: nodes that are unreachable and
 * not already locked or branch_locked.
 *
 * @param {Set<string>} unreachableNodes — unreachable node IDs
 * @param {{ [nodeId: string]: { status: string, seen: string } }} nodeStates — current simulation states
 * @returns {string[]} Node IDs suggested for auto-locking
 */
function computeAutoLockSuggestions(unreachableNodes, nodeStates) {
  const suggestions = [];
  for (const nodeId of unreachableNodes) {
    const state = nodeStates[nodeId];
    const status = state?.status ?? 'default';
    // Only suggest locking for nodes not already in a terminal-ish state
    if (status !== 'locked' && status !== 'branch_locked' && status !== 'complete' && status !== 'failed') {
      suggestions.push(nodeId);
    }
  }
  return suggestions;
}

/**
 * Main simulation recalculation function.
 *
 * Takes the full narrative data and campaign/simulation state,
 * evaluates all conditions, computes reachability from the entry
 * node, and generates auto-lock suggestions.
 *
 * @param {object} narrativeData — full narrative store state
 *   { metadata, common, choice, ending, flag, status, path, chapter }
 * @param {object} campaignState — current simulation/campaign state
 *   { nodeStates, flagOverrides, statusOverrides }
 * @returns {SimResult}
 */
export function recalculate(narrativeData, campaignState) {
  const {
    metadata = {},
    flag: flagEntities = {},
    status: statusEntities = {},
  } = narrativeData;

  const {
    nodeStates = {},
    flagOverrides = {},
    statusOverrides = {},
  } = campaignState;

  // 1. Build merged flag/status maps
  const flagMap = buildFlagMap(flagEntities, flagOverrides);
  const statusMap = buildStatusMap(statusEntities, statusOverrides);

  // 2. Evaluate all edge conditions
  const evaluatedEdges = evaluateAllEdges(narrativeData, flagMap, statusMap);

  // 3. Compute reachability from entry node
  const entryNode = metadata.entry_node ?? null;
  const unreachableNodes = findUnreachableNodes(narrativeData, evaluatedEdges, entryNode);

  // 4. Generate auto-lock suggestions
  const autoLockSuggestions = computeAutoLockSuggestions(unreachableNodes, nodeStates);

  return {
    evaluatedEdges,
    unreachableNodes,
    autoLockSuggestions,
  };
}
