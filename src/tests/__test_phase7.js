// ============================================================
// Phase 7 — Custom Node Renderers — Test Suite
// ============================================================
// Run: node src/tests/__test_phase7.js
// Each test prints PASS or FAIL with a description.
// Final summary: X passed, Y failed.
//
// Tests cover:
//   - statusModifier (Common, Choice, Ending variants)
//   - resolveTagNames helper
//   - getEdgeStateClass logic
//   - Updated edge data shape (type: 'conditional', sourceNodeId)
//   - Edge ID parsing for source node extraction
//   - Data integrity against Plan §4 data model
//   - Edge cases: null/undefined/empty inputs
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

// ── Inline copies of pure logic functions from Phase 7 ──────
// These are module-internal, so we re-implement them for testability.

// From CommonNodeRenderer.jsx
function statusModifierCommon(status) {
  switch (status) {
    case 'active': return 'common-node--active';
    case 'locked': return 'common-node--locked';
    case 'complete': return 'common-node--complete';
    case 'failed': return 'common-node--failed';
    case 'branch_locked': return 'common-node--branch-locked';
    default: return '';
  }
}

// From ChoiceNodeRenderer.jsx
function statusModifierChoice(status) {
  switch (status) {
    case 'active': return 'choice-node--active';
    case 'locked': return 'choice-node--locked';
    case 'complete': return 'choice-node--complete';
    case 'failed': return 'choice-node--failed';
    case 'branch_locked': return 'choice-node--branch-locked';
    default: return '';
  }
}

// From EndingNodeRenderer.jsx
function statusModifierEnding(status) {
  switch (status) {
    case 'active': return 'ending-node--active';
    case 'locked': return 'ending-node--locked';
    case 'complete': return 'ending-node--complete';
    case 'failed': return 'ending-node--failed';
    case 'branch_locked': return 'ending-node--branch-locked';
    default: return '';
  }
}

// From CommonNodeRenderer.jsx
function resolveTagNames(chapterId, pathId, chapterMap, pathMap) {
  const chapterName = chapterId ? (chapterMap[chapterId]?.name || chapterId) : null;
  const pathName = pathId ? (pathMap[pathId]?.name || pathId) : null;
  return { chapterName, pathName };
}

// From ConditionalEdge.jsx
function getEdgeStateClass(evalResult, isSourceActive) {
  if (isSourceActive && evalResult !== false) {
    return 'conditional-edge__path--glow';
  }
  if (evalResult === true) {
    return 'conditional-edge__path--pass';
  }
  if (evalResult === false) {
    return 'conditional-edge__path--fail';
  }
  return 'conditional-edge__path--default';
}

// Updated edge builders from useGraphSync.js (Phase 7 changes)
function buildEdgesFromCommonNode(node) {
  return node.next.map((entry) => ({
    id: `edge-${node.id}-${entry.id}`,
    source: node.id,
    target: entry.target,
    type: 'conditional',
    data: {
      nextEntryId: entry.id,
      sourceEntityType: 'common',
      sourceNodeId: node.id,
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
        type: 'conditional',
        data: {
          nextEntryId: entry.id,
          optionId: option.id,
          sourceEntityType: 'choice',
          sourceNodeId: choice.id,
          requires: entry.requires,
          optionLabel: option.label,
        },
      });
    }
  }
  return edges;
}

// ── Test Fixtures ───────────────────────────────────────────

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
    type: 'type' in overrides ? overrides.type : 'good_end',
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    _position: overrides._position ?? { x: 500, y: 200 },
  };
}


// ════════════════════════════════════════════════════════════
//  SECTION A — statusModifierCommon
// ════════════════════════════════════════════════════════════

group('statusModifierCommon — CSS class from simulation status');

