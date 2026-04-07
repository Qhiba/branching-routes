// ============================================================
// performanceOptimizer.js — Memoization + incremental recalculation
// ============================================================
// Provides performance utilities for large graphs (200+ nodes):
//
//   1. memoizeSimulation() — wraps the simulation recalculate()
//      function with shallow-equality caching so identical inputs
//      return cached results instantly.
//
//   2. computeAffectedSubgraph() — given a changed node/flag/status,
//      determines the minimal set of nodes and edges that need
//      re-evaluation, enabling incremental recalculation.
//
//   3. createDebouncedRecalculator() — configurable debounce
//      that tunes delay based on graph size (faster debounce for
//      small graphs, longer for 200+ nodes).
//
// Key exports:
//   memoizeSimulation(), computeAffectedSubgraph(),
//   createDebouncedRecalculator()
//
// Dependencies: None
// ============================================================

// ── Shallow equality check ──────────────────────────────────

/**
 * Shallow compare two objects (one level deep).
 * Used to compare simulation input snapshots.
 *
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

// ── memoizeSimulation ───────────────────────────────────────

/**
 * Wrap the simulation `recalculate` function with memoization.
 *
 * Caches the last result and returns it if the inputs haven't
 * changed (shallow comparison on narrative slices + campaign state).
 * This avoids redundant full-graph recalculation when only
 * unrelated UI state changes trigger re-renders.
 *
 * @param {Function} recalculateFn — the original recalculate(narrativeData, campaignState)
 * @returns {Function} Memoized version with same signature
 */
export function memoizeSimulation(recalculateFn) {
  let lastNarrativeRef = null;
  let lastCampaignRef = null;
  let lastResult = null;

  return function memoizedRecalculate(narrativeData, campaignState) {
    // Compare input references for each slice
    const narrativeChanged =
      !lastNarrativeRef ||
      lastNarrativeRef.common !== narrativeData.common ||
      lastNarrativeRef.choice !== narrativeData.choice ||
      lastNarrativeRef.ending !== narrativeData.ending ||
      lastNarrativeRef.flag !== narrativeData.flag ||
      lastNarrativeRef.status !== narrativeData.status ||
      lastNarrativeRef.metadata !== narrativeData.metadata;

    const campaignChanged =
      !lastCampaignRef ||
      lastCampaignRef.nodeStates !== campaignState.nodeStates ||
      lastCampaignRef.flagOverrides !== campaignState.flagOverrides ||
      lastCampaignRef.statusOverrides !== campaignState.statusOverrides;

    if (!narrativeChanged && !campaignChanged && lastResult) {
      return lastResult;
    }

    // Cache miss — run full recalculation
    lastNarrativeRef = {
      common: narrativeData.common,
      choice: narrativeData.choice,
      ending: narrativeData.ending,
      flag: narrativeData.flag,
      status: narrativeData.status,
      metadata: narrativeData.metadata,
    };
    lastCampaignRef = {
      nodeStates: campaignState.nodeStates,
      flagOverrides: campaignState.flagOverrides,
      statusOverrides: campaignState.statusOverrides,
    };

    lastResult = recalculateFn(narrativeData, campaignState);
    return lastResult;
  };
}

// ── computeAffectedSubgraph ─────────────────────────────────

/**
 * Given a set of changed entity IDs, compute the minimal subgraph
 * that needs re-evaluation.
 *
 * This is used for incremental recalculation: when a single flag
 * or status changes, only edges/nodes that reference that flag/status
 * need their conditions re-evaluated, rather than the entire graph.
 *
 * Strategy:
 *   1. For flag/status changes: find all nodes/edges whose `requires`
 *      reference the changed flag/status.
 *   2. For node state changes: find the node and its immediate
 *      neighbors (1-hop in either direction).
 *   3. Return the union of affected node IDs and edge IDs.
 *
 * @param {object} narrativeData — { common, choice, ending, flag, status }
 * @param {object} changes — Describes what changed
 * @param {string[]} [changes.flagIds] — Changed flag IDs
 * @param {string[]} [changes.statusIds] — Changed status IDs
 * @param {string[]} [changes.nodeIds] — Changed node IDs (state toggled)
 * @returns {{ affectedNodeIds: Set<string>, affectedEdgeIds: Set<string> }}
 */
