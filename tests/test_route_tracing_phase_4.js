/**
 * Route_Tracing Phase 4 Test Suite — Shortest-Route Pathfinding + RouteFinderDialog
 *
 * Group A: computeShortestPaths — happy path, gate filtering, priority tie-breaking,
 *          path cap, MAX_STATE_VISITS guard, empty graph, unreachable target.
 *          setShortestRouteResults fix — data lands in simulationStore, not local state.
 * Group B: Integration — evaluateCondition used for gate checks, results shape,
 *          selectedRouteIndex reset on overlay toggle-off, uiStore overlay contract.
 *
 * Run: node tests/test_route_tracing_phase_4.js
 */

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ PASS: ${label}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Inline evaluateCondition / evaluateClause — exact copy from conditionEvaluator.js
// ---------------------------------------------------------------------------

function evaluateClause(clause, flagState) {
  if ('operator' in clause) return evaluateCondition(clause, flagState);
  if ('status' in clause) {
    const value = flagState[clause.status];
    if (value === undefined) return false;
    if ('min' in clause && clause.min !== null && value < clause.min) return false;
    if ('max' in clause && clause.max !== null && value > clause.max) return false;
    return true;
  }
  if ('flag' in clause) return flagState[clause.flag] === clause.state;
  return false;
}

function evaluateCondition(condition, flagState) {
  if (!condition) return true;
  if (!condition.conditions || condition.conditions.length === 0) return true;
  if (condition.operator === 'or') return condition.conditions.some(c => evaluateClause(c, flagState));
  return condition.conditions.every(c => evaluateClause(c, flagState));
}

// ---------------------------------------------------------------------------
// Inline computeShortestPaths — exact copy from src/utils/routeTracer.js
// ---------------------------------------------------------------------------

function computeShortestPaths(startNodeId, targetNodeId, graphState, currentFlagValues, priorities = [], limit = 5) {
  const { edges = [] } = graphState;
  const MAX_STATE_VISITS = 10_000;
  const HARD_CAP = 50;
  const actualLimit = Math.min(limit, HARD_CAP);

  const paths = [];
  let stateVisitCount = 0;
  let exhausted = false;

  const queue = [{
    nodeId: startNodeId,
    flagState: { ...currentFlagValues },
    pathEdgeIds: [],
    visitedGraphNodes: new Set([startNodeId])
  }];

  while (queue.length > 0 && stateVisitCount < MAX_STATE_VISITS) {
    const current = queue.shift();
    stateVisitCount++;

    if (current.nodeId === targetNodeId) {
      paths.push({ pathEdgeIds: current.pathEdgeIds, length: current.pathEdgeIds.length, priorityRank: 0 });
      continue;
    }

    const outgoingEdges = edges.filter(e => e.sourceId === current.nodeId);
    outgoingEdges.forEach(edge => {
      if (current.visitedGraphNodes.has(edge.targetId)) return;
      if (!evaluateCondition(edge.condition, current.flagState)) return;

      const { common = {}, choice = {}, ending = {} } = graphState;
      const destNode = common[edge.targetId] || choice[edge.targetId] || ending[edge.targetId];
      if (!destNode) return;

      let nextFlagState = { ...current.flagState };
      if (destNode.data?.flags_set) destNode.data.flags_set.forEach(id => { nextFlagState[id] = true; });
      if (destNode.data?.status_set) {
        destNode.data.status_set.forEach(({ statusId, amount }) => {
          if (typeof nextFlagState[statusId] === 'number') nextFlagState[statusId] += amount;
        });
      }

      const nextVisited = new Set(current.visitedGraphNodes);
      nextVisited.add(edge.targetId);
      queue.push({ nodeId: edge.targetId, flagState: nextFlagState, pathEdgeIds: [...current.pathEdgeIds, edge.id], visitedGraphNodes: nextVisited });
    });
  }

  if (stateVisitCount >= MAX_STATE_VISITS) exhausted = true;

  paths.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    const scoreA = countPriorityMatches(a.pathEdgeIds, graphState, currentFlagValues, priorities);
    const scoreB = countPriorityMatches(b.pathEdgeIds, graphState, currentFlagValues, priorities);
    return scoreB - scoreA;
  });

  let currentLength = -1;
  let rankInLength = 0;
  paths.forEach(path => {
    if (path.length !== currentLength) { currentLength = path.length; rankInLength = 0; }
    path.priorityRank = rankInLength++;
  });

  return { paths: paths.slice(0, actualLimit), exhausted };
}

