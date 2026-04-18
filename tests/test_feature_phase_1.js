const assert = require('assert').strict;

// -- MOCKED SYSTEM AND DEPENDENCIES --
let idCounter = 0;
const generateId = (prefix) => `${prefix}_${++idCounter}`;

const mockUIStore = {
  clearIfSelected: () => {}
};

// -- INLINED LOGIC UNDER TEST --
let state = {
  meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now(), commonNodeTypes: [], endingTypes: [] },
  common: {}, choice: {}, ending: {}, edges: [], flag: {}, status: {}, path: {}, chapter: {}
};

const set = (updater) => {
  if (typeof updater === 'function') {
    state = { ...state, ...updater(state) };
  } else {
    state = { ...state, ...updater };
  }
};
const get = () => state;

const useNarrativeStore = {
  getState: get,
  addNode: (position, type = 'common') => set((state) => {
    const isEmpty = Object.keys(state.common).length === 0 && Object.keys(state.choice).length === 0 && Object.keys(state.ending).length === 0;
    const isStartNode = isEmpty;
    const newNode = {
      id: generateId('n'), type, position,
      data: { label: 'Node', content: '', isStartNode, flags_set: [], status_set: [] }
    };
    const target = type === 'ending' ? 'ending' : type === 'choice' ? 'choice' : 'common';
    return { [target]: { ...state[target], [newNode.id]: newNode }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  addEdge: (sourceId, targetId, optionId = null) => set((state) => {
    if (sourceId in state.ending) throw new Error("Cannot add an edge from an 'ending' node");
    if (state.edges.some(e => e.sourceId === sourceId && e.targetId === targetId)) throw new Error("Edge already exists between these nodes");
    const newEdge = { id: generateId('e'), sourceId, targetId, label: '', condition: null, optionId: optionId || null };
    return { edges: [...state.edges, newEdge], meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  addFlag: (name, stateVal) => set((state) => {
    const id = generateId('f');
    return { flag: { ...state.flag, [id]: { id, name, state: stateVal } } };
  }),
  addStatus: (name, value, minValue, maxValue) => set((state) => {
    const id = generateId('sp');
    return { status: { ...state.status, [id]: { id, name, value, minValue, maxValue } } };
  }),
  deleteFlag: (id) => {
    const state = get(); const references = [];
    state.edges.forEach(e => {
      if (e.condition && e.condition.conditions && e.condition.conditions.some(c => c.flag === id)) references.push(`edge_condition:${e.id}`);
    });
    const allNodes = [...Object.values(state.common), ...Object.values(state.choice), ...Object.values(state.ending)];
    allNodes.forEach(n => {
      if (n.data && n.data.flags_set && n.data.flags_set.includes(id)) references.push(`node_sideEffect:${n.id}`);
      if (n.data && Array.isArray(n.data.variants)) {
        n.data.variants.forEach(v => {
          if (v.requires && Array.isArray(v.requires.conditions) && v.requires.conditions.some(c => c.flag === id)) references.push(`variant_requires:${n.id}:${v.id}`);
        });
      }
      if (n.data && Array.isArray(n.data.options)) {
        n.data.options.forEach(opt => {
          if (opt.requires && Array.isArray(opt.requires.conditions) && opt.requires.conditions.some(c => c.flag === id)) references.push(`option_requires:${n.id}:${opt.id}`);
          if (Array.isArray(opt.flags_set) && opt.flags_set.includes(id)) references.push(`option_flags_set:${n.id}:${opt.id}`);
        });
      }
    });
    if (references.length > 0) return { blocked: true, references };
    set((state) => { const nextFlag = { ...state.flag }; delete nextFlag[id]; return { flag: nextFlag }; });
    return { blocked: false };
  },
  deleteStatus: (id) => {
    const state = get(); const references = [];
    state.edges.forEach(e => {
      if (e.condition && e.condition.conditions && e.condition.conditions.some(c => c.status === id)) references.push(`edge_condition:${e.id}`);
    });
    const allNodes = [...Object.values(state.common), ...Object.values(state.choice), ...Object.values(state.ending)];
    allNodes.forEach(n => {
      if (n.data && n.data.status_set && n.data.status_set.some(se => se.statusId === id)) references.push(`node_sideEffect:${n.id}`);
      if (n.data && Array.isArray(n.data.variants)) {
        n.data.variants.forEach(v => {
          if (v.requires && Array.isArray(v.requires.conditions) && v.requires.conditions.some(c => c.status === id)) references.push(`variant_requires:${n.id}:${v.id}`);
        });
      }
      if (n.data && Array.isArray(n.data.options)) {
        n.data.options.forEach(opt => {
          if (opt.requires && Array.isArray(opt.requires.conditions) && opt.requires.conditions.some(c => c.status === id)) references.push(`option_requires:${n.id}:${opt.id}`);
          if (Array.isArray(opt.status_set) && opt.status_set.some(se => se.statusId === id)) references.push(`option_status_set:${n.id}:${opt.id}`);
        });
      }
    });
    if (references.length > 0) return { blocked: true, references };
    set((state) => { const nextStatus = { ...state.status }; delete nextStatus[id]; return { status: nextStatus }; });
    return { blocked: false };
  },
  addVariant: (nodeId, variantData = {}) => set((state) => {
    const node = state.common[nodeId];
    if (!node) return state;
    const newVariant = { id: generateId('v'), label: variantData.label || '', text: variantData.text || '', requires: variantData.requires || null };
    const currentVariants = Array.isArray(node.data.variants) ? node.data.variants : [];
    return { common: { ...state.common, [nodeId]: { ...node, data: { ...node.data, variants: [...currentVariants, newVariant] } } } };
  }),
  updateVariant: (nodeId, variantId, patch) => set((state) => {
    const node = state.common[nodeId];
    if (!node) return state;
    const currentVariants = Array.isArray(node.data.variants) ? node.data.variants : [];
    const nextVariants = currentVariants.map(v => v.id === variantId ? { ...v, ...patch } : v);
    return { common: { ...state.common, [nodeId]: { ...node, data: { ...node.data, variants: nextVariants } } } };
  }),
  deleteVariant: (nodeId, variantId) => set((state) => {
    const node = state.common[nodeId];
    if (!node) return state;
    const currentVariants = Array.isArray(node.data.variants) ? node.data.variants : [];
    return { common: { ...state.common, [nodeId]: { ...node, data: { ...node.data, variants: currentVariants.filter(v => v.id !== variantId) } } } };
  }),
  addOption: (nodeId, optionData = {}) => set((state) => {
    const node = state.choice[nodeId];
    if (!node) return state;
    const newOption = { id: generateId('opt'), label: optionData.label || '', requires: optionData.requires || null, flags_set: Array.isArray(optionData.flags_set) ? optionData.flags_set : [], status_set: Array.isArray(optionData.status_set) ? optionData.status_set : [] };
    const currentOptions = Array.isArray(node.data.options) ? node.data.options : [];
    return { choice: { ...state.choice, [nodeId]: { ...node, data: { ...node.data, options: [...currentOptions, newOption] } } } };
  }),
  updateOption: (nodeId, optionId, patch) => set((state) => {
    const node = state.choice[nodeId];
    if (!node) return state;
    const currentOptions = Array.isArray(node.data.options) ? node.data.options : [];
    const nextOptions = currentOptions.map(opt => opt.id === optionId ? { ...opt, ...patch } : opt);
    return { choice: { ...state.choice, [nodeId]: { ...node, data: { ...node.data, options: nextOptions } } } };
  }),
  deleteOption: (nodeId, optionId) => set((state) => {
    const node = state.choice[nodeId];
    if (!node) return state;
    const currentOptions = Array.isArray(node.data.options) ? node.data.options : [];
    return {
      choice: { ...state.choice, [nodeId]: { ...node, data: { ...node.data, options: currentOptions.filter(opt => opt.id !== optionId) } } },
      edges: state.edges.filter(e => e.optionId !== optionId)
    };
  }),
  newGraph: () => set({
    meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now(), commonNodeTypes: [], endingTypes: [] },
    common: {}, choice: {}, ending: {}, edges: [], flag: {}, status: {}, path: {}, chapter: {}
  })
};

// -- TEST HARNESS --
let passed = 0; let failed = 0; let integrationBroken = false;
const runTest = (name, testFn, isIntegration = false) => {
  try {
    idCounter = 0; useNarrativeStore.newGraph();
    testFn();
    console.log(`[PASS] ${name}`); passed++;
  } catch (e) {
    console.log(`[FAIL] ${name}`); console.error(e); failed++;
    if (isIntegration) integrationBroken = true;
  }
};

console.log('--- Group A: Feature Verification ---');

// Variant CRUD
runTest('addVariant - adds a variant to a common node with proper defaults', () => {
  useNarrativeStore.addNode({x:0, y:0}, 'common');
  const nId = Object.keys(useNarrativeStore.getState().common)[0];
  useNarrativeStore.addVariant(nId, { label: 'V1', text: 'T1' });
  
  const variants = useNarrativeStore.getState().common[nId].data.variants;
  assert.equal(variants.length, 1);
  assert.equal(variants[0].label, 'V1');
  assert.equal(variants[0].requires, null);
  assert.equal(variants[0].id.startsWith('v_'), true);
});

runTest('updateVariant - updates only the targeted variant', () => {
  useNarrativeStore.addNode({x:0, y:0}, 'common');
  const nId = Object.keys(useNarrativeStore.getState().common)[0];
  useNarrativeStore.addVariant(nId, { label: 'V1' });
  const vId = useNarrativeStore.getState().common[nId].data.variants[0].id;
  
  useNarrativeStore.updateVariant(nId, vId, { label: 'V1_Updated' });
  assert.equal(useNarrativeStore.getState().common[nId].data.variants[0].label, 'V1_Updated');
});

runTest('deleteVariant - correctly removes targeted variant', () => {
  useNarrativeStore.addNode({x:0, y:0}, 'common');
  const nId = Object.keys(useNarrativeStore.getState().common)[0];
  useNarrativeStore.addVariant(nId, { label: 'V1' });
  const vId = useNarrativeStore.getState().common[nId].data.variants[0].id;
  
  useNarrativeStore.deleteVariant(nId, vId);
  const variants = useNarrativeStore.getState().common[nId].data.variants;
  assert.equal(variants.length, 0);
});

// Option CRUD
runTest('addOption - adds an option to a choice node with proper defaults', () => {
  useNarrativeStore.addNode({x:0, y:0}, 'choice');
  const cId = Object.keys(useNarrativeStore.getState().choice)[0];
  useNarrativeStore.addOption(cId, { label: 'Opt1' });

  const options = useNarrativeStore.getState().choice[cId].data.options;
  assert.equal(options.length, 1);
  assert.equal(options[0].label, 'Opt1');
  assert.equal(options[0].id.startsWith('opt_'), true);
  assert.deepEqual(options[0].flags_set, []);
});

runTest('deleteOption - cascades to delete edges tied to the option', () => {
  useNarrativeStore.addNode({x:0, y:0}, 'choice');
  useNarrativeStore.addNode({x:1, y:1}, 'common');
  const s = useNarrativeStore.getState();
  const cId = Object.keys(s.choice)[0];
  const targetId = Object.keys(s.common)[0];
  
  useNarrativeStore.addOption(cId, { label: 'Opt1' });
  const optId = useNarrativeStore.getState().choice[cId].data.options[0].id;

  useNarrativeStore.addEdge(cId, targetId, optId);
  assert.equal(useNarrativeStore.getState().edges.length, 1);
  assert.equal(useNarrativeStore.getState().edges[0].optionId, optId);
  
  useNarrativeStore.deleteOption(cId, optId);
  assert.equal(useNarrativeStore.getState().choice[cId].data.options.length, 0);
  assert.equal(useNarrativeStore.getState().edges.length, 0); // Edge removed!
});

runTest('deleteFlag - prevents deletion if flag is used in variant requires', () => {
  useNarrativeStore.addFlag('f1', false);
  const fId = Object.keys(useNarrativeStore.getState().flag)[0];
  
  useNarrativeStore.addNode({x:0, y:0}, 'common');
  const nId = Object.keys(useNarrativeStore.getState().common)[0];
  useNarrativeStore.addVariant(nId, { requires: { conditions: [{ flag: fId }] } });

  const result = useNarrativeStore.deleteFlag(fId);
  assert.equal(result.blocked, true);
  assert.equal(result.references[0].startsWith('variant_requires:'), true);
});

runTest('deleteFlag - prevents deletion if flag is used in option flags_set', () => {
  useNarrativeStore.addFlag('f2', false);
  const fId = Object.keys(useNarrativeStore.getState().flag)[0];
  
  useNarrativeStore.addNode({x:0, y:0}, 'choice');
  const cId = Object.keys(useNarrativeStore.getState().choice)[0];
  useNarrativeStore.addOption(cId, { flags_set: [fId] });

  const result = useNarrativeStore.deleteFlag(fId);
  assert.equal(result.blocked, true);
  assert.equal(result.references[0].startsWith('option_flags_set:'), true);
});

console.log('--- Group B: Integration Suite ---');
runTest('addEdge - supports standard two-argument call (no optionId)', () => {
  useNarrativeStore.addNode({x:0, y:0}, 'common');
  useNarrativeStore.addNode({x:1, y:1}, 'common');
  const nodes = Object.keys(useNarrativeStore.getState().common);
  useNarrativeStore.addEdge(nodes[0], nodes[1]);
  assert.equal(useNarrativeStore.getState().edges.length, 1);
  assert.equal(useNarrativeStore.getState().edges[0].optionId, null);
}, true);

runTest('deleteFlag - still prevents deletion if flag is used in edge condition (legacy)', () => {
  useNarrativeStore.addFlag('f3', false);
  const fId = Object.keys(useNarrativeStore.getState().flag)[0];

  useNarrativeStore.addNode({x:0, y:0}, 'common');
  useNarrativeStore.addNode({x:1, y:1}, 'common');
  const nodes = Object.keys(useNarrativeStore.getState().common);
  useNarrativeStore.addEdge(nodes[0], nodes[1]);
  const s = useNarrativeStore.getState();
  
  useNarrativeStore.getState().edges[0].condition = { conditions: [{ flag: fId }] };
  const result = useNarrativeStore.deleteFlag(fId);
  assert.equal(result.blocked, true);
  assert.equal(result.references[0].startsWith('edge_condition:'), true);
}, true);

console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
console.log(`INTEGRATION: ${integrationBroken ? 'BROKEN' : 'CLEAN'}`);
