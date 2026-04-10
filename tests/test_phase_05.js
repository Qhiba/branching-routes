import { useSimulationStore } from '../src/store/simulationStore.js';
import { useGraphStore } from '../src/store/graphStore.js';
import * as assert from 'assert';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (err) {
    console.log(`FAIL: ${name}`);
    console.error(`  -> ${err.message || err}`);
    failed++;
  }
}

function resetStores() {
  useGraphStore.setState({
    nodes: [],
    edges: [],
    flags: [],
    meta: { title: 'Test Graph' }
  });
  useSimulationStore.getState().reset();
}

async function testPhase05() {
  console.log("=== Phase 05 Tests ===");

  // 1. Failure Case: Start Simulation without start node
  runTest("Start simulation fails when no start node is present", () => {
    resetStores();
    useGraphStore.getState().addNode({ x: 0, y: 0 }, 'common');
    // First node automatically becomes start node, so we must manually unset it
    let gs = useGraphStore.getState();
    gs.updateNode(gs.nodes[0].id, { data: { ...gs.nodes[0].data, isStartNode: false } });
    
    assert.throws(() => {
      useSimulationStore.getState().start();
    }, /No start node/);
  });

  // 2. Happy Path: Start Simulation with start node and initial flags
  runTest("Start simulation succeeds and computes initial reachable edges", () => {
    resetStores();
    useGraphStore.getState().addNode({ x: 0, y: 0 }, 'common');
    useGraphStore.getState().addNode({ x: 100, y: 0 }, 'common');
    useGraphStore.getState().addNode({ x: 200, y: 0 }, 'common');
    
    let gs = useGraphStore.getState();
    const n1 = gs.nodes[0];
    const n2 = gs.nodes[1];
    const n3 = gs.nodes[2];
    
    // addNode automatically sets first as start node, but we'll ensure it just in case
    gs.updateNode(n1.id, { data: { ...n1.data, isStartNode: true } });

    // Add flag
    gs.addFlag('points', 'number', 0);
    gs = useGraphStore.getState();
    const flag = gs.flags[0];

    // Add edges
    useGraphStore.getState().addEdge(n1.id, n2.id); // Default always reachable
    useGraphStore.getState().addEdge(n1.id, n3.id); 
    gs = useGraphStore.getState();
    
    // Add condition to n1->n3
    const e2 = gs.edges[1];
    useGraphStore.getState().updateEdge(e2.id, {
      condition: {
        operator: 'AND',
        clauses: [{ flagId: flag.id, comparator: '>=', value: 5 }]
      }
    });

    useSimulationStore.getState().start();
    const simState = useSimulationStore.getState();

    assert.strictEqual(simState.isRunning, true, "Simulation should be running");
    assert.strictEqual(simState.activeNodeId, n1.id, "Active node should be start node");
    
    // Node 2 should be reachable, Node 3 should NOT (points < 5)
    assert.ok(simState.reachableNodeIds.includes(n2.id), "n2 should be reachable");
    assert.ok(!simState.reachableNodeIds.includes(n3.id), "n3 should NOT be reachable");
  });

  // 3. Happy Path: Advance Simulation 
  runTest("Advancing simulation to a reachable node updates active state", () => {
    // Relying on state from previous test (n2 is reachable)
    const gs = useGraphStore.getState();
    const e1 = gs.edges[0]; // edge connecting n1 -> n2
    const n2 = gs.nodes[1];

    useSimulationStore.getState().advance(e1.id);
    const simState = useSimulationStore.getState();

    assert.strictEqual(simState.activeNodeId, n2.id, "Active node should advance to n2");
    assert.ok(simState.traversedEdgeIds.includes(e1.id), "Edge 1 should be in traversed list");
    assert.ok(simState.visitedNodeIds.includes(gs.nodes[0].id), "n1 should be visited");
  });

  // 4. Failure Case: Advance via invalid edge
  runTest("Advancing via an unreachable edge fails", () => {
    const gs = useGraphStore.getState();
    const e2 = gs.edges[1]; // n1 -> n3 edge
    
    assert.throws(() => {
      useSimulationStore.getState().advance(e2.id);
    }, /not reachable/i);
  });

  // 5. Edge Case: Reset Simulation
  runTest("Resetting simulation clears all state", () => {
    useSimulationStore.getState().reset();
    const simState = useSimulationStore.getState();
    assert.strictEqual(simState.isRunning, false);
    assert.strictEqual(simState.activeNodeId, null);
    assert.strictEqual(simState.visitedNodeIds.length, 0);
    assert.strictEqual(simState.traversedEdgeIds.length, 0);
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
}

testPhase05().catch(err => console.error(err));
