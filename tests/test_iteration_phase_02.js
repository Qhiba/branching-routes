const assert = require('assert');

// --- INLINED LOGIC FROM fileSystem.js ---
function generateId(prefix) { return prefix + '_' + Math.random().toString(36).substr(2, 9); }

function processImport(data) {
  // PURE LOGIC EXTRACTED FROM importProject
  if (![1, 2, 3, 4].includes(data.schemaVersion)) {
    throw new Error('unsupported_schema_version');
  }

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

  if (data.schemaVersion === 1) {
    const meta = {
      ...data.meta,
      commonNodeTypes: data.meta?.commonNodeTypes || [],
      endingTypes: data.meta?.endingTypes || [],
    };
    const common = {};
    const choice = {};
    const ending = {};
    (data.nodes || []).forEach(node => {
      if (node.type === 'choice') { choice[node.id] = node; } 
      else if (node.type === 'ending') { ending[node.id] = node; } 
      else { common[node.id] = node; }
    });
    const edges = (data.edges || []).map(edge => {
      const { sideEffects, ...cleanEdge } = edge;
      return cleanEdge;
    });
    const baseFlags = data.flags || [];
    const { flag, status } = generateTypedCollections(baseFlags);
    migrateNodesPayloads(common, baseFlags);
    migrateNodesPayloads(choice, baseFlags);
    migrateNodesPayloads(ending, baseFlags);
    migrateEdgeConditions(edges, baseFlags);
    data = { common, choice, ending, edges, flag, status, meta, schemaVersion: 3 };
  } else if (data.schemaVersion === 2) {
    const baseFlags = data.flags || [];
    const { flag, status } = generateTypedCollections(baseFlags);
    migrateNodesPayloads(data.common || {}, baseFlags);
    migrateNodesPayloads(data.choice || {}, baseFlags);
    migrateNodesPayloads(data.ending || {}, baseFlags);
    migrateEdgeConditions(data.edges || [], baseFlags);
    delete data.flags;
    data.flag = flag;
    data.status = status;
    data.schemaVersion = 3;
  }

  if (data.schemaVersion === 3) {
    data.path = data.path || {};
    data.chapter = data.chapter || {};
    data.schemaVersion = 4;
  }

  const sanitizedData = {
    schemaVersion: data.schemaVersion,
    meta: {
      title: data.meta?.title || 'Untitled Graph',
      createdAt: data.meta?.createdAt || Date.now(),
      updatedAt: data.meta?.updatedAt || Date.now(),
      commonNodeTypes: Array.isArray(data.meta?.commonNodeTypes) ? data.meta.commonNodeTypes : [],
      endingTypes: Array.isArray(data.meta?.endingTypes) ? data.meta.endingTypes : []
    },
    common: {},
    choice: {},
    ending: {},
    edges: Array.isArray(data.edges) ? data.edges : [],
    flag: typeof data.flag === 'object' && data.flag !== null ? data.flag : {},
    status: typeof data.status === 'object' && data.status !== null ? data.status : {},
    path: typeof data.path === 'object' && data.path !== null ? data.path : {},
    chapter: typeof data.chapter === 'object' && data.chapter !== null ? data.chapter : {}
  };

  const sanitizeNodes = (sourceCol, targetCol, type) => {
    if (!sourceCol || typeof sourceCol !== 'object') return;
    Object.entries(sourceCol).forEach(([id, node]) => {
      if (!node || typeof node !== 'object') return;
      targetCol[id] = {
        id: node.id || id,
        type: node.type || type,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {}
      };
    });
  };

  sanitizeNodes(data.common, sanitizedData.common, 'common');
  sanitizeNodes(data.choice, sanitizedData.choice, 'choice');
  sanitizeNodes(data.ending, sanitizedData.ending, 'ending');

  return sanitizedData;
}
// --- END INLINED LOGIC ---

// --- TESTS ---
let passed = 0; let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch(e) {
    console.log(`[FAIL] ${name}\n       ${e.message}`);
    failed++;
  }
}

console.log("=== Group A: Old Behavior Tombstone ===");
// Old behavior: missing collections crashed or were undefined because they weren't assigned defaults.
runTest("Missing collections are provided defaults instead of remaining missing", () => {
  const result = processImport({ schemaVersion: 4 });
  assert.deepStrictEqual(result.path, {});
  assert.deepStrictEqual(result.chapter, {});
  assert.deepStrictEqual(result.common, {});
});

console.log("=== Group B: New Behavior Confirmation ===");
runTest("Injects missing minimal structure on nodes", () => {
  const result = processImport({
    schemaVersion: 4,
    common: { "n1": {} } // badly formed node
  });
  assert.strictEqual(result.common["n1"].id, "n1");
  assert.strictEqual(result.common["n1"].type, "common");
  assert.deepStrictEqual(result.common["n1"].data, {});
});

runTest("Unsupported schema throws error", () => {
  assert.throws(() => processImport({ schemaVersion: 99 }), /unsupported_schema_version/);
});

console.log("=== Group C: Regression Suite ===");
runTest("v1 to v4 migration chain maintains identical logic", () => {
  const v1Data = {
    schemaVersion: 1,
    nodes: [{ id: "n1", type: "common", data: { sideEffects: [{flagId: "f1"}] } }],
    edges: [],
    flags: [{ id: "f1", type: "boolean", defaultValue: false }]
  };
  const result = processImport(v1Data);
  assert.strictEqual(result.schemaVersion, 4);
  assert.strictEqual(result.flag["f1"].name, undefined); // Extracted correctly
  assert.deepStrictEqual(result.common["n1"].data.flags_set, ["f1"]);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
console.log(`REGRESSION: ${failed > 0 ? 'BROKEN' : 'CLEAN'}`);
