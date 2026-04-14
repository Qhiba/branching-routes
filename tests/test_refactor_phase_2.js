import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We dynamically import to support testing against either old or new architecture
let useNarrativeStore, useUIStore;

try {
  const gs = await import('../src/store/narrativeStore.js');
  useNarrativeStore = gs.useNarrativeStore;
} catch (e) {
  console.error("Failed to load narrativeStore", e);
  process.exit(1);
}

try {
  const us = await import('../src/store/uiStore.js');
  useUIStore = us.useUIStore;
} catch (e) {
  // If importing uiStore fails, assume old architecture
  useUIStore = null;
}

// ------------------------------------------------------------------
// HELPER ABSTRACTIONS (Inlined)
// ------------------------------------------------------------------
const selectNode = (id) => {
  if (useUIStore) useUIStore.getState().selectNode(id);
  else useNarrativeStore.getState().selectNode(id);
};

const getSelectedNodeId = () => {
  if (useUIStore) return useUIStore.getState().selectedNodeId;
  return useNarrativeStore.getState().selectedNodeId;
};

const selectEdge = (id) => {
  if (useUIStore) useUIStore.getState().selectEdge(id);
  else useNarrativeStore.getState().selectEdge(id);
};

const getSelectedEdgeId = () => {
  if (useUIStore) return useUIStore.getState().selectedEdgeId;
  return useNarrativeStore.getState().selectedEdgeId;
};

const resetSelection = () => {
  if (useUIStore) {
    if (typeof useUIStore.getState().resetSelection === 'function') {
      useUIStore.getState().resetSelection();
    } else {
      useUIStore.getState().clearSelection();
    }
  } else {
    // Old architecture narrativeStore
    useNarrativeStore.getState().clearSelection();
  }
};

// ------------------------------------------------------------------
// TEST RUNNER
// ------------------------------------------------------------------
let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    // Reset state before each test
    useNarrativeStore.getState().newGraph();
    resetSelection();
    
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   ${e.message}`);
    failed++;
  }
}

// Group A — Invariant Verification
async function main() {
  console.log("=== Phase 2 Behavioral Parity Tests ===");
  if (useUIStore) {
    console.log("Architecture: NEW (uiStore detected)\n");
  } else {
    console.log("Architecture: OLD (narrativeStore handles UI state)\n");
  }

  await runTest('TEST_BI_04 (deleteNode clears selectedNodeId if it matches)', async () => {
    useNarrativeStore.getState().addNode({ x: 0, y: 0 }, 'common');
    const nodes = useNarrativeStore.getState().nodes;
    const nodeId = nodes[nodes.length - 1].id;
    
    selectNode(nodeId);
    if (getSelectedNodeId() !== nodeId) {
      throw new Error("Setup failed: Could not select node.");
    }
    
    useNarrativeStore.getState().deleteNode(nodeId);
    
    if (getSelectedNodeId() !== null) {
      throw new Error(`BI-04 Broken: selectedNodeId is ${getSelectedNodeId()} instead of null.`);
    }
  });

  await runTest('TEST_BI_05 (deleteEdge clears selectedEdgeId if it matches)', async () => {
    useNarrativeStore.getState().addNode({ x: 0, y: 0 }, 'common');
    useNarrativeStore.getState().addNode({ x: 100, y: 0 }, 'common');
    const nodes = useNarrativeStore.getState().nodes;
    const n1 = nodes[nodes.length - 2].id;
    const n2 = nodes[nodes.length - 1].id;
    
    useNarrativeStore.getState().addEdge(n1, n2);
    const edges = useNarrativeStore.getState().edges;
    const edgeId = edges[edges.length - 1].id;
    
    selectEdge(edgeId);
    if (getSelectedEdgeId() !== edgeId) {
      throw new Error("Setup failed: Could not select edge.");
    }
    
    useNarrativeStore.getState().deleteEdge(edgeId);
    
    if (getSelectedEdgeId() !== null) {
      throw new Error(`BI-05 Broken: selectedEdgeId is ${getSelectedEdgeId()} instead of null.`);
    }
  });

  await runTest('TEST_BI_16 (loadGraph resets selection state to null)', async () => {
    // Set selection
    useNarrativeStore.getState().addNode({ x: 0, y: 0 }, 'common');
    const nodes = useNarrativeStore.getState().nodes;
    const nodeId = nodes[nodes.length - 1].id;
    selectNode(nodeId);
    
    if (getSelectedNodeId() !== nodeId) {
      throw new Error("Setup failed: Could not select node.");
    }
    
    // Load empty graph
    useNarrativeStore.getState().loadGraph({
      meta: { title: 'New Graph' },
      nodes: [],
      edges: [],
      flags: []
    });
    
    if (getSelectedNodeId() !== null) {
      throw new Error(`BI-16 Broken: selectedNodeId is ${getSelectedNodeId()} instead of null after loadGraph.`);
    }
  });

  console.log("\n=== Group B — Data Contract Verification ===");
  console.log("No data contract properties were modified in this phase.");

  console.log("\n=== Group C — Migration Verification ===");
  console.log("No data schema migration exists for this phase (only in-place store call wiring).");

  console.log("\n=== Summary ===");
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("PARITY: BROKEN");
  } else {
    console.log("PARITY: CONFIRMED");
  }
}

main();
