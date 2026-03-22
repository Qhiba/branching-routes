/**
 * Standalone test for buildDependencyGraph
 * Run: node src/utils/dependencyGraph.test.js
 */

// Inline the function since this is a standalone Node script (no bundler)
// We replicate the logic here for testing without ESM/CJS issues.

function buildDependencyGraph(flags, statusPoints, choices, scenes, endings) {
  const flagGraph = {};
  for (const flagId of Object.keys(flags || {})) {
    flagGraph[flagId] = { setBy: [], requiredBy: { choices: [], scenes: [], endings: [] } };
  }

  const statusGraph = {};
  for (const spId of Object.keys(statusPoints || {})) {
    statusGraph[spId] = { mutatedBy: [], requiredBy: { choices: [], scenes: [], endings: [] } };
  }

  const forward = {};
  const reverse = {};

  const addEdge = (sourceId, targetId) => {
    if (!targetId) return;
    if (!forward[sourceId]) forward[sourceId] = new Set();
    forward[sourceId].add(targetId);
    if (!reverse[targetId]) reverse[targetId] = new Set();
    reverse[targetId].add(sourceId);
  };

  for (const choice of Object.values(choices || {})) {
    if (choice.requires) {
      for (const req of choice.requires) {
        if (req.flag && flagGraph[req.flag]) flagGraph[req.flag].requiredBy.choices.push({ id: choice.id, context: 'choice_requires' });
        if (req.status && statusGraph[req.status]) statusGraph[req.status].requiredBy.choices.push({ id: choice.id, context: 'choice_requires' });
      }
    }
    if (choice.options) {
      for (let optIdx = 0; optIdx < choice.options.length; optIdx++) {
        const opt = choice.options[optIdx];
        if (opt.requires) {
          for (const req of opt.requires) {
            if (req.flag && flagGraph[req.flag]) flagGraph[req.flag].requiredBy.choices.push({ id: choice.id, context: 'option_requires', optionIndex: optIdx });
            if (req.status && statusGraph[req.status]) statusGraph[req.status].requiredBy.choices.push({ id: choice.id, context: 'option_requires', optionIndex: optIdx });
          }
        }
        if (opt.flags_set) {
          for (const fId of opt.flags_set) {
            if (flagGraph[fId]) flagGraph[fId].setBy.push({ choiceId: choice.id, optionIndex: optIdx });
          }
        }
        if (opt.status_set) {
          for (const sm of opt.status_set) {
            if (statusGraph[sm.status]) statusGraph[sm.status].mutatedBy.push({ choiceId: choice.id, optionIndex: optIdx, amount: sm.amount });
          }
        }
        if (opt.next) addEdge(choice.id, opt.next);
      }
    }
  }

  for (const scene of Object.values(scenes || {})) {
    if (scene.requires) {
      for (const req of scene.requires) {
        if (req.flag && flagGraph[req.flag]) flagGraph[req.flag].requiredBy.scenes.push({ id: scene.id, context: 'scene_requires' });
        if (req.status && statusGraph[req.status]) statusGraph[req.status].requiredBy.scenes.push({ id: scene.id, context: 'scene_requires' });
      }
    }
    if (scene.next) {
      for (let routeIdx = 0; routeIdx < scene.next.length; routeIdx++) {
        const route = scene.next[routeIdx];
        if (route.requires) {
          for (const req of route.requires) {
            if (req.flag && flagGraph[req.flag]) flagGraph[req.flag].requiredBy.scenes.push({ id: scene.id, context: 'scene_next_requires', routeIndex: routeIdx });
            if (req.status && statusGraph[req.status]) statusGraph[req.status].requiredBy.scenes.push({ id: scene.id, context: 'scene_next_requires', routeIndex: routeIdx });
          }
        }
        if (route.target) addEdge(scene.id, route.target);
      }
    }
  }

  for (const ending of Object.values(endings || {})) {
    if (ending.requires) {
      for (const req of ending.requires) {
        if (req.flag && flagGraph[req.flag]) flagGraph[req.flag].requiredBy.endings.push({ id: ending.id });
        if (req.status && statusGraph[req.status]) statusGraph[req.status].requiredBy.endings.push({ id: ending.id });
      }
    }
  }

  const adjacency = { forward: {}, reverse: {} };
  for (const [k, v] of Object.entries(forward)) adjacency.forward[k] = [...v];
  for (const [k, v] of Object.entries(reverse)) adjacency.reverse[k] = [...v];

  return { flags: flagGraph, status: statusGraph, adjacency };
}