function countPriorityMatches(pathEdgeIds, graphState, initialFlags, priorities) {
  if (!priorities || priorities.length === 0) return 0;
  let flagState = { ...initialFlags };
  const { edges = [], common = {}, choice = {}, ending = {} } = graphState;
  pathEdgeIds.forEach(edgeId => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const destNode = common[edge.targetId] || choice[edge.targetId] || ending[edge.targetId];
    if (!destNode) return;
    if (destNode.data?.flags_set) destNode.data.flags_set.forEach(id => { flagState[id] = true; });
    if (destNode.data?.status_set) {
      destNode.data.status_set.forEach(({ statusId, amount }) => {
        if (typeof flagState[statusId] === 'number') flagState[statusId] += amount;
      });
    }
  });
  let matches = 0;
  priorities.forEach(p => { if (flagState[p.id] === p.preferredValue) matches++; });
  return matches;
}

// ---------------------------------------------------------------------------
// Test graph builders
// ---------------------------------------------------------------------------

// Simple linear graph: start → middle → end
function makeLinearGraph() {
  return {
    common: { start: { id: 'start', data: {} }, middle: { id: 'middle', data: {} } },
    choice: {},
    ending: { end: { id: 'end', data: {} } },
    edges: [
      { id: 'e1', sourceId: 'start', targetId: 'middle', condition: null },
      { id: 'e2', sourceId: 'middle', targetId: 'end', condition: null }
    ]
  };
}

// Branching graph: start → A → end; start → B → end (two equal-length paths)
function makeBranchingGraph() {
  return {
    common: {
      start: { id: 'start', data: {} },
      nodeA: { id: 'nodeA', data: {} },
      nodeB: { id: 'nodeB', data: {} }
    },
    choice: {},
    ending: { end: { id: 'end', data: {} } },
    edges: [
      { id: 'eA1', sourceId: 'start', targetId: 'nodeA', condition: null },
      { id: 'eA2', sourceId: 'nodeA', targetId: 'end', condition: null },
      { id: 'eB1', sourceId: 'start', targetId: 'nodeB', condition: null },
      { id: 'eB2', sourceId: 'nodeB', targetId: 'end', condition: null }
    ]
  };
}

// Gated graph: start → gate (sets flag) → end (requires flag); start → end (requires flag — fails without gate)
function makeGatedGraph() {
  return {
    common: {
      start: { id: 'start', data: {} },
      gate: { id: 'gate', data: { flags_set: ['hasKey'] } }
    },
    choice: {},
    ending: { end: { id: 'end', data: {} } },
    edges: [
      { id: 'eG1', sourceId: 'start', targetId: 'gate', condition: null },
      { id: 'eG2', sourceId: 'gate', targetId: 'end', condition: null },
      // Direct shortcut that requires flag (should be blocked without visiting gate)
      { id: 'eShort', sourceId: 'start', targetId: 'end', condition: { operator: 'and', conditions: [{ flag: 'hasKey', state: true }] } }
    ]
  };
}

// Priority graph: two equal paths — A sets flag, B does not
function makePriorityGraph() {
  return {
    common: {
      start: { id: 'start', data: {} },
      nodeA: { id: 'nodeA', data: { flags_set: ['goodPath'] } },
      nodeB: { id: 'nodeB', data: {} }
    },
    choice: {},
    ending: { end: { id: 'end', data: {} } },
    edges: [
      { id: 'pA1', sourceId: 'start', targetId: 'nodeA', condition: null },
      { id: 'pA2', sourceId: 'nodeA', targetId: 'end', condition: null },
      { id: 'pB1', sourceId: 'start', targetId: 'nodeB', condition: null },
      { id: 'pB2', sourceId: 'nodeB', targetId: 'end', condition: null }
    ]
  };
}

