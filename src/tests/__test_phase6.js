// ============================================================
// Phase 6 — Graph Canvas Foundation — Test Suite
// ============================================================
// Run: node src/tests/__test_phase6.js
// Each test prints PASS or FAIL with a description.
// Final summary: X passed, Y failed.
//
// Tests cover:
//   - Node building (buildNode, toNodeType)
//   - Edge building from Common Nodes (buildEdgesFromCommonNode)
//   - Edge building from Choices (buildEdgesFromChoice)
//   - Entity type resolution (getEntityType)
//   - Edge ID parsing for removal
//   - Data integrity against Plan §4 data model
//   - Edge cases: empty stores, missing fields, null positions
// ============================================================

// ── Test Harness ────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  PASS: ${description}`);
    passed++;
  } else {
    console.log(`  FAIL: ${description}`);
    failed++;
  }
}

function group(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(60));
}

// ── Inline copies of pure logic functions from useGraphSync.js ──
// These are module-internal, so we re-implement them for testability.

function toNodeType(entityType) {
  switch (entityType) {
    case 'common':
      return 'commonNode';
    case 'choice':
      return 'choiceNode';
    case 'ending':
      return 'endingNode';
    default:
      return 'default';
  }
}

function buildNode(entity, entityType) {
  return {
    id: entity.id,
    type: toNodeType(entityType),
    position: { x: entity._position?.x ?? 0, y: entity._position?.y ?? 0 },
    data: {
      entity,
      entityType,
    },
  };
}

function buildEdgesFromCommonNode(node) {
  return node.next.map((entry) => ({
    id: `edge-${node.id}-${entry.id}`,
    source: node.id,
    target: entry.target,
    data: {
      nextEntryId: entry.id,
      sourceEntityType: 'common',
      requires: entry.requires,
    },
  }));
}

function buildEdgesFromChoice(choice) {
  const edges = [];
  for (const option of choice.options) {
    for (const entry of option.next) {
      edges.push({
        id: `edge-${choice.id}-${option.id}-${entry.id}`,
        source: choice.id,
        target: entry.target,
        data: {
          nextEntryId: entry.id,
          optionId: option.id,
          sourceEntityType: 'choice',
          requires: entry.requires,
          optionLabel: option.label,
        },
      });
    }
  }
  return edges;
}

// ── Inline copy of getEntityType from useGraphCallbacks.js ──
// Simplified version without store fallback (testing prefix logic only).

function getEntityTypeByPrefix(nodeId) {
  if (!nodeId) return null;
  if (nodeId.startsWith('node_')) return 'common';
  if (nodeId.startsWith('choice_')) return 'choice';
  if (nodeId.startsWith('ending_')) return 'ending';
  return null;
}

// ── Test Fixtures ───────────────────────────────────────────

function makeCommonNode(overrides = {}) {
  return {
    id: overrides.id ?? 'node_1234567890_ab12',
    name: overrides.name ?? 'test_node',
    type: overrides.type ?? null,
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    description: overrides.description ?? '',
    variants: overrides.variants ?? [],
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    flags_set: overrides.flags_set ?? [],
    status_set: overrides.status_set ?? [],
    next: overrides.next ?? [],
    _position: overrides._position ?? { x: 100, y: 200 },
  };
}

function makeChoice(overrides = {}) {
  return {
    id: overrides.id ?? 'choice_1234567890_cd34',
    text: overrides.text ?? 'Choose wisely',
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    options: overrides.options ?? [],
    _position: overrides._position ?? { x: 300, y: 200 },
  };
}

function makeEnding(overrides = {}) {
  return {
    id: overrides.id ?? 'ending_1234567890_ef56',
    name: overrides.name ?? 'good_ending',
    type: overrides.type ?? 'good_end',
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    _position: overrides._position ?? { x: 500, y: 200 },
  };
}

function makeNextEntry(overrides = {}) {
  return {
    id: overrides.id ?? 'route_999_zz99',
    target: overrides.target ?? 'node_target_0001',
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
  };
}

function makeOption(overrides = {}) {
  return {
    id: overrides.id ?? 'opt_999_yy88',
    label: overrides.label ?? 'Go left',
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    flags_set: overrides.flags_set ?? [],
    status_set: overrides.status_set ?? [],
    next: overrides.next ?? [],
  };
}


// ════════════════════════════════════════════════════════════
//  SECTION A — toNodeType
// ════════════════════════════════════════════════════════════

