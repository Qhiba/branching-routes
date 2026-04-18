import { create } from 'zustand';
import { generateId } from 'utils';
import { useUIStore } from './uiStore.js';

// PROTECTED: INVARIANT HS-08 (Do not import simulationStore to avoid circular dependence) is preserved
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
  // ADDED: path{} and chapter{} for node grouping metadata
  path: {},
  chapter: {},



  // PROTECTED: Existing CRUD actions remain unchanged
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

  // MODIFIED: added optional optionId third argument — stamped on edge when provided (Phase 1)
  addEdge: (sourceId, targetId, optionId = null) => set((state) => {

    if (sourceId in state.ending) {
      throw new Error("Cannot add an edge from an 'ending' node");
    }
    if (state.edges.some(e => e.sourceId === sourceId && e.targetId === targetId && e.optionId === optionId)) {
      throw new Error("Edge already exists between these nodes for this specific option or fallback");
    }

    const newEdge = {

      id: generateId('e'),
      sourceId,
      targetId,
      label: '',
      condition: null,
      // ADDED: optionId links this edge to a specific option handle on a choice node (null if not from an option handle)
      optionId: optionId || null

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
  // MODIFIED: extended scan to also cover variants[].requires and options[].requires + options[].flags_set (Phase 1)
  deleteFlag: (id) => {
    const state = get();
    const references = [];

    state.edges.forEach(e => {
      // PROTECTED: Referential Integrity behavior — edge condition scan preserved
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
      // PROTECTED: node flags_set scan preserved
      if (n.data && n.data.flags_set && n.data.flags_set.includes(id)) {
        references.push(`node_sideEffect:${n.id}`);
      }
      // ADDED: scan variants[].requires.conditions for flag references (Phase 1)
      if (n.data && Array.isArray(n.data.variants)) {
        n.data.variants.forEach(v => {
          if (v.requires && Array.isArray(v.requires.conditions)) {
            if (v.requires.conditions.some(c => c.flag === id)) {
              references.push(`variant_requires:${n.id}:${v.id}`);
            }
          }
        });
      }
      // ADDED: scan options[].requires.conditions and options[].flags_set for flag references (Phase 1)
      if (n.data && Array.isArray(n.data.options)) {
        n.data.options.forEach(opt => {
          if (opt.requires && Array.isArray(opt.requires.conditions)) {
            if (opt.requires.conditions.some(c => c.flag === id)) {
              references.push(`option_requires:${n.id}:${opt.id}`);
            }
          }
          if (Array.isArray(opt.flags_set) && opt.flags_set.includes(id)) {
            references.push(`option_flags_set:${n.id}:${opt.id}`);
          }
        });
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
  // MODIFIED: extended scan to also cover variants[].requires and options[].requires + options[].status_set (Phase 1)
  deleteStatus: (id) => {
    const state = get();
    const references = [];

    state.edges.forEach(e => {
      // PROTECTED: Referential Integrity behavior — edge condition scan preserved
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
      // PROTECTED: node status_set scan preserved
      if (n.data && n.data.status_set && n.data.status_set.some(se => se.statusId === id)) {
        references.push(`node_sideEffect:${n.id}`);
      }
      // ADDED: scan variants[].requires.conditions for status references (Phase 1)
      if (n.data && Array.isArray(n.data.variants)) {
        n.data.variants.forEach(v => {
          if (v.requires && Array.isArray(v.requires.conditions)) {
            if (v.requires.conditions.some(c => c.status === id)) {
              references.push(`variant_requires:${n.id}:${v.id}`);
            }
          }
        });
      }
      // ADDED: scan options[].requires.conditions and options[].status_set for status references (Phase 1)
      if (n.data && Array.isArray(n.data.options)) {
        n.data.options.forEach(opt => {
          if (opt.requires && Array.isArray(opt.requires.conditions)) {
            if (opt.requires.conditions.some(c => c.status === id)) {
              references.push(`option_requires:${n.id}:${opt.id}`);
            }
          }
          if (Array.isArray(opt.status_set) && opt.status_set.some(se => se.statusId === id)) {
            references.push(`option_status_set:${n.id}:${opt.id}`);
          }
        });
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

  // ─── VARIANT CRUD (Phase 1) ────────────────────────────────────────────────

  // ADDED: addVariant — appends a new variant to common[nodeId].data.variants[] (Phase 1)
  // variants[] is display-only; which variant is active is a simulation concern deferred to a later update
  addVariant: (nodeId, variantData = {}) => set((state) => {
    const node = state.common[nodeId];
    if (!node) return state;
    const newVariant = {
      id: generateId('v'),
      label: variantData.label || '',
      text: variantData.text || '',
      requires: variantData.requires || null
    };
    const currentVariants = Array.isArray(node.data.variants) ? node.data.variants : [];
    return {
      common: {
        ...state.common,
        [nodeId]: { ...node, data: { ...node.data, variants: [...currentVariants, newVariant] } }
      },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // ADDED: updateVariant — patches a single variant in common[nodeId].data.variants[] by variantId (Phase 1)
  updateVariant: (nodeId, variantId, patch) => set((state) => {
    const node = state.common[nodeId];
    if (!node) return state;
    const currentVariants = Array.isArray(node.data.variants) ? node.data.variants : [];
    const nextVariants = currentVariants.map(v => v.id === variantId ? { ...v, ...patch } : v);
    return {
      common: {
        ...state.common,
        [nodeId]: { ...node, data: { ...node.data, variants: nextVariants } }
      },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // ADDED: deleteVariant — removes a variant from common[nodeId].data.variants[] by variantId (Phase 1)
  deleteVariant: (nodeId, variantId) => set((state) => {
    const node = state.common[nodeId];
    if (!node) return state;
    const currentVariants = Array.isArray(node.data.variants) ? node.data.variants : [];
    return {
      common: {
        ...state.common,
        [nodeId]: { ...node, data: { ...node.data, variants: currentVariants.filter(v => v.id !== variantId) } }
      },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // ─── OPTION CRUD (Phase 1) ─────────────────────────────────────────────────

  // ADDED: addOption — appends a new option to choice[nodeId].data.options[] (Phase 1)
  // each option gets a dedicated source handle on ChoiceNode (Phase 2)
  addOption: (nodeId, optionData = {}) => set((state) => {
    const node = state.choice[nodeId];
    if (!node) return state;
    const newOption = {
      id: generateId('opt'),
      label: optionData.label || '',
      requires: optionData.requires || null,
      flags_set: Array.isArray(optionData.flags_set) ? optionData.flags_set : [],
      status_set: Array.isArray(optionData.status_set) ? optionData.status_set : []
    };
    const currentOptions = Array.isArray(node.data.options) ? node.data.options : [];
    return {
      choice: {
        ...state.choice,
        [nodeId]: { ...node, data: { ...node.data, options: [...currentOptions, newOption] } }
      },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // ADDED: updateOption — patches a single option in choice[nodeId].data.options[] by optionId (Phase 1)
  updateOption: (nodeId, optionId, patch) => set((state) => {
    const node = state.choice[nodeId];
    if (!node) return state;
    const currentOptions = Array.isArray(node.data.options) ? node.data.options : [];
    const nextOptions = currentOptions.map(opt => opt.id === optionId ? { ...opt, ...patch } : opt);
    return {
      choice: {
        ...state.choice,
        [nodeId]: { ...node, data: { ...node.data, options: nextOptions } }
      },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // ADDED: deleteOption — removes an option from choice[nodeId].data.options[] and cascades to remove
  // all edges where edge.optionId === optionId, preventing dangling handle references (RISK-VNO-04) (Phase 1)
  deleteOption: (nodeId, optionId) => set((state) => {
    const node = state.choice[nodeId];
    if (!node) return state;
    const currentOptions = Array.isArray(node.data.options) ? node.data.options : [];
    return {
      choice: {
        ...state.choice,
        [nodeId]: { ...node, data: { ...node.data, options: currentOptions.filter(opt => opt.id !== optionId) } }
      },
      // Cascade: remove edges that originated from this option's handle
      edges: state.edges.filter(e => e.optionId !== optionId),
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // ─── PATH / CHAPTER MANAGEMENT ────────────────────────────────────────────

  // ADDED: path management actions with cascading pathId nullification
  addPath: (name) => set((state) => {
    if (!name || name.trim().length === 0) {
      throw new Error('Path name cannot be empty');
    }
    const id = generateId('p');
    return {
      path: { ...state.path, [id]: { id, name: name.trim() } },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  updatePath: (id, patch) => set((state) => {
    if (!state.path[id]) return state;
    return {
      path: { ...state.path, [id]: { ...state.path[id], ...patch } },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  deletePath: (id) => set((state) => {
    const nextPath = { ...state.path };
    delete nextPath[id];

    // Cascade: nullify data.pathId on all nodes
    const updateCollection = (col) => {
      const nextCol = {};
      for (const [key, val] of Object.entries(col)) {
        if (val.data && val.data.pathId === id) {
          nextCol[key] = { ...val, data: { ...val.data, pathId: null } };
        } else {
          nextCol[key] = val;
        }
      }
      return nextCol;
    };

    return {
      path: nextPath,
      common: updateCollection(state.common),
      choice: updateCollection(state.choice),
      ending: updateCollection(state.ending),
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // ADDED: chapter management actions with cascading chapterId nullification
  addChapter: (name) => set((state) => {
    if (!name || name.trim().length === 0) {
      throw new Error('Chapter name cannot be empty');
    }
    const id = generateId('c');
    return {
      chapter: { ...state.chapter, [id]: { id, name: name.trim() } },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  updateChapter: (id, patch) => set((state) => {
    if (!state.chapter[id]) return state;
    return {
      chapter: { ...state.chapter, [id]: { ...state.chapter[id], ...patch } },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  deleteChapter: (id) => set((state) => {
    const nextChapter = { ...state.chapter };
    delete nextChapter[id];

    // Cascade: nullify data.chapterId on all nodes
    const updateCollection = (col) => {
      const nextCol = {};
      for (const [key, val] of Object.entries(col)) {
        if (val.data && val.data.chapterId === id) {
          nextCol[key] = { ...val, data: { ...val.data, chapterId: null } };
        } else {
          nextCol[key] = val;
        }
      }
      return nextCol;
    };

    return {
      chapter: nextChapter,
      common: updateCollection(state.common),
      choice: updateCollection(state.choice),
      ending: updateCollection(state.ending),
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  // PROTECTED: updateMeta action preserves meta-update tracking behavior
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
      status: graphData.status || {},
      // ADDED: load path and chapter or default to empty objects
      path: graphData.path || {},
      chapter: graphData.chapter || {}
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
      status: {},
      // ADDED: initialize path and chapter to empty objects
      path: {},
      chapter: {}
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

      // MODIFIED: schemaVersion 3 -> 4
      schemaVersion: 4,
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
      status: state.status,
      // ADDED: export path and chapter
      path: state.path,
      chapter: state.chapter
    };
  }
}));

// PROTECTED: window.useNarrativeStore debug export hook is kept active
if (typeof window !== 'undefined') {
  window.useNarrativeStore = useNarrativeStore;
}