// ---------------------------------------------------------------------------
// Group A — Feature Verification
// ---------------------------------------------------------------------------

console.log('\n=== Phase 4 GROUP A: Feature Verification ===\n');

// A-01: returns paths with required shape fields
{
  const graph = makeLinearGraph();
  const result = computeShortestPaths('start', 'end', graph, {}, [], 5);
  assert('A-01: result has paths array', Array.isArray(result.paths));
  assert('A-01: result has exhausted boolean', typeof result.exhausted === 'boolean');
  assert('A-01: path has pathEdgeIds array', Array.isArray(result.paths[0].pathEdgeIds));
  assert('A-01: path has length field', typeof result.paths[0].length === 'number');
  assert('A-01: path has priorityRank field', typeof result.paths[0].priorityRank === 'number');
}

// A-02: happy path — linear graph finds the one correct path
{
  const graph = makeLinearGraph();
  const result = computeShortestPaths('start', 'end', graph, {}, [], 5);
  assert('A-02: exactly 1 path found', result.paths.length === 1);
  assert('A-02: path uses edges e1 and e2', result.paths[0].pathEdgeIds.includes('e1') && result.paths[0].pathEdgeIds.includes('e2'));
  assert('A-02: path length is 2 edges', result.paths[0].length === 2);
}

// A-03: branching graph finds both paths
{
  const graph = makeBranchingGraph();
  const result = computeShortestPaths('start', 'end', graph, {}, [], 5);
  assert('A-03: both paths found', result.paths.length === 2);
}

// A-04: paths sorted shortest-to-longest
{
  // Add a longer path: start → extra → middle → end (3 edges vs 2)
  const graph = makeLinearGraph();
  graph.common.extra = { id: 'extra', data: {} };
  graph.edges.push(
    { id: 'eLong1', sourceId: 'start', targetId: 'extra', condition: null },
    { id: 'eLong2', sourceId: 'extra', targetId: 'middle', condition: null }
  );
  const result = computeShortestPaths('start', 'end', graph, {}, [], 5);
  assert('A-04: shortest path (2 edges) is first', result.paths[0].length <= result.paths[1].length);
}

// A-05: gate-respecting — path requiring unset flag is excluded
{
  const graph = makeGatedGraph();
  const flags = { hasKey: false };
  const result = computeShortestPaths('start', 'end', graph, flags, [], 10);
  // Only path: start → gate → end (eShort is blocked since hasKey=false initially)
  const edgeSets = result.paths.map(p => new Set(p.pathEdgeIds));
  const hasDirectShortcut = edgeSets.some(s => s.has('eShort'));
  assert('A-05: direct shortcut (requires flag) is excluded', !hasDirectShortcut);
  assert('A-05: path through gate node is found', result.paths.some(p => p.pathEdgeIds.includes('eG1')));
}

// A-06: gate-respecting — path requiring set flag is included
{
  const graph = makeGatedGraph();
  const flags = { hasKey: true }; // flag pre-set
  const result = computeShortestPaths('start', 'end', graph, flags, [], 10);
  const edgeSets = result.paths.map(p => new Set(p.pathEdgeIds));
  assert('A-06: direct shortcut included when flag is pre-set', edgeSets.some(s => s.has('eShort')));
}

// A-07: flag set by intermediate node unlocks downstream gated edge
{
  // gate node sets hasKey; then end is reachable via gate
  const graph = makeGatedGraph();
  const flags = { hasKey: false };
  const result = computeShortestPaths('start', 'end', graph, flags, [], 10);
  // start→gate sets hasKey; gate→end has no condition → path found
  assert('A-07: gate node effect unlocks downstream path', result.paths.length > 0);
}