group('toNodeType — entity type to React Flow node type');

(() => {
  assert(toNodeType('common') === 'commonNode', 'common → commonNode');
  assert(toNodeType('choice') === 'choiceNode', 'choice → choiceNode');
  assert(toNodeType('ending') === 'endingNode', 'ending → endingNode');
  assert(toNodeType('unknown') === 'default', 'unknown → default');
  assert(toNodeType('') === 'default', 'empty string → default');
  assert(toNodeType(null) === 'default', 'null → default');
  assert(toNodeType(undefined) === 'default', 'undefined → default');
})();


// ════════════════════════════════════════════════════════════
//  SECTION B — buildNode — Happy Path
// ════════════════════════════════════════════════════════════

group('buildNode — Happy Path');

// Common Node
(() => {
  const entity = makeCommonNode({ id: 'node_abc_1234', name: 'start', _position: { x: 42, y: 99 } });
  const node = buildNode(entity, 'common');

  assert(node.id === 'node_abc_1234', 'id matches entity id');
  assert(node.type === 'commonNode', 'type is commonNode for common entity');
  assert(node.position.x === 42, 'position.x from _position.x');
  assert(node.position.y === 99, 'position.y from _position.y');
  assert(node.data.entity === entity, 'data.entity is same reference');
  assert(node.data.entityType === 'common', 'data.entityType is common');
})();

// Choice
(() => {
  const entity = makeChoice({ id: 'choice_xyz_5678', _position: { x: 200, y: 400 } });
  const node = buildNode(entity, 'choice');

  assert(node.id === 'choice_xyz_5678', 'choice id matches');
  assert(node.type === 'choiceNode', 'type is choiceNode');
  assert(node.position.x === 200, 'choice position.x correct');
  assert(node.data.entityType === 'choice', 'data.entityType is choice');
})();

// Ending
(() => {
  const entity = makeEnding({ id: 'ending_end_9999', _position: { x: 600, y: 0 } });
  const node = buildNode(entity, 'ending');

  assert(node.id === 'ending_end_9999', 'ending id matches');
  assert(node.type === 'endingNode', 'type is endingNode');
  assert(node.position.y === 0, 'ending position.y is 0');
  assert(node.data.entityType === 'ending', 'data.entityType is ending');
})();


// ════════════════════════════════════════════════════════════
//  SECTION C — buildNode — Edge Cases
// ════════════════════════════════════════════════════════════

group('buildNode — Edge Cases');

// Missing _position defaults to { x: 0, y: 0 }
(() => {
  const entity = { id: 'node_no_pos', name: 'no_pos' };
  const node = buildNode(entity, 'common');

  assert(node.position.x === 0, 'missing _position.x defaults to 0');
  assert(node.position.y === 0, 'missing _position.y defaults to 0');
})();

// _position is null
(() => {
  const entity = { id: 'node_null_pos', name: 'null_pos', _position: null };
  const node = buildNode(entity, 'common');

  assert(node.position.x === 0, 'null _position.x defaults to 0');
  assert(node.position.y === 0, 'null _position.y defaults to 0');
})();

// _position with partial fields
(() => {
  const entity = { id: 'node_partial', name: 'partial', _position: { x: 50 } };
  const node = buildNode(entity, 'common');

  assert(node.position.x === 50, 'partial _position.x preserved');
  assert(node.position.y === 0, 'missing _position.y defaults to 0');
})();

// Negative coordinates
(() => {
  const entity = makeCommonNode({ _position: { x: -100, y: -200 } });
  const node = buildNode(entity, 'common');

  assert(node.position.x === -100, 'negative x preserved');
  assert(node.position.y === -200, 'negative y preserved');
})();

// Zero coordinates
(() => {
  const entity = makeCommonNode({ _position: { x: 0, y: 0 } });
  const node = buildNode(entity, 'common');

  assert(node.position.x === 0, 'zero x preserved');
  assert(node.position.y === 0, 'zero y preserved');
})();


// ════════════════════════════════════════════════════════════
//  SECTION D — buildEdgesFromCommonNode — Happy Path
// ════════════════════════════════════════════════════════════

group('buildEdgesFromCommonNode — Happy Path');

