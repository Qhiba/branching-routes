const { createStore } = require('zustand/vanilla');

// ==========================================
// MOCKS & INLINED DEPENDENCIES
// ==========================================
let mockNarrativeState = {
  common: {}, choice: {}, ending: {}, edges: [], flag: {}, status: {}
};

const useNarrativeStore = {
  getState: () => mockNarrativeState
};

function evaluateCondition(conditionObj, currentValues) {
  if (!conditionObj) return true;
  if (conditionObj.operator === '==') {
    return currentValues[conditionObj.conditions[0].flag] === true;
  }
  return false;
}

// ==========================================
// INLINED PHASE LOGIC
// ==========================================
function computeReachable(activeNodeId, edges, currentFlagValues) {
  const reachableEdges = edges.filter(e => e.sourceId === activeNodeId && evaluateCondition(e.condition, currentFlagValues));
  const reachableNodeIds = reachableEdges.map(e => e.targetId);
  return { 
    reachableEdgeIds: reachableEdges.map(e => e.id), 
    reachableNodeIds 
  };
}

function computeNodeStates(activeNodeId, graphState, reachableNodeIds) {
  const nodeStates = {};
  const { edges, ending = {} } = graphState;

  const isEnding = !!ending[activeNodeId];
  const hasOutgoingEdges = edges.some(e => e.sourceId === activeNodeId);

  if (isEnding) {
    nodeStates[activeNodeId] = 'complete';
  } else if (!hasOutgoingEdges) {
    nodeStates[activeNodeId] = 'failed';
  } else {
    nodeStates[activeNodeId] = 'active';
  }

  const targetIds = [...new Set(edges.filter(e => e.sourceId === activeNodeId).map(e => e.targetId))];
  targetIds.forEach(targetId => {
    if (!reachableNodeIds.includes(targetId)) {
      if (!nodeStates[targetId]) {
        nodeStates[targetId] = 'locked';
      }
    }
  });

  return nodeStates;
}

function applyFlagsSet(flagsSet, currentFlagValues) {
  if (!flagsSet) return currentFlagValues;
  const nextVals = { ...currentFlagValues };
  flagsSet.forEach(flagId => {
    nextVals[flagId] = true;
  });
  return nextVals;
}

function applyStatusSet(statusSet, currentFlagValues) {
  if (!statusSet) return currentFlagValues;
  const nextVals = { ...currentFlagValues };
  statusSet.forEach(({ statusId, amount }) => {
    if (typeof nextVals[statusId] === 'number') {
      nextVals[statusId] += amount;
    }
  });
  return nextVals;
}