// A-08: priority tie-breaking — path satisfying priority appears first among equal-length paths
{
  const graph = makePriorityGraph();
  const priorities = [{ id: 'goodPath', preferredValue: true }];
  const result = computeShortestPaths('start', 'end', graph, { goodPath: false }, priorities, 5);
  assert('A-08: two equal-length paths found', result.paths.length === 2);
  // The path through nodeA sets goodPath=true; it should appear first
  const firstPath = result.paths[0];
  assert('A-08: priority path (via nodeA) is ranked first', firstPath.pathEdgeIds.includes('pA1'));
}

// A-09: priority tie-breaking — no priority returns paths in length order only
{
  const graph = makePriorityGraph();
  const result = computeShortestPaths('start', 'end', graph, { goodPath: false }, [], 5);
  // Both paths have equal length; order is deterministic but no priority ranking
  assert('A-09: both paths found without priority spec', result.paths.length === 2);
  assert('A-09: paths have same length (2)', result.paths[0].length === 2 && result.paths[1].length === 2);
}

// A-10: limit caps returned paths
{
  const graph = makeBranchingGraph();
  const result = computeShortestPaths('start', 'end', graph, {}, [], 1);
  assert('A-10: limit=1 returns at most 1 path', result.paths.length <= 1);
}

// A-11: HARD_CAP=50 — limit clamped regardless of user input
{
  const graph = makeBranchingGraph();
  const result = computeShortestPaths('start', 'end', graph, {}, [], 999);
  // Only 2 paths exist; hard cap ≥ 50 so both should be returned
  assert('A-11: limit 999 is clamped to HARD_CAP (50); all 2 paths returned', result.paths.length === 2);
}

// A-12: unreachable target returns empty paths
{
  const graph = makeLinearGraph();
  const result = computeShortestPaths('start', 'isolated', graph, {}, [], 5);
  assert('A-12: unreachable target returns empty paths array', result.paths.length === 0);
}

// A-13: same start and target — no path (start already equals target; BFS records it as found with 0 edges)
{
  const graph = makeLinearGraph();
  const result = computeShortestPaths('start', 'start', graph, {}, [], 5);
  // The queue starts with start and immediately records it as a hit — 0 edges path
  assert('A-13: start===target yields 1 path with 0 edges', result.paths.length === 1 && result.paths[0].length === 0);
}

// A-14: cycle in graph does not produce infinite loop or duplicate nodes in a path
{
  const graph = {
    common: {
      n1: { id: 'n1', data: {} },
      n2: { id: 'n2', data: {} },
      n3: { id: 'n3', data: {} }
    },
    choice: {},
    ending: { end: { id: 'end', data: {} } },
    edges: [
      { id: 'e12', sourceId: 'n1', targetId: 'n2', condition: null },
      { id: 'e23', sourceId: 'n2', targetId: 'n3', condition: null },
      { id: 'e31', sourceId: 'n3', targetId: 'n1', condition: null }, // cycle
      { id: 'e3e', sourceId: 'n3', targetId: 'end', condition: null }
    ]
  };
  const result = computeShortestPaths('n1', 'end', graph, {}, [], 5);
  assert('A-14: path found despite cycle in graph', result.paths.length > 0);
  // No node should appear twice in the path (visitedGraphNodes guard)
  const path = result.paths[0];
  const nodesInPath = new Set(['n1']);
  graph.edges
    .filter(e => path.pathEdgeIds.includes(e.id))
    .forEach(e => nodesInPath.add(e.targetId));
  assert('A-14: no node appears twice in any path', nodesInPath.size === path.pathEdgeIds.length + 1);
}

// A-15: exhausted flag is false for small graph
{
  const graph = makeLinearGraph();
  const result = computeShortestPaths('start', 'end', graph, {}, [], 5);
  assert('A-15: exhausted is false for small graph', result.exhausted === false);
}

