import { create } from 'zustand';
import { generateId } from 'utils';
import { useUIStore } from './uiStore.js';

// INVARIANT: HS-08 (Do not import simulationStore to avoid circular dependence)

export const useNarrativeStore = create((set, get) => ({
  // CHANGED: meta gains commonNodeTypes and endingTypes per behaviordelta Meta Storage section.
  meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now(), commonNodeTypes: [], endingTypes: [] },
  // CHANGED: flat nodes[] array -> common{}, choice{}, ending{} typed sub-collections
  common: {},
  choice: {},
  ending: {},
  edges: [],
  flags: [],

  // AMBIGUOUS: A temporary `nodes` getter on Zustand state might be evaluated eagerly by Object.assign. Omitting it. Assuming Phase 1 and 3 are delivered atomically.

  addNode: (position, type = 'common') => set((state) => {
    // CHANGED: isStartNode checks all three sub-collections instead of state.nodes.length
    const isEmpty = Object.keys(state.common).length === 0 && Object.keys(state.choice).length === 0 && Object.keys(state.ending).length === 0;
    const isStartNode = isEmpty;
    const newNode = {
      // MIGRATION: Parallel Support S03
      id: generateId('n'),
      type,
      position,
      data: {
        label: 'Node',
        content: '',
        isStartNode,
        sideEffects: []
      }
    };
    // CHANGED: writes { id, position, data } keyed by id into the sub-collection matching type.
    const target = type === 'ending' ? 'ending' : type === 'choice' ? 'choice' : 'common';
    return {
      [target]: { ...state[target], [newNode.id]: newNode },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  updateNode: (id, patch) => set((state) => {
    // CHANGED: resolves which of the three sub-collections holds id; applies patch to that entry only.
    let target = null;
    let node = null;
    if (state.common[id]) { target = 'common'; node = state.common[id]; }
    else if (state.choice[id]) { target = 'choice'; node = state.choice[id]; }
    else if (state.ending[id]) { target = 'ending'; node = state.ending[id]; }

    if (!target) return state;

    return {
      [target]: {
        ...state[target],
        [id]: { ...node, ...patch, data: { ...node.data, ...patch.data } }
      },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  deleteNode: (id) => {
    set((state) => {
      // CHANGED: resolves collection; deletes the entry; cascades edge deletion unchanged.
      let target = null;
      if (state.common[id]) target = 'common';
      else if (state.choice[id]) target = 'choice';
      else if (state.ending[id]) target = 'ending';

      if (!target) return state;

      const nextCollection = { ...state[target] };
      delete nextCollection[id];

      return {
        [target]: nextCollection,
        edges: state.edges.filter(e => e.sourceId !== id && e.targetId !== id),
        meta: { ...state.meta, updatedAt: Date.now() }
      };
    });
    // MIGRATION: S25 — In-place migration 
    // INVARIANT: BI-04
    // PRESERVED: Reliable Cross-Store Deletion Synchronization
    useUIStore.getState().clearIfSelected(id, 'node');
  },

  setStartNode: (id) => set((state) => {
    // CHANGED: maps across all three sub-collections to set isStartNode.
    const updateCollection = (col) => {
      const nextCol = {};
      for (const [key, val] of Object.entries(col)) {
        nextCol[key] = { ...val, data: { ...val.data, isStartNode: key === id } };
      }
      return nextCol;
    };

    return {
      common: updateCollection(state.common),
      choice: updateCollection(state.choice),
      ending: updateCollection(state.ending),
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  addEdge: (sourceId, targetId) => set((state) => {
    // CHANGED: replaces state.nodes.find(...)?.type === 'ending' with sourceId in state.ending.
    // PRESERVED: Safely Rejecting Terminus Edges
    if (sourceId in state.ending) {
      throw new Error("Cannot add an edge from an 'ending' node");
    }
    if (state.edges.some(e => e.sourceId === sourceId && e.targetId === targetId)) {
      throw new Error("Edge already exists between these nodes");
    }

    const newEdge = {
      // MIGRATION: Parallel Support S03
      id: generateId('e'),
      sourceId,
      targetId,
      label: '',
      condition: null
      // CHANGED: new edge object removes sideEffects: [].
    };

    return {
      edges: [...state.edges, newEdge],
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  updateEdge: (id, patch) => set((state) => ({
    edges: state.edges.map(e => e.id === id ? { ...e, ...patch } : e),
    meta: { ...state.meta, updatedAt: Date.now() }
  })),

  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter(e => e.id !== id),
      meta: { ...state.meta, updatedAt: Date.now() }
    }));
    // MIGRATION: S25 — In-place migration
    // INVARIANT: BI-05
    // PRESERVED: Reliable Cross-Store Deletion Synchronization
    useUIStore.getState().clearIfSelected(id, 'edge');
  },

  addFlag: (name, type, defaultValue) => set((state) => {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new Error('Invalid flag name');
    }
    const newFlag = {
      // MIGRATION: Parallel Support S03
      id: generateId('f'),
      name,
      type,
      defaultValue
    };
    return {
      flags: [...state.flags, newFlag],
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  updateFlag: (id, patch) => set((state) => ({
    flags: state.flags.map(f => f.id === id ? { ...f, ...patch } : f),
    meta: { ...state.meta, updatedAt: Date.now() }
  })),

  deleteFlag: (id) => {
    // PRESERVED: Robust Flag Reference Checking
    const state = get();
    const references = [];

    state.edges.forEach(e => {
      if (e.condition && e.condition.clauses) {
        if (e.condition.clauses.some(c => c.flagId === id)) {
          references.push(`edge_condition:${e.id}`);
        }
      }
      // CHANGED: removes the edge.sideEffects scan.
    });

    // CHANGED: updates node scan to use Object.values(state.common|choice|ending).
    const allNodes = [
      ...Object.values(state.common),
      ...Object.values(state.choice),
      ...Object.values(state.ending)
    ];

    allNodes.forEach(n => {
      if (n.data && n.data.sideEffects && n.data.sideEffects.some(se => se.flagId === id)) {
        references.push(`node_sideEffect:${n.id}`);
      }
    });

    if (references.length > 0) {
      return { blocked: true, references };
    }

    set((state) => ({
      flags: state.flags.filter(f => f.id !== id),
      meta: { ...state.meta, updatedAt: Date.now() }
    }));
    return { blocked: false };
  },

  updateMeta: (patch) => set((state) => ({
    meta: { ...state.meta, ...patch, updatedAt: Date.now() }
  })),

  loadGraph: (graphData) => {
    // INVARIANT: LBA-02
    // INVARIANT: HS-04
    // MIGRATION: Parallel Support S03 (accepts both bare UUID and prefixed ID transparently)
    // CHANGED: receives the new normalized shape; assigns common, choice, ending, edges, flags, meta.
    set({
      meta: {
        title: 'Untitled Graph',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        commonNodeTypes: [],
        endingTypes: [],
        ...graphData.meta
      },
      common: graphData.common || {},
      choice: graphData.choice || {},
      ending: graphData.ending || {},
      edges: graphData.edges || [],
      flags: graphData.flags || []
    });
    // MIGRATION: S25 — In-place migration
    // INVARIANT: BI-16
    useUIStore.getState().resetSelection();
  },

  newGraph: () => {
    // CHANGED: resets common: {}, choice: {}, ending: {}, edges: [], flags: [].
    set({
      meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now(), commonNodeTypes: [], endingTypes: [] },
      common: {},
      choice: {},
      ending: {},
      edges: [],
      flags: []
    });
    // MIGRATION: S25 — In-place migration
    // INVARIANT: BI-16
    useUIStore.getState().resetSelection();
  },

  exportGraph: () => {
    const state = get();

    const formatTs = (ts) => {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    return {
      // MIGRATION: exportGraph() bumps schemaVersion to 2.
      schemaVersion: 2,
      meta: {
        ...state.meta,
        createdAt: formatTs(state.meta.createdAt),
        updatedAt: formatTs(state.meta.updatedAt)
        // CHANGED: meta includes commonNodeTypes and endingTypes.
      },
      // CHANGED: emits common, choice, ending instead of nodes.
      common: state.common,
      choice: state.choice,
      ending: state.ending,
      edges: state.edges,
      flags: state.flags
    };
  }
}));

if (typeof window !== 'undefined') {
  window.useNarrativeStore = useNarrativeStore;
}