const useSimulationStore = createStore((set, get) => ({
  isCampaignActive: false,
  activeNodeId: null,
  visitedNodeIds: [],
  traversedEdgeIds: [],
  currentFlagValues: {},
  reachableEdgeIds: [],
  reachableNodeIds: [],
  seenNodeIds: [],
  nodeStates: {},

  getNodeState: (id) => get().nodeStates[id],

  enterCampaign: () => {
    const graphState = useNarrativeStore.getState();
    const allNodes = [
      ...Object.values(graphState.common || {}),
      ...Object.values(graphState.choice || {}),
      ...Object.values(graphState.ending || {})
    ];
    const startNode = allNodes.find(n => n.data && n.data.isStartNode);
    if (!startNode) throw new Error('No start node exists');

    const initialFlags = {};
    if (graphState.flag) Object.values(graphState.flag).forEach(f => { initialFlags[f.id] = f.state; });
    if (graphState.status) Object.values(graphState.status).forEach(s => { initialFlags[s.id] = s.value; });

    const { reachableEdgeIds, reachableNodeIds } = computeReachable(startNode.id, graphState.edges, initialFlags);
    const nodeStates = computeNodeStates(startNode.id, graphState, reachableNodeIds);

    set({
      isCampaignActive: true,
      activeNodeId: startNode.id,
      visitedNodeIds: [],
      seenNodeIds: [],
      traversedEdgeIds: [],
      currentFlagValues: initialFlags,
      reachableEdgeIds,
      reachableNodeIds,
      nodeStates
    });
  },

  advance: (edgeId) => {
    const state = get();
    if (!state.reachableEdgeIds.includes(edgeId)) throw new Error('Edge is not reachable');

    const graphState = useNarrativeStore.getState();
    const edge = graphState.edges.find(e => e.id === edgeId);
    if (!edge) throw new Error('Edge not found');

    const isEnding = edge.targetId in (graphState.ending || {});
    let destNode = (graphState.common || {})[edge.targetId] || (graphState.choice || {})[edge.targetId] || (graphState.ending || {})[edge.targetId];
    if (!destNode) throw new Error('Destination node not found');

    let nextFlagValues = { ...state.currentFlagValues };
    if (destNode.data) {
      nextFlagValues = applyFlagsSet(destNode.data.flags_set, nextFlagValues);
      nextFlagValues = applyStatusSet(destNode.data.status_set, nextFlagValues);
    }

    if (isEnding) {
      const newNodeStates = computeNodeStates(destNode.id, graphState, []);
      set({
        activeNodeId: destNode.id,
        visitedNodeIds: [...state.visitedNodeIds, state.activeNodeId],
        seenNodeIds: [...state.seenNodeIds, state.activeNodeId],
        traversedEdgeIds: [...state.traversedEdgeIds, edgeId],
        currentFlagValues: nextFlagValues,
        reachableEdgeIds: [],
        reachableNodeIds: [],
        nodeStates: newNodeStates
      });
    } else {
      const { reachableEdgeIds, reachableNodeIds } = computeReachable(destNode.id, graphState.edges, nextFlagValues);
      const newNodeStates = computeNodeStates(destNode.id, graphState, reachableNodeIds);
      set({
        activeNodeId: destNode.id,
        visitedNodeIds: [...state.visitedNodeIds, state.activeNodeId],
        seenNodeIds: [...state.seenNodeIds, state.activeNodeId],
        traversedEdgeIds: [...state.traversedEdgeIds, edgeId],
        currentFlagValues: nextFlagValues,
        reachableEdgeIds,
        reachableNodeIds,
        nodeStates: newNodeStates
      });
    }
  },

  reset: () => {
    const state = get();
    if (!state.isCampaignActive) return;

    const graphState = useNarrativeStore.getState();
    const allNodes = [
      ...Object.values(graphState.common || {}),
      ...Object.values(graphState.choice || {}),
      ...Object.values(graphState.ending || {})
    ];
    const startNode = allNodes.find(n => n.data && n.data.isStartNode);
    if (!startNode) return;

    const initialFlags = {};
    if (graphState.flag) Object.values(graphState.flag).forEach(f => { initialFlags[f.id] = f.state; });
    if (graphState.status) Object.values(graphState.status).forEach(s => { initialFlags[s.id] = s.value; });

    const { reachableEdgeIds, reachableNodeIds } = computeReachable(startNode.id, graphState.edges, initialFlags);
    const nodeStates = computeNodeStates(startNode.id, graphState, reachableNodeIds);

    set({
      isCampaignActive: true,
      activeNodeId: startNode.id,
      visitedNodeIds: [],
      seenNodeIds: [],
      traversedEdgeIds: [],
      currentFlagValues: initialFlags,
      reachableEdgeIds,
      reachableNodeIds,
      nodeStates
    });
  },

  exitCampaign: () => {
    set({
      isCampaignActive: false,
      activeNodeId: null,
      visitedNodeIds: [],
      seenNodeIds: [],
      traversedEdgeIds: [],
      currentFlagValues: {},
      reachableEdgeIds: [],
      reachableNodeIds: [],
      nodeStates: {}
    });
  }
}));