(() => {
  // Happy path: all known statuses
  assert(statusModifierCommon('active') === 'common-node--active', 'active → common-node--active');
  assert(statusModifierCommon('locked') === 'common-node--locked', 'locked → common-node--locked');
  assert(statusModifierCommon('complete') === 'common-node--complete', 'complete → common-node--complete');
  assert(statusModifierCommon('failed') === 'common-node--failed', 'failed → common-node--failed');
  assert(statusModifierCommon('branch_locked') === 'common-node--branch-locked', 'branch_locked → common-node--branch-locked');

  // Default/edge cases
  assert(statusModifierCommon('default') === '', 'default → empty string');
  assert(statusModifierCommon('') === '', 'empty string → empty string');
  assert(statusModifierCommon(null) === '', 'null → empty string');
  assert(statusModifierCommon(undefined) === '', 'undefined → empty string');
  assert(statusModifierCommon('ACTIVE') === '', 'uppercase ACTIVE → empty (case-sensitive)');
  assert(statusModifierCommon('inactive') === '', 'unknown status → empty string');
})();


// ════════════════════════════════════════════════════════════
//  SECTION B — statusModifierChoice
// ════════════════════════════════════════════════════════════

group('statusModifierChoice — CSS class from simulation status');

(() => {
  assert(statusModifierChoice('active') === 'choice-node--active', 'active → choice-node--active');
  assert(statusModifierChoice('locked') === 'choice-node--locked', 'locked → choice-node--locked');
  assert(statusModifierChoice('complete') === 'choice-node--complete', 'complete → choice-node--complete');
  assert(statusModifierChoice('failed') === 'choice-node--failed', 'failed → choice-node--failed');
  assert(statusModifierChoice('branch_locked') === 'choice-node--branch-locked', 'branch_locked → choice-node--branch-locked');

  // Default/edge cases
  assert(statusModifierChoice('default') === '', 'default → empty string');
  assert(statusModifierChoice(null) === '', 'null → empty string');
  assert(statusModifierChoice(undefined) === '', 'undefined → empty string');
})();


// ════════════════════════════════════════════════════════════
//  SECTION C — statusModifierEnding
// ════════════════════════════════════════════════════════════

group('statusModifierEnding — CSS class from simulation status');

(() => {
  assert(statusModifierEnding('active') === 'ending-node--active', 'active → ending-node--active');
  assert(statusModifierEnding('locked') === 'ending-node--locked', 'locked → ending-node--locked');
  assert(statusModifierEnding('complete') === 'ending-node--complete', 'complete → ending-node--complete');
  assert(statusModifierEnding('failed') === 'ending-node--failed', 'failed → ending-node--failed');
  assert(statusModifierEnding('branch_locked') === 'ending-node--branch-locked', 'branch_locked → ending-node--branch-locked');

  // Default/edge cases
  assert(statusModifierEnding('default') === '', 'default → empty string');
  assert(statusModifierEnding(null) === '', 'null → empty string');
  assert(statusModifierEnding(undefined) === '', 'undefined → empty string');
})();


// ════════════════════════════════════════════════════════════
//  SECTION D — statusModifier consistency across all types
// ════════════════════════════════════════════════════════════

group('statusModifier — consistency across Common/Choice/Ending');

(() => {
  const statuses = ['active', 'locked', 'complete', 'failed', 'branch_locked'];
  const prefixes = { common: 'common-node', choice: 'choice-node', ending: 'ending-node' };
  const fns = { common: statusModifierCommon, choice: statusModifierChoice, ending: statusModifierEnding };

  for (const status of statuses) {
    for (const [type, fn] of Object.entries(fns)) {
      const result = fn(status);
      const expectedSuffix = status === 'branch_locked' ? 'branch-locked' : status;
      const expected = `${prefixes[type]}--${expectedSuffix}`;
      assert(result === expected, `${type} + ${status} → ${expected}`);
    }
  }

  // All return empty string for unknown statuses
  for (const [type, fn] of Object.entries(fns)) {
    assert(fn('unknown') === '', `${type} returns empty for unknown status`);
    assert(fn('') === '', `${type} returns empty for empty string`);
  }
})();


// ════════════════════════════════════════════════════════════
//  SECTION E — resolveTagNames — Happy Path
// ════════════════════════════════════════════════════════════

group('resolveTagNames — Happy Path');

