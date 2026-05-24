import { create } from 'zustand';
import { useNarrativeStore } from 'store';
import { useUIStore } from 'store';
import { evaluateCondition, computeForwardReachable, computeShortestPaths } from 'utils';
import { useCampaignStore } from './campaignStore.js';

function computeReachable(activeNodeId, graphState, currentFlagValues, selectedOptionId = null) {
  const isChoice = !!(graphState.choice || {})[activeNodeId];

  const reachableEdges = graphState.edges.filter(e => {
    if (e.sourceId !== activeNodeId) return false;
    if (isChoice && e.optionId !== selectedOptionId) return false;
    return evaluateCondition(e.condition, currentFlagValues);
  });

  const reachableNodeIds = reachableEdges.map(e => e.targetId);
  return {
    reachableEdgeIds: reachableEdges.map(e => e.id),
    reachableNodeIds
  };
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

  // Only assign locked/branch_locked once the player has made a selection.
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

  // Mark reachable target nodes so they pulse, signalling they are clickable.
  reachableNodeIds.forEach(nodeId => {
    if (!nodeStates[nodeId]) {
      nodeStates[nodeId] = 'reachable';
    }
  });

  seenNodeIds.forEach(seenId => {
    if (!nodeStates[seenId]) {
      nodeStates[seenId] = 'seen';
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
  statusSet.forEach(({ statusId, amount, mode }) => {
    if (typeof nextVals[statusId] === 'number') {
      nextVals[statusId] = mode === 'set' ? amount : nextVals[statusId] + amount;
    }
  });
  return nextVals;
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
    if (!hasIncoming && !hasOutgoing) {
      orphanedNodeIds.push(id);
    }
  });

  if (startNode) {
    const visited = new Set([startNode.id]);
    const queue = [startNode.id];
    while (queue.length > 0) {
      const current = queue.shift();

      // Follow warp portals
      const currentNode = common[current];
      if (currentNode && currentNode.type === 'warp_entrance') {
        const channel = currentNode.data?.portalChannel;
        const matchingExit = channel ? Object.values(common).find(n => n.type === 'warp_exit' && n.data?.portalChannel === channel) : null;
        if (matchingExit && !visited.has(matchingExit.id)) {
          visited.add(matchingExit.id);
          queue.push(matchingExit.id);
        }
      }

      edges.filter(e => e.sourceId === current).forEach(e => {
        if (!visited.has(e.targetId)) {
          visited.add(e.targetId);
          queue.push(e.targetId);
        }
      });
    }
    allNodeIds.forEach(id => {
      // If it's not visited and not already marked orphaned, it's unreachable
      if (!visited.has(id) && !orphanedNodeIds.includes(id)) {
        unreachableNodeIds.push(id);
      }
    });
  } else {
    allNodeIds.forEach(id => {
      if (!orphanedNodeIds.includes(id)) {
        unreachableNodeIds.push(id);
      }
    });
  }

  return { orphanedNodeIds, unreachableNodeIds };
}

export const useSimulationStore = create((set, get) => ({
  isCampaignActive: false,
  activeNodeId: null,
  visitedNodeIds: [],
  traversedEdgeIds: [],
  currentFlagValues: {},
  reachableEdgeIds: [],
  reachableNodeIds: [],
  seenNodeIds: [],
  nodeStates: {},
  selectedOptionId: null,

  // ADDED: Phase 1 — Traversal Records and Undo
  traversalRecords: [],
  preAdvanceFlagSnapshot: null,

  // ADDED: Phase 3 — Forward-reachability analysis for coverage-gap dimming
  unreachableFromActiveNodeIds: [],

  // ADDED: Phase 4 — Shortest-route pathfinding results
  shortestRouteResults: null,
  shortestRouteTargetNodeId: null,
  isShortestRouteStale: false,

  orphanedNodeIds: [],
  unreachableNodeIds: [],
  sandboxOverrides: {},
  autosaveCampaign: false,

  setAutosaveCampaign: (value) => set({ autosaveCampaign: value }),

  // ADDED: Phase 4 — Shortest-route pathfinding actions
  // initialFlagState: when provided (freeze waypoint), skips the default seeding logic.
  // Scaffold: waypoints array in RouteTracingPanel passes only the active waypoint's
  // flagStateAfter here; multi-waypoint support will chain calls or extend this signature.
  computeRoutesFromStart: (startNodeId, targetNodeId, priorities = [], limit = 50, initialFlagState = null, maxDepth = -1) => {
    const state = get();
    const graphState = useNarrativeStore.getState();

    let seedFlagValues;
    if (initialFlagState !== null) {
      seedFlagValues = initialFlagState;
    } else if (state.isCampaignActive) {
      seedFlagValues = state.currentFlagValues;
    } else {
      // In edit mode currentFlagValues is {}, so seed from narrative defaults so that
      // flag=false conditions and status range conditions evaluate correctly.
      seedFlagValues = {};
      if (graphState.flag) {
        Object.values(graphState.flag).forEach(f => { seedFlagValues[f.id] = f.state; });
      }
      if (graphState.status) {
        Object.values(graphState.status).forEach(s => { seedFlagValues[s.id] = s.value; });
      }
    }

    const result = computeShortestPaths(
      startNodeId,
      targetNodeId,
      graphState,
      seedFlagValues,
      priorities,
      limit,
      maxDepth
    );

    set({
      shortestRouteResults: result.paths,
      shortestRouteTargetNodeId: targetNodeId,
      isShortestRouteStale: false
    });
  },

  setRouteResults: (results) => set({
    shortestRouteResults: results,
    isShortestRouteStale: false
  }),

  // ADDED: Phase 4 — Clear route results
  clearRouteResults: () => set({
    shortestRouteResults: null,
    shortestRouteTargetNodeId: null,
    isShortestRouteStale: false
  }),

  // ADDED: Phase 4 — Mark route results as stale without clearing
  setShortestRouteStale: () => set({ isShortestRouteStale: true }),

  getNodeState: (id) => get().nodeStates[id],

  runPassiveAnalysis: () => {
    const state = get();
    if (state.isCampaignActive) return;

    const graphState = useNarrativeStore.getState();
    const { orphanedNodeIds, unreachableNodeIds } = computePassiveAnalysis(graphState);

    // Memoize / avoid infinite render loop (AR-14)
    const isSameOrphaned = state.orphanedNodeIds.length === orphanedNodeIds.length && state.orphanedNodeIds.every(id => orphanedNodeIds.includes(id));
    const isSameUnreachable = state.unreachableNodeIds.length === unreachableNodeIds.length && state.unreachableNodeIds.every(id => unreachableNodeIds.includes(id));

    if (isSameOrphaned && isSameUnreachable) return;

    set({ orphanedNodeIds, unreachableNodeIds });
  },

  applySandboxOverride: (key, value) => {
    const state = get();
    if (!state.isCampaignActive) return;

    const nextOverrides = { ...state.sandboxOverrides, [key]: value };
    const nextFlagValues = { ...state.currentFlagValues, [key]: value };
    const graphState = useNarrativeStore.getState();

    const { reachableEdgeIds, reachableNodeIds } = computeReachable(state.activeNodeId, graphState, nextFlagValues, state.selectedOptionId);
    const nodeStates = computeNodeStates(state.activeNodeId, graphState, reachableNodeIds, state.selectedOptionId, state.seenNodeIds);

    // Persist locked states just like advance does
    const persistedLocked = {};
    Object.entries(state.nodeStates).forEach(([nodeId, nodeState]) => {
      if ((nodeState === 'locked' || nodeState === 'branch_locked') && nodeId !== state.activeNodeId) {
        persistedLocked[nodeId] = nodeState;
      }
    });

    set({
      sandboxOverrides: nextOverrides,
      currentFlagValues: nextFlagValues,
      reachableEdgeIds,
      reachableNodeIds,
      nodeStates: { ...persistedLocked, ...nodeStates }
    });
  },

  selectOption: (optionId) => {
    const state = get();
    if (!state.isCampaignActive) return;

    const graphState = useNarrativeStore.getState();
    const activeNodeId = state.activeNodeId;
    const choiceNode = (graphState.choice || {})[activeNodeId];

    if (!choiceNode) throw new Error('Active node is not a choice node');

    const option = (choiceNode.data.options || []).find(o => o.id === optionId);
    if (!option) throw new Error('Option not found on active choice node');

    // If another option was already selected, reset to the pre-option baseline before
    // applying the new option's effects — prevents accumulated side effects on re-select.
    const baseline = state.selectedOptionId ? state.preAdvanceFlagSnapshot : state.currentFlagValues;
    const preOptionFlagSnapshot = { ...baseline };

    // Merge option side effects
    let nextFlagValues = { ...baseline };
    nextFlagValues = applyFlagsSet(option.flags_set, nextFlagValues);
    nextFlagValues = applyStatusSet(option.status_set, nextFlagValues);

    const { reachableEdgeIds, reachableNodeIds } = computeReachable(activeNodeId, graphState, nextFlagValues, optionId);
    const nodeStates = computeNodeStates(activeNodeId, graphState, reachableNodeIds, optionId, state.seenNodeIds);

    set({
      // ADDED: Phase 1 — store pre-option snapshot for advance() to use
      preAdvanceFlagSnapshot: preOptionFlagSnapshot,
      selectedOptionId: optionId,
      currentFlagValues: nextFlagValues,
      reachableEdgeIds,
      reachableNodeIds,
      nodeStates
    });
  },

  enterCampaign: (campaignPayload) => {
    // INVARIANT: LBA-01
    // MODIFIED: Phase 4 — clear canvas selection when entering campaign (user must select route target during campaign)
    useUIStore.getState().clearSelection();

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
    if (campaignPayload && campaignPayload.snapshot) {
      if (graphState.flag) {
        Object.values(graphState.flag).forEach(f => {
          initialFlags[f.id] = (campaignPayload.snapshot.flagOverrides && f.id in campaignPayload.snapshot.flagOverrides)
            ? campaignPayload.snapshot.flagOverrides[f.id]
            : f.state;
        });
      }
      if (graphState.status) {
        Object.values(graphState.status).forEach(s => {
          initialFlags[s.id] = (campaignPayload.snapshot.statusOverrides && s.id in campaignPayload.snapshot.statusOverrides)
            ? campaignPayload.snapshot.statusOverrides[s.id]
            : s.value;
        });
      }
    } else {
      // PROTECTED: default initialization seed for zero-argument generic restarts
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
    }

    const snapshot = campaignPayload && campaignPayload.snapshot ? campaignPayload.snapshot : null;
    let resumeNodeId = startNode.id;
    let resumeSeenNodeIds = [];
    let resumeTraversedEdgeIds = [];

    if (snapshot && snapshot.activeNodeId) {
      const nodeExists = allNodes.some(n => n.id === snapshot.activeNodeId);
      if (nodeExists) {
        resumeNodeId = snapshot.activeNodeId;
        resumeSeenNodeIds = Array.isArray(snapshot.seenNodeIds) ? [...snapshot.seenNodeIds] : [];
        resumeTraversedEdgeIds = Array.isArray(snapshot.traversedEdgeIds) ? [...snapshot.traversedEdgeIds] : [];
      }
    }

    const { reachableEdgeIds, reachableNodeIds } = computeReachable(resumeNodeId, graphState, initialFlags);
    const nodeStates = computeNodeStates(resumeNodeId, graphState, reachableNodeIds, null, resumeSeenNodeIds);

    // ADDED: Phase 3 — compute initial forward-reachability for coverage-gap dimming
    const forwardReachable = computeForwardReachable(resumeNodeId, graphState);
    const allNodeIds = [
      ...Object.keys(graphState.common || {}),
      ...Object.keys(graphState.choice || {}),
      ...Object.keys(graphState.ending || {})
    ];
    const initialUnreachableFromActiveNodeIds = allNodeIds.filter(id => !forwardReachable.has(id));

    set({
      isCampaignActive: true,
      activeNodeId: resumeNodeId,
      visitedNodeIds: [],
      seenNodeIds: resumeSeenNodeIds,
      traversedEdgeIds: resumeTraversedEdgeIds,
      currentFlagValues: initialFlags,
      reachableEdgeIds,
      reachableNodeIds,
      nodeStates,
      selectedOptionId: null,
      sandboxOverrides: {},
      orphanedNodeIds: [],
      unreachableNodeIds: [],
      // ADDED: Phase 1 — clear traversal records on campaign enter
      traversalRecords: [],
      preAdvanceFlagSnapshot: null,
      // ADDED: Phase 3 — initialize forward-reachability for coverage-gap dimming
      unreachableFromActiveNodeIds: initialUnreachableFromActiveNodeIds,
      // ADDED: Phase 4 — clear route results on campaign enter
      shortestRouteResults: null,
      shortestRouteTargetNodeId: null,
      isShortestRouteStale: false
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

    // ADDED: Phase 1 — construct traversal record before destination node effects fire
    const traversalRecord = {
      sequence: state.traversalRecords.length,
      edgeId,
      optionId: edge.optionId ?? null,
      fromNodeId: state.activeNodeId,
      toNodeId: edge.targetId,
      flagSnapshot: state.preAdvanceFlagSnapshot ?? { ...state.currentFlagValues },
      seenNodeIdsSnapshot: [...state.seenNodeIds],
      visitedNodeIdsSnapshot: [...state.visitedNodeIds]
    };

    let destNode = (graphState.common || {})[edge.targetId] || (graphState.choice || {})[edge.targetId] || (graphState.ending || {})[edge.targetId];
    if (!destNode) throw new Error('Destination node not found');

    let nextFlagValues = { ...state.currentFlagValues };

    if (destNode.data) {
      nextFlagValues = applyFlagsSet(destNode.data.flags_set, nextFlagValues);
      nextFlagValues = applyStatusSet(destNode.data.status_set, nextFlagValues);
    }

    let finalDestNode = destNode;
    let nextSeenNodeIds = [...state.seenNodeIds, state.activeNodeId];
    let nextVisitedNodeIds = [...state.visitedNodeIds, state.activeNodeId];

    if (destNode.type === 'warp_entrance') {
      const channel = destNode.data?.portalChannel;
      const matchingExit = channel ? Object.values(graphState.common).find(n => n.type === 'warp_exit' && n.data?.portalChannel === channel) : null;
      if (matchingExit) {
        // Record warp entrance node as seen & visited during traversal
        nextSeenNodeIds = [...nextSeenNodeIds, destNode.id];
        nextVisitedNodeIds = [...nextVisitedNodeIds, destNode.id];
        finalDestNode = matchingExit;
        if (finalDestNode.data) {
          nextFlagValues = applyFlagsSet(finalDestNode.data.flags_set, nextFlagValues);
          nextFlagValues = applyStatusSet(finalDestNode.data.status_set, nextFlagValues);
        }
      }
    }

    const isEnding = finalDestNode.id in (graphState.ending || {});

    // Carry forward any locked/branch_locked states from the previous computation.
    // Nodes ruled out by a past choice should stay visually locked for the session.
    // New computation takes priority via spread order.
    const persistedLocked = {};
    Object.entries(state.nodeStates).forEach(([nodeId, nodeState]) => {
      if ((nodeState === 'locked' || nodeState === 'branch_locked') && nodeId !== finalDestNode.id) {
        persistedLocked[nodeId] = nodeState;
      }
    });

    // ADDED: Phase 3 — compute forward-reachable nodes for coverage-gap dimming
    const forwardReachable = computeForwardReachable(finalDestNode.id, graphState);
    const allNodeIds = [
      ...Object.keys(graphState.common || {}),
      ...Object.keys(graphState.choice || {}),
      ...Object.keys(graphState.ending || {})
    ];
    const nextUnreachableFromActiveNodeIds = allNodeIds.filter(id => !forwardReachable.has(id));

    if (isEnding) {
      const newNodeStates = computeNodeStates(finalDestNode.id, graphState, [], null, nextSeenNodeIds);
      set({
        activeNodeId: finalDestNode.id,
        visitedNodeIds: nextVisitedNodeIds,
        seenNodeIds: nextSeenNodeIds,
        traversedEdgeIds: [...state.traversedEdgeIds, edgeId],
        currentFlagValues: nextFlagValues,
        reachableEdgeIds: [],
        reachableNodeIds: [],
        nodeStates: { ...persistedLocked, ...newNodeStates },
        selectedOptionId: null,
        // ADDED: Phase 1 — record traversal and clear pre-snapshot
        traversalRecords: [...state.traversalRecords, traversalRecord],
        preAdvanceFlagSnapshot: null,
        // ADDED: Phase 3 — forward-reachability for coverage-gap dimming
        unreachableFromActiveNodeIds: nextUnreachableFromActiveNodeIds
      });
    } else {
      const { reachableEdgeIds, reachableNodeIds } = computeReachable(finalDestNode.id, graphState, nextFlagValues);
      const newNodeStates = computeNodeStates(finalDestNode.id, graphState, reachableNodeIds, null, nextSeenNodeIds);
      set({
        activeNodeId: finalDestNode.id,
        visitedNodeIds: nextVisitedNodeIds,
        seenNodeIds: nextSeenNodeIds,
        traversedEdgeIds: [...state.traversedEdgeIds, edgeId],
        currentFlagValues: nextFlagValues,
        reachableEdgeIds,
        reachableNodeIds,
        nodeStates: { ...persistedLocked, ...newNodeStates },
        selectedOptionId: null,
        // ADDED: Phase 1 — record traversal and clear pre-snapshot
        traversalRecords: [...state.traversalRecords, traversalRecord],
        preAdvanceFlagSnapshot: null,
        // ADDED: Phase 3 — forward-reachability for coverage-gap dimming
        unreachableFromActiveNodeIds: nextUnreachableFromActiveNodeIds
      });
    }
  },

  // PROTECTED: reset implicitly preserves hard restart by duplicating original zero-arg enterCampaign logic payload-free
  reset: () => {
    const state = get();
    if (!state.isCampaignActive) return; // Only meaningful if active

    // LBA-01
    const graphState = useNarrativeStore.getState();

    const allNodes = [
      ...Object.values(graphState.common || {}),
      ...Object.values(graphState.choice || {}),
      ...Object.values(graphState.ending || {})
    ];
    const startNode = allNodes.find(n => n.data && n.data.isStartNode);
    if (!startNode) return;

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

    const { reachableEdgeIds, reachableNodeIds } = computeReachable(startNode.id, graphState, initialFlags);
    const nodeStates = computeNodeStates(startNode.id, graphState, reachableNodeIds, null, []);

    // ADDED: Phase 3 — compute initial forward-reachability for coverage-gap dimming
    const forwardReachable = computeForwardReachable(startNode.id, graphState);
    const allNodeIds = [
      ...Object.keys(graphState.common || {}),
      ...Object.keys(graphState.choice || {}),
      ...Object.keys(graphState.ending || {})
    ];
    const initialUnreachableFromActiveNodeIds = allNodeIds.filter(id => !forwardReachable.has(id));

    set({
      isCampaignActive: true,
      activeNodeId: startNode.id,
      visitedNodeIds: [],
      seenNodeIds: [],
      traversedEdgeIds: [],
      currentFlagValues: initialFlags,
      reachableEdgeIds,
      reachableNodeIds,
      nodeStates,
      selectedOptionId: null,
      // ADDED: Phase 1 — clear traversal records on reset
      traversalRecords: [],
      preAdvanceFlagSnapshot: null,
      // ADDED: Phase 3 — initialize forward-reachability for coverage-gap dimming
      unreachableFromActiveNodeIds: initialUnreachableFromActiveNodeIds,
      // ADDED: Phase 4 — clear route results on reset
      shortestRouteResults: null,
      shortestRouteTargetNodeId: null,
      isShortestRouteStale: false
    });
  },

  // ADDED: Phase 1 — undo the last node traversal
  undoLastNode: () => {
    const state = get();
    if (!state.isCampaignActive || state.traversalRecords.length === 0) return;

    const record = state.traversalRecords[state.traversalRecords.length - 1];
    const graphState = useNarrativeStore.getState();

    const restoredSeenNodeIds = record.seenNodeIdsSnapshot ?? state.seenNodeIds.slice(0, -1);
    const restoredVisitedNodeIds = record.visitedNodeIdsSnapshot ?? state.visitedNodeIds.slice(0, -1);
    // Restore the option that was selected when this traversal happened so that
    // choice nodes become interactive again (computeReachable filters all edges
    // from a choice node when selectedOptionId is null).
    const restoredOptionId = record.optionId ?? null;
    const { reachableEdgeIds, reachableNodeIds } = computeReachable(
      record.fromNodeId,
      graphState,
      record.flagSnapshot,
      restoredOptionId
    );
    const nodeStates = computeNodeStates(
      record.fromNodeId,
      graphState,
      reachableNodeIds,
      restoredOptionId,
      restoredSeenNodeIds
    );

    // Restore locked states from previous computation
    const persistedLocked = {};
    Object.entries(state.nodeStates).forEach(([nodeId, nodeState]) => {
      if ((nodeState === 'locked' || nodeState === 'branch_locked') && nodeId !== record.fromNodeId) {
        persistedLocked[nodeId] = nodeState;
      }
    });

    // ADDED: Phase 3 — recompute forward-reachability after undo
    const forwardReachable = computeForwardReachable(record.fromNodeId, graphState);
    const allNodeIds = [
      ...Object.keys(graphState.common || {}),
      ...Object.keys(graphState.choice || {}),
      ...Object.keys(graphState.ending || {})
    ];
    const restoredUnreachableFromActiveNodeIds = allNodeIds.filter(id => !forwardReachable.has(id));

    set({
      activeNodeId: record.fromNodeId,
      visitedNodeIds: restoredVisitedNodeIds,
      currentFlagValues: { ...record.flagSnapshot },
      seenNodeIds: restoredSeenNodeIds,
      traversedEdgeIds: state.traversedEdgeIds.slice(0, -1),
      traversalRecords: state.traversalRecords.slice(0, -1),
      reachableEdgeIds,
      reachableNodeIds,
      nodeStates: { ...persistedLocked, ...nodeStates },
      selectedOptionId: restoredOptionId,
      preAdvanceFlagSnapshot: restoredOptionId ? { ...record.flagSnapshot } : null,
      // ADDED: Phase 3 — restore forward-reachability analysis
      unreachableFromActiveNodeIds: restoredUnreachableFromActiveNodeIds,
      // ADDED: Phase 4 — mark route results stale after undo
      isShortestRouteStale: state.shortestRouteResults !== null
    });
  },

  snapshotCampaign: () => {
    const state = get();
    const activeCampaignId = useCampaignStore.getState().activeCampaignId;
    if (!state.isCampaignActive || !activeCampaignId) return;
    if (!useCampaignStore.getState().campaigns[activeCampaignId]) return;
    const graphState = useNarrativeStore.getState();
    const flagOverrides = {};
    const statusOverrides = {};
    Object.entries(state.currentFlagValues).forEach(([id, value]) => {
      if (graphState.flag && graphState.flag[id]) flagOverrides[id] = value;
      else if (graphState.status && graphState.status[id]) statusOverrides[id] = value;
    });

    const snapshot = {
      activeNodeId: state.activeNodeId,
      seenNodeIds: [...state.seenNodeIds],
      traversedEdgeIds: [...state.traversedEdgeIds],
      flagOverrides,
      statusOverrides
    };
    useCampaignStore.getState().updateCampaign(activeCampaignId, { snapshot });
  },

  exitCampaign: () => {
    const state = get();

    // MODIFIED: Phase 4 — clear canvas selection when exiting campaign
    useUIStore.getState().clearSelection();

    // Only auto-snapshot if autosave is enabled
    if (state.autosaveCampaign) {
      const activeCampaignId = useCampaignStore.getState().activeCampaignId;
      if (activeCampaignId && useCampaignStore.getState().campaigns[activeCampaignId]) {
        const graphState = useNarrativeStore.getState();
        const flagOverrides = {};
        const statusOverrides = {};
        Object.entries(state.currentFlagValues).forEach(([id, value]) => {
          if (graphState.flag && graphState.flag[id]) flagOverrides[id] = value;
          else if (graphState.status && graphState.status[id]) statusOverrides[id] = value;
        });

        const snapshot = {
          activeNodeId: state.activeNodeId,
          seenNodeIds: [...state.seenNodeIds],
          traversedEdgeIds: [...state.traversedEdgeIds],
          flagOverrides,
          statusOverrides
        };
        useCampaignStore.getState().updateCampaign(activeCampaignId, { snapshot });
      }
    }

    // PROTECTED: Unconditional tear down sequence runs as before
    set({
      isCampaignActive: false,
      activeNodeId: null,
      visitedNodeIds: [],
      seenNodeIds: [],
      traversedEdgeIds: [],
      currentFlagValues: {},
      reachableEdgeIds: [],
      reachableNodeIds: [],
      nodeStates: {},
      selectedOptionId: null,
      sandboxOverrides: {},
      orphanedNodeIds: [],
      unreachableNodeIds: [],
      // ADDED: Phase 1 — clear traversal records on campaign exit
      traversalRecords: [],
      preAdvanceFlagSnapshot: null,
      // ADDED: Phase 3 — clear forward-reachability analysis on campaign exit
      unreachableFromActiveNodeIds: [],
      // ADDED: Phase 4 — clear route results on campaign exit
      shortestRouteResults: null,
      shortestRouteTargetNodeId: null,
      isShortestRouteStale: false
    });
  }
}));