// ==========================================
// TEST HARNESS
// ==========================================
let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       > ${err.message}`);
    testsFailed++;
  }
}

function setupScenario() {
  mockNarrativeState = {
    common: {
      'n1': { id: 'n1', data: { isStartNode: true } },
      'n2': { id: 'n2', data: {} }
    },
    choice: {},
    ending: {
      'end': { id: 'end', data: {} }
    },
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', condition: null },
      { id: 'e2', sourceId: 'n1', targetId: 'end', condition: { operator: '==', conditions: [{ flag: 'f_dummy' }] } },
      { id: 'e3', sourceId: 'n2', targetId: 'end', condition: null }
    ],
    flag: {
      'f_dummy': { id: 'f_dummy', state: false }
    },
    status: {}
  };
}

console.log('=== RUNNING TESTS FOR PHASE 1 & 2 ===\\n');

// ------------------------------------------
// GROUP A: OLD BEHAVIOR TOMBSTONES
// ------------------------------------------
runTest('Group A - Phase 1: store uses isCampaignActive instead of isRunning', () => {
  const state = useSimulationStore.getState();
  if ('isRunning' in state) throw new Error('isRunning property still survives');
  if ('start' in state) throw new Error('start() action still survives');
});

runTest('Group A - Phase 2: computeNodeStates returns named enums instead of booleans', () => {
  setupScenario();
  const states = computeNodeStates('n1', mockNarrativeState, ['n2']);
  if (states['n1'] !== 'active') throw new Error('Expected active enum string for active node');
  if (states['end'] !== 'locked') throw new Error('Expected locked enum string for unreachable target');
  if (states['n2'] !== undefined) throw new Error('Expected undefined enum string for purely reachable node');
});

// ------------------------------------------
// GROUP B: NEW BEHAVIOR CONFIRMATION
// ------------------------------------------
runTest('Group B - Phase 1: enterCampaign initiates campaign mode', () => {
  setupScenario();
  useSimulationStore.getState().enterCampaign();
  const state = useSimulationStore.getState();
  if (!state.isCampaignActive) throw new Error('isCampaignActive flag not true');
  if (state.activeNodeId !== 'n1') throw new Error('activeNodeId not correctly mapped');
});

runTest('Group B - Phase 1: reset softly restarts without dropping flag', () => {
  setupScenario();
  useSimulationStore.getState().enterCampaign();
  useSimulationStore.getState().advance('e1'); // moves to n2
  if (useSimulationStore.getState().activeNodeId !== 'n2') throw new Error('Advance failed');
  
  useSimulationStore.getState().reset();
  const state = useSimulationStore.getState();
  if (!state.isCampaignActive) throw new Error('reset wiped campaign active flag');
  if (state.activeNodeId !== 'n1') throw new Error('reset failed to bring active node back to origin');
});

runTest('Group B - Phase 1: exitCampaign hard drops the graph state', () => {
  useSimulationStore.getState().exitCampaign();
  const state = useSimulationStore.getState();
  if (state.isCampaignActive) throw new Error('exitCampaign failed to reset isCampaignActive');
  if (state.activeNodeId !== null) throw new Error('exitCampaign failed to nullify active node');
});

runTest('Group B - Phase 2: seenNodeIds tracks history correctly on advance', () => {
  setupScenario();
  useSimulationStore.getState().enterCampaign(); // n1 active
  useSimulationStore.getState().advance('e1');   // jumps to n2
  const state = useSimulationStore.getState();
  if (!state.seenNodeIds.includes('n1')) throw new Error('Node n1 absent from seenNodeIds after advance');
});

runTest('Group B - Phase 2: complete and failed node states evaluate properly', () => {
  setupScenario();
  mockNarrativeState.common['n3'] = { id: 'n3', data: {} }; // dead end
  mockNarrativeState.edges.push({ id: 'e4', sourceId: 'n2', targetId: 'n3' });
  
  const endState = computeNodeStates('end', mockNarrativeState, []);
  if (endState['end'] !== 'complete') throw new Error('Ending node not evaluated as complete');
  
  const failedState = computeNodeStates('n3', mockNarrativeState, []);
  if (failedState['n3'] !== 'failed') throw new Error('Dead end node not evaluated as failed');
});

// ------------------------------------------
// GROUP C: REGRESSION SUITE
// ------------------------------------------
runTest('Group C - Phase 1/2: AR-08 Simulation Isolation verified via exitCampaign', () => {
  setupScenario();
  useSimulationStore.getState().enterCampaign();
  useSimulationStore.getState().exitCampaign();
  const state = useSimulationStore.getState();
  
  if (state.isCampaignActive !== false || state.reachableNodeIds.length !== 0 || Object.keys(state.nodeStates).length !== 0) {
    throw new Error('Simulation state payload not safely flushed');
  }
  
  if (!mockNarrativeState.common['n1']) {
    throw new Error('Store bleed occurred! Narrative graph mutilated by simulated teardown.');
  }
});

console.log('\\n------------------------------------------');
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log(`REGRESSION: ${testsFailed === 0 ? 'CLEAN' : 'BROKEN'}`);
console.log('------------------------------------------\\n');