(() => {
  const chapterMap = {
    C001: { id: 'C001', name: 'prologue' },
    C002: { id: 'C002', name: 'act_one' },
  };
  const pathMap = {
    P001: { id: 'P001', name: 'main_route' },
    P002: { id: 'P002', name: 'hidden_path' },
  };

  // Both chapter and path present
  const r1 = resolveTagNames('C001', 'P001', chapterMap, pathMap);
  assert(r1.chapterName === 'prologue', 'chapter C001 resolves to "prologue"');
  assert(r1.pathName === 'main_route', 'path P001 resolves to "main_route"');

  // Only chapter, no path
  const r2 = resolveTagNames('C002', null, chapterMap, pathMap);
  assert(r2.chapterName === 'act_one', 'chapter C002 resolves to "act_one"');
  assert(r2.pathName === null, 'null pathId → null pathName');

  // Only path, no chapter
  const r3 = resolveTagNames(null, 'P002', chapterMap, pathMap);
  assert(r3.chapterName === null, 'null chapterId → null chapterName');
  assert(r3.pathName === 'hidden_path', 'path P002 resolves to "hidden_path"');

  // Both null
  const r4 = resolveTagNames(null, null, chapterMap, pathMap);
  assert(r4.chapterName === null, 'both null → chapterName null');
  assert(r4.pathName === null, 'both null → pathName null');
})();


// ════════════════════════════════════════════════════════════
//  SECTION F — resolveTagNames — Edge Cases
// ════════════════════════════════════════════════════════════

group('resolveTagNames — Edge Cases');

(() => {
  const chapterMap = { C001: { id: 'C001', name: 'prologue' } };
  const pathMap = { P001: { id: 'P001', name: 'main_route' } };

  // Chapter ID not found in map → falls back to raw ID
  const r1 = resolveTagNames('C_UNKNOWN', null, chapterMap, pathMap);
  assert(r1.chapterName === 'C_UNKNOWN', 'unknown chapter ID → falls back to raw ID string');

  // Path ID not found in map → falls back to raw ID
  const r2 = resolveTagNames(null, 'P_UNKNOWN', chapterMap, pathMap);
  assert(r2.pathName === 'P_UNKNOWN', 'unknown path ID → falls back to raw ID string');

  // Empty string IDs — empty string is falsy, treated as "no chapter/path"
  const r3 = resolveTagNames('', '', chapterMap, pathMap);
  assert(r3.chapterName === null, 'empty string chapterId → null');
  assert(r3.pathName === null, 'empty string pathId → null');

  // Empty maps
  const r4 = resolveTagNames('C001', 'P001', {}, {});
  assert(r4.chapterName === 'C001', 'empty chapterMap → falls back to raw ID');
  assert(r4.pathName === 'P001', 'empty pathMap → falls back to raw ID');

  // Chapter/path entities have empty name → falls back to raw ID (empty string is falsy)
  const emptyNameMap = { C001: { id: 'C001', name: '' } };
  const r5 = resolveTagNames('C001', null, emptyNameMap, pathMap);
  assert(r5.chapterName === 'C001', 'entity with empty name → falls back to raw ID');
})();


// ════════════════════════════════════════════════════════════
//  SECTION G — getEdgeStateClass — Happy Path
// ════════════════════════════════════════════════════════════

group('getEdgeStateClass — Happy Path');

(() => {
  // Source active + conditions pass → glow
  assert(
    getEdgeStateClass(true, true) === 'conditional-edge__path--glow',
    'evalResult=true, isSourceActive=true → glow'
  );

  // Source active + no evaluation (undefined) → glow (evalResult !== false)
  assert(
    getEdgeStateClass(undefined, true) === 'conditional-edge__path--glow',
    'evalResult=undefined, isSourceActive=true → glow'
  );

  // Source active + conditions fail → NOT glow (evalResult === false is checked)
  assert(
    getEdgeStateClass(false, true) !== 'conditional-edge__path--glow',
    'evalResult=false, isSourceActive=true → NOT glow'
  );

  // Conditions pass, source not active → pass
  assert(
    getEdgeStateClass(true, false) === 'conditional-edge__path--pass',
    'evalResult=true, isSourceActive=false → pass'
  );

  // Conditions fail → fail
  assert(
    getEdgeStateClass(false, false) === 'conditional-edge__path--fail',
    'evalResult=false, isSourceActive=false → fail'
  );

  // No evaluation data → default
  assert(
    getEdgeStateClass(undefined, false) === 'conditional-edge__path--default',
    'evalResult=undefined, isSourceActive=false → default'
  );

  // Null evaluation → default (null !== false, null !== true)
  assert(
    getEdgeStateClass(null, false) === 'conditional-edge__path--default',
    'evalResult=null, isSourceActive=false → default'
  );
})();