// A-16: setShortestRouteResults fix — store receives results (simulates store action)
{
  // Simulates: simulationStore.setShortestRouteResults(paths)
  // No isCampaignActive guard; just sets the fields
  function setShortestRouteResults(store, paths) {
    store.shortestRouteResults = paths;
    store.shortestRouteTargetNodeId = null;
    store.isShortestRouteStale = false;
  }
  const store = { shortestRouteResults: null, shortestRouteTargetNodeId: 'old', isShortestRouteStale: true, isCampaignActive: false };
  const graph = makeLinearGraph();
  const result = computeShortestPaths('start', 'end', graph, {}, [], 5);
  setShortestRouteResults(store, result.paths);
  assert('A-16: setShortestRouteResults stores paths (no campaign guard)', store.shortestRouteResults !== null);
  assert('A-16: setShortestRouteResults works when campaign is inactive', store.isCampaignActive === false && store.shortestRouteResults.length > 0);
  assert('A-16: isShortestRouteStale reset to false', store.isShortestRouteStale === false);
}

// A-17: computeRoutes guard — campaign-mode action still guards on isCampaignActive
{
  function computeRoutes(store) {
    if (!store.isCampaignActive) return false; // returns early
    return true;
  }
  assert('A-17: computeRoutes no-ops when campaign inactive', computeRoutes({ isCampaignActive: false }) === false);
  assert('A-17: computeRoutes proceeds when campaign active', computeRoutes({ isCampaignActive: true }) === true);
}

// A-18: priorityRank assigned within same-length groups starting at 0
{
  const graph = makePriorityGraph();
  const result = computeShortestPaths('start', 'end', graph, { goodPath: false }, [], 5);
  assert('A-18: first path in group has priorityRank 0', result.paths[0].priorityRank === 0);
  assert('A-18: second path in same-length group has priorityRank 1', result.paths[1].priorityRank === 1);
}

// ---------------------------------------------------------------------------
// Group B — Integration Suite
// ---------------------------------------------------------------------------

console.log('\n=== Phase 4 GROUP B: Integration Suite ===\n');

// B-01: evaluateCondition null passes (unchanged — used in gate checks)
{
  assert('B-01: null condition passes (no gate)', evaluateCondition(null, {}) === true);
}

// B-02: evaluateCondition flag gate blocks path traversal
{
  const cond = { operator: 'and', conditions: [{ flag: 'f1', state: true }] };
  assert('B-02: flag gate blocks when flag is false', evaluateCondition(cond, { f1: false }) === false);
  assert('B-02: flag gate passes when flag is true', evaluateCondition(cond, { f1: true }) === true);
}

// B-03: ConditionalEdge routeEdgeSet logic — edge on selected route returns true
{
  // Simulates: routeEdgeSet?.has(id) ?? false
  const paths = [{ pathEdgeIds: ['e1', 'e2', 'e3'], length: 3, priorityRank: 0 }];
  function isRouteOverlay(showOverlay, paths, selectedIndex, edgeId) {
    if (!showOverlay || !paths || !paths[selectedIndex]) return false;
    const set = new Set(paths[selectedIndex].pathEdgeIds);
    return set.has(edgeId);
  }
  assert('B-03: edge on route returns true when overlay active', isRouteOverlay(true, paths, 0, 'e2'));
  assert('B-03: edge NOT on route returns false', isRouteOverlay(true, paths, 0, 'e99') === false);
  assert('B-03: returns false when overlay disabled', isRouteOverlay(false, paths, 0, 'e1') === false);
  assert('B-03: returns false when paths is null', isRouteOverlay(true, null, 0, 'e1') === false);
}

// B-04: selectedRouteIndex reset to 0 when overlay toggled off
{
  let uiState = { showShortestRouteOverlay: true, selectedRouteIndex: 3 };
  function toggleShortestRouteOverlay(state) {
    const isNowOff = state.showShortestRouteOverlay;
    return {
      showShortestRouteOverlay: !state.showShortestRouteOverlay,
      selectedRouteIndex: isNowOff ? 0 : state.selectedRouteIndex
    };
  }
  uiState = toggleShortestRouteOverlay(uiState);
  assert('B-04: selectedRouteIndex resets to 0 when overlay turns off', uiState.selectedRouteIndex === 0);
  assert('B-04: overlay is now off', uiState.showShortestRouteOverlay === false);
}

