import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let useGraphStore;

try {
  const gs = await import('../src/store/graphStore.js');
  useGraphStore = gs.useGraphStore;
} catch (e) {
  console.error("Failed to load graphStore", e);
  process.exit(1);
}

// ------------------------------------------------------------------
// TEST RUNNER
// ------------------------------------------------------------------
let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    useGraphStore.getState().newGraph();
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   ${e.message}`);
    failed++;
  }
}

async function main() {
  console.log("=== Phase 3 Behavioral Parity Tests ===");

  await runTest('TEST_DC_05_and_LBA_02 (ID format prefixed and Legacy ID compatibility)', async () => {
    const store = useGraphStore.getState();
    
    // 1. Prove old format still loads correctly
    const oldFormatGraph = {
      meta: { title: 'Legacy Graph', createdAt: 1, updatedAt: 1 },
      nodes: [
        { id: '11111111-1111-4111-a111-111111111111', type: 'common', position: {x:0, y:0}, data: { label: 'OldNode', isStartNode: true, sideEffects: [] } }
      ],
      edges: [
        { id: '22222222-2222-4222-a222-222222222222', sourceId: '11111111-1111-4111-a111-111111111111', targetId: '11111111-1111-4111-a111-111111111111', condition: null, sideEffects: [] }
      ],
      flags: [
        { id: '33333333-3333-4333-a333-333333333333', name: 'old_flag', type: 'boolean', defaultValue: false }
      ]
    };
    
    store.loadGraph(oldFormatGraph);
    
    const loadedNodes = useGraphStore.getState().nodes;
    if (loadedNodes.length !== 1 || loadedNodes[0].id !== '11111111-1111-4111-a111-111111111111') {
      throw new Error('Legacy nodes did not load or keep old ID format.');
    }
    
    // 2. Prove new format is produced correctly
    store.addNode({x: 100, y: 100}, 'common');
    const nodesAfterAdd = useGraphStore.getState().nodes;
    const newNode = nodesAfterAdd[1];
    if (!newNode.id.startsWith('n-')) {
      throw new Error(`New node did not receive prefixed ID. Got: ${newNode.id}`);
    }
    
    // Notice that addEdge requires the target node to NOT be an ending node (tested by BI-06), new node defaults to common.
    store.addEdge('11111111-1111-4111-a111-111111111111', newNode.id);
    const edgesAfterAdd = useGraphStore.getState().edges;
    const newEdge = edgesAfterAdd[1];
    if (!newEdge.id.startsWith('e-')) {
      throw new Error(`New edge did not receive prefixed ID. Got: ${newEdge.id}`);
    }
    
    store.addFlag('new_flag', 'number', 0);
    const flagsAfterAdd = useGraphStore.getState().flags;
    const newFlag = flagsAfterAdd[1];
    if (!newFlag.id.startsWith('f-')) {
      throw new Error(`New flag did not receive prefixed ID. Got: ${newFlag.id}`);
    }
    
    // 3. Prove both formats coexist without error
    if (edgesAfterAdd[1].sourceId !== '11111111-1111-4111-a111-111111111111' || edgesAfterAdd[1].targetId !== newNode.id) {
      throw new Error('Mixed old-format sourceId in edge failed cross-references.');
    }
    
    // Prove export function exports correctly formatted
    const exportResult = useGraphStore.getState().exportGraph();
    if (exportResult.schemaVersion !== 1) {
      throw new Error('schemaVersion changed or missing during export');
    }
  });

  console.log("\n=== Summary ===");
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("PARITY: BROKEN");
  } else {
    console.log("PARITY: CONFIRMED");
  }
}

main();