// ════════════════════════════════════════════════════════════
//  SECTION H — getEdgeStateClass — Priority Order
// ════════════════════════════════════════════════════════════

group('getEdgeStateClass — Priority (glow > pass > fail > default)');

(() => {
  // Priority 1: glow beats pass when source is active
  assert(
    getEdgeStateClass(true, true) === 'conditional-edge__path--glow',
    'glow wins over pass when source active + conditions pass'
  );

  // Priority: fail beats glow when source is active but conditions fail
  // (glow requires evalResult !== false)
  assert(
    getEdgeStateClass(false, true) === 'conditional-edge__path--fail',
    'fail beats glow when conditions explicitly false even with active source'
  );

  // Priority: pass only when source NOT active and eval is true
  assert(
    getEdgeStateClass(true, false) === 'conditional-edge__path--pass',
    'pass when source inactive + eval true'
  );

  // Default only when no eval data and source not active
  assert(
    getEdgeStateClass(undefined, false) === 'conditional-edge__path--default',
    'default when no eval + source inactive'
  );
})();


// ════════════════════════════════════════════════════════════
//  SECTION I — getEdgeStateClass — Edge Cases
// ════════════════════════════════════════════════════════════

group('getEdgeStateClass — Edge Cases');

(() => {
  // Numeric 0 is falsy but NOT false — should be treated as default (non-boolean)
  assert(
    getEdgeStateClass(0, false) === 'conditional-edge__path--default',
    'evalResult=0 (falsy non-false) → default'
  );

  // Numeric 1 is truthy but NOT true — passes first isSourceActive check as !== false
  assert(
    getEdgeStateClass(1, true) === 'conditional-edge__path--glow',
    'evalResult=1 (truthy), isSourceActive=true → glow (1 !== false)'
  );

  // String 'true' is truthy but !== true
  assert(
    getEdgeStateClass('true', false) === 'conditional-edge__path--default',
    'evalResult="true" (string, not boolean) → default'
  );

  // Both false
  assert(
    getEdgeStateClass(false, false) === 'conditional-edge__path--fail',
    'evalResult=false, isSourceActive=false → fail'
  );
})();


// ════════════════════════════════════════════════════════════
//  SECTION J — Updated Edge Builders — type: 'conditional'
// ════════════════════════════════════════════════════════════

group('buildEdgesFromCommonNode — Phase 7 additions (type + sourceNodeId)');

(() => {
  const node = makeCommonNode({
    id: 'node_src_001',
    next: [
      makeNextEntry({ id: 'r1', target: 'node_tgt_002' }),
      makeNextEntry({ id: 'r2', target: 'choice_tgt_003' }),
    ],
  });
  const edges = buildEdgesFromCommonNode(node);

  // type: 'conditional' on all edges
  assert(edges[0].type === 'conditional', 'first edge has type: conditional');
  assert(edges[1].type === 'conditional', 'second edge has type: conditional');

  // sourceNodeId in data
  assert(edges[0].data.sourceNodeId === 'node_src_001', 'first edge data.sourceNodeId matches source');
  assert(edges[1].data.sourceNodeId === 'node_src_001', 'second edge data.sourceNodeId matches source');

  // Other fields still intact
  assert(edges[0].source === 'node_src_001', 'source still correct');
  assert(edges[0].target === 'node_tgt_002', 'target still correct');
  assert(edges[0].data.nextEntryId === 'r1', 'nextEntryId still correct');
  assert(edges[0].data.sourceEntityType === 'common', 'sourceEntityType still common');
  assert(edges[0].data.requires.operator === 'and', 'requires still correct');
})();


group('buildEdgesFromChoice — Phase 7 additions (type + sourceNodeId)');

