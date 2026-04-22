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
  flag: {},
  status: {},
  path: {},
  chapter: {},
  commonType: {},
  endingType: {},



  addNode: (position, type = 'common', label = 'Node') => {
    const id = generateId('n');
    set((state) => {
      const isEmpty = Object.keys(state.common).length === 0 && Object.keys(state.choice).length === 0 && Object.keys(state.ending).length === 0;
      const newNode = {
        id,
        type,
        position,
        createdAt: Date.now(), // FIX: used for z-ordering in GraphCanvas derivedNodes
        data: {
          label,
          content: '',
          isStartNode: isEmpty,
          flags_set: [],
          status_set: []
        }
      };
      const target = type === 'ending' ? 'ending' : type === 'choice' ? 'choice' : 'common';
      return {
        [target]: { ...state[target], [id]: newNode },
        meta: { ...state.meta, updatedAt: Date.now() }
      };
    });
    return id;
  },

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

  updateFlag: (id, patch) => set((state) => {
    if (!state.flag[id]) return state;
    return {
      flag: { ...state.flag, [id]: { ...state.flag[id], ...patch } },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  updateStatus: (id, patch) => set((state) => {
    if (!state.status[id]) return state;
    return {
      status: { ...state.status, [id]: { ...state.status[id], ...patch } },
      meta: { ...state.meta, updatedAt: Date.now() }
    };
  }),

  deleteFlag: (id) => {
    const state = get();
    const references = [];

    state.edges.forEach(e => {
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
      if (n.data && Array.isArray(n.data.variants)) {
        n.data.variants.forEach(v => {
          if (v.requires && Array.isArray(v.requires.conditions)) {
            if (v.requires.conditions.some(c => c.flag === id)) {
              references.push(`variant_requires:${n.id}:${v.id}`);
            }
          }
        });
      }
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

  deleteStatus: (id) => {
    const state = get();
    const references = [];

    state.edges.forEach(e => {
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
      if (n.data && Array.isArray(n.data.variants)) {
        n.data.variants.forEach(v => {
          if (v.requires && Array.isArray(v.requires.conditions)) {
            if (v.requires.conditions.some(c => c.status === id)) {
              references.push(`variant_requires:${n.id}:${v.id}`);
            }
          }
        });
      }
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

  // ─── TYPE CRUD ───────────────────────────────────────────────────────────

  addCommonType: (name) => set((state) => {
    if (!name || name.trim().length === 0) throw new Error('Name cannot be empty');
    const id = generateId('ct');
    return { commonType: { ...state.commonType, [id]: { id, name: name.trim() } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),

  updateCommonType: (id, patch) => set((state) => {
    if (!state.commonType[id]) return state;
    return { commonType: { ...state.commonType, [id]: { ...state.commonType[id], ...patch } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),

  deleteCommonType: (id) => set((state) => {
    const nextList = { ...state.commonType };
    delete nextList[id];
    return { commonType: nextList, meta: { ...state.meta, updatedAt: Date.now() } };
  }),

  addEndingType: (name) => set((state) => {
    if (!name || name.trim().length === 0) throw new Error('Name cannot be empty');
    const id = generateId('et');
    return { endingType: { ...state.endingType, [id]: { id, name: name.trim() } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),

  updateEndingType: (id, patch) => set((state) => {
    if (!state.endingType[id]) return state;
    return { endingType: { ...state.endingType, [id]: { ...state.endingType[id], ...patch } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),

  deleteEndingType: (id) => set((state) => {
    const nextList = { ...state.endingType };
    delete nextList[id];
    return { endingType: nextList, meta: { ...state.meta, updatedAt: Date.now() } };
  }),

  // ─── VARIANT CRUD ────────────────────────────────────────────────────────

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

  // ─── OPTION CRUD ──────────────────────────────────────────────────────────

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

  // ─── PATH / CHAPTER MANAGEMENT ───────────────────────────────────────────

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
      flag: graphData.flag || {},
      status: graphData.status || {},
      path: graphData.path || {},
      chapter: graphData.chapter || {},
      commonType: graphData.commonType || {},
      endingType: graphData.endingType || {}
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
      flag: {},
      status: {},
      path: {},
      chapter: {},
      commonType: {},
      endingType: {}
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
      flag: state.flag,
      status: state.status,
      path: state.path,
      chapter: state.chapter,
      commonType: state.commonType,
      endingType: state.endingType
    };
  }
}));

if (typeof window !== 'undefined') {
  window.useNarrativeStore = useNarrativeStore;
}
