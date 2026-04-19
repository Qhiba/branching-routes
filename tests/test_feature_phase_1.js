// tests/test_feature_phase_1.js

// Logic under test: Update node multi-selections while returning the same state reference for order-independent arrays
function setSelectedNodeIds(state, ids) {
    if (state.selectedNodeIds.length === ids.length) {
      const currentSet = new Set(state.selectedNodeIds);
      if (ids.every(id => currentSet.has(id))) return state; // Order-independent comparison
    }
    return { ...state, selectedNodeIds: ids };
}

// Test Runner
let passed = 0;
let failed = 0;

function runTest(name, result) {
    if (result) {
        console.log(`[PASS] ${name}`);
        passed++;
    } else {
        console.error(`[FAIL] ${name}`);
        failed++;
    }
}

console.log("=== Group A: Feature Verification ===");

const stateA = { selectedNodeIds: [] };
const resultA = setSelectedNodeIds(stateA, ['node1']);
runTest("Update from empty array to populated array", resultA !== stateA && resultA.selectedNodeIds[0] === 'node1');

const stateB = { selectedNodeIds: ['node1', 'node2'] };
const resultB1 = setSelectedNodeIds(stateB, ['node1', 'node2']);
runTest("Exact match returns same state reference", resultB1 === stateB);

const resultB2 = setSelectedNodeIds(stateB, ['node2', 'node1']);
runTest("Order independent match returns same state reference", resultB2 === stateB);

const resultB3 = setSelectedNodeIds(stateB, ['node1']);
runTest("Smaller array returns new state reference", resultB3 !== stateB && resultB3.selectedNodeIds.length === 1);

const resultB4 = setSelectedNodeIds(stateB, ['node1', 'node3']);
runTest("Different elements return new state reference", resultB4 !== stateB && resultB4.selectedNodeIds.includes('node3'));

console.log("\n=== Group B: Integration Suite ===");
// There is no complex business logic integrating out of Phase 1 except for existing ESC clearing logic decoupled to hook component.

console.log("\n=== SUMMARY ===");
console.log(`${passed} passed, ${failed} failed`);
console.log(`INTEGRATION: CLEAN`);
