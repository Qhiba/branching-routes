import assert from 'assert';

// ---- INLINED LOGIC FOR TESTING ----
function generateSnapshot(state, narrativeState) {
    const flagOverrides = {};
    const statusOverrides = {};
    
    Object.entries(state.currentFlagValues).forEach(([id, value]) => {
        if (narrativeState.flag && narrativeState.flag[id]) flagOverrides[id] = value;
        else if (narrativeState.status && narrativeState.status[id]) statusOverrides[id] = value;
    });

    return {
        activeNodeId: state.activeNodeId,
        seenNodeIds: [...state.seenNodeIds],
        traversedEdgeIds: [...state.traversedEdgeIds],
        flagOverrides,
        statusOverrides
    };
}

let passed = 0;
let failed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`FAIL: ${name}`);
        console.error(err);
        failed++;
    }
}

console.log("=== Group A: Feature Verification ===");

runTest("Separates boolean flags and numeric statuses correctly", () => {
    const state = {
        activeNodeId: "n-1",
        seenNodeIds: ["n-1", "n-2"],
        traversedEdgeIds: ["e-1"],
        currentFlagValues: {
            "f-abc": true,
            "sp-def": 42
        }
    };
    
    const narrativeState = {
        flag: { "f-abc": { id: "f-abc", name: "Has Item" } },
        status: { "sp-def": { id: "sp-def", name: "Health" } }
    };
    
    const snapshot = generateSnapshot(state, narrativeState);
    
    assert.deepStrictEqual(snapshot.flagOverrides, { "f-abc": true });
    assert.deepStrictEqual(snapshot.statusOverrides, { "sp-def": 42 });
});

runTest("Ignores stale or phantom IDs not present in narrativeStore", () => {
    const state = {
        activeNodeId: "n-1",
        seenNodeIds: [],
        traversedEdgeIds: [],
        currentFlagValues: {
            "f-abc": true,
            "f-stale": false,
            "sp-ghost": 10
        }
    };
    
    const narrativeState = {
        flag: { "f-abc": { id: "f-abc" } },
        status: {}
    };
    
    const snapshot = generateSnapshot(state, narrativeState);
    
    assert.deepStrictEqual(snapshot.flagOverrides, { "f-abc": true });
    assert.deepStrictEqual(snapshot.statusOverrides, {});
});

runTest("Handles empty store collections safely", () => {
    const state = {
        activeNodeId: "n-1",
        seenNodeIds: [],
        traversedEdgeIds: [],
        currentFlagValues: {
            "f-abc": true
        }
    };
    
    const narrativeState = {}; // Missing 'flag' and 'status' collections
    
    const snapshot = generateSnapshot(state, narrativeState);
    
    assert.deepStrictEqual(snapshot.flagOverrides, {});
    assert.deepStrictEqual(snapshot.statusOverrides, {});
});

console.log("\n=== Group B: Integration Suite ===");

runTest("Snapshot output matches expected integration shape", () => {
    const state = {
        activeNodeId: "node-1",
        seenNodeIds: ["node-1"],
        traversedEdgeIds: [],
        currentFlagValues: {}
    };
    
    const narrativeState = { flag: {}, status: {} };
    
    const snapshot = generateSnapshot(state, narrativeState);
    
    assert.ok('activeNodeId' in snapshot);
    assert.ok('seenNodeIds' in snapshot);
    assert.ok('traversedEdgeIds' in snapshot);
    assert.ok('flagOverrides' in snapshot);
    assert.ok('statusOverrides' in snapshot);
    
    assert.strictEqual(snapshot.activeNodeId, "node-1");
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