// Single next entry
(() => {
  const node = makeCommonNode({
    id: 'node_src_0001',
    next: [makeNextEntry({ id: 'route_1_aaaa', target: 'node_tgt_0002' })],
  });
  const edges = buildEdgesFromCommonNode(node);

  assert(edges.length === 1, 'one edge produced for one next entry');
  assert(edges[0].id === 'edge-node_src_0001-route_1_aaaa', 'edge id format correct');
  assert(edges[0].source === 'node_src_0001', 'source is node id');
  assert(edges[0].target === 'node_tgt_0002', 'target from next entry');
  assert(edges[0].data.nextEntryId === 'route_1_aaaa', 'data.nextEntryId preserved');
  assert(edges[0].data.sourceEntityType === 'common', 'data.sourceEntityType is common');
  assert(edges[0].data.requires.operator === 'and', 'data.requires preserved');
})();

// Multiple next entries
(() => {
  const node = makeCommonNode({
    id: 'node_multi',
    next: [
      makeNextEntry({ id: 'r1', target: 'node_a' }),
      makeNextEntry({ id: 'r2', target: 'choice_b' }),
      makeNextEntry({ id: 'r3', target: 'ending_c' }),
    ],
  });
  const edges = buildEdgesFromCommonNode(node);

  assert(edges.length === 3, 'three edges for three next entries');
  assert(edges[0].target === 'node_a', 'first edge target correct');
  assert(edges[1].target === 'choice_b', 'second edge target correct');
  assert(edges[2].target === 'ending_c', 'third edge target correct');
})();

// Next entries with conditions
(() => {
  const condGroup = {
    operator: 'or',
    conditions: [{ id: 'c1', flag: 'F001', state: true }],
  };
  const node = makeCommonNode({
    id: 'node_cond',
    next: [makeNextEntry({ id: 'r1', target: 'node_x', requires: condGroup })],
  });
  const edges = buildEdgesFromCommonNode(node);

  assert(edges[0].data.requires.operator === 'or', 'conditional requires preserved');
  assert(edges[0].data.requires.conditions.length === 1, 'conditions array preserved');
})();


// ════════════════════════════════════════════════════════════
//  SECTION E — buildEdgesFromCommonNode — Edge Cases
// ════════════════════════════════════════════════════════════

group('buildEdgesFromCommonNode — Edge Cases');

// Empty next array
(() => {
  const node = makeCommonNode({ id: 'node_empty', next: [] });
  const edges = buildEdgesFromCommonNode(node);

  assert(edges.length === 0, 'empty next → 0 edges');
  assert(Array.isArray(edges), 'returns an array');
})();

// Self-referencing next entry (node points to itself)
(() => {
  const node = makeCommonNode({
    id: 'node_self',
    next: [makeNextEntry({ id: 'r_self', target: 'node_self' })],
  });
  const edges = buildEdgesFromCommonNode(node);

  assert(edges.length === 1, 'self-reference produces an edge');
  assert(edges[0].source === edges[0].target, 'source equals target for self-reference');
})();


// ════════════════════════════════════════════════════════════
//  SECTION F — buildEdgesFromChoice — Happy Path
// ════════════════════════════════════════════════════════════

group('buildEdgesFromChoice — Happy Path');

// Single option with single next
(() => {
  const choice = makeChoice({
    id: 'choice_src_001',
    options: [
      makeOption({
        id: 'opt_a',
        label: 'Go left',
        next: [makeNextEntry({ id: 'r_opt_1', target: 'node_dest_001' })],
      }),
    ],
  });
  const edges = buildEdgesFromChoice(choice);

  assert(edges.length === 1, 'one edge from one option with one next');
  assert(edges[0].id === 'edge-choice_src_001-opt_a-r_opt_1', 'choice edge id format has 4 parts');
  assert(edges[0].source === 'choice_src_001', 'source is choice id');
  assert(edges[0].target === 'node_dest_001', 'target from option next');
  assert(edges[0].data.optionId === 'opt_a', 'data.optionId preserved');
  assert(edges[0].data.nextEntryId === 'r_opt_1', 'data.nextEntryId preserved');
  assert(edges[0].data.sourceEntityType === 'choice', 'data.sourceEntityType is choice');
  assert(edges[0].data.optionLabel === 'Go left', 'data.optionLabel preserved');
})();