// ── Test Fixtures ───────────────────────────────────────────────────
const testFlags = {
  F001: { id: 'F001', name: 'gave_food', state: false },
  F002: { id: 'F002', name: 'met_king', state: false }
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
    id: 'S001', name: 'village',
    requires: [{ flag: 'F001', state: true }],
    next: [
      { requires: [{ flag: 'F002', state: true }], target: 'E001' },
      { requires: [], target: 'CH002' }
    ]
  },
  S002: { id: 'S002', name: 'forest', requires: [], next: [{ requires: [], target: 'CH001' }] }
};

const testEndings = {
  E001: {
    id: 'E001', name: 'good_ending',
    requires: [{ flag: 'F001', state: true }, { flag: 'F002', state: true }, { status: 'SP001', min: 5 }]
  }
};

// ── Run Tests ───────────────────────────────────────────────────────
const graph = buildDependencyGraph(testFlags, testStatus, testChoices, testScenes, testEndings);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ FAIL: ${label}`); }
}

console.log('\n=== Flag Layer ===');
assert(graph.flags.F001.setBy.length === 1, 'F001 set by exactly 1 option');
assert(graph.flags.F001.setBy[0].choiceId === 'CH001' && graph.flags.F001.setBy[0].optionIndex === 0, 'F001 set by CH001 opt 0');
assert(graph.flags.F002.setBy.length === 1 && graph.flags.F002.setBy[0].choiceId === 'CH002', 'F002 set by CH002 opt 0');

assert(graph.flags.F001.requiredBy.choices.length === 1, 'F001 required by 1 choice (CH002 choice-level)');
assert(graph.flags.F001.requiredBy.choices[0].context === 'choice_requires', 'F001 required with choice_requires context');
assert(graph.flags.F001.requiredBy.scenes.length === 1, 'F001 required by 1 scene (S001 scene_requires)');
assert(graph.flags.F001.requiredBy.endings.length === 1, 'F001 required by 1 ending (E001)');

assert(graph.flags.F002.requiredBy.scenes.length === 1, 'F002 required by 1 scene route (S001.next[0])');
assert(graph.flags.F002.requiredBy.scenes[0].context === 'scene_next_requires', 'F002 context is scene_next_requires');
assert(graph.flags.F002.requiredBy.endings.length === 1, 'F002 required by E001');

console.log('\n=== Status Layer ===');
assert(graph.status.SP001.mutatedBy.length === 1, 'SP001 mutated by 1 option');
assert(graph.status.SP001.mutatedBy[0].amount === 2, 'SP001 mutation amount is 2');
assert(graph.status.SP001.requiredBy.choices.length === 1, 'SP001 required by 1 choice option');
assert(graph.status.SP001.requiredBy.choices[0].context === 'option_requires', 'SP001 context is option_requires');
assert(graph.status.SP001.requiredBy.endings.length === 1, 'SP001 required by E001');

console.log('\n=== Navigation Adjacency ===');
assert(JSON.stringify(graph.adjacency.forward['CH001'].sort()) === JSON.stringify(['S001', 'S002']), 'CH001 → S001, S002');
assert(graph.adjacency.forward['CH002'].includes('E001'), 'CH002 → E001');
assert(JSON.stringify(graph.adjacency.forward['S001'].sort()) === JSON.stringify(['CH002', 'E001']), 'S001 → CH002, E001');
assert(graph.adjacency.forward['S002'].includes('CH001'), 'S002 → CH001');

assert(graph.adjacency.reverse['S001'].includes('CH001'), 'S001 ← CH001');
assert(graph.adjacency.reverse['S002'].includes('CH001'), 'S002 ← CH001');
assert(graph.adjacency.reverse['E001'].includes('CH002'), 'E001 ← CH002');
assert(graph.adjacency.reverse['E001'].includes('S001'), 'E001 ← S001');
assert(graph.adjacency.reverse['CH002'].includes('S001'), 'CH002 ← S001');
assert(graph.adjacency.reverse['CH001'].includes('S002'), 'CH001 ← S002');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
