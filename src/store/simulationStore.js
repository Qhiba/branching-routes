import { create } from 'zustand';
import { useNarrativeStore } from 'store';
import { evaluateCondition } from 'utils';

function computeReachable(activeNodeId, edges, currentFlagValues) {
  // PRESERVED: AR-07 (Condition Evaluation in Evaluator)
  const reachableEdges = edges.filter(e => e.sourceId === activeNodeId && evaluateCondition(e.condition, currentFlagValues));
  const reachableNodeIds = reachableEdges.map(e => e.targetId);
  return { 
    reachableEdgeIds: reachableEdges.map(e => e.id), 
    reachableNodeIds 
  };
}

// CHANGED: simulationStore previously used applySideEffects for unified sideEffects[] array → now uses applyFlagsSet and applyStatusSet for decoupled collections
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

export const useSimulationStore = create((set, get) => ({
  isRunning: false,
  activeNodeId: null,
  visitedNodeIds: [],
  traversedEdgeIds: [],
  currentFlagValues: {},
  reachableEdgeIds: [],
  reachableNodeIds: [],

  start: () => {
    // INVARIANT: LBA-01
    const graphState = useNarrativeStore.getState();

    const allNodes = [
      ...Object.values(graphState.common || {}),
      ...Object.values(graphState.choice || {}),
      ...Object.values(graphState.ending || {})
    ];
    const startNode = allNodes.find(n => n.data && n.data.isStartNode);
    if (!startNode) {
      throw new Error('No start node exists');
    }

    // CHANGED: Reads graphState.flag and graphState.status (objects) instead of graphState.flags (array) to construct initial values
    const initialFlags = {};
    if (graphState.flag) {
      Object.values(graphState.flag).forEach(f => {
        initialFlags[f.id] = f.state;
      });
    }
    if (graphState.status) {
      Object.values(graphState.status).forEach(s => {
        initialFlags[s.id] = s.value;
      });
    }

    const { reachableEdgeIds, reachableNodeIds } = computeReachable(startNode.id, graphState.edges, initialFlags);

    set({
      isRunning: true,
      activeNodeId: startNode.id,
      visitedNodeIds: [],
      traversedEdgeIds: [],
      currentFlagValues: initialFlags,
      reachableEdgeIds,
      reachableNodeIds
    });
  },

  advance: (edgeId) => {
    const state = get();
    if (!state.reachableEdgeIds.includes(edgeId)) {
      throw new Error('Edge is not reachable');
    }

    // INVARIANT: LBA-01
    const graphState = useNarrativeStore.getState();
    const edge = graphState.edges.find(e => e.id === edgeId);
    if (!edge) throw new Error('Edge not found');


    const isEnding = edge.targetId in (graphState.ending || {});
    let destNode = (graphState.common || {})[edge.targetId] || (graphState.choice || {})[edge.targetId] || (graphState.ending || {})[edge.targetId];
    if (!destNode) throw new Error('Destination node not found');

    let nextFlagValues = { ...state.currentFlagValues };



    // CHANGED: Apply destination node side effects from flags_set[] and status_set[] instead of sideEffects[]
    if (destNode.data) {
      nextFlagValues = applyFlagsSet(destNode.data.flags_set, nextFlagValues);
      nextFlagValues = applyStatusSet(destNode.data.status_set, nextFlagValues);
    }

    if (isEnding) {
      set({
        activeNodeId: destNode.id,
        visitedNodeIds: [...state.visitedNodeIds, state.activeNodeId],
        traversedEdgeIds: [...state.traversedEdgeIds, edgeId],
        currentFlagValues: nextFlagValues,
        reachableEdgeIds: [],
        reachableNodeIds: []
      });
    } else {
      const { reachableEdgeIds, reachableNodeIds } = computeReachable(destNode.id, graphState.edges, nextFlagValues);
      set({
        activeNodeId: destNode.id,
        visitedNodeIds: [...state.visitedNodeIds, state.activeNodeId],
        traversedEdgeIds: [...state.traversedEdgeIds, edgeId],
        currentFlagValues: nextFlagValues,
        reachableEdgeIds,
        reachableNodeIds
      });
    }
  },

  reset: () => {
    // PRESERVED: Simulation lifecycle (start, advance, reset) unchanged structure; internal payload reading adapts.
    set({
      isRunning: false,
      activeNodeId: null,
      visitedNodeIds: [],
      traversedEdgeIds: [],
      currentFlagValues: {},
      reachableEdgeIds: [],
      reachableNodeIds: []
    });
  }
}));
