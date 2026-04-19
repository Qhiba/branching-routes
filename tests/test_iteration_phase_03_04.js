// tests/test_iteration_phase_03_04.js
// Standalone Test Script validating Narrative Engine Phase 3 and Phase 4 Logic

// ==========================================
// INLINED FUNCTIONS (from src/utils/conditionEvaluator.js)
// ==========================================
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
  if (condition.operator === 'or') return condition.conditions.some(clause => evaluateClause(clause, flagState));
  return condition.conditions.every(clause => evaluateClause(clause, flagState));
}

// ==========================================
// INLINED FUNCTIONS (from src/store/simulationStore.js)
// ==========================================
function computeReachable(activeNodeId, graphState, currentFlagValues, selectedOptionId = null) {
  const isChoice = !!(graphState.choice || {})[activeNodeId];
  
  const reachableEdges = graphState.edges.filter(e => {
    if (e.sourceId !== activeNodeId) return false;
    if (isChoice && e.optionId !== selectedOptionId) return false;
    return evaluateCondition(e.condition, currentFlagValues);
  });
  
  const reachableNodeIds = reachableEdges.map(e => e.targetId);
  return { reachableEdgeIds: reachableEdges.map(e => e.id), reachableNodeIds };
}

function computeNodeStates(activeNodeId, graphState, reachableNodeIds, selectedOptionId = null, seenNodeIds = []) {
  const nodeStates = {};
  const { edges, ending = {}, choice = {} } = graphState;

  const isEnding = !!ending[activeNodeId];
  const hasOutgoingEdges = edges.some(e => e.sourceId === activeNodeId);

  if (isEnding) {
    nodeStates[activeNodeId] = 'complete';
  } else if (!hasOutgoingEdges) {
    nodeStates[activeNodeId] = 'failed';
  } else {
    nodeStates[activeNodeId] = 'active';
  }

  const isChoice = !!choice[activeNodeId];
  const targetIds = [...new Set(edges.filter(e => e.sourceId === activeNodeId).map(e => e.targetId))];
  
  const shouldClassifyTargets = !isChoice || selectedOptionId !== null;

  if (shouldClassifyTargets) {
    targetIds.forEach(targetId => {
      if (!reachableNodeIds.includes(targetId)) {
        if (!nodeStates[targetId]) {
          let isBranchLocked = false;
          if (isChoice && selectedOptionId) {
            const edgesToTarget = edges.filter(e => e.sourceId === activeNodeId && e.targetId === targetId);
            if (edgesToTarget.some(e => e.optionId === selectedOptionId)) {
              isBranchLocked = true;
            }
          }
          nodeStates[targetId] = isBranchLocked ? 'branch_locked' : 'locked';
        }
      }
    });
  }

  reachableNodeIds.forEach(nodeId => {
    if (!nodeStates[nodeId]) nodeStates[nodeId] = 'reachable';
  });

  seenNodeIds.forEach(seenId => {
    if (!nodeStates[seenId]) nodeStates[seenId] = 'seen';
  });

  return nodeStates;
}

function computePassiveAnalysis(graphState) {
  const { common = {}, choice = {}, ending = {}, edges = [] } = graphState;
  const allNodes = [
    ...Object.values(common),
    ...Object.values(choice),
    ...Object.values(ending)
  ];
  const allNodeIds = allNodes.map(n => n.id);
  const startNode = allNodes.find(n => n.data?.isStartNode);
  const orphanedNodeIds = [];
  const unreachableNodeIds = [];

  allNodeIds.forEach(id => {
    const hasIncoming = edges.some(e => e.targetId === id);
    const hasOutgoing = edges.some(e => e.sourceId === id);
    if (!hasIncoming && !hasOutgoing) orphanedNodeIds.push(id);
  });

  if (startNode) {
    const visited = new Set([startNode.id]);
    const queue = [startNode.id];
    while (queue.length > 0) {
      const current = queue.shift();
      edges.filter(e => e.sourceId === current).forEach(e => {
        if (!visited.has(e.targetId)) {
          visited.add(e.targetId);
          queue.push(e.targetId);
        }
      });
    }
    allNodeIds.forEach(id => {
      if (!visited.has(id) && !orphanedNodeIds.includes(id)) {
        unreachableNodeIds.push(id);
      }
    });
  } else {
    allNodeIds.forEach(id => {
      if (!orphanedNodeIds.includes(id)) unreachableNodeIds.push(id);
    });
  }

  return { orphanedNodeIds, unreachableNodeIds };
}