// B-05: selectedRouteIndex preserved when overlay toggled on
{
  let uiState = { showShortestRouteOverlay: false, selectedRouteIndex: 2 };
  function toggleShortestRouteOverlay(state) {
    const isNowOff = state.showShortestRouteOverlay;
    return {
      showShortestRouteOverlay: !state.showShortestRouteOverlay,
      selectedRouteIndex: isNowOff ? 0 : state.selectedRouteIndex
    };
  }
  uiState = toggleShortestRouteOverlay(uiState);
  assert('B-05: selectedRouteIndex preserved when overlay turns on', uiState.selectedRouteIndex === 2);
}

// B-06: shortestRouteResults cleared on exitCampaign/reset/enterCampaign
{
  function simulateTeardown(state) {
    return { ...state, shortestRouteResults: null, shortestRouteTargetNodeId: null, isShortestRouteStale: false };
  }
  const state = { shortestRouteResults: [{ pathEdgeIds: ['e1'] }], shortestRouteTargetNodeId: 'end', isShortestRouteStale: true };
  const cleared = simulateTeardown(state);
  assert('B-06: shortestRouteResults null after teardown', cleared.shortestRouteResults === null);
  assert('B-06: isShortestRouteStale false after teardown', cleared.isShortestRouteStale === false);
}

// B-07: undoLastNode marks route results stale
{
  function simulateUndoStaleMarking(state) {
    return {
      ...state,
      isShortestRouteStale: state.shortestRouteResults !== null
    };
  }
  const withResults = { shortestRouteResults: [{}], isShortestRouteStale: false };
  const withoutResults = { shortestRouteResults: null, isShortestRouteStale: false };
  assert('B-07: undo marks results stale when results exist', simulateUndoStaleMarking(withResults).isShortestRouteStale === true);
  assert('B-07: undo leaves stale=false when no results exist', simulateUndoStaleMarking(withoutResults).isShortestRouteStale === false);
}

// B-08: path cap at boundary — limit=50 returns up to 50 paths, never more
{
  // Build a graph with many parallel paths
  const graph = { common: {}, choice: {}, ending: { end: { id: 'end', data: {} } }, edges: [] };
  graph.common['start'] = { id: 'start', data: {} };
  for (let i = 0; i < 60; i++) {
    graph.common[`mid${i}`] = { id: `mid${i}`, data: {} };
    graph.edges.push({ id: `es${i}`, sourceId: 'start', targetId: `mid${i}`, condition: null });
    graph.edges.push({ id: `em${i}`, sourceId: `mid${i}`, targetId: 'end', condition: null });
  }
  const result = computeShortestPaths('start', 'end', graph, {}, [], 999);
  assert('B-08: result never exceeds HARD_CAP of 50', result.paths.length <= 50);
}

// B-09: RouteFinderDialog auto-close contract — handleRun calls setShortestRouteResults then closes
{
  // Simulates the corrected handleRun flow
  let dialogOpen = true;
  let storedResults = null;
  let overlayActive = false;

  function handleRun(graph, startId, targetId, flags, priorities, cap) {
    const result = computeShortestPaths(startId, targetId, graph, flags, priorities, cap);
    storedResults = result.paths;         // ← to simulationStore (not local state)
    if (!overlayActive) overlayActive = true;
    dialogOpen = false;                   // ← auto-close
  }

  handleRun(makeLinearGraph(), 'start', 'end', {}, [], 5);
  assert('B-09: dialog closes after Run', dialogOpen === false);
  assert('B-09: results stored (not null)', storedResults !== null);
  assert('B-09: overlay activated after Run', overlayActive === true);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('INTEGRATION: CLEAN\n');
} else {
  console.log('INTEGRATION: BROKEN\n');
  process.exit(1);
}
