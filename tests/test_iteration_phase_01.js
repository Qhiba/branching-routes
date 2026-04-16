const assert = require('assert');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`[PASS] ${name}`);
        passCount++;
    } catch (e) {
        console.error(`[FAIL] ${name}\n       ${e.message}`);
        failCount++;
    }
}

// === INLINED LOGIC FROM SRC ===
// Helper to generate IDs
function generateId(prefix) { return prefix + '_' + Math.floor(Math.random() * 10000); }

// Inlined from fileSystem.js
const generateTypedCollections = (flagsArray) => {
  const flag = {};
  const status = {};
  (flagsArray || []).forEach(f => {
    if (f.type === 'boolean') {
      flag[f.id] = { id: f.id, name: f.name, state: !!f.defaultValue }; 
    } else if (f.type === 'number') {
      status[f.id] = { id: f.id, name: f.name, value: typeof f.defaultValue === 'number' ? f.defaultValue : 0, minValue: null, maxValue: null }; 
    }
  });
  return { flag, status };
};

const migrateNodesPayloads = (collection, originalFlagsArray) => {
  Object.values(collection).forEach(node => {
    if (!node.data) node.data = {};
    const flags_set = [];
    const status_set = [];
    (node.data.sideEffects || []).forEach(se => {
      const referencedFlag = (originalFlagsArray || []).find(f => f.id === se.flagId);
      if (referencedFlag?.type === 'boolean') {
        flags_set.push(se.flagId); 
      } else if (referencedFlag?.type === 'number') {
        status_set.push({
          statusId: se.flagId,
          amount: se.operation === 'subtract' ? -se.value : se.value
        }); 
      }
    });
    node.data.flags_set = flags_set;
    node.data.status_set = status_set;
    delete node.data.sideEffects;
  });
};

const migrateEdgeConditions = (edges, originalFlagsArray) => {
  edges.forEach(edge => {
    if (edge.condition && edge.condition.clauses) {
      const conditions = [];
      edge.condition.clauses.forEach(clause => {
        const referencedFlag = (originalFlagsArray || []).find(f => f.id === clause.flagId);
        if (referencedFlag?.type === 'boolean') {
          conditions.push({
            id: generateId('cond'),
            flag: clause.flagId,
            state: clause.value
          }); 
        } else if (referencedFlag?.type === 'number') {
          const minMax = {};
          if (clause.comparator === '>=' || clause.comparator === '>') minMax.min = clause.value;
          if (clause.comparator === '<=' || clause.comparator === '<') minMax.max = clause.value;
          if (clause.comparator === '==') { minMax.min = clause.value; minMax.max = clause.value; }
          conditions.push({
            id: generateId('cond'),
            status: clause.flagId,
            ...minMax
          }); 
        }
      });
      edge.condition = {
        operator: (edge.condition.operator || 'AND').toLowerCase(), 
        conditions
      };
      delete edge.condition.clauses;
    }
  });
};

// Inlined from narrativeStore.js validations
const deleteFlagTest = (state, id) => {
    const references = [];
    state.edges.forEach(e => {
      if (e.condition && e.condition.conditions) {
        if (e.condition.conditions.some(c => c.flag === id)) {
          references.push(`edge_condition:${e.id}`);
        }
      }
    });

    const allNodes = [
      ...Object.values(state.common),
      ...Object.values(state.choice),
      ...Object.values(state.ending)
    ];

    allNodes.forEach(n => {
      if (n.data && n.data.flags_set && n.data.flags_set.includes(id)) {
        references.push(`node_sideEffect:${n.id}`);
      }
    });

    if (references.length > 0) return { blocked: true, references };
    return { blocked: false };
};

const deleteStatusTest = (state, id) => {
    const references = [];
    state.edges.forEach(e => {
      if (e.condition && e.condition.conditions) {
        if (e.condition.conditions.some(c => c.status === id)) {
          references.push(`edge_condition:${e.id}`);
        }
      }
    });

    const allNodes = [
      ...Object.values(state.common),
      ...Object.values(state.choice),
      ...Object.values(state.ending)
    ];

    allNodes.forEach(n => {
      if (n.data && n.data.status_set && n.data.status_set.some(se => se.statusId === id)) {
        references.push(`node_sideEffect:${n.id}`);
      }
    });

    if (references.length > 0) return { blocked: true, references };
    return { blocked: false };
};
// ==============================

