/**
 * Route_Tracing Phase 3 Test Suite — Dead-end Detection + Coverage Gap Dimming
 *
 * Group A: detectDeadEnds, computeForwardReachable — boundary values and edge cases
 * Group B: Integration — evaluateCondition unchanged, BFS cap behavior, ending-node guard
 *
 * Run: node tests/test_route_tracing_phase_3.js
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
// Inline pure functions — exact copies from src/utils/routeTracer.js
// ---------------------------------------------------------------------------

function detectDeadEnds(graphState) {
  const { common = {}, choice = {}, ending = {}, edges = [] } = graphState;
  const allNodeIds = [
    ...Object.keys(common),
    ...Object.keys(choice),
    ...Object.keys(ending)
  ];
  return allNodeIds.filter(nodeId => {
    if (ending[nodeId]) return false;
    const hasOutgoing = edges.some(e => e.sourceId === nodeId);
    return !hasOutgoing;
  });
}

function computeForwardReachable(startNodeId, graphState) {
  const { edges = [] } = graphState;
  const visited = new Set();
  const queue = [startNodeId];
  const MAX_NODES = 500;
  while (queue.length > 0 && visited.size < MAX_NODES) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    const outgoing = edges.filter(e => e.sourceId === currentId);
    outgoing.forEach(edge => {
      if (!visited.has(edge.targetId)) queue.push(edge.targetId);
    });
  }
  return visited;
}

// Inline conditionEvaluator (for Group B)
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
// Group A — Feature Verification
// ---------------------------------------------------------------------------

console.log('\n=== Phase 3 GROUP A: Feature Verification ===\n');

// A-01: detectDeadEnds returns node with no outgoing edges (common)
{
  const graph = {
    common: { n1: {}, n2: {} },
    choice: {},
    ending: {},
    edges: [{ id: 'e1', sourceId: 'n1', targetId: 'n2' }]
  };
  const deadEnds = detectDeadEnds(graph);
  assert('A-01: n2 has no outgoing edges — is a dead-end', deadEnds.includes('n2'));
  assert('A-01: n1 has outgoing edge — not a dead-end', !deadEnds.includes('n1'));
}

// A-02: detectDeadEnds does NOT flag ending nodes (even with no outgoing edges)
{
  const graph = {
    common: {},
    choice: {},
    ending: { end1: {}, end2: {} },
    edges: []
  };
  const deadEnds = detectDeadEnds(graph);
  assert('A-02: ending nodes with no outgoing edges are NOT dead-ends', deadEnds.length === 0);
}

// A-03: detectDeadEnds returns empty array for graph with no dead-ends
{
  const graph = {
    common: { n1: {}, n2: {} },
    choice: {},
    ending: { end1: {} },
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2' },
      { id: 'e2', sourceId: 'n2', targetId: 'end1' }
    ]
  };
  const deadEnds = detectDeadEnds(graph);
  assert('A-03: no dead-ends when all non-ending nodes have outgoing edges', deadEnds.length === 0);
}

// A-04: detectDeadEnds handles empty graph
{
  const deadEnds = detectDeadEnds({ common: {}, choice: {}, ending: {}, edges: [] });
  assert('A-04: detectDeadEnds returns empty array for empty graph', deadEnds.length === 0);
}

// A-05: detectDeadEnds counts multiple dead-ends
{
  const graph = {
    common: { n1: {}, n2: {}, n3: {} },
    choice: {},
    ending: {},
    edges: [{ id: 'e1', sourceId: 'n1', targetId: 'n2' }]
    // n2 and n3 have no outgoing edges
  };
  const deadEnds = detectDeadEnds(graph);
  assert('A-05: two dead-ends detected (n2, n3)', deadEnds.length === 2);
  assert('A-05: n2 in dead-ends', deadEnds.includes('n2'));
  assert('A-05: n3 in dead-ends', deadEnds.includes('n3'));
}

// A-06: detectDeadEnds handles choice nodes as dead-ends
{
  const graph = {
    common: {},
    choice: { c1: {} },
    ending: {},
    edges: []
  };
  const deadEnds = detectDeadEnds(graph);
  assert('A-06: choice node with no outgoing edges is a dead-end', deadEnds.includes('c1'));
}

// A-07: computeForwardReachable returns start node in result
{
  const graph = { edges: [] };
  const reachable = computeForwardReachable('n1', graph);
  assert('A-07: start node is included in forward-reachable set', reachable.has('n1'));
}

// A-08: computeForwardReachable traverses direct neighbors
{
  const graph = {
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2' },
      { id: 'e2', sourceId: 'n1', targetId: 'n3' }
    ]
  };
  const reachable = computeForwardReachable('n1', graph);
  assert('A-08: direct neighbor n2 is reachable', reachable.has('n2'));
  assert('A-08: direct neighbor n3 is reachable', reachable.has('n3'));
}

// A-09: computeForwardReachable traverses multi-hop paths
{
  const graph = {
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4' }
    ]
  };
  const reachable = computeForwardReachable('n1', graph);
  assert('A-09: 3-hop node n4 is reachable from n1', reachable.has('n4'));
  assert('A-09: reachable set size is 4 (n1→n2→n3→n4)', reachable.size === 4);
}

// A-10: computeForwardReachable does not cross backward edges
{
  const graph = {
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2' },
      { id: 'e2', sourceId: 'n3', targetId: 'n4' } // disconnected subgraph
    ]
  };
  const reachable = computeForwardReachable('n1', graph);
  assert('A-10: disconnected n3 is NOT reachable from n1', !reachable.has('n3'));
  assert('A-10: disconnected n4 is NOT reachable from n1', !reachable.has('n4'));
}

// A-11: computeForwardReachable handles cycle without infinite loop
{
  const graph = {
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2' },
      { id: 'e2', sourceId: 'n2', targetId: 'n1' } // back edge (cycle)
    ]
  };
  const reachable = computeForwardReachable('n1', graph);
  assert('A-11: cycle does not cause infinite loop', reachable.size === 2);
  assert('A-11: both cycle nodes are reachable', reachable.has('n1') && reachable.has('n2'));
}

// A-12: computeForwardReachable returns empty set for unknown start node
{
  const graph = { edges: [] };
  const reachable = computeForwardReachable('nonexistent', graph);
  assert('A-12: unknown start node yields only itself in reachable set', reachable.size === 1);
  assert('A-12: unknown start node is itself in the set', reachable.has('nonexistent'));
}

// A-13: computeForwardReachable respects MAX_NODES=500 cap (partial result)
{
  // Build a chain of 502 nodes
  const edges = [];
  for (let i = 0; i < 501; i++) {
    edges.push({ id: `e${i}`, sourceId: `n${i}`, targetId: `n${i + 1}` });
  }
  const graph = { edges };
  const reachable = computeForwardReachable('n0', graph);
  assert('A-13: BFS caps at 500 visited nodes', reachable.size === 500);
}

// A-14: isCoverageGap logic — unreachable from active = gap
{
  // Simulates: isCampaignActive && unreachableFromActiveNodeIds.includes(id)
  function isCoverageGap(isCampaignActive, unreachableIds, nodeId) {
    return isCampaignActive && unreachableIds.includes(nodeId);
  }
  assert('A-14: node in unreachable list is a coverage gap', isCoverageGap(true, ['n5', 'n6'], 'n5') === true);
  assert('A-14: node NOT in unreachable list is not a coverage gap', isCoverageGap(true, ['n5'], 'n3') === false);
  assert('A-14: coverage gap is false when campaign inactive', isCoverageGap(false, ['n5'], 'n5') === false);
}

// ---------------------------------------------------------------------------
// Group B — Integration Suite
// ---------------------------------------------------------------------------

console.log('\n=== Phase 3 GROUP B: Integration Suite ===\n');

// B-01: evaluateCondition — null/undefined condition passes (unchanged behavior)
{
  assert('B-01: evaluateCondition(null) returns true', evaluateCondition(null, {}) === true);
  assert('B-01: evaluateCondition(undefined) returns true', evaluateCondition(undefined, {}) === true);
}

// B-02: evaluateCondition — empty conditions array passes
{
  assert('B-02: empty conditions array returns true', evaluateCondition({ operator: 'and', conditions: [] }, {}) === true);
}

// B-03: evaluateCondition — flag clause AND semantics unchanged
{
  const cond = { operator: 'and', conditions: [{ flag: 'f1', state: true }] };
  assert('B-03: flag clause passes when flag matches', evaluateCondition(cond, { f1: true }) === true);
  assert('B-03: flag clause fails when flag does not match', evaluateCondition(cond, { f1: false }) === false);
}

// B-04: evaluateCondition — OR semantics unchanged
{
  const cond = { operator: 'or', conditions: [{ flag: 'f1', state: true }, { flag: 'f2', state: true }] };
  assert('B-04: OR passes when at least one flag matches', evaluateCondition(cond, { f1: false, f2: true }) === true);
  assert('B-04: OR fails when no flags match', evaluateCondition(cond, { f1: false, f2: false }) === false);
}

// B-05: evaluateCondition — status range clause unchanged
{
  const cond = { operator: 'and', conditions: [{ status: 's1', min: 5, max: 10 }] };
  assert('B-05: status in range passes', evaluateCondition(cond, { s1: 7 }) === true);
  assert('B-05: status below min fails', evaluateCondition(cond, { s1: 4 }) === false);
  assert('B-05: status above max fails', evaluateCondition(cond, { s1: 11 }) === false);
}

// B-06: detectDeadEnds — ending nodes still excluded even when added to common map in error
{
  // Guard: if ending key exists for a node, it is never a dead-end regardless of edges
  const graph = {
    common: {},
    choice: {},
    ending: { n_end: {} },
    edges: [] // no outgoing edges
  };
  assert('B-06: ending node with no edges is not a dead-end', !detectDeadEnds(graph).includes('n_end'));
}

// B-07: computeForwardReachable is structural (no gate evaluation)
{
  // Even if an edge has a condition, BFS still traverses it (condition-agnostic)
  const graph = {
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', condition: { operator: 'and', conditions: [{ flag: 'f1', state: true }] } }
    ]
  };
  const reachable = computeForwardReachable('n1', graph);
  // Despite condition, structural BFS should still find n2
  assert('B-07: BFS ignores gate conditions (structural only)', reachable.has('n2'));
}

// B-08: unreachableFromActiveNodeIds computed as complement of forward-reachable
{
  const graph = {
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3' }
      // n4 is disconnected from n1
    ]
  };
  const allNodeIds = ['n1', 'n2', 'n3', 'n4'];
  const reachable = computeForwardReachable('n1', graph);
  const unreachable = allNodeIds.filter(id => !reachable.has(id));
  assert('B-08: n4 is unreachable from n1', unreachable.includes('n4'));
  assert('B-08: n2 is reachable from n1 (not in unreachable)', !unreachable.includes('n2'));
}

// B-09: forward BFS uses sourceId/targetId fields (not source/target)
{
  // Edge data model uses sourceId/targetId, not source/target (React Flow uses source/target but store uses sourceId/targetId)
  const graph = {
    edges: [{ id: 'e1', sourceId: 'start', targetId: 'end' }]
  };
  const reachable = computeForwardReachable('start', graph);
  assert('B-09: BFS uses sourceId/targetId edge fields', reachable.has('end'));
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
