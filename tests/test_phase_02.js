import { evaluateClause, evaluateCondition } from '../src/utils/conditionEvaluator.js';
import { generateId } from '../src/utils/uuid.js';
import { useGraphStore } from '../src/store/graphStore.js';
import { useSimulationStore } from '../src/store/simulationStore.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${message}`);
  } else {
    failed++;
    console.error(`[FAIL] ${message}`);
  }
}

async function runTests() {
  console.log("=== STARTING PHASE 02 TESTS ===\n");

  // === uuid.js ===
  console.log("--- uuid.js ---");
  const id1 = generateId();
  const id2 = generateId();
  assert(typeof id1 === 'string' && id1.length === 36, "generateId returns 36-char string");
  assert(id1 !== id2, "generateId returns unique strings");

  // === conditionEvaluator.js ===
  console.log("\n--- conditionEvaluator.js ---");
  const flagState = { flagA: true, flagB: 5 };
  
  assert(evaluateClause({ flagId: 'flagA', comparator: '==', value: true }, flagState) === true, "evaluateClause: boolean equals");
  assert(evaluateClause({ flagId: 'flagB', comparator: '>', value: 3 }, flagState) === true, "evaluateClause: number greater than");
  assert(evaluateClause({ flagId: 'flagC', comparator: '==', value: true }, flagState) === false, "evaluateClause: missing flag returns false");

  assert(evaluateCondition(null, flagState) === true, "evaluateCondition: null returns true");
  assert(evaluateCondition({ operator: 'AND', clauses: [] }, flagState) === true, "evaluateCondition: empty clauses returns true");
  assert(evaluateCondition({ operator: 'AND', clauses: [{ flagId: 'flagB', comparator: '>', value: 3 }] }, flagState) === true, "evaluateCondition: valid AND single clause");
  assert(evaluateCondition({ operator: 'OR', clauses: [{ flagId: 'flagC', comparator: '==', value: true }, { flagId: 'flagA', comparator: '==', value: true }] }, flagState) === true, "evaluateCondition: valid OR missing + matching clause");

  // === graphStore.js ===
  console.log("\n--- graphStore.js ---");
  const graphStore = useGraphStore.getState();
  
  graphStore.newGraph();
  graphStore.addNode({x:0, y:0}, 'common');
  const n1 = useGraphStore.getState().nodes[0];
  assert(n1.data.isStartNode === true, "first node added becomes start node (edge case)");
  
  graphStore.addNode({x:10, y:10}, 'common');
  const n2 = useGraphStore.getState().nodes[1];
  assert(n2.data.isStartNode === false, "second node added is not start node (happy path)");

  graphStore.addNode({x:20, y:20}, 'ending');
  const n3 = useGraphStore.getState().nodes[2];
  
  graphStore.addEdge(n1.id, n2.id); 
  const validEdge = useGraphStore.getState().edges[0];
  assert(validEdge.sourceId === n1.id && validEdge.targetId === n2.id, "can create valid edge (happy path)");
  
  let threwException = false;
  try {
    graphStore.addEdge(n3.id, n1.id);
  } catch (e) {
    threwException = true;
  }
  assert(threwException, "addEdge throws if source is 'ending' node (failure case handling rule AR-12)");

  graphStore.addFlag("testFlag", "boolean", true);
  const flagId = useGraphStore.getState().flags[0].id;
  graphStore.updateEdge(validEdge.id, { condition: { operator: 'AND', clauses: [{ flagId, comparator: '==', value: true }] } });
  
  const blockResult = useGraphStore.getState().deleteFlag(flagId);
  assert(blockResult.blocked === true, "deleteFlag blocked if referenced in edge condition (data integrity guard)");

  graphStore.updateEdge(validEdge.id, { condition: null });
  const blockResult2 = useGraphStore.getState().deleteFlag(flagId);
  assert(blockResult2.blocked === false, "deleteFlag passes if not referenced (happy path condition removal)");

  // === simulationStore.js ===
  console.log("\n--- simulationStore.js ---");
  const simStore = useSimulationStore.getState();
  graphStore.newGraph();

  graphStore.addFlag("score", "number", 0);
  const scoreFlag = useGraphStore.getState().flags[0];

  graphStore.addNode({x:0, y:0}, 'common');
  const sn1 = useGraphStore.getState().nodes[0];
  graphStore.addNode({x:0, y:0}, 'ending');
  const sn2 = useGraphStore.getState().nodes[1];

  graphStore.addEdge(sn1.id, sn2.id);
  const sedge = useGraphStore.getState().edges[0];

  graphStore.updateEdge(sedge.id, { sideEffects: [{ flagId: scoreFlag.id, operation: "add", value: 5 }] });
  useGraphStore.getState().updateNode(sn2.id, { data: { sideEffects: [{ flagId: scoreFlag.id, operation: "add", value: 10 }] } });

  useSimulationStore.getState().start();
  let simState = useSimulationStore.getState();
  assert(simState.isRunning === true && simState.activeNodeId === sn1.id, "simulation start initializes correctly (happy path)");
  assert(simState.reachableEdgeIds.includes(sedge.id), "reachable edges computed correctly at start (happy path)");

  useSimulationStore.getState().advance(sedge.id);
  simState = useSimulationStore.getState();
  
  assert(simState.activeNodeId === sn2.id, "simulation advance moves active node (happy path)");
  assert(simState.traversedEdgeIds.includes(sedge.id), "edge added to traversedEdgeIds (happy path)");
  assert(simState.currentFlagValues[scoreFlag.id] === 15, "side effects applied in correct order and sequence rule AR-11 (data integrity)");
  assert(simState.reachableEdgeIds.length === 0, "path finding correctly identified terminal state stringing from ending node (edge case)");

  console.log(`\n=== SUMMARY ===`);
  console.log(`Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

runTests();
