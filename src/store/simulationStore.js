import { create } from 'zustand';
import { useNarrativeStore } from 'store';
import { evaluateCondition } from 'utils';
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
  statusSet.forEach(({ statusId, amount }) => {
    if (typeof nextVals[statusId] === 'number') {
      nextVals[statusId] += amount;
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

  orphanedNodeIds: [],
  unreachableNodeIds: [],
  sandboxOverrides: {},
  autosaveCampaign: false,

  setAutosaveCampaign: (value) => set({ autosaveCampaign: value }),

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

    // Merge option side effects
    let nextFlagValues = { ...state.currentFlagValues };
    nextFlagValues = applyFlagsSet(option.flags_set, nextFlagValues);
    nextFlagValues = applyStatusSet(option.status_set, nextFlagValues);

    const { reachableEdgeIds, reachableNodeIds } = computeReachable(activeNodeId, graphState, nextFlagValues, optionId);
    const nodeStates = computeNodeStates(activeNodeId, graphState, reachableNodeIds, optionId, state.seenNodeIds);

    set({
      selectedOptionId: optionId,
      currentFlagValues: nextFlagValues,
      reachableEdgeIds,
      reachableNodeIds,
      nodeStates
    });
  },

  enterCampaign: (campaignPayload) => {
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
      unreachableNodeIds: []
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



    if (destNode.data) {
      nextFlagValues = applyFlagsSet(destNode.data.flags_set, nextFlagValues);
      nextFlagValues = applyStatusSet(destNode.data.status_set, nextFlagValues);
    }

    // Carry forward any locked/branch_locked states from the previous computation.
    // Nodes ruled out by a past choice should stay visually locked for the session.
    // New computation takes priority via spread order.
    const persistedLocked = {};
    Object.entries(state.nodeStates).forEach(([nodeId, nodeState]) => {
      if ((nodeState === 'locked' || nodeState === 'branch_locked') && nodeId !== edge.targetId) {
        persistedLocked[nodeId] = nodeState;
      }
    });

    if (isEnding) {
      const nextSeenNodeIds = [...state.seenNodeIds, state.activeNodeId];
      const newNodeStates = computeNodeStates(destNode.id, graphState, [], null, nextSeenNodeIds);
      set({
        activeNodeId: destNode.id,
        visitedNodeIds: [...state.visitedNodeIds, state.activeNodeId],
        seenNodeIds: nextSeenNodeIds,
        traversedEdgeIds: [...state.traversedEdgeIds, edgeId],
        currentFlagValues: nextFlagValues,
        reachableEdgeIds: [],
        reachableNodeIds: [],
        nodeStates: { ...persistedLocked, ...newNodeStates },
        selectedOptionId: null
      });
    } else {
      const nextSeenNodeIds = [...state.seenNodeIds, state.activeNodeId];
      const { reachableEdgeIds, reachableNodeIds } = computeReachable(destNode.id, graphState, nextFlagValues);
      const newNodeStates = computeNodeStates(destNode.id, graphState, reachableNodeIds, null, nextSeenNodeIds);
      set({
        activeNodeId: destNode.id,
        visitedNodeIds: [...state.visitedNodeIds, state.activeNodeId],
        seenNodeIds: nextSeenNodeIds,
        traversedEdgeIds: [...state.traversedEdgeIds, edgeId],
        currentFlagValues: nextFlagValues,
        reachableEdgeIds,
        reachableNodeIds,
        nodeStates: { ...persistedLocked, ...newNodeStates },
        selectedOptionId: null
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
      selectedOptionId: null
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
      unreachableNodeIds: []
    });
  }
}));
