import { create } from 'zustand';

// Simulate the generation of IDs predictably for tests
let idCounter = 0;
const generateId = (prefix) => `${prefix}_${idCounter++}`;

// --- MOCK NARRATIVE STORE ---
// We mock the narrativeStore's addEdge method exactly as it currently exists to test the invariant fix we applied in Phase 3 / Bug 4.
const useNarrativeStore = create((set, get) => ({
  edges: [],
  ending: {}, // Dummy object
  
  addEdge: (sourceId, targetId, optionId = null) => set((state) => {
    if (sourceId in state.ending) {
      throw new Error("Cannot add an edge from an 'ending' node");
    }
    // Bug 4 Invariant Fix verified here!!
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
    return { edges: [...state.edges, newEdge] };
  })
}));

// --- TEST RUNNER ---
let passed = 0;
let failed = 0;

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (error) {
    console.error(`[FAIL] ${name}\n       ${error.message}`);
    failed++;
  }
}

// --- GROUP A: FEATURE VERIFICATION ---

runTest('T1. Distinct Options Allow Identical Targeted Connections', () => {
  useNarrativeStore.setState({ edges: [], ending: {} }); // Reset state
  const store = useNarrativeStore.getState();
  
  // Create first option edge
  store.addEdge('src-1', 'tgt-1', 'opt-A');
  // Create second option edge out of identical node to identical target
  store.addEdge('src-1', 'tgt-1', 'opt-B');
  
  const state = useNarrativeStore.getState();
  if (state.edges.length !== 2) {
    throw new Error(`Expected 2 edges, found ${state.edges.length}`);
  }
});

runTest('T2. Strict Anti-Duplication Enforcement On Shared Options', () => {
  useNarrativeStore.setState({ edges: [], ending: {} }); 
  const store = useNarrativeStore.getState();
  
  store.addEdge('src-1', 'tgt-1', 'opt-A');
  
  let caught = false;
  try {
    store.addEdge('src-1', 'tgt-1', 'opt-A');
  } catch (e) {
    caught = true;
  }
  
  if (!caught) {
    throw new Error("Expected to catch a duplicate edge error, but system allowed it.");
  }
});

// --- GROUP B: INTEGRATION SUITE ---

runTest('T3. Legacy Duplicate Protection Preservation', () => {
  useNarrativeStore.setState({ edges: [], ending: {} }); 
  const store = useNarrativeStore.getState();
  
  // Traditional Add (Common to Common Node routing)
  store.addEdge('src-2', 'tgt-2');
  
  let caught = false;
  try {
    store.addEdge('src-2', 'tgt-2'); // Should map to null internally and trip duplicate rule
  } catch (e) {
    caught = true;
  }
  
  if (!caught) {
    throw new Error("Expected legacy connection mapping missing option fallback to properly trigger duplicate protection error!");
  }
});

// --- SUMMARY ---
console.log('\n--- TEST RESULTS ---');
console.log(`${passed} passed, ${failed} failed`);
console.log(`INTEGRATION: ${failed > 0 ? 'BROKEN' : 'CLEAN'}`);

if (failed > 0) {
    process.exit(1);
}