(() => {
  const choice = makeChoice({
    id: 'choice_src_001',
    options: [
      makeOption({
        id: 'opt_a',
        label: 'Go left',
        next: [makeNextEntry({ id: 'r1', target: 'node_dest_001' })],
      }),
      makeOption({
        id: 'opt_b',
        label: 'Go right',
        next: [makeNextEntry({ id: 'r2', target: 'ending_dest_001' })],
      }),
    ],
  });
  const edges = buildEdgesFromChoice(choice);

  // type: 'conditional' on all edges
  assert(edges[0].type === 'conditional', 'first choice edge has type: conditional');
  assert(edges[1].type === 'conditional', 'second choice edge has type: conditional');

  // sourceNodeId in data
  assert(edges[0].data.sourceNodeId === 'choice_src_001', 'first edge data.sourceNodeId matches choice');
  assert(edges[1].data.sourceNodeId === 'choice_src_001', 'second edge data.sourceNodeId matches choice');

  // Other fields still intact
  assert(edges[0].data.optionId === 'opt_a', 'optionId preserved');
  assert(edges[0].data.optionLabel === 'Go left', 'optionLabel preserved');
  assert(edges[1].data.optionId === 'opt_b', 'second edge optionId preserved');
  assert(edges[1].data.optionLabel === 'Go right', 'second edge optionLabel preserved');
  assert(edges[0].data.sourceEntityType === 'choice', 'sourceEntityType is choice');
})();


// ════════════════════════════════════════════════════════════
//  SECTION K — Edge ID Source Node Extraction (ConditionalEdge logic)
// ════════════════════════════════════════════════════════════

group('Edge ID Parsing — source node extraction for ConditionalEdge');

// Simulates the edge ID parsing from ConditionalEdge.jsx lines 82-85

function extractSourceNodeId(edgeId) {
  const parts = edgeId.split('-');
  return parts.length >= 2 ? parts[1] : null;
}

(() => {
  // Common node edge: edge-{sourceId}-{nextEntryId}
  assert(
    extractSourceNodeId('edge-node_src_001-r1') === 'node_src_001',
    'common edge → extracts source node ID'
  );

  // Choice edge: edge-{choiceId}-{optionId}-{nextEntryId}
  assert(
    extractSourceNodeId('edge-choice_src_001-opt_a-r1') === 'choice_src_001',
    'choice edge → extracts source choice ID'
  );

  // Edge case: malformed edge ID
  assert(
    extractSourceNodeId('edge') === null,
    'single part → null (not enough parts)'
  );

  assert(
    extractSourceNodeId('') === null,
    'empty string → null'
  );

  // Verify consistency: edge IDs from builders match extraction
  const node = makeCommonNode({
    id: 'node_verify_001',
    next: [makeNextEntry({ id: 'r1', target: 'node_t' })],
  });
  const edges = buildEdgesFromCommonNode(node);
  const extractedId = extractSourceNodeId(edges[0].id);
  assert(
    extractedId === 'node_verify_001',
    'extracted ID matches source entity ID from builder'
  );

  // Same for choice
  const choice = makeChoice({
    id: 'choice_verify_001',
    options: [makeOption({
      id: 'opt_v',
      next: [makeNextEntry({ id: 'rv', target: 'node_x' })],
    })],
  });
  const choiceEdges = buildEdgesFromChoice(choice);
  const extractedChoiceId = extractSourceNodeId(choiceEdges[0].id);
  assert(
    extractedChoiceId === 'choice_verify_001',
    'extracted choice ID matches source from builder'
  );
})();


// ════════════════════════════════════════════════════════════
//  SECTION L — Data Integrity: Edge data matches Plan §4
// ════════════════════════════════════════════════════════════

group('Data Integrity — edge data shape matches Plan §4 NextEntry');

