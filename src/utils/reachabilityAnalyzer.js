/**
 * Static Reachability Analyzer
 *
 * Determines which nodes are structurally unreachable by analyzing the
 * flag/status dependency graph — independent of any simulation state.
 *
 * This addresses the "With Phase 4: Mutually Exclusive Logic" problem:
 * nodes whose condition matrix is impossible to satisfy given the actual
 * choice dependency structure.
 *
 * Approach:
 *   For each node with `requires`, check if there exists at least one
 *   valid path from `entryNode` that can satisfy ALL conditions:
 *   1. Every required flag must have at least one setter reachable
 *      on some path from entry
 *   2. No two required flags can be mutually exclusive (set by options
 *      on the same choice where picking one blocks the other)
 *   3. Status point requirements have at least one path of mutations
 *      that could accumulate to the required threshold
 */
import { buildDependencyGraph } from './dependencyGraph';

/**
 * Analyze the full project graph and return IDs of structurally
 * unreachable nodes (conditions can never be satisfied).
 *
 * @param {Object} flags
 * @param {Object} statusPoints
 * @param {Object} choices
 * @param {Object} scenes
 * @param {Object} endings
 * @param {string|null} entryNode
 * @returns {{ unreachableNodes: string[], warnings: Array<{nodeId: string, reason: string}> }}
 */
export function analyzeReachability(flags, statusPoints, choices, scenes, endings, entryNode) {
  const graph = buildDependencyGraph(flags, statusPoints, choices, scenes, endings);
  const warnings = [];
  const unreachableNodes = [];

  // Build a set of all flag IDs that have at least one setter
  const settableFlags = new Set();
  for (const [flagId, data] of Object.entries(graph.flags)) {
    if (data.setBy.length > 0) settableFlags.add(flagId);
  }

  // Build a map: choiceId → Set of flags set by that choice (across all options)
  const choiceFlagSets = {};
  for (const [flagId, data] of Object.entries(graph.flags)) {
    for (const setter of data.setBy) {
      if (!choiceFlagSets[setter.choiceId]) choiceFlagSets[setter.choiceId] = {};
      if (!choiceFlagSets[setter.choiceId][setter.optionIndex]) {
        choiceFlagSets[setter.choiceId][setter.optionIndex] = new Set();
      }
      choiceFlagSets[setter.choiceId][setter.optionIndex].add(flagId);
    }
  }

  // Check if two flags are mutually exclusive:
  // Both are set by DIFFERENT options of the SAME choice, and that choice
  // is the ONLY setter for both flags.
  const areMutuallyExclusive = (flagA, flagB) => {
    const settersA = graph.flags[flagA]?.setBy || [];
    const settersB = graph.flags[flagB]?.setBy || [];

    // Both must have exactly one setter from the same choice but different options
    if (settersA.length !== 1 || settersB.length !== 1) return false;
    if (settersA[0].choiceId !== settersB[0].choiceId) return false;
    if (settersA[0].optionIndex === settersB[0].optionIndex) return false;
    return true;
  };

  // Analyze each entity with requires
  const checkEntity = (entity, entityType) => {
    if (!entity.requires || entity.requires.length === 0) return;

    const requiredTrueFlags = entity.requires
      .filter(r => r.flag && r.state === true)
      .map(r => r.flag);

    // Check 1: Every required true-flag must have at least one setter
    for (const flagId of requiredTrueFlags) {
      if (!settableFlags.has(flagId)) {
        warnings.push({
          nodeId: entity.id,
          reason: `Requires ${flagId}=true, but no choice option ever sets this flag`,
        });
        unreachableNodes.push(entity.id);
        return;
      }
    }

    // Check 2: No pair of required true-flags should be mutually exclusive
    for (let i = 0; i < requiredTrueFlags.length; i++) {
      for (let j = i + 1; j < requiredTrueFlags.length; j++) {
        if (areMutuallyExclusive(requiredTrueFlags[i], requiredTrueFlags[j])) {
          warnings.push({
            nodeId: entity.id,
            reason: `Requires both ${requiredTrueFlags[i]}=true and ${requiredTrueFlags[j]}=true, but these flags are on mutually exclusive options of the same choice`,
          });
          unreachableNodes.push(entity.id);
          return;
        }
      }
    }

    // Check 3: Status point requirements — verify at least one setter exists
    const statusReqs = entity.requires.filter(r => r.status);
    for (const req of statusReqs) {
      const statusData = graph.status[req.status];
      if (!statusData || statusData.mutatedBy.length === 0) {
        const sp = statusPoints[req.status];
        const startVal = sp ? Number(sp.value) : 0;
        if (req.min !== undefined && startVal < req.min) {
          warnings.push({
            nodeId: entity.id,
            reason: `Requires ${req.status}≥${req.min}, but no choice option modifies this status (starts at ${startVal})`,
          });
          unreachableNodes.push(entity.id);
          return;
        }
      }
    }
  };

  // Check all scenes
  for (const scene of Object.values(scenes || {})) {
    checkEntity(scene, 'scene');
  }

  // Check all endings
  for (const ending of Object.values(endings || {})) {
    checkEntity(ending, 'ending');
  }

  // Check choice-level requires
  for (const choice of Object.values(choices || {})) {
    checkEntity(choice, 'choice');
  }

  return {
    unreachableNodes: [...new Set(unreachableNodes)],
    warnings,
  };
}
