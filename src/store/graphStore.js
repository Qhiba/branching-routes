import { create } from 'zustand';
import { generateId } from 'utils';

export const useGraphStore = create((set, get) => ({
  meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now() },
  nodes: [],
  edges: [],
  flags: [],
  selectedNodeId: null,
  selectedEdgeId: null,

  addNode: (position, type = 'common') => set((state) => {
    const isStartNode = state.nodes.length === 0;
    const newNode = {
      id: generateId(),
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

  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id),
    edges: state.edges.filter(e => e.sourceId !== id && e.targetId !== id),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    meta: { ...state.meta, updatedAt: Date.now() }
  })),

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

    const newEdge = {
      id: generateId(),
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

  deleteEdge: (id) => set((state) => ({
    edges: state.edges.filter(e => e.id !== id),
    selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    meta: { ...state.meta, updatedAt: Date.now() }
  })),

  addFlag: (name, type, defaultValue) => set((state) => {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new Error('Invalid flag name');
    }
    const newFlag = {
      id: generateId(),
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

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),

  loadGraph: (graphData) => set({
    meta: graphData.meta || { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now() },
    nodes: graphData.nodes || [],
    edges: graphData.edges || [],
    flags: graphData.flags || [],
    selectedNodeId: null,
    selectedEdgeId: null
  }),

  newGraph: () => set({
    meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now() },
    nodes: [],
    edges: [],
    flags: [],
    selectedNodeId: null,
    selectedEdgeId: null
  }),

  exportGraph: () => {
    const state = get();
    return {
      schemaVersion: 1,
      meta: state.meta,
      nodes: state.nodes,
      edges: state.edges,
      flags: state.flags
    };
  }
}));