export function computeAffectedSubgraph(narrativeData, changes) {
  const { common = {}, choice = {} } = narrativeData;
  const affectedNodeIds = new Set();
  const affectedEdgeIds = new Set();

  const changedFlags = new Set(changes.flagIds || []);
  const changedStatuses = new Set(changes.statusIds || []);
  const changedNodes = new Set(changes.nodeIds || []);

  // ── Direct node changes: add node + neighbors ────────────

  for (const nodeId of changedNodes) {
    affectedNodeIds.add(nodeId);

    // Add outgoing targets
    const commonNode = common[nodeId];
    if (commonNode) {
      for (const entry of commonNode.next || []) {
        affectedNodeIds.add(entry.target);
        affectedEdgeIds.add(`edge-${nodeId}-${entry.id}`);
      }
    }

    const choiceNode = choice[nodeId];
    if (choiceNode) {
      for (const opt of choiceNode.options || []) {
        for (const entry of opt.next || []) {
          affectedNodeIds.add(entry.target);
          affectedEdgeIds.add(`edge-${nodeId}-${opt.id}-${entry.id}`);
        }
      }
    }

    // Add incoming edges (nodes that target this node)
    for (const node of Object.values(common)) {
      for (const entry of node.next || []) {
        if (entry.target === nodeId) {
          affectedNodeIds.add(node.id);
          affectedEdgeIds.add(`edge-${node.id}-${entry.id}`);
        }
      }
    }
    for (const ch of Object.values(choice)) {
      for (const opt of ch.options || []) {
        for (const entry of opt.next || []) {
          if (entry.target === nodeId) {
            affectedNodeIds.add(ch.id);
            affectedEdgeIds.add(`edge-${ch.id}-${opt.id}-${entry.id}`);
          }
        }
      }
    }
  }

  // ── Flag/status changes: find referencing conditions ──────

  if (changedFlags.size > 0 || changedStatuses.size > 0) {
    // Scan common nodes
    for (const node of Object.values(common)) {
      if (conditionReferencesChanged(node.requires, changedFlags, changedStatuses)) {
        affectedNodeIds.add(node.id);
      }
      for (const entry of node.next || []) {
        if (conditionReferencesChanged(entry.requires, changedFlags, changedStatuses)) {
          affectedNodeIds.add(node.id);
          affectedNodeIds.add(entry.target);
          affectedEdgeIds.add(`edge-${node.id}-${entry.id}`);
        }
      }
      for (const variant of node.variants || []) {
        if (conditionReferencesChanged(variant.requires, changedFlags, changedStatuses)) {
          affectedNodeIds.add(node.id);
        }
      }
    }

    // Scan choices
    for (const ch of Object.values(choice)) {
      if (conditionReferencesChanged(ch.requires, changedFlags, changedStatuses)) {
        affectedNodeIds.add(ch.id);
      }
      for (const opt of ch.options || []) {
        if (conditionReferencesChanged(opt.requires, changedFlags, changedStatuses)) {
          affectedNodeIds.add(ch.id);
        }
        for (const entry of opt.next || []) {
          if (conditionReferencesChanged(entry.requires, changedFlags, changedStatuses)) {
            affectedNodeIds.add(ch.id);
            affectedNodeIds.add(entry.target);
            affectedEdgeIds.add(`edge-${ch.id}-${opt.id}-${entry.id}`);
          }
        }
      }
    }
  }

  return { affectedNodeIds, affectedEdgeIds };
}

/**
 * Check if a condition group references any of the changed flags or statuses.
 *
 * @param {object} condGroup — { operator, conditions: [] }
 * @param {Set<string>} changedFlags
 * @param {Set<string>} changedStatuses
 * @returns {boolean}
 */
function conditionReferencesChanged(condGroup, changedFlags, changedStatuses) {
  if (!condGroup || !condGroup.conditions) return false;

  for (const cond of condGroup.conditions) {
    // Nested group
    if (cond.operator != null) {
      if (conditionReferencesChanged(cond, changedFlags, changedStatuses)) {
        return true;
      }
    }
    // Flag condition
    else if (cond.flag && changedFlags.has(cond.flag)) {
      return true;
    }
    // Status condition
    else if (cond.status && changedStatuses.has(cond.status)) {
      return true;
    }
  }

  return false;
}

// ── createDebouncedRecalculator ─────────────────────────────

/**
 * Create a debounced recalculation scheduler that adapts its delay
 * based on graph size.
 *
 * For small graphs (< 50 nodes): 100ms debounce
 * For medium graphs (50-199 nodes): 150ms debounce
 * For large graphs (200+ nodes): 250ms debounce
 *
 * @param {Function} callback — Function to debounce
 * @param {Function} getNodeCount — Returns current node count
 * @returns {{ schedule: Function, cancel: Function }}
 */
export function createDebouncedRecalculator(callback, getNodeCount) {
  let timerId = null;

  function getDelay() {
    const count = getNodeCount();
    if (count >= 200) return 250;
    if (count >= 50) return 150;
    return 100;
  }

  function schedule() {
    if (timerId != null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      callback();
    }, getDelay());
  }

  function cancel() {
    if (timerId != null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  return { schedule, cancel };
}