// Multiple options with multiple nexts
(() => {
  const choice = makeChoice({
    id: 'ch_multi',
    options: [
      makeOption({
        id: 'opt_1',
        label: 'Left',
        next: [
          makeNextEntry({ id: 'r1', target: 'node_a' }),
          makeNextEntry({ id: 'r2', target: 'node_b' }),
        ],
      }),
      makeOption({
        id: 'opt_2',
        label: 'Right',
        next: [
          makeNextEntry({ id: 'r3', target: 'ending_x' }),
        ],
      }),
    ],
  });
  const edges = buildEdgesFromChoice(choice);

  assert(edges.length === 3, 'total 3 edges: 2 from opt_1, 1 from opt_2');
  assert(edges[0].data.optionId === 'opt_1', 'first edge from opt_1');
  assert(edges[1].data.optionId === 'opt_1', 'second edge from opt_1');
  assert(edges[2].data.optionId === 'opt_2', 'third edge from opt_2');
  assert(edges[2].data.optionLabel === 'Right', 'third edge label is Right');
})();


// ════════════════════════════════════════════════════════════
//  SECTION G — buildEdgesFromChoice — Edge Cases
// ════════════════════════════════════════════════════════════

group('buildEdgesFromChoice — Edge Cases');

// Choice with no options
(() => {
  const choice = makeChoice({ id: 'ch_empty', options: [] });
  const edges = buildEdgesFromChoice(choice);

  assert(edges.length === 0, 'no options → 0 edges');
})();

// Option with empty next array
(() => {
  const choice = makeChoice({
    id: 'ch_opt_empty',
    options: [makeOption({ id: 'opt_x', next: [] })],
  });
  const edges = buildEdgesFromChoice(choice);

  assert(edges.length === 0, 'option with empty next → 0 edges');
})();

// Multiple options, some with no next
(() => {
  const choice = makeChoice({
    id: 'ch_mixed',
    options: [
      makeOption({ id: 'opt_a', next: [] }),
      makeOption({
        id: 'opt_b',
        next: [makeNextEntry({ id: 'r1', target: 'node_z' })],
      }),
      makeOption({ id: 'opt_c', next: [] }),
    ],
  });
  const edges = buildEdgesFromChoice(choice);

  assert(edges.length === 1, 'only opt_b produces an edge');
  assert(edges[0].data.optionId === 'opt_b', 'edge from opt_b');
})();


// ════════════════════════════════════════════════════════════
//  SECTION H — getEntityTypeByPrefix
// ════════════════════════════════════════════════════════════

group('getEntityTypeByPrefix — Entity type from ID prefix');

(() => {
  assert(getEntityTypeByPrefix('node_1234567890_ab12') === 'common', 'node_ prefix → common');
  assert(getEntityTypeByPrefix('node_') === 'common', 'bare node_ prefix → common');
  assert(getEntityTypeByPrefix('choice_1234567890_cd34') === 'choice', 'choice_ prefix → choice');
  assert(getEntityTypeByPrefix('choice_') === 'choice', 'bare choice_ prefix → choice');
  assert(getEntityTypeByPrefix('ending_1234567890_ef56') === 'ending', 'ending_ prefix → ending');
  assert(getEntityTypeByPrefix('ending_') === 'ending', 'bare ending_ prefix → ending');
})();

// Edge cases
(() => {
  assert(getEntityTypeByPrefix(null) === null, 'null → null');
  assert(getEntityTypeByPrefix('') === null, 'empty string → null');
  assert(getEntityTypeByPrefix('unknown_123') === null, 'unknown prefix → null');
  assert(getEntityTypeByPrefix('NODE_123') === null, 'uppercase NODE_ → null (case-sensitive)');
  assert(getEntityTypeByPrefix('flag_123') === null, 'flag_ prefix → null (flags are not graph nodes)');
  assert(getEntityTypeByPrefix('status_123') === null, 'status_ prefix → null (status are not graph nodes)');
  assert(getEntityTypeByPrefix('path_123') === null, 'path_ prefix → null (paths are not graph nodes)');
  assert(getEntityTypeByPrefix('chapter_123') === null, 'chapter_ prefix → null (chapters are not graph nodes)');
})();


// ════════════════════════════════════════════════════════════
//  SECTION I — Edge ID Parsing (for removal logic)
// ════════════════════════════════════════════════════════════

group('Edge ID Parsing — for useGraphCallbacks removal logic');

// Simulates the edge ID parsing from onEdgesChange in useGraphCallbacks.js

