/**
 * Standalone test for routeTracer — BFS backward traversal + annotation
 * Run: node src/utils/routeTracer.test.js
 */

// ── Inline the functions (standalone Node script, no bundler) ──

function findAllPathsTo(targetId, entryNodeId, adjacency) {
  if (!targetId || !entryNodeId || !adjacency) return [];
  if (targetId === entryNodeId) return [[entryNodeId]];

  const reverse = adjacency.reverse || {};
  const results = [];
  const MAX_PATHS = 20;
  const MAX_DEPTH = 50;

  const queue = [[targetId]];

  while (queue.length > 0 && results.length < MAX_PATHS) {
    const path = queue.shift();
    const current = path[0];
    if (path.length > MAX_DEPTH) continue;

    const predecessors = reverse[current] || [];
    for (const pred of predecessors) {
      if (path.includes(pred)) continue;
      const newPath = [pred, ...path];
      if (pred === entryNodeId) {
        results.push(newPath);
      } else {
        queue.push(newPath);
      }
    }
  }

  results.sort((a, b) => a.length - b.length);
  return results;
}

function getOptionTargets(opt) {
  if (!opt.next) return [];
  if (typeof opt.next === 'string') return [opt.next];
  if (Array.isArray(opt.next)) {
    return opt.next.filter(entry => entry.target).map(entry => entry.target);
  }
  return [];
}

function annotatePath(path, choices, scenes, endings, flags, statusPoints) {
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
      flagsSetIds: [],
      statusChanges: [],
      satisfiesNext: true,
    };

    if (nextNodeId && choice && choice.options) {
      for (let optIdx = 0; optIdx < choice.options.length; optIdx++) {
        const opt = choice.options[optIdx];
        const targets = getOptionTargets(opt);
        if (targets.includes(nextNodeId)) {
          step.pick = { label: opt.label || `Option ${optIdx + 1}`, optionIndex: optIdx };
          step.flagsSet = (opt.flags_set || []).map(fId => flags?.[fId]?.name || fId);
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

    if (scene) {
      step.flagsSet = (scene.flags_set || []).map(fId => flags?.[fId]?.name || fId);
      step.flagsSetIds = scene.flags_set || [];
      step.statusChanges = (scene.status_set || []).map(s => ({
        status: s.status,
        statusName: statusPoints?.[s.status]?.name || s.status,
        amount: s.amount,
      }));

      if (nextNodeId && scene.next) {
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
    }

    if (nextNodeId) {
      const nextEntity = choices?.[nextNodeId] || scenes?.[nextNodeId] || endings?.[nextNodeId];
      if (nextEntity?.requires && nextEntity.requires.length > 0) {
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
          return true;
        });
      }
    }

    steps.push(step);
  }

  return steps;
}

// ── Test Fixtures ───────────────────────────────────────────────────

const testFlags = {
  F001: { id: 'F001', name: 'gave_food', state: false, path: null, chapter: null },
  F002: { id: 'F002', name: 'met_king', state: false, path: 'P001', chapter: null }
};

const testStatus = {
  SP001: { id: 'SP001', name: 'strength', value: 0 }
};

const testChoices = {
  CH001: {
    id: 'CH001', text: 'Give food?', requires: [],
    options: [
      { label: 'Yes', requires: [], flags_set: ['F001'], status_set: [{ status: 'SP001', amount: 2 }], next: 'S001' },
      { label: 'No', requires: [], flags_set: [], status_set: [], next: 'S002' }
    ]
  },
  CH002: {
    id: 'CH002', text: 'Meet king?',
    requires: [{ flag: 'F001', state: true }],
    options: [
      { label: 'Bow', requires: [{ status: 'SP001', min: 1 }], flags_set: ['F002'], status_set: [], next: 'E001' }
    ]
  }
};

const testScenes = {
  S001: {
    id: 'S001', name: 'village', type: 'dialogue',
    requires: [{ flag: 'F001', state: true }],
    flags_set: ['F002'], status_set: [{ status: 'SP001', amount: 3 }],
    next: [
      { requires: [{ flag: 'F002', state: true }], target: 'E001' },
      { requires: [], target: 'CH002' }
    ]
  },
  S002: { id: 'S002', name: 'forest', type: null, requires: [], flags_set: [], status_set: [], next: [{ requires: [], target: 'CH001' }] }
};

const testEndings = {
  E001: {
    id: 'E001', name: 'good_ending',
    requires: [{ flag: 'F001', state: true }, { flag: 'F002', state: true }, { status: 'SP001', min: 5 }]
  }
};

