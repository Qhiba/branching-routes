/**
 * test_phase_03.js — Phase 03 Logic Tests
 * Tests pure logic extracted from GraphCanvas, StoryNode, ConditionalEdge.
 * No React, no DOM, no test framework — plain Node.js.
 * Run: npx vite-node tests/test_phase_03.js
 */

let passed = 0;
let failed = 0;

function assert(description, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.log(`[FAIL] ${description}`);
    console.log(`       expected: ${JSON.stringify(expected)}`);
    console.log(`       received: ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertTruthy(description, value) {
  if (value) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.log(`[FAIL] ${description}`);
    console.log(`       expected truthy, got: ${JSON.stringify(value)}`);
    failed++;
  }
}

function assertFalsy(description, value) {
  if (!value) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.log(`[FAIL] ${description}`);
    console.log(`       expected falsy, got: ${JSON.stringify(value)}`);
    failed++;
  }
}

// ===========================================================================
// PURE LOGIC REPLICATED FROM COMPONENTS (no React imports needed)
// ===========================================================================

/** Mirrors GraphCanvas.jsx: derivedNodes mapping */
function deriveNodes(storeNodes, selectedNodeId) {
  return storeNodes.map(node => ({
    id: node.id,
    type: node.type === 'ending' ? 'ending' : 'storyNode',
    position: node.position,
    selected: node.id === selectedNodeId,
    data: {
      ...node.data,
      isEndNode: node.type === 'ending',
    },
  }));
}

/** Mirrors GraphCanvas.jsx: reactFlowEdges mapping */
function deriveEdges(storeEdges, selectedEdgeId) {
  return storeEdges.map(edge => ({
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    type: 'conditionalEdge',
    selected: edge.id === selectedEdgeId,
    data: {
      label: edge.label,
      condition: edge.condition,
      sideEffects: edge.sideEffects,
    },
  }));
}

/** Mirrors StoryNode.jsx: className derivation */
function storyNodeClassName({ isActive, isVisited, isReachable }) {
  let className = 'story-node';
  if (isActive) className += ' story-node--active';
  else if (isVisited) className += ' story-node--visited';
  else if (isReachable) className += ' story-node--reachable';
  return className;
}

/** Mirrors ConditionalEdge.jsx: className derivation */
function conditionalEdgeClassName({ isTraversed, isReachable }) {
  let className = 'conditional-edge';
  if (isTraversed) className += ' conditional-edge--traversed';
  else if (isReachable) className += ' conditional-edge--reachable';
  return className;
}

/** Mirrors GraphCanvas.jsx: double-click detection within 300ms */
function isDoubleClick(lastClickTime, now, threshold = 300) {
  return (now - lastClickTime) < threshold;
}

// ===========================================================================
// FIXTURES
// ===========================================================================

const commonNode = {
  id: 'node-1',
  type: 'common',
  position: { x: 100, y: 200 },
  data: { label: 'Scene 1', content: 'Some text', isStartNode: true, sideEffects: [] }
};

const endingNode = {
  id: 'node-2',
  type: 'ending',
  position: { x: 400, y: 200 },
  data: { label: 'The End', content: '', isStartNode: false, sideEffects: [] }
};

const storeEdge = {
  id: 'edge-1',
  sourceId: 'node-1',
  targetId: 'node-2',
  label: 'Go forward',
  condition: { operator: 'AND', clauses: [] },
  sideEffects: []
};

// ===========================================================================
// NODE TRANSFORMATION TESTS
// ===========================================================================
console.log('\n--- deriveNodes ---');

assert(
  'common node maps to storyNode type',
  deriveNodes([commonNode], null)[0].type,
  'storyNode'
);

assert(
  'ending node maps to ending type',
  deriveNodes([endingNode], null)[0].type,
  'ending'
);

assert(
  'ending node sets isEndNode: true in data',
  deriveNodes([endingNode], null)[0].data.isEndNode,
  true
);

assert(
  'common node sets isEndNode: false in data',
  deriveNodes([commonNode], null)[0].data.isEndNode,
  false
);

assert(
  'selected node gets selected: true',
  deriveNodes([commonNode], 'node-1')[0].selected,
  true
);

assert(
  'non-selected node gets selected: false',
  deriveNodes([commonNode], 'node-999')[0].selected,
  false
);

assert(
  'node position is preserved exactly',
  deriveNodes([commonNode], null)[0].position,
  { x: 100, y: 200 }
);

assert(
  'node data fields are spread through (label)',
  deriveNodes([commonNode], null)[0].data.label,
  'Scene 1'
);

assert(
  'empty storeNodes returns empty array (edge case)',
  deriveNodes([], null),
  []
);

// ===========================================================================
// EDGE TRANSFORMATION TESTS
// ===========================================================================
console.log('\n--- deriveEdges ---');

assert(
  'edge sourceId maps to source field',
  deriveEdges([storeEdge], null)[0].source,
  'node-1'
);

assert(
  'edge targetId maps to target field',
  deriveEdges([storeEdge], null)[0].target,
  'node-2'
);

assert(
  'edge type is always conditionalEdge',
  deriveEdges([storeEdge], null)[0].type,
  'conditionalEdge'
);

assert(
  'selected edge gets selected: true',
  deriveEdges([storeEdge], 'edge-1')[0].selected,
  true
);

assert(
  'non-selected edge gets selected: false',
  deriveEdges([storeEdge], 'edge-999')[0].selected,
  false
);

assert(
  'edge condition is preserved in data',
  deriveEdges([storeEdge], null)[0].data.condition,
  { operator: 'AND', clauses: [] }
);

assert(
  'edge with null condition preserves null',
  deriveEdges([{ ...storeEdge, condition: null }], null)[0].data.condition,
  null
);

assert(
  'empty storeEdges returns empty array (edge case)',
  deriveEdges([], null),
  []
);

// ===========================================================================
// STORYNODE CLASSNAME TESTS
// ===========================================================================
console.log('\n--- StoryNode className derivation ---');

assert(
  'default state gives base class only',
  storyNodeClassName({ isActive: false, isVisited: false, isReachable: false }),
  'story-node'
);

assert(
  'active state applies --active modifier',
  storyNodeClassName({ isActive: true, isVisited: false, isReachable: false }),
  'story-node story-node--active'
);

assert(
  'visited state applies --visited modifier',
  storyNodeClassName({ isActive: false, isVisited: true, isReachable: false }),
  'story-node story-node--visited'
);

assert(
  'reachable state applies --reachable modifier',
  storyNodeClassName({ isActive: false, isVisited: false, isReachable: true }),
  'story-node story-node--reachable'
);

assert(
  'active takes priority over visited (else-if chain)',
  storyNodeClassName({ isActive: true, isVisited: true, isReachable: true }),
  'story-node story-node--active'
);

assert(
  'visited takes priority over reachable (else-if chain)',
  storyNodeClassName({ isActive: false, isVisited: true, isReachable: true }),
  'story-node story-node--visited'
);

// ===========================================================================
// CONDITIONALEDGE CLASSNAME TESTS
// ===========================================================================
console.log('\n--- ConditionalEdge className derivation ---');

assert(
  'default state gives base class only',
  conditionalEdgeClassName({ isTraversed: false, isReachable: false }),
  'conditional-edge'
);

assert(
  'traversed state applies --traversed modifier',
  conditionalEdgeClassName({ isTraversed: true, isReachable: false }),
  'conditional-edge conditional-edge--traversed'
);

assert(
  'reachable state applies --reachable modifier',
  conditionalEdgeClassName({ isTraversed: false, isReachable: true }),
  'conditional-edge conditional-edge--reachable'
);

assert(
  'traversed takes priority over reachable (else-if chain)',
  conditionalEdgeClassName({ isTraversed: true, isReachable: true }),
  'conditional-edge conditional-edge--traversed'
);

// ===========================================================================
// DOUBLE-CLICK DETECTION TESTS
// ===========================================================================
console.log('\n--- Double-click timing detection ---');

assertTruthy(
  'two clicks within 300ms counts as double-click (happy path)',
  isDoubleClick(1000, 1200)
);

assertFalsy(
  'two clicks exactly 300ms apart is NOT a double-click (boundary)',
  isDoubleClick(1000, 1300)
);

assertFalsy(
  'two clicks 500ms apart is NOT a double-click',
  isDoubleClick(1000, 1500)
);

assertTruthy(
  'two clicks 50ms apart is a double-click (fast click)',
  isDoubleClick(1000, 1050)
);

assertFalsy(
  'lastClickTime of 0 with now=5000 is not a double-click (first click after fresh load)',
  isDoubleClick(0, 5000)
);

// ===========================================================================
// DATA MODEL INTEGRITY TESTS
// ===========================================================================
console.log('\n--- Data model integrity (RF shape vs data model) ---');

const rfNode = deriveNodes([commonNode], null)[0];
assertTruthy('derived node has id field', 'id' in rfNode);
assertTruthy('derived node has type field', 'type' in rfNode);
assertTruthy('derived node has position field', 'position' in rfNode);
assertTruthy('derived node has data field', 'data' in rfNode);
assertTruthy('derived node has selected field', 'selected' in rfNode);
assertTruthy('derived node data has label', 'label' in rfNode.data);
assertTruthy('derived node data has isEndNode', 'isEndNode' in rfNode.data);

const rfEdge = deriveEdges([storeEdge], null)[0];
assertTruthy('derived edge has id field', 'id' in rfEdge);
assertTruthy('derived edge has source field', 'source' in rfEdge);
assertTruthy('derived edge has target field', 'target' in rfEdge);
assertTruthy('derived edge has type field', 'type' in rfEdge);
assertTruthy('derived edge has data field', 'data' in rfEdge);
assertTruthy('derived edge data has condition', 'condition' in rfEdge.data);
assertTruthy('derived edge data has sideEffects', 'sideEffects' in rfEdge.data);

// ===========================================================================
// SUMMARY
// ===========================================================================
console.log(`\n=== SUMMARY ===`);
console.log(`Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
