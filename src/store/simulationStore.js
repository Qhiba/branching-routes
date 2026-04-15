import { create } from 'zustand';
import { useNarrativeStore } from 'store';
import { evaluateCondition } from 'utils';

function computeReachable(activeNodeId, edges, currentFlagValues) {
  const reachableEdges = edges.filter(e => e.sourceId === activeNodeId && evaluateCondition(e.condition, currentFlagValues));
  const reachableNodeIds = reachableEdges.map(e => e.targetId);
  return { 
    reachableEdgeIds: reachableEdges.map(e => e.id), 
    reachableNodeIds 
  };
}

function applySideEffects(sideEffects, currentFlagValues) {

  if (!sideEffects) return currentFlagValues;
  const nextVals = { ...currentFlagValues };
  sideEffects.forEach(se => {
    const val = se.value;
    const op = se.operation || 'set';
    if (op === 'set') {
      nextVals[se.flagId] = val;
    } else if (op === 'add') {
      if (typeof nextVals[se.flagId] === 'number') {
        nextVals[se.flagId] += val;
      }
    } else if (op === 'subtract') {
       if (typeof nextVals[se.flagId] === 'number') {
        nextVals[se.flagId] -= val;
      }
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

    const initialFlags = {};
    graphState.flags.forEach(f => {
      initialFlags[f.id] = f.defaultValue;
    });

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



    // Apply destination node side effects
    if (destNode.data && destNode.data.sideEffects) {
      nextFlagValues = applySideEffects(destNode.data.sideEffects, nextFlagValues);
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
