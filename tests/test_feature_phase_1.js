const assert = require('assert').strict;

// -- MOCKED SYSTEM AND DEPENDENCIES --
let idCounter = 0;
const generateId = (prefix) => `${prefix}_${++idCounter}`;

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
  updateNode: (id, patch) => set((state) => {
    let target = null; let node = null;
    if (state.common[id]) { target = 'common'; node = state.common[id]; }
    else if (state.choice[id]) { target = 'choice'; node = state.choice[id]; }
    else if (state.ending[id]) { target = 'ending'; node = state.ending[id]; }
    if (!target) return state;
    return { [target]: { ...state[target], [id]: { ...node, ...patch, data: { ...node.data, ...patch.data } } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  addPath: (name) => set((state) => {
    if (!name || name.trim().length === 0) throw new Error('Path name cannot be empty');
    const id = generateId('p');
    return { path: { ...state.path, [id]: { id, name: name.trim() } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  updatePath: (id, patch) => set((state) => {
    if (!state.path[id]) return state;
    return { path: { ...state.path, [id]: { ...state.path[id], ...patch } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  deletePath: (id) => set((state) => {
    const nextPath = { ...state.path }; delete nextPath[id];
    const updateCollection = (col) => {
      const nextCol = {};
      for (const [key, val] of Object.entries(col)) {
        if (val.data && val.data.pathId === id) { nextCol[key] = { ...val, data: { ...val.data, pathId: null } }; }
        else { nextCol[key] = val; }
      }
      return nextCol;
    };
    return { path: nextPath, common: updateCollection(state.common), choice: updateCollection(state.choice), ending: updateCollection(state.ending), meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  addChapter: (name) => set((state) => {
    if (!name || name.trim().length === 0) throw new Error('Chapter name cannot be empty');
    const id = generateId('c');
    return { chapter: { ...state.chapter, [id]: { id, name: name.trim() } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  updateChapter: (id, patch) => set((state) => {
    if (!state.chapter[id]) return state;
    return { chapter: { ...state.chapter, [id]: { ...state.chapter[id], ...patch } }, meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  deleteChapter: (id) => set((state) => {
    const nextChapter = { ...state.chapter }; delete nextChapter[id];
    const updateCollection = (col) => {
      const nextCol = {};
      for (const [key, val] of Object.entries(col)) {
        if (val.data && val.data.chapterId === id) { nextCol[key] = { ...val, data: { ...val.data, chapterId: null } }; }
        else { nextCol[key] = val; }
      }
      return nextCol;
    };
    return { chapter: nextChapter, common: updateCollection(state.common), choice: updateCollection(state.choice), ending: updateCollection(state.ending), meta: { ...state.meta, updatedAt: Date.now() } };
  }),
  loadGraph: (graphData) => set({
    meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now(), commonNodeTypes: [], endingTypes: [], ...graphData.meta },
    common: graphData.common || {}, choice: graphData.choice || {}, ending: graphData.ending || {}, edges: graphData.edges || [],
    flag: graphData.flag || {}, status: graphData.status || {}, path: graphData.path || {}, chapter: graphData.chapter || {}
  }),
  newGraph: () => set({
    meta: { title: 'Untitled Graph', createdAt: Date.now(), updatedAt: Date.now(), commonNodeTypes: [], endingTypes: [] },
    common: {}, choice: {}, ending: {}, edges: [], flag: {}, status: {}, path: {}, chapter: {}
  }),
  exportGraph: () => {
    const s = get();
    return {
      schemaVersion: 4,
      meta: { ...s.meta, createdAt: s.meta.createdAt, updatedAt: s.meta.updatedAt },
      common: s.common, choice: s.choice, ending: s.ending, edges: s.edges,
      flag: s.flag, status: s.status, path: s.path, chapter: s.chapter
    };
  }
};

const importProjectLogic = (data) => {
  if (![1, 2, 3, 4].includes(data.schemaVersion)) throw new Error('unsupported_schema_version');
  if (data.schemaVersion === 1) data.schemaVersion = 3;
  else if (data.schemaVersion === 2) data.schemaVersion = 3;
  if (data.schemaVersion === 3) {
    data.path = data.path || {}; data.chapter = data.chapter || {}; data.schemaVersion = 4;
  }
  return data;
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
runTest('addPath - correctly inserts a path', () => {
  useNarrativeStore.addPath('Route A');
  const s = useNarrativeStore.getState();
  assert.equal(Object.values(s.path).length, 1);
  assert.equal(Object.values(s.path)[0].name, 'Route A');
});

runTest('addPath - throws error on empty name', () => {
  assert.throws(() => useNarrativeStore.addPath('   '), /empty/);
});

runTest('updatePath - correctly updates a path', () => {
  useNarrativeStore.addPath('Route A');
  const pId = Object.keys(useNarrativeStore.getState().path)[0];
  useNarrativeStore.updatePath(pId, { name: 'Route B' });
  assert.equal(useNarrativeStore.getState().path[pId].name, 'Route B');
});

runTest('deletePath - removes path and cascades to node data', () => {
  useNarrativeStore.addPath('Delete Me');
  const pId = Object.keys(useNarrativeStore.getState().path)[0];
  useNarrativeStore.addNode({x:0, y:0}, 'common');
  const nId = Object.keys(useNarrativeStore.getState().common)[0];
  useNarrativeStore.updateNode(nId, { data: { pathId: pId } });
  
  assert.equal(useNarrativeStore.getState().common[nId].data.pathId, pId);
  useNarrativeStore.deletePath(pId);
  assert.equal(Object.keys(useNarrativeStore.getState().path).length, 0);
  assert.equal(useNarrativeStore.getState().common[nId].data.pathId, null);
});

runTest('importProject - migrating v3 graph instantiates empty path/chapter safely', () => {
  const result = importProjectLogic({ schemaVersion: 3 });
  assert.equal(result.schemaVersion, 4);
  assert.deepEqual(result.path, {});
  assert.deepEqual(result.chapter, {});
});

console.log('--- Group B: Integration Suite ---');
runTest('existing behaviors - addNode executes cleanly without corruption', () => {
  useNarrativeStore.addNode({x:0,y:0}, 'common');
  assert.equal(Object.keys(useNarrativeStore.getState().common).length, 1);
}, true);

runTest('exportGraph - outputs path and chapter correctly along with schemaVersion 4', () => {
  useNarrativeStore.addPath('Export Path');
  const d = useNarrativeStore.exportGraph();
  assert.equal(d.schemaVersion, 4);
  assert.equal(Object.values(d.path)[0].name, 'Export Path');
}, true);

console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
console.log(`INTEGRATION: ${integrationBroken ? 'BROKEN' : 'CLEAN'}`);