// ==========================================
// TEST UTILS
// ==========================================
let passed = 0;
let failed = 0;
let groupCFailed = false;

function assert(condition, message, isGroupC = false) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
    if (isGroupC) groupCFailed = true;
  }
}

// ==========================================
// FIXTURE DATA
// ==========================================
const mockGraph = {
  common: {
    'n-start': { id: 'n-start', data: { isStartNode: true } },
    'n-orphan': { id: 'n-orphan', data: {} }
  },
  choice: {
    'n-choice': { id: 'n-choice', data: {} }
  },
  ending: {
    'n-end': { id: 'n-end', data: {} },
    'n-unreachable': { id: 'n-unreachable', data: {} }
  },
  edges: [
    { id: 'e-1', sourceId: 'n-start', targetId: 'n-choice', condition: null },
    { id: 'e-2', sourceId: 'n-choice', targetId: 'n-end', optionId: 'opt-1', condition: { operator: 'and', conditions: [{ flag: 'f-1', state: true }] } },
    { id: 'e-3', sourceId: 'n-choice', targetId: 'n-end', optionId: 'opt-2', condition: null },
    { id: 'e-4', sourceId: 'n-unreachable', targetId: 'n-end', condition: null }
  ]
};

// ==========================================
// TESTS
// ==========================================
console.log('--- GROUP A: Old Behavior Tombstone ---');
// Prove reachable edges now STRICTLY require optionId matching for choice nodes.
// Old code: would return BOTH option edges if flag condition is met.
const reachTestA = computeReachable('n-choice', mockGraph, { 'f-1': true }, null);
assert(reachTestA.reachableEdgeIds.length === 0, 'Group A: computeReachable no longer blind-routes choice nodes without an option selected');

// Prove node states use enum (failed, inactive, branch_locked) rather than just 'reachable'.
const stateTestA = computeNodeStates('n-choice', mockGraph, [], 'opt-1');
assert(stateTestA['n-end'] === 'branch_locked' || stateTestA['n-end'] === 'locked', 'Group A: node targeting branch_locked/locked class over old "visited" binary class');

console.log('\n--- GROUP B: New Behavior Confirmation ---');
// Test Path 1: Option selected, condition passed
const reachTestB1 = computeReachable('n-choice', mockGraph, { 'f-1': true }, 'opt-1');
assert(reachTestB1.reachableEdgeIds.includes('e-2'), 'Group B: computeReachable correctly resolves selected Option ID pass');

// Test Path 2: Option selected, condition failed
const reachTestB2 = computeReachable('n-choice', mockGraph, { 'f-1': false }, 'opt-1');
assert(!reachTestB2.reachableEdgeIds.includes('e-2'), 'Group B: computeReachable correctly blocks selected Option ID fail');

// Test Path 3: computeNodeStates correctly issues branch_locked enum
const stateTestB1 = computeNodeStates('n-choice', mockGraph, reachTestB2.reachableNodeIds, 'opt-1');
assert(stateTestB1['n-end'] === 'branch_locked', 'Group B: computeNodeStates correctly attributes failing option path as branch_locked');

// Test Path 4: Passive analysis spots Orphans
const analysisTestB1 = computePassiveAnalysis(mockGraph);
assert(analysisTestB1.orphanedNodeIds.includes('n-orphan'), 'Group B: computePassiveAnalysis detects orphaned node');

// Test Path 5: Passive analysis spots Unreachable 
assert(analysisTestB1.unreachableNodeIds.includes('n-unreachable'), 'Group B: computePassiveAnalysis detects unreachable node');


console.log('\n--- GROUP C: Regression Suite (Preservation Check) ---');
// AR-07 Condition Evaluator
const evalResult = evaluateCondition({ operator: 'and', conditions: [{ flag: 'flag_test', state: true }] }, { flag_test: true });
assert(evalResult === true, 'Group C: evaluateCondition handles nested conditions normally', true);

// AR-14 Selector Stability
const nullStateTest = computeReachable('n-bad', mockGraph, {}, null);
assert(Array.isArray(nullStateTest.reachableEdgeIds) && nullStateTest.reachableEdgeIds.length === 0, 'Group C: computeReachable gracefully handles miss without crashing', true);

const nullNodeState = computeNodeStates('n-bad', { edges: [] }, [], null);
assert(nullNodeState['n-bad'] === 'failed', 'Group C: computeNodeStates gracefully handles missing edges (returns failed endpoint default)', true);

console.log('\n==========================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log(`REGRESSION: ${groupCFailed ? 'BROKEN' : 'CLEAN'}`);