function parseEdgeId(edgeId) {
  const parts = edgeId.split('-');
  if (parts.length < 3) return null;
  // parts[0] is always 'edge'
  // For common: edge-{sourceId}-{nextEntryId} → sourceId may contain underscores
  // For choice: edge-{sourceId}-{optionId}-{nextEntryId}
  // Since IDs use underscores, splitting on '-' is safe.
  // But sourceId etc. are separated by the FIRST hyphens only in the 'edge-' prefix.
  // Actually the format is: "edge" + "-" + sourceId + "-" + rest
  // Since entity IDs contain underscores not hyphens, splitting on '-' is safe.
  return {
    prefix: parts[0],
    sourceId: parts[1],
    rest: parts.slice(2).join('-'),
  };
}

// Common node edge ID
(() => {
  const edgeId = 'edge-node_src_0001-route_1_aaaa';
  const parsed = parseEdgeId(edgeId);

  assert(parsed.prefix === 'edge', 'prefix is edge');
  assert(parsed.sourceId === 'node_src_0001', 'sourceId extracted');
  assert(parsed.rest === 'route_1_aaaa', 'rest is the next entry id');
})();

// Wait — splitting on '-' breaks entity IDs that contain underscores not hyphens.
// Let me verify: entity IDs are like `node_1234567890_ab12` — no hyphens.
// But the edge ID is `edge-node_src_0001-route_1_aaaa` — hyphens separate the parts.
// Splitting on '-' would give: ['edge', 'node_src_0001', 'route_1_aaaa']
// WRONG — it would actually give: ['edge', 'node_src_0001', 'route_1_aaaa']
// Only if there are no hyphens in the IDs themselves. Let's verify the actual
// edge ID construction matches the split logic.

// Actually, looking more carefully: IDs use underscores, the edge template uses hyphens.
// So `edge-node_src_0001-route_1_aaaa`.split('-') gives:
// ['edge', 'node_src_0001', 'route_1_aaaa']
// Wait no — underscores are NOT hyphens so won't be split. This is correct.
// Let me verify with an actual example.
(() => {
  const edgeId = 'edge-node_1234567890_ab12-route_999_zz99';
  const parts = edgeId.split('-');

  assert(parts[0] === 'edge', 'split: first part is edge');
  assert(parts[1] === 'node_1234567890_ab12', 'split: second part is source entity ID (underscores intact)');
  assert(parts[2] === 'route_999_zz99', 'split: third part is next entry ID (underscores intact)');
  assert(parts.length === 3, 'common node edge splits into exactly 3 parts');
})();

// Choice edge ID (4 parts)
(() => {
  const edgeId = 'edge-choice_111_aa-opt_222_bb-route_333_cc';
  const parts = edgeId.split('-');

  assert(parts.length === 4, 'choice edge splits into 4 parts');
  assert(parts[0] === 'edge', 'prefix');
  assert(parts[1] === 'choice_111_aa', 'source choice ID');
  assert(parts[2] === 'opt_222_bb', 'option ID');
  assert(parts[3] === 'route_333_cc', 'next entry ID');
})();


// ════════════════════════════════════════════════════════════
//  SECTION J — Data Integrity — React Flow node shape
// ════════════════════════════════════════════════════════════

group('Data Integrity — React Flow node shape matches requirements');

// React Flow expects: { id, type, position: { x, y }, data }
(() => {
  const entity = makeCommonNode({ id: 'node_test_int', _position: { x: 10, y: 20 } });
  const node = buildNode(entity, 'common');

  assert(typeof node.id === 'string', 'node.id is string');
  assert(typeof node.type === 'string', 'node.type is string');
  assert(typeof node.position === 'object', 'node.position is object');
  assert(typeof node.position.x === 'number', 'node.position.x is number');
  assert(typeof node.position.y === 'number', 'node.position.y is number');
  assert(typeof node.data === 'object', 'node.data is object');
  assert(node.data.entity !== undefined, 'node.data.entity exists');
  assert(node.data.entityType !== undefined, 'node.data.entityType exists');
})();

// React Flow expects: { id, source, target, data? }
(() => {
  const node = makeCommonNode({
    id: 'node_edge_test',
    next: [makeNextEntry({ id: 'r1', target: 'node_b' })],
  });
  const edges = buildEdgesFromCommonNode(node);
  const edge = edges[0];

  assert(typeof edge.id === 'string', 'edge.id is string');
  assert(typeof edge.source === 'string', 'edge.source is string');
  assert(typeof edge.target === 'string', 'edge.target is string');
  assert(typeof edge.data === 'object', 'edge.data is object');
})();


