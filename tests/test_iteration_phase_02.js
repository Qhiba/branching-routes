import assert from 'assert';

// -------------------------------------------------------------
// INLINE OLD CODE (Pre-Phase 2 schema gate)
// -------------------------------------------------------------
function oldImportData(data) {
  if (data.schemaVersion !== 1) {
    throw new Error('unsupported_schema_version');
  }
  return data;
}

// -------------------------------------------------------------
// INLINE NEW CODE (Post-Phase 2 schema gate and normalization)
// -------------------------------------------------------------
function newImportData(data) {
  if (data.schemaVersion !== 1 && data.schemaVersion !== 2) {
    throw new Error('unsupported_schema_version');
  }

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
      if (node.type === 'choice') {
        choice[node.id] = node;
      } else if (node.type === 'ending') {
        ending[node.id] = node;
      } else {
        common[node.id] = node;
      }
    });

    const affectedEdgeIds = [];
    let discardedEffectsCount = 0;

    const edges = (data.edges || []).map(edge => {
      if (edge.sideEffects && edge.sideEffects.length > 0) {
        affectedEdgeIds.push(edge.id);
        discardedEffectsCount += edge.sideEffects.length;
      }
      const { sideEffects, ...cleanEdge } = edge;
      return cleanEdge;
    });

    return {
      common,
      choice,
      ending,
      edges,
      flags: data.flags || [],
      meta
    };
  }

  return data;
}

// -------------------------------------------------------------
// TEST RUNNER
// -------------------------------------------------------------
let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (error) {
    console.log(`[FAIL] ${name}`);
    console.log(`       ${error.message}`);
    failed++;
  }
}

// --- Group A: Old Behavior Tombstone ---

runTest('Group A - Old code passes legacy layout through exactly as-is, new code restructures it', () => {
  const payload = {
    schemaVersion: 1,
    nodes: [{ id: 'n1', type: 'common' }],
    edges: [{ id: 'e1', sideEffects: ['effect'] }]
  };
  
  // Prove old behavior returns the exact same object
  const oldResult = oldImportData(payload);
  assert.strictEqual(oldResult.nodes, payload.nodes, 'Old code should return array verbatim');
  assert.strictEqual(oldResult.edges[0].sideEffects, payload.edges[0].sideEffects, 'Old code should retain edge effects');
  
  // Prove new behavior destroys `nodes` and strips `sideEffects`
  const newResult = newImportData(payload);
  assert.strictEqual(newResult.nodes, undefined, 'New code must not return flat nodes array');
  assert.strictEqual(newResult.edges[0].sideEffects, undefined, 'New code must strip edge sideEffects');
});

runTest('Group A - Old code rejects schemaVersion 2, new code accepts it', () => {
  const payload = { schemaVersion: 2, common: {}, choice: {}, ending: {} };
  
  assert.throws(() => oldImportData(payload), /unsupported_schema_version/, 'Old code must reject v2');
  assert.doesNotThrow(() => newImportData(payload), 'New code must accept v2');
});


// --- Group B: New Behavior Confirmation ---

runTest('Group B - New schemaVersion 2 payload passes through completely unmodified', () => {
  const payload = {
    schemaVersion: 2,
    common: { n1: { id: 'n1' } },
    choice: {},
    ending: {},
    edges: [{ id: 'e1' }],
    meta: { commonNodeTypes: [], endingTypes: [] },
    flags: []
  };
  
  const res = newImportData(payload);
  assert.strictEqual(res.common.n1.id, 'n1');
  assert.strictEqual(res.schemaVersion, 2);
});

runTest('Group B - Legacy parsing correctly sorts node types and strips side effects', () => {
  const payload = {
    schemaVersion: 1,
    meta: { title: 'Legacy' },
    nodes: [
      { id: 'n1', type: 'common' },
      { id: 'n2', type: 'choice' },
      { id: 'n3', type: 'ending' },
      { id: 'n4', type: 'unknown_type' }
    ],
    edges: [
      { id: 'e1', targetId: 'n2', sideEffects: ['eff1', 'eff2'] },
      { id: 'e2', targetId: 'n3', sideEffects: [] } // Empty should be cleaned too
    ],
    flags: []
  };
  
  // Disable console warning for the test
  const oldWarn = console.warn;
  console.warn = () => {};
  const res = newImportData(payload);
  console.warn = oldWarn;
  
  // Node distributing
  assert(res.common['n1'], 'common node mapped to common');
  assert(res.choice['n2'], 'choice node mapped to choice');
  assert(res.ending['n3'], 'ending node mapped to ending');
  assert(res.common['n4'], 'unrecognized node mapped to common fallback');
  
  // Edge scrubbing
  assert.strictEqual(res.edges[0].sideEffects, undefined);
  assert.strictEqual(res.edges[0].targetId, 'n2');
  assert.strictEqual(res.edges[1].sideEffects, undefined);
  
  // Meta patching
  assert.strictEqual(res.meta.title, 'Legacy');
  assert(Array.isArray(res.meta.commonNodeTypes), 'missing meta property supplied');
});

runTest('Group B - Rejects unsupported schemas', () => {
  assert.throws(() => newImportData({ schemaVersion: 3 }), /unsupported_schema_version/);
  assert.throws(() => newImportData({ schemaVersion: 0 }), /unsupported_schema_version/);
  assert.throws(() => newImportData({ schemaVersion: undefined }), /unsupported_schema_version/);
});

// --- Group C: Regression Suite ---

runTest('Group C - Attributes of edges other than sideEffects are perfectly preserved', () => {
  const payload = {
    schemaVersion: 1,
    nodes: [],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', condition: { clauses: [] }, nested: { a: 1 } }
    ]
  };
  
  const res = newImportData(payload);
  assert.strictEqual(res.edges[0].condition.clauses.length, 0);
  assert.strictEqual(res.edges[0].nested.a, 1);
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n--- RESULTS ---');
console.log(`${passed} passed, ${failed} failed`);
console.log(`REGRESSION: ${failed === 0 ? 'CLEAN' : 'BROKEN'}`);