(() => {
  const condGroup = {
    operator: 'or',
    conditions: [{ id: 'c1', flag: 'F001', state: true }],
  };

  // Common node edge — data.requires is a ConditionGroup (AR-03)
  const node = makeCommonNode({
    id: 'node_di',
    next: [makeNextEntry({ id: 'r1', target: 'node_b', requires: condGroup })],
  });
  const edges = buildEdgesFromCommonNode(node);

  assert(edges[0].data.requires.operator === 'or', 'edge data.requires.operator preserved (AR-03)');
  assert(Array.isArray(edges[0].data.requires.conditions), 'data.requires.conditions is array (AR-03)');
  assert(edges[0].data.requires.conditions.length === 1, 'data.requires.conditions has 1 condition');
  assert(edges[0].data.requires.conditions[0].flag === 'F001', 'condition flag reference preserved');

  // Default requires is { operator: "and", conditions: [] } (AR-05)
  const node2 = makeCommonNode({
    id: 'node_di2',
    next: [makeNextEntry({ id: 'r2', target: 'node_c' })],
  });
  const edges2 = buildEdgesFromCommonNode(node2);

  assert(edges2[0].data.requires.operator === 'and', 'default requires.operator is "and" (AR-03)');
  assert(edges2[0].data.requires.conditions.length === 0, 'default requires.conditions is [] (AR-05)');
})();


// ════════════════════════════════════════════════════════════
//  SECTION M — Data Integrity: Renderer data access patterns
// ════════════════════════════════════════════════════════════

group('Data Integrity — renderer data access patterns');

// Tests that the entity data accessed by renderers matches Plan §4 field shapes.

(() => {
  // CommonNode: flags_set is string[] (AR-05)
  const commonNode = makeCommonNode({
    flags_set: ['F001', 'F002'],
    status_set: [{ status: 'SP001', amount: 5 }],
  });
  assert(Array.isArray(commonNode.flags_set), 'flags_set is array');
  assert(commonNode.flags_set.length === 2, 'flags_set has 2 items');
  assert(typeof commonNode.flags_set[0] === 'string', 'flags_set items are strings');

  // CommonNode: status_set is StatusDelta[] (AR-05)
  assert(Array.isArray(commonNode.status_set), 'status_set is array');
  assert(commonNode.status_set[0].status === 'SP001', 'status_set[0].status is string');
  assert(commonNode.status_set[0].amount === 5, 'status_set[0].amount is number');

  // CommonNode: next is NextEntry[] (AR-04)
  const nodeWithNext = makeCommonNode({
    next: [makeNextEntry({ id: 'r1', target: 'node_b' })],
  });
  assert(Array.isArray(nodeWithNext.next), 'next is array (AR-04)');
  assert(typeof nodeWithNext.next[0].id === 'string', 'next[0].id is string');
  assert(typeof nodeWithNext.next[0].target === 'string', 'next[0].target is string');
  assert(typeof nodeWithNext.next[0].requires === 'object', 'next[0].requires is object (AR-03)');

  // Choice: options is Option[] (AR-05)
  const choice = makeChoice({
    options: [makeOption({ id: 'opt1', label: 'Go' })],
  });
  assert(Array.isArray(choice.options), 'options is array (AR-05)');
  assert(typeof choice.options[0].label === 'string', 'options[0].label is string');

  // Choice: requires is ConditionGroup (AR-03)
  assert(typeof choice.requires === 'object', 'choice.requires is object');
  assert(choice.requires.operator === 'and', 'choice.requires.operator defaults to "and"');
  assert(Array.isArray(choice.requires.conditions), 'choice.requires.conditions is array');

  // Ending: requires is ConditionGroup (AR-03)
  const ending = makeEnding({
    requires: { operator: 'or', conditions: [{ id: 'c1', flag: 'F001', state: true }] },
  });
  assert(ending.requires.operator === 'or', 'ending.requires.operator preserved');
  assert(ending.requires.conditions.length === 1, 'ending.requires.conditions has items');

  // Ending: type field
  const endingTyped = makeEnding({ type: 'bad_end' });
  assert(endingTyped.type === 'bad_end', 'ending type field preserved');

  const endingNoType = makeEnding({ type: null });
  assert(endingNoType.type === null, 'ending type can be null');
})();


// ════════════════════════════════════════════════════════════
//  SECTION N — Edge Cases: Empty/null entity fields
// ════════════════════════════════════════════════════════════

group('Edge Cases — empty/null entity fields accessed by renderers');