// ════════════════════════════════════════════════════════════
//  SECTION K — Data Integrity — Edge IDs are unique
// ════════════════════════════════════════════════════════════

group('Data Integrity — Edge ID uniqueness');

// Multiple next entries from same source produce unique edge IDs
(() => {
  const node = makeCommonNode({
    id: 'node_uniq',
    next: [
      makeNextEntry({ id: 'r1', target: 'node_a' }),
      makeNextEntry({ id: 'r2', target: 'node_b' }),
      makeNextEntry({ id: 'r3', target: 'node_a' }), // same target, different entry
    ],
  });
  const edges = buildEdgesFromCommonNode(node);
  const ids = edges.map((e) => e.id);
  const uniqueIds = new Set(ids);

  assert(uniqueIds.size === 3, 'all edge IDs are unique even with repeated targets');
})();

// Choice edges across different options produce unique IDs
(() => {
  const choice = makeChoice({
    id: 'ch_uniq',
    options: [
      makeOption({
        id: 'opt_a',
        next: [makeNextEntry({ id: 'r1', target: 'node_x' })],
      }),
      makeOption({
        id: 'opt_b',
        next: [makeNextEntry({ id: 'r1', target: 'node_x' })], // same entry ID + target
      }),
    ],
  });
  const edges = buildEdgesFromChoice(choice);
  const ids = edges.map((e) => e.id);
  const uniqueIds = new Set(ids);

  assert(uniqueIds.size === 2, 'choice edge IDs unique even with same next entry ID across options');
})();


// ════════════════════════════════════════════════════════════
//  SECTION L — Full graph sync simulation
// ════════════════════════════════════════════════════════════

group('Full graph sync simulation — store-like data → nodes + edges');

// Simulates what useGraphSync does without React hooks
function graphSync(common, choice, ending) {
  const nodes = [];
  for (const n of Object.values(common)) nodes.push(buildNode(n, 'common'));
  for (const c of Object.values(choice)) nodes.push(buildNode(c, 'choice'));
  for (const e of Object.values(ending)) nodes.push(buildNode(e, 'ending'));

  const edges = [];
  for (const n of Object.values(common)) edges.push(...buildEdgesFromCommonNode(n));
  for (const c of Object.values(choice)) edges.push(...buildEdgesFromChoice(c));

  return { nodes, edges };
}

// Empty store
(() => {
  const { nodes, edges } = graphSync({}, {}, {});

  assert(nodes.length === 0, 'empty store → 0 nodes');
  assert(edges.length === 0, 'empty store → 0 edges');
})();

// Minimal: one common node, no connections
(() => {
  const common = {
    N001: makeCommonNode({ id: 'N001', name: 'start', _position: { x: 0, y: 0 } }),
  };
  const { nodes, edges } = graphSync(common, {}, {});

  assert(nodes.length === 1, 'one node');
  assert(edges.length === 0, 'no edges');
  assert(nodes[0].type === 'commonNode', 'node type is commonNode');
})();

// Connected: N001 → CH001 → E001
(() => {
  const common = {
    N001: makeCommonNode({
      id: 'N001', name: 'start',
      next: [makeNextEntry({ id: 'r1', target: 'CH001' })],
    }),
  };
  const choice = {
    CH001: makeChoice({
      id: 'CH001', text: 'Choose',
      options: [makeOption({
        id: 'opt1', label: 'Go',
        next: [makeNextEntry({ id: 'r2', target: 'E001' })],
      })],
    }),
  };
  const ending = {
    E001: makeEnding({ id: 'E001', name: 'the_end' }),
  };
  const { nodes, edges } = graphSync(common, choice, ending);

  assert(nodes.length === 3, 'three nodes total');
  assert(edges.length === 2, 'two edges: N001→CH001, CH001→E001');

  const nodeTypes = nodes.map((n) => n.type).sort();
  assert(nodeTypes[0] === 'choiceNode', 'has choiceNode');
  assert(nodeTypes[1] === 'commonNode', 'has commonNode');
  assert(nodeTypes[2] === 'endingNode', 'has endingNode');

  // Verify edge sources and targets
  const e1 = edges.find((e) => e.source === 'N001');
  assert(e1 !== undefined, 'edge from N001 exists');
  assert(e1.target === 'CH001', 'N001 edge targets CH001');

  const e2 = edges.find((e) => e.source === 'CH001');
  assert(e2 !== undefined, 'edge from CH001 exists');
  assert(e2.target === 'E001', 'CH001 edge targets E001');
})();

