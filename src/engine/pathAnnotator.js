// ============================================================
// pathAnnotator.js — Annotates routes with contextual info
// ============================================================
// Adds chapter, path, flags set, and status deltas per step
// to a traced route. Pure function, no store subscriptions.
//
// Key export:
//   annotatePath(path, narrativeData) → AnnotatedPath
//
// Dependencies: None
// ============================================================

/**
 * @typedef {object} AnnotatedStep
 * @property {string} nodeId — ID of the node at this step
 * @property {number} stepIndex — 0-based step index
 * @property {string|null} entityType — 'common' | 'choice' | 'ending'
 * @property {string} name — entity name or text
 * @property {string|null} chapterId — chapter ID, if assigned
 * @property {string|null} chapterName — chapter name, if found
 * @property {string|null} pathId — path ID, if assigned
 * @property {string|null} pathName — path name, if found
 * @property {string[]} flagsSet — flag IDs set by visiting this node
 * @property {Array<{ status: string, amount: number }>} statusDeltas — status changes
 * @property {string|null} edgeToNext — edge ID connecting to next step
 * @property {boolean|null} edgeConditionMet — whether the connecting edge's condition passed
 */

/**
 * @typedef {object} AnnotatedPath
 * @property {AnnotatedStep[]} steps — annotated steps
 * @property {number} totalNodes — total nodes in the path
 * @property {string} summary — human-readable summary string
 */

/**
 * Annotate each node in a path with contextual information from
 * the narrative data model.
 *
 * @param {object} path — Path object from routeTracer { nodeIds, edges }
 * @param {object} narrativeData — full narrative data
 *   { common, choice, ending, flag, status, path, chapter }
 * @returns {AnnotatedPath}
 */
export function annotatePath(path, narrativeData) {
  if (!path || !path.nodeIds || path.nodeIds.length === 0) {
    return { steps: [], totalNodes: 0, summary: 'Empty path' };
  }

  const {
    common = {},
    choice = {},
    ending = {},
    flag: flagEntities = {},
    status: statusEntities = {},
    path: pathEntities = {},
    chapter: chapterEntities = {},
  } = narrativeData;

  const steps = path.nodeIds.map((nodeId, index) => {
    // Find the entity
    let entity = null;
    let entityType = null;

    if (common[nodeId]) {
      entity = common[nodeId];
      entityType = 'common';
    } else if (choice[nodeId]) {
      entity = choice[nodeId];
      entityType = 'choice';
    } else if (ending[nodeId]) {
      entity = ending[nodeId];
      entityType = 'ending';
    }

    // Name/text
    const name = entity
      ? (entity.name || entity.text || entity.id)
      : nodeId;

    // Chapter info
    const chapterId = entity?.chapter ?? null;
    const chapterName = chapterId && chapterEntities[chapterId]
      ? chapterEntities[chapterId].name
      : null;

    // Path info
    const pathId = entity?.path ?? null;
    const pathName = pathId && pathEntities[pathId]
      ? pathEntities[pathId].name
      : null;

    // Flags set by this node
    let flagsSet = [];
    if (entityType === 'common' && entity.flags_set) {
      flagsSet = entity.flags_set.map((fid) => ({
        id: fid,
        name: flagEntities[fid]?.name ?? fid,
      }));
    }
    // For choices, collect flags from all options (summary view)
    if (entityType === 'choice' && entity.options) {
      const allOptionFlags = new Set();
      for (const opt of entity.options) {
        for (const fid of (opt.flags_set || [])) {
          allOptionFlags.add(fid);
        }
      }
      flagsSet = [...allOptionFlags].map((fid) => ({
        id: fid,
        name: flagEntities[fid]?.name ?? fid,
      }));
    }

    // Status deltas from this node
    let statusDeltas = [];
    if (entityType === 'common' && entity.status_set) {
      statusDeltas = entity.status_set.map((d) => ({
        status: d.status,
        statusName: statusEntities[d.status]?.name ?? d.status,
        amount: d.amount,
      }));
    }
    if (entityType === 'choice' && entity.options) {
      const deltaMap = new Map();
      for (const opt of entity.options) {
        for (const d of (opt.status_set || [])) {
          if (!deltaMap.has(d.status)) {
            deltaMap.set(d.status, {
              status: d.status,
              statusName: statusEntities[d.status]?.name ?? d.status,
              amount: d.amount,
            });
          }
        }
      }
      statusDeltas = [...deltaMap.values()];
    }

    // Edge to next step
    const edgeInfo = path.edges?.[index] ?? null;

    return {
      nodeId,
      stepIndex: index,
      entityType,
      name,
      chapterId,
      chapterName,
      pathId,
      pathName,
      flagsSet,
      statusDeltas,
      edgeToNext: edgeInfo?.edgeId ?? null,
      edgeConditionMet: edgeInfo?.conditionMet ?? null,
    };
  });

  // Build summary: "N001 → CH002 → N005 → E001, 4 nodes"
  const summary = path.nodeIds.join(' → ') + `, ${path.nodeIds.length} nodes`;

  return {
    steps,
    totalNodes: path.nodeIds.length,
    summary,
  };
}