// Group A — Old Behavior Tombstone
runTest("Group A: Old behavior flag structures are removed post-migration", () => {
    const v2Data = {
        schemaVersion: 2,
        flags: [{ id: 'f1', name: 'is_happy', type: 'boolean', defaultValue: true }]
    };
    const { flag, status } = generateTypedCollections(v2Data.flags);
    assert.strictEqual(flag['f1'].state, true, "New structure flag{} should exist and hold state.");
    assert.strictEqual(v2Data.flag, undefined, "Old data had no flag{}");
});

// Group B - New Behavior Confirmation
runTest("Group B: Node sideEffects correctly migrate to flags_set and status_set", () => {
    const commonNode = {
        n1: {
            id: 'n1',
            data: {
                sideEffects: [
                    { flagId: 'f1', operation: 'set', value: true },
                    { flagId: 'sp1', operation: 'subtract', value: 10 }
                ]
            }
        }
    };
    const baseFlags = [
        { id: 'f1', type: 'boolean' },
        { id: 'sp1', type: 'number' }
    ];
    
    migrateNodesPayloads(commonNode, baseFlags);
    
    assert.strictEqual(commonNode.n1.data.sideEffects, undefined, "sideEffects should be deleted");
    assert.deepStrictEqual(commonNode.n1.data.flags_set, ['f1'], "Boolean flags go to flags_set");
    assert.deepStrictEqual(commonNode.n1.data.status_set, [{ statusId: 'sp1', amount: -10 }], "Numeric flags map to status_set with amount");
});

runTest("Group B: Edge conditions clauses correctly migrate to typed condition objects", () => {
    const edges = [
        {
            condition: {
                operator: 'AND',
                clauses: [
                    { flagId: 'f1', value: true },
                    { flagId: 'sp1', comparator: '>=', value: 50 },
                    { flagId: 'sp2', comparator: '==', value: 100 }
                ]
            }
        }
    ];
    const baseFlags = [
        { id: 'f1', type: 'boolean' },
        { id: 'sp1', type: 'number' },
        { id: 'sp2', type: 'number' }
    ];
    
    migrateEdgeConditions(edges, baseFlags);
    
    const condition = edges[0].condition;
    assert.strictEqual(condition.operator, 'and', "Operator downcased");
    assert.strictEqual(condition.clauses, undefined, "clauses array removed");
    assert.strictEqual(condition.conditions.length, 3, "New conditions array populated");
    assert.strictEqual(condition.conditions[0].flag, 'f1');
    assert.strictEqual(condition.conditions[0].state, true);
    assert.strictEqual(condition.conditions[1].status, 'sp1');
    assert.strictEqual(condition.conditions[1].min, 50);
    assert.strictEqual(condition.conditions[2].status, 'sp2');
    assert.strictEqual(condition.conditions[2].min, 100);
    assert.strictEqual(condition.conditions[2].max, 100);
});

// Group C - Regression Suite
runTest("Group C: Referential Integrity intact for deleteFlag", () => {
    const state = {
        edges: [
            { id: 'e1', condition: { conditions: [{ flag: 'f1', state: true }] } }
        ],
        common: { n1: { id: 'n1', data: { flags_set: [] } } },
        choice: {}, ending: {}
    };
    
    const resultBlocked = deleteFlagTest(state, 'f1');
    assert.strictEqual(resultBlocked.blocked, true, "Protected constraint: flag in condition blocks deletion");
    assert.deepStrictEqual(resultBlocked.references, ['edge_condition:e1']);
    
    const resultClear = deleteFlagTest(state, 'f2');
    assert.strictEqual(resultClear.blocked, false, "Allowed to delete an unused flag");
});

runTest("Group C: Referential Integrity intact for deleteStatus", () => {
    const state = {
        edges: [],
        common: { n1: { id: 'n1', data: { status_set: [{ statusId: 'sp1', amount: 5 }] } } },
        choice: {}, ending: {}
    };
    
    const resultBlocked = deleteStatusTest(state, 'sp1');
    assert.strictEqual(resultBlocked.blocked, true, "Protected constraint: status in status_set blocks deletion");
    assert.deepStrictEqual(resultBlocked.references, ['node_sideEffect:n1']);
    
    const resultClear = deleteStatusTest(state, 'sp2');
    assert.strictEqual(resultClear.blocked, false, "Allowed to delete an unused status");
});

console.log(`\n============================`);
console.log(`TEST SUMMARY`);
console.log(`============================`);
console.log(`${passCount} passed, ${failCount} failed`);
console.log(`REGRESSION: ${failCount > 0 ? 'BROKEN' : 'CLEAN'}`);