// Large graph: 10 nodes in a chain
(() => {
  const common = {};
  for (let i = 1; i <= 10; i++) {
    const id = `node_${i}`;
    const next = i < 10
      ? [makeNextEntry({ id: `r_${i}`, target: `node_${i + 1}` })]
      : [];
    common[id] = makeCommonNode({ id, name: `node_${i}`, next });
  }
  const { nodes, edges } = graphSync(common, {}, {});

  assert(nodes.length === 10, '10 nodes in chain');
  assert(edges.length === 9, '9 edges connecting 10 nodes');
})();


// ════════════════════════════════════════════════════════════
//  SECTION M — Failure Cases
// ════════════════════════════════════════════════════════════

group('Failure Cases — defensive behavior');

// buildEdgesFromCommonNode with node missing `next` field
(() => {
  let threw = false;
  try {
    buildEdgesFromCommonNode({ id: 'node_no_next' });
  } catch {
    threw = true;
  }
  assert(threw, 'buildEdgesFromCommonNode throws when next is missing (runtime safety check)');
})();

// buildEdgesFromChoice with choice missing `options` field
(() => {
  let threw = false;
  try {
    buildEdgesFromChoice({ id: 'ch_no_opts' });
  } catch {
    threw = true;
  }
  assert(threw, 'buildEdgesFromChoice throws when options is missing');
})();

// buildNode with entity missing `id` still produces a node (but with undefined id)
(() => {
  const node = buildNode({ name: 'no_id' }, 'common');
  assert(node.id === undefined, 'missing entity id results in undefined node id');
  assert(node.type === 'commonNode', 'type still set correctly');
})();


// ════════════════════════════════════════════════════════════
//  SECTION N — Data Model Compliance (Plan §4)
// ════════════════════════════════════════════════════════════

group('Data Model Compliance — Plan §4');

// Verify that buildNode preserves all entity fields in data.entity
(() => {
  const entity = makeCommonNode({
    id: 'N001', name: 'start', type: 'interaction',
    chapter: 'C001', path: 'P001', description: 'Beginning',
    variants: [{ id: 'v1', requires: { operator: 'and', conditions: [] }, text: 'alt' }],
    requires: { operator: 'or', conditions: [{ id: 'c1', flag: 'F001', state: true }] },
    flags_set: ['F001'],
    status_set: [{ status: 'SP001', amount: 5 }],
    next: [{ id: 'ne1', target: 'N002', requires: { operator: 'and', conditions: [] } }],
    _position: { x: 100, y: 200 },
  });
  const node = buildNode(entity, 'common');
  const d = node.data.entity;

  assert(d.id === 'N001', '§4: id preserved');
  assert(d.name === 'start', '§4: name preserved');
  assert(d.type === 'interaction', '§4: type preserved');
  assert(d.chapter === 'C001', '§4: chapter preserved');
  assert(d.path === 'P001', '§4: path preserved');
  assert(d.description === 'Beginning', '§4: description preserved');
  assert(d.variants.length === 1, '§4: variants preserved');
  assert(d.requires.operator === 'or', '§4: requires preserved');
  assert(d.flags_set.length === 1, '§4: flags_set preserved');
  assert(d.status_set.length === 1, '§4: status_set preserved');
  assert(d.next.length === 1, '§4: next preserved');
  assert(d._position.x === 100, '§4: _position preserved (AR-10)');
})();

// Verify edge data carries condition group (for future Phase 7/10 edge rendering)
(() => {
  const condGroup = {
    operator: 'and',
    conditions: [{ id: 'c1', flag: 'F001', state: true }],
  };
  const node = makeCommonNode({
    id: 'N001',
    next: [makeNextEntry({ id: 'r1', target: 'N002', requires: condGroup })],
  });
  const edges = buildEdgesFromCommonNode(node);

  assert(edges[0].data.requires.operator === 'and', '§4: edge carries requires condition group');
  assert(edges[0].data.requires.conditions.length === 1, '§4: edge conditions array preserved');
  assert(edges[0].data.requires.conditions[0].flag === 'F001', '§4: flag condition reference preserved');
})();


// ════════════════════════════════════════════════════════════
//  Summary
// ════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(60)}`);
console.log(`  SUMMARY: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));

if (failed > 0) {
  process.exit(1);
}
