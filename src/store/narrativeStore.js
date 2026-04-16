import { create } from 'zustand';
import { generateId } from 'utils';
import { useUIStore } from './uiStore.js';

// INVARIANT: HS-08 (Do not import simulationStore to avoid circular dependence)

export const useNarrativeStore = create((set, get) => ({
  meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now(), commonNodeTypes: [], endingTypes: [] },
  common: {},
  choice: {},
  ending: {},
  edges: [],
  // CHANGED: flags[] -> flag{} and status{} dictionaries
  flag: {},
  status: {},



  addNode: (position, type = 'common') => set((state) => {

    const isEmpty = Object.keys(state.common).length === 0 && Object.keys(state.choice).length === 0 && Object.keys(state.ending).length === 0;
    const isStartNode = isEmpty;
    const newNode = {

      id: generateId('n'),
      type,
      position,
      data: {
        label: 'Node',
        content: '',
        isStartNode,
        // CHANGED: sideEffects: [] -> flags_set: [] and status_set: []
        flags_set: [],
        status_set: []
      }
    };

    const target = type === 'ending' ? 'ending' : type === 'choice' ? 'choice' : 'common';
    return {
      [target]: { ...state[target], [newNode.id]: newNode },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  updateNode: (id, patch) => set((state) => {

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
    // INVARIANT: BI-04
    useUIStore.getState().clearIfSelected(id, 'node');
  },

  setStartNode: (id) => set((state) => {

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

    if (sourceId in state.ending) {
      throw new Error("Cannot add an edge from an 'ending' node");
    }
    if (state.edges.some(e => e.sourceId === sourceId && e.targetId === targetId)) {
      throw new Error("Edge already exists between these nodes");
    }

    const newEdge = {

      id: generateId('e'),
      sourceId,
      targetId,
      label: '',
      condition: null

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
    // INVARIANT: BI-05
    useUIStore.getState().clearIfSelected(id, 'edge');
  },

  // CHANGED: addFlag signature changed to accept state instead of type/defaultValue, writes to flag{}
  addFlag: (name, stateVal) => set((state) => {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new Error('Invalid flag name');
    }
    const id = generateId('f');
    const newFlag = {
      id,
      name,
      state: stateVal
    };
    return {
      flag: { ...state.flag, [id]: newFlag },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // CHANGED: addStatus added to manage numeric status points in status{}
  addStatus: (name, value, minValue, maxValue) => set((state) => {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new Error('Invalid status name');
    }
    const id = generateId('sp');
    const newStatus = {
      id,
      name,
      value,
      minValue,
      maxValue
    };
    return {
      status: { ...state.status, [id]: newStatus },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // CHANGED: updateFlag signature kept but operates on flag{}
  updateFlag: (id, patch) => set((state) => {
    if (!state.flag[id]) return state;
    return {
      flag: { ...state.flag, [id]: { ...state.flag[id], ...patch } },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // CHANGED: updateStatus added to operate on status{}
  updateStatus: (id, patch) => set((state) => {
    if (!state.status[id]) return state;
    return {
      status: { ...state.status, [id]: { ...state.status[id], ...patch } },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // CHANGED: deleteFlag checks conditions[] for flag and flags_set[] on nodes
  deleteFlag: (id) => {
    const state = get();
    const references = [];

    state.edges.forEach(e => {
      // PRESERVED: Referential Integrity behavior
      if (e.condition && e.condition.conditions) {
        if (e.condition.conditions.some(c => c.flag === id)) {
          references.push(`edge_condition:${e.id}`);
        }
      }
    });

    const allNodes = [
      ...Object.values(state.common),
      ...Object.values(state.choice),
      ...Object.values(state.ending)
    ];

    allNodes.forEach(n => {
      if (n.data && n.data.flags_set && n.data.flags_set.includes(id)) {
        references.push(`node_sideEffect:${n.id}`);
      }
    });

    if (references.length > 0) {
      return { blocked: true, references };
    }

    set((state) => {
      const nextFlag = { ...state.flag };
      delete nextFlag[id];
      return {
        flag: nextFlag,
        meta: { ...state.meta, updatedAt: Date.now() }
      };
    });
    return { blocked: false };
  },

  // CHANGED: deleteStatus added to check conditions[] for status and status_set[] on nodes
  deleteStatus: (id) => {
    const state = get();
    const references = [];

    state.edges.forEach(e => {
      // PRESERVED: Referential Integrity behavior
      if (e.condition && e.condition.conditions) {
        if (e.condition.conditions.some(c => c.status === id)) {
          references.push(`edge_condition:${e.id}`);
        }
      }
    });

    const allNodes = [
      ...Object.values(state.common),
      ...Object.values(state.choice),
      ...Object.values(state.ending)
    ];

    allNodes.forEach(n => {
      if (n.data && n.data.status_set && n.data.status_set.some(se => se.statusId === id)) {
        references.push(`node_sideEffect:${n.id}`);
      }
    });

    if (references.length > 0) {
      return { blocked: true, references };
    }

    set((state) => {
      const nextStatus = { ...state.status };
      delete nextStatus[id];
      return {
        status: nextStatus,
        meta: { ...state.meta, updatedAt: Date.now() }
      };
    });
    return { blocked: false };
  },

  updateMeta: (patch) => set((state) => ({
    meta: { ...state.meta, ...patch, updatedAt: Date.now() }
  })),

  loadGraph: (graphData) => {
    // INVARIANT: LBA-02
    // INVARIANT: HS-04

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
      // CHANGED: flags -> flag, status
      flag: graphData.flag || {},
      status: graphData.status || {}
    });

    // INVARIANT: BI-16
    useUIStore.getState().resetSelection();
  },

  newGraph: () => {

    set({
      meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now(), commonNodeTypes: [], endingTypes: [] },
      common: {},
      choice: {},
      ending: {},
      edges: [],
      // CHANGED: flags -> flag, status for new empty graphs
      flag: {},
      status: {}
    });

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

      // CHANGED: schemaVersion 2 -> 3
      schemaVersion: 3,
      meta: {
        ...state.meta,
        createdAt: formatTs(state.meta.createdAt),
        updatedAt: formatTs(state.meta.updatedAt)

      },

      common: state.common,
      choice: state.choice,
      ending: state.ending,
      edges: state.edges,
      // CHANGED: flags -> flag, status
      flag: state.flag,
      status: state.status
    };
  }
}));

if (typeof window !== 'undefined') {
  window.useNarrativeStore = useNarrativeStore;
}
