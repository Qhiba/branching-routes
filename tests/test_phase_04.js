import { useGraphStore } from '../src/store/graphStore.js';

async function runTests() {
  console.log("Starting Phase 04 Tests...");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Setup Fresh Store Instance state for tests
  const store = useGraphStore.getState();
  store.newGraph(); // Reset state

  console.log("\n--- Testing graphStore.addFlag ---");
  try {
    store.addFlag('has_key', 'boolean', false);
    const flags = useGraphStore.getState().flags;
    assert(flags.length === 1 && flags[0].name === 'has_key', "Happy path: addFlag adds a valid boolean flag");
  } catch (e) {
    assert(false, "Happy path: addFlag should not throw");
  }

  try {
    store.addFlag('score', 'number', 0);
    const flags = useGraphStore.getState().flags;
    assert(flags.length === 2 && flags[1].name === 'score', "Happy path: addFlag adds a valid number flag");
  } catch (e) {
    assert(false, "Happy path: addFlag should not throw");
  }

  try {
    store.addFlag('invalid name!', 'boolean', true);
    assert(false, "Failure case: addFlag should throw on invalid regex name");
  } catch (e) {
    assert(e.message === 'Invalid flag name', "Failure case: addFlag throws 'Invalid flag name' on bad input");
  }

  console.log("\n--- Testing graphStore.addEdge (issue 13) ---");
  store.addNode({ x: 0, y: 0 }, 'common');
  store.addNode({ x: 100, y: 100 }, 'common');
  const nodes = useGraphStore.getState().nodes;
  const n1 = nodes[0].id;
  const n2 = nodes[1].id;

  try {
    store.addEdge(n1, n2);
    const edges = useGraphStore.getState().edges;
    assert(edges.length === 1, "Happy path: addEdge successfully creates an edge");
    
    // Attempt duplicate
    store.addEdge(n1, n2);
    assert(false, "Failure case: addEdge should prevent duplicate overlapping edges (Issue 13)");
  } catch (e) {
    assert(e.message === "Edge already exists between these nodes", "Failure case: addEdge correctly throws duplicate edge constraint");
  }

  console.log("\n--- Testing graphStore.deleteFlag (RISK-02 Referential Integrity) ---");
  const flagToDelete = useGraphStore.getState().flags[0]; // has_key
  const flagInUse = useGraphStore.getState().flags[1]; // score

  // Delete unreferenced flag
  const res1 = store.deleteFlag(flagToDelete.id);
  assert(res1.blocked === false, "Happy path: deleteFlag successfully deletes an unreferenced flag");
  assert(useGraphStore.getState().flags.length === 1, "Data integrity: flag array length visually decremented");

  // Assign score flag to node side effect
  store.updateNode(n1, {
    data: {
      ...nodes[0].data,
      sideEffects: [{ flagId: flagInUse.id, operation: 'set', value: 10 }]
    }
  });

  // Attempt to delete referenced flag
  const res2 = store.deleteFlag(flagInUse.id);
  assert(res2.blocked === true, "Edge case: deleteFlag blocks deletion of a flag referenced by a node side effect");
  assert(res2.references && res2.references.length === 1, "Data integrity: deleteFlag returns exactly 1 detailed reference path");
  assert(res2.references[0].startsWith('node_sideEffect:'), "Data integrity: reference path correctly signifies a node sideEffect blockage");

  // Unbind from node side effect, bind to edge condition
  store.updateNode(n1, { data: { ...nodes[0].data, sideEffects: [] } });
  store.updateEdge(useGraphStore.getState().edges[0].id, {
    condition: {
      operator: 'AND',
      clauses: [{ flagId: flagInUse.id, comparator: '>', value: 5 }]
    }
  });

  const res3 = store.deleteFlag(flagInUse.id);
  assert(res3.blocked === true, "Edge case: deleteFlag blocks deletion of a flag referenced by an edge condition");
  assert(res3.references[0].startsWith('edge_condition:'), "Data integrity: reference path correctly signifies an edge condition blockage");

  console.log(`\n=== SUMMARY ===`);
  console.log(`${passed} passed, ${failed} failed`);
}

runTests();
