// ============================================================
// __test_phase12.js — Phase 12: Route Tracing Tests
// ============================================================
// Tests for:
//   1. findAllPaths — DFS all-paths with cycle detection
//   2. findShortestPath — BFS shortest path
//   3. findPathToGoal — Mode A goal-directed pathfinding
//   4. findRequirementsForGoal — Mode B requirement analysis
//   5. filterPaths — path filtering by path/chapter/flag/status
//   6. annotatePath — path annotation with contextual info
//
// Run: node --import ./src/tests/_register.mjs src/tests/__test_phase12.js
// ============================================================

import {
  findAllPaths,
  findShortestPath,
  findPathToGoal,
  findRequirementsForGoal,
  filterPaths,
} from '../engine/routeTracer.js';

import { annotatePath } from '../engine/pathAnnotator.js';

// ── Test infrastructure ─────────────────────────────────────

let _passed = 0;
let _failed = 0;

function assert(condition, label) {
  if (condition) {
    _passed++;
    console.log(`  ✅ PASS — ${label}`);
  } else {
    _failed++;
    console.error(`  ❌ FAIL — ${label}`);
  }
}

function assertEq(actual, expected, label) {
  const pass = actual === expected;
  if (pass) {
    _passed++;
    console.log(`  ✅ PASS — ${label}`);
  } else {
    _failed++;
    console.error(`  ❌ FAIL — ${label} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
  }
}

function assertDeepIncludes(arr, value, label) {
  const pass = arr.some((v) => JSON.stringify(v) === JSON.stringify(value));
  if (pass) {
    _passed++;
    console.log(`  ✅ PASS — ${label}`);
  } else {
    _failed++;
    console.error(`  ❌ FAIL — ${label} (value ${JSON.stringify(value)} not found in array)`);
  }
}

function group(name) {
  console.log(`\n══ ${name} ══`);
}

function summary() {
  console.log(`\n════════════════════════════════════════`);
  console.log(`  Results: ${_passed} passed, ${_failed} failed`);
  console.log(`════════════════════════════════════════`);
  if (_failed === 0) {
    console.log('  🎉 ALL TESTS PASSED');
  } else {
    console.error(`  ⚠️  ${_failed} TEST(S) FAILED`);
  }
}

// ── Fixtures ────────────────────────────────────────────────

function mkCond(operator, conditions) {
  return { operator, conditions };
}
function emptyReq() {
  return { operator: 'and', conditions: [] };
}
function flagCond(flag, state) {
  return { id: `cond_${flag}`, flag, state };
}
function statusCond(status, min, max) {
  const c = { id: `cond_${status}`, status };
  if (min != null) c.min = min;
  if (max != null) c.max = max;
  return c;
}

/** Simple linear graph: N001 → N002 → N003 → E001 */
function linearGraph() {
  return {
    common: {
      N001: { id: 'N001', name: 'start', chapter: 'C001', path: 'P001', requires: emptyReq(), next: [{ id: 'nx1', target: 'N002', requires: emptyReq() }], flags_set: ['F001'], status_set: [{ status: 'SP001', amount: 5 }], variants: [], _position: { x: 0, y: 0 } },
      N002: { id: 'N002', name: 'middle', chapter: 'C001', path: 'P001', requires: emptyReq(), next: [{ id: 'nx2', target: 'N003', requires: emptyReq() }], flags_set: [], status_set: [], variants: [], _position: { x: 100, y: 0 } },
      N003: { id: 'N003', name: 'last', chapter: 'C002', path: 'P002', requires: emptyReq(), next: [{ id: 'nx3', target: 'E001', requires: emptyReq() }], flags_set: ['F002'], status_set: [{ status: 'SP001', amount: -2 }], variants: [], _position: { x: 200, y: 0 } },
    },
    choice: {},
    ending: { E001: { id: 'E001', name: 'good_ending', type: 'good_end', chapter: 'C002', path: 'P002', requires: emptyReq(), _position: { x: 300, y: 0 } } },
    flag: { F001: { id: 'F001', name: 'key_found', state: false }, F002: { id: 'F002', name: 'boss_defeated', state: false } },
    status: { SP001: { id: 'SP001', name: 'health', value: 10, minValue: 0, maxValue: 100 } },
    path: { P001: { id: 'P001', name: 'main_path' }, P002: { id: 'P002', name: 'side_path' } },
    chapter: { C001: { id: 'C001', name: 'chapter_one' }, C002: { id: 'C002', name: 'chapter_two' } },
    metadata: { version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04', entry_node: 'N001', common_node_types: [], ending_types: [] },
    quest: {},
  };
}

/** Branching graph: N001 → N002 → E001, N001 → N003 → E001 */
function branchingGraph() {
  return {
    common: {
      N001: { id: 'N001', name: 'start', requires: emptyReq(), next: [{ id: 'nx1', target: 'N002', requires: emptyReq() }, { id: 'nx2', target: 'N003', requires: emptyReq() }], flags_set: [], status_set: [], chapter: null, path: null, variants: [] },
      N002: { id: 'N002', name: 'path_a', requires: emptyReq(), next: [{ id: 'nx3', target: 'E001', requires: emptyReq() }], flags_set: ['F001'], status_set: [], chapter: null, path: 'P001', variants: [] },
      N003: { id: 'N003', name: 'path_b', requires: emptyReq(), next: [{ id: 'nx4', target: 'E001', requires: emptyReq() }], flags_set: [], status_set: [{ status: 'SP001', amount: 3 }], chapter: 'C001', path: null, variants: [] },
    },
    choice: {},
    ending: { E001: { id: 'E001', name: 'end', requires: emptyReq(), chapter: null, path: null } },
    flag: { F001: { id: 'F001', name: 'flag_a', state: false } },
    status: { SP001: { id: 'SP001', name: 'score', value: 0 } },
    path: { P001: { id: 'P001', name: 'alpha' } },
    chapter: { C001: { id: 'C001', name: 'ch1' } },
    metadata: { version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04', entry_node: 'N001', common_node_types: [], ending_types: [] },
    quest: {},
  };
}

/** Graph with conditions: N001 → N002 (requires F001=true) → E001 */
function conditionalGraph() {
  return {
    common: {
      N001: { id: 'N001', name: 'start', requires: emptyReq(), next: [{ id: 'nx1', target: 'N002', requires: mkCond('and', [flagCond('F001', true)]) }], flags_set: [], status_set: [], chapter: null, path: null, variants: [] },
      N002: { id: 'N002', name: 'gated', requires: emptyReq(), next: [{ id: 'nx2', target: 'E001', requires: emptyReq() }], flags_set: [], status_set: [], chapter: null, path: null, variants: [] },
    },
    choice: {},
    ending: { E001: { id: 'E001', name: 'end', requires: emptyReq(), chapter: null, path: null } },
    flag: { F001: { id: 'F001', name: 'key', state: false } },
    status: {},
    path: {}, chapter: {},
    metadata: { version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04', entry_node: 'N001', common_node_types: [], ending_types: [] },
    quest: {},
  };
}

/** Graph with choice node: N001 → CH001 (opt1→N002, opt2→E001) → ... */
function choiceGraph() {
  return {
    common: {
      N001: { id: 'N001', name: 'start', requires: emptyReq(), next: [{ id: 'nx1', target: 'CH001', requires: emptyReq() }], flags_set: [], status_set: [], chapter: null, path: null, variants: [] },
      N002: { id: 'N002', name: 'after_choice', requires: emptyReq(), next: [{ id: 'nx2', target: 'E001', requires: emptyReq() }], flags_set: [], status_set: [], chapter: null, path: null, variants: [] },
    },
    choice: {
      CH001: { id: 'CH001', text: 'pick one', requires: emptyReq(), options: [
        { id: 'opt1', label: 'Go left', requires: emptyReq(), flags_set: ['F001'], status_set: [], next: [{ id: 'onx1', target: 'N002', requires: emptyReq() }] },
        { id: 'opt2', label: 'Go right', requires: emptyReq(), flags_set: [], status_set: [{ status: 'SP001', amount: 10 }], next: [{ id: 'onx2', target: 'E001', requires: emptyReq() }] },
      ], chapter: null, path: null },
    },
    ending: { E001: { id: 'E001', name: 'end', requires: emptyReq(), chapter: null, path: null } },
    flag: { F001: { id: 'F001', name: 'went_left', state: false } },
    status: { SP001: { id: 'SP001', name: 'points', value: 0 } },
    path: {}, chapter: {},
    metadata: { version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04', entry_node: 'N001', common_node_types: [], ending_types: [] },
    quest: {},
  };
}

// ════════════════════════════════════════════════════════════
// SECTION A — findAllPaths
// ════════════════════════════════════════════════════════════

function testFindAllPaths() {
  group('findAllPaths');
  const flags = {};
  const statuses = {};

  // A.1 Linear graph: exactly one path
  {
    const g = linearGraph();
    const paths = findAllPaths(g, 'N001', 'E001', flags, statuses);
    assertEq(paths.length, 1, 'A.1 Linear graph → 1 path');
    assertEq(paths[0].nodeIds.length, 4, 'A.2 Path has 4 nodes (N001→N002→N003→E001)');
    assertEq(paths[0].nodeIds[0], 'N001', 'A.3 Path starts at N001');
    assertEq(paths[0].nodeIds[3], 'E001', 'A.4 Path ends at E001');
    assertEq(paths[0].edges.length, 3, 'A.5 Path has 3 edges');
  }

  // A.2 Branching graph: two paths
  {
    const g = branchingGraph();
    const paths = findAllPaths(g, 'N001', 'E001', flags, statuses);
    assertEq(paths.length, 2, 'A.6 Branching graph → 2 paths');
    const pathLens = paths.map(p => p.length).sort();
    assertEq(pathLens[0], 3, 'A.7 Both paths have length 3');
    assertEq(pathLens[1], 3, 'A.8 Both paths have length 3');
  }

  // A.3 Same source and target → single path with 1 node
  {
    const g = linearGraph();
    const paths = findAllPaths(g, 'N001', 'N001', flags, statuses);
    assertEq(paths.length, 1, 'A.9 Same src/tgt → 1 path');
    assertEq(paths[0].nodeIds.length, 1, 'A.10 Path has 1 node');
    assertEq(paths[0].edges.length, 0, 'A.11 Path has 0 edges');
  }

  // A.4 Nonexistent source → empty
  {
    const g = linearGraph();
    const paths = findAllPaths(g, 'NOPE', 'E001', flags, statuses);
    assertEq(paths.length, 0, 'A.12 Nonexistent source → 0 paths');
  }

  // A.5 Nonexistent target → empty
  {
    const g = linearGraph();
    const paths = findAllPaths(g, 'N001', 'NOPE', flags, statuses);
    assertEq(paths.length, 0, 'A.13 Nonexistent target → 0 paths');
  }

  // A.6 Conditional edge blocks path when flag not set
  {
    const g = conditionalGraph();
    const paths = findAllPaths(g, 'N001', 'E001', { F001: false }, statuses);
    assertEq(paths.length, 0, 'A.14 Conditional edge blocked → 0 paths');
  }

  // A.7 Conditional edge passes when flag set
  {
    const g = conditionalGraph();
    const paths = findAllPaths(g, 'N001', 'E001', { F001: true }, statuses);
    assertEq(paths.length, 1, 'A.15 Conditional edge passes → 1 path');
  }

  // A.8 Choice graph traversal
  {
    const g = choiceGraph();
    const paths = findAllPaths(g, 'N001', 'E001', flags, statuses);
    assertEq(paths.length, 2, 'A.16 Choice graph → 2 paths (via opt1→N002→E001 and opt2→E001)');
  }

  // A.9 Edge objects have correct shape
  {
    const g = linearGraph();
    const paths = findAllPaths(g, 'N001', 'N002', flags, statuses);
    assertEq(paths.length, 1, 'A.17 Single edge path found');
    const edge = paths[0].edges[0];
    assertEq(edge.from, 'N001', 'A.18 Edge.from = N001');
    assertEq(edge.to, 'N002', 'A.19 Edge.to = N002');
    assert(typeof edge.edgeId === 'string', 'A.20 Edge.edgeId is string');
    assertEq(edge.conditionMet, true, 'A.21 Edge.conditionMet = true');
  }

  // A.10 Disconnected nodes → no path
  {
    const g = linearGraph();
    const paths = findAllPaths(g, 'N003', 'N001', flags, statuses);
    assertEq(paths.length, 0, 'A.22 Reverse direction in DAG → 0 paths');
  }

  // A.11 Empty graph
  {
    const g = { common: {}, choice: {}, ending: {}, flag: {}, status: {}, path: {}, chapter: {}, metadata: {}, quest: {} };
    const paths = findAllPaths(g, 'N001', 'E001', flags, statuses);
    assertEq(paths.length, 0, 'A.23 Empty graph → 0 paths');
  }
}

// ════════════════════════════════════════════════════════════
// SECTION B — findShortestPath
// ════════════════════════════════════════════════════════════

function testFindShortestPath() {
  group('findShortestPath');
  const flags = {};
  const statuses = {};

  // B.1 Linear graph shortest path
  {
    const g = linearGraph();
    const path = findShortestPath(g, 'N001', 'E001', flags, statuses);
    assert(path != null, 'B.1 Shortest path found');
    assertEq(path.length, 4, 'B.2 Shortest path length = 4');
    assertEq(path.nodeIds[0], 'N001', 'B.3 Starts at N001');
    assertEq(path.nodeIds[3], 'E001', 'B.4 Ends at E001');
  }

  // B.2 Branching graph: shortest is 3 (both equally short)
  {
    const g = branchingGraph();
    const path = findShortestPath(g, 'N001', 'E001', flags, statuses);
    assert(path != null, 'B.5 Shortest path found in branching graph');
    assertEq(path.length, 3, 'B.6 Shortest = 3 nodes');
  }

  // B.3 Same node → length 1
  {
    const g = linearGraph();
    const path = findShortestPath(g, 'N001', 'N001', flags, statuses);
    assert(path != null, 'B.7 Same node path found');
    assertEq(path.length, 1, 'B.8 Length = 1');
    assertEq(path.edges.length, 0, 'B.9 Edges = 0');
  }

  // B.4 Nonexistent node → null
  {
    const g = linearGraph();
    const path = findShortestPath(g, 'NOPE', 'E001', flags, statuses);
    assertEq(path, null, 'B.10 Nonexistent source → null');
  }

  // B.5 No path exists → null
  {
    const g = linearGraph();
    const path = findShortestPath(g, 'E001', 'N001', flags, statuses);
    assertEq(path, null, 'B.11 Reverse direction → null');
  }

  // B.6 Conditional edge blocks shortest path
  {
    const g = conditionalGraph();
    const path = findShortestPath(g, 'N001', 'E001', { F001: false }, statuses);
    assertEq(path, null, 'B.12 Blocked by condition → null');
  }

  // B.7 Conditional edge passes
  {
    const g = conditionalGraph();
    const path = findShortestPath(g, 'N001', 'E001', { F001: true }, statuses);
    assert(path != null, 'B.13 Condition met → path found');
    assertEq(path.length, 3, 'B.14 Path length = 3');
  }
}

// ════════════════════════════════════════════════════════════
// SECTION C — findPathToGoal (Mode A)
// ════════════════════════════════════════════════════════════

function testFindPathToGoal() {
  group('findPathToGoal (Mode A)');

  // C.1 Happy path: finds valid path
  {
    const g = linearGraph();
    const result = findPathToGoal(g, 'N001', 'E001', {}, {});
    assert(result.path != null, 'C.1 Path found');
    assertEq(result.failedConditions.length, 0, 'C.2 No failed conditions');
    assertEq(result.path.nodeIds[0], 'N001', 'C.3 Starts at entry');
    assertEq(result.path.nodeIds[result.path.length - 1], 'E001', 'C.4 Ends at target');
  }

  // C.2 Conditional blocked: reports failed conditions
  {
    const g = conditionalGraph();
    const result = findPathToGoal(g, 'N001', 'E001', { F001: false }, {});
    // Should find unconditional path and report failed edges
    assert(result.path != null, 'C.5 Unconditional path found');
    assert(result.failedConditions.length > 0, 'C.6 Failed conditions reported');
    assertEq(result.failedConditions[0].reason, 'Edge conditions not met', 'C.7 Correct failure reason');
  }

  // C.3 Conditional passes: normal path
  {
    const g = conditionalGraph();
    const result = findPathToGoal(g, 'N001', 'E001', { F001: true }, {});
    assert(result.path != null, 'C.8 Path found with condition met');
    assertEq(result.failedConditions.length, 0, 'C.9 No failed conditions');
  }

  // C.4 Nonexistent target
  {
    const g = linearGraph();
    const result = findPathToGoal(g, 'N001', 'NOPE', {}, {});
    assertEq(result.path, null, 'C.10 No path to nonexistent node');
    assert(result.failedConditions.length > 0, 'C.11 Failure reason reported');
  }

  // C.5 Nonexistent entry
  {
    const g = linearGraph();
    const result = findPathToGoal(g, 'NOPE', 'E001', {}, {});
    assertEq(result.path, null, 'C.12 No path from nonexistent entry');
  }

  // C.6 No path at all (disconnected)
  {
    const g = linearGraph();
    const result = findPathToGoal(g, 'E001', 'N001', {}, {});
    assertEq(result.path, null, 'C.13 No reverse path in DAG');
    assert(result.failedConditions.some(fc => fc.reason.includes('No path exists')), 'C.14 Reports no path exists');
  }
}

// ════════════════════════════════════════════════════════════
// SECTION D — findRequirementsForGoal (Mode B)
// ════════════════════════════════════════════════════════════

function testFindRequirementsForGoal() {
  group('findRequirementsForGoal (Mode B)');

  // D.1 No conditions needed: empty requirements
  {
    const g = linearGraph();
    const result = findRequirementsForGoal(g, 'N001', 'E001');
    assertEq(result.reachable, true, 'D.1 Reachable');
    assertEq(result.timedOut, false, 'D.2 No timeout');
    assertEq(result.requiredFlags.length, 0, 'D.3 No required flags');
    assertEq(result.requiredStatuses.length, 0, 'D.4 No required statuses');
  }

  // D.2 Flag required
  {
    const g = conditionalGraph();
    const result = findRequirementsForGoal(g, 'N001', 'E001');
    assertEq(result.reachable, true, 'D.5 Reachable (ignoring conditions)');
    assert(result.requiredFlags.includes('F001'), 'D.6 F001 is required');
  }

  // D.3 Status condition required
  {
    const g = {
      common: {
        N001: { id: 'N001', name: 'start', requires: emptyReq(), next: [{ id: 'nx1', target: 'E001', requires: mkCond('and', [statusCond('SP001', 5, null)]) }], flags_set: [], status_set: [] },
      },
      choice: {},
      ending: { E001: { id: 'E001', name: 'end', requires: emptyReq() } },
      flag: {}, status: { SP001: { id: 'SP001', name: 'hp', value: 0 } },
      path: {}, chapter: {}, metadata: { version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04', entry_node: 'N001', common_node_types: [], ending_types: [] }, quest: {},
    };
    const result = findRequirementsForGoal(g, 'N001', 'E001');
    assertEq(result.reachable, true, 'D.7 Reachable');
    assert(result.requiredStatuses.length > 0, 'D.8 Has status requirements');
    assertEq(result.requiredStatuses[0].statusId, 'SP001', 'D.9 SP001 required');
    assertEq(result.requiredStatuses[0].min, 5, 'D.10 min=5');
  }

  // D.4 Nonexistent target → not reachable
  {
    const g = linearGraph();
    const result = findRequirementsForGoal(g, 'N001', 'NOPE');
    assertEq(result.reachable, false, 'D.11 Not reachable');
    assertEq(result.requiredFlags.length, 0, 'D.12 No flags');
    assertEq(result.requiredStatuses.length, 0, 'D.13 No statuses');
  }

  // D.5 Disconnected → not reachable
  {
    const g = linearGraph();
    const result = findRequirementsForGoal(g, 'E001', 'N001');
    assertEq(result.reachable, false, 'D.14 Reverse not reachable');
  }
}

// ════════════════════════════════════════════════════════════
// SECTION E — filterPaths
// ════════════════════════════════════════════════════════════

function testFilterPaths() {
  group('filterPaths');
  const g = branchingGraph();
  const allPaths = findAllPaths(g, 'N001', 'E001', {}, {});

  // E.1 No filters → all paths returned
  {
    const filtered = filterPaths(allPaths, {}, g);
    assertEq(filtered.length, allPaths.length, 'E.1 No filters → all paths');
  }

  // E.2 Null filters → all paths returned
  {
    const filtered = filterPaths(allPaths, null, g);
    assertEq(filtered.length, allPaths.length, 'E.2 Null filters → all paths');
  }

  // E.3 Filter by pathId
  {
    const filtered = filterPaths(allPaths, { pathId: 'P001' }, g);
    assert(filtered.length > 0, 'E.3 At least one path through P001');
    assert(filtered.every(p => p.nodeIds.includes('N002')), 'E.4 All filtered paths include N002 (path=P001)');
  }

  // E.4 Filter by chapterId
  {
    const filtered = filterPaths(allPaths, { chapterId: 'C001' }, g);
    assert(filtered.length > 0, 'E.5 At least one path through chapter C001');
    assert(filtered.every(p => p.nodeIds.includes('N003')), 'E.6 All filtered paths include N003 (chapter=C001)');
  }

  // E.5 Filter by nonexistent pathId → empty
  {
    const filtered = filterPaths(allPaths, { pathId: 'NOPE' }, g);
    assertEq(filtered.length, 0, 'E.7 Nonexistent pathId → 0 results');
  }

  // E.6 Filter by flagId
  {
    const filtered = filterPaths(allPaths, { flagId: 'F001' }, g);
    assert(filtered.length > 0, 'E.8 Paths setting F001 found');
    assert(filtered.every(p => p.nodeIds.includes('N002')), 'E.9 Filtered paths include N002 (sets F001)');
  }

  // E.7 Filter by statusId
  {
    const filtered = filterPaths(allPaths, { statusId: 'SP001' }, g);
    assert(filtered.length > 0, 'E.10 Paths modifying SP001 found');
    assert(filtered.every(p => p.nodeIds.includes('N003')), 'E.11 Filtered paths include N003 (modifies SP001)');
  }

  // E.8 Filter by nonexistent flagId → empty
  {
    const filtered = filterPaths(allPaths, { flagId: 'NOPE' }, g);
    assertEq(filtered.length, 0, 'E.12 Nonexistent flagId → 0 results');
  }

  // E.9 Empty paths array → empty
  {
    const filtered = filterPaths([], { pathId: 'P001' }, g);
    assertEq(filtered.length, 0, 'E.13 Empty paths → empty result');
  }
}

// ════════════════════════════════════════════════════════════
// SECTION F — annotatePath
// ════════════════════════════════════════════════════════════

function testAnnotatePath() {
  group('annotatePath');
  const g = linearGraph();

  // F.1 Annotate linear path
  {
    const path = findShortestPath(g, 'N001', 'E001', {}, {});
    const annotated = annotatePath(path, g);
    assertEq(annotated.totalNodes, 4, 'F.1 totalNodes = 4');
    assertEq(annotated.steps.length, 4, 'F.2 4 annotated steps');
    assert(annotated.summary.includes('N001'), 'F.3 Summary contains N001');
    assert(annotated.summary.includes('E001'), 'F.4 Summary contains E001');
  }

  // F.2 First step annotation details
  {
    const path = findShortestPath(g, 'N001', 'E001', {}, {});
    const annotated = annotatePath(path, g);
    const step0 = annotated.steps[0];
    assertEq(step0.nodeId, 'N001', 'F.5 step[0].nodeId = N001');
    assertEq(step0.stepIndex, 0, 'F.6 step[0].stepIndex = 0');
    assertEq(step0.entityType, 'common', 'F.7 step[0].entityType = common');
    assertEq(step0.name, 'start', 'F.8 step[0].name = start');
    assertEq(step0.chapterId, 'C001', 'F.9 step[0].chapterId = C001');
    assertEq(step0.chapterName, 'chapter_one', 'F.10 step[0].chapterName');
    assertEq(step0.pathId, 'P001', 'F.11 step[0].pathId = P001');
    assertEq(step0.pathName, 'main_path', 'F.12 step[0].pathName');
    assertEq(step0.flagsSet.length, 1, 'F.13 step[0] sets 1 flag');
    assertEq(step0.flagsSet[0].id, 'F001', 'F.14 step[0] sets F001');
    assertEq(step0.statusDeltas.length, 1, 'F.15 step[0] has 1 status delta');
    assertEq(step0.statusDeltas[0].status, 'SP001', 'F.16 step[0] delta is SP001');
    assertEq(step0.statusDeltas[0].amount, 5, 'F.17 step[0] delta amount = 5');
  }

  // F.3 Ending step annotation
  {
    const path = findShortestPath(g, 'N001', 'E001', {}, {});
    const annotated = annotatePath(path, g);
    const lastStep = annotated.steps[3];
    assertEq(lastStep.entityType, 'ending', 'F.18 Last step entityType = ending');
    assertEq(lastStep.nodeId, 'E001', 'F.19 Last step nodeId = E001');
    assertEq(lastStep.flagsSet.length, 0, 'F.20 Ending has no flags_set');
    assertEq(lastStep.statusDeltas.length, 0, 'F.21 Ending has no status_set');
  }

  // F.4 Null path → empty annotation
  {
    const annotated = annotatePath(null, g);
    assertEq(annotated.totalNodes, 0, 'F.22 Null path → totalNodes=0');
    assertEq(annotated.steps.length, 0, 'F.23 Null path → 0 steps');
    assertEq(annotated.summary, 'Empty path', 'F.24 Summary = Empty path');
  }

  // F.5 Empty nodeIds → empty annotation
  {
    const annotated = annotatePath({ nodeIds: [], edges: [] }, g);
    assertEq(annotated.totalNodes, 0, 'F.25 Empty nodeIds → totalNodes=0');
  }

  // F.6 Choice node annotation collects option flags
  {
    const g2 = choiceGraph();
    const path = { nodeIds: ['CH001'], length: 1, edges: [] };
    const annotated = annotatePath(path, g2);
    const step = annotated.steps[0];
    assertEq(step.entityType, 'choice', 'F.26 Choice entityType');
    assert(step.flagsSet.some(f => f.id === 'F001'), 'F.27 Choice step collects option flags');
    assert(step.statusDeltas.some(d => d.status === 'SP001'), 'F.28 Choice step collects option status deltas');
  }

  // F.7 Unknown node in path → handled gracefully
  {
    const path = { nodeIds: ['UNKNOWN'], length: 1, edges: [] };
    const annotated = annotatePath(path, g);
    assertEq(annotated.steps[0].entityType, null, 'F.29 Unknown node → entityType=null');
    assertEq(annotated.steps[0].name, 'UNKNOWN', 'F.30 Unknown node → name=nodeId');
  }
}

// ════════════════════════════════════════════════════════════
// SECTION G — Data Integrity (AR-03, AR-04, AR-05)
// ════════════════════════════════════════════════════════════

function testDataIntegrity() {
  group('Data Integrity — AR-03/AR-04/AR-05');

  // G.1 Path objects match expected shape
  {
    const g = linearGraph();
    const paths = findAllPaths(g, 'N001', 'E001', {}, {});
    const p = paths[0];
    assert(Array.isArray(p.nodeIds), 'G.1 nodeIds is array');
    assertEq(typeof p.length, 'number', 'G.2 length is number');
    assert(Array.isArray(p.edges), 'G.3 edges is array');
    assertEq(p.nodeIds.length, p.length, 'G.4 nodeIds.length === length');
  }

  // G.2 Edge objects match expected shape
  {
    const g = linearGraph();
    const paths = findAllPaths(g, 'N001', 'N002', {}, {});
    const e = paths[0].edges[0];
    assert(typeof e.from === 'string', 'G.5 edge.from is string');
    assert(typeof e.to === 'string', 'G.6 edge.to is string');
    assert(typeof e.edgeId === 'string', 'G.7 edge.edgeId is string');
    assert(typeof e.conditionMet === 'boolean', 'G.8 edge.conditionMet is boolean');
  }

  // G.3 RequirementSet shape
  {
    const g = conditionalGraph();
    const result = findRequirementsForGoal(g, 'N001', 'E001');
    assert(Array.isArray(result.requiredFlags), 'G.9 requiredFlags is array');
    assert(Array.isArray(result.requiredStatuses), 'G.10 requiredStatuses is array');
    assert(typeof result.reachable === 'boolean', 'G.11 reachable is boolean');
    assert(typeof result.timedOut === 'boolean', 'G.12 timedOut is boolean');
  }

  // G.4 AnnotatedStep shape
  {
    const g = linearGraph();
    const path = findShortestPath(g, 'N001', 'N002', {}, {});
    const annotated = annotatePath(path, g);
    const s = annotated.steps[0];
    assert(typeof s.nodeId === 'string', 'G.13 step.nodeId is string');
    assert(typeof s.stepIndex === 'number', 'G.14 step.stepIndex is number');
    assert(Array.isArray(s.flagsSet), 'G.15 step.flagsSet is array');
    assert(Array.isArray(s.statusDeltas), 'G.16 step.statusDeltas is array');
  }

  // G.5 Nested condition group in requirements
  {
    const g = {
      common: {
        N001: { id: 'N001', name: 'start', requires: emptyReq(), next: [{ id: 'nx1', target: 'E001', requires: mkCond('and', [mkCond('or', [flagCond('F001', true), flagCond('F002', true)])]) }], flags_set: [], status_set: [] },
      },
      choice: {},
      ending: { E001: { id: 'E001', name: 'end', requires: emptyReq() } },
      flag: { F001: { id: 'F001', name: 'a', state: false }, F002: { id: 'F002', name: 'b', state: false } },
      status: {}, path: {}, chapter: {},
      metadata: { version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04', entry_node: 'N001', common_node_types: [], ending_types: [] }, quest: {},
    };
    const result = findRequirementsForGoal(g, 'N001', 'E001');
    assertEq(result.reachable, true, 'G.17 Nested condition graph is reachable');
    assert(result.requiredFlags.length > 0, 'G.18 Nested conditions extracted flags');
  }
}

// ════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ════════════════════════════════════════════════════════════

console.log('╔════════════════════════════════════════╗');
console.log('║  Phase 12: Route Tracing Tests         ║');
console.log('╚════════════════════════════════════════╝');

testFindAllPaths();
testFindShortestPath();
testFindPathToGoal();
testFindRequirementsForGoal();
testFilterPaths();
testAnnotatePath();
testDataIntegrity();

summary();