// Build adjacency (simplified from dependencyGraph)
function buildAdjacency(choices, scenes) {
  const forward = {};
  const reverse = {};
  const addEdge = (src, tgt) => {
    if (!tgt) return;
    if (!forward[src]) forward[src] = [];
    if (!forward[src].includes(tgt)) forward[src].push(tgt);
    if (!reverse[tgt]) reverse[tgt] = [];
    if (!reverse[tgt].includes(src)) reverse[tgt].push(src);
  };

  for (const choice of Object.values(choices || {})) {
    if (choice.options) {
      for (const opt of choice.options) {
        if (typeof opt.next === 'string') addEdge(choice.id, opt.next);
        if (Array.isArray(opt.next)) {
          for (const entry of opt.next) {
            if (entry.target) addEdge(choice.id, entry.target);
          }
        }
      }
    }
  }
  for (const scene of Object.values(scenes || {})) {
    if (scene.next) {
      for (const route of scene.next) {
        if (route.target) addEdge(scene.id, route.target);
      }
    }
  }
  return { forward, reverse };
}

const adjacency = buildAdjacency(testChoices, testScenes);

// ── Run Tests ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ FAIL: ${label}`); }
}

console.log('\n=== findAllPathsTo ===');

// Test: CH001 → E001 (two paths exist)
const pathsToE001 = findAllPathsTo('E001', 'CH001', adjacency);
assert(pathsToE001.length >= 2, `At least 2 paths from CH001 to E001 (got ${pathsToE001.length})`);
assert(pathsToE001[0][0] === 'CH001', 'Shortest path starts at CH001');
assert(pathsToE001[0][pathsToE001[0].length - 1] === 'E001', 'Shortest path ends at E001');

// The shortest path should be CH001 → S001 → E001 (via S001's conditional route to E001)
const shortest = pathsToE001[0];
assert(shortest.length === 3, `Shortest path has 3 nodes (got ${shortest.length})`);
assert(shortest[1] === 'S001', 'Step 2 is S001');

// The longer path should be CH001 → S001 → CH002 → E001
const longer = pathsToE001[1];
assert(longer.length === 4, `Longer path has 4 nodes (got ${longer.length})`);
assert(longer[2] === 'CH002', 'Longer path step 3 is CH002');

// Test: CH001 → S001 (direct)
const pathsToS001 = findAllPathsTo('S001', 'CH001', adjacency);
assert(pathsToS001.length >= 1, 'At least 1 path from CH001 to S001');
assert(pathsToS001[0].length === 2, 'Direct path CH001 → S001 has 2 nodes');

// Test: same node
const pathsSame = findAllPathsTo('CH001', 'CH001', adjacency);
assert(pathsSame.length === 1, 'Path to self returns 1 path');
assert(pathsSame[0].length === 1, 'Self-path has 1 node');

// Test: no path exists
const pathsNone = findAllPathsTo('S002', 'E001', adjacency);
assert(pathsNone.length === 0, 'No path from E001 to S002 (E001 is terminal)');

// Test: null/undefined inputs
assert(findAllPathsTo(null, 'CH001', adjacency).length === 0, 'Null target returns empty');
assert(findAllPathsTo('E001', null, adjacency).length === 0, 'Null entry returns empty');
assert(findAllPathsTo('E001', 'CH001', null).length === 0, 'Null adjacency returns empty');

console.log('\n=== annotatePath (shortest path: CH001 → S001 → E001) ===');

// Annotate the shortest path to E001 (CH001 → S001 → E001)
const annotatedShort = annotatePath(shortest, testChoices, testScenes, testEndings, testFlags, testStatus);
assert(annotatedShort.length === 3, `Annotated shortest path has 3 steps (got ${annotatedShort.length})`);

// Step 1: CH001 (choice) — should pick "Yes" option (leads to S001)
assert(annotatedShort[0].nodeType === 'choice', 'Step 1 is a choice');
assert(annotatedShort[0].nodeId === 'CH001', 'Step 1 is CH001');
assert(annotatedShort[0].pick !== null, 'Step 1 has a pick');
assert(annotatedShort[0].pick.label === 'Yes', 'Step 1 picks "Yes"');
assert(annotatedShort[0].pick.optionIndex === 0, 'Step 1 picks option index 0');
assert(annotatedShort[0].flagsSet.length === 1, 'Step 1 sets 1 flag');
assert(annotatedShort[0].flagsSet[0] === 'gave_food', 'Step 1 sets gave_food');
assert(annotatedShort[0].statusChanges.length === 1, 'Step 1 has 1 status change');
assert(annotatedShort[0].statusChanges[0].amount === 2, 'Step 1 adds +2');
assert(annotatedShort[0].statusChanges[0].statusName === 'strength', 'Step 1 changes strength');

