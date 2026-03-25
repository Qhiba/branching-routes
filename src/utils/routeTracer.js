/**
 * Route Tracer — BFS backward traversal + flag/status annotation
 *
 * findAllPathsTo(targetId, entryNodeId, adjacency)
 *   BFS from targetId backwards through reverse adjacency,
 *   returns all valid paths as ordered arrays of node IDs (entry → target),
 *   shortest path first.
 *
 * annotatePath(path, choices, scenes, endings, flags, statusPoints)
 *   For each step in a path, annotates which option must be picked,
 *   what flags_set / status_set it produces, and whether those satisfy
 *   the requires conditions of the next node.
 */

/**
 * BFS backward traversal from targetId to entryNodeId.
 * Returns all paths (entry → target), sorted by length (shortest first).
 *
 * @param {string} targetId
 * @param {string} entryNodeId
 * @param {{ forward: Object<string, string[]>, reverse: Object<string, string[]> }} adjacency
 * @returns {string[][]}
 */
export function findAllPathsTo(targetId, entryNodeId, adjacency) {
  if (!targetId || !entryNodeId || !adjacency) return [];
  if (targetId === entryNodeId) return [[entryNodeId]];

  const reverse = adjacency.reverse || {};
  const results = [];
  const MAX_PATHS = 20;
  const MAX_DEPTH = 50;

  // BFS: each queue item is a path built backwards from target.
  // path[0] = current frontier node (walking backwards), path[last] = targetId.
  // When path[0] === entryNodeId, the path is complete and already in forward order.
  const queue = [[targetId]];

  while (queue.length > 0 && results.length < MAX_PATHS) {
    const path = queue.shift();
    const current = path[0];

    if (path.length > MAX_DEPTH) continue;

    const predecessors = reverse[current] || [];
    for (const pred of predecessors) {
      // Avoid cycles within this path
      if (path.includes(pred)) continue;

      const newPath = [pred, ...path];

      if (pred === entryNodeId) {
        // Complete path found: [entry, ..., target]
        results.push(newPath);
      } else {
        queue.push(newPath);
      }
    }
  }

  // Sort by length (shortest first)
  results.sort((a, b) => a.length - b.length);
  return results;
}


/**
 * For a given forward path [nodeA, nodeB, nodeC, ...], determine which
 * option/route must be picked at each step to reach the next node.
 *
 * @param {string[]} path — ordered node IDs from entry to target
 * @param {Object} choices — choices map keyed by ID
 * @param {Object} scenes — scenes map keyed by ID
 * @param {Object} endings — endings map keyed by ID
 * @param {Object} flags — flags map keyed by ID
 * @param {Object} statusPoints — status points map keyed by ID
 * @returns {Array<{
 *   nodeId: string,
 *   nodeType: 'choice'|'scene'|'ending'|'unknown',
 *   nodeName: string,
 *   requires: Array,
 *   pick: object|null,
 *   flagsSet: string[],
 *   statusChanges: Array<{ status: string, statusName: string, amount: number }>,
 *   satisfiesNext: boolean
 * }>}
 */
export function annotatePath(path, choices, scenes, endings, flags, statusPoints) {
  if (!path || path.length === 0) return [];

  const steps = [];

  for (let i = 0; i < path.length; i++) {
    const nodeId = path[i];
    const nextNodeId = i < path.length - 1 ? path[i + 1] : null;

    const choice = choices?.[nodeId];
    const scene = scenes?.[nodeId];
    const ending = endings?.[nodeId];

    const step = {
      nodeId,
      nodeType: choice ? 'choice' : scene ? 'scene' : ending ? 'ending' : 'unknown',
      nodeName: choice?.text || scene?.name || ending?.name || nodeId,
      requires: (choice || scene || ending)?.requires || [],
      pick: null,
      flagsSet: [],
      statusChanges: [],
      satisfiesNext: true,
    };

    // For choice nodes: find which option leads to the next node
    if (nextNodeId && choice && choice.options) {
      for (let optIdx = 0; optIdx < choice.options.length; optIdx++) {
        const opt = choice.options[optIdx];
        const targets = getOptionTargets(opt);
        if (targets.includes(nextNodeId)) {
          step.pick = { label: opt.label || `Option ${optIdx + 1}`, optionIndex: optIdx };
          step.flagsSet = (opt.flags_set || []).map(fId => {
            const flag = flags?.[fId];
            return flag?.name || fId;
          });
          step.flagsSetIds = opt.flags_set || [];
          step.statusChanges = (opt.status_set || []).map(s => ({
            status: s.status,
            statusName: statusPoints?.[s.status]?.name || s.status,
            amount: s.amount,
          }));
          break;
        }
      }
    }

    // For scene nodes: find which route leads to the next node
    if (nextNodeId && scene && scene.next) {
      for (let routeIdx = 0; routeIdx < scene.next.length; routeIdx++) {
        const route = scene.next[routeIdx];
        if (route.target === nextNodeId) {
          step.pick = {
            routeIndex: routeIdx,
            label: route.requires && route.requires.length > 0
              ? `Route ${routeIdx + 1} (conditional)`
              : `Route ${routeIdx + 1} (fallback)`,
            requires: route.requires || [],
          };
          break;
        }
      }
    }

    // Check if the next node's requires are satisfiable given flags set so far
    if (nextNodeId) {
      const nextEntity = choices?.[nextNodeId] || scenes?.[nextNodeId] || endings?.[nextNodeId];
      if (nextEntity?.requires && nextEntity.requires.length > 0) {
        // Collect all flag IDs set along the path up to and including this step
        const flagIdsSetSoFar = new Set();
        for (const prevStep of steps) {
          for (const fId of (prevStep.flagsSetIds || [])) flagIdsSetSoFar.add(fId);
        }
        for (const fId of (step.flagsSetIds || [])) flagIdsSetSoFar.add(fId);

        step.satisfiesNext = nextEntity.requires.every(req => {
          if (req.flag) {
            if (req.state === true) return flagIdsSetSoFar.has(req.flag);
            if (req.state === false) return !flagIdsSetSoFar.has(req.flag);
          }
          // Status requirements are harder to verify statically — assume satisfiable
          return true;
        });
      }
    }

    steps.push(step);
  }

  return steps;
}

/**
 * Extract all target node IDs from a choice option's `next` field.
 * Handles both string and array-of-routes formats.
 */
function getOptionTargets(opt) {
  if (!opt.next) return [];
  if (typeof opt.next === 'string') return [opt.next];
  if (Array.isArray(opt.next)) {
    return opt.next.filter(entry => entry.target).map(entry => entry.target);
  }
  return [];
}

/**
 * Convenience: find paths and annotate them all.
 *
 * @param {string} targetId
 * @param {string} entryNodeId
 * @param {{ forward: Object, reverse: Object }} adjacency
 * @param {Object} choices
 * @param {Object} scenes
 * @param {Object} endings
 * @param {Object} flags
 * @param {Object} statusPoints
 * @returns {{ paths: Array<{ raw: string[], annotated: Array }>, bestPath: { raw: string[], annotated: Array } | null }}
 */
export function traceRoute(targetId, entryNodeId, adjacency, choices, scenes, endings, flags, statusPoints) {
  const rawPaths = findAllPathsTo(targetId, entryNodeId, adjacency);

  const annotatedPaths = rawPaths.map(raw => ({
    raw,
    annotated: annotatePath(raw, choices, scenes, endings, flags, statusPoints),
  }));

  return {
    paths: annotatedPaths,
    bestPath: annotatedPaths.length > 0 ? annotatedPaths[0] : null,
  };
}
