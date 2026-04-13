import { create } from 'zustand';
import { generateId } from 'utils';
import { useUIStore } from './uiStore.js';

export const useGraphStore = create((set, get) => ({
  meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now() },
  nodes: [],
  edges: [],
  flags: [],

  addNode: (position, type = 'common') => set((state) => {
    const isStartNode = state.nodes.length === 0;
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
    return {
      nodes: [...state.nodes, newNode],
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  updateNode: (id, patch) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, ...patch, data: { ...n.data, ...patch.data } } : n),
    meta: { ...state.meta, updatedAt: Date.now() }
  })),

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter(n => n.id !== id),
      edges: state.edges.filter(e => e.sourceId !== id && e.targetId !== id),
      meta: { ...state.meta, updatedAt: Date.now() }
    }));
    // MIGRATION: S25 — In-place migration 
    // INVARIANT: BI-04
    useUIStore.getState().clearIfSelected(id, 'node');
  },

  setStartNode: (id) => set((state) => ({
    nodes: state.nodes.map(n => ({
      ...n,
      data: { ...n.data, isStartNode: n.id === id }
    })),
    meta: { ...state.meta, updatedAt: Date.now() }
  })),

  addEdge: (sourceId, targetId) => set((state) => {
    const sourceNode = state.nodes.find(n => n.id === sourceId);
    if (sourceNode && sourceNode.type === 'ending') {
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
      condition: null,
      sideEffects: []
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
    const state = get();
    const references = [];

    state.edges.forEach(e => {
      if (e.condition && e.condition.clauses) {
        if (e.condition.clauses.some(c => c.flagId === id)) {
          references.push(`edge_condition:${e.id}`);
        }
      }
      if (e.sideEffects && e.sideEffects.some(se => se.flagId === id)) {
        references.push(`edge_sideEffect:${e.id}`);
      }
    });

    state.nodes.forEach(n => {
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
    set({
      meta: graphData.meta || { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now() },
      nodes: graphData.nodes || [],
      edges: graphData.edges || [],
      flags: graphData.flags || []
    });
    // MIGRATION: S25 — In-place migration
    // INVARIANT: BI-16
    useUIStore.getState().resetSelection();
  },

  newGraph: () => {
    set({
      meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now() },
      nodes: [],
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
      schemaVersion: 1,
      meta: {
        ...state.meta,
        createdAt: formatTs(state.meta.createdAt),
        updatedAt: formatTs(state.meta.updatedAt)
      },
      nodes: state.nodes,
      edges: state.edges,
      flags: state.flags
    };
  }
}));

if (typeof window !== 'undefined') {
  window.useGraphStore = useGraphStore;
}