// Step 2: S001 (scene) — should pick route 0 (conditional, leads to E001)
assert(annotatedShort[1].nodeType === 'scene', 'Step 2 is a scene');
assert(annotatedShort[1].nodeId === 'S001', 'Step 2 is S001');
assert(annotatedShort[1].pick !== null, 'Step 2 has a pick');
assert(annotatedShort[1].pick.routeIndex === 0, 'Step 2 picks route index 0 (conditional to E001)');

// Step 3: E001 (ending) — no pick (terminal)
assert(annotatedShort[2].nodeType === 'ending', 'Step 3 is an ending');
assert(annotatedShort[2].nodeId === 'E001', 'Step 3 is E001');
assert(annotatedShort[2].pick === null, 'Step 3 has no pick (terminal)');

// Test satisfiesNext: CH001 sets F001, S001 requires F001=true → should satisfy
assert(annotatedShort[0].satisfiesNext === true, 'CH001 satisfies S001 requires (F001 set)');

// Step 2: S001 scene-level flags_set and status_set
assert(annotatedShort[1].flagsSet.length === 1, 'S001 scene sets 1 flag');
assert(annotatedShort[1].flagsSet[0] === 'met_king', 'S001 scene sets met_king');
assert(annotatedShort[1].flagsSetIds.includes('F002'), 'S001 scene flagsSetIds includes F002');
assert(annotatedShort[1].statusChanges.length === 1, 'S001 scene has 1 status change');
assert(annotatedShort[1].statusChanges[0].amount === 3, 'S001 scene adds +3 status');
assert(annotatedShort[1].statusChanges[0].statusName === 'strength', 'S001 scene changes strength');

console.log('\n=== annotatePath (longer path: CH001 → S001 → CH002 → E001) ===');

// Annotate the longer path
const annotatedLong = annotatePath(longer, testChoices, testScenes, testEndings, testFlags, testStatus);
assert(annotatedLong.length === 4, `Annotated longer path has 4 steps (got ${annotatedLong.length})`);

// Step 2: S001 picks route 1 (fallback to CH002)
assert(annotatedLong[1].pick.routeIndex === 1, 'Longer path: S001 picks route index 1 (fallback to CH002)');

// Step 2: S001 scene-level flags in longer path
assert(annotatedLong[1].flagsSetIds.includes('F002'), 'Longer path: S001 scene sets F002');

// Step 3: CH002 picks "Bow"
assert(annotatedLong[2].nodeType === 'choice', 'Longer path: Step 3 is a choice');
assert(annotatedLong[2].nodeId === 'CH002', 'Longer path: Step 3 is CH002');
assert(annotatedLong[2].pick !== null, 'Longer path: Step 3 has a pick');
assert(annotatedLong[2].pick.label === 'Bow', 'Longer path: Step 3 picks "Bow"');
assert(annotatedLong[2].flagsSetIds.includes('F002'), 'Longer path: Step 3 sets F002');

// Step 4: E001 (ending)
assert(annotatedLong[3].nodeType === 'ending', 'Longer path: Step 4 is an ending');
assert(annotatedLong[3].pick === null, 'Longer path: Step 4 has no pick');

// Test satisfiesNext: CH002 sets F002, E001 requires F001=true AND F002=true
// At step CH002, F001 was set by CH001 and F002 is set by CH002 → should satisfy flag requirements
assert(annotatedLong[2].satisfiesNext === true, 'CH002 satisfies E001 flag requirements');

console.log('\n=== Edge Cases ===');

// Empty path
const emptyAnnotated = annotatePath([], testChoices, testScenes, testEndings, testFlags, testStatus);
assert(emptyAnnotated.length === 0, 'Empty path returns empty annotation');

// Single node path
const singleAnnotated = annotatePath(['CH001'], testChoices, testScenes, testEndings, testFlags, testStatus);
assert(singleAnnotated.length === 1, 'Single node path returns 1 step');
assert(singleAnnotated[0].pick === null, 'Single node has no pick (no next)');

// Path with array-style next
const choicesWithArrayNext = {
  CH_ARR: {
    id: 'CH_ARR', text: 'Array next test', requires: [],
    options: [
      { label: 'Go', requires: [], flags_set: [], status_set: [], next: [{ requires: [], target: 'S001' }] }
    ]
  }
};
const arrAdjacency = buildAdjacency({ ...testChoices, ...choicesWithArrayNext }, testScenes);
const arrPaths = findAllPathsTo('S001', 'CH_ARR', arrAdjacency);
assert(arrPaths.length >= 1, 'Path found with array-style next');
const arrAnnotated = annotatePath(arrPaths[0], { ...testChoices, ...choicesWithArrayNext }, testScenes, testEndings, testFlags, testStatus);
assert(arrAnnotated[0].pick !== null, 'Array-style next option is picked correctly');
assert(arrAnnotated[0].pick.label === 'Go', 'Array-style next picks correct label');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