(() => {
  // CommonNode with all empty/null optional fields
  const minimal = makeCommonNode({
    name: '',
    type: null,
    chapter: null,
    path: null,
    flags_set: [],
    status_set: [],
    next: [],
  });
  assert(minimal.name === '', 'empty name is valid');
  assert(minimal.type === null, 'null type is valid');
  assert(minimal.flags_set.length === 0, 'empty flags_set');
  assert(minimal.status_set.length === 0, 'empty status_set');
  assert(minimal.next.length === 0, 'empty next');

  // Choice with empty text and no options
  const minChoice = makeChoice({ text: '', options: [] });
  assert(minChoice.text === '', 'empty text is valid');
  assert(minChoice.options.length === 0, 'empty options');

  // Ending with empty name and null type
  const minEnding = makeEnding({ name: '', type: null });
  assert(minEnding.name === '', 'empty ending name');
  assert(minEnding.type === null, 'null ending type');

  // resolveTagNames with null maps
  // (This would throw in the real renderer, but testing the function itself)
  const r = resolveTagNames(null, null, {}, {});
  assert(r.chapterName === null, 'null + empty maps → null');
  assert(r.pathName === null, 'null + empty maps → null');
})();


// ════════════════════════════════════════════════════════════
//  SECTION O — Failure Cases
// ════════════════════════════════════════════════════════════

group('Failure Cases — defensive behavior');

(() => {
  // buildEdgesFromCommonNode with missing next (should throw)
  let threw = false;
  try {
    buildEdgesFromCommonNode({ id: 'node_no_next' });
  } catch {
    threw = true;
  }
  assert(threw, 'buildEdgesFromCommonNode throws when next is missing');

  // buildEdgesFromChoice with missing options (should throw)
  let threw2 = false;
  try {
    buildEdgesFromChoice({ id: 'ch_no_opts' });
  } catch {
    threw2 = true;
  }
  assert(threw2, 'buildEdgesFromChoice throws when options is missing');

  // getEdgeStateClass never throws, even with garbage input
  let threw3 = false;
  try {
    getEdgeStateClass(undefined, undefined);
    getEdgeStateClass(null, null);
    getEdgeStateClass({}, []);
    getEdgeStateClass('garbage', 42);
  } catch {
    threw3 = true;
  }
  assert(!threw3, 'getEdgeStateClass never throws regardless of input types');
})();


// ════════════════════════════════════════════════════════════
//  SECTION P — Full Integration: edge data roundtrip
// ════════════════════════════════════════════════════════════

group('Full Integration — edge data roundtrip: builder → ID parse → state class');

(() => {
  // Build a common node edge
  const node = makeCommonNode({
    id: 'node_int_001',
    next: [makeNextEntry({ id: 'r1', target: 'node_int_002' })],
  });
  const edges = buildEdgesFromCommonNode(node);
  const edge = edges[0];

  // Step 1: Verify built edge shape
  assert(edge.type === 'conditional', 'edge type is conditional');
  assert(edge.data.sourceNodeId === 'node_int_001', 'data.sourceNodeId set');

  // Step 2: Parse source ID from edge ID (as ConditionalEdge does)
  const parsedSourceId = extractSourceNodeId(edge.id);
  assert(parsedSourceId === 'node_int_001', 'parsed source matches');
  assert(parsedSourceId === edge.data.sourceNodeId, 'parsed source matches data.sourceNodeId');

  // Step 3: Simulate state class computation
  // Scenario: source is active, no eval result → glow
  const class1 = getEdgeStateClass(undefined, true);
  assert(class1 === 'conditional-edge__path--glow', 'active source + no eval → glow');

  // Scenario: source active, eval false → fail
  const class2 = getEdgeStateClass(false, true);
  assert(class2 === 'conditional-edge__path--fail', 'active source + fail eval → fail');

  // Scenario: source inactive, eval true → pass
  const class3 = getEdgeStateClass(true, false);
  assert(class3 === 'conditional-edge__path--pass', 'inactive source + pass eval → pass');
})();


// ════════════════════════════════════════════════════════════
//  SUMMARY
// ════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(60)}`);
console.log(`  SUMMARY: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));

if (failed > 0) {
  process.exit(1);
}
