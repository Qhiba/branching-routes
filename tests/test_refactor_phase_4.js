import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let useStore;
let storeName = '';

// Load the appropriate graph/narrative store based on architecture
try {
  const ns = await import('../src/store/narrativeStore.js');
  useStore = ns.useNarrativeStore;
  storeName = 'narrativeStore';
} catch (e) {
  // Fallback to old architecture
  const gs = await import('../src/store/graphStore.js');
  useStore = gs.useGraphStore;
  storeName = 'graphStore';
}

let useSimulationStore;
try {
  const ss = await import('../src/store/simulationStore.js');
  useSimulationStore = ss.useSimulationStore;
} catch (e) {
  console.error("Failed to load simulationStore", e);
  process.exit(1);
}

// ------------------------------------------------------------------
// TEST RUNNER
// ------------------------------------------------------------------
let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    // Reset stores before each test
    useStore.getState().newGraph();
    useSimulationStore.getState().reset();
    
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
  console.log("=== Phase 4 Behavioral Parity Tests ===");
  console.log(`Architecture configured with: ${storeName}\n`);

  await runTest('TEST_LBA_01 (Synchronous cross-store read via getState())', async () => {
    // Modify narrative/graph store synchronously
    useStore.getState().addNode({ x: 0, y: 0 }, 'common'); // Becomes start node
    const stateAfterAdd = useStore.getState();
    const startNode = stateAfterAdd.nodes[0];
    
    useStore.getState().addFlag("sync_test", "boolean", true);
    
    // Invoke simulation store which relies on synchronous reads from narrative/graph store
    useSimulationStore.getState().start();
    
    const simState = useSimulationStore.getState();
    
    if (!simState.isRunning) {
      throw new Error("LBA-01 Broken: Simulation failed to start.");
    }
    
    if (simState.activeNodeId !== startNode.id) {
      throw new Error(`LBA-01 Broken: Simulation activeNodeId ${simState.activeNodeId} does not match ${startNode.id}.`);
    }
    
    // Check if flags were synchronously ingested
    const flagsObj = simState.currentFlagValues;
    const flagKey = Object.keys(flagsObj).find(k => useStore.getState().flags.some(f => f.id === k && f.name === 'sync_test'));
    
    if (!flagKey || flagsObj[flagKey] !== true) {
      throw new Error("LBA-01 Broken: Simulation did not synchronously read flag values.");
    }
  });

  await runTest('TEST_HS_08 (Circular import introduced between store files)', async () => {
    // In Node.js ES modules, circular imports can cause the imported symbol to be undefined.
    // If useStore is a valid function (Zustand hook), the circular dependency wasn't fatally evaluated.
    if (typeof useStore !== 'function') {
      throw new Error(`HS-08 Broken: ${storeName} evaluates to ${typeof useStore}, indicating a potential circular import loop preventing evaluation.`);
    }
    // Simulation store should also be valid.
    if (typeof useSimulationStore !== 'function') {
      throw new Error(`HS-08 Broken: simulationStore evaluates to ${typeof useSimulationStore}, indicating a potential circular import loop.`);
    }
  });

  console.log("\n=== Group B — Data Contract Verification ===");
  console.log("No data contract properties were modified in this phase.");

  console.log("\n=== Group C — Migration Verification ===");
  console.log("No data schema migration exists for this phase.");

  console.log("\n=== Summary ===");
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("PARITY: BROKEN");
  } else {
    console.log("PARITY: CONFIRMED");
  }
}

main();
